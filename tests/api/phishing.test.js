/**
 * Phishing API Tests
 * Test các endpoint liên quan đến phishing websites
 */

const request = require('supertest');
const baseURL = 'http://localhost:3001';

describe('Phishing API Tests', () => {
  let authToken;
  let testWebsiteId;
  let testSlug;

  // Setup: Login để lấy token
  beforeAll(async () => {
    const response = await request(baseURL)
      .post('/api/login')
      .send({
        username: 'testuser',
        password: 'Test@123456'
      });
    
    if (response.body.authToken) {
      authToken = response.body.authToken;
    }
  });

  // TC-PHISH-001: Tạo website mới
  describe('POST /api/phishing/websites', () => {
    test('TC-PHISH-001: Should create new website', async () => {
      if (!authToken) {
        console.log('Skipping: No auth token available');
        return;
      }

      testSlug = `test-website-${Date.now()}`;
      const newWebsite = {
        title: `Test Website ${Date.now()}`,
        description: 'Test website description',
        slug: testSlug,
        redirect_url: 'https://google.com',
        temp1: '<html><body>Test Phishing Page</body></html>',
        temp2: '<html><body>Test Login Page</body></html>',
        thumbnail: '',
        language: 'en',
        domain: ''
      };

      const response = await request(baseURL)
        .post('/api/phishing/websites')
        .set('Authorization', `Bearer ${authToken}`)
        .send(newWebsite)
        .expect(200);

      expect(response.body.status).toBe('success');
      expect(response.body.data.id).toBeDefined();
      testWebsiteId = response.body.data.id;
    });

    // TC-PHISH-002: Tạo website với slug đã tồn tại
    test('TC-PHISH-002: Should fail with existing slug', async () => {
      if (!authToken || !testSlug) {
        console.log('Skipping: No auth token or test slug');
        return;
      }

      const duplicateWebsite = {
        title: 'Duplicate Website',
        description: 'Test',
        slug: testSlug,
        redirect_url: 'https://google.com',
        temp1: '<html><body>Test</body></html>',
        temp2: '<html><body>Test</body></html>',
        thumbnail: '',
        language: 'en',
        domain: ''
      };

      const response = await request(baseURL)
        .post('/api/phishing/websites')
        .set('Authorization', `Bearer ${authToken}`)
        .send(duplicateWebsite)
        .expect(400);

      expect(response.body.status).toBe('error');
      expect(response.body.message).toContain('already exists');
    });
  });

  // TC-PHISH-003: Xem danh sách websites
  describe('GET /api/phishing/websites', () => {
    test('TC-PHISH-003: Should get list of websites', async () => {
      if (!authToken) {
        console.log('Skipping: No auth token available');
        return;
      }

      const response = await request(baseURL)
        .get('/api/phishing/websites')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(response.body.status).toBe('success');
      expect(response.body.data).toBeDefined();
      expect(Array.isArray(response.body.data)).toBe(true);
    });

    // TC-PHISH-004: Tìm kiếm websites
    test('TC-PHISH-004: Should search websites', async () => {
      if (!authToken) {
        console.log('Skipping: No auth token available');
        return;
      }

      const response = await request(baseURL)
        .get('/api/phishing/websites?search=test')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(response.body.status).toBe('success');
    });
  });

  // TC-PHISH-005: Cập nhật website
  describe('PUT /api/phishing/websites/:id', () => {
    test('TC-PHISH-005: Should update website', async () => {
      if (!authToken || !testWebsiteId) {
        console.log('Skipping: No auth token or test website ID');
        return;
      }

      const updatedWebsite = {
        title: `Updated Test Website ${Date.now()}`,
        description: 'Updated description',
        slug: testSlug,
        redirect_url: 'https://facebook.com',
        thumbnail: '',
        language: 'vi',
        domain: ''
      };

      const response = await request(baseURL)
        .put(`/api/phishing/websites/${testWebsiteId}`)
        .set('Authorization', `Bearer ${authToken}`)
        .send(updatedWebsite)
        .expect(200);

      expect(response.body.status).toBe('success');
    });
  });

  // TC-PHISH-011: Truy cập phishing page qua slug
  describe('GET /p/:slug', () => {
    test('TC-PHISH-011: Should render phishing page', async () => {
      if (!testSlug) {
        console.log('Skipping: No test slug available');
        return;
      }

      const response = await request(baseURL)
        .get(`/p/${testSlug}`)
        .expect(200);

      expect(response.text).toContain('html');
    });

    // TC-PHISH-015: Kiểm tra view count tăng
    test('TC-PHISH-015: Should increment view count', async () => {
      if (!testSlug || !authToken) {
        console.log('Skipping: No test slug or auth token');
        return;
      }

      // Get current view count
      const beforeResponse = await request(baseURL)
        .get(`/api/phishing/websites/${testWebsiteId}`)
        .set('Authorization', `Bearer ${authToken}`);

      const viewCountBefore = beforeResponse.body.data?.view_count || 0;

      // Visit the page
      await request(baseURL)
        .get(`/p/${testSlug}`)
        .expect(200);

      // Check view count increased
      const afterResponse = await request(baseURL)
        .get(`/api/phishing/websites/${testWebsiteId}`)
        .set('Authorization', `Bearer ${authToken}`);

      const viewCountAfter = afterResponse.body.data?.view_count || 0;

      expect(viewCountAfter).toBeGreaterThan(viewCountBefore);
    });
  });

  // TC-PHISH-018: Submit form với thông tin hợp lệ
  describe('POST /api/phishing/accounts', () => {
    test('TC-PHISH-018: Should capture account data', async () => {
      if (!testSlug) {
        console.log('Skipping: No test slug available');
        return;
      }

      const accountData = {
        username: 'testuser@example.com',
        password: 'testpassword123',
        website_slug: testSlug,
        ip_address: '127.0.0.1'
      };

      const response = await request(baseURL)
        .post('/api/phishing/accounts')
        .send(accountData)
        .expect(201);

      expect(response.body.status).toBe('success');
    });
  });

  // TC-PHISH-023: Xem danh sách accounts
  describe('GET /api/phishing/accounts', () => {
    test('TC-PHISH-023: Should get list of accounts', async () => {
      if (!authToken) {
        console.log('Skipping: No auth token available');
        return;
      }

      const response = await request(baseURL)
        .get('/api/phishing/accounts')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(response.body.status).toBe('success');
      expect(response.body.data).toBeDefined();
      expect(Array.isArray(response.body.data)).toBe(true);
    });

    // TC-PHISH-024: Lọc accounts theo website
    test('TC-PHISH-024: Should filter accounts by website', async () => {
      if (!authToken || !testWebsiteId) {
        console.log('Skipping: No auth token or test website ID');
        return;
      }

      const response = await request(baseURL)
        .get(`/api/phishing/accounts?website_id=${testWebsiteId}`)
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(response.body.status).toBe('success');
    });

    // TC-PHISH-026: Tìm kiếm accounts
    test('TC-PHISH-026: Should search accounts', async () => {
      if (!authToken) {
        console.log('Skipping: No auth token available');
        return;
      }

      const response = await request(baseURL)
        .get('/api/phishing/accounts?search=test')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(response.body.status).toBe('success');
    });
  });

  // TC-PHISH-006: Xóa website (should be last)
  describe('DELETE /api/phishing/websites/:id', () => {
    test('TC-PHISH-006: Should delete website', async () => {
      if (!authToken || !testWebsiteId) {
        console.log('Skipping: No auth token or test website ID');
        return;
      }

      const response = await request(baseURL)
        .delete(`/api/phishing/websites/${testWebsiteId}`)
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(response.body.status).toBe('success');
    });
  });
});
