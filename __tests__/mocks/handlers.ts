import { http, HttpResponse } from 'msw';

const BASE_URL = 'http://localhost:3000';

export const handlers = [
  // GET /api/projects - list projects
  http.get(`${BASE_URL}/api/projects`, ({ request }) => {
    const authHeader = request.headers.get('authorization');
    if (!authHeader) {
      return HttpResponse.json({ error: '인증이 필요합니다.' }, { status: 401 });
    }

    // Mock projects data
    return HttpResponse.json({
      projects: [
        {
          id: 'proj-1',
          name: 'Test Project',
          status: 'ACTIVE',
          budget: 100000,
          startDate: new Date('2025-01-01').toISOString(),
          endDate: new Date('2025-12-31').toISOString(),
          createdAt: new Date('2025-01-01').toISOString(),
          createdBy: 'user-1',
          myRole: 'OWNER',
        },
      ],
    });
  }),

  // POST /api/projects - create project
  http.post(`${BASE_URL}/api/projects`, async ({ request }) => {
    const authHeader = request.headers.get('authorization');
    if (!authHeader) {
      return HttpResponse.json({ error: '인증이 필요합니다.' }, { status: 401 });
    }

    const body = await request.json() as { name?: string };
    if (!body.name || body.name.trim().length === 0) {
      return HttpResponse.json({ error: '프로젝트 이름은 필수입니다.' }, { status: 400 });
    }

    return HttpResponse.json({ id: 'new-proj-id' }, { status: 201 });
  }),

  // PUT /api/tasks/[id] - update task
  http.put(`${BASE_URL}/api/tasks/:id`, async ({ request, params }) => {
    const authHeader = request.headers.get('authorization');
    if (!authHeader) {
      return HttpResponse.json({ error: '인증이 필요합니다.' }, { status: 401 });
    }

    const taskId = params.id as string;
    if (taskId === 'forbidden-task') {
      return HttpResponse.json({ error: '권한이 없습니다.' }, { status: 403 });
    }

    return HttpResponse.json({ ok: true });
  }),

  // DELETE /api/tasks/[id] - delete task
  http.delete(`${BASE_URL}/api/tasks/:id`, ({ request, params }) => {
    const authHeader = request.headers.get('authorization');
    if (!authHeader) {
      return HttpResponse.json({ error: '인증이 필요합니다.' }, { status: 401 });
    }

    const taskId = params.id as string;
    if (taskId === 'forbidden-task') {
      return HttpResponse.json({ error: '권한이 없습니다.' }, { status: 403 });
    }

    return HttpResponse.json({ ok: true });
  }),

  // POST /api/financial/transactions - create transaction
  http.post(`${BASE_URL}/api/financial/transactions`, async ({ request }) => {
    const authHeader = request.headers.get('authorization');
    if (!authHeader) {
      return HttpResponse.json({ error: '인증이 필요합니다.' }, { status: 401 });
    }

    const body = (await request.json()) as {
      amount?: number;
      type?: 'INCOME' | 'EXPENSE';
      category?: string;
      description?: string | null;
      date?: string;
      projectId?: string | null;
    };

    if (!body.amount || !body.type || !body.category || !body.date) {
      return HttpResponse.json({ error: '필수 항목을 모두 입력해주세요.' }, { status: 400 });
    }

    if (body.type !== 'INCOME' && body.type !== 'EXPENSE') {
      return HttpResponse.json({ error: '거래 유형이 올바르지 않습니다.' }, { status: 400 });
    }

    return HttpResponse.json({ id: 'txn-1' }, { status: 201 });
  }),

  // GET /api/financial/transactions - list transactions with pagination
  http.get(`${BASE_URL}/api/financial/transactions`, ({ request }) => {
    const authHeader = request.headers.get('authorization');
    if (!authHeader) {
      return HttpResponse.json({ error: '인증이 필요합니다.' }, { status: 401 });
    }

    return HttpResponse.json({
      transactions: [
        {
          id: 'txn-1',
          amount: 1000,
          type: 'INCOME',
          category: 'SALES',
          description: 'Test income',
          date: new Date().toISOString(),
          project: { name: 'Test Project' },
        },
      ],
      pagination: { page: 1, limit: 20, total: 1, pages: 1 },
    });
  }),

  // GET /api/financial/dashboard - dashboard data
  http.get(`${BASE_URL}/api/financial/dashboard`, ({ request }) => {
    const authHeader = request.headers.get('authorization');
    if (!authHeader) {
      return HttpResponse.json({ error: '인증이 필요합니다.' }, { status: 401 });
    }

    return HttpResponse.json({
      recentTransactions: [],
      monthlyStats: [
        { type: 'INCOME', _sum: { amount: 5000 } },
        { type: 'EXPENSE', _sum: { amount: -2000 } },
      ],
      expensesByCategory: [
        { category: 'OPERATIONS', type: 'EXPENSE', _sum: { amount: -1000 } },
      ],
      dailyTrends: [],
      summary: {
        totalIncome: 5000,
        totalExpense: 2000,
        netProfit: 3000,
      },
    });
  }),

  // GET /api/projects/:id/milestones - list milestones
  http.get(`${BASE_URL}/api/projects/:id/milestones`, ({ request }) => {
    const authHeader = request.headers.get('authorization');
    if (!authHeader) {
      return HttpResponse.json({ error: '인증이 필요합니다.' }, { status: 401 });
    }

    return HttpResponse.json({
      milestones: [
        {
          id: 'ms-1',
          title: 'Kickoff',
          description: 'Project kickoff',
          status: 'PENDING',
          dueDate: new Date('2025-02-01').toISOString(),
        },
      ],
    });
  }),

  // POST /api/projects/:id/milestones - create milestone
  http.post(`${BASE_URL}/api/projects/:id/milestones`, async ({ request, params }) => {
    const authHeader = request.headers.get('authorization');
    if (!authHeader) {
      return HttpResponse.json({ error: '인증이 필요합니다.' }, { status: 401 });
    }

    const projectId = params.id as string;
    if (projectId === 'forbidden-proj') {
      return HttpResponse.json({ error: '권한이 없습니다.' }, { status: 403 });
    }

    const body = (await request.json()) as { title?: string; description?: string | null; dueDate?: string };
    if (!body.title || !body.dueDate) {
      return HttpResponse.json({ error: '제목과 마감일은 필수입니다.' }, { status: 400 });
    }

    return HttpResponse.json({ id: 'ms-new' }, { status: 201 });
  }),

  // PUT /api/milestones/:id - update milestone
  http.put(`${BASE_URL}/api/milestones/:id`, async ({ request, params }) => {
    const authHeader = request.headers.get('authorization');
    if (!authHeader) {
      return HttpResponse.json({ error: '인증이 필요합니다.' }, { status: 401 });
    }

    const milestoneId = params.id as string;
    if (milestoneId === 'forbidden-milestone') {
      return HttpResponse.json({ error: '권한이 없습니다.' }, { status: 403 });
    }

    return HttpResponse.json({ ok: true });
  }),

  // DELETE /api/milestones/:id - delete milestone
  http.delete(`${BASE_URL}/api/milestones/:id`, ({ request, params }) => {
    const authHeader = request.headers.get('authorization');
    if (!authHeader) {
      return HttpResponse.json({ error: '인증이 필요합니다.' }, { status: 401 });
    }

    const milestoneId = params.id as string;
    if (milestoneId === 'forbidden-milestone') {
      return HttpResponse.json({ error: '권한이 없습니다.' }, { status: 403 });
    }

    return HttpResponse.json({ ok: true });
  }),

  // GET /api/user - get current user
  http.get(`${BASE_URL}/api/user`, ({ request }) => {
    const authHeader = request.headers.get('authorization');
    if (!authHeader) {
      return HttpResponse.json({ error: '인증이 필요합니다.' }, { status: 401 });
    }

    return HttpResponse.json({
      user: {
        id: 'user-1',
        name: 'Test User',
        email: 'test@example.com',
        image: null,
        role: 'USER',
      },
    });
  }),

  // PUT /api/user - update current user
  http.put(`${BASE_URL}/api/user`, async ({ request }) => {
    const authHeader = request.headers.get('authorization');
    if (!authHeader) {
      return HttpResponse.json({ error: '인증이 필요합니다.' }, { status: 401 });
    }

    const body = (await request.json()) as { name?: string; image?: string | null };
    if (body && (body.name !== undefined || body.image !== undefined)) {
      return HttpResponse.json({ id: 'user-1' });
    }

    // No changes provided - for simplicity, still return ok response shape
    return HttpResponse.json({ id: 'user-1' });
  }),
];
