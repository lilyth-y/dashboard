import { describe, it, expect } from 'vitest';

describe('POST /api/financial/transactions', () => {
  it('should return 401 without authentication', async () => {
    const res = await fetch('http://localhost:3000/api/financial/transactions', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ amount: 1000, type: 'INCOME', category: 'SALES', date: '2025-02-01' }),
    });
    const data = await res.json();

    expect(res.status).toBe(401);
    expect(data.error).toBe('인증이 필요합니다.');
  });

  it('should return 400 when required fields missing', async () => {
    const res = await fetch('http://localhost:3000/api/financial/transactions', {
      method: 'POST',
      headers: { authorization: 'Bearer mock-token', 'Content-Type': 'application/json' },
      body: JSON.stringify({ amount: 1000 }),
    });
    const data = await res.json();

    expect(res.status).toBe(400);
    expect(data.error).toBe('필수 항목을 모두 입력해주세요.');
  });

  it('should create transaction successfully with valid data', async () => {
    const res = await fetch('http://localhost:3000/api/financial/transactions', {
      method: 'POST',
      headers: { authorization: 'Bearer mock-token', 'Content-Type': 'application/json' },
      body: JSON.stringify({ amount: 1000, type: 'INCOME', category: 'SALES', date: '2025-02-01' }),
    });
    const data = await res.json();

    expect(res.status).toBe(201);
    expect(data.id).toBeDefined();
  });
});

describe('GET /api/financial/transactions', () => {
  it('should return 401 without authentication', async () => {
    const res = await fetch('http://localhost:3000/api/financial/transactions');
    const data = await res.json();

    expect(res.status).toBe(401);
    expect(data.error).toBe('인증이 필요합니다.');
  });

  it('should return list with pagination for authenticated user', async () => {
    const res = await fetch('http://localhost:3000/api/financial/transactions?limit=5', {
      headers: { authorization: 'Bearer mock-token' },
    });
    const data = await res.json();

    expect(res.status).toBe(200);
    expect(Array.isArray(data.transactions)).toBe(true);
    expect(data.pagination).toBeDefined();
    expect(data.pagination).toHaveProperty('page');
    expect(data.pagination).toHaveProperty('limit');
    expect(data.pagination).toHaveProperty('total');
  });
});

describe('GET /api/financial/dashboard', () => {
  it('should return 401 without authentication', async () => {
    const res = await fetch('http://localhost:3000/api/financial/dashboard');
    const data = await res.json();

    expect(res.status).toBe(401);
    expect(data.error).toBe('인증이 필요합니다.');
  });

  it('should return dashboard data for authenticated user', async () => {
    const res = await fetch('http://localhost:3000/api/financial/dashboard', {
      headers: { authorization: 'Bearer mock-token' },
    });
    const data = await res.json();

    expect(res.status).toBe(200);
    expect(data.summary).toBeDefined();
    expect(typeof data.summary.totalIncome).toBe('number');
    expect(typeof data.summary.totalExpense).toBe('number');
    expect(typeof data.summary.netProfit).toBe('number');
  });
});
