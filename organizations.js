// Remove hardcoded organizations array and add Firestore fetching
let organizations = [];

// Function to fetch organizations from Firestore
async function fetchOrganizations() {
  try {
    const organizationsSnapshot = await firebase.firestore().collection('organizations').get();
    organizations = organizationsSnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    }));
    console.log('Fetched organizations:', organizations); // Debug log
    filterResults(); // Display results after fetching
  } catch (error) {
    console.error("Error fetching organizations:", error);
    // Display error message to user
    resultsGrid.innerHTML = '<div class="error-message">שגיאה בטעינת הארגונים. אנא נסה שוב מאוחר יותר.</div>';
  }
}

// Call fetchOrganizations when the page loads
document.addEventListener('DOMContentLoaded', fetchOrganizations);

// DOM Elements
const searchInput = document.getElementById("searchInput");
const categoryFilter = document.getElementById("categoryFilter");
const locationFilter = document.getElementById("locationFilter");
const activityFilter = document.getElementById("activityFilter");
const sortFilter = document.getElementById("sortFilter");
const resultsGrid = document.getElementById("resultsGrid");
const resultsCount = document.getElementById("resultsCount");
const viewButtons = document.querySelectorAll(".view-btn");

// Event Listeners
searchInput.addEventListener("input", filterResults);
categoryFilter.addEventListener("change", filterResults);
locationFilter.addEventListener("change", filterResults);
activityFilter.addEventListener("change", filterResults);
sortFilter.addEventListener("change", filterResults);

viewButtons.forEach((button) => {
  button.addEventListener("click", () => {
    viewButtons.forEach((btn) => btn.classList.remove("active"));
    button.classList.add("active");
    resultsGrid.classList.toggle("list-view", button.dataset.view === "list");
  });
});

// Filter and display results
function filterResults() {
  const searchTerm = searchInput.value.toLowerCase();
  const category = categoryFilter.value;
  const location = locationFilter.value;
  const activity = activityFilter.value;
  const sortBy = sortFilter.value;

  let filteredResults = organizations.filter((org) => {
    const matchesSearch =
      org.name.toLowerCase().includes(searchTerm) ||
      org.description.toLowerCase().includes(searchTerm);
    const matchesCategory = !category || org.category === category;
    const matchesLocation = !location || org.location === location;
    const matchesActivity = !activity || org.activity === activity;

    return (
      matchesSearch && matchesCategory && matchesLocation && matchesActivity
    );
  });

  // Sort results
  filteredResults.sort((a, b) => {
    switch (sortBy) {
      case "name":
        return a.name.localeCompare(b.name);
      case "rating":
        return b.rating - a.rating;
      case "newest":
        return new Date(b.date) - new Date(a.date);
      case "oldest":
        return new Date(a.date) - new Date(b.date);
      default:
        return 0;
    }
  });

  displayResults(filteredResults);
}

// Function to translate type to Hebrew
function translateType(type) {
  if (!type) return 'לא צוין';
  
  const typeTranslations = {
    'educational': 'חינוכי',
    'social': 'חברתי',
    'cultural': 'תרבותי',
    'sports': 'ספורטיבי',
    'environmental': 'סביבתי',
    'health': 'בריאות',
    'youth': 'נוער',
    'community': 'קהילתי',
    'religious': 'דתי',
    'welfare': 'רווחה',
    'animals': 'בעלי חיים',
    'art': 'אמנות',
    'music': 'מוזיקה',
    'technology': 'טכנולוגיה',
    'business': 'עסקי',
    'medical': 'רפואי',
    'research': 'מחקר',
    'agricultural': 'חקלאי',
    'tourism': 'תיירות',
    'security': 'ביטחון',
    'nonprofit': 'ללא מטרות רווח'
  }

  return typeTranslations[type.toLowerCase()] || type;
}

// Display results
function displayResults(results) {
  resultsCount.textContent = `${results.length} תוצאות נמצאו`;

  resultsGrid.innerHTML = results
    .map(
      (org) => `
        <div class="result-card">
            <img src="${org.image}" alt="${org.name}">
            <div class="result-content">
                <h3>${org.name}</h3>
                <p>${org.description}</p>
                <div class="result-tags">
                    <span class="tag">${translateType(org.type)}</span>
                </div>
            </div>
        </div>
    `
    )
    .join("");
}

// Initial display
filterResults();
