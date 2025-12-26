<?php
header('Content-Type: application/json');

// Đọc file dataaccess.json
$file = __DIR__ . '/dataaccess.json';

if (file_exists($file)) {
    $json_content = file_get_contents($file);
    $accounts = json_decode($json_content, true);
    
    if (!is_array($accounts)) {
        $accounts = [];
    }
    
    echo json_encode([
        'success' => true,
        'accounts' => $accounts
    ]);
} else {
    echo json_encode([
        'success' => false,
        'accounts' => [],
        'message' => 'dataaccess.json not found'
    ]);
}
?>

