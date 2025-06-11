import { auth, db } from './js/firebase-config.js';

document.addEventListener('DOMContentLoaded', function() {
    console.log('DOM Content Loaded');
    
    // Initialize Firebase Storage
    const storage = firebase.storage();
    
    // Check authentication state
    auth.onAuthStateChanged((user) => {
        console.log('Auth state changed:', user ? 'User logged in' : 'No user');
        
        if (!user) {
            // Redirect to login if not authenticated
            window.location.href = 'login.html';
            return;
        }

        const form = document.getElementById('organizationSignupForm');
        const imageInput = document.getElementById('orgImage');
        const imagePreview = document.querySelector('.image-preview');
        const descriptionTextarea = document.getElementById('orgDescription');
        const charCount = document.getElementById('charCount');
        const cancelBtn = document.querySelector('.cancel-btn');
        const submitBtn = document.querySelector('.submit-btn');

        // Handle image preview
        imageInput.addEventListener('change', function(e) {
            const file = e.target.files[0];
            if (file) {
                const reader = new FileReader();
                reader.onload = function(e) {
                    imagePreview.innerHTML = `
                        <img src="${e.target.result}" alt="תמונת הארגון" style="max-width: 100%; max-height: 200px; object-fit: contain;">
                    `;
                };
                reader.readAsDataURL(file);
            }
        });

        // Handle character count for description
        descriptionTextarea.addEventListener('input', function() {
            const currentLength = this.value.length;
            charCount.textContent = currentLength;
            
            if (currentLength > 500) {
                this.value = this.value.substring(0, 500);
                charCount.textContent = 500;
            }
        });

        // Handle form submission
        form.addEventListener('submit', async function(e) {
            e.preventDefault();
            console.log('Form submission started');
            
            if (!auth.currentUser) {
                alert('יש להתחבר מחדש למערכת');
                window.location.href = 'login.html';
                return;
            }

            submitBtn.disabled = true;
            submitBtn.textContent = 'שולח...';

            try {
                const formData = new FormData(form);
                const imageFile = formData.get('orgImage');
                
                if (!imageFile) {
                    throw new Error('יש להעלות תמונה');
                }

                // Validate file size (max 5MB)
                if (imageFile.size > 5 * 1024 * 1024) {
                    throw new Error('גודל התמונה חייב להיות קטן מ-5MB');
                }

                // Validate file type
                if (!imageFile.type.startsWith('image/')) {
                    throw new Error('הקובץ חייב להיות תמונה');
                }

                // Convert image to base64 for storage in Firestore
                console.log('Converting image to base64');
                const imageBase64 = await new Promise((resolve, reject) => {
                    const reader = new FileReader();
                    reader.onload = (e) => resolve(e.target.result);
                    reader.onerror = (e) => reject(new Error('שגיאה בקריאת התמונה'));
                    reader.readAsDataURL(imageFile);
                });

                console.log('Creating organization data object');
                // Create organization data object
                const organizationData = {
                    name: formData.get('orgName'),
                    type: formData.get('orgType'),
                    contactName: formData.get('contactName'),
                    contactEmail: formData.get('contactEmail'),
                    contactPhone: formData.get('contactPhone'),
                    description: formData.get('orgDescription'),
                    image: imageBase64,
                    createdAt: new Date(),
                    createdBy: auth.currentUser.uid,
                    status: 'active',
                    lastUpdated: new Date()
                };

                console.log('Saving to Firebase');
                // Save to Firebase
                const docRef = await db.collection('organizations').add(organizationData);
                console.log('Organization saved with ID:', docRef.id);

                // Show success message
                alert('הארגון נרשם בהצלחה!');
                
                // Reset form
                form.reset();
                imagePreview.innerHTML = '';
                charCount.textContent = '0';
                
                // Redirect to organizations page
                window.location.href = 'organizations.html';
            } catch (error) {
                console.error('Error submitting form:', error);
                let errorMessage = 'אירעה שגיאה בשליחת הטופס. אנא נסה שוב.';
                
                if (error.code === 'permission-denied') {
                    errorMessage = 'אין לך הרשאות ליצור ארגון. אנא התחבר מחדש.';
                    // Redirect to login page
                    window.location.href = 'login.html';
                } else if (error.message) {
                    errorMessage = error.message;
                }
                
                alert(errorMessage);
            } finally {
                submitBtn.disabled = false;
                submitBtn.textContent = 'שלח טופס';
            }
        });

        // Handle cancel button
        cancelBtn.addEventListener('click', function() {
            if (confirm('האם אתה בטוח שברצונך לבטל? כל המידע שהוזן יימחק.')) {
                form.reset();
                imagePreview.innerHTML = '';
                charCount.textContent = '0';
            }
        });

        // Phone number validation and formatting
        const phoneInput = document.getElementById('contactPhone');
        phoneInput.addEventListener('input', function(e) {
            let value = e.target.value.replace(/\D/g, '');
            if (value.length > 0) {
                value = value.match(/.{1,3}/g).join('-');
            }
            e.target.value = value;
        });
    });
}); 