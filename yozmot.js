import { auth, db } from './js/firebase-config.js';

document.addEventListener("DOMContentLoaded", function () {
  // Check authentication state
  auth.onAuthStateChanged((user) => {
    if (!user) {
      // Redirect to login if not authenticated
      window.location.href = 'login.html';
      return;
    }

    // Initialize form elements only after confirming user is authenticated
    const form = document.getElementById("initiativeForm");
    const shortDescription = document.getElementById("shortDescription");
    const aboutMe = document.getElementById("aboutMe");
    const charCount = document.getElementById("charCount");
    const aboutMeCharCount = document.getElementById("aboutMeCharCount");
    const imageUpload = document.getElementById("imageUpload");
    const imagePreview = document.getElementById("imagePreview");
    const submitBtn = document.querySelector(".submit-btn");
    const nextBtn = document.querySelector(".next-btn");
    const prevBtn = document.querySelector(".prev-btn");
    const progressSteps = document.querySelectorAll(".progress-step");
    const formSteps = document.querySelectorAll(".form-step");

    let currentStep = 1;

    // Character counter for short description
    shortDescription.addEventListener("input", function () {
      const remaining = 200 - this.value.length;
      charCount.textContent = this.value.length;
      charCount.style.color = remaining < 50 ? "#e53935" : "#666";
    });

    // Character counter for about me
    aboutMe.addEventListener("input", function () {
      const remaining = 500 - this.value.length;
      aboutMeCharCount.textContent = this.value.length;
      aboutMeCharCount.style.color = remaining < 100 ? "#e53935" : "#666";
    });

    // Image upload preview
    imageUpload.addEventListener("change", function (e) {
      imagePreview.innerHTML = "";
      const files = Array.from(e.target.files);

      files.forEach((file) => {
        if (file.type.startsWith("image/")) {
          const reader = new FileReader();
          reader.onload = function (e) {
            const img = document.createElement("img");
            img.src = e.target.result;
            img.style.maxWidth = "200px";
            img.style.maxHeight = "200px";
            img.style.objectFit = "cover";
            img.style.margin = "5px";
            img.style.borderRadius = "4px";
            imagePreview.appendChild(img);
          };
          reader.readAsDataURL(file);
        }
      });
    });

    // Navigation between steps
    function updateStep(step) {
      formSteps.forEach((formStep) => {
        formStep.classList.remove("active");
      });
      progressSteps.forEach((progressStep) => {
        progressStep.classList.remove("active");
      });

      document.querySelector(`.form-step[data-step="${step}"]`).classList.add("active");
      document.querySelector(`.progress-step[data-step="${step}"]`).classList.add("active");

      // Update navigation buttons
      prevBtn.style.display = step > 1 ? "block" : "none";
      nextBtn.style.display = step < 3 ? "block" : "none";
      submitBtn.style.display = step === 3 ? "block" : "none";

      // Mark previous steps as completed
      for (let i = 1; i < step; i++) {
        document.querySelector(`.progress-step[data-step="${i}"]`).classList.add("completed");
      }
    }

    // Helper function to show error message
    function showError(input, message) {
      const formGroup = input.closest('.form-group');
      const errorDiv = formGroup.querySelector('.error-message') || document.createElement('div');
      errorDiv.className = 'error-message';
      errorDiv.textContent = message;
      if (!formGroup.querySelector('.error-message')) {
        formGroup.appendChild(errorDiv);
      }
      input.classList.add('error');
    }

    // Helper function to clear error message
    function clearError(input) {
      const formGroup = input.closest('.form-group');
      const errorDiv = formGroup.querySelector('.error-message');
      if (errorDiv) {
        errorDiv.remove();
      }
      input.classList.remove('error');
    }

    // Validate current step
    function validateStep(step) {
      let isValid = true;
      const currentStep = formSteps[step - 1];
      const inputs = currentStep.querySelectorAll('input[required], textarea[required], select[required]');
      const checkboxes = currentStep.querySelectorAll('input[type="checkbox"][name="resource"]');

      // Clear all previous errors in this step
      currentStep.querySelectorAll('.error-message').forEach(error => error.remove());
      currentStep.querySelectorAll('.error').forEach(input => input.classList.remove('error'));

      // Validate required inputs
      inputs.forEach(input => {
        if (!input.value.trim()) {
          let errorMessage = 'שדה זה הוא שדה חובה';
          
          // Custom error messages based on field type and ID
          switch(input.id) {
            case 'initiativeName':
              errorMessage = 'יש להזין את שם היוזמה';
              break;
            case 'date':
              errorMessage = 'יש לבחור תאריך התחלה';
              break;
            case 'shortDescription':
              errorMessage = 'יש להזין תיאור קצר של היוזמה';
              break;
            case 'resources':
              errorMessage = 'יש להזין את המשאבים הנדרשים';
              break;
            case 'status':
              errorMessage = 'יש לבחור סטטוס לפרויקט';
              break;
            case 'location':
              errorMessage = 'יש לבחור מיקום';
              break;
            case 'fullName':
              errorMessage = 'יש להזין שם מלא';
              break;
            case 'phone':
              errorMessage = 'יש להזין מספר טלפון';
              break;
            case 'email':
              errorMessage = 'יש להזין כתובת אימייל';
              break;
          }
          
          showError(input, errorMessage);
          isValid = false;
        } else {
          clearError(input);
        }
      });

      // Validate email format if email field exists
      const emailInput = currentStep.querySelector('input[type="email"]');
      if (emailInput && emailInput.value.trim()) {
        if (!isValidEmail(emailInput.value)) {
          showError(emailInput, 'כתובת האימייל שהוזנה אינה תקינה');
          isValid = false;
        }
      }

      // Validate phone format if phone field exists
      const phoneInput = currentStep.querySelector('input[type="tel"]');
      if (phoneInput && phoneInput.value.trim()) {
        if (!isValidPhone(phoneInput.value)) {
          showError(phoneInput, 'מספר הטלפון שהוזן אינו תקין');
          isValid = false;
        }
      }

      // Validate resource checkboxes in step 2
      if (step === 2) {
        const checkedResources = Array.from(checkboxes).filter(cb => cb.checked);
        if (checkedResources.length === 0) {
          const resourceGroup = checkboxes[0].closest('.form-group');
          const errorDiv = resourceGroup.querySelector('.error-message') || document.createElement('div');
          errorDiv.className = 'error-message';
          errorDiv.textContent = 'יש לבחור לפחות תגית משאב אחת';
          if (!resourceGroup.querySelector('.error-message')) {
            resourceGroup.appendChild(errorDiv);
          }
          isValid = false;
        } else {
          const errorDiv = checkboxes[0].closest('.form-group').querySelector('.error-message');
          if (errorDiv) {
            errorDiv.remove();
          }
        }
      }

      // Validate short description length
      const shortDescInput = currentStep.querySelector('#shortDescription');
      if (shortDescInput && shortDescInput.value.trim()) {
        if (shortDescInput.value.length < 10) {
          showError(shortDescInput, 'התיאור הקצר חייב להכיל לפחות 10 תווים');
          isValid = false;
        }
      }

      // Validate about me length if it exists and has content
      const aboutMeInput = currentStep.querySelector('#aboutMe');
      if (aboutMeInput && aboutMeInput.value.trim()) {
        if (aboutMeInput.value.length < 20) {
          showError(aboutMeInput, 'התיאור חייב להכיל לפחות 20 תווים');
          isValid = false;
        }
      }

      return isValid;
    }

    // Next button click
    nextBtn.addEventListener("click", () => {
      if (validateStep(currentStep)) {
        currentStep++;
        updateStep(currentStep);
      }
    });

    // Previous button click
    prevBtn.addEventListener("click", () => {
      currentStep--;
      updateStep(currentStep);
    });

    // Progress step click
    progressSteps.forEach((step) => {
      step.addEventListener("click", () => {
        const stepNumber = parseInt(step.dataset.step);
        if (stepNumber < currentStep) {
          currentStep = stepNumber;
          updateStep(currentStep);
        }
      });
    });

    // Form submission
    form.addEventListener("submit", async (e) => {
      e.preventDefault();
      
      if (!validateStep(currentStep)) {
        return;
      }

      // Show loading state
      submitBtn.disabled = true;
      submitBtn.textContent = "שומר יוזמה...";

      try {
        // Validate user authentication
        if (!auth.currentUser) {
          throw new Error("משתמש לא מחובר. אנא התחבר מחדש.");
        }

        // Get all form data
        const formData = {
          initiativeName: document.getElementById("initiativeName").value.trim(),
          date: document.getElementById("date").value,
          shortDescription: document.getElementById("shortDescription").value.trim(),
          resources: document.getElementById("resources").value.trim(),
          resourceTags: Array.from(document.querySelectorAll('input[name="resource"]:checked')).map(cb => cb.value),
          status: document.getElementById("status").value,
          location: document.getElementById("location").value,
          fullName: document.getElementById("fullName").value.trim(),
          phone: document.getElementById("phone").value.trim(),
          email: document.getElementById("email").value.trim(),
          aboutMe: document.getElementById("aboutMe").value.trim(),
          createdAt: new Date(),
          createdBy: auth.currentUser.uid
        };

        // Validate required fields
        const requiredFields = ['initiativeName', 'date', 'shortDescription', 'resources', 'status', 'location', 'fullName', 'phone', 'email'];
        const missingFields = requiredFields.filter(field => !formData[field]);
        
        if (missingFields.length > 0) {
          throw new Error(`חסרים שדות חובה: ${missingFields.join(', ')}`);
        }

        // Save to Firestore
        console.log("Attempting to save initiative...");
        await saveInitiative(formData);
        
        // Show success message and redirect
        showSuccessMessage();
        setTimeout(() => {
          window.location.href = "initiatives.html";
        }, 2000);
      } catch (error) {
        console.error("Error saving initiative:", error);
        alert(error.message || "אירעה שגיאה בשמירת היוזמה. אנא נסה שוב.");
      } finally {
        submitBtn.disabled = false;
        submitBtn.textContent = "פרסם יוזמה";
      }
    });

    // Cancel button
    const cancelBtn = document.querySelector(".cancel-btn");
    if (cancelBtn) {
      cancelBtn.addEventListener("click", function () {
        if (confirm("האם אתה בטוח שברצונך לבטל?")) {
          window.location.href = "main.html";
        }
      });
    }

    // Helper functions
    function showSuccessMessage() {
      const successDiv = document.createElement("div");
      successDiv.className = "success-message";
      successDiv.innerHTML = `
        <i class="fas fa-check-circle"></i>
        <h3>היוזמה נשמרה בהצלחה!</h3>
        <p>אתה מועבר לדף היוזמות...</p>
      `;
      form.innerHTML = "";
      form.appendChild(successDiv);
    }

    function isValidEmail(email) {
      const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      return re.test(email);
    }

    function isValidPhone(phone) {
      const re = /^[0-9]{9,10}$/;
      return re.test(phone.replace(/[^0-9]/g, ''));
    }

    // Add smooth scrolling to form sections
    document.querySelectorAll("h2").forEach((heading) => {
      heading.style.cursor = "pointer";
      heading.addEventListener("click", () => {
        heading.scrollIntoView({ behavior: "smooth", block: "start" });
      });
    });

    // Add hover effect to form sections
    document.querySelectorAll(".form-section").forEach((section) => {
      section.addEventListener("mouseenter", () => {
        section.style.transform = "translateY(-2px)";
      });
      
      section.addEventListener("mouseleave", () => {
        section.style.transform = "translateY(0)";
      });
    });

    // Initialize first step
    updateStep(1);
  });
});

async function saveInitiative(data) {
  try {
    console.log("Attempting to save initiative with data:", data);
    
    // Validate required fields
    const requiredFields = ['initiativeName', 'date', 'shortDescription', 'resources', 'status', 'location', 'fullName', 'phone', 'email'];
    const missingFields = requiredFields.filter(field => !data[field]);
    
    if (missingFields.length > 0) {
      throw new Error(`Missing required fields: ${missingFields.join(', ')}`);
    }

    // Validate user authentication
    if (!auth.currentUser) {
      throw new Error('User must be authenticated to save an initiative');
    }

    // Add metadata
    const initiativeData = {
      ...data,
      createdAt: firebase.firestore.FieldValue.serverTimestamp(),
      createdBy: auth.currentUser.uid,
      lastUpdated: firebase.firestore.FieldValue.serverTimestamp()
    };

    console.log("Saving initiative to Firestore with data:", initiativeData);
    const docRef = await db.collection('initiatives').add(initiativeData);
    console.log("Initiative saved successfully with ID:", docRef.id);
    
    return docRef.id;
  } catch (error) {
    console.error("Error saving initiative:", {
      error: error,
      message: error.message,
      code: error.code,
      stack: error.stack
    });
    throw error;
  }
}
