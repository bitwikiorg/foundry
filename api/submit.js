function sendJson(res, status, body) {
  res.setHeader('Cache-Control', 'no-store');
  return res.status(status).json(body);
}

function getSubmissionEndpoint() {
  const value = String(process.env.SUBMISSION_WEBHOOK_URL || '').trim();
  if (!value) return null;

  try {
    const url = new URL(value);
    if (url.protocol !== 'https:') return null;
    return url.toString();
  } catch {
    return null;
  }
}

export default async function handler(req, res) {
  const endpoint = getSubmissionEndpoint();

  if (req.method === 'GET') {
    return sendJson(res, 200, {
      ok: true,
      configured: Boolean(endpoint)
    });
  }

  if (req.method !== 'POST') {
    res.setHeader('Allow', 'GET, POST');
    return sendJson(res, 405, { ok: false, message: 'Method not allowed.' });
  }

  const body = req.body || {};
  const email = String(body.email || '').trim().toLowerCase();
  const repoUrl = String(body.repo_url || '').trim();

  if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    return sendJson(res, 400, { ok: false, message: 'A valid email is required.' });
  }

  let parsed;
  try {
    parsed = new URL(repoUrl);
  } catch {
    return sendJson(res, 400, { ok: false, message: 'A valid GitHub repository URL is required.' });
  }

  const parts = parsed.pathname.split('/').filter(Boolean);
  if (parsed.protocol !== 'https:' || parsed.hostname.toLowerCase() !== 'github.com' || parts.length < 2) {
    return sendJson(res, 400, { ok: false, message: 'Public GitHub repositories only.' });
  }

  if (!endpoint) {
    res.setHeader('Retry-After', '300');
    return sendJson(res, 503, {
      ok: false,
      code: 'INTAKE_NOT_CONFIGURED',
      message: 'Submission intake is temporarily unavailable. Your details were not stored.'
    });
  }

  const payload = {
    source: 'foundry-homepage',
    submitted_at: new Date().toISOString(),
    email,
    repo_url: `https://github.com/${parts[0]}/${parts[1].replace(/\.git$/i, '')}`,
    status: 'submitted'
  };

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 10000);

  try {
    const headers = {
      'content-type': 'application/json',
      'user-agent': 'BITwiki-Foundry'
    };

    const secret = String(process.env.SUBMISSION_WEBHOOK_SECRET || '').trim();
    if (secret) headers.authorization = `Bearer ${secret}`;

    const upstream = await fetch(endpoint, {
      method: 'POST',
      headers,
      body: JSON.stringify(payload),
      signal: controller.signal
    });

    if (!upstream.ok) {
      console.error('Foundry intake rejected submission', {
        upstreamStatus: upstream.status,
        upstreamStatusText: upstream.statusText
      });
      return sendJson(res, 502, {
        ok: false,
        code: 'INTAKE_REJECTED',
        message: 'The intake service rejected the submission. Please try again later.'
      });
    }

    return sendJson(res, 202, { ok: true, status: 'submitted' });
  } catch (error) {
    console.error('Foundry intake request failed', {
      name: error?.name || 'Error',
      message: error?.message || String(error)
    });
    return sendJson(res, 502, {
      ok: false,
      code: error?.name === 'AbortError' ? 'INTAKE_TIMEOUT' : 'INTAKE_UNAVAILABLE',
      message: 'The intake service is temporarily unavailable.'
    });
  } finally {
    clearTimeout(timeout);
  }
}
