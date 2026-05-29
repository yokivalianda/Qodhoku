import app from '../server/app.js';

// Vercel Serverless Function handler
// Hono app.fetch sudah kompatibel dengan Web Fetch API yang dipakai Vercel
export default async function handler(req, res) {
  // Convert Node IncomingMessage → Web Request
  const url = `https://${req.headers.host}${req.url}`;
  
  const headers = new Headers();
  for (const [key, value] of Object.entries(req.headers)) {
    if (value) headers.set(key, Array.isArray(value) ? value.join(', ') : value);
  }

  let body = undefined;
  if (req.method !== 'GET' && req.method !== 'HEAD') {
    body = await new Promise((resolve) => {
      const chunks = [];
      req.on('data', (chunk) => chunks.push(chunk));
      req.on('end', () => resolve(Buffer.concat(chunks)));
    });
  }

  const webReq = new Request(url, {
    method: req.method,
    headers,
    body: body && body.length > 0 ? body : undefined,
  });

  // Call Hono
  const webRes = await app.fetch(webReq);

  // Convert Web Response → Node ServerResponse
  res.status(webRes.status);
  webRes.headers.forEach((value, key) => {
    res.setHeader(key, value);
  });

  const responseBody = await webRes.arrayBuffer();
  res.end(Buffer.from(responseBody));
}
