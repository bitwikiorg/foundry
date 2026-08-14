export default async function handler(req, res) {
  if (req.method !== 'POST') {
    res.setHeader('Allow', 'POST');
    return res.status(405).json({ ok: false, message: 'Method not allowed.' });
  }

  const body = req.body || {};
  const email = String(body.email || '').trim();
  const repoUrl = String(body.repo_url || '').trim();
  const indexingConsent = body.indexing_consent === true;
  const marketingConsent = body.marketing_consent === true;

  if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    return res.status(400).json({ ok: false, message: 'A valid email is required.' });
  }

  let parsed;
  try {
    parsed = new URL(repoUrl);
  } catch {
    return res.status(400).json({ ok: false, message: 'A valid GitHub repository URL is required.' });
  }

  const parts = parsed.pathname.split('/').filter(Boolean);
  if (parsed.protocol !== 'https:' || parsed.hostname.toLowerCase() !== 'github.com' || parts.length < 2) {
    return res.status(400).json({ ok: false, message: 'Public GitHub repositories only during alpha.' });
  }

  if (!indexingConsent) {
    return res.status(400).json({ ok: false, message: 'Public indexing consent is required.' });
  }

  const endpoint = process.env.SUBMISSION_WEBHOOK_URL;
  if (!endpoint) {
    return res.status(503).json({
      ok: false,
      code: 'INTAKE_NOT_CONFIGURED',
      message: 'Submission intake is not connected yet. Your details were not stored.'
    });
  }

  const payload = {
    source: 'foundry-homepage',
    submitted_at: new Date().toISOString(),
    email,
    repo_url: `https://github.com/${parts[0]}/${parts[1].replace(/\.git$/i, '')}`,
    indexing_consent: true,
    marketing_consent: marketingConsent,
    status: 'submitted'
  };

  try {
    const headers = { 'content-type': 'application/json', 'user-agent': 'BITwiki-Foundry' };
    if (process.env.SUBMISSION_WEBHOOK_SECRET) {
      headers['x-foundry-secret'] = process.env.SUBMISSION_WEBHOOK_SECRET;
    }
    const upstream = await fetch(endpoint, {
      method: 'POST',
      headers,
      body: JSON.stringify(payload)
    });
    if (!upstream.ok) {
      return res.status(502).json({ ok: false, message: 'The intake service rejected the submission. Please try again later.' });
    }
    return res.status(202).json({ ok: true, status: 'submitted' });
  } catch {
    return res.status(502).json({ ok: false, message: 'The intake service is temporarily unavailable.' });
  }
}
