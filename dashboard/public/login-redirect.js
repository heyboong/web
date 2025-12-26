/**
 * Login Redirect Function
 * Use this function in your templates to redirect users to the login page
 * 
 * Usage in HTML:
 * <button onclick="Login()">Click to Login</button>
 * <a href="#" onclick="Login()">Login here</a>
 * <div onclick="Login()">Click anywhere</div>
 */

// eslint-disable-next-line no-unused-vars
function Login() {
    // Redirect to the login page
    window.location.href = '/auth/signin';
}

// Alternative function for different redirect destinations
// eslint-disable-next-line no-unused-vars
function RedirectTo(url) {
    window.location.href = url;
}

// Function to redirect to signup page
// eslint-disable-next-line no-unused-vars
function SignUp() {
    window.location.href = '/auth/signup';
}

// Function to redirect to dashboard
// eslint-disable-next-line no-unused-vars
function Dashboard() {
    window.location.href = '/dashboards';
}
