// assets/login.js

document.addEventListener('DOMContentLoaded', () => {
  const form = document.getElementById('login-form');
  const err  = document.getElementById('error-message');

  form.addEventListener('submit', async e => {
    e.preventDefault();

    const email    = form.querySelector('input[name="email"]').value.trim();
    const password = form.querySelector('input[name="password"]').value;

    try {
      const response = await fetch('http://localhost:5678/api/users/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password })
      });

      const data = await response.json();

      if (response.ok && data.token) {
        // Use sessionStorage so a fresh "Go Live" shows filters (not logged in)
        sessionStorage.setItem('token', data.token);

        // Clean up any old persistent token, just in case
        localStorage.removeItem('token');

        // Back to homepage
        window.location.href = 'index.html';
      } else {
        err.textContent = data.message || 'Invalid username or password.';
        err.style.display = 'block';
      }
    } catch (networkError) {
      console.error(networkError);
      err.textContent = 'Network error—please try again later.';
      err.style.display = 'block';
    }
  });
});
