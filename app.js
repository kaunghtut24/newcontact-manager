// AI Contact Management System
class ContactManager {
    constructor() {
        this.db = null;
        this.currentContact = null;
        this.contacts = [];
        this.filteredContacts = [];
        this.currentView = 'dashboard';
        this.ocrWorker = null;
        this.currentSearchTerm = '';
        this.currentCategoryFilter = '';
        
        this.init();
    }

    async init() {
        await this.initDB();
        await this.loadContacts();
        this.initEventListeners();
        this.initTheme();
        this.showView('dashboard');
        this.updateDashboard();
        
        // Load sample data if no contacts exist
        if (this.contacts.length === 0) {
            await this.loadSampleData();
        }
    }

    // Database Management
    async initDB() {
        return new Promise((resolve, reject) => {
            const request = indexedDB.open('ContactManagerDB', 1);
            
            request.onerror = () => reject(request.error);
            request.onsuccess = () => {
                this.db = request.result;
                resolve();
            };
            
            request.onupgradeneeded = (event) => {
                const db = event.target.result;
                
                if (!db.objectStoreNames.contains('contacts')) {
                    const contactStore = db.createObjectStore('contacts', { keyPath: 'id' });
                    contactStore.createIndex('name', ['firstName', 'lastName']);
                    contactStore.createIndex('company', 'company');
                    contactStore.createIndex('email', 'emails.email');
                    contactStore.createIndex('category', 'category');
                }
                
                if (!db.objectStoreNames.contains('settings')) {
                    db.createObjectStore('settings', { keyPath: 'key' });
                }
            };
        });
    }

    async loadContacts() {
        return new Promise((resolve, reject) => {
            const transaction = this.db.transaction(['contacts'], 'readonly');
            const store = transaction.objectStore('contacts');
            const request = store.getAll();
            
            request.onsuccess = () => {
                this.contacts = request.result;
                this.applyFilters();
                resolve();
            };
            request.onerror = () => reject(request.error);
        });
    }

    async saveContact(contact) {
        console.log('💾 saveContact called with:', contact);

        // Generate ID if new contact
        if (!contact.id) {
            contact.id = 'contact_' + Date.now() + '_' + Math.random().toString(36).substring(2, 11);
        }

        // Set timestamps
        const now = new Date().toISOString().split('T')[0];
        if (!contact.createdDate) {
            contact.createdDate = now;
        }
        contact.lastUpdated = now;

        // Generate full name
        contact.fullName = `${contact.firstName || ''} ${contact.lastName || ''}`.trim();

        console.log('📝 Prepared contact for saving:', contact);
        
        return new Promise((resolve, reject) => {
            const transaction = this.db.transaction(['contacts'], 'readwrite');
            const store = transaction.objectStore('contacts');
            const request = store.put(contact);
            
            request.onsuccess = async () => {
                await this.loadContacts();
                this.showToast('Contact saved successfully', 'success');
                resolve(contact);
            };
            request.onerror = () => {
                this.showToast('Failed to save contact', 'error');
                reject(request.error);
            };
        });
    }

    async deleteContact(contactId) {
        return new Promise((resolve, reject) => {
            const transaction = this.db.transaction(['contacts'], 'readwrite');
            const store = transaction.objectStore('contacts');
            const request = store.delete(contactId);
            
            request.onsuccess = async () => {
                await this.loadContacts();
                this.showToast('Contact deleted successfully', 'success');
                resolve();
            };
            request.onerror = () => {
                this.showToast('Failed to delete contact', 'error');
                reject(request.error);
            };
        });
    }

    async loadSampleData() {
        const sampleContacts = [
            {
                firstName: "John",
                lastName: "Doe",
                phoneNumbers: [
                    {type: "work", number: "+1-555-123-4567"},
                    {type: "mobile", number: "+1-555-987-6543"}
                ],
                emails: [
                    {type: "work", email: "john.doe@company.com"},
                    {type: "personal", email: "john@example.com"}
                ],
                company: "Tech Solutions Inc",
                jobTitle: "Senior Software Engineer",
                address: {
                    street: "123 Main Street",
                    city: "San Francisco",
                    state: "CA",
                    zipCode: "94105",
                    country: "USA"
                },
                website: "https://johndoe.dev",
                notes: "Met at tech conference 2024. Interested in AI solutions.",
                tags: ["developer", "ai", "conference"],
                category: "professional"
            },
            {
                firstName: "Sarah",
                lastName: "Johnson",
                phoneNumbers: [
                    {type: "work", number: "+1-555-234-5678"}
                ],
                emails: [
                    {type: "work", email: "sarah.johnson@marketing.com"}
                ],
                company: "Digital Marketing Pro",
                jobTitle: "Marketing Director",
                address: {
                    street: "456 Business Ave",
                    city: "New York",
                    state: "NY",
                    zipCode: "10001",
                    country: "USA"
                },
                website: "https://digitalmarketingpro.com",
                notes: "Potential collaboration partner for marketing campaigns",
                tags: ["marketing", "collaboration"],
                category: "business"
            }
        ];

        for (const contact of sampleContacts) {
            await this.saveContact(contact);
        }
    }

