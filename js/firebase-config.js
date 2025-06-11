// =============================================
// Firebase Configuration and Setup
// =============================================

// Import Firebase SDKs using script tags (loaded in HTML)
const firebase = window.firebase;

// Firebase project configuration
// To get your config:
// 1. Go to Firebase Console (https://console.firebase.google.com/)
// 2. Select your project
// 3. Click the gear icon (⚙️) next to "Project Overview"
// 4. Scroll to "Your apps" section
// 5. Click the web icon (</>) to add a web app if you haven't already
// 6. Copy the config object below
const firebaseConfig = {
  apiKey: "AIzaSyAFLCAnSXA7ItJjAQy8zXT2YrZW3nJlYhg",
  authDomain: "demoday-14c25.firebaseapp.com",
  projectId: "demoday-14c25",
  storageBucket: "demoday-14c25.firebasestorage.app",
  messagingSenderId: "350702260602",
  appId: "1:350702260602:web:5fa7500b41c19e003106c3",
  measurementId: "G-7V5Q1KMV6P"
};

// Initialize Firebase
try {
  console.log("Initializing Firebase...");
  if (!firebase.apps.length) {
    firebase.initializeApp(firebaseConfig);
    console.log("Firebase initialized successfully");
  } else {
    console.log("Firebase already initialized, using existing instance");
  }
} catch (error) {
  console.error("Error initializing Firebase:", error);
  throw error;
}

// Initialize Firebase services
const auth = firebase.auth();
const db = firebase.firestore();

// Configure Firestore settings
db.settings({
  cacheSizeBytes: firebase.firestore.CACHE_SIZE_UNLIMITED,
  merge: true
});

// Add error handling for Firestore operations
db.enablePersistence({ synchronizeTabs: true })
  .then(() => {
    console.log("Firestore persistence enabled");
  })
  .catch((err) => {
    console.error("Error enabling Firestore persistence:", err);
  });

// =============================================
// User Authentication Functions
// =============================================

/**
 * Register a new user with email and password
 * @param {string} email - User's email address
 * @param {string} password - User's password
 * @param {string} firstName - User's first name
 * @param {string} lastName - User's last name
 * @param {string} phone - User's phone number
 * @returns {Promise<Object>} The created user object
 */
async function registerUser(email, password, firstName, lastName, phone) {
  try {
    console.log("Starting registration process...");
    console.log("Firebase Auth state:", auth ? "Initialized" : "Not initialized");
    console.log("Firestore state:", db ? "Initialized" : "Not initialized");
    console.log("Attempting to register user with email:", email);

    // Verify Firebase services are properly initialized
    if (!auth || !db) {
      throw new Error("Firebase services are not properly initialized");
    }

    // Step 1: Create the user in Firebase Authentication
    console.log("Creating user with email:", email);
    const userCredential = await auth.createUserWithEmailAndPassword(email, password);
    const user = userCredential.user;
    console.log("User created in Authentication:", user.uid);

    // Step 2: Store additional user data in Firestore
    try {
      // Prepare user data object
      const userData = {
        firstName,
        lastName,
        email,
        phone,
        createdAt: firebase.firestore.FieldValue.serverTimestamp(),
        lastLogin: firebase.firestore.FieldValue.serverTimestamp(),
        role: 'user', // Default role
        status: 'active', // Account status
        preferences: {
          notifications: true,
          language: 'he' // Default language
        }
      };
      
      console.log("Preparing to save user data to Firestore:", userData);
      
      // Create a reference to the user's document in Firestore
      const userRef = db.collection("users").doc(user.uid);
      console.log("User document reference created:", userRef.path);
      
      // Save the user data to Firestore
      await userRef.set(userData);
      console.log("User data saved to Firestore");
      
      // Verify the data was saved successfully
      const savedDoc = await userRef.get();
      if (!savedDoc.exists) {
        throw new Error("Failed to verify saved data - document does not exist");
      }
      
      const savedData = savedDoc.data();
      console.log("Successfully verified saved data:", savedData);
      
      return user;
    } catch (firestoreError) {
      // If saving to Firestore fails, clean up the auth user
      console.error("Firestore Error Details:", {
        code: firestoreError.code,
        message: firestoreError.message,
        stack: firestoreError.stack
      });
      
      try {
        await user.delete();
        console.log("Cleaned up auth user after Firestore failure");
      } catch (deleteError) {
        console.error("Error cleaning up auth user:", deleteError);
      }
      
      throw new Error(`Firestore Error: ${firestoreError.message}`);
    }
  } catch (error) {
    console.error("Registration Error Details:", {
      code: error.code,
      message: error.message,
      stack: error.stack
    });
    throw error;
  }
}

