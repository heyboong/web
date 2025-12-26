# Dashboard Tools System

Hệ thống quản lý và hiển thị các công cụ (tools) trong dashboard với tính năng theo dõi lượt xem.

## Tính năng chính

- ✅ Hiển thị danh sách tools với giao diện đẹp
- ✅ Lọc tools theo category và status
- ✅ Tìm kiếm tools theo tên và mô tả
- ✅ Theo dõi lượt xem (usage_count) khi người dùng click vào tool
- ✅ Quản lý tools qua admin panel
- ✅ Hỗ trợ upload icon cho tools

## Cách thêm Tool mới

### 1. Thêm Tool qua Database (Khuyến nghị)

#### Bước 1: Kết nối Database
```sql
-- Kết nối vào database của bạn
USE your_database_name;
```

#### Bước 2: Thêm Tool mới
```sql
INSERT INTO tools (
    name, 
    description, 
    category, 
    status, 
    price, 
    points_cost, 
    icon, 
    url, 
    is_featured, 
    usage_count
) VALUES (
    'Tên Tool',                    -- Tên tool (bắt buộc)
    'Mô tả chi tiết về tool',      -- Mô tả tool
    'seo',                         -- Category: seo, development, design, analytics, productivity, other
    'active',                      -- Status: active, inactive, maintenance
    9.99,                          -- Giá tiền (USD)
    100,                           -- Chi phí points
    '🔧',                          -- Icon (emoji hoặc đường dẫn file)
    '/tools/your-tool-url',        -- URL của tool
    FALSE,                         -- Có phải tool nổi bật không
    0                              -- Lượt sử dụng ban đầu
);
```

#### Ví dụ thêm Tool cụ thể:
```sql
INSERT INTO tools (
    name, 
    description, 
    category, 
    status, 
    price, 
    points_cost, 
    icon, 
    url, 
    is_featured, 
    usage_count
) VALUES (
    'SEO Keyword Analyzer', 
    'Phân tích từ khóa SEO và đưa ra gợi ý tối ưu', 
    'seo', 
    'active', 
    15.99, 
    150, 
    '🔍', 
    '/tools/seo-keyword-analyzer', 
    TRUE, 
    0
);
```

### 2. Thêm Tool qua Admin Panel

1. Đăng nhập vào admin panel
2. Truy cập **Tools Management**
3. Click **Add New Tool**
4. Điền thông tin:
   - **Name**: Tên tool
   - **Description**: Mô tả chi tiết
   - **Category**: Chọn category phù hợp
   - **Status**: Active/Inactive/Maintenance
   - **Price**: Giá tiền (USD)
   - **Points Cost**: Chi phí points
   - **Icon**: Upload file icon hoặc chọn emoji
   - **URL**: Đường dẫn đến tool
   - **Featured**: Đánh dấu tool nổi bật

### 3. Cấu trúc Database

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