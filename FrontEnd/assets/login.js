// assets/login.js

document.addEventListener('DOMContentLoaded', () => {
  const form = document.getElementById('login-form');
  const err  = document.getElementById('error-message');

  form.addEventListener('submit', async e => {
    e.preventDefault();  // stop the browser from reloading

    // read the values from your existing inputs
    const email    = form.querySelector('input[name="email"]').value.trim();
    const password = form.querySelector('input[name="password"]').value;

    try {
      // send them to your back-end
      console.log('Attempting login with:', { email, password });

      const response = await fetch('http://localhost:5678/api/users/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password })
      });

      const data = await response.json();

      if (response.ok) {
        // on success, save the token and go back to index.html
        localStorage.setItem('token', data.token);
        window.location.href = 'index.html';
      } else {
        // on error, show the message in your existing error container
        err.textContent = data.message || 'Invalid credentials.';
        err.style.display = 'block';
      }
    } catch (networkError) {
      console.error(networkError);
      err.textContent = 'Network error—please try again later.';
      err.style.display = 'block';
    }
  });
});
