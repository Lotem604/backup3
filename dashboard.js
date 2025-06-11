// Import Firebase functions and services
import {
  auth,
  getCurrentUser,
  getUserData,
  onAuthStateChanged,
  logoutUser,
  db
} from './js/firebase-config.js';

// Wait for the DOM to be fully loaded
document.addEventListener('DOMContentLoaded', async function() {
  // Get UI elements
  const userName = document.getElementById('userName');
  const userEmail = document.getElementById('userEmail');
  const profileImage = document.getElementById('profileImage');
  const logoutBtn = document.getElementById('logoutBtn');
  const userInitiativesGrid = document.getElementById("userInitiativesGrid");

  // Check authentication state
  onAuthStateChanged(async (user) => {
    if (user) {
      try {
        // Get user data from Firestore
        const userData = await getUserData(user.uid);
        
        if (userData) {
          // Update UI with user data
          if (userName) userName.textContent = `${userData.firstName} ${userData.lastName}`;
          if (userEmail) userEmail.textContent = userData.email;
          // if (profileImage) profileImage.src = userData.profileImage || 'assets/default-avatar.png';

          // Load user's initiatives from Firestore
          console.log("Loading initiatives for user:", user.uid);
          const initiativesSnapshot = await db.collection('initiatives')
            .where('createdBy', '==', user.uid)
            .get();
          
          console.log("Query result:", initiativesSnapshot.empty ? "No initiatives found" : "Found initiatives");
          
          if (initiativesSnapshot.empty) {
            console.log("No initiatives found for user");
            userInitiativesGrid.innerHTML = `
              <div class="no-initiatives">
                <i class="fas fa-lightbulb"></i>
                <h3>אין לך יוזמות עדיין</h3>
                <p>התחל ליצור יוזמה חדשה</p>
                <a href="yozmot.html" class="btn btn-primary">צור יוזמה חדשה</a>
              </div>
            `;
          } else {
            console.log("Found initiatives, creating cards");
            userInitiativesGrid.innerHTML = ''; // Clear existing content
            
            // Convert to array, filter out deleted initiatives, and sort by createdAt
            const initiatives = [];
            initiativesSnapshot.forEach((doc) => {
              const initiative = { id: doc.id, ...doc.data() };
              // Filter out deleted initiatives
              if (initiative.status !== 'deleted') {
                initiatives.push(initiative);
              }
            });
            
            if (initiatives.length === 0) {
              userInitiativesGrid.innerHTML = `
                <div class="no-initiatives">
                  <i class="fas fa-lightbulb"></i>
                  <h3>אין לך יוזמות פעילות</h3>
                  <p>התחל ליצור יוזמה חדשה</p>
                  <a href="yozmot.html" class="btn btn-primary">צור יוזמה חדשה</a>
                </div>
              `;
              return;
            }
            
            // Sort initiatives by createdAt in descending order
            initiatives.sort((a, b) => {
              const dateA = a.createdAt?.toDate?.() || new Date(a.createdAt);
              const dateB = b.createdAt?.toDate?.() || new Date(b.createdAt);
              return dateB - dateA;
            });
            
            // Create and append cards
            initiatives.forEach(initiative => {
              console.log("Initiative data:", initiative);
              const card = createInitiativeCard(initiative);
              userInitiativesGrid.appendChild(card);
            });
          }
        }
      } catch (error) {
        console.error('Error loading user data:', error);
        userInitiativesGrid.innerHTML = `
          <div class="error-message">
            <p>אירעה שגיאה בטעינת היוזמות. אנא נסה שוב מאוחר יותר.</p>
          </div>
        `;
      }
    } else {
      // Redirect to login if not authenticated
      window.location.href = 'login.html';
    }
  });

  // Handle logout
  if (logoutBtn) {
    logoutBtn.addEventListener('click', async () => {
      try {
        await logoutUser();
        window.location.href = 'main.html';
      } catch (error) {
        console.error('Error logging out:', error);
        alert('שגיאה בהתנתקות. אנא נסה שוב.');
      }
    });
  }
});

function createInitiativeCard(initiative) {
  const card = document.createElement("div");
  card.className = "initiative-card";

  // Create card content
  const content = `
    ${
      initiative.images && initiative.images.length > 0
        ? `<img src="${initiative.images[0]}" alt="${initiative.initiativeName}" class="initiative-image">`
        : `<div class="initiative-image" style="background-color: #f0f0f0;"></div>`
    }
    <div class="initiative-content">
      <h3 class="initiative-title">${initiative.initiativeName}</h3>
      <p class="initiative-description">${initiative.shortDescription}</p>
      
      <div class="initiative-details">
        ${initiative.resourceTags
          .map((tag) => `<span class="initiative-tag">${tag}</span>`)
          .join("")}
      </div>
      
      <span class="initiative-status status-${initiative.status.toLowerCase()}">
        ${getStatusText(initiative.status)}
      </span>
      
      <div class="initiative-meta">
        <span>${initiative.location}</span>
        <span>${formatDate(initiative.date)}</span>
      </div>
    </div>
  `;

  card.innerHTML = content;
  return card;
}

function getStatusText(status) {
  const statusMap = {
    idea: "רעיון",
    active: "פעיל",
    planning: "בתכנון",
    completed: "הושלם",
  };
  return statusMap[status.toLowerCase()] || status;
}

function formatDate(dateString) {
  const options = { year: "numeric", month: "long", day: "numeric" };
  return new Date(dateString).toLocaleDateString("he-IL", options);
} 