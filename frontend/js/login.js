function toggleTab(tabName) {
  const loginTab = document.querySelector('.tab:nth-child(1)');
  const signupTab = document.querySelector('.tab:nth-child(2)');
  const loginSection = document.getElementById('login-section');
  const signupSection = document.getElementById('signup-section');

  if (tabName === 'login') {
    loginTab.classList.add('active');
    signupTab.classList.remove('active');
    loginSection.classList.remove('hidden');
    signupSection.classList.add('hidden');
  } else {
    loginTab.classList.remove('active');
    signupTab.classList.add('active');
    loginSection.classList.add('hidden');
    signupSection.classList.remove('hidden');
  }
}

// Simulated Google login
function handleGoogleLogin() {
  window.location.href = "onboarding.html";
}

const USER_API_BASE_URL = "http://127.0.0.1:4000/api/users";

// Wait for DOM
document.addEventListener("DOMContentLoaded", () => {
  const loginForm = document.getElementById("loginForm");
  const signupForm = document.getElementById("signupForm");

  // ------------------
  // LOGIN FORM
  // ------------------
  if (loginForm) {
    loginForm.addEventListener("submit", async (e) => {
      e.preventDefault();

      const email = loginForm.querySelector('input[type="email"]').value;
      const password = loginForm.querySelector('input[type="password"]').value;

      try {
        const res = await fetch(`${USER_API_BASE_URL}/login`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ email, password })
        });

        const data = await res.json();

        if (res.ok) {
          localStorage.setItem("buddyToken", data.token);
          localStorage.setItem("buddyUser", JSON.stringify(data.user));

          window.location.href = "onboarding.html";
        } else {
          alert(data.message || "Login failed");
        }

      } catch (err) {
        console.error("Login error:", err);
        alert("Server connection failed");
      }
    });
  }

  // ------------------
  // SIGNUP FORM
  // ------------------
  if (signupForm) {
    signupForm.addEventListener("submit", async (e) => {
      e.preventDefault();

      const fullName = signupForm.querySelector('input[type="text"]').value;
      const email = signupForm.querySelector('input[type="email"]').value;
      const password = signupForm.querySelector('input[type="password"]').value;

      const [firstName, lastName] = fullName.split(" ", 2);

      try {
        const res = await fetch(`${USER_API_BASE_URL}/register`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ email, password, firstName, lastName })
        });

        const data = await res.json();

        if (res.ok) {
          localStorage.setItem("buddyToken", data.token);
          localStorage.setItem("buddyUser", JSON.stringify(data.user));

          window.location.href = "onboarding.html";
        } else {
          alert(data.message || "Registration failed");
        }

      } catch (err) {
        console.error("Signup error:", err);
        alert("Server connection failed");
      }
    });
  }

});
