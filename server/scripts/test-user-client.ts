import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();
const API_BASE = 'http://localhost:5000/api';

async function postJson(url: string, body: any, token?: string) {
  const headers: Record<string, string> = { 'Content-Type': 'application/json' };
  if (token) headers['Authorization'] = `Bearer ${token}`;
  const res = await fetch(url, { method: 'POST', headers, body: JSON.stringify(body) });
  const data = await res.json().catch(() => ({}));
  return { status: res.status, ok: res.ok, data };
}

async function patchJson(url: string, body: any, token?: string) {
  const headers: Record<string, string> = { 'Content-Type': 'application/json' };
  if (token) headers['Authorization'] = `Bearer ${token}`;
  const res = await fetch(url, { method: 'PATCH', headers, body: JSON.stringify(body) });
  const data = await res.json().catch(() => ({}));
  return { status: res.status, ok: res.ok, data };
}

async function getJson(url: string, token?: string) {
  const headers: Record<string, string> = {};
  if (token) headers['Authorization'] = `Bearer ${token}`;
  const res = await fetch(url, { method: 'GET', headers });
  const data = await res.json().catch(() => ({}));
  return { status: res.status, ok: res.ok, data };
}

async function testUserAndClientEndpoints() {
  console.log('Testing User and Client Management endpoints...\n');

  // 1. Login as Admin, PM, Developer
  const adminLogin = await postJson(`${API_BASE}/auth/login`, { email: 'admin@pulsestudio.io', password: 'password123' });
  const pmLogin = await postJson(`${API_BASE}/auth/login`, { email: 'pm@pulsestudio.io', password: 'password123' });
  const devLogin = await postJson(`${API_BASE}/auth/login`, { email: 'dev@pulsestudio.io', password: 'password123' });

  const adminToken = adminLogin.data.accessToken;
  const pmToken = pmLogin.data.accessToken;
  const devToken = devLogin.data.accessToken;

  // 2. Admin lists users
  const listUsersRes = await getJson(`${API_BASE}/users`, adminToken);
  console.log(`1. Admin GET /api/users: status ${listUsersRes.status}, count: ${listUsersRes.data.users?.length}`);

  // 3. Admin creates user
  const testEmail = `testuser.${Date.now()}@pulsestudio.io`;
  const createUserRes = await postJson(`${API_BASE}/users`, {
    name: 'Test Automation User',
    email: testEmail,
    password: 'securePassword123',
    role: 'DEVELOPER',
  }, adminToken);
  console.log(`2. Admin POST /api/users: status ${createUserRes.status}, user: ${createUserRes.data.user?.name} (${createUserRes.data.user?.role})`);

  const createdUserId = createUserRes.data.user?.id;

  // 4. Admin updates user role to PM
  const updateRoleRes = await patchJson(`${API_BASE}/users/${createdUserId}`, {
    role: 'PM',
  }, adminToken);
  console.log(`3. Admin PATCH /api/users/:id: status ${updateRoleRes.status}, updated role: ${updateRoleRes.data.user?.role}`);

  // 5. Developer tries to POST /api/users (Should be 403)
  const devCreateUserRes = await postJson(`${API_BASE}/users`, {
    name: 'Hacker User',
    email: 'hack@hack.com',
    password: 'password',
    role: 'ADMIN',
  }, devToken);
  console.log(`4. Developer POST /api/users: status ${devCreateUserRes.status} (Expected: 403)`);

  // 6. Admin & PM list clients
  const pmClientsRes = await getJson(`${API_BASE}/clients`, pmToken);
  console.log(`5. PM GET /api/clients: status ${pmClientsRes.status}, count: ${pmClientsRes.data.clients?.length}`);

  // 7. Admin creates client
  const testClientName = `Apex Labs ${Date.now().toString().slice(-4)}`;
  const createClientRes = await postJson(`${API_BASE}/clients`, {
    name: testClientName,
  }, adminToken);
  console.log(`6. Admin POST /api/clients: status ${createClientRes.status}, client: ${createClientRes.data.client?.name}`);

  // 8. PM tries to create client (Should be 403)
  const pmCreateClientRes = await postJson(`${API_BASE}/clients`, {
    name: 'Unauthorized Client Creation',
  }, pmToken);
  console.log(`7. PM POST /api/clients: status ${pmCreateClientRes.status} (Expected: 403)`);

  await prisma.$disconnect();
}

testUserAndClientEndpoints().catch((err) => {
  console.error(err);
  process.exit(1);
});
