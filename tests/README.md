# Hướng Dẫn Chạy Test Hệ Thống

## ⚡ QUICK START - Sử Dụng Scripts Tự Động (Windows)

### Cách Nhanh Nhất:
```bash
# Từ thư mục gốc dự án
run-all-tests.bat
```

Script này sẽ tự động:
- ✅ Kiểm tra môi trường (Node.js, npm)
- ✅ Cài đặt dependencies
- ✅ Kiểm tra server đang chạy
- ✅ Chạy tất cả tests
- ✅ Tạo báo cáo kết quả

### Các Scripts Tự Động Khác:

| Script | Mô Tả | Cách Dùng |
|--------|-------|-----------|
| **setup-tests.bat** | Setup môi trường test | `cd tests && setup-tests.bat` |
| **run-tests.bat** | Chạy tất cả tests | `cd tests && run-tests.bat` |
| **run-specific-test.bat** | Chọn test cụ thể | `cd tests && run-specific-test.bat` |
| **watch-tests.bat** | Watch mode | `cd tests && watch-tests.bat` |
| **coverage-report.bat** | Coverage report | `cd tests && coverage-report.bat` |

📖 **Xem hướng dẫn chi tiết:** [AUTOMATED_TEST_GUIDE.md](../AUTOMATED_TEST_GUIDE.md)

---

## 📋 Yêu Cầu

- Node.js >= 16.x
- npm hoặc yarn
- Server đang chạy tại `http://localhost:3001`
- Database đã được setup

## 🚀 Cài Đặt Thủ Công

1. Di chuyển vào thư mục tests:
```bash
cd tests
```

2. Cài đặt dependencies:
```bash
npm install
```

## 🧪 Chạy Tests

### Chạy tất cả tests:
```bash
npm test
```

### Chạy test theo module:

**Authentication Tests:**
```bash
npm run test:auth
```

**Tools Tests:**
```bash
npm run test:tools
```

**Phishing Tests:**
```bash
npm run test:phishing
```

### Chạy tests với watch mode (tự động chạy lại khi có thay đổi):
```bash
npm run test:watch
```

### Chạy tests với coverage report:
```bash
npm run test:coverage
```

### Chạy tests cho CI/CD:
```bash
npm run test:ci
```

## 📊 Kết Quả Test

Sau khi chạy tests, bạn sẽ thấy:

### ✅ Test Pass:
```
PASS  tests/api/auth.test.js
  Authentication API Tests
    POST /api/signup
      ✓ TC-AUTH-001: Should register user with valid data (234ms)
      ✓ TC-AUTH-002: Should fail with existing username (123ms)
```

### ❌ Test Fail:
```
FAIL  tests/api/auth.test.js
  Authentication API Tests
    POST /api/signup
      ✕ TC-AUTH-001: Should register user with valid data (234ms)
      
  ● Authentication API Tests › POST /api/signup › TC-AUTH-001: Should register user with valid data

    expect(received).toBe(expected) // Object.is equality

    Expected: "success"
    Received: "error"
```

### 📈 Coverage Report:
```
--------------------------|---------|----------|---------|---------|-------------------
File                      | % Stmts | % Branch | % Funcs | % Lines | Uncovered Line #s 
--------------------------|---------|----------|---------|---------|-------------------
All files                 |   78.45 |    65.23 |   82.11 |   78.45 |                   
 auth.test.js             |     100 |      100 |     100 |     100 |                   
 tools.test.js            |   85.71 |    75.00 |   90.00 |   85.71 | 45-52             
 phishing.test.js         |   72.22 |    60.00 |   80.00 |   72.22 | 78-95,120-125     
--------------------------|---------|----------|---------|---------|-------------------
```

## 🔧 Cấu Hình

### Thay đổi Base URL:
Mở file test và thay đổi:
```javascript
const baseURL = 'http://localhost:3001'; // Thay đổi URL tại đây
```

### Thay đổi Timeout:
Trong `package.json`, thay đổi:
```json
"jest": {
  "testTimeout": 30000  // 30 giây
}
```

### Thay đổi Test Credentials:
Trong các file test, thay đổi:
```javascript
const testUser = {
  username: 'testuser',
  password: 'Test@123456'
};
```

## 📝 Viết Test Mới

### Template cho test mới:

```javascript
const request = require('supertest');
const baseURL = 'http://localhost:3001';

describe('Feature Name Tests', () => {
  let authToken;

  beforeAll(async () => {
    // Setup code
    const response = await request(baseURL)
      .post('/api/login')
      .send({ username: 'testuser', password: 'Test@123456' });
    authToken = response.body.authToken;
  });

  test('TC-XXX-001: Test description', async () => {
    const response = await request(baseURL)
      .get('/api/endpoint')
      .set('Authorization', `Bearer ${authToken}`)
      .expect(200);

    expect(response.body.status).toBe('success');
  });

  afterAll(async () => {
    // Cleanup code
  });
});
```

## 🐛 Troubleshooting

### Lỗi: "Cannot connect to server"
**Giải pháp:** Đảm bảo server đang chạy tại `http://localhost:3001`
```bash
cd dashboard
npm run server
```

### Lỗi: "Authentication failed"
**Giải pháp:** Tạo test user trong database:
```sql
INSERT INTO users (username, email, password_hash, is_active) 
VALUES ('testuser', 'test@example.com', '$2a$10$...', 1);
```

### Lỗi: "Database connection failed"
**Giải pháp:** Kiểm tra database config trong `dashboard/src/configs/database.config.js`

### Lỗi: "Test timeout"
**Giải pháp:** Tăng timeout trong package.json hoặc trong test cụ thể:
```javascript
test('Test name', async () => {
  // test code
}, 60000); // 60 seconds
```

## 📚 Best Practices

1. **Luôn cleanup sau khi test:**
   - Xóa test data
   - Reset database state
   - Clear cache

2. **Sử dụng unique identifiers:**
   ```javascript
   const testUser = {
     username: `testuser_${Date.now()}`,
     email: `test_${Date.now()}@example.com`
   };
   ```

3. **Test isolation:**
   - Mỗi test phải độc lập
   - Không phụ thuộc vào thứ tự chạy
   - Không chia sẻ state giữa các tests

4. **Meaningful assertions:**
   ```javascript
   // Good
   expect(response.body.status).toBe('success');
   expect(response.body.user.username).toBe(testUser.username);
   
   // Bad
   expect(response.body).toBeTruthy();
   ```

5. **Error handling:**
   ```javascript
   test('Should handle errors', async () => {
     try {
       await request(baseURL).get('/api/invalid');
     } catch (error) {
       expect(error.response.status).toBe(404);
     }
   });
   ```

## 📞 Hỗ Trợ

Nếu gặp vấn đề, vui lòng:
1. Kiểm tra logs trong console
2. Xem file TEST_PLAN.md để biết chi tiết test cases
3. Liên hệ team để được hỗ trợ

## 📈 Test Coverage Goals

- Unit Tests: ≥ 80%
- API Tests: 100%
- Integration Tests: ≥ 70%

## 🔄 CI/CD Integration

Tests có thể được tích hợp vào CI/CD pipeline:

### GitHub Actions:
```yaml
name: Tests
on: [push, pull_request]
jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v2
      - uses: actions/setup-node@v2
      - run: cd tests && npm install
      - run: cd tests && npm run test:ci
```

### GitLab CI:
```yaml
test:
  stage: test
  script:
    - cd tests
    - npm install
    - npm run test:ci
```

---

**Last Updated:** 2024  
**Version:** 1.0.0
