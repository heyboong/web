/**
 * Tools API Tests
 * Test các endpoint liên quan đến tools management
 */

const request = require('supertest');
const baseURL = 'http://localhost:3001';

describe('Tools API Tests', () => {
  let authToken;
  let adminToken;
  let testToolId;

  // Setup: Login để lấy tokens
  beforeAll(async () => {
    // Login as regular user
    const userResponse = await request(baseURL)
      .post('/api/login')
      .send({
        username: 'testuser',
        password: 'Test@123456'
      });
    
    if (userResponse.body.authToken) {
      authToken = userResponse.body.authToken;
    }

    // Login as admin
    const adminResponse = await request(baseURL)
      .post('/api/login')
      .send({
        username: 'vohuunhan',
        password: 'admin123'
      });
    
    if (adminResponse.body.authToken) {
      adminToken = adminResponse.body.authToken;
    }
  });

  // TC-TOOL-001: Xem danh sách tools
  describe('GET /api/tools', () => {
    test('TC-TOOL-001: Should get list of tools', async () => {
      const response = await request(baseURL)
        .get('/api/tools')
        .expect(200);

      expect(response.body.status).toBe('success');
      expect(response.body.data).toBeDefined();
      expect(Array.isArray(response.body.data)).toBe(true);
    });

    // TC-TOOL-002: Lọc tools theo category
    test('TC-TOOL-002: Should filter tools by category', async () => {
      const response = await request(baseURL)
        .get('/api/tools?category=seo')
        .expect(200);

      expect(response.body.status).toBe('success');
      if (response.body.data.length > 0) {
        expect(response.body.data[0].category).toBe('seo');
      }
    });
  });

  // TC-TOOL-005: Track tool usage
  describe('POST /api/tools/:toolId/track-usage', () => {
    test('TC-TOOL-005: Should track tool usage', async () => {
      const response = await request(baseURL)
        .post('/api/tools/1/track-usage')
        .send({ userId: 1 })
        .expect(200);

      expect(response.body.status).toBe('success');
    });
  });

  // TC-TOOL-006: Track tool view
  describe('POST /api/tools/:toolId/track-view', () => {
    test('TC-TOOL-006: Should track tool view', async () => {
      const response = await request(baseURL)
        .post('/api/tools/1/track-view')
        .expect(200);

      expect(response.body.status).toBe('success');
    });
  });

  // Admin Tools Tests
  describe('Admin Tools Management', () => {
    // TC-TOOL-007: Admin tạo tool mới
    test('TC-TOOL-007: Admin should create new tool', async () => {
      if (!adminToken) {
        console.log('Skipping: No admin token available');
        return;
      }

      const newTool = {
        name: `Test Tool ${Date.now()}`,
        description: 'Test tool description',
        category: 'development',
        status: 'active',
        price: 9.99,
        points_cost: 100,
        icon: '🔧',
        url: `/tools/test-tool-${Date.now()}`,
        is_featured: false
      };

      const response = await request(baseURL)
        .post('/api/admin/tools')
        .set('Authorization', `Bearer ${adminToken}`)
        .send(newTool)
        .expect(201);

      expect(response.body.status).toBe('success');
      expect(response.body.data.id).toBeDefined();
      testToolId = response.body.data.id;
    });

    // TC-TOOL-008: Admin cập nhật tool
    test('TC-TOOL-008: Admin should update tool', async () => {
      if (!adminToken || !testToolId) {
        console.log('Skipping: No admin token or test tool ID');
        return;
      }

      const updatedTool = {
        name: `Updated Test Tool ${Date.now()}`,
        description: 'Updated description',
        category: 'development',
        status: 'active',
        price: 14.99,
        points_cost: 150,
        icon: '🛠️',
        url: `/tools/updated-test-tool`,
        is_featured: true
      };

      const response = await request(baseURL)
        .put(`/api/admin/tools/${testToolId}`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send(updatedTool)
        .expect(200);

      expect(response.body.status).toBe('success');
    });

    // TC-TOOL-010: Admin upload icon cho tool
    test('TC-TOOL-010: Admin should upload tool icon', async () => {
      if (!adminToken) {
        console.log('Skipping: No admin token available');
        return;
      }

      // Note: This test requires actual file upload
      // For now, we'll just test the endpoint exists
      const response = await request(baseURL)
        .post('/api/admin/tools/upload-icon')
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(400); // Expect 400 because no file is attached

      expect(response.body.status).toBe('error');
      expect(response.body.message).toContain('file');
    });

    // TC-TOOL-012: Admin bulk update tool status
    test('TC-TOOL-012: Admin should bulk update tool status', async () => {
      if (!adminToken || !testToolId) {
        console.log('Skipping: No admin token or test tool ID');
        return;
      }

      const response = await request(baseURL)
        .post('/api/admin/tools/bulk-status-update')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          toolIds: [testToolId],
          status: 'inactive'
        })
        .expect(200);

      expect(response.body.status).toBe('success');
    });

    // TC-TOOL-009: Admin xóa tool (should be last)
    test('TC-TOOL-009: Admin should delete tool', async () => {
      if (!adminToken || !testToolId) {
        console.log('Skipping: No admin token or test tool ID');
        return;
      }

      const response = await request(baseURL)
        .delete(`/api/admin/tools/${testToolId}`)
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200);

      expect(response.body.status).toBe('success');
    });
  });

  // Authorization Tests
  describe('Authorization Tests', () => {
    test('Regular user should not access admin endpoints', async () => {
      if (!authToken) {
        console.log('Skipping: No auth token available');
        return;
      }

      const response = await request(baseURL)
        .get('/api/admin/tools')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(403);

      expect(response.body.status).toBe('error');
    });
  });
});
