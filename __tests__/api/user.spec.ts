import { describe, it, expect } from 'vitest';

describe('GET /api/user', () => {
  it('should return 401 without authentication', async () => {
    const res = await fetch('http://localhost:3000/api/user');
    const data = await res.json();

    expect(res.status).toBe(401);
    expect(data.error).toBe('인증이 필요합니다.');
  });

  it('should return user when authenticated', async () => {
    const res = await fetch('http://localhost:3000/api/user', {
      headers: { authorization: 'Bearer mock-token' },
    });
    const data = await res.json();

    expect(res.status).toBe(200);
    expect(data.user).toBeDefined();
    expect(data.user).toHaveProperty('id');
    expect(data.user).toHaveProperty('email');
  });
});

describe('PUT /api/user', () => {
  it('should return 401 without authentication', async () => {
    const res = await fetch('http://localhost:3000/api/user', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name: 'Updated Name' }),
    });
    const data = await res.json();

    expect(res.status).toBe(401);
    expect(data.error).toBe('인증이 필요합니다.');
  });

  it('should update user successfully when authenticated', async () => {
    const res = await fetch('http://localhost:3000/api/user', {
      method: 'PUT',
      headers: { authorization: 'Bearer mock-token', 'Content-Type': 'application/json' },
      body: JSON.stringify({ name: 'Updated Name' }),
    });
    const data = await res.json();

    expect(res.status).toBe(200);
    expect(data.id).toBeDefined();
  });
});
