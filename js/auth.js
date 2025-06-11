// Import Firebase functions and services
// יש לוודא ש-auth אכן מיוצא כראוי מתוך firebase-config.js
import {
  auth,
  db,
  getCurrentUser,
  getUserData,
  onAuthStateChanged,
  logoutUser,
  registerUser,
  loginUser
} from './firebase-config.js';

// Wait for the DOM to be fully loaded
document.addEventListener('DOMContentLoaded', async function() {
  // Get UI elements
  const userProfile = document.getElementById('userProfile');
  const userName = document.getElementById('userName');
  const userEmail = document.getElementById('userEmail');
  const logoutBtn = document.getElementById('logoutBtn');
  const profileImage = document.getElementById('profileImage');
  const loginForm = document.getElementById('loginForm');
  const registerForm = document.getElementById('registerForm');
  const loginBtn = document.getElementById('loginBtn');
  const errorMessage = document.getElementById('errorMessage');
  const togglePassword = document.querySelectorAll('.toggle-password');

  // Handle registration form submission
  if (registerForm) {
    registerForm.addEventListener('submit', async (e) => {
      e.preventDefault();
      
      const firstName = document.getElementById('firstName').value;
      const lastName = document.getElementById('lastName').value;
      const email = document.getElementById('email').value;
      const phone = document.getElementById('phone').value;
      const password = document.getElementById('password').value;
      const confirmPassword = document.getElementById('confirmPassword').value;
      const terms = document.getElementById('terms').checked;

      // Validate passwords match
      if (password !== confirmPassword) {
        alert('הסיסמאות אינן תואמות');
        return;
      }

      // Validate terms acceptance
      if (!terms) {
        alert('יש לאשר את תנאי השימוש');
        return;
      }

      try {
        // Show loading state
        const registerBtn = document.querySelector('.register-btn');
        registerBtn.disabled = true;
        registerBtn.textContent = 'מבצע רישום...';

        // Register the user
        await registerUser(email, password, firstName, lastName, phone);
        
        // Redirect to dashboard on successful registration
        window.location.href = 'dashboard.html';
      } catch (error) {
        console.error('Registration error:', error);
        alert(getErrorMessage(error.code));
      } finally {
        // Reset button state
        const registerBtn = document.querySelector('.register-btn');
        registerBtn.disabled = false;
        registerBtn.textContent = 'צור חשבון';
      }
    });
  }

  // Handle login form submission
  if (loginForm) {
    loginForm.addEventListener('submit', async (e) => {
      e.preventDefault();
      const email = document.getElementById('email').value;
      const password = document.getElementById('password').value;
      const remember = document.getElementById('remember').checked;

      try {
        // Show loading state
        loginBtn.disabled = true;
        loginBtn.querySelector('.btn-text').style.display = 'none';
        loginBtn.querySelector('.btn-loader').style.display = 'inline-block';
        errorMessage.style.display = 'none';

        // --- התיקון המשוער והבטוח ביותר לגרסת Compat ---
        // נבדוק אם firebase האובייקט הגלובלי קיים לפני השימוש בו
        if (typeof firebase !== 'undefined' && firebase.auth && firebase.auth.Auth && firebase.auth.Auth.Persistence) {
            const persistenceType = remember
                ? firebase.auth.Auth.Persistence.LOCAL
                : firebase.auth.Auth.Persistence.SESSION;
            await auth.setPersistence(persistenceType);
        } else {
            // אם firebase.auth.Auth.Persistence אינו זמין, נשתמש בברירת מחדל או נרשום אזהרה
            console.warn("Firebase Auth Persistence constants not found via global 'firebase' object. Using default persistence or session persistence.");
            // אפשרות: לא לקרוא ל-setPersistence כלל, או לטפל במצב אחרת
            // לדוגמה, אם רוצים שהתחברות תמיד תהיה זמנית במקרה זה:
            // await auth.setPersistence(auth.Persistence.SESSION); // אם auth.Persistence עובד
        }
        // --- סוף התיקון המשוער והבטוח ביותר ---
        
        // Sign in with email and password using loginUser function
        await loginUser(email, password);
        
        // Redirect to dashboard on successful login
        window.location.href = 'dashboard.html';
      } catch (error) {
        // Handle errors
        console.error('Login error:', error);
        // בדוק ספציפית אם השגיאה קשורה ל-persistence
        if (error.code === 'auth/invalid-persistence-type') {
            errorMessage.textContent = 'שגיאה בהגדרת ההתחברות. אנא נסה שוב (קוד שגיאה: ' + error.code + ')';
        } else {
            errorMessage.textContent = error.message || getErrorMessage(error.code);
        }
        errorMessage.style.display = 'block';
      } finally {
        // Reset button state
        loginBtn.disabled = false;
        loginBtn.querySelector('.btn-text').style.display = 'inline-block';
        loginBtn.querySelector('.btn-loader').style.display = 'none';
      }
    });
  }

  // Toggle password visibility for all password fields
  togglePassword.forEach(toggle => {
    toggle.addEventListener('click', () => {
      const passwordInput = toggle.previousElementSibling;
      const type = passwordInput.type === 'password' ? 'text' : 'password';
      passwordInput.type = type;
      toggle.classList.toggle('fa-eye');
      toggle.classList.toggle('fa-eye-slash');
    });
  });

  // Helper function to get user-friendly error messages
  function getErrorMessage(errorCode) {
    switch (errorCode) {
      case 'auth/email-already-in-use':
        return 'כתובת האימייל כבר בשימוש';
      case 'auth/invalid-email':
        return 'כתובת אימייל לא תקינה';
      case 'auth/operation-not-allowed':
        return 'הרשמה באמצעות אימייל וסיסמא אינה מאופשרת';
      case 'auth/weak-password':
        return 'הסיסמא חלשה מדי';
      case 'auth/user-not-found':
      case 'auth/wrong-password':
        return 'אימייל או סיסמא שגויים';
      case 'auth/user-disabled':
        return 'החשבון הושבת';
      case 'auth/too-many-requests':
        return 'יותר מדי ניסיונות התחברות. אנא נסה שוב מאוחר יותר';
      case 'auth/invalid-persistence-type': 
          return 'שגיאה בהגדרת ההתחברות. אנא נסה שוב.';
      default:
        return 'אירעה שגיאה. אנא נסה שוב';
    }
  }

  // Only proceed with auth checks if we're on a protected page
  const isProtectedPage = window.location.pathname.includes('dashboard.html') || 
                         window.location.pathname.includes('profile.html');

  // Check authentication state
  onAuthStateChanged(async (user) => {
    if (user) {
      try {
        // Get user data from Firestore
        const userData = await getUserData(user.uid);
        
        if (userData && userProfile) {
          // Update UI with user data
          if (userName) userName.textContent = `${userData.firstName} ${userData.lastName}`;
          if (userEmail) userEmail.textContent = userData.email;
          // if (profileImage) profileImage.src = userData.profileImage || 'assets/default-avatar.png';
        }
      } catch (error) {
        console.error('Error loading user data:', error);
        // Handle error appropriately
      }
    } else if (isProtectedPage) {
      // Only redirect to login if we're on a protected page
      window.location.href = 'login.html';
    }
  });

  // Handle logout
  if (logoutBtn) {
    logoutBtn.addEventListener('click', async () => {
      try {
        await logoutUser();
        window.location.href = 'index.html';
      } catch (error) {
        console.error('Error logging out:', error);
        alert('Error logging out. Please try again.');
      }
    });
  }
});