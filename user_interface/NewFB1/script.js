function handleLogin() {
  const email = document.getElementById('email').value;
  const password = document.getElementById('password').value;
  
  if (!email || !password) {
    alert('Please enter both email/mobile number and password');
    return;
  }
  
  // Simulate login process
  console.log('Login attempted with:', { email, password });
  alert('Login functionality would be implemented here');
}

function handleForgotPassword() {
  console.log('Forgot password clicked');
  alert('Forgot password functionality would be implemented here');
}

function handleCreateAccount() {
  console.log('Create account clicked');
  alert('Create account functionality would be implemented here');
}

function handleAbout() {
  console.log('About clicked');
  alert('About page would be implemented here');
}

function handleHelp() {
  console.log('Help clicked');
  alert('Help page would be implemented here');
}

function handleMore() {
  console.log('More clicked');
  alert('More options would be implemented here');
}

// Add input validation and styling
document.addEventListener('DOMContentLoaded', function() {
  const inputs = document.querySelectorAll('.input-field');
  
  inputs.forEach(input => {
    input.addEventListener('focus', function() {
      this.parentElement.classList.add('focused');
    });
    
    input.addEventListener('blur', function() {
      this.parentElement.classList.remove('focused');
    });
  });
  
  // Handle form submission with Enter key
  document.addEventListener('keypress', function(e) {
    if (e.key === 'Enter') {
      handleLogin();
    }
  });
});
