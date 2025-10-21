import { describe, it, expect } from 'vitest';

describe('GET /api/projects', () => {
  it('should return 401 without authentication', async () => {
    const response = await fetch('http://localhost:3000/api/projects');
    const data = await response.json();

    expect(response.status).toBe(401);
    expect(data.error).toBe('인증이 필요합니다.');
  });

  it('should return projects list for authenticated user', async () => {
    const response = await fetch('http://localhost:3000/api/projects', {
      headers: {
        authorization: 'Bearer mock-token',
      },
    });
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.projects).toBeDefined();
    expect(Array.isArray(data.projects)).toBe(true);
    expect(data.projects.length).toBeGreaterThan(0);
    expect(data.projects[0]).toHaveProperty('id');
    expect(data.projects[0]).toHaveProperty('name');
    expect(data.projects[0]).toHaveProperty('myRole');
  });
});

describe('POST /api/projects', () => {
  it('should return 401 without authentication', async () => {
    const response = await fetch('http://localhost:3000/api/projects', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name: 'New Project' }),
    });
    const data = await response.json();

    expect(response.status).toBe(401);
    expect(data.error).toBe('인증이 필요합니다.');
  });

  it('should return 400 when name is missing', async () => {
    const response = await fetch('http://localhost:3000/api/projects', {
      method: 'POST',
      headers: {
        authorization: 'Bearer mock-token',
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ description: 'No name provided' }),
    });
    const data = await response.json();

    expect(response.status).toBe(400);
    expect(data.error).toBe('프로젝트 이름은 필수입니다.');
  });

  it('should return 400 when name is empty string', async () => {
    const response = await fetch('http://localhost:3000/api/projects', {
      method: 'POST',
      headers: {
        authorization: 'Bearer mock-token',
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ name: '   ' }),
    });
    const data = await response.json();

    expect(response.status).toBe(400);
    expect(data.error).toBe('프로젝트 이름은 필수입니다.');
  });

  it('should create project successfully with valid data', async () => {
    const response = await fetch('http://localhost:3000/api/projects', {
      method: 'POST',
      headers: {
        authorization: 'Bearer mock-token',
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        name: 'New Test Project',
        description: 'Test description',
        budget: 50000,
      }),
    });
    const data = await response.json();

    expect(response.status).toBe(201);
    expect(data.id).toBeDefined();
    expect(typeof data.id).toBe('string');
  });
});
