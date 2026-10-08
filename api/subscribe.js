const MAILERLITE_API_URL = 'https://connect.mailerlite.com/api/subscribers';

function json(body, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { 'Content-Type': 'application/json; charset=utf-8' },
  });
}

export default async function handler(request) {
  if (request.method !== 'POST') return json({ ok: false, error: 'Method not allowed.' }, 405);

  const token = process.env.MAILERLITE_API_TOKEN;
  const groupId = process.env.MAILERLITE_GROUP_ID;
  if (!token || !groupId) return json({ ok: false, error: 'Email delivery is not configured yet.' }, 503);

  let payload;
  try {
    payload = await request.json();
  } catch {
    return json({ ok: false, error: 'Invalid request.' }, 400);
  }

  const email = typeof payload.email === 'string' ? payload.email.trim().toLowerCase() : '';
  const name = typeof payload.name === 'string' ? payload.name.trim().slice(0, 80) : '';
  if (!/^\S+@\S+\.\S{2,}$/.test(email)) {
    return json({ ok: false, error: 'Please enter a valid email address.' }, 400);
  }

  const response = await fetch(MAILERLITE_API_URL, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
      Accept: 'application/json',
    },
    body: JSON.stringify({
      email,
      fields: name ? { name } : {},
      groups: [groupId],
    }),
  });

  if (!response.ok) {
    const details = await response.text();
    console.error('MailerLite subscribe failed', response.status, details);
    return json({ ok: false, error: 'We could not complete the signup. Please try again.' }, 502);
  }

  return json({ ok: true });
}
