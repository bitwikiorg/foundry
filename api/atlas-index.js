export default async function handler(req, res) {
  if (req.method !== 'GET') {
    res.setHeader('Allow', 'GET');
    return res.status(405).json({ ok: false, message: 'Method not allowed.' });
  }

  try {
    const upstream = await fetch('https://raw.githubusercontent.com/bitwikiorg/atlas/main/index.json', {
      headers: { 'user-agent': 'BITwiki-Foundry' }
    });
    if (!upstream.ok) {
      return res.status(502).json({ ok: false, message: 'Atlas registry is unavailable.' });
    }
    const data = await upstream.json();
    res.setHeader('Cache-Control', 'public, s-maxage=30, stale-while-revalidate=300');
    return res.status(200).json(data);
  } catch {
    return res.status(502).json({ ok: false, message: 'Atlas registry is unavailable.' });
  }
}
