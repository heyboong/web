/**
 * Authentication API Tests
 * Test các endpoint liên quan đến authentication
 */

const request = require('supertest');
const baseURL = 'http://localhost:3001';

describe('Authentication API Tests', () => {
  let authToken;
  let testUserId;
  const testUser = {
    username: `testuser_${Date.now()}`,
    email: `test_${Date.now()}@example.com`,
    password: 'Test@123456',
    confirm_password: 'Test@123456'
  };

  // TC-AUTH-001: Đăng ký với thông tin hợp lệ
  describe('POST /api/signup', () => {
    test('TC-AUTH-001: Should register user with valid data', async () => {
      const response = await request(baseURL)
        .post('/api/signup')
        .send(testUser)
        .expect(201);

      expect(response.body.status).toBe('success');
      expect(response.body.authToken).toBeDefined();
      expect(response.body.user).toBeDefined();
      expect(response.body.user.username).toBe(testUser.username);
      expect(response.body.user.email).toBe(testUser.email);
      
      authToken = response.body.authToken;
      testUserId = response.body.user.id;
    });

    // TC-AUTH-002: Đăng ký với username đã tồn tại
    test('TC-AUTH-002: Should fail with existing username', async () => {
      const response = await request(baseURL)
        .post('/api/signup')
        .send(testUser)
        .expect(409);

      expect(response.body.status).toBe('error');
      expect(response.body.message).toContain('already exists');
    });

    // TC-AUTH-003: Đăng ký với email đã tồn tại
    test('TC-AUTH-003: Should fail with existing email', async () => {
      const response = await request(baseURL)
        .post('/api/signup')
        .send({
          username: `newuser_${Date.now()}`,
          email: testUser.email,
          password: 'Test@123456',
          confirm_password: 'Test@123456'
        })
        .expect(409);

      expect(response.body.status).toBe('error');
    });

    // TC-AUTH-004: Đăng ký với mật khẩu yếu
    test('TC-AUTH-004: Should fail with weak password', async () => {
      const response = await request(baseURL)
        .post('/api/signup')
        .send({
          username: `newuser_${Date.now()}`,
          email: `new_${Date.now()}@example.com`,
          password: '123',
          confirm_password: '123'
        })
        .expect(400);

      expect(response.body.status).toBe('error');
      expect(response.body.message).toContain('password');
    });

    // TC-AUTH-005: Đăng ký với email không hợp lệ
    test('TC-AUTH-005: Should fail with invalid email', async () => {
      const response = await request(baseURL)
        .post('/api/signup')
        .send({
          username: `newuser_${Date.now()}`,
          email: 'invalid-email',
          password: 'Test@123456',
          confirm_password: 'Test@123456'
        })
        .expect(400);

      expect(response.body.status).toBe('error');
      expect(response.body.message).toContain('email');
    });

    // TC-AUTH-006: Đăng ký với username không hợp lệ
    test('TC-AUTH-006: Should fail with invalid username', async () => {
      const response = await request(baseURL)
        .post('/api/signup')
        .send({
          username: 'ab', // Too short
          email: `new_${Date.now()}@example.com`,
          password: 'Test@123456',
          confirm_password: 'Test@123456'
        })
        .expect(400);

      expect(response.body.status).toBe('error');
    });
  });

  // TC-AUTH-007 to TC-AUTH-012: Login tests
  describe('POST /api/login', () => {
    // TC-AUTH-007: Đăng nhập với thông tin đúng
    test('TC-AUTH-007: Should login with correct credentials', async () => {
      const response = await request(baseURL)
        .post('/api/login')
        .send({
          username: testUser.username,
          password: testUser.password
        })
        .expect(200);

      expect(response.body.status).toBe('success');
      expect(response.body.authToken).toBeDefined();
      expect(response.body.user).toBeDefined();
    });

    // TC-AUTH-008: Đăng nhập với username sai
    test('TC-AUTH-008: Should fail with wrong username', async () => {
      const response = await request(baseURL)
        .post('/api/login')
        .send({
          username: 'wrongusername',
          password: testUser.password
        })
        .expect(401);

      expect(response.body.status).toBe('error');
      expect(response.body.message).toContain('Invalid credentials');
    });

    // TC-AUTH-009: Đăng nhập với password sai
    test('TC-AUTH-009: Should fail with wrong password', async () => {
      const response = await request(baseURL)
        .post('/api/login')
        .send({
          username: testUser.username,
          password: 'wrongpassword'
        })
        .expect(401);

      expect(response.body.status).toBe('error');
    });
  });

  // TC-AUTH-013 to TC-AUTH-017: Authorization tests
  describe('Authorization Tests', () => {
    // TC-AUTH-015: Truy cập API không có token
    test('TC-AUTH-015: Should fail without token', async () => {
      const response = await request(baseURL)
        .get('/api/user/profile')
        .expect(401);

      expect(response.body.status).toBe('error');
      expect(response.body.message).toContain('token');
    });

    // TC-AUTH-016: Truy cập API với token không hợp lệ
    test('TC-AUTH-016: Should fail with invalid token', async () => {
      const response = await request(baseURL)
        .get('/api/user/profile')
        .set('Authorization', 'Bearer invalid-token')
        .expect(403);

      expect(response.body.status).toBe('error');
    });

    // TC-AUTH-017: Truy cập API với token hợp lệ
    test('TC-AUTH-017: Should succeed with valid token', async () => {
      const response = await request(baseURL)
        .get('/api/user/profile')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(response.body.status).toBe('success');
      expect(response.body.user).toBeDefined();
    });
  });
});
