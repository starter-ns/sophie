// Grab form and error message
const form = document.querySelector('#login-form');
const errorMessage = document.getElementById('error-message');

form.addEventListener('submit', async (e) => {
  e.preventDefault();

  // Read values
  const email = form.email.value.trim();
  const password = form.password.value;

  try {
    // Send login request
    const response = await fetch('http://localhost:5678/api/users/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password })
    });

    const data = await response.json();

    if (response.ok) {
      // Success: store token & go home
      localStorage.setItem('token', data.token);
      window.location.href = 'index.html';
    } else {
      // Show error message from server or generic
      errorMessage.textContent = data.message || 'Invalid email or password.';
      errorMessage.style.display = 'block';
    }
  } catch (err) {
    // Network/server error
    console.error('Login error:', err);
    errorMessage.textContent = 'Server error—please try again later.';
    errorMessage.style.display = 'block';
  }
});
