import { describe, it, expect } from 'vitest';

describe('PUT /api/tasks/[id]', () => {
  it('should return 401 without authentication', async () => {
    const response = await fetch('http://localhost:3000/api/tasks/task-1', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ title: 'Updated Title' }),
    });
    const data = await response.json();

    expect(response.status).toBe(401);
    expect(data.error).toBe('인증이 필요합니다.');
  });

  it('should return 403 when user lacks permission', async () => {
    const response = await fetch('http://localhost:3000/api/tasks/forbidden-task', {
      method: 'PUT',
      headers: {
        authorization: 'Bearer mock-token',
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ title: 'Updated Title' }),
    });
    const data = await response.json();

    expect(response.status).toBe(403);
    expect(data.error).toBe('권한이 없습니다.');
  });

  it('should update task successfully with valid permission', async () => {
    const response = await fetch('http://localhost:3000/api/tasks/task-1', {
      method: 'PUT',
      headers: {
        authorization: 'Bearer mock-token',
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        title: 'Updated Task Title',
        status: 'IN_PROGRESS',
        priority: 'HIGH',
      }),
    });
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.ok).toBe(true);
  });
});

describe('DELETE /api/tasks/[id]', () => {
  it('should return 401 without authentication', async () => {
    const response = await fetch('http://localhost:3000/api/tasks/task-1', {
      method: 'DELETE',
    });
    const data = await response.json();

    expect(response.status).toBe(401);
    expect(data.error).toBe('인증이 필요합니다.');
  });

  it('should return 403 when user lacks permission', async () => {
    const response = await fetch('http://localhost:3000/api/tasks/forbidden-task', {
      method: 'DELETE',
      headers: {
        authorization: 'Bearer mock-token',
      },
    });
    const data = await response.json();

    expect(response.status).toBe(403);
    expect(data.error).toBe('권한이 없습니다.');
  });

  it('should delete task successfully with valid permission', async () => {
    const response = await fetch('http://localhost:3000/api/tasks/task-1', {
      method: 'DELETE',
      headers: {
        authorization: 'Bearer mock-token',
      },
    });
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.ok).toBe(true);
  });
});
