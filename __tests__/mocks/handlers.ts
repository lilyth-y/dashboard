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
    const body = await request.json() as { amount?: number };
    
    if (!body.amount || body.amount < 1) {
      return HttpResponse.json({ error: '유효한 금액을 입력해주세요.' }, { status: 400 });
    }

    return HttpResponse.json({ id: 'txn-1' }, { status: 201 });
  }),
];
