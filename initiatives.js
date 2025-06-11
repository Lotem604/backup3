import { db } from './js/firebase-config.js';

let allInitiatives = [];

document.addEventListener("DOMContentLoaded", function () {
  const initiativesGrid = document.getElementById("initiativesGrid");
  const searchInput = document.getElementById("searchInput");

  // Load initiatives immediately without auth check
  loadInitiatives();

  // Add search functionality
  searchInput.addEventListener('input', (e) => {
    const searchTerm = e.target.value.toLowerCase();
    const filteredInitiatives = allInitiatives.filter(initiative => {
      return (
        initiative.initiativeName.toLowerCase().includes(searchTerm) ||
        initiative.shortDescription.toLowerCase().includes(searchTerm) ||
        initiative.categories.some(category => category.toLowerCase().includes(searchTerm)) ||
        initiative.resourceTags.some(tag => tag.toLowerCase().includes(searchTerm)) ||
        initiative.location.toLowerCase().includes(searchTerm)
      );
    });
    displayInitiatives(filteredInitiatives);
  });
});

function loadInitiatives() {
  const initiativesGrid = document.getElementById("initiativesGrid");
  
  // Load initiatives from Firestore
  db.collection('initiatives')
    .orderBy('createdAt', 'desc')
    .get()
    .then((querySnapshot) => {
      if (querySnapshot.empty) {
        initiativesGrid.innerHTML = `
          <div class="no-initiatives">
            <i class="fas fa-lightbulb"></i>
            <h3>אין יוזמות עדיין</h3>
            <p>היה הראשון ליצור יוזמה חדשה</p>
            <a href="yozmot.html" class="btn btn-primary">צור יוזמה חדשה</a>
          </div>
        `;
        return;
      }

      allInitiatives = [];
      querySnapshot.forEach((doc) => {
        const initiative = { id: doc.id, ...doc.data() };
        allInitiatives.push(initiative);
      });
      
      displayInitiatives(allInitiatives);
    })
    .catch((error) => {
      console.error("Error loading initiatives:", error);
      initiativesGrid.innerHTML = `
        <div class="error-message">
          <p>אירעה שגיאה בטעינת היוזמות. אנא נסה שוב מאוחר יותר.</p>
          <p>אם הבעיה נמשכת, אנא התנתק והתחבר מחדש.</p>
        </div>
      `;
    });
}

function displayInitiatives(initiatives) {
  const initiativesGrid = document.getElementById("initiativesGrid");
  initiativesGrid.innerHTML = '';
  
  if (initiatives.length === 0) {
    initiativesGrid.innerHTML = `
      <div class="no-initiatives">
        <i class="fas fa-search"></i>
        <h3>לא נמצאו יוזמות</h3>
        <p>נסה לחפש במילים אחרות</p>
      </div>
    `;
    return;
  }

  initiatives.forEach(initiative => {
    const card = createInitiativeCard(initiative);
    initiativesGrid.appendChild(card);
  });
}

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
            <h3 class="initiative-title">${initiative.initiativeName || 'שם לא זמין'}</h3>
            <p class="initiative-description">${initiative.shortDescription || 'אין תיאור זמין'}</p>
            
            <div class="initiative-details">
                ${(initiative.categories || [])
                  .map(
                    (category) =>
                      `<span class="initiative-tag">${category}</span>`
                  )
                  .join("")}
            </div>
            
            <div class="initiative-details">
                ${(initiative.resourceTags || [])
                  .map((tag) => `<span class="initiative-tag">${tag}</span>`)
                  .join("")}
            </div>
            
            <span class="initiative-status status-${(initiative.status || 'idea').toLowerCase()}">
                ${getStatusText(initiative.status || 'idea')}
            </span>
            
            <div class="initiative-meta">
                <span>${initiative.location || 'מיקום לא זמין'}</span>
                <span>${initiative.date ? formatDate(initiative.date) : 'תאריך לא זמין'}</span>
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
