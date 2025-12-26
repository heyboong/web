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

// Tạo session_id nếu chưa có
if (!isset($_SESSION['session_id'])) {
    $_SESSION['session_id'] = bin2hex(random_bytes(16));
}

header('Content-Type: application/json');
echo json_encode([
    'session_id' => $_SESSION['session_id']
]);
?>

