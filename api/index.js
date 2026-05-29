import app from '../server/app.js';

// Matikan body parser bawaan Vercel agar kita bisa baca raw stream
// Tanpa ini, req.on('data') tidak pernah fire karena body sudah di-consume Vercel
export const config = {
  api: {
    bodyParser: false,
  },
};

// Vercel Serverless Function handler: Node IncomingMessage → Web Fetch API → Hono
export default async function handler(req, res) {
  // 1. Build full URL
  const proto = req.headers['x-forwarded-proto'] || 'https';
  const host = req.headers['x-forwarded-host'] || req.headers.host;
  const url = `${proto}://${host}${req.url}`;

  // 2. Convert headers
  const headers = new Headers();
  for (const [key, value] of Object.entries(req.headers)) {
    if (value == null) continue;
    headers.set(key, Array.isArray(value) ? value.join(', ') : value);
  }

  // 3. Read body as raw Buffer (bodyParser: false → stream is intact)
  let bodyBuffer = null;
  if (req.method !== 'GET' && req.method !== 'HEAD') {
    bodyBuffer = await new Promise((resolve, reject) => {
      const chunks = [];
      req.on('data', (chunk) => chunks.push(chunk));
      req.on('end', () => resolve(Buffer.concat(chunks)));
      req.on('error', reject);
    });
  }

  // 4. Create Web Request for Hono
  const webReq = new Request(url, {
    method: req.method,
    headers,
    body: bodyBuffer && bodyBuffer.length > 0 ? bodyBuffer : undefined,
  });

  // 5. Jalankan Hono
  const webRes = await app.fetch(webReq);

  // 6. Convert Web Response → Node ServerResponse
  res.status(webRes.status);
  webRes.headers.forEach((value, key) => {
    // Hindari setting header yang tidak valid di Node
    if (key.toLowerCase() !== 'content-encoding') {
      res.setHeader(key, value);
    }
  });

  const responseBody = await webRes.arrayBuffer();
  res.end(Buffer.from(responseBody));
}
