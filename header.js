import { auth } from "./js/firebase-config.js";

document.addEventListener("DOMContentLoaded", function () {
  const header = document.createElement("header");
  header.innerHTML = `
    <div class="header-container">
        <div class="logo-section">
            <a href="index.html" class="logo-link">
                <img src="3b54b96e-6732-4ce6-893f-cdcd8effafda-removebg-preview.png" alt="התקווה 8" class="logo-image">
            </a>
        </div>
        <nav class="nav-links">
            <a href="index.html">דף הבית</a>
            <a href="initiatives.html">יוזמות</a>
            <a href="organizations.html">שותפים</a>
            <a href="hazon.html">החזון שלנו</a>
            <a href="group.html">הצוות שלנו</a>
        </nav>
        <div class="auth-buttons">
            <a href="register.html" class="register-button" id="registerBtn">הרשמה</a>
            <a href="login.html" class="login-button" id="loginBtn">התחברות</a>
        </div>
    </div>
  `;

  // Insert header at the beginning of the body
  document.body.insertBefore(header, document.body.firstChild);

  // Get auth buttons container
  const authButtons = document.querySelector(".auth-buttons");
  if (!authButtons) return; // Exit if no auth buttons container found

  // Set default unauthenticated state
  authButtons.innerHTML = `
    <a href="register.html" class="register-btn" id="registerBtn">הרשמה</a>
    <a href="login.html" class="login-btn" id="loginBtn">התחברות</a>
  `;

  // Listen for auth state changes
  auth.onAuthStateChanged((user) => {
    if (user) {
      // User is logged in
      authButtons.innerHTML = `
        <div class="profile-container">
          <div class="profile-icon" id="profileIcon">
            <img src="${user.photoURL || 'https://www.gravatar.com/avatar/00000000000000000000000000000000?d=mp&f=y'}" 
                 alt="Profile" 
                 class="profile-image">
          </div>
          <div class="dropdown-menu" id="dropdownMenu">
            <a href="dashboard.html" class="dropdown-item">
              <span class="icon">📊</span>
              <span class="text">לוח בקרה</span>
            </a>
            <div class="dropdown-divider"></div>
            <button class="dropdown-item logout-btn" id="logoutBtn">
              <span class="icon">🚪</span>
              <span class="text">התנתק</span>
            </button>
          </div>
        </div>
      `;

      // Add dropdown functionality
      const profileIcon = document.getElementById("profileIcon");
      const dropdownMenu = document.getElementById("dropdownMenu");
      
      if (profileIcon && dropdownMenu) {
        profileIcon.addEventListener("click", () => {
          dropdownMenu.classList.toggle("show");
        });

        // Close dropdown when clicking outside
        document.addEventListener("click", (event) => {
          if (!profileIcon.contains(event.target) && !dropdownMenu.contains(event.target)) {
            dropdownMenu.classList.remove("show");
          }
        });
      }

      // Add logout functionality
      const logoutBtn = document.getElementById("logoutBtn");
      if (logoutBtn) {
        logoutBtn.addEventListener("click", async () => {
          try {
            await auth.signOut();
            window.location.href = "index.html";
          } catch (error) {
            console.error("Logout error:", error);
          }
        });
      }
    } else {
      // User is not logged in - show default state
      authButtons.innerHTML = `
        <a href="register.html" class="register-button" id="registerBtn">הרשמה</a>
        <a href="login.html" class="login-button" id="loginBtn">התחברות</a>
      `;
    }
  });

  // Add header styles
  const style = document.createElement("style");
  style.textContent = `
         header {
             background: linear-gradient(135deg, #2e7d32, #4caf50);
             color: white;
             height: 75px;
             z-index: 9999;
             display: flex;
             align-items: center;
             overflow: visible;
         }
 
         .header-container {
             margin: 0 auto;
             padding: 0 20px;
             display: flex;
             justify-content: space-between;
             align-items: center;
             width: 100%;
             position: relative;
         }
 
         .logo-section {
             display: flex;
             align-items: center;
         }
 
         .logo-link {
             height: 125px;
             width: 125px;
             text-decoration: none;
             display: flex;
             align-items: center;
         }
 
         .logo-image {
             height: 100%;
             width: auto;
             margin: 0;
         }
 
         .nav-links {
             display: flex;
             gap: 20px;
         }
 
         .nav-links a {
             color: white;
             text-decoration: none;
             font-size: 0.9rem;
             padding: 3px 0;
             position: relative;
             transition: color 0.3s ease;
         }
 
         .nav-links a:hover {
             color: #e8f5e9;
         }
 
         .nav-links a::after {
             content: '';
             position: absolute;
             bottom: 0;
             left: 0;
             width: 100%;
             height: 1px;
             background-color: #e8f5e9;
             transform: scaleX(0);
             transition: transform 0.3s ease;
         }
 
         .nav-links a:hover::after {
             transform: scaleX(1);
         }
 
         .auth-buttons {
             display: flex;
             gap: 10px;
             align-items: center;
         }
 
         .login-button, .register-button {
             background-color: white;
             color: #4caf50;
             padding: 5px 15px;
             border: 2px solid white;
             border-radius: 5px;
             text-decoration: none;
             font-weight: bold;
             font-size: 0.9rem;
             transition: all 0.3s ease;
             display: inline-block;
         }
 
         .login-button:hover, .register-button:hover {
             background-color: #4caf50;
             color: white;
         }
 
         .user-email {
             color: white;
             margin-right: 15px;
             font-size: 0.9rem;
         }
 
         .dashboard-btn {
             background-color: white;
             color: #4caf50;
             padding: 5px 15px;
             border: 2px solid white;
             border-radius: 5px;
             text-decoration: none;
             font-weight: bold;
             font-size: 0.9rem;
             transition: all 0.3s ease;
             margin-right: 10px;
             display: inline-block;
         }
 
         .dashboard-btn:hover {
             background-color: #4caf50;
             color: white;
         }
 
         .logout-btn {
             background-color: #f44336;
             color: white;
             padding: 5px 15px;
             border: 2px solid #f44336;
             border-radius: 5px;
             text-decoration: none;
             font-weight: bold;
             font-size: 0.9rem;
             transition: all 0.3s ease;
             cursor: pointer;
             display: inline-block;
         }
 
         .logout-btn:hover {
             background-color: white;
             color: #f44336;
         }
 
         .profile-container {
             position: relative;
             display: flex;
             align-items: center;
             z-index: 10000;
         }
 
         .profile-icon {
             width: 40px;
             height: 40px;
             border-radius: 50%;
             overflow: hidden;
             cursor: pointer;
             border: 2px solid white;
             transition: transform 0.3s ease;
             background-color: #fff;
         }
 
         .profile-icon:hover {
             transform: scale(1.1);
         }
 
         .profile-image {
             width: 100%;
             height: 100%;
             object-fit: cover;
         }
 
         .dropdown-menu {
             position: absolute;
             top: calc(100% + 14px);
             left: -7px;
             background-color: white;
             border-radius: 8px;
             box-shadow: 0 4px 20px rgba(0, 0, 0, 0.15);
             padding: 8px 0;
             min-width: 180px;
             display: none;
             z-index: 10000;
             margin-top: 0;
             transform-origin: top right;
         }
 
         .dropdown-menu::before {
             content: '';
             position: absolute;
             top: -8px;
             left: 20px;
             width: 16px;
             height: 16px;
             background-color: white;
             transform: rotate(45deg);
             box-shadow: -2px -2px 5px rgba(0, 0, 0, 0.05);
         }
 
         .dropdown-menu.show {
             display: block;
             animation: dropdownFadeIn 0.2s ease;
         }
 
         @keyframes dropdownFadeIn {
             from {
                 opacity: 0;
                 transform: translateY(-10px);
             }
             to {
                 opacity: 1;
                 transform: translateY(0);
             }
         }
 
         .dropdown-divider {
             height: 1px;
             background-color: #e0e0e0;
             margin: 8px 0;
         }
 
         .dropdown-item {
             display: flex;
             align-items: center;
             padding: 12px 16px;
             color: #333;
             text-decoration: none;
             transition: all 0.3s ease;
             cursor: pointer;
             border: none;
             background: none;
             width: 100%;
             text-align: right;
             font-size: 0.9rem;
             gap: 12px;
         }
 
         .dropdown-item .icon {
             font-size: 1.2rem;
             min-width: 24px;
             text-align: center;
         }
 
         .dropdown-item .text {
             flex: 1;
         }
 
         .dropdown-item:hover {
             background-color: #f5f5f5;
         }
 
         .dropdown-item.logout-btn {
             color: #f44336;
         }
 
         .dropdown-item.logout-btn:hover {
             background-color: #ffebee;
         }
 
         @media (max-width: 768px) {
             header {
                 height: 50px;
             }
 
             body {
                 padding-top: 50px;
             }
 
             .logo-image {
                 height: 100%;
                 width: auto;
             }
 
             .profile-icon {
                 width: 32px;
                 height: 32px;
             }
 
             .dropdown-menu {
                 position: fixed;
                 top: 50px;
                 right: 0;
                 left: 0;
                 width: 100%;
                 min-width: unset;
                 border-radius: 0;
                 box-shadow: 0 4px 20px rgba(0, 0, 0, 0.15);
                 transform-origin: top center;
             }
 
             .dropdown-menu::before {
                 display: none;
             }
 
             .dropdown-item {
                 padding: 15px 20px;
                 justify-content: center;
             }
 
             .dropdown-item .icon {
                 margin-left: 8px;
             }
 
             .dropdown-divider {
                 margin: 0;
             }
         }
 
         @media (max-width: 480px) {
             .dropdown-menu {
                 top: 45px;
             }
 
             .dropdown-item {
                 font-size: 1rem;
                 padding: 12px 20px;
             }
         }
     `;
  document.head.appendChild(style);
});
