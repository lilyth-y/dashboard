import { describe, it, expect } from 'vitest';

describe('GET /api/projects/:id/milestones', () => {
  it('should return 401 without authentication', async () => {
    const res = await fetch('http://localhost:3000/api/projects/proj-1/milestones');
    const data = await res.json();

    expect(res.status).toBe(401);
    expect(data.error).toBe('인증이 필요합니다.');
  });

  it('should return milestones for authenticated user', async () => {
    const res = await fetch('http://localhost:3000/api/projects/proj-1/milestones', {
      headers: { authorization: 'Bearer mock-token' },
    });
    const data = await res.json();

    expect(res.status).toBe(200);
    expect(Array.isArray(data.milestones)).toBe(true);
    expect(data.milestones.length).toBeGreaterThan(0);
    expect(data.milestones[0]).toHaveProperty('id');
    expect(data.milestones[0]).toHaveProperty('title');
    expect(data.milestones[0]).toHaveProperty('status');
  });
});

describe('POST /api/projects/:id/milestones', () => {
  it('should return 401 without authentication', async () => {
    const res = await fetch('http://localhost:3000/api/projects/proj-1/milestones', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ title: 'M1', dueDate: '2025-02-01' }),
    });
    const data = await res.json();

    expect(res.status).toBe(401);
    expect(data.error).toBe('인증이 필요합니다.');
  });

  it('should return 403 when user lacks permission for project', async () => {
    const res = await fetch('http://localhost:3000/api/projects/forbidden-proj/milestones', {
      method: 'POST',
      headers: { authorization: 'Bearer mock-token', 'Content-Type': 'application/json' },
      body: JSON.stringify({ title: 'M1', dueDate: '2025-02-01' }),
    });
    const data = await res.json();

    expect(res.status).toBe(403);
    expect(data.error).toBe('권한이 없습니다.');
  });

  it('should return 400 when required fields missing', async () => {
    const res = await fetch('http://localhost:3000/api/projects/proj-1/milestones', {
      method: 'POST',
      headers: { authorization: 'Bearer mock-token', 'Content-Type': 'application/json' },
      body: JSON.stringify({ description: 'No title/date' }),
    });
    const data = await res.json();

    expect(res.status).toBe(400);
    expect(data.error).toBe('제목과 마감일은 필수입니다.');
  });

  it('should create milestone successfully with valid data', async () => {
    const res = await fetch('http://localhost:3000/api/projects/proj-1/milestones', {
      method: 'POST',
      headers: { authorization: 'Bearer mock-token', 'Content-Type': 'application/json' },
      body: JSON.stringify({ title: 'M1', dueDate: '2025-02-01' }),
    });
    const data = await res.json();

    expect(res.status).toBe(201);
    expect(data.id).toBeDefined();
  });
});

describe('PUT /api/milestones/:id', () => {
  it('should return 401 without authentication', async () => {
    const res = await fetch('http://localhost:3000/api/milestones/ms-1', { method: 'PUT' });
    const data = await res.json();

    expect(res.status).toBe(401);
    expect(data.error).toBe('인증이 필요합니다.');
  });

  it('should return 403 when user lacks permission', async () => {
    const res = await fetch('http://localhost:3000/api/milestones/forbidden-milestone', {
      method: 'PUT',
      headers: { authorization: 'Bearer mock-token', 'Content-Type': 'application/json' },
      body: JSON.stringify({ title: 'Updated' }),
    });
    const data = await res.json();

    expect(res.status).toBe(403);
    expect(data.error).toBe('권한이 없습니다.');
  });

  it('should update milestone successfully', async () => {
    const res = await fetch('http://localhost:3000/api/milestones/ms-1', {
      method: 'PUT',
      headers: { authorization: 'Bearer mock-token', 'Content-Type': 'application/json' },
      body: JSON.stringify({ title: 'Updated' }),
    });
    const data = await res.json();

    expect(res.status).toBe(200);
    expect(data.ok).toBe(true);
  });
});

describe('DELETE /api/milestones/:id', () => {
  it('should return 401 without authentication', async () => {
    const res = await fetch('http://localhost:3000/api/milestones/ms-1', { method: 'DELETE' });
    const data = await res.json();

    expect(res.status).toBe(401);
    expect(data.error).toBe('인증이 필요합니다.');
  });

  it('should return 403 when user lacks permission', async () => {
    const res = await fetch('http://localhost:3000/api/milestones/forbidden-milestone', {
      method: 'DELETE',
      headers: { authorization: 'Bearer mock-token' },
    });
    const data = await res.json();

    expect(res.status).toBe(403);
    expect(data.error).toBe('권한이 없습니다.');
  });

  it('should delete milestone successfully', async () => {
    const res = await fetch('http://localhost:3000/api/milestones/ms-1', {
      method: 'DELETE',
      headers: { authorization: 'Bearer mock-token' },
    });
    const data = await res.json();

    expect(res.status).toBe(200);
    expect(data.ok).toBe(true);
  });
});
