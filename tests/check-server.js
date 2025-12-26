/**
 * Script kiểm tra server có đang chạy không
 * Sử dụng: node check-server.js
 */

const http = require('http');

const SERVER_URL = 'localhost';
const PORTS_TO_CHECK = [3001, 2324]; // Kiểm tra cả hai port
const TIMEOUT = 5000;

function checkServerOnPort(port) {
  return new Promise((resolve, reject) => {
    const options = {
      hostname: SERVER_URL,
      port: port,
      path: '/api/health',
      method: 'GET',
      timeout: TIMEOUT
    };

    const req = http.request(options, (res) => {
      if (res.statusCode === 200 || res.statusCode === 404) {
        // 404 cũng OK vì server đang chạy, chỉ là endpoint không tồn tại
        resolve({ success: true, port: port });
      } else {
        resolve({ success: true, port: port, statusCode: res.statusCode });
      }
    });

    req.on('error', (err) => {
      resolve({ success: false, port: port, error: err.message });
    });

    req.on('timeout', () => {
      req.destroy();
      resolve({ success: false, port: port, error: 'Timeout' });
    });

    req.end();
  });
}

async function checkServer() {
  console.log('🔍 Đang kiểm tra server...\n');
  
  // Kiểm tra tất cả các port
  const results = await Promise.all(
    PORTS_TO_CHECK.map(port => checkServerOnPort(port))
  );
  
  // Tìm port đang chạy
  const runningServer = results.find(r => r.success);
  
  if (runningServer) {
    console.log('✅ Server đang chạy tại http://' + SERVER_URL + ':' + runningServer.port);
    if (runningServer.statusCode) {
      console.log('   Status code:', runningServer.statusCode);
    }
    
    // Cảnh báo nếu không phải port mặc định
    if (runningServer.port !== 3001) {
      console.log('\n⚠️  LƯU Ý: Server đang chạy trên port', runningServer.port);
      console.log('   Các test file đang cấu hình cho port 3001');
      console.log('   Bạn có thể cần cập nhật baseURL trong test files\n');
    }
    
    return true;
  } else {
    console.error('❌ Không thể kết nối đến server trên các port:', PORTS_TO_CHECK.join(', '));
    console.error('\n📌 Hướng dẫn khởi động server:');
    console.error('   1. Mở terminal mới');
    console.error('   2. cd dashboard');
    console.error('   3. npm install (nếu chưa cài)');
    console.error('   4. npm run server');
    console.error('\n   Sau đó chạy lại script test này.\n');
    throw new Error('Server not running');
  }
}

// Chạy kiểm tra
checkServer()
  .then(() => {
    process.exit(0);
  })
  .catch(() => {
    process.exit(1);
  });
