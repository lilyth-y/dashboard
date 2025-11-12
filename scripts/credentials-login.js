/* eslint-disable @typescript-eslint/no-require-imports */
const http = require('http');
const https = require('https');
const { URLSearchParams } = require('url');

function fetchWithCookies(url, options = {}, jar = {}) {
  return new Promise((resolve, reject) => {
    const u = new URL(url);
    const lib = u.protocol === 'https:' ? https : http;
    const req = lib.request({
      method: options.method || 'GET',
      hostname: u.hostname,
      port: u.port,
      path: u.pathname + u.search,
      headers: {
        ...(options.headers || {}),
        ...(jar.cookie ? { Cookie: jar.cookie } : {}),
      },
    }, res => {
      const chunks = [];
      res.on('data', d => chunks.push(d));
      res.on('end', () => {
        const body = Buffer.concat(chunks).toString('utf8');
        const setCookie = res.headers['set-cookie'];
        if (setCookie) {
          jar.cookie = (jar.cookie ? jar.cookie + '; ' : '') + setCookie.map(c => c.split(';')[0]).join('; ');
        }
        resolve({ status: res.statusCode, headers: res.headers, body, jar });
      });
    });
    req.on('error', reject);
    if (options.body) req.write(options.body);
    req.end();
  });
}

(async () => {
  const base = 'http://localhost:3051';
  const jar = {};
  try {
    const csrfRes = await fetchWithCookies(base + '/api/auth/csrf', {}, jar);
    const data = JSON.parse(csrfRes.body);
    console.log('csrf:', data.csrfToken);
    const params = new URLSearchParams();
    params.set('csrfToken', data.csrfToken);
    params.set('email', 'user@example.com');
    params.set('password', 'user123!');
    params.set('callbackUrl', base + '/dashboard');
    const loginRes = await fetchWithCookies(base + '/api/auth/callback/credentials', {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: params.toString(),
    }, jar);
    console.log('login status:', loginRes.status);
    console.log('location:', loginRes.headers.location);
    console.log('cookies:', jar.cookie);
  } catch (e) {
    console.error('Error:', e);
  }
})();
