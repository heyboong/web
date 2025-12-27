# Hướng Dẫn Deploy Hệ Thống

Tài liệu này hướng dẫn chi tiết cách triển khai hệ thống Webkey Dashboard lên Render (Backend) và Netlify (Frontend).

## 1. Chuẩn Bị
- Tài khoản [Render](https://render.com/)
- Tài khoản [Netlify](https://netlify.com/)
- Tài khoản [Neon DB](https://neon.tech/) (Đã có database PostgreSQL)
- Tài khoản [Pusher](https://pusher.com/) (Cho realtime)

## 2. Deploy Backend (Render)

Hệ thống Backend bao gồm 2 service chính được định nghĩa trong `dashboard/render.yaml`:
1. **Dashboard Backend**: API chính quản lý user, templates, admin (Node.js).
2. **Phishing Viewer PHP**: Server hiển thị trang fake và giao diện người dùng (PHP/Docker).

### Các bước thực hiện:
1. Đăng nhập vào Render Dashboard.
2. Chọn **Blueprints** -> **New Blueprint Instance**.
3. Kết nối với GitHub Repository của bạn.
4. Render sẽ tự động phát hiện file `dashboard/render.yaml`.
5. Điền các biến môi trường (Environment Variables) khi được yêu cầu:
   - `DATABASE_URL`: Connection string của Neon DB (PostgreSQL).
   - `JWT_SECRET`: Chuỗi bí mật cho token.
   - `PUSHER_APP_ID`, `PUSHER_KEY`, `PUSHER_SECRET`, `PUSHER_CLUSTER`: Thông tin từ Pusher.

### Kiểm tra sau khi deploy:
- **Dashboard Backend URL**: `https://dashboard-backend.onrender.com` (Dùng cho API)
- **Phishing Viewer URL**: `https://phishing-viewer-php.onrender.com` (Dùng để gửi link cho nạn nhân)

> **Lưu ý**: Service `phishing-viewer-php` sử dụng Docker. Quá trình build lần đầu có thể mất vài phút.

## 3. Deploy Frontend (Netlify)

Frontend là ứng dụng React (Vite) sẽ kết nối tới Backend trên Render.

### Các bước thực hiện:
1. Đăng nhập vào Netlify.
2. Chọn **Add new site** -> **Import from Git**.
3. Chọn Repository GitHub của bạn.
4. Cấu hình Build:
   - **Base directory**: `dashboard`
   - **Build command**: `npm run build`
   - **Publish directory**: `dist`
5. Thêm Environment Variables trong phần **Site settings** -> **Environment variables**:
   - `VITE_API_URL`: `https://dashboard-backend.onrender.com` (URL Backend Node.js)
   - `VITE_PHISHING_VIEWER_URL`: `https://phishing-viewer-php.onrender.com` (URL Phishing Viewer PHP)

### Lưu ý về `netlify.toml`:
File `netlify.toml` trong thư mục `dashboard` đã được cấu hình sẵn để:
- Proxy các request `/api/*` tới Backend Render để tránh lỗi CORS.
- Rewrite tất cả các route khác về `index.html` để hỗ trợ SPA routing.

## 4. Kiểm Tra Hoạt Động

Sau khi cả 2 bên đã deploy thành công:
1. Truy cập URL của Frontend trên Netlify.
2. Đăng nhập với tài khoản Admin.
3. Thử tạo một Template và Website mới.
4. Truy cập link trang Phishing (sử dụng domain của Phishing Viewer trên Render) để kiểm tra hiển thị.
5. Thử nhập dữ liệu và kiểm tra xem Dashboard có nhận được thông tin realtime không.

## 5. Cập Nhật Code (CI/CD)

- Mỗi khi bạn push code lên nhánh `main` (hoặc nhánh đã cấu hình) trên GitHub:
  - **Render** sẽ tự động build và deploy lại Backend.
  - **Netlify** sẽ tự động build và deploy lại Frontend.
- Không cần thao tác thủ công.