/**
 * Log in an existing user with email and password
 * @param {string} email - User's email address
 * @param {string} password - User's password
 * @returns {Promise<Object>} The logged-in user object
 */
async function loginUser(email, password) {
  try {
    console.log("Attempting to log in user:", email);
    
    // Validate input
    if (!email || !password) {
      throw new Error("Email and password are required");
    }

    // Attempt to sign in
    const userCredential = await auth.signInWithEmailAndPassword(email, password);
    const user = userCredential.user;
    
    console.log("User logged in successfully:", user.uid);

    // Update last login timestamp in Firestore
    try {
      await db.collection("users").doc(user.uid).update({
        lastLogin: firebase.firestore.FieldValue.serverTimestamp()
      });
      console.log("Last login timestamp updated");
    } catch (updateError) {
      console.warn("Could not update last login timestamp:", updateError);
      // Don't throw error here, as the user is still logged in
    }

    return user;
  } catch (error) {
    console.error("Login error:", error);
    
    // Provide more specific error messages
    switch (error.code) {
      case 'auth/invalid-email':
        throw new Error("Invalid email address format");
      case 'auth/user-disabled':
        throw new Error("This account has been disabled");
      case 'auth/user-not-found':
        throw new Error("No account found with this email");
      case 'auth/wrong-password':
        throw new Error("Incorrect password");
      case 'auth/invalid-login-credentials':
        throw new Error("Invalid email or password");
      case 'auth/too-many-requests':
        throw new Error("Too many failed login attempts. Please try again later");
      default:
        throw new Error("Login failed. Please try again");
    }
  }
}

/**
 * Log out the current user
 * @returns {Promise<void>}
 */
async function logoutUser() {
  try {
    await auth.signOut();
  } catch (error) {
    throw error;
  }
}

/**
 * Set up a listener for authentication state changes
 * @param {Function} callback - Function to call when auth state changes
 * @returns {Function} Unsubscribe function
 */
function onAuthStateChanged(callback) {
  return auth.onAuthStateChanged(async (user) => {
    if (user) {
      try {
        // Get the user's ID token to ensure it's valid
        await user.getIdToken(true);
        console.log("User is authenticated:", user.uid);
      } catch (error) {
        console.error("Error refreshing token:", error);
        // If token refresh fails, sign out the user
        await auth.signOut();
        user = null;
      }
    }
    callback(user);
  });
}

/**
 * Get the currently logged-in user
 * @returns {Object|null} The current user object or null if not logged in
 */
function getCurrentUser() {
  const user = auth.currentUser;
  if (!user) {
    console.log("No user is currently logged in");
    return null;
  }
  return user;
}

/**
 * Get user data from Firestore
 * @param {string} userId - The ID of the user to fetch
 * @returns {Promise<Object|null>} The user's data or null if not found
 */
async function getUserData(userId) {
  try {
    // Check if user is authenticated
    const currentUser = getCurrentUser();
    if (!currentUser) {
      throw new Error("User is not authenticated");
    }

    // Verify the requested userId matches the current user
    if (userId !== currentUser.uid) {
      console.warn("Requested userId does not match current user");
      return null;
    }

    // Get the user document from Firestore
    const doc = await db.collection("users").doc(userId).get();
    
    if (!doc.exists) {
      console.log("No user data found for ID:", userId);
      return null;
    }

    const userData = doc.data();
    console.log("Retrieved user data:", userData);
    return userData;
  } catch (error) {
    console.error("Error fetching user data:", error);
    throw error;
  }
}

// Export all necessary functions and objects
export {
  auth,
  db,
  registerUser,
  loginUser,
  logoutUser,
  onAuthStateChanged,
  getCurrentUser,
  getUserData
};