    // Event Listeners
    initEventListeners() {
        // Mobile navigation
        this.initMobileNavigation();

        // Navigation
        document.querySelectorAll('.nav-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const view = e.target.closest('.nav-btn').dataset.view;
                this.showView(view);
                this.closeMobileMenu(); // Close mobile menu after navigation
            });
        });

        // Quick actions
        document.querySelectorAll('[data-action]').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const action = e.target.closest('[data-action]').dataset.action;
                this.handleQuickAction(action);
            });
        });

        // Add contact form
        document.getElementById('add-contact-form').addEventListener('submit', (e) => {
            e.preventDefault();
            this.handleAddContact(e.target);
        });

        // Dynamic form fields
        document.getElementById('phone-numbers').addEventListener('click', (e) => {
            if (e.target.classList.contains('add-phone')) {
                this.addPhoneField();
            }
        });

        document.getElementById('email-addresses').addEventListener('click', (e) => {
            if (e.target.classList.contains('add-email')) {
                this.addEmailField();
            }
        });

        // Clear form
        document.getElementById('clear-form').addEventListener('click', () => {
            this.clearAddContactForm();
        });

        // Search and filter - Fixed implementation with debouncing
        const searchInput = document.getElementById('contact-search');
        if (searchInput) {
            let searchTimeout;
            searchInput.addEventListener('input', (e) => {
                clearTimeout(searchTimeout);
                searchTimeout = setTimeout(() => {
                    this.currentSearchTerm = e.target.value.trim();
                    this.applyFilters();
                    if (this.currentView === 'contacts') {
                        this.renderContactsList();
                    }
                }, 300); // Debounce for better performance
            });
        }

        const categoryFilter = document.getElementById('category-filter');
        if (categoryFilter) {
            categoryFilter.addEventListener('change', (e) => {
                this.currentCategoryFilter = e.target.value;
                this.applyFilters();
                if (this.currentView === 'contacts') {
                    this.renderContactsList();
                }
            });
        }

        // File upload for card scanning
        document.getElementById('upload-area').addEventListener('click', () => {
            document.getElementById('card-upload').click();
        });

        document.getElementById('card-upload').addEventListener('change', (e) => {
            if (e.target.files[0]) {
                this.handleCardUpload(e.target.files[0]);
            }
        });

        // Add camera button for mobile devices
        this.addCameraButton();

        // Drag and drop
        const uploadArea = document.getElementById('upload-area');
        uploadArea.addEventListener('dragover', (e) => {
            e.preventDefault();
            uploadArea.classList.add('dragover');
        });

        uploadArea.addEventListener('dragleave', () => {
            uploadArea.classList.remove('dragover');
        });

        uploadArea.addEventListener('drop', (e) => {
            e.preventDefault();
            uploadArea.classList.remove('dragover');
            if (e.dataTransfer.files[0]) {
                this.handleCardUpload(e.dataTransfer.files[0]);
            }
        });

        // Scan results actions
        document.getElementById('save-scanned-contact').addEventListener('click', () => {
            this.saveScannedContact();
        });

        document.getElementById('scan-another').addEventListener('click', () => {
            this.resetScanInterface();
        });

        // Import/Export
        document.getElementById('select-import-file').addEventListener('click', () => {
            document.getElementById('import-file').click();
        });

        document.getElementById('import-file').addEventListener('change', (e) => {
            if (e.target.files[0]) {
                this.handleImportFile(e.target.files[0]);
            }
        });

        document.getElementById('export-all').addEventListener('click', () => {
            this.exportContacts('all');
        });

        // Modal events
        document.addEventListener('click', (e) => {
            // Close modal when clicking outside or on close button
            if (e.target.id === 'contact-modal') {
                this.closeModal();
            } else if (e.target.classList.contains('modal-close')) {
                this.closeModal();
            }
        });

        // Use event delegation for modal buttons to ensure they work even when modal is hidden
        document.addEventListener('click', (e) => {
            if (e.target.id === 'edit-contact') {
                this.handleEditContact();
            } else if (e.target.id === 'delete-contact') {
                this.handleDeleteContact();
            } else if (e.target.id === 'share-contact') {
                this.shareContact(this.currentContact);
            }
        });

        // Theme switching
        document.querySelectorAll('input[name="theme"]').forEach(radio => {
            radio.addEventListener('change', (e) => {
                this.setTheme(e.target.value);
            });
        });

        // Settings actions
        document.getElementById('clear-all-data').addEventListener('click', () => {
            this.clearAllData();
        });

        document.getElementById('export-backup').addEventListener('click', () => {
            this.exportBackup();
        });
    }

    // Mobile Navigation
    initMobileNavigation() {
        const mobileToggle = document.getElementById('mobile-menu-toggle');
        const mobileOverlay = document.getElementById('mobile-overlay');

        if (mobileToggle) {
            mobileToggle.addEventListener('click', () => {
                this.toggleMobileMenu();
            });
        }

        if (mobileOverlay) {
            mobileOverlay.addEventListener('click', () => {
                this.closeMobileMenu();
            });
        }

        // Close menu on escape key
        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape') {
                this.closeMobileMenu();
            }
        });

        // Handle swipe gestures for mobile menu
        this.initSwipeGestures();
    }

    toggleMobileMenu() {
        const sidebar = document.querySelector('.sidebar');
        const overlay = document.getElementById('mobile-overlay');
        const toggle = document.getElementById('mobile-menu-toggle');

        if (sidebar) sidebar.classList.toggle('open');
        if (overlay) overlay.classList.toggle('active');
        if (toggle) toggle.classList.toggle('active');

        // Prevent body scroll when menu is open
        if (sidebar.classList.contains('open')) {
            document.body.style.overflow = 'hidden';
        } else {
            document.body.style.overflow = '';
        }
    }

    closeMobileMenu() {
        const sidebar = document.querySelector('.sidebar');
        const overlay = document.getElementById('mobile-overlay');
        const toggle = document.getElementById('mobile-menu-toggle');

        if (sidebar) sidebar.classList.remove('open');
        if (overlay) overlay.classList.remove('active');
        if (toggle) toggle.classList.remove('active');
        document.body.style.overflow = '';
    }

    initSwipeGestures() {
        let startX = 0;
        let startY = 0;
        let isSwipeActive = false;

        document.addEventListener('touchstart', (e) => {
            startX = e.touches[0].clientX;
            startY = e.touches[0].clientY;
            isSwipeActive = true;
        }, { passive: true });

        document.addEventListener('touchmove', (e) => {
            if (!isSwipeActive) return;

            const currentX = e.touches[0].clientX;
            const currentY = e.touches[0].clientY;
            const diffX = currentX - startX;
            const diffY = currentY - startY;

            // Only handle horizontal swipes
            if (Math.abs(diffY) > Math.abs(diffX)) {
                isSwipeActive = false;
                return;
            }

            // Swipe right from left edge to open menu
            if (startX < 50 && diffX > 100) {
                this.toggleMobileMenu();
                isSwipeActive = false;
            }
            // Swipe left to close menu
            else if (diffX < -100 && document.querySelector('.sidebar').classList.contains('open')) {
                this.closeMobileMenu();
                isSwipeActive = false;
            }
        }, { passive: true });

        document.addEventListener('touchend', () => {
            isSwipeActive = false;
        }, { passive: true });
    }

    // Camera functionality for mobile
    addCameraButton() {
        // Check if device has camera capability
        if (navigator.mediaDevices && navigator.mediaDevices.getUserMedia) {
            const uploadContent = document.querySelector('.upload-content');
            if (uploadContent) {
                const cameraButton = document.createElement('button');
                cameraButton.className = 'btn btn--outline camera-btn';
                cameraButton.innerHTML = '<span>📱</span>Use Camera';
                cameraButton.style.marginTop = 'var(--space-12)';

                cameraButton.addEventListener('click', (e) => {
                    e.stopPropagation();
                    this.openCamera();
                });

                uploadContent.appendChild(cameraButton);
            }
        }
    }

    async openCamera() {
        try {
            // Create camera interface
            const cameraModal = document.createElement('div');
            cameraModal.className = 'camera-modal';
            cameraModal.innerHTML = `
                <div class="camera-content">
                    <div class="camera-header">
                        <h3>Scan Business Card</h3>
                        <button class="camera-close">&times;</button>
                    </div>
                    <video id="camera-video" class="camera-video" autoplay playsinline></video>
                    <canvas id="camera-canvas" class="camera-canvas" style="display: none;"></canvas>
                    <div class="camera-controls">
                        <button class="btn btn--primary" id="capture-btn">
                            <span>📷</span>Capture
                        </button>
                        <button class="btn btn--outline" id="camera-cancel">Cancel</button>
                    </div>
                </div>
            `;

            document.body.appendChild(cameraModal);

            // Get camera stream
            const video = document.getElementById('camera-video');
            if (!video) {
                throw new Error('Camera video element not found');
            }

            // Check if getUserMedia is supported
            if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
                throw new Error('Camera access not supported in this browser');
            }

            const stream = await navigator.mediaDevices.getUserMedia({
                video: {
                    facingMode: 'environment', // Use back camera
                    width: { ideal: 1280 },
                    height: { ideal: 720 }
                }
            });

            video.srcObject = stream;

            // Handle capture
            document.getElementById('capture-btn').addEventListener('click', () => {
                this.captureImage(video, stream);
                document.body.removeChild(cameraModal);
            });

            // Handle cancel
            const closeCamera = () => {
                stream.getTracks().forEach(track => track.stop());
                document.body.removeChild(cameraModal);
            };

            document.getElementById('camera-cancel').addEventListener('click', closeCamera);
            document.querySelector('.camera-close').addEventListener('click', closeCamera);

        } catch (error) {
            console.error('Camera access error:', error);
            this.showToast('Camera access denied or not available', 'error');
        }
    }

    captureImage(video, stream) {
        try {
            const canvas = document.getElementById('camera-canvas');
            if (!canvas) {
                throw new Error('Camera canvas not found');
            }

            const context = canvas.getContext('2d');
            if (!context) {
                throw new Error('Canvas context not available');
            }

            // Ensure video has loaded
            if (video.videoWidth === 0 || video.videoHeight === 0) {
                throw new Error('Video not ready for capture');
            }

            canvas.width = video.videoWidth;
            canvas.height = video.videoHeight;

            context.drawImage(video, 0, 0);

            // Stop camera stream
            if (stream) {
                stream.getTracks().forEach(track => track.stop());
            }

            // Convert to blob and process
            canvas.toBlob((blob) => {
                if (blob) {
                    this.handleCardUpload(blob);
                } else {
                    this.showToast('Failed to capture image', 'error');
                }
            }, 'image/jpeg', 0.8);
        } catch (error) {
            console.error('Capture error:', error);
            this.showToast('Failed to capture image: ' + error.message, 'error');

            // Stop camera stream on error
            if (stream) {
                stream.getTracks().forEach(track => track.stop());
            }
        }
    }

    // View Management
    showView(viewName) {
        console.log(`🔄 showView called: ${this.currentView} → ${viewName}`);

        // Update navigation
        document.querySelectorAll('.nav-btn').forEach(btn => btn.classList.remove('active'));
        const navBtn = document.querySelector(`[data-view="${viewName}"]`);
        if (navBtn) {
            navBtn.classList.add('active');
        }

        // Update content
        document.querySelectorAll('.view').forEach(view => view.classList.remove('active'));
        const targetView = document.getElementById(viewName);
        if (targetView) {
            targetView.classList.add('active');
            console.log(`✅ View ${viewName} activated`);
        } else {
            console.error(`❌ View element ${viewName} not found`);
        }

        this.currentView = viewName;

        // Load view-specific content
        switch (viewName) {
            case 'dashboard':
                this.updateDashboard();
                break;
            case 'contacts':
                // Reset search and category filters when entering contacts view
                const searchInput = document.getElementById('contact-search');
                const categoryFilter = document.getElementById('category-filter');
                if (searchInput) {
                    searchInput.value = this.currentSearchTerm;
                }
                if (categoryFilter) {
                    categoryFilter.value = this.currentCategoryFilter;
                }
                this.applyFilters();
                this.renderContactsList();
                break;
            case 'add-contact':
                // Only clear form if not coming from edit (which sets contactId)
                const form = document.getElementById('add-contact-form');
                if (form && !form.dataset.contactId) {
                    this.clearAddContactForm();
                }
                break;
            case 'scan-card':
                this.resetScanInterface();
                break;
        }
    }

    handleQuickAction(action) {
        switch (action) {
            case 'scan-card':
                this.showView('scan-card');
                break;
            case 'add-contact':
                this.showView('add-contact');
                break;
            case 'import':
                this.showView('import-export');
                break;
        }
    }

    // Dashboard Management
    updateDashboard() {
        document.getElementById('total-contacts').textContent = this.contacts.length;
        document.getElementById('recent-scans').textContent = 
            this.contacts.filter(c => c.source === 'scan').length || 0;
        
        const companies = new Set(this.contacts.map(c => c.company).filter(Boolean));
        document.getElementById('companies').textContent = companies.size;

        this.renderRecentContacts();
    }

    renderRecentContacts() {
        const recentContacts = this.contacts
            .sort((a, b) => new Date(b.lastUpdated) - new Date(a.lastUpdated))
            .slice(0, 6);

        const container = document.getElementById('recent-contacts');
        container.innerHTML = '';

        if (recentContacts.length === 0) {
            container.innerHTML = `
                <div class="empty-state">
                    <div class="empty-state-icon">👥</div>
                    <h3>No contacts yet</h3>
                    <p>Start by adding a contact manually or scanning a business card</p>
                </div>
            `;
            return;
        }

        recentContacts.forEach(contact => {
            container.appendChild(this.createContactCard(contact));
        });
    }

    // Contact Management with Improved Filtering
    applyFilters() {
        let filtered = [...this.contacts];

        // Apply search filter first
        if (this.currentSearchTerm && this.currentSearchTerm.length > 0) {
            const term = this.currentSearchTerm.toLowerCase();
            filtered = filtered.filter(contact => {
                // Check name
                if (contact.fullName && contact.fullName.toLowerCase().includes(term)) {
                    return true;
                }
                
                // Check first name specifically
                if (contact.firstName && contact.firstName.toLowerCase().includes(term)) {
                    return true;
                }
                
                // Check last name specifically
                if (contact.lastName && contact.lastName.toLowerCase().includes(term)) {
                    return true;
                }
                
                // Check company
                if (contact.company && contact.company.toLowerCase().includes(term)) {
                    return true;
                }
                
                // Check job title
                if (contact.jobTitle && contact.jobTitle.toLowerCase().includes(term)) {
                    return true;
                }
                
                // Check emails
                if (contact.emails && contact.emails.length > 0) {
                    for (const email of contact.emails) {
                        if (email.email && email.email.toLowerCase().includes(term)) {
                            return true;
                        }
                    }
                }
                
                // Check phone numbers
                if (contact.phoneNumbers && contact.phoneNumbers.length > 0) {
                    for (const phone of contact.phoneNumbers) {
                        if (phone.number && phone.number.includes(term)) {
                            return true;
                        }
                    }
                }
                
                // Check notes
                if (contact.notes && contact.notes.toLowerCase().includes(term)) {
                    return true;
                }
                
                return false;
            });
        }

        // Apply category filter second
        if (this.currentCategoryFilter && this.currentCategoryFilter.length > 0) {
            filtered = filtered.filter(contact => contact.category === this.currentCategoryFilter);
        }

        this.filteredContacts = filtered;
        
        // Debug logging (commented out for production)
        // console.log('Applied filters:', {
        //     searchTerm: this.currentSearchTerm,
        //     categoryFilter: this.currentCategoryFilter,
        //     totalContacts: this.contacts.length,
        //     filteredContacts: this.filteredContacts.length,
        //     filteredContactNames: this.filteredContacts.map(c => c.fullName)
        // });
    }

    renderContactsList() {
        const container = document.getElementById('contacts-list');
        container.innerHTML = '';

        if (this.filteredContacts.length === 0) {
            let emptyMessage = 'No contacts found';
            if (this.currentSearchTerm && this.currentCategoryFilter) {
                emptyMessage = `No contacts found matching "${this.currentSearchTerm}" in ${this.currentCategoryFilter} category`;
            } else if (this.currentSearchTerm) {
                emptyMessage = `No contacts found matching "${this.currentSearchTerm}"`;
            } else if (this.currentCategoryFilter) {
                emptyMessage = `No contacts found in ${this.currentCategoryFilter} category`;
            }
            
            container.innerHTML = `
                <div class="empty-state">
                    <div class="empty-state-icon">🔍</div>
                    <h3>${emptyMessage}</h3>
                    <p>Try adjusting your search or filter criteria</p>
                </div>
            `;
            return;
        }

        this.filteredContacts.forEach(contact => {
            container.appendChild(this.createContactCard(contact));
        });
    }

    createContactCard(contact) {
        const card = document.createElement('div');
        card.className = 'card contact-card';
        card.addEventListener('click', () => this.showContactDetails(contact));

        const initials = contact.fullName
            .split(' ')
            .map(n => n[0])
            .join('')
            .toUpperCase()
            .substring(0, 2);

        const primaryEmail = contact.emails && contact.emails[0] ? contact.emails[0].email : '';
        const primaryPhone = contact.phoneNumbers && contact.phoneNumbers[0] ? contact.phoneNumbers[0].number : '';

        card.innerHTML = `
            <div class="contact-header">
                <div class="contact-avatar">${initials}</div>
                <div class="contact-info">
                    <h3>${contact.fullName}</h3>
                    <p class="contact-company">${contact.company || ''}</p>
                </div>
            </div>
            <div class="contact-details">
                ${primaryEmail ? `<p>📧 ${primaryEmail}</p>` : ''}
                ${primaryPhone ? `<p>📱 ${primaryPhone}</p>` : ''}
                ${contact.jobTitle ? `<p>💼 ${contact.jobTitle}</p>` : ''}
            </div>
        `;

        return card;
    }

    showContactDetails(contact) {
        this.currentContact = contact;
        document.getElementById('modal-contact-name').textContent = contact.fullName;

        const detailsContainer = document.getElementById('modal-contact-details');
        detailsContainer.innerHTML = this.generateContactDetailsHTML(contact);

        document.getElementById('contact-modal').classList.remove('hidden');
    }

    generateContactDetailsHTML(contact) {
        let html = '<div class="contact-detail-grid">';

        // Phone numbers
        if (contact.phoneNumbers && contact.phoneNumbers.length > 0) {
            html += '<div class="contact-field">';
            html += '<div class="contact-field-label">Phone Numbers</div>';
            contact.phoneNumbers.forEach(phone => {
                html += `<div class="contact-field-value">${phone.type}: ${phone.number}</div>`;
            });
            html += '</div>';
        }

        // Emails
        if (contact.emails && contact.emails.length > 0) {
            html += '<div class="contact-field">';
            html += '<div class="contact-field-label">Email Addresses</div>';
            contact.emails.forEach(email => {
                html += `<div class="contact-field-value">${email.type}: ${email.email}</div>`;
            });
            html += '</div>';
        }

        // Company & Job Title
        if (contact.company) {
            html += `<div class="contact-field">
                <div class="contact-field-label">Company</div>
                <div class="contact-field-value">${contact.company}</div>
            </div>`;
        }

        if (contact.jobTitle) {
            html += `<div class="contact-field">
                <div class="contact-field-label">Job Title</div>
                <div class="contact-field-value">${contact.jobTitle}</div>
            </div>`;
        }

        // Address
        if (contact.address) {
            const addr = contact.address;
            const fullAddress = [addr.street, addr.city, addr.state, addr.zipCode].filter(Boolean).join(', ');
            if (fullAddress) {
                html += `<div class="contact-field">
                    <div class="contact-field-label">Address</div>
                    <div class="contact-field-value">${fullAddress}</div>
                </div>`;
            }
        }

        // Website
        if (contact.website) {
            html += `<div class="contact-field">
                <div class="contact-field-label">Website</div>
                <div class="contact-field-value"><a href="${contact.website}" target="_blank">${contact.website}</a></div>
            </div>`;
        }

        // Notes
        if (contact.notes) {
            html += `<div class="contact-field">
                <div class="contact-field-label">Notes</div>
                <div class="contact-field-value">${contact.notes}</div>
            </div>`;
        }

        html += '</div>';

        // Tags
        if (contact.tags && contact.tags.length > 0) {
            html += '<div class="contact-tags">';
            contact.tags.forEach(tag => {
                html += `<span class="tag">${tag}</span>`;
            });
            html += '</div>';
        }

        return html;
    }

    closeModal() {
        document.getElementById('contact-modal').classList.add('hidden');
        this.currentContact = null;
    }

    handleEditContact() {
        if (!this.currentContact) return;

        // Populate the add contact form with current contact data
        this.showView('add-contact');
        this.populateContactForm(this.currentContact);
        this.closeModal();
    }

    populateContactForm(contact) {
        const form = document.getElementById('add-contact-form');
        if (!form) return;

        // Clear existing form first
        this.clearAddContactForm();

        // Update form header to indicate editing
        const viewHeader = document.querySelector('#add-contact .view-header h1');
        const viewDescription = document.querySelector('#add-contact .view-header p');
        if (viewHeader) {
            viewHeader.textContent = 'Edit Contact';
        }
        if (viewDescription) {
            viewDescription.textContent = `Editing ${contact.firstName} ${contact.lastName}`;
        }

        // Set basic fields
        form.querySelector('[name="firstName"]').value = contact.firstName || '';
        form.querySelector('[name="lastName"]').value = contact.lastName || '';
        form.querySelector('[name="company"]').value = contact.company || '';
        form.querySelector('[name="jobTitle"]').value = contact.jobTitle || '';
        form.querySelector('[name="website"]').value = contact.website || '';
        form.querySelector('[name="category"]').value = contact.category || 'personal';
        form.querySelector('[name="notes"]').value = contact.notes || '';

        // Set address fields
        if (contact.address) {
            form.querySelector('[name="street"]').value = contact.address.street || '';
            form.querySelector('[name="city"]').value = contact.address.city || '';
            form.querySelector('[name="state"]').value = contact.address.state || '';
            form.querySelector('[name="zipCode"]').value = contact.address.zipCode || '';
        }

        // Handle phone numbers
        if (contact.phoneNumbers && contact.phoneNumbers.length > 0) {
            const phoneContainer = document.getElementById('phone-numbers');
            // Clear existing phone entries except the first one
            const phoneEntries = phoneContainer.querySelectorAll('.phone-entry');
            for (let i = 1; i < phoneEntries.length; i++) {
                phoneEntries[i].remove();
            }

            // Set first phone number
            const firstPhoneEntry = phoneContainer.querySelector('.phone-entry');
            if (firstPhoneEntry) {
                firstPhoneEntry.querySelector('.phone-type').value = contact.phoneNumbers[0].type || 'work';
                firstPhoneEntry.querySelector('.phone-number').value = contact.phoneNumbers[0].number || '';
            }

            // Add additional phone numbers
            for (let i = 1; i < contact.phoneNumbers.length; i++) {
                this.addPhoneField();
                const phoneEntries = phoneContainer.querySelectorAll('.phone-entry');
                const currentEntry = phoneEntries[phoneEntries.length - 1];
                currentEntry.querySelector('.phone-type').value = contact.phoneNumbers[i].type || 'work';
                currentEntry.querySelector('.phone-number').value = contact.phoneNumbers[i].number || '';
            }
        }

        // Handle email addresses
        if (contact.emails && contact.emails.length > 0) {
            const emailContainer = document.getElementById('email-addresses');
            // Clear existing email entries except the first one
            const emailEntries = emailContainer.querySelectorAll('.email-entry');
            for (let i = 1; i < emailEntries.length; i++) {
                emailEntries[i].remove();
            }

            // Set first email
            const firstEmailEntry = emailContainer.querySelector('.email-entry');
            if (firstEmailEntry) {
                firstEmailEntry.querySelector('.email-type').value = contact.emails[0].type || 'work';
                firstEmailEntry.querySelector('.email-address').value = contact.emails[0].email || '';
            }

            // Add additional emails
            for (let i = 1; i < contact.emails.length; i++) {
                this.addEmailField();
                const emailEntries = emailContainer.querySelectorAll('.email-entry');
                const currentEntry = emailEntries[emailEntries.length - 1];
                currentEntry.querySelector('.email-type').value = contact.emails[i].type || 'work';
                currentEntry.querySelector('.email-address').value = contact.emails[i].email || '';
            }
        }

        // Store the contact ID for update
        form.dataset.contactId = contact.id;

        // Change the submit button text
        const submitButton = form.querySelector('button[type="submit"]');
        if (submitButton) {
            submitButton.textContent = 'Update Contact';
        }
    }

    async handleDeleteContact() {
        if (!this.currentContact) return;
        
        if (confirm(`Are you sure you want to delete ${this.currentContact.fullName}?`)) {
            await this.deleteContact(this.currentContact.id);
            this.closeModal();
            this.updateDashboard();
            if (this.currentView === 'contacts') {
                this.applyFilters();
                this.renderContactsList();
            }
        }
    }

    // Form Management
    async handleAddContact(form) {
        const formData = new FormData(form);
        const isUpdate = form.dataset.contactId;

        const contact = {
            firstName: formData.get('firstName'),
            lastName: formData.get('lastName') || '',
            company: formData.get('company') || '',
            jobTitle: formData.get('jobTitle') || '',
            website: formData.get('website') || '',
            notes: formData.get('notes') || '',
            category: formData.get('category') || 'personal',
            tags: [],
            phoneNumbers: [],
            emails: [],
            address: {
                street: formData.get('street') || '',
                city: formData.get('city') || '',
                state: formData.get('state') || '',
                zipCode: formData.get('zipCode') || ''
            }
        };

        // If updating, preserve the existing ID and timestamps
        if (isUpdate) {
            contact.id = form.dataset.contactId;
            const existingContact = this.contacts.find(c => c.id === contact.id);
            if (existingContact) {
                contact.createdAt = existingContact.createdAt;
                contact.source = existingContact.source;
            }
        }

        // Collect phone numbers
        document.querySelectorAll('.phone-entry').forEach(entry => {
            const type = entry.querySelector('.phone-type').value;
            const number = entry.querySelector('.phone-number').value.trim();
            if (number) {
                contact.phoneNumbers.push({ type, number });
            }
        });

        // Collect email addresses
        document.querySelectorAll('.email-entry').forEach(entry => {
            const type = entry.querySelector('.email-type').value;
            const email = entry.querySelector('.email-address').value.trim();
            if (email) {
                contact.emails.push({ type, email });
            }
        });

        try {
            await this.saveContact(contact);
            this.clearAddContactForm();
            this.updateDashboard();

            // Show appropriate success message
            const message = isUpdate ?
                `${contact.firstName} ${contact.lastName} updated successfully` :
                `${contact.firstName} ${contact.lastName} added successfully`;
            this.showToast(message, 'success');

            // Reset form state
            delete form.dataset.contactId;
            const submitButton = form.querySelector('button[type="submit"]');
            if (submitButton) {
                submitButton.textContent = 'Save Contact';
            }

            this.showView('contacts');
        } catch (error) {
            console.error('Error saving contact:', error);
            this.showToast('Error saving contact', 'error');
        }
    }

    addPhoneField() {
        const container = document.getElementById('phone-numbers');
        const entry = document.createElement('div');
        entry.className = 'phone-entry';
        entry.innerHTML = `
            <select class="form-control phone-type">
                <option value="work">Work</option>
                <option value="mobile">Mobile</option>
                <option value="home">Home</option>
            </select>
            <input type="tel" class="form-control phone-number" placeholder="+1-555-123-4567">
            <button type="button" class="btn btn--sm btn--outline remove-phone">−</button>
        `;
        
        entry.querySelector('.remove-phone').addEventListener('click', () => {
            entry.remove();
        });
        
        container.appendChild(entry);
    }

    addEmailField() {
        const container = document.getElementById('email-addresses');
        const entry = document.createElement('div');
        entry.className = 'email-entry';
        entry.innerHTML = `
            <select class="form-control email-type">
                <option value="work">Work</option>
                <option value="personal">Personal</option>
            </select>
            <input type="email" class="form-control email-address" placeholder="contact@example.com">
            <button type="button" class="btn btn--sm btn--outline remove-email">−</button>
        `;
        
        entry.querySelector('.remove-email').addEventListener('click', () => {
            entry.remove();
        });
        
        container.appendChild(entry);
    }

    clearAddContactForm() {
        const form = document.getElementById('add-contact-form');
        form.reset();

        // Remove any stored contact ID (used for updates)
        delete form.dataset.contactId;

        // Reset form header
        const viewHeader = document.querySelector('#add-contact .view-header h1');
        const viewDescription = document.querySelector('#add-contact .view-header p');
        if (viewHeader) {
            viewHeader.textContent = 'Add Contact';
        }
        if (viewDescription) {
            viewDescription.textContent = 'Enter contact information manually';
        }

        // Reset submit button text
        const submitButton = form.querySelector('button[type="submit"]');
        if (submitButton) {
            submitButton.textContent = 'Save Contact';
        }

        // Reset to single phone and email fields
        const phoneContainer = document.getElementById('phone-numbers');
        const phoneEntries = phoneContainer.querySelectorAll('.phone-entry');
        for (let i = 1; i < phoneEntries.length; i++) {
            phoneEntries[i].remove();
        }

        const emailContainer = document.getElementById('email-addresses');
        const emailEntries = emailContainer.querySelectorAll('.email-entry');
        for (let i = 1; i < emailEntries.length; i++) {
            emailEntries[i].remove();
        }
    }

    // OCR and Card Scanning
    async handleCardUpload(file) {
        console.log('🔄 Starting card upload process:', {
            fileName: file.name,
            fileSize: file.size,
            fileType: file.type
        });

        if (!file.type.startsWith('image/')) {
            this.showToast('Please upload an image file', 'error');
            return;
        }

        // Show immediate feedback
        this.showLoading('Preparing image...');

        // Show image preview immediately without destroying the structure
        const imageUrl = URL.createObjectURL(file);
        const scanResults = document.getElementById('scan-results');
        if (scanResults) {
            // Ensure the complete structure exists
            scanResults.innerHTML = `
                <div class="card">
                    <div class="card__body">
                        <h3>Extracted Information</h3>
                        <div class="image-preview">
                            <img src="${imageUrl}" alt="Business card preview" style="max-width: 100%; max-height: 300px; border-radius: 8px; margin-bottom: 16px;">
                            <p>Processing image with OCR...</p>
                        </div>
                        <div id="ocr-progress" class="progress-bar hidden">
                            <div class="progress-fill"></div>
                            <span class="progress-text">Processing image...</span>
                        </div>
                        <div id="extracted-data" class="extracted-data"></div>
                        <div class="scan-actions">
                            <button class="btn btn--primary" id="save-scanned-contact">Save Contact</button>
                            <button class="btn btn--outline" id="edit-scanned-contact">Edit Details</button>
                            <button class="btn btn--outline" id="scan-another">Scan Another</button>
                        </div>
                    </div>
                </div>
            `;
            scanResults.classList.remove('hidden');

            // Attach event listeners for the buttons
            this._attachScanButtonListeners();
        }
        
        try {
            console.log('📋 Ensuring scan view is loaded...');
            // Ensure we're on the scan view
            if (this.currentView !== 'scan-card') {
                this.showView('scan-card');
                // Wait for the view to load and DOM elements to be available
                await new Promise(resolve => setTimeout(resolve, 200));
            }

            // Double-check that required elements exist
            const scanResults = document.getElementById('scan-results');
            const extractedDataElement = document.getElementById('extracted-data');
            const ocrProgress = document.getElementById('ocr-progress');

            console.log('🔍 Checking DOM elements:', {
                scanResults: !!scanResults,
                extractedDataElement: !!extractedDataElement,
                ocrProgress: !!ocrProgress
            });

            if (!scanResults || !extractedDataElement) {
                console.error('❌ Required DOM elements not found, forcing view reload...');
                this.showView('scan-card');
                await new Promise(resolve => setTimeout(resolve, 300));
            }

            console.log('🖼️ Starting image preprocessing...');
            // Preprocess image for faster OCR
            const processedImageUrl = await this.preprocessImage(file);
            console.log('✅ Image preprocessing complete');

            console.log('🔍 Starting OCR processing...');
            const ocrResult = await this.performOCR(processedImageUrl);
            console.log('✅ OCR processing complete, result length:', ocrResult?.length || 0);

            console.log('📝 Parsing OCR text...');
            const extractedData = this.parseOCRText(ocrResult);
            console.log('✅ Text parsing complete:', extractedData);

            console.log('📊 Displaying scan results...');
            this.displayScanResults(extractedData, processedImageUrl);
            this.hideLoading();
            console.log('✅ Card upload process complete');
            
        } catch (error) {
            console.error('❌ OCR Error:', error);
            console.error('Error stack:', error.stack);

            // Show user-friendly error message with fallback option
            const errorMessage = error.message || 'Failed to process image';
            this.showToast(errorMessage + ' You can still add contact details manually.', 'error');
            this.hideLoading();

            // Show image and offer manual entry as fallback
            const fallbackMessage = document.createElement('div');
            fallbackMessage.className = 'scan-fallback';
            fallbackMessage.innerHTML = `
                <div class="fallback-image">
                    <img src="${URL.createObjectURL(file)}" alt="Business card" style="max-width: 300px; max-height: 200px; border-radius: 8px; margin-bottom: 16px;">
                </div>
                <p>OCR processing failed, but you can view the image above and:</p>
                <div class="fallback-actions">
                    <button class="btn btn--primary" onclick="contactManager.showView('add-contact')">
                        Add Contact Manually
                    </button>
                    <button class="btn btn--outline" onclick="contactManager.retryOCR()">
                        Try OCR Again
                    </button>
                    <button class="btn btn--outline" onclick="contactManager.showManualExtraction()">
                        Extract Text Manually
                    </button>
                </div>
            `;

            const scanResults = document.getElementById('scan-results');
            if (scanResults) {
                scanResults.innerHTML = '';
                scanResults.appendChild(fallbackMessage);
                scanResults.classList.remove('hidden');
            }

            // Store the file for retry
            this.lastUploadedFile = file;
        }
    }

    async retryOCR() {
        if (this.lastUploadedFile) {
            // Clear scan results
            const scanResults = document.getElementById('scan-results');
            if (scanResults) {
                scanResults.classList.add('hidden');
            }

            // Retry with the stored file
            this.showLoading('Retrying OCR processing...');
            this.handleCardUpload(this.lastUploadedFile);
        }
    }

    showManualExtraction() {
        if (this.lastUploadedFile) {
            const imageUrl = URL.createObjectURL(this.lastUploadedFile);
            const scanResults = document.getElementById('scan-results');
            if (scanResults) {
                scanResults.innerHTML = `
                    <div class="manual-extraction">
                        <div class="extraction-image">
                            <img src="${imageUrl}" alt="Business card" style="max-width: 100%; max-height: 400px; border-radius: 8px; margin-bottom: 16px;">
                        </div>
                        <div class="extraction-form">
                            <h3>Extract Contact Information</h3>
                            <p>Look at the image above and fill in the contact details:</p>
                            <div class="form-grid">
                                <input type="text" id="manual-name" placeholder="Full Name" class="form-control">
                                <input type="text" id="manual-company" placeholder="Company" class="form-control">
                                <input type="text" id="manual-title" placeholder="Job Title" class="form-control">
                                <input type="email" id="manual-email" placeholder="Email" class="form-control">
                                <input type="tel" id="manual-phone" placeholder="Phone" class="form-control">
                                <input type="text" id="manual-website" placeholder="Website" class="form-control">
                            </div>
                            <div class="extraction-actions">
                                <button class="btn btn--primary" onclick="contactManager.processManualExtraction()">
                                    Create Contact
                                </button>
                                <button class="btn btn--outline" onclick="contactManager.resetScanInterface()">
                                    Cancel
                                </button>
                            </div>
                        </div>
                    </div>
                `;
                scanResults.classList.remove('hidden');
            }
        }
    }

    processManualExtraction() {
        const extractedData = {
            fullName: document.getElementById('manual-name')?.value || '',
            company: document.getElementById('manual-company')?.value || '',
            jobTitle: document.getElementById('manual-title')?.value || '',
            emails: document.getElementById('manual-email')?.value ?
                [{ email: document.getElementById('manual-email').value, type: 'work' }] : [],
            phoneNumbers: document.getElementById('manual-phone')?.value ?
                [{ number: document.getElementById('manual-phone').value, type: 'work' }] : [],
            website: document.getElementById('manual-website')?.value || ''
        };

        if (!extractedData.fullName) {
            this.showToast('Please enter at least a name', 'error');
            return;
        }

        const imageUrl = this.lastUploadedFile ? URL.createObjectURL(this.lastUploadedFile) : '';

        // Ensure we're on the scan view
        if (this.currentView !== 'scan-card') {
            this.showView('scan-card');
        }

        this.displayScanResults(extractedData, imageUrl);
    }

    async preprocessImage(file) {
        return new Promise((resolve, reject) => {
            const canvas = document.createElement('canvas');
            const ctx = canvas.getContext('2d');
            const img = new Image();

            img.onload = () => {
                try {
                    // Calculate optimal size (max 1200px width for faster processing)
                    const maxWidth = 1200;
                    const maxHeight = 1200;
                    let { width, height } = img;

                    if (width > maxWidth || height > maxHeight) {
                        const ratio = Math.min(maxWidth / width, maxHeight / height);
                        width *= ratio;
                        height *= ratio;
                    }

                    canvas.width = width;
                    canvas.height = height;

                    // Draw and enhance image for better OCR
                    ctx.drawImage(img, 0, 0, width, height);

                    // Enhance contrast and brightness for better text recognition
                    const imageData = ctx.getImageData(0, 0, width, height);
                    const data = imageData.data;

                    for (let i = 0; i < data.length; i += 4) {
                        // Increase contrast
                        const factor = 1.2;
                        data[i] = Math.min(255, data[i] * factor);     // Red
                        data[i + 1] = Math.min(255, data[i + 1] * factor); // Green
                        data[i + 2] = Math.min(255, data[i + 2] * factor); // Blue
                    }

                    ctx.putImageData(imageData, 0, 0);

                    // Convert to blob and create URL
                    canvas.toBlob((blob) => {
                        if (blob) {
                            resolve(URL.createObjectURL(blob));
                        } else {
                            reject(new Error('Failed to process image'));
                        }
                    }, 'image/jpeg', 0.8);

                } catch (error) {
                    reject(error);
                }
            };

            img.onerror = () => reject(new Error('Failed to load image'));
            img.src = URL.createObjectURL(file);
        });
    }

    async performOCR(imageUrl) {
        console.log('🔍 performOCR called with imageUrl:', imageUrl);
        const progressContainer = document.getElementById('ocr-progress');
        const progressBar = document.querySelector('.progress-fill');
        const progressText = document.querySelector('.progress-text');

        try {
            console.log('📊 Setting up progress indicators...');
            // Show progress container
            if (progressContainer) {
                progressContainer.classList.remove('hidden');
                console.log('✅ Progress container shown');
            } else {
                console.warn('⚠️ Progress container not found');
            }

            // Update progress text
            if (progressText) {
                progressText.textContent = 'Initializing OCR...';
                console.log('✅ Progress text updated');
            }

            // Check if Tesseract is available
            console.log('🔍 Checking Tesseract availability...');
            if (typeof Tesseract === 'undefined') {
                console.error('❌ Tesseract.js not loaded');
                throw new Error('Tesseract.js library not loaded. Please check your internet connection.');
            }
            console.log('✅ Tesseract.js is available');

            if (progressText) {
                progressText.textContent = 'Processing image...';
            }

            console.log('🚀 Starting Tesseract.recognize...');
            // Use Tesseract.recognize directly without workers to avoid cloning issues
            const result = await Tesseract.recognize(imageUrl, 'eng', {
                logger: (m) => {
                    console.log('📊 OCR Progress:', m);
                    if (m.status === 'recognizing text' && progressBar && progressText) {
                        const progress = Math.round(m.progress * 100);
                        progressBar.style.width = progress + '%';
                        progressText.textContent = `Processing image... ${progress}%`;
                        console.log(`📈 Progress: ${progress}%`);
                    }
                }
            });
            console.log('✅ Tesseract.recognize completed');

            if (progressContainer) {
                progressContainer.classList.add('hidden');
            }

            if (!result || !result.data || !result.data.text) {
                throw new Error('No text could be extracted from the image');
            }

            return result.data.text;

        } catch (error) {
            console.error('OCR Error:', error);

            // Hide progress container
            if (progressContainer) {
                progressContainer.classList.add('hidden');
            }

            // Provide user-friendly error messages
            let errorMessage = 'OCR processing failed';
            if (error.message.includes('network') || error.message.includes('fetch')) {
                errorMessage = 'Network error. Please check your internet connection and try again.';
            } else if (error.message.includes('cloned') || error.message.includes('Worker')) {
                errorMessage = 'OCR engine compatibility issue. This may work better in a different browser.';
            } else if (error.message.includes('timeout')) {
                errorMessage = 'OCR processing took too long. Try with a smaller or clearer image.';
            }

            throw new Error(errorMessage);
        }
    }

    parseOCRText(ocrText) {
        const extractedData = {
            firstName: '',
            lastName: '',
            company: '',
            jobTitle: '',
            phoneNumbers: [],
            emails: [],
            website: '',
            address: { street: '', city: '', state: '', zipCode: '' }
        };

        const lines = ocrText.split('\n').filter(line => line.trim());

        // Extract email
        const emailRegex = /\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,}\b/g;
        const emails = ocrText.match(emailRegex);
        if (emails) {
            extractedData.emails.push({ type: 'work', email: emails[0] });
        }

        // Extract phone
        const phoneRegex = /\+?1?[-\s\.]?\(?[0-9]{3}\)?[-\s\.]?[0-9]{3}[-\s\.]?[0-9]{4}/g;
        const phones = ocrText.match(phoneRegex);
        if (phones) {
            extractedData.phoneNumbers.push({ type: 'work', number: phones[0] });
        }

        // Extract website
        const websiteRegex = /(?:https?:\/\/)?(?:www\.)?[a-zA-Z0-9][a-zA-Z0-9-]{1,61}[a-zA-Z0-9]\.[a-zA-Z]{2,}/g;
        const websites = ocrText.match(websiteRegex);
        if (websites) {
            extractedData.website = websites[0].startsWith('http') ? websites[0] : 'https://' + websites[0];
        }

        // Extract ZIP code and address info
        const zipRegex = /\b\d{5}(?:-\d{4})?\b/g;
        const zips = ocrText.match(zipRegex);
        if (zips) {
            extractedData.address.zipCode = zips[0];
        }

        // Simple name extraction (first two lines that don't contain special characters)
        const nameLines = lines.filter(line => 
            !emailRegex.test(line) && 
            !phoneRegex.test(line) && 
            !websiteRegex.test(line) &&
            line.length < 50 &&
            !/[0-9]/.test(line)
        );

        if (nameLines.length > 0) {
            const nameParts = nameLines[0].trim().split(' ');
            extractedData.firstName = nameParts[0] || '';
            extractedData.lastName = nameParts.slice(1).join(' ') || '';
        }

        if (nameLines.length > 1) {
            extractedData.jobTitle = nameLines[1].trim();
        }

        if (nameLines.length > 2) {
            extractedData.company = nameLines[2].trim();
        }

        return extractedData;
    }

    displayScanResults(extractedData, imageUrl) {
        console.log('📊 displayScanResults called with:', { extractedData, imageUrl });

        // Ensure we're on the scan view first
        if (this.currentView !== 'scan-card') {
            console.log('🔄 Switching to scan view...');
            this.showView('scan-card');
        }

        // Use a more robust approach with retries
        this._waitForScanElements(extractedData, imageUrl, 0);
    }

    _waitForScanElements(extractedData, imageUrl, retryCount = 0) {
        const maxRetries = 5;
        const delay = 100 + (retryCount * 50); // Increasing delay

        console.log(`🔍 Attempt ${retryCount + 1}/${maxRetries} - Checking for scan elements...`);

        const scanResults = document.getElementById('scan-results');
        const scanCardView = document.getElementById('scan-card');

        // First, ensure scan-results is visible so we can access its children
        if (scanResults) {
            scanResults.classList.remove('hidden');
            console.log('👁️ Made scan-results visible');
        }

        // Now try to find the container
        const container = document.getElementById('extracted-data');

        console.log('🔍 DOM elements status:', {
            scanCardView: !!scanCardView,
            scanCardActive: scanCardView?.classList.contains('active'),
            scanResults: !!scanResults,
            scanResultsHidden: scanResults?.classList.contains('hidden'),
            container: !!container,
            currentView: this.currentView
        });

        // Also try alternative methods to find the container
        if (!container && scanResults) {
            const containerByQuery = scanResults.querySelector('#extracted-data');
            const containerByClass = scanResults.querySelector('.extracted-data');
            console.log('🔍 Alternative container search:', {
                byQuery: !!containerByQuery,
                byClass: !!containerByClass
            });

            if (containerByQuery || containerByClass) {
                const foundContainer = containerByQuery || containerByClass;
                console.log('✅ Found container via alternative method');
                this._renderScanResults(scanResults, foundContainer, extractedData, imageUrl);
                return;
            }
        }

        if (scanResults && container) {
            console.log('✅ All elements found, rendering results...');
            this._renderScanResults(scanResults, container, extractedData, imageUrl);
            return;
        }

        if (retryCount < maxRetries) {
            console.log(`⏳ Elements not ready, retrying in ${delay}ms...`);
            if (retryCount === 2) {
                // Debug on third attempt
                this.debugScanElements();
            }
            setTimeout(() => {
                this._waitForScanElements(extractedData, imageUrl, retryCount + 1);
            }, delay);
        } else {
            console.error('❌ Failed to find scan elements after all retries');
            this.debugScanElements();

            // Try to create the missing container as a last resort
            if (scanResults && !container) {
                console.log('🛠️ Attempting to recreate complete scan-results structure...');

                // The scan-results div exists but is empty, so recreate the entire structure
                scanResults.innerHTML = `
                    <div class="card">
                        <div class="card__body">
                            <h3>Extracted Information</h3>
                            <div id="ocr-progress" class="progress-bar hidden">
                                <div class="progress-fill"></div>
                                <span class="progress-text">Processing image...</span>
                            </div>
                            <div id="extracted-data" class="extracted-data"></div>
                            <div class="scan-actions">
                                <button class="btn btn--primary" id="save-scanned-contact">Save Contact</button>
                                <button class="btn btn--outline" id="edit-scanned-contact">Edit Details</button>
                                <button class="btn btn--outline" id="scan-another">Scan Another</button>
                            </div>
                        </div>
                    </div>
                `;

                // Now find the newly created container
                const newContainer = scanResults.querySelector('#extracted-data');

                if (newContainer) {
                    // Re-attach event listeners for the new buttons
                    this._attachScanButtonListeners();

                    console.log('✅ Recreated complete scan-results structure, attempting to render...');
                    this._renderScanResults(scanResults, newContainer, extractedData, imageUrl);
                    return;
                } else {
                    console.error('❌ Failed to create extracted-data container even after recreating structure');
                }
            }

            this.showToast('Error displaying scan results. Please try scanning again.', 'error');

            // Force a complete view reset
            console.log('🔄 Forcing complete view reset...');
            this.showView('dashboard');
            setTimeout(() => {
                this.showView('scan-card');
            }, 200);
        }
    }

    _renderScanResults(scanResults, container, extractedData, imageUrl) {
        console.log('✅ Rendering scan results...');

        scanResults.classList.remove('hidden');

        container.innerHTML = `
            <div class="scan-preview">
                <img src="${imageUrl}" alt="Scanned card" style="max-width: 200px; max-height: 120px; object-fit: contain; border-radius: 8px;">
            </div>
            <div class="extracted-fields">
                <p><strong>Name:</strong> ${extractedData.firstName || ''} ${extractedData.lastName || ''}</p>
                <p><strong>Company:</strong> ${extractedData.company || 'Not found'}</p>
                <p><strong>Job Title:</strong> ${extractedData.jobTitle || 'Not found'}</p>
                <p><strong>Email:</strong> ${extractedData.emails && extractedData.emails[0]?.email || 'Not found'}</p>
                <p><strong>Phone:</strong> ${extractedData.phoneNumbers && extractedData.phoneNumbers[0]?.number || 'Not found'}</p>
                <p><strong>Website:</strong> ${extractedData.website || 'Not found'}</p>
            </div>
        `;

        this.scannedContactData = extractedData;
        console.log('✅ Scan results rendered successfully');
    }

    // Diagnostic function to check DOM structure
    debugScanElements() {
        console.log('🔍 DOM Structure Debug:');
        console.log('Current view:', this.currentView);

        const scanCard = document.getElementById('scan-card');
        const scanResults = document.getElementById('scan-results');
        const extractedData = document.getElementById('extracted-data');
        const ocrProgress = document.getElementById('ocr-progress');

        console.log('Elements found:', {
            'scan-card': !!scanCard,
            'scan-card active': scanCard?.classList.contains('active'),
            'scan-results': !!scanResults,
            'scan-results hidden': scanResults?.classList.contains('hidden'),
            'extracted-data': !!extractedData,
            'ocr-progress': !!ocrProgress
        });

        if (scanCard) {
            console.log('scan-card classes:', Array.from(scanCard.classList));
        }
        if (scanResults) {
            console.log('scan-results classes:', Array.from(scanResults.classList));
            console.log('scan-results innerHTML length:', scanResults.innerHTML.length);

            // Check for extracted-data within scan-results
            const childExtractedData = scanResults.querySelector('#extracted-data');
            const childByClass = scanResults.querySelector('.extracted-data');
            console.log('Children search:', {
                'querySelector #extracted-data': !!childExtractedData,
                'querySelector .extracted-data': !!childByClass
            });

            // List all children with IDs
            const childrenWithIds = Array.from(scanResults.querySelectorAll('[id]')).map(el => el.id);
            console.log('All children with IDs:', childrenWithIds);
        }
    }

    // Re-attach event listeners for dynamically created scan buttons
    _attachScanButtonListeners() {
        console.log('🔗 Attaching scan button listeners...');

        const saveBtn = document.getElementById('save-scanned-contact');
        const editBtn = document.getElementById('edit-scanned-contact');
        const scanAnotherBtn = document.getElementById('scan-another');

        if (saveBtn) {
            saveBtn.addEventListener('click', () => {
                console.log('💾 Save button clicked');
                this.saveScannedContact();
            });
        }

        if (editBtn) {
            editBtn.addEventListener('click', () => {
                console.log('✏️ Edit button clicked');
                this.editScannedContact();
            });
        }

        if (scanAnotherBtn) {
            scanAnotherBtn.addEventListener('click', () => {
                console.log('🔄 Scan another button clicked');
                this.resetScanInterface();
            });
        }

        console.log('✅ Scan button listeners attached');
    }

    // Test function that can be called from browser console
    testScanView() {
        console.log('🧪 Testing scan view...');
        this.showView('scan-card');
        setTimeout(() => {
            this.debugScanElements();
        }, 500);
    }

    async saveScannedContact() {
        console.log('💾 Saving scanned contact:', this.scannedContactData);

        if (!this.scannedContactData) {
            console.error('❌ No scanned contact data to save');
            this.showToast('No contact data to save', 'error');
            return;
        }

        // Prepare the contact data
        const contactData = {
            ...this.scannedContactData,
            source: 'scan',
            category: 'professional',
            id: Date.now().toString() // Generate unique ID
        };

        try {
            console.log('📝 Saving contact with data:', contactData);
            await this.saveContact(contactData);
            this.showToast('Contact saved successfully!', 'success');
            this.resetScanInterface();
            this.updateDashboard();
            this.showView('contacts'); // Switch to contacts view to show the new contact
        } catch (error) {
            console.error('❌ Error saving scanned contact:', error);
            this.showToast('Error saving contact', 'error');
        }
    }

    editScannedContact() {
        console.log('✏️ Editing scanned contact:', this.scannedContactData);

        if (!this.scannedContactData) {
            console.error('❌ No scanned contact data to edit');
            this.showToast('No contact data to edit', 'error');
            return;
        }

        // Switch to add contact view and populate with scanned data
        this.showView('add-contact');
        this.populateContactForm(this.scannedContactData);
        this.showToast('Contact data loaded for editing', 'info');
    }

    resetScanInterface() {
        document.getElementById('scan-results').classList.add('hidden');
        document.getElementById('card-upload').value = '';
        this.scannedContactData = null;
    }

    // Import/Export
    async handleImportFile(file) {
        if (!file.name.endsWith('.csv')) {
            this.showToast('Please select a CSV file', 'error');
            return;
        }

        const text = await file.text();
        const rows = text.split('\n');
        const headers = rows[0].split(',').map(h => h.trim());
        
        const preview = document.getElementById('import-preview');
        preview.classList.remove('hidden');
        preview.innerHTML = `
            <h4>Import Preview</h4>
            <p>Found ${rows.length - 1} contacts to import</p>
            <button class="btn btn--primary" id="confirm-import">Import Contacts</button>
        `;

        document.getElementById('confirm-import').addEventListener('click', async () => {
            await this.importCSVData(rows, headers);
            preview.classList.add('hidden');
        });
    }

    async importCSVData(rows, headers) {
        this.showLoading();
        let imported = 0;

        for (let i = 1; i < rows.length; i++) {
            if (!rows[i].trim()) continue;

            const values = rows[i].split(',').map(v => v.trim());
            const contact = {
                firstName: values[headers.indexOf('firstName')] || values[0] || '',
                lastName: values[headers.indexOf('lastName')] || values[1] || '',
                company: values[headers.indexOf('company')] || '',
                jobTitle: values[headers.indexOf('jobTitle')] || '',
                category: 'imported',
                phoneNumbers: [],
                emails: [],
                address: {}
            };

            // Add email if found
            const emailCol = headers.indexOf('email');
            if (emailCol >= 0 && values[emailCol]) {
                contact.emails.push({ type: 'work', email: values[emailCol] });
            }

            // Add phone if found
            const phoneCol = headers.indexOf('phone');
            if (phoneCol >= 0 && values[phoneCol]) {
                contact.phoneNumbers.push({ type: 'work', number: values[phoneCol] });
            }

            await this.saveContact(contact);
            imported++;
        }

        this.hideLoading();
        this.showToast(`Imported ${imported} contacts successfully`, 'success');
        this.updateDashboard();
    }

    exportContacts(type) {
        const format = document.getElementById('export-format').value;
        const contactsToExport = type === 'all' ? this.contacts : [];

        switch (format) {
            case 'vcard':
                this.exportToVCard(contactsToExport);
                break;
            case 'csv':
                this.exportToCSV(contactsToExport);
                break;
            case 'excel':
                this.exportToExcel(contactsToExport);
                break;
        }
    }

    exportToVCard(contacts) {
        let vCardData = '';
        
        contacts.forEach(contact => {
            vCardData += 'BEGIN:VCARD\n';
            vCardData += 'VERSION:3.0\n';
            vCardData += `FN:${contact.fullName}\n`;
            vCardData += `N:${contact.lastName};${contact.firstName};;;\n`;
            
            if (contact.company) vCardData += `ORG:${contact.company}\n`;
            if (contact.jobTitle) vCardData += `TITLE:${contact.jobTitle}\n`;
            
            contact.phoneNumbers.forEach(phone => {
                vCardData += `TEL;TYPE=${phone.type.toUpperCase()}:${phone.number}\n`;
            });
            
            contact.emails.forEach(email => {
                vCardData += `EMAIL;TYPE=${email.type.toUpperCase()}:${email.email}\n`;
            });
            
            if (contact.website) vCardData += `URL:${contact.website}\n`;
            if (contact.notes) vCardData += `NOTE:${contact.notes}\n`;
            
            vCardData += 'END:VCARD\n\n';
        });

        this.downloadFile(vCardData, 'contacts.vcf', 'text/vcard');
    }

    exportToCSV(contacts) {
        const headers = ['firstName', 'lastName', 'company', 'jobTitle', 'email', 'phone', 'website', 'notes'];
        let csvData = headers.join(',') + '\n';

        contacts.forEach(contact => {
            const row = [
                contact.firstName || '',
                contact.lastName || '',
                contact.company || '',
                contact.jobTitle || '',
                contact.emails[0]?.email || '',
                contact.phoneNumbers[0]?.number || '',
                contact.website || '',
                contact.notes || ''
            ].map(field => `"${field.replace(/"/g, '""')}"`);
            
            csvData += row.join(',') + '\n';
        });

        this.downloadFile(csvData, 'contacts.csv', 'text/csv');
    }

    exportToExcel(contacts) {
        const ws = XLSX.utils.json_to_sheet(contacts.map(contact => ({
            'First Name': contact.firstName,
            'Last Name': contact.lastName,
            'Company': contact.company,
            'Job Title': contact.jobTitle,
            'Email': contact.emails[0]?.email || '',
            'Phone': contact.phoneNumbers[0]?.number || '',
            'Website': contact.website,
            'Notes': contact.notes,
            'Category': contact.category,
            'Created Date': contact.createdDate
        })));

        const wb = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(wb, ws, 'Contacts');
        XLSX.writeFile(wb, 'contacts.xlsx');
    }

    downloadFile(content, filename, mimeType) {
        const blob = new Blob([content], { type: mimeType });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = filename;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
    }

    // Sharing
    shareContact(contact) {
        if (navigator.share) {
            navigator.share({
                title: contact.fullName,
                text: this.generateContactText(contact),
            });
        } else {
            // Fallback: copy to clipboard
            const contactText = this.generateContactText(contact);
            navigator.clipboard.writeText(contactText).then(() => {
                this.showToast('Contact info copied to clipboard', 'success');
            });
        }
    }

    generateContactText(contact) {
        let text = `${contact.fullName}\n`;
        if (contact.company) text += `${contact.company}\n`;
        if (contact.jobTitle) text += `${contact.jobTitle}\n`;
        
        contact.phoneNumbers.forEach(phone => {
            text += `${phone.type}: ${phone.number}\n`;
        });
        
        contact.emails.forEach(email => {
            text += `${email.type}: ${email.email}\n`;
        });
        
        if (contact.website) text += `Website: ${contact.website}\n`;
        
        return text;
    }

    // Theme Management
    initTheme() {
        const savedTheme = localStorage.getItem('theme') || 'light';
        this.setTheme(savedTheme);
        document.querySelector(`input[name="theme"][value="${savedTheme}"]`).checked = true;
    }

    setTheme(theme) {
        if (theme === 'auto') {
            document.documentElement.removeAttribute('data-color-scheme');
        } else {
            document.documentElement.setAttribute('data-color-scheme', theme);
        }
        localStorage.setItem('theme', theme);
    }

    // Utility Functions
    showLoading() {
        document.getElementById('loading').classList.remove('hidden');
    }

    hideLoading() {
        document.getElementById('loading').classList.add('hidden');
    }

    showToast(message, type = 'info') {
        const toast = document.createElement('div');
        toast.className = `toast ${type}`;
        toast.textContent = message;
        
        document.getElementById('toast-container').appendChild(toast);
        
        setTimeout(() => {
            toast.remove();
        }, 4000);
    }

    async clearAllData() {
        if (confirm('Are you sure you want to delete all contacts? This cannot be undone.')) {
            const transaction = this.db.transaction(['contacts'], 'readwrite');
            const store = transaction.objectStore('contacts');

            return new Promise((resolve, reject) => {
                const request = store.clear();
                request.onsuccess = () => {
                    this.contacts = [];
                    this.filteredContacts = [];
                    this.currentSearchTerm = '';
                    this.currentCategoryFilter = '';

                    // Clear the input fields
                    const searchInput = document.getElementById('contact-search');
                    const categoryFilter = document.getElementById('category-filter');
                    if (searchInput) searchInput.value = '';
                    if (categoryFilter) categoryFilter.value = '';

                    this.updateDashboard();
                    if (this.currentView === 'contacts') {
                        this.renderContactsList();
                    }
                    this.showToast('All data cleared successfully', 'success');
                    resolve();
                };
                request.onerror = () => reject(request.error);
            });
        }
    }

    exportBackup() {
        const backup = {
            contacts: this.contacts,
            exportDate: new Date().toISOString(),
            version: '1.0'
        };
        
        const backupData = JSON.stringify(backup, null, 2);
        this.downloadFile(backupData, `contacts-backup-${new Date().toISOString().split('T')[0]}.json`, 'application/json');
        this.showToast('Backup created successfully', 'success');
    }
}

// Initialize the application
document.addEventListener('DOMContentLoaded', () => {
    new ContactManager();
});