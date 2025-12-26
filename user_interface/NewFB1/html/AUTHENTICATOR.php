<style>
/* Import Inter font */
@import url('https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700&display=swap');

.auth-container {
    max-width: 500px;
    margin: 0 auto;
    font-family: 'Inter', -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif;
}

.auth-title {
    font-size: 20px;
    font-weight: 600;
    color: #1c1e21;
    margin-bottom: 12px;
    line-height: 1.2;
}

.auth-description {
    font-size: 15px;
    color: #65676b;
    line-height: 1.4;
    margin-bottom: 24px;
}

.auth-image {
    width: 100%;
    max-width: 390px;
    margin: 0 auto 24px;
    display: block;
    border-radius: 8px;
}

.auth-input-group {
    margin-bottom: 16px;
}

.auth-input-label {
    font-size: 15px;
    color: #1c1e21;
    margin-bottom: 8px;
    display: block;
    font-weight: 400;
}

.auth-input {
    width: 100%;
    padding: 14px 16px;
    border: 1px solid #ccd0d5;
    border-radius: 6px;
    font-size: 17px;
    color: #1c1e21;
    background: white;
    box-sizing: border-box;
    outline: none;
    transition: border-color 0.2s;
}

.auth-input:focus {
    border-color: #1877f2;
    box-shadow: 0 0 0 2px rgba(24, 119, 242, 0.2);
}

.auth-input:disabled {
    background-color: #f5f6f7;
    color: #bcc0c4;
    cursor: not-allowed;
    opacity: 0.6;
}

.auth-checkbox-wrapper {
    display: flex;
    align-items: center;
    margin-bottom: 20px;
    cursor: pointer;
}

.auth-checkbox {
    width: 20px;
    height: 20px;
    margin-right: 10px;
    cursor: pointer;
    accent-color: #1877f2;
}

.auth-checkbox-label {
    font-size: 15px;
    color: #1c1e21;
    cursor: pointer;
    user-select: none;
}

.auth-btn-primary {
    width: 100%;
    padding: 14px 16px;
    background: #1877f2;
    color: white;
    border: none;
    border-radius: 6px;
    font-size: 17px;
    font-weight: 600;
    cursor: pointer;
    margin-bottom: 12px;
    transition: background 0.2s;
}

.auth-btn-primary:hover:not(:disabled) {
    background: #166fe5;
}

.auth-btn-primary:active:not(:disabled) {
    background: #1464d8;
}

.auth-btn-primary:disabled:not(.loading) {
    background: #e4e6eb;
    color: #bcc0c4;
    cursor: not-allowed;
}

.auth-btn-primary.loading {
    background: #1877f2;
    color: white;
    cursor: wait;
}

.auth-btn-primary.loading::after {
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

.auth-btn-secondary {
    width: 100%;
    padding: 14px 16px;
    background: white;
    color: #1c1e21;
    border: 1px solid #ccd0d5;
    border-radius: 6px;
    font-size: 17px;
    font-weight: 600;
    cursor: pointer;
    transition: background 0.2s;
}

.auth-btn-secondary:hover {
    background: #f5f6f7;
}

.auth-btn-secondary:active {
    background: #e4e6eb;
}
</style>

<div class="auth-container" style="
    padding: 16px;
">
    <h1 class="auth-title">Go to your authentication app</h1>
    
    <p class="auth-description">
        Enter the 6-digit code for this account from the two-factor authentication app that you set up (such as Duo Mobile or Google Authenticator).
    </p>
    
    <img src="N3dO4_SJQPQ.png" alt="Authentication illustration" class="auth-image">
    
    <div class="auth-input-group">
        <label class="auth-input-label" for="auth-code">Code</label>
        <input 
            type="text" 
            id="auth-code" 
            class="auth-input" 
            placeholder=""
            inputmode="numeric"
            pattern="[0-9]*"
        >
    </div>
    
    <label class="auth-checkbox-wrapper">
        <input type="checkbox" id="trust-device" class="auth-checkbox" checked>
        <span class="auth-checkbox-label">Trust this device and skip this step from now on</span>
    </label>
    
    <button id="continue-btn" class="auth-btn-primary" disabled>Continue</button>
    
    <button class="auth-btn-secondary">Try another way</button>
</div>
