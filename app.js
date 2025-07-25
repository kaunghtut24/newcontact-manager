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
        this.scannedContactData = null;

        // LLM Configuration for OCR validation
        this.llmConfig = {
            enabled: false, // Will be enabled when API key is provided
            apiKey: this.getEnvVariable('LLM_API_KEY') || '', // Try environment variable first
            baseURL: this.getEnvVariable('LLM_BASE_URL') || 'https://api.openai.com/v1', // Can be changed to other OpenAI-compatible endpoints
            model: this.getEnvVariable('LLM_MODEL') || 'gpt-3.5-turbo', // Cost-effective model
            customModel: '', // For custom model names
            maxTokens: parseInt(this.getEnvVariable('LLM_MAX_TOKENS')) || 500,
            temperature: parseFloat(this.getEnvVariable('LLM_TEMPERATURE')) || 0.1 // Low temperature for consistent, factual responses
        };

        // Enable LLM if environment variables are set
        if (this.llmConfig.apiKey) {
            this.llmConfig.enabled = true;
            console.log('🤖 LLM enabled via environment variables');
        }

        this.init();
    }

    // Environment variable helper (works with build tools like Vite, Webpack, etc.)
    getEnvVariable(name) {
        // Try different environment variable patterns
        if (typeof process !== 'undefined' && process.env) {
            return process.env[name] || process.env[`VITE_${name}`] || process.env[`REACT_APP_${name}`];
        }

        // Try window environment variables (set by build tools)
        if (typeof window !== 'undefined' && window.env) {
            return window.env[name];
        }

        // Try Vite environment variables (safer check)
        try {
            if (typeof window !== 'undefined' && window.__VITE_ENV__) {
                return window.__VITE_ENV__[name];
            }
        } catch (e) {
            // Ignore errors
        }

        return null;
    }

    async init() {
        await this.initDB();
        await this.loadContacts();
        this.loadLLMConfig(); // Load LLM configuration from storage
        this.initEventListeners();
        this.initMobileOptimizations(); // Add mobile-specific optimizations
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

        // Import backup
        document.getElementById('import-backup').addEventListener('click', () => {
            const input = document.createElement('input');
            input.type = 'file';
            input.accept = '.json';
            input.onchange = (e) => this.importBackup(e.target.files[0]);
            input.click();
        });

        // LLM Configuration
        document.getElementById('save-llm-config').addEventListener('click', () => {
            this.saveLLMConfig();
        });

        document.getElementById('test-llm-connection').addEventListener('click', () => {
            this.testLLMConnectionUI();
        });

        document.getElementById('disable-llm').addEventListener('click', () => {
            this.disableLLM();
        });
    }

    initMobileOptimizations() {
        console.log('📱 Initializing mobile optimizations...');

        // Detect if we're on a touch device
        const isTouchDevice = 'ontouchstart' in window || navigator.maxTouchPoints > 0;

        if (isTouchDevice) {
            console.log('📱 Touch device detected, applying mobile optimizations');
            document.body.classList.add('touch-device');

            // Add enhanced touch event handling
            this.addTouchEventHandlers();

            // Improve scroll behavior
            this.optimizeScrolling();

            // Add mobile-specific gesture handling
            this.enhanceMobileGestures();

            // Add global touch event delegation
            this.addGlobalTouchDelegation();

            // Fix viewport issues
            this.fixMobileViewport();
        }
    }

    addTouchEventHandlers() {
        // Add touch event listeners to all interactive elements
        const selectors = [
            '.btn', '.nav-btn', '.contact-card', '.upload-area',
            '[role="button"]', 'button', '.action-btn', '.quick-action',
            '.modal-close', '.camera-btn', '.scan-actions button',
            '.contact-actions button', '.form-actions button',
            '.data-actions button', '.llm-actions button',
            '.contact-header', '.contact-info', '.contact-avatar'
        ];

        const interactiveElements = document.querySelectorAll(selectors.join(', '));

        console.log(`📱 Adding touch handlers to ${interactiveElements.length} elements`);

        interactiveElements.forEach(element => {
            // Skip if already has touch handlers
            if (element.hasAttribute('data-touch-enabled')) {
                return;
            }

            // Mark as touch-enabled
            element.setAttribute('data-touch-enabled', 'true');

            // Add touch feedback
            element.addEventListener('touchstart', () => {
                element.classList.add('touch-active');
            }, { passive: true });

            element.addEventListener('touchend', () => {
                setTimeout(() => {
                    element.classList.remove('touch-active');
                }, 150);
            }, { passive: true });

            element.addEventListener('touchcancel', () => {
                element.classList.remove('touch-active');
            }, { passive: true });
        });
    }

    refreshTouchHandlers() {
        // Re-apply touch handlers to new elements (called when views change)
        if (document.body.classList.contains('touch-device')) {
            console.log('📱 Refreshing touch handlers for new elements');
            this.addTouchEventHandlers();
        }
    }

    addGlobalTouchDelegation() {
        // Global touch event delegation to catch all interactive elements
        console.log('📱 Adding global touch event delegation');

        const interactiveSelectors = [
            'button', '.btn', '.nav-btn', '.contact-card', '.upload-area',
            '.action-btn', '.quick-action', '.modal-close', '.camera-btn',
            '[role="button"]', '[data-action]', '.scan-actions button',
            '.contact-actions button', '.form-actions button',
            '.data-actions button', '.llm-actions button'
        ];

        // Use event delegation on document body
        document.body.addEventListener('touchstart', (e) => {
            const target = e.target.closest(interactiveSelectors.join(', '));
            if (target && !target.hasAttribute('data-touch-delegated')) {
                target.classList.add('touch-active');
                target.setAttribute('data-touch-delegated', 'true');
            }
        }, { passive: true });

        document.body.addEventListener('touchend', (e) => {
            const target = e.target.closest(interactiveSelectors.join(', '));
            if (target) {
                setTimeout(() => {
                    target.classList.remove('touch-active');
                }, 150);
            }
        }, { passive: true });

        document.body.addEventListener('touchcancel', (e) => {
            const target = e.target.closest(interactiveSelectors.join(', '));
            if (target) {
                target.classList.remove('touch-active');
            }
        }, { passive: true });
    }

    optimizeScrolling() {
        // Improve scrolling performance on mobile
        const scrollableElements = document.querySelectorAll('.main-content, .sidebar, .contact-list');

        scrollableElements.forEach(element => {
            element.style.webkitOverflowScrolling = 'touch';
            element.style.overflowScrolling = 'touch';
        });
    }

    enhanceMobileGestures() {
        // Enhanced swipe gestures for mobile
        let startX, startY, startTime;

        document.addEventListener('touchstart', (e) => {
            const touch = e.touches[0];
            startX = touch.clientX;
            startY = touch.clientY;
            startTime = Date.now();
        }, { passive: true });

        document.addEventListener('touchend', (e) => {
            if (!startX || !startY) return;

            const touch = e.changedTouches[0];
            const endX = touch.clientX;
            const endY = touch.clientY;
            const endTime = Date.now();

            const deltaX = endX - startX;
            const deltaY = endY - startY;
            const deltaTime = endTime - startTime;

            // Only process quick swipes
            if (deltaTime > 300) return;

            // Only process significant swipes
            if (Math.abs(deltaX) < 50 && Math.abs(deltaY) < 50) return;

            // Horizontal swipes for navigation
            if (Math.abs(deltaX) > Math.abs(deltaY)) {
                if (deltaX > 50) {
                    // Swipe right - open sidebar
                    this.toggleMobileMenu();
                } else if (deltaX < -50) {
                    // Swipe left - close sidebar
                    this.closeMobileMenu();
                }
            }

            // Reset
            startX = startY = null;
        }, { passive: true });
    }

    fixMobileViewport() {
        // Fix viewport issues on mobile
        const viewport = document.querySelector('meta[name="viewport"]');
        if (viewport) {
            viewport.setAttribute('content',
                'width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no, viewport-fit=cover'
            );
        }

        // Prevent zoom on double tap
        let lastTouchEnd = 0;
        document.addEventListener('touchend', (e) => {
            const now = Date.now();
            if (now - lastTouchEnd <= 300) {
                e.preventDefault();
            }
            lastTouchEnd = now;
        }, false);
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

        // Refresh touch handlers for new view elements
        setTimeout(() => {
            this.refreshTouchHandlers();
        }, 100);

        // Special handling for settings view
        if (viewName === 'settings') {
            setTimeout(() => this.populateLLMForm(), 100);
        }

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

        // Refresh touch handlers for recent contact cards
        this.refreshTouchHandlers();
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

        // Refresh touch handlers for new contact cards
        this.refreshTouchHandlers();
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
            const extractedData = await this.parseOCRText(ocrResult);
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

            // Create a worker with explicit configuration to avoid CSP issues
            console.log('🔄 Creating Tesseract worker with explicit configuration...');

            let worker;
            let result;

            try {
                // Try to create worker with explicit unpkg.com paths first
                console.log('🔄 Attempting to create worker with unpkg.com...');
                worker = await Tesseract.createWorker('eng', 1, {
                    workerPath: 'https://unpkg.com/tesseract.js@4.1.1/dist/worker.min.js',
                    langPath: 'https://unpkg.com/tesseract.js@4.1.1/dist/',
                    corePath: 'https://unpkg.com/tesseract.js@4.1.1/dist/',
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

                console.log('✅ Worker created successfully');
                result = await worker.recognize(imageUrl);
                await worker.terminate();

            } catch (workerError) {
                console.log('⚠️ Worker creation failed, trying direct recognize...');

                // Fallback to direct recognize with explicit paths
                try {
                    result = await Tesseract.recognize(imageUrl, 'eng', {
                        logger: (m) => {
                            console.log('📊 OCR Progress:', m);
                            if (m.status === 'recognizing text' && progressBar && progressText) {
                                const progress = Math.round(m.progress * 100);
                                progressBar.style.width = progress + '%';
                                progressText.textContent = `Processing image... ${progress}%`;
                                console.log(`📈 Progress: ${progress}%`);
                            }
                        },
                        // Force unpkg.com paths
                        workerPath: 'https://unpkg.com/tesseract.js@4.1.1/dist/worker.min.js',
                        langPath: 'https://unpkg.com/tesseract.js@4.1.1/dist/',
                        corePath: 'https://unpkg.com/tesseract.js@4.1.1/dist/'
                    });
                } catch (recognizeError) {
                    console.log('⚠️ All attempts failed, throwing error...');
                    throw recognizeError;
                }
            }
            console.log('✅ Tesseract.recognize completed');

            if (progressContainer) {
                progressContainer.classList.add('hidden');
            }

            if (!result || !result.data || !result.data.text) {
                throw new Error('No text could be extracted from the image');
            }

            return result.data.text;

        } catch (error) {
            console.error('❌ OCR Error:', error);
            console.error('❌ Error details:', {
                name: error.name,
                message: error.message,
                stack: error.stack
            });

            // Hide progress container
            if (progressContainer) {
                progressContainer.classList.add('hidden');
            }

            // Provide user-friendly error messages with specific solutions
            let errorMessage = 'OCR processing failed';
            let suggestion = 'Please try again or use a different image.';

            // Safely check error message
            const errorText = error?.message || error?.toString() || 'Unknown error';

            if (errorText.includes('Content Security Policy') || errorText.includes('script-src') || errorText.includes('violates the following directive')) {
                errorMessage = 'Browser security policy is blocking OCR resources.';
                suggestion = 'The page has been updated to fix this. Please hard refresh (Ctrl+Shift+R) and try again.';
            } else if (errorText.includes('Worker') || errorText.includes('importScripts')) {
                errorMessage = 'OCR worker failed to load.';
                suggestion = 'This may be a CDN issue. Please refresh and try again, or try a different browser.';
            } else if (errorText.includes('network') || errorText.includes('fetch') || errorText.includes('NetworkError')) {
                errorMessage = 'Network error during OCR processing.';
                suggestion = 'Please check your internet connection and try again.';
            } else if (errorText.includes('timeout')) {
                errorMessage = 'OCR processing took too long.';
                suggestion = 'Try with a smaller, clearer image with better lighting.';
            } else if (errorText.includes('cloned')) {
                errorMessage = 'OCR engine initialization failed.';
                suggestion = 'Please refresh the page and try again.';
            } else if (errorText.includes('wasm') || errorText.includes('WASM')) {
                errorMessage = 'OCR engine resources failed to load.';
                suggestion = 'This may be a temporary network issue. Please refresh and try again.';
            } else if (errorText.includes('cdn.jsdelivr.net') || errorText.includes('unpkg.com')) {
                errorMessage = 'OCR resources could not be loaded from CDN.';
                suggestion = 'CDN may be temporarily unavailable. Please try again in a few minutes.';
            }

            // Show user-friendly error with suggestion
            this.showToast(`${errorMessage} ${suggestion}`, 'error');
            throw new Error(errorMessage);
        }
    }

    async parseOCRText(ocrText) {
        console.log('📝 Starting advanced OCR text parsing...');
        console.log('Raw OCR text:', ocrText);

        const extractedData = {
            firstName: '',
            lastName: '',
            company: '',
            jobTitle: '',
            phoneNumbers: [],
            emails: [],
            website: '',
            notes: '',
            address: { street: '', city: '', state: '', zipCode: '' }
        };

        const lines = ocrText.split('\n').filter(line => line.trim()).map(line => line.trim());
        console.log('Cleaned lines:', lines);

        // Advanced regex patterns
        const patterns = {
            email: /\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,}\b/gi,
            phone: /(?:\+?1[-.\s]?)?\(?([0-9]{3})\)?[-.\s]?([0-9]{3})[-.\s]?([0-9]{4})/g,
            website: /(?:https?:\/\/)?(?:www\.)?[a-zA-Z0-9][a-zA-Z0-9-]{1,61}[a-zA-Z0-9]\.[a-zA-Z]{2,}/gi,
            zipCode: /\b\d{5}(?:-\d{4})?\b/g,
            // Job title indicators
            jobTitleKeywords: /\b(CEO|CTO|CFO|COO|President|Vice President|VP|Director|Manager|Senior|Lead|Head|Chief|Executive|Officer|Coordinator|Specialist|Analyst|Developer|Engineer|Designer|Consultant|Sales|Marketing|HR|Human Resources|Operations|Finance|Legal|IT|Technology|Product|Project)\b/gi,
            // Company indicators
            companyKeywords: /\b(Inc|LLC|Corp|Corporation|Company|Co\.|Ltd|Limited|Group|Associates|Partners|Enterprises|Solutions|Services|Systems|Technologies|Tech|Consulting|International|Global|Holdings|Industries|Agency|Studio|Firm|Organization|Institute|Foundation)\b/gi,
            // Name patterns (capitalized words, typically 2-4 words)
            namePattern: /^[A-Z][a-z]+(?:\s+[A-Z][a-z]+)*$/,
            // Address patterns
            addressPattern: /\b\d+\s+[A-Za-z\s]+(?:Street|St|Avenue|Ave|Road|Rd|Boulevard|Blvd|Lane|Ln|Drive|Dr|Court|Ct|Place|Pl)\b/gi,
            // City, State patterns
            cityStatePattern: /([A-Za-z\s]+),\s*([A-Z]{2})\s*\d{5}/g
        };

        // Extract structured data
        this._extractEmails(ocrText, extractedData, patterns);
        this._extractPhones(ocrText, extractedData, patterns);
        this._extractWebsites(ocrText, extractedData, patterns);
        this._extractAddress(ocrText, lines, extractedData, patterns);
        this._extractNameCompanyTitle(lines, extractedData, patterns);

        console.log('📊 Parsed data:', extractedData);

        // Add LLM validation layer
        if (this.llmConfig && this.llmConfig.enabled) {
            console.log('🤖 Sending to LLM for validation and correction...');
            try {
                const llmCorrectedData = await this.validateWithLLM(ocrText, extractedData);
                console.log('✅ LLM corrected data:', llmCorrectedData);
                return llmCorrectedData;
            } catch (error) {
                console.error('❌ LLM validation failed, using original parsing:', error);
                return extractedData;
            }
        }

        return extractedData;
    }

    async validateWithLLM(ocrText, parsedData) {
        console.log('🤖 Starting LLM validation...');

        const prompt = this._createValidationPrompt(ocrText, parsedData);

        try {
            const response = await fetch(`${this.llmConfig.baseURL}/chat/completions`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${this.llmConfig.apiKey}`
                },
                body: JSON.stringify({
                    model: this.llmConfig.model,
                    messages: [
                        {
                            role: 'system',
                            content: 'You are an expert at analyzing business card text and extracting contact information. You must respond with valid JSON only, no additional text.'
                        },
                        {
                            role: 'user',
                            content: prompt
                        }
                    ],
                    max_tokens: this.llmConfig.maxTokens,
                    temperature: this.llmConfig.temperature
                })
            });

            if (!response.ok) {
                throw new Error(`LLM API error: ${response.status} ${response.statusText}`);
            }

            const result = await response.json();
            const llmResponse = result.choices[0].message.content.trim();

            console.log('🤖 LLM raw response:', llmResponse);

            // Parse the JSON response
            const correctedData = JSON.parse(llmResponse);

            // Validate the structure
            const validatedData = this._validateLLMResponse(correctedData, parsedData);

            console.log('✅ LLM validation complete');
            return validatedData;

        } catch (error) {
            console.error('❌ LLM validation error:', error);
            throw error;
        }
    }

    _createValidationPrompt(ocrText, parsedData) {
        return `Please analyze this business card OCR text and correct/improve the extracted contact information.

OCR Text:
"""
${ocrText}
"""

Current Parsed Data:
"""
${JSON.stringify(parsedData, null, 2)}
"""

Instructions:
1. Review the OCR text and the parsed data
2. Correct any obvious errors in field assignments
3. Improve name formatting (proper case, full names)
4. Ensure job titles are complete and properly formatted
5. Verify company names are complete and correctly capitalized
6. Standardize phone number formatting
7. Ensure email addresses are lowercase
8. Add https:// to websites if missing
9. Extract any additional relevant information for the notes field

Please respond with ONLY a JSON object in this exact format:
{
    "firstName": "string",
    "lastName": "string",
    "company": "string",
    "jobTitle": "string",
    "email": "string",
    "phone": "string",
    "website": "string",
    "notes": "string"
}

Important:
- Use empty strings for missing information, not null
- Format phone numbers consistently
- Use proper capitalization for names and titles
- Include only the most relevant information
- Keep notes brief and factual`;
    }

    _validateLLMResponse(llmData, fallbackData) {
        console.log('🔍 Validating LLM response structure...');

        const validatedData = {
            firstName: this._validateString(llmData.firstName, fallbackData.firstName),
            lastName: this._validateString(llmData.lastName, fallbackData.lastName),
            company: this._validateString(llmData.company, fallbackData.company),
            jobTitle: this._validateString(llmData.jobTitle, fallbackData.jobTitle),
            emails: [],
            phoneNumbers: [],
            website: this._validateString(llmData.website, fallbackData.website),
            notes: this._validateString(llmData.notes, ''),
            address: fallbackData.address || { street: '', city: '', state: '', zipCode: '' }
        };

        // Convert single email/phone to array format
        if (llmData.email && llmData.email.trim()) {
            validatedData.emails.push({ type: 'work', email: llmData.email.toLowerCase().trim() });
        } else if (fallbackData.emails && fallbackData.emails.length > 0) {
            validatedData.emails = fallbackData.emails;
        }

        if (llmData.phone && llmData.phone.trim()) {
            validatedData.phoneNumbers.push({ type: 'work', number: llmData.phone.trim() });
        } else if (fallbackData.phoneNumbers && fallbackData.phoneNumbers.length > 0) {
            validatedData.phoneNumbers = fallbackData.phoneNumbers;
        }

        console.log('✅ LLM response validated');
        return validatedData;
    }

    _validateString(llmValue, fallbackValue) {
        if (typeof llmValue === 'string' && llmValue.trim().length > 0) {
            return llmValue.trim();
        }
        return fallbackValue || '';
    }

    _extractEmails(text, data, patterns) {
        const emails = text.match(patterns.email);
        if (emails) {
            emails.forEach(email => {
                data.emails.push({ type: 'work', email: email.toLowerCase() });
            });
            console.log('📧 Found emails:', emails);
        }
    }

    _extractPhones(text, data, patterns) {
        const phones = text.match(patterns.phone);
        if (phones) {
            phones.forEach(phone => {
                // Clean and format phone number
                const cleaned = phone.replace(/\D/g, '');
                if (cleaned.length === 10) {
                    const formatted = `(${cleaned.slice(0,3)}) ${cleaned.slice(3,6)}-${cleaned.slice(6)}`;
                    data.phoneNumbers.push({ type: 'work', number: formatted });
                } else if (cleaned.length === 11 && cleaned.startsWith('1')) {
                    const formatted = `+1 (${cleaned.slice(1,4)}) ${cleaned.slice(4,7)}-${cleaned.slice(7)}`;
                    data.phoneNumbers.push({ type: 'work', number: formatted });
                } else {
                    data.phoneNumbers.push({ type: 'work', number: phone });
                }
            });
            console.log('📞 Found phones:', phones);
        }
    }

    _extractWebsites(text, data, patterns) {
        const websites = text.match(patterns.website);
        if (websites) {
            let website = websites[0].toLowerCase();
            if (!website.startsWith('http')) {
                website = 'https://' + website;
            }
            data.website = website;
            console.log('🌐 Found website:', website);
        }
    }

    _extractAddress(text, lines, data, patterns) {
        // Extract ZIP code
        const zips = text.match(patterns.zipCode);
        if (zips) {
            data.address.zipCode = zips[0];
        }

        // Extract city, state
        const cityStateMatch = text.match(patterns.cityStatePattern);
        if (cityStateMatch) {
            const match = cityStateMatch[0];
            const parts = match.split(',');
            if (parts.length >= 2) {
                data.address.city = parts[0].trim();
                const stateZip = parts[1].trim().split(/\s+/);
                data.address.state = stateZip[0];
            }
        }

        // Extract street address
        const addresses = text.match(patterns.addressPattern);
        if (addresses) {
            data.address.street = addresses[0];
        }

        console.log('🏠 Found address components:', data.address);
    }

    _extractNameCompanyTitle(lines, data, patterns) {
        console.log('👤 Analyzing lines for name, company, and title...');

        // Score each line based on what it might be
        const lineAnalysis = lines.map(line => {
            const analysis = {
                text: line,
                isEmail: patterns.email.test(line),
                isPhone: patterns.phone.test(line),
                isWebsite: patterns.website.test(line),
                isAddress: patterns.addressPattern.test(line),
                hasJobKeywords: patterns.jobTitleKeywords.test(line),
                hasCompanyKeywords: patterns.companyKeywords.test(line),
                isNameLike: patterns.namePattern.test(line),
                wordCount: line.split(/\s+/).length,
                hasNumbers: /\d/.test(line),
                isAllCaps: line === line.toUpperCase() && line.length > 2,
                length: line.length
            };

            // Calculate scores
            analysis.nameScore = this._calculateNameScore(analysis);
            analysis.titleScore = this._calculateTitleScore(analysis);
            analysis.companyScore = this._calculateCompanyScore(analysis);

            return analysis;
        });

        console.log('📊 Line analysis:', lineAnalysis);

        // Filter out obvious non-name/title/company lines
        const candidates = lineAnalysis.filter(analysis =>
            !analysis.isEmail &&
            !analysis.isPhone &&
            !analysis.isWebsite &&
            !analysis.isAddress &&
            analysis.length > 1 &&
            analysis.length < 100
        );

        // Extract name (highest name score)
        const nameCandidate = candidates
            .filter(c => c.nameScore > 0)
            .sort((a, b) => b.nameScore - a.nameScore)[0];

        if (nameCandidate) {
            const nameParts = nameCandidate.text.split(/\s+/).filter(part =>
                part.length > 1 && /^[A-Za-z]/.test(part)
            );

            if (nameParts.length >= 2) {
                data.firstName = nameParts[0];
                data.lastName = nameParts.slice(1).join(' ');
            } else if (nameParts.length === 1) {
                data.firstName = nameParts[0];
            }
            console.log('👤 Extracted name:', { firstName: data.firstName, lastName: data.lastName });
        }

        // Extract job title (highest title score, excluding name)
        const titleCandidate = candidates
            .filter(c => c !== nameCandidate && c.titleScore > 0)
            .sort((a, b) => b.titleScore - a.titleScore)[0];

        if (titleCandidate) {
            data.jobTitle = titleCandidate.text;
            console.log('💼 Extracted job title:', data.jobTitle);
        }

        // Extract company (highest company score, excluding name and title)
        const companyCandidate = candidates
            .filter(c => c !== nameCandidate && c !== titleCandidate && c.companyScore > 0)
            .sort((a, b) => b.companyScore - a.companyScore)[0];

        if (companyCandidate) {
            data.company = companyCandidate.text;
            console.log('🏢 Extracted company:', data.company);
        }

        // If we still don't have good matches, use fallback logic
        this._fallbackExtraction(candidates, data, nameCandidate, titleCandidate, companyCandidate);
    }

    _calculateNameScore(analysis) {
        let score = 0;

        // Positive indicators for names
        if (analysis.isNameLike) score += 50;
        if (analysis.wordCount >= 2 && analysis.wordCount <= 4) score += 30;
        if (!analysis.hasNumbers) score += 20;
        if (!analysis.isAllCaps) score += 15;
        if (analysis.length >= 5 && analysis.length <= 30) score += 10;

        // Negative indicators
        if (analysis.hasJobKeywords) score -= 30;
        if (analysis.hasCompanyKeywords) score -= 40;
        if (analysis.wordCount > 5) score -= 20;
        if (analysis.hasNumbers) score -= 25;

        return Math.max(0, score);
    }

    _calculateTitleScore(analysis) {
        let score = 0;

        // Positive indicators for job titles
        if (analysis.hasJobKeywords) score += 60;
        if (analysis.wordCount >= 2 && analysis.wordCount <= 6) score += 20;
        if (!analysis.hasNumbers) score += 15;
        if (analysis.length >= 5 && analysis.length <= 50) score += 10;

        // Common title patterns
        if (/\b(Manager|Director|Senior|Lead|Head|Chief|Vice|Assistant|Associate)\b/i.test(analysis.text)) score += 30;

        // Negative indicators
        if (analysis.isNameLike && analysis.wordCount <= 3) score -= 40;
        if (analysis.hasCompanyKeywords) score -= 20;
        if (analysis.isAllCaps && analysis.length > 20) score -= 15;

        return Math.max(0, score);
    }

    _calculateCompanyScore(analysis) {
        let score = 0;

        // Positive indicators for company names
        if (analysis.hasCompanyKeywords) score += 50;
        if (analysis.wordCount >= 2 && analysis.wordCount <= 8) score += 20;
        if (analysis.length >= 5 && analysis.length <= 60) score += 10;
        if (analysis.isAllCaps) score += 15;

        // Common company patterns
        if (/\b(Solutions|Services|Systems|Technologies|Consulting|International|Global)\b/i.test(analysis.text)) score += 25;

        // Negative indicators
        if (analysis.isNameLike && analysis.wordCount <= 3) score -= 30;
        if (analysis.hasJobKeywords) score -= 25;
        if (analysis.hasNumbers && !/\b(Inc|LLC|Corp)\b/i.test(analysis.text)) score -= 15;

        return Math.max(0, score);
    }

    _fallbackExtraction(candidates, data, nameCandidate, titleCandidate, companyCandidate) {
        console.log('🔄 Using fallback extraction logic...');

        // If no name found, try first reasonable line
        if (!data.firstName && candidates.length > 0) {
            const firstCandidate = candidates.find(c =>
                c.wordCount >= 2 &&
                c.wordCount <= 4 &&
                !c.hasNumbers &&
                c.length <= 40
            );

            if (firstCandidate) {
                const parts = firstCandidate.text.split(/\s+/);
                data.firstName = parts[0];
                data.lastName = parts.slice(1).join(' ');
                console.log('🔄 Fallback name extraction:', { firstName: data.firstName, lastName: data.lastName });
            }
        }

        // If no title found, look for lines with professional keywords
        if (!data.jobTitle && candidates.length > 1) {
            const titleFallback = candidates.find(c =>
                c !== nameCandidate &&
                (c.hasJobKeywords || /\b(Manager|Director|Coordinator|Specialist|Analyst)\b/i.test(c.text)) &&
                c.length <= 50
            );

            if (titleFallback) {
                data.jobTitle = titleFallback.text;
                console.log('🔄 Fallback title extraction:', data.jobTitle);
            }
        }

        // If no company found, look for remaining substantial lines
        if (!data.company && candidates.length > 2) {
            const companyFallback = candidates.find(c =>
                c !== nameCandidate &&
                c !== titleCandidate &&
                c.wordCount >= 2 &&
                c.length >= 5 &&
                !c.hasJobKeywords
            );

            if (companyFallback) {
                data.company = companyFallback.text;
                console.log('🔄 Fallback company extraction:', data.company);
            }
        }
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

        // Refresh touch handlers for scan buttons
        this.refreshTouchHandlers();
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

    // LLM Configuration Management
    configureLLM(config) {
        console.log('🤖 Configuring LLM settings...');

        if (config.apiKey) {
            this.llmConfig.apiKey = config.apiKey;
            this.llmConfig.enabled = true;
        }

        if (config.baseURL) {
            this.llmConfig.baseURL = config.baseURL;
        }

        if (config.model) {
            this.llmConfig.model = config.model;
        }

        if (config.customModel !== undefined) {
            this.llmConfig.customModel = config.customModel;
        }

        if (config.maxTokens) {
            this.llmConfig.maxTokens = config.maxTokens;
        }

        if (config.temperature !== undefined) {
            this.llmConfig.temperature = config.temperature;
        }

        // Save to localStorage (exclude sensitive data in production)
        const configToSave = { ...this.llmConfig };
        if (window.location.hostname !== 'localhost' && window.location.hostname !== '127.0.0.1') {
            // In production, don't save API key to localStorage for security
            configToSave.apiKey = configToSave.apiKey ? '***CONFIGURED***' : '';
        }
        localStorage.setItem('llmConfig', JSON.stringify(configToSave));

        console.log('✅ LLM configuration updated:', {
            enabled: this.llmConfig.enabled,
            baseURL: this.llmConfig.baseURL,
            model: this.llmConfig.model,
            customModel: this.llmConfig.customModel,
            hasApiKey: !!this.llmConfig.apiKey
        });

        this.updateLLMStatus();
    }

    loadLLMConfig() {
        const saved = localStorage.getItem('llmConfig');
        if (saved) {
            try {
                const config = JSON.parse(saved);
                this.llmConfig = { ...this.llmConfig, ...config };
                console.log('📥 Loaded LLM config from storage');
            } catch (error) {
                console.error('❌ Failed to load LLM config:', error);
            }
        }
        this.updateLLMStatus();
    }

    updateLLMStatus() {
        const statusElement = document.getElementById('llm-status');
        if (statusElement) {
            if (this.llmConfig.enabled && this.llmConfig.apiKey) {
                statusElement.textContent = '🤖 LLM Enabled';
                statusElement.className = 'llm-status enabled';
            } else {
                statusElement.textContent = '🤖 LLM Disabled';
                statusElement.className = 'llm-status disabled';
            }
        }
    }

    // Test LLM connection
    async testLLMConnection() {
        if (!this.llmConfig.enabled || !this.llmConfig.apiKey) {
            throw new Error('LLM not configured');
        }

        try {
            const response = await fetch(`${this.llmConfig.baseURL}/chat/completions`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${this.llmConfig.apiKey}`
                },
                body: JSON.stringify({
                    model: this.llmConfig.model,
                    messages: [{ role: 'user', content: 'Hello' }],
                    max_tokens: 10
                })
            });

            if (response.ok) {
                console.log('✅ LLM connection test successful');
                return true;
            } else {
                throw new Error(`HTTP ${response.status}: ${response.statusText}`);
            }
        } catch (error) {
            console.error('❌ LLM connection test failed:', error);
            throw error;
        }
    }

    // UI functions for LLM configuration
    saveLLMConfig() {
        const apiKey = document.getElementById('llm-api-key').value.trim();
        const baseURL = document.getElementById('llm-base-url').value.trim() || 'https://api.openai.com/v1';
        const selectedModel = document.getElementById('llm-model').value;
        const customModel = document.getElementById('llm-custom-model').value.trim();

        if (!apiKey) {
            this.showToast('Please enter an API key', 'error');
            return;
        }

        // Determine the actual model to use
        let model = selectedModel;
        if (selectedModel === 'custom') {
            if (!customModel) {
                this.showToast('Please enter a custom model name', 'error');
                return;
            }
            model = customModel;
        }

        this.configureLLM({
            apiKey,
            baseURL,
            model,
            customModel: selectedModel === 'custom' ? customModel : ''
        });

        this.showToast('LLM configuration saved successfully', 'success');
        this.populateLLMForm(); // Refresh the form
    }

    async testLLMConnectionUI() {
        const testBtn = document.getElementById('test-llm-connection');
        const originalText = testBtn.textContent;

        try {
            testBtn.textContent = 'Testing...';
            testBtn.disabled = true;

            await this.testLLMConnection();
            this.showToast('LLM connection successful!', 'success');

        } catch (error) {
            this.showToast(`Connection failed: ${error.message}`, 'error');
        } finally {
            testBtn.textContent = originalText;
            testBtn.disabled = false;
        }
    }

    disableLLM() {
        this.llmConfig.enabled = false;
        this.llmConfig.apiKey = '';
        localStorage.removeItem('llmConfig');

        this.updateLLMStatus();
        this.populateLLMForm();
        this.showToast('LLM disabled', 'info');
    }

    populateLLMForm() {
        // Handle API key display
        const apiKeyInput = document.getElementById('llm-api-key');
        if (apiKeyInput) {
            apiKeyInput.value = this.llmConfig.apiKey && this.llmConfig.apiKey !== '***CONFIGURED***' ? '••••••••••••••••' : '';
        }

        // Set base URL
        const baseUrlInput = document.getElementById('llm-base-url');
        if (baseUrlInput) {
            baseUrlInput.value = this.llmConfig.baseURL;
        }

        // Handle model selection
        const modelSelect = document.getElementById('llm-model');
        const customModelInput = document.getElementById('llm-custom-model');
        const customModelGroup = document.getElementById('custom-model-group');

        if (modelSelect && customModelInput && customModelGroup) {
            // Check if current model is in the predefined list
            const predefinedModels = Array.from(modelSelect.options).map(option => option.value);

            if (predefinedModels.includes(this.llmConfig.model)) {
                modelSelect.value = this.llmConfig.model;
                customModelGroup.style.display = 'none';
            } else {
                // Custom model
                modelSelect.value = 'custom';
                customModelInput.value = this.llmConfig.model;
                customModelGroup.style.display = 'block';
            }
        }

        // Add event listener for model selection change
        if (modelSelect) {
            modelSelect.addEventListener('change', (e) => {
                if (e.target.value === 'custom') {
                    customModelGroup.style.display = 'block';
                    customModelInput.focus();
                } else {
                    customModelGroup.style.display = 'none';
                }
            });
        }
    }

    // Import backup function (was missing)
    async importBackup(file) {
        if (!file) return;

        try {
            const text = await file.text();
            const backup = JSON.parse(text);

            if (backup.contacts && Array.isArray(backup.contacts)) {
                // Clear existing data
                await this.clearAllData(false); // Don't show confirmation

                // Import contacts
                for (const contact of backup.contacts) {
                    await this.saveContact(contact);
                }

                await this.loadContacts();
                this.updateDashboard();
                this.showToast(`Imported ${backup.contacts.length} contacts successfully`, 'success');
            } else {
                throw new Error('Invalid backup file format');
            }
        } catch (error) {
            console.error('Import error:', error);
            this.showToast('Failed to import backup', 'error');
        }
    }
}

// Initialize the application
document.addEventListener('DOMContentLoaded', () => {
    window.contactManager = new ContactManager();
});