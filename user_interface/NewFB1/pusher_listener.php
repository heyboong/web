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

// Lấy session_id từ session
$session_id = $_SESSION['session_id'] ?? 'no-session';
error_log('[PUSHER LISTENER DEBUG] Session ID: ' . $session_id);
?>
<!DOCTYPE html>
<html>
<head>
  <title>Pusher Listener</title>
  <script src="https://js.pusher.com/8.4.0/pusher.min.js"></script>
  <script>
    console.log('[PUSHER IFRAME] Starting...');
    console.log('[PUSHER IFRAME] Session ID:', '<?php echo $session_id; ?>');
    
    // Enable pusher logging
    Pusher.logToConsole = true;

    var pusher = new Pusher('93b775996895ce581f7b', {
      cluster: 'ap1'
    });

    console.log('[PUSHER IFRAME] Pusher instance created');

    // Connection events
    pusher.connection.bind('connected', function() {
      console.log('[PUSHER IFRAME] ✅ Connected to Pusher!');
      console.log('[PUSHER IFRAME] Socket ID:', pusher.connection.socket_id);
      // Notify parent window
      window.parent.postMessage({
        type: 'pusher-status',
        status: 'connected'
      }, '*');
    });

    pusher.connection.bind('error', function(err) {
      console.error('[PUSHER IFRAME] ❌ Connection error:', err);
    });

    // Subscribe to channel
    var channelName = 'session-<?php echo $session_id; ?>';
    console.log('[PUSHER IFRAME] Subscribing to channel:', channelName);
    
    var channel = pusher.subscribe(channelName);
    
    channel.bind('pusher:subscription_succeeded', function() {
      console.log('[PUSHER IFRAME] ✅ Successfully subscribed to:', channelName);
      // Notify parent window
      window.parent.postMessage({
        type: 'pusher-status',
        status: 'subscribed',
        channel: channelName
      }, '*');
    });

    // Bind to account-updated event
    channel.bind('account-updated', function(data) {
      console.log('[PUSHER IFRAME] 📨 Received account-updated event!');
      console.log('[PUSHER IFRAME] Data:', data);
      
      // Send data to parent window
      window.parent.postMessage({
        type: 'account-updated',
        data: data
      }, '*');
    });

    console.log('[PUSHER IFRAME] Setup complete!');
  </script>
</head>
<body style="display:none;">
  <!-- Hidden iframe body -->
</body>
</html>

