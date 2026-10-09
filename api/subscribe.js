const MAILERLITE_API_URL = 'https://connect.mailerlite.com/api/subscribers';

function send(res, status, body) {
  res.status(status).json(body);
}

module.exports = async function handler(req, res) {
  if (req.method !== 'POST') return send(res, 405, { ok: false, error: 'Method not allowed.' });

  const token = process.env.MAILERLITE_API_TOKEN;
  const groupId = process.env.MAILERLITE_GROUP_ID;
  if (!token || !groupId) return send(res, 503, { ok: false, error: 'Email delivery is not configured yet.' });

  let payload = req.body || {};
  if (typeof payload === 'string') {
    try { payload = JSON.parse(payload); } catch { return send(res, 400, { ok: false, error: 'Invalid request.' }); }
  }

  const email = typeof payload.email === 'string' ? payload.email.trim().toLowerCase() : '';
  const name = typeof payload.name === 'string' ? payload.name.trim().slice(0, 80) : '';
  if (!/^\S+@\S+\.\S{2,}$/.test(email)) {
    return send(res, 400, { ok: false, error: 'Please enter a valid email address.' });
  }

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 10000);
  let response;
  try {
    response = await fetch(MAILERLITE_API_URL, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json',
        Accept: 'application/json',
      },
      body: JSON.stringify({ email, fields: name ? { name } : {}, groups: [groupId] }),
      signal: controller.signal,
    });
  } catch (error) {
    console.error('MailerLite request failed', error);
    return send(res, 502, { ok: false, error: 'Email service is unavailable. Please try again.' });
  } finally {
    clearTimeout(timeout);
  }

  if (!response.ok) {
    const details = await response.text();
    console.error('MailerLite subscribe failed', response.status, details);
    return send(res, 502, { ok: false, error: 'We could not complete the signup. Please try again.' });
  }

  return send(res, 200, { ok: true });
};
