import type { VercelRequest, VercelResponse } from '@vercel/node';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  const body = await new Promise<string>((resolve) => {
    let data = '';
    req.on('data', chunk => data += chunk);
    req.on('end', () => resolve(data));
  });

  const response = await fetch(
    `https://www.google-analytics.com/g/collect?${req.url?.split('?')[1] || ''}`,
    {
      method: req.method || 'POST',
      headers: { 'Content-Type': 'text/plain' },
      body: body || undefined,
    }
  );

  res.status(response.status).end();
}
