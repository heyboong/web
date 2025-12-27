# Dashboard Tools System
[![Netlify Status](https://api.netlify.com/api/v1/badges/d291d4db-9b55-4e46-ac4f-72f0c8e062cd/deploy-status)](https://app.netlify.com/projects/graceful-platypus/deploys)

Hệ thống quản lý và hiển thị các công cụ (tools) trong dashboard với tính năng theo dõi lượt xem.

## Tính năng chính

- ✅ Hiển thị danh sách tools với giao diện đẹp
- ✅ Lọc tools theo category và status
- ✅ Tìm kiếm tools theo tên và mô tả
- ✅ Theo dõi lượt xem (usage_count) khi người dùng click vào tool
- ✅ Quản lý tools qua admin panel
- ✅ Hỗ trợ upload icon cho tools

## Quy trình kiểm thử (Test Flow)

Để đảm bảo hệ thống hoạt động chính xác, hãy thực hiện theo quy trình sau:

### 1. Khởi động hệ thống
- Đảm bảo Dashboard Server và Phishing Viewer Server đang chạy.
  - Dashboard: `npm run server` (Port 2324) và `npm run dev` (Port 5173)
  - Phishing Viewer: `node start-phishing-viewer.js` (Port 3002)

### 2. Tạo Template mới
1. Đăng nhập vào Dashboard Admin: [http://localhost:5173](http://localhost:5173)
2. Truy cập **Templates** -> **Create Template**.
3. Điền thông tin template (Tên, HTML, CSS).
4. Lưu template.

### 3. Tạo Website Phishing
1. Truy cập **Phishing** -> **Create Website**.
2. Chọn Template vừa tạo.
3. Điền thông tin website (Tiêu đề, Mô tả, Slug).
4. Lưu website.

### 4. Kiểm tra trang Phishing
1. Truy cập trang Phishing Viewer: `http://localhost:3002/{slug}` (Thay `{slug}` bằng slug bạn vừa tạo).
2. Kiểm tra giao diện xem có hiển thị đúng template không.
3. Nhập thông tin đăng nhập giả (Username/Password) và submit.

### 5. Kiểm tra dữ liệu Capture
1. Quay lại Dashboard Admin.
2. Truy cập **Captured Data** hoặc xem chi tiết Website.
3. Kiểm tra xem thông tin vừa nhập có xuất hiện trong danh sách không.

## Cấu trúc Database

#### Bảng `tools`
```sql
CREATE TABLE tools (
    id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(100) NOT NULL,                    -- Tên tool
    description TEXT,                              -- Mô tả
    category ENUM('seo', 'development', 'design', 'analytics', 'productivity', 'other') DEFAULT 'other',
    status ENUM('active', 'inactive', 'maintenance') DEFAULT 'active',
    price DECIMAL(10,2) DEFAULT 0.00,             -- Giá tiền
    points_cost INT DEFAULT 0,                    -- Chi phí points
    icon VARCHAR(10) DEFAULT '🔧',                -- Icon
    url VARCHAR(255),                             -- URL tool
    is_featured BOOLEAN DEFAULT FALSE,            -- Tool nổi bật
    usage_count INT DEFAULT 0,                    -- Lượt sử dụng
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);
```

## Categories có sẵn

- **seo**: Công cụ SEO
- **development**: Công cụ phát triển
- **design**: Công cụ thiết kế
- **analytics**: Công cụ phân tích
- **productivity**: Công cụ năng suất
- **other**: Khác

## Status có sẵn

- **active**: Hoạt động bình thường
- **inactive**: Tạm ngưng
- **maintenance**: Đang bảo trì

## API Endpoints

### Lấy danh sách tools
```
GET /api/tools
```

### Theo dõi lượt xem tool
```
POST /api/tools/:toolId/track-view
```

## Tính năng theo dõi lượt xem

- Mỗi khi người dùng click vào nút "Use Tool", hệ thống sẽ tự động tăng `usage_count` của tool đó
- Lượt xem được cập nhật real-time vào database
- Không ảnh hưởng đến trải nghiệm người dùng

## Upload Icon

### Cách 1: Sử dụng Emoji
```sql
INSERT INTO tools (name, icon, ...) VALUES ('My Tool', '🔧', ...);
```

### Cách 2: Upload file ảnh
1. Upload file vào thư mục `/uploads/tools/`
2. Sử dụng đường dẫn: `uploads/tools/filename.png`

## Troubleshooting

### Tool không hiển thị
- Kiểm tra `status` có phải `active` không
- Kiểm tra database connection
- Xem log server để debug

### Lỗi upload icon
- Kiểm tra quyền ghi file trong thư mục uploads
- Kiểm tra kích thước file (tối đa 5MB)
- Chỉ hỗ trợ file ảnh: jpg, png, gif, webp

### Lỗi API
- Kiểm tra server có chạy không
- Kiểm tra database connection
- Xem log server để debug

## Cấu trúc thư mục

```
/www/wwwroot/new/
├── src/app/pages/dashboards/tools/
│   └── index.jsx                 # Trang hiển thị tools
├── uploads/tools/                # Thư mục chứa icon tools
├── server.js                     # Server chính
└── README.md                     # File hướng dẫn này
```

## Liên hệ hỗ trợ

Nếu gặp vấn đề, vui lòng:
1. Kiểm tra log server
2. Kiểm tra database connection
3. Xem lại cấu trúc database
4. Liên hệ admin để được hỗ trợ
