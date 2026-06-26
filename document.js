document.addEventListener('DOMContentLoaded', () => {
    // --- Theme Toggle Logic ---
    const themeToggleBtn = document.getElementById('themeToggleBtn');
    const themeIcon = document.getElementById('themeIcon');
    
    function setTheme(isDark) {
        if(isDark) {
            document.documentElement.setAttribute('data-theme', 'dark');
            if(themeIcon) {
                themeIcon.classList.remove('ph-moon');
                themeIcon.classList.add('ph-sun');
            }
            localStorage.setItem('school_theme', 'dark');
        } else {
            document.documentElement.removeAttribute('data-theme');
            if(themeIcon) {
                themeIcon.classList.remove('ph-sun');
                themeIcon.classList.add('ph-moon');
            }
            localStorage.setItem('school_theme', 'light');
        }
    }
    
    // Load saved theme
    if(localStorage.getItem('school_theme') === 'dark') {
        setTheme(true);
    }
    
    if(themeToggleBtn) {
        themeToggleBtn.addEventListener('click', () => {
            const isDark = document.documentElement.getAttribute('data-theme') === 'dark';
            setTheme(!isDark);
        });
    }

    // --- Auto Session Logic ---
    const sessionInput = document.getElementById('sessionYear');
    if (sessionInput && sessionInput.value === "2023-2024") {
        const now = new Date();
        const year = now.getFullYear();
        const month = now.getMonth();
        // Indian academic session typically starts in April
        if (month < 3) {
            sessionInput.value = `${year - 1}-${year}`;
        } else {
            sessionInput.value = `${year}-${year + 1}`;
        }
    }

    // Authentication Logic
    const authWrapper = document.getElementById('authWrapper');
    const mainAppWrapper = document.getElementById('mainAppWrapper');
    const loginView = document.getElementById('loginView');
    const signUpView = document.getElementById('signUpView');
    const forgotPasswordView = document.getElementById('forgotPasswordView');
    
    const loginForm = document.getElementById('loginForm');
    const signUpForm = document.getElementById('signUpForm');
    const forgotPasswordForm = document.getElementById('forgotPasswordForm');
    
    const showSignUpBtn = document.getElementById('showSignUpBtn');
    const showLoginBtn = document.getElementById('showLoginBtn');
    const showForgotBtn = document.getElementById('showForgotBtn');
    const backToLoginBtn = document.getElementById('backToLoginBtn');
    
    const logoutBtn = document.getElementById('logoutBtn');

    // Toggle Auth Views
    function hideAllAuthViews() {
        loginView.classList.add('hidden');
        signUpView.classList.add('hidden');
        forgotPasswordView.classList.add('hidden');
    }

    if(showSignUpBtn) {
        showSignUpBtn.addEventListener('click', (e) => {
            e.preventDefault();
            hideAllAuthViews();
            signUpView.classList.remove('hidden');
        });
    }
    if(showLoginBtn) {
        showLoginBtn.addEventListener('click', (e) => {
            e.preventDefault();
            hideAllAuthViews();
            loginView.classList.remove('hidden');
        });
    }
    if(showForgotBtn) {
        showForgotBtn.addEventListener('click', (e) => {
            e.preventDefault();
            hideAllAuthViews();
            forgotPasswordView.classList.remove('hidden');
        });
    }
    if(backToLoginBtn) {
        backToLoginBtn.addEventListener('click', (e) => {
            e.preventDefault();
            hideAllAuthViews();
            loginView.classList.remove('hidden');
        });
    }

    // Helper for auth users db (Deprecated, now using backend)
    // function getAuthDb() ...
    // function saveAuthDb() ...

    let currentDbState = [];
    
    async function loadSettingsFromServer(email) {
        try {
            const res = await fetch(`/api/settings?email=${email}`);
            const data = await res.json();
            if (data && data.email) {
                if (data.logo_img) localStorage.setItem(`logoImg_${email}`, data.logo_img);
                else localStorage.removeItem(`logoImg_${email}`);

                if (data.logo_settings) localStorage.setItem(`logoSettings_${email}`, data.logo_settings);
                else localStorage.removeItem(`logoSettings_${email}`);

                if (data.remove_logo_bg !== null && data.remove_logo_bg !== undefined) {
                    localStorage.setItem(`removeLogoBgBtn_${email}`, data.remove_logo_bg ? 'true' : 'false');
                } else {
                    localStorage.removeItem(`removeLogoBgBtn_${email}`);
                }

                if (data.school_name) localStorage.setItem(`instName_${email}`, data.school_name);
                else localStorage.removeItem(`instName_${email}`);

                if (data.school_tagline) localStorage.setItem(`instTagline_${email}`, data.school_tagline);
                else localStorage.removeItem(`instTagline_${email}`);

                if (data.watermark_img) localStorage.setItem(`watermark_${email}`, data.watermark_img);
                else localStorage.removeItem(`watermark_${email}`);

                if (data.result_theme) localStorage.setItem(`resultTheme_${email}`, data.result_theme);
                else localStorage.removeItem(`resultTheme_${email}`);

                if (data.school_affiliation) localStorage.setItem(`instAffiliation_${email}`, data.school_affiliation);
                else localStorage.removeItem(`instAffiliation_${email}`);

                if (data.school_board) localStorage.setItem(`boardSelect_${email}`, data.school_board);
                else localStorage.removeItem(`boardSelect_${email}`);
            }
        } catch(err) {
            console.error("Failed to load settings from server:", err);
        }
    }

    // Check Auto-Login and Initialize Data
    const currentUser = sessionStorage.getItem('currentUser');
    if(currentUser && authWrapper && mainAppWrapper) {
        authWrapper.classList.add('hidden');
        mainAppWrapper.classList.remove('hidden');
        
        // Show and populate user profile widget
        const userProfileWidget = document.getElementById('userProfileWidget');
        const userEmailText = document.getElementById('userEmailText');
        const userAvatar = document.getElementById('userAvatar');
        if (userProfileWidget && userEmailText && currentUser) {
            userEmailText.textContent = currentUser;
            if(userAvatar) {
                userAvatar.textContent = currentUser.charAt(0).toUpperCase();
            }
            userProfileWidget.classList.remove('hidden');
        }
        
        // Load settings from server, then apply to UI
        loadSettingsFromServer(currentUser).then(() => {
            if (typeof applySavedSettingsToUI === 'function') {
                applySavedSettingsToUI(currentUser);
            }
        });
        
        // Fetch students from backend
        fetch(`/api/students?email=${currentUser}`)
            .then(res => res.json())
            .then(data => {
                currentDbState = Array.isArray(data) ? data : [];
                if(typeof renderDbTable === 'function') renderDbTable();
            })
            .catch(err => console.error("Failed to load students:", err));
    }

    // Sign Up Logic
    if(signUpForm) {
        signUpForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            const email = document.getElementById('signupEmail').value.toLowerCase().trim();
            const pass = document.getElementById('signupPassword').value;
            const confirmPass = document.getElementById('signupConfirmPassword').value;
            const inviteCode = document.getElementById('signupInviteCode').value.trim();

            if(pass !== confirmPass) {
                alert('Passwords do not match!');
                return;
            }

            try {
                const res = await fetch('/api/auth/signup', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ email, pass, inviteCode })
                });
                const data = await res.json();
                
                if (res.ok) {
                    alert('Account created successfully! Please login.');
                    signUpForm.reset();
                    hideAllAuthViews();
                    loginView.classList.remove('hidden');
                } else {
                    alert(data.error || 'Signup failed. Please try again.');
                }
            } catch (err) {
                console.error(err);
                alert('Failed to connect to the backend server.');
            }
        });
    }

    // Login Logic
    if(loginForm) {
        loginForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            const email = document.getElementById('loginEmail').value.toLowerCase().trim();
            const pass = document.getElementById('loginPassword').value;

            try {
                const res = await fetch('/api/auth/login', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ email, pass })
                });
                const data = await res.json();
                
                if (res.ok) {
                    sessionStorage.setItem('currentUser', data.email);
                    loginForm.reset();
                    window.location.reload();
                } else {
                    alert(data.error || 'Invalid email address or password!');
                }
            } catch (err) {
                console.error(err);
                alert('Failed to connect to the backend server.');
            }
        });

        // Demo Login Button Handler
        const demoLoginBtn = document.getElementById('demoLoginBtn');
        if (demoLoginBtn) {
            demoLoginBtn.addEventListener('click', () => {
                document.getElementById('loginEmail').value = 'demo@school.com';
                document.getElementById('loginPassword').value = 'demo';
                // Trigger form submission
                loginForm.dispatchEvent(new Event('submit'));
            });
        }
    }

    // Toggle Password Visibility (Eye buttons)
    document.querySelectorAll('.toggle-password-btn').forEach(btn => {
        btn.addEventListener('click', () => {
            const input = btn.previousElementSibling;
            const icon = btn.querySelector('i');
            if (input.type === 'password') {
                input.type = 'text';
                icon.classList.remove('ph-eye');
                icon.classList.add('ph-eye-slash');
            } else {
                input.type = 'password';
                icon.classList.remove('ph-eye-slash');
                icon.classList.add('ph-eye');
            }
        });
    });

    // Forgot Password Logic
    if(forgotPasswordForm) {
        forgotPasswordForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            const email = document.getElementById('forgotEmail').value.toLowerCase().trim();
            
            const submitBtn = forgotPasswordForm.querySelector('button[type="submit"]');
            const originalText = submitBtn.textContent;
            submitBtn.textContent = 'Sending...';
            submitBtn.disabled = true;

            try {
                const res = await fetch('/api/auth/forgot-password', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ email })
                });
                const data = await res.json();
                
                if (res.ok) {
                    if (data.resetLink) {
                        // Email not sent, show direct link
                        alert(data.message + '\n\nReset link (copy and open in browser):\n' + data.resetLink);
                    } else {
                        alert('✅ ' + data.message);
                    }
                    forgotPasswordForm.reset();
                    hideAllAuthViews();
                    loginView.classList.remove('hidden');
                } else {
                    alert('❌ ' + (data.error || 'Failed to send reset email. Please try again.'));
                }
            } catch (err) {
                console.error(err);
                alert('Failed to connect to the backend server.');
            } finally {
                submitBtn.textContent = originalText;
                submitBtn.disabled = false;
            }
        });
    }

    // Logout Logic
    if(logoutBtn) {
        logoutBtn.addEventListener('click', async () => {
            const currentUser = sessionStorage.getItem('currentUser');
            
            // If demo account - clear all students on logout
            if (currentUser === 'demo@school.com') {
                try {
                    await fetch('/api/demo/reset', { method: 'POST' });
                } catch(err) {
                    console.error('Demo reset failed:', err);
                }
            }
            
            sessionStorage.removeItem('currentUser');
            // Reload to clear state and show login screen
            window.location.reload();
        });
    }

    // Existing App Initialization
    const subjectsContainer = document.getElementById('subjectsContainer');
    const addSubBtn = document.getElementById('addSubBtn');
    const resultForm = document.getElementById('resultForm');
    const printBtn = document.getElementById('printBtn');
    const resultCard = document.getElementById('resultCard');

    // Tab Switching Logic
    const tabGenerateBtn = document.getElementById('tabGenerateBtn');
    const tabManageBtn = document.getElementById('tabManageBtn');
    const tabSavedBtn = document.getElementById('tabSavedBtn');
    const generateView = document.getElementById('generateView');
    const manageView = document.getElementById('manageView');
    const savedView = document.getElementById('savedView');

    if(tabGenerateBtn && tabManageBtn && tabSavedBtn) {
        function resetTabs() {
            generateView.classList.add('hidden');
            manageView.classList.add('hidden');
            savedView.classList.add('hidden');
            tabGenerateBtn.classList.replace('btn-primary', 'btn-secondary');
            tabManageBtn.classList.replace('btn-primary', 'btn-secondary');
            tabSavedBtn.classList.replace('btn-primary', 'btn-secondary');
            
            // Hide result card and bulk print container when switching tabs
            const resultCardElem = document.getElementById('resultCard');
            const bulkContainerElem = document.getElementById('bulkPrintContainer');
            if (resultCardElem) resultCardElem.classList.add('hidden');
            if (bulkContainerElem) bulkContainerElem.innerHTML = '';
            
            // Reset layout
            const appContainer = document.querySelector('#mainAppWrapper .app-container');
            if (appContainer) appContainer.classList.remove('has-results');
        }

        tabGenerateBtn.addEventListener('click', () => {
            resetTabs();
            generateView.classList.remove('hidden');
            tabGenerateBtn.classList.replace('btn-secondary', 'btn-primary');
        });
        tabManageBtn.addEventListener('click', () => {
            resetTabs();
            manageView.classList.remove('hidden');
            tabManageBtn.classList.replace('btn-secondary', 'btn-primary');
            renderDbTable();
        });
        tabSavedBtn.addEventListener('click', () => {
            resetTabs();
            savedView.classList.remove('hidden');
            tabSavedBtn.classList.replace('btn-secondary', 'btn-primary');
            
            // Auto-refresh the saved results view by resetting class dropdown
            const selectClassBulk = document.getElementById('selectClassBulk');
            if (selectClassBulk) {
                selectClassBulk.value = "";
                selectClassBulk.dispatchEvent(new Event('change'));
            }
        });
    }

    // --- Server Settings Sync ---
    let saveTimeout = null;
    function triggerServerSave() {
        if (saveTimeout) clearTimeout(saveTimeout);
        saveTimeout = setTimeout(saveSettingsToServer, 1000);
    }

    async function saveSettingsToServer() {
        const currentUser = sessionStorage.getItem('currentUser');
        if (!currentUser) return;

        const logoImg = localStorage.getItem(`logoImg_${currentUser}`) || null;
        const logoSettings = localStorage.getItem(`logoSettings_${currentUser}`) || null;
        const removeLogoBg = localStorage.getItem(`removeLogoBgBtn_${currentUser}`) === 'true';
        const instName = document.getElementById('instName')?.value || '';
        const instTagline = document.getElementById('instTagline')?.value || '';
        const instAffiliation = document.getElementById('instAffiliation')?.value || '';
        const boardSelect = document.getElementById('boardSelect')?.value || '';
        const resultTheme = document.getElementById('themeSelect')?.value || '';
        const watermark = localStorage.getItem(`watermark_${currentUser}`) || null;

        try {
            await fetch('/api/settings', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    email: currentUser,
                    logo_img: logoImg,
                    watermark_img: watermark,
                    logo_settings: logoSettings,
                    school_name: instName,
                    school_tagline: instTagline,
                    school_affiliation: instAffiliation,
                    school_board: boardSelect,
                    result_theme: resultTheme,
                    remove_logo_bg: removeLogoBg
                })
            });
        } catch (err) {
            console.error("Failed to save settings to server:", err);
        }
    }

    // --- Interactive Drag & Drop Logo Logic ---
    const uploadLogo = document.getElementById('uploadLogo');
    const primaryLogo = document.querySelector('#resultCard .school-logo');

    let lX = 0, lY = 0, lScale = 1;
    let isDragging = false, startMouseX = 0, startMouseY = 0, startX = 0, startY = 0;

    function saveLogoSettings() {
        const settings = { scale: lScale, x: lX, y: lY };
        localStorage.setItem(`logoSettings_${sessionStorage.getItem('currentUser')}`, JSON.stringify(settings));
        triggerServerSave();
    }

    function applyTransform() {
        if(primaryLogo) {
            primaryLogo.style.transform = `translate(${lX}px, ${lY}px) scale(${lScale})`;
        }
    }

    if(primaryLogo) {
        primaryLogo.addEventListener('mousedown', (e) => {
            isDragging = true;
            startMouseX = e.clientX;
            startMouseY = e.clientY;
            startX = lX;
            startY = lY;
            primaryLogo.style.cursor = 'grabbing';
            e.preventDefault(); // prevent native image drag
        });

        document.addEventListener('mousemove', (e) => {
            if(!isDragging) return;
            lX = startX + (e.clientX - startMouseX);
            lY = startY + (e.clientY - startMouseY);
            applyTransform();
        });

        document.addEventListener('mouseup', () => {
            if(isDragging) {
                isDragging = false;
                primaryLogo.style.cursor = 'grab';
                saveLogoSettings();
            }
        });

        primaryLogo.addEventListener('wheel', (e) => {
            e.preventDefault();
            if(e.deltaY < 0) {
                lScale += 0.05;
            } else {
                lScale -= 0.05;
            }
            if(lScale < 0.2) lScale = 0.2;
            if(lScale > 5) lScale = 5;
            applyTransform();
            saveLogoSettings();
        }, { passive: false });
    }

    if (uploadLogo) {
        uploadLogo.addEventListener('change', (e) => {
            const file = e.target.files[0];
            if(file) {
                const reader = new FileReader();
                reader.onload = function(event) {
                    const tempImg = new Image();
                    tempImg.onload = () => {
                        const canvas = document.createElement('canvas');
                        const ctx = canvas.getContext('2d');
                        // Scale down to max 100x100 for fast checking
                        const scale = Math.min(100 / tempImg.width, 100 / tempImg.height, 1);
                        canvas.width = Math.max(1, tempImg.width * scale);
                        canvas.height = Math.max(1, tempImg.height * scale);
                        ctx.drawImage(tempImg, 0, 0, canvas.width, canvas.height);
                        
                        try {
                            const imgData = ctx.getImageData(0, 0, canvas.width, canvas.height).data;
                            let hasTransparency = false;
                            for (let i = 3; i < imgData.length; i += 4) {
                                if (imgData[i] < 250) { // Check if any pixel has significant transparency
                                    hasTransparency = true;
                                    break;
                                }
                            }
                            if (!hasTransparency) {
                                alert("WARNING: It looks like this logo has a solid background. Please upload a logo with the background removed (Transparent PNG), otherwise a white box will appear on your result cards!");
                                uploadLogo.value = '';
                                return;
                            }
                        } catch(err) {
                            console.warn("Could not check transparency", err);
                        }
                        
                        document.querySelectorAll('.school-logo').forEach(l => {
                            l.src = event.target.result;
                            l.style.display = 'block';
                        });
                        localStorage.setItem(`logoImg_${sessionStorage.getItem('currentUser')}`, event.target.result);
                        triggerServerSave();
                    };
                    tempImg.src = event.target.result;
                };
                reader.readAsDataURL(file);
            }
        });
    }

    const logoImg = document.querySelector('.school-logo');
    
    const removeLogoBtn = document.getElementById('removeLogoBtn');
    if(removeLogoBtn) {
        removeLogoBtn.addEventListener('click', () => {
            document.querySelectorAll('.school-logo').forEach(l => {
                l.src = '';
                l.style.display = 'none';
                l.style.mixBlendMode = 'normal';
            });
            if (uploadLogo) uploadLogo.value = '';
            const removeLogoBgBtn = document.getElementById('removeLogoBgBtn');
            if (removeLogoBgBtn) removeLogoBgBtn.checked = false;
            
            const currentUser = sessionStorage.getItem('currentUser');
            if(currentUser) {
                localStorage.removeItem(`logoImg_${currentUser}`);
                localStorage.removeItem(`removeLogoBgBtn_${currentUser}`);
                triggerServerSave();
            }
        });
    }
    
    const removeLogoBgBtn = document.getElementById('removeLogoBgBtn');
    if(removeLogoBgBtn) {
        removeLogoBgBtn.addEventListener('change', (e) => {
            const currentUser = sessionStorage.getItem('currentUser');
            if (logoImg) {
                if (e.target.checked) {
                    logoImg.style.mixBlendMode = 'multiply';
                    if(currentUser) localStorage.setItem(`removeLogoBgBtn_${currentUser}`, 'true');
                } else {
                    logoImg.style.mixBlendMode = 'normal';
                    if(currentUser) localStorage.removeItem(`removeLogoBgBtn_${currentUser}`);
                }
                triggerServerSave();
            }
        });
    }
    


    // Load Saved Logo Data on Boot
    function applySavedSettingsToUI(currentUser) {
        if (currentUser) {
            const savedImg = localStorage.getItem(`logoImg_${currentUser}`);
            if (savedImg && primaryLogo) {
                primaryLogo.src = savedImg;
                primaryLogo.style.display = 'block';
            }
            const savedSettings = localStorage.getItem(`logoSettings_${currentUser}`);
            if (savedSettings) {
                const s = JSON.parse(savedSettings);
                lScale = s.scale || 1;
                lX = s.x || 0;
                lY = s.y || 0;
                applyTransform();
            }
            
            const removeBg = localStorage.getItem(`removeLogoBgBtn_${currentUser}`);
            if (removeBg === 'true' && primaryLogo) {
                const removeLogoBgBtn = document.getElementById('removeLogoBgBtn');
                if(removeLogoBgBtn) removeLogoBgBtn.checked = true;
                primaryLogo.style.mixBlendMode = 'multiply';
            }
            
            // Load School Details
            const instName = document.getElementById('instName');
            const instTagline = document.getElementById('instTagline');
            if (instName) {
                const savedName = localStorage.getItem(`instName_${currentUser}`);
                if(savedName) {
                    instName.value = savedName;
                    instName.dispatchEvent(new Event('input'));
                }
            }
            if (instTagline) {
                const savedTag = localStorage.getItem(`instTagline_${currentUser}`);
                if(savedTag) {
                    instTagline.value = savedTag;
                    instTagline.dispatchEvent(new Event('input'));
                }
            }
            
            // Load Watermark
            const watermarkEl = document.querySelector('.watermark');
            const savedWatermark = localStorage.getItem(`watermark_${currentUser}`);
            if(savedWatermark && watermarkEl) {
                watermarkEl.style.backgroundImage = `url('${savedWatermark}')`;
            }
            
            // Load Theme
            const savedTheme = localStorage.getItem(`resultTheme_${currentUser}`);
            const resultCard = document.querySelector('.result-card');
            const themeSelect = document.getElementById('themeSelect');
            if(savedTheme && resultCard && themeSelect) {
                themeSelect.value = savedTheme;
                resultCard.className = `result-card ${savedTheme}`;
            }
            
            // Load Affiliation & Board
            const instAffiliation = document.getElementById('instAffiliation');
            const boardSelect = document.getElementById('boardSelect');
            if (instAffiliation) {
                const savedAff = localStorage.getItem(`instAffiliation_${currentUser}`);
                if(savedAff) {
                    instAffiliation.value = savedAff;
                    instAffiliation.dispatchEvent(new Event('input'));
                }
            }
            if (boardSelect) {
                const savedBoard = localStorage.getItem(`boardSelect_${currentUser}`);
                if(savedBoard) {
                    boardSelect.value = savedBoard;
                    boardSelect.dispatchEvent(new Event('change'));
                }
            }
        }
    }
    
    // Listeners for Text persistence, Theme, and Watermark
    setTimeout(() => {
        const currentUser = sessionStorage.getItem('currentUser');
        if(!currentUser) return;
        
        const instName = document.getElementById('instName');
        const instTagline = document.getElementById('instTagline');
        if(instName) instName.addEventListener('input', (e) => {
            localStorage.setItem(`instName_${currentUser}`, e.target.value);
            document.querySelectorAll('#dispInstName').forEach(disp => {
                disp.textContent = e.target.value || 'S. TAGORE ACADEMY PUBLIC SCHOOL';
            });
            triggerServerSave();
        });
        
        if(instTagline) instTagline.addEventListener('input', (e) => {
            localStorage.setItem(`instTagline_${currentUser}`, e.target.value);
            document.querySelectorAll('#dispInstTagline').forEach(disp => {
                disp.textContent = e.target.value || 'A SCHOOL OF EXCELLENCE';
            });
            triggerServerSave();
        });
        
        const instAffiliation = document.getElementById('instAffiliation');
        if(instAffiliation) instAffiliation.addEventListener('input', (e) => {
            localStorage.setItem(`instAffiliation_${currentUser}`, e.target.value);
            document.querySelectorAll('#dispAffiliation').forEach(disp => {
                if(e.target.value.trim() !== '') {
                    disp.textContent = 'Affiliation No - ' + e.target.value;
                    disp.style.display = 'block';
                } else {
                    disp.style.display = 'none';
                }
            });
            triggerServerSave();
        });
        
        const boardSelect = document.getElementById('boardSelect');
        if(boardSelect) boardSelect.addEventListener('change', (e) => {
            localStorage.setItem(`boardSelect_${currentUser}`, e.target.value);
            document.querySelectorAll('#dispBoard').forEach(disp => {
                if(e.target.value !== 'none') {
                    disp.textContent = e.target.value;
                    disp.style.display = 'block';
                } else {
                    disp.style.display = 'none';
                }
            });
            triggerServerSave();
        });
        
        const themeSelect = document.getElementById('themeSelect');
        if(themeSelect) {
            themeSelect.addEventListener('change', (e) => {
                const val = e.target.value;
                document.querySelectorAll('.result-card').forEach(card => {
                    card.classList.remove('theme-pink', 'theme-blue', 'theme-green');
                    card.classList.add(val);
                });
                localStorage.setItem(`resultTheme_${currentUser}`, val);
                triggerServerSave();
            });
        }
        
        const uploadWatermark = document.getElementById('uploadWatermark');
        const removeWatermarkBtn = document.getElementById('removeWatermarkBtn');
        
        if (uploadWatermark) {
            uploadWatermark.addEventListener('change', (e) => {
                const file = e.target.files[0];
                if(file) {
                    const reader = new FileReader();
                    reader.onload = function(event) {
                        document.querySelectorAll('.watermark').forEach(w => {
                            w.style.backgroundImage = `url('${event.target.result}')`;
                        });
                        localStorage.setItem(`watermark_${currentUser}`, event.target.result);
                        triggerServerSave();
                    };
                    reader.readAsDataURL(file);
                }
            });
        }
        
        if(removeWatermarkBtn) {
            removeWatermarkBtn.addEventListener('click', () => {
                document.querySelectorAll('.watermark').forEach(w => {
                    w.style.backgroundImage = 'none';
                });
                if(uploadWatermark) uploadWatermark.value = '';
                localStorage.removeItem(`watermark_${currentUser}`);
                triggerServerSave();
            });
        }
    }, 400);
    // ----------------------------------------

    // Database Logic (Backend API with Local State)
    function getDb() {
        return currentDbState;
    }
    
    async function saveDb(data) {
        const previousState = currentDbState; // Save previous state for rollback
        currentDbState = data; // Optimistic update
        const currentUser = sessionStorage.getItem('currentUser');
        if(!currentUser) return;
        
        // Sync to backend
        try {
            const res = await fetch('/api/students', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ user_email: currentUser, students: data })
            });
            if (!res.ok) {
                const errData = await res.json();
                currentDbState = previousState; // Rollback on error
                alert('⚠️ ' + (errData.error || 'Failed to save. Please try again.'));
                renderDbTable();
                return;
            }
        } catch(err) {
            currentDbState = previousState; // Rollback on network error
            console.error("Failed to save backend data:", err);
            return;
        }
        // Dynamically update the current class list if one is selected
        const selectClassToGen = document.getElementById('selectClassToGenerate');
        if (selectClassToGen && selectClassToGen.value) {
            const cls = selectClassToGen.value;
            if (typeof currentClassList !== 'undefined') {
                currentClassList = data.filter(s => s.classSection === cls);
                currentClassList.sort((a, b) => {
                    const aPending = !a.subjectsData;
                    const bPending = !b.subjectsData;
                    if (aPending && !bPending) return -1;
                    if (!aPending && bPending) return 1;
                    return a.studentName.localeCompare(b.studentName);
                });
                const totalElem = document.getElementById('totalStudentsNum');
                if (totalElem) totalElem.textContent = currentClassList.length;
                
                // Update dropdown from save
                const studentSelect = document.getElementById('selectStudentToGenerate');
                if (studentSelect) {
                    const currentIndex = studentSelect.value;
                    studentSelect.innerHTML = '<option value="">-- Choose Student --</option>';
                    currentClassList.forEach((s, idx) => {
                        const opt = document.createElement('option');
                        opt.value = idx;
                        if (s.subjectsData) {
                            opt.textContent = `${idx + 1}. ${s.studentName} - \u2705 Done`;
                            opt.style.color = 'var(--text-main)';
                            opt.style.backgroundColor = 'var(--bg-input)';
                        } else {
                            opt.textContent = `${idx + 1}. ${s.studentName} - \u23F3 Pending`;
                            opt.style.color = 'var(--accent)';
                            opt.style.fontWeight = 'bold';
                            opt.style.backgroundColor = 'rgba(234, 88, 12, 0.05)';
                        }
                        studentSelect.appendChild(opt);
                    });
                    
                    if(currentIndex !== "") studentSelect.value = currentIndex;
                    
                    // Show search bar if there are students
                    const searchInput = document.getElementById('searchStudentInput');
                    if (searchInput) searchInput.style.display = 'block';
                }

                const searchInput = document.getElementById('searchStudentInput');
                if (searchInput) {
                    searchInput.addEventListener('input', (e) => {
                        const term = e.target.value.toLowerCase();
                        const sSelect = document.getElementById('selectStudentToGenerate');
                        if (!sSelect) return;
                        
                        // Hide or show options based on term
                        Array.from(sSelect.options).forEach((opt, idx) => {
                            if (opt.value === "") return; // Skip placeholder
                            
                            const studentName = currentClassList[idx - 1].studentName.toLowerCase();
                            if (studentName.includes(term)) {
                                opt.style.display = '';
                            } else {
                                opt.style.display = 'none';
                            }
                        });
                    });
                }
                
                // Remove the redundant studentSelect lookup since it's already in scope if we want to use it
                // We'll handle setting the value inside the if(studentSelect) block above instead of here.
            }
        }
    }

    // Add Student
    const addStudentForm = document.getElementById('addStudentForm');
    if(addStudentForm) {
        addStudentForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            
            // Frontend demo account - max 10 students check
            const currentUser = sessionStorage.getItem('currentUser');
            if (currentUser === 'demo@school.com') {
                const db = getDb();
                if (db.length >= 10) {
                    alert('🚫 Demo account has reached the 10 student limit!\n\nYou cannot add or delete students once the limit is reached. Please Sign Up for unlimited students.');
                    return;
                }
            }
            
            const student = {
                id: Date.now().toString(),
                classSection: document.getElementById('dbClass').value,
                studentName: document.getElementById('dbStudentName').value,
                fatherName: document.getElementById('dbFatherName').value,
                motherName: document.getElementById('dbMotherName').value,
                address: document.getElementById('dbAddress').value,
                dob: document.getElementById('dbDob').value
            };
            const db = getDb();
            db.push(student);
            await saveDb(db);
            addStudentForm.reset();
            renderDbTable();
            if (currentDbState.includes(student)) {
                alert('✅ Student added to the database successfully!');
            }
        });
    }

    // Render DB Table
    const dbTableBody = document.getElementById('dbTableBody');
    const filterClassDb = document.getElementById('filterClassDb');
    
    if(filterClassDb) {
        filterClassDb.addEventListener('change', renderDbTable);
    }

    // Event delegation for delete buttons
    if (dbTableBody) {
        dbTableBody.addEventListener('click', async (e) => {
            const deleteBtn = e.target.closest('.delete-btn');
            if (deleteBtn) {
                const id = deleteBtn.getAttribute('data-id');
                // Demo account: delete always blocked
                const currentUser = sessionStorage.getItem('currentUser');
                if (currentUser === 'demo@school.com') {
                    alert('🚫 Deleting students is not allowed in the Demo account.\n\nPlease Sign Up to create your own account with full control!');
                    return;
                }
                if(confirm("Are you sure you want to delete this student? This cannot be undone.")) {
                    let db = getDb();
                    db = db.filter(s => s.id !== id);
                    await saveDb(db);
                    renderDbTable();
                }
            }
        });
    }

    // Delete ALL students button
    const deleteAllStudentsBtn = document.getElementById('deleteAllStudentsBtn');
    if (deleteAllStudentsBtn) {
        deleteAllStudentsBtn.addEventListener('click', async () => {
            const db = getDb();
            if (!db.length) { alert('The database is already empty!'); return; }
            // Demo account: delete all always blocked
            const currentUser = sessionStorage.getItem('currentUser');
            if (currentUser === 'demo@school.com') {
                alert('🚫 Deleting students is not allowed in the Demo account.\n\nPlease Sign Up to create your own account with full control!');
                return;
            }
            if (confirm(`⚠️ Are you sure you want to delete ALL ${db.length} students?\nThis action cannot be undone!`)) {
                await saveDb([]);
                renderDbTable();
                alert('✅ All students deleted!');
            }
        });
    }

    // Delete ALL saved results button (clears subjectsData from all students)
    const deleteAllResultsBtn = document.getElementById('deleteAllResultsBtn');
    if (deleteAllResultsBtn) {
        deleteAllResultsBtn.addEventListener('click', () => {
            const db = getDb();
            const doneCount = db.filter(s => s.subjectsData).length;
            if (!doneCount) { alert('No saved results found!'); return; }
            if (confirm(`⚠️ Are you sure you want to delete ALL ${doneCount} saved results?\nStudents will remain in the database — only results will be cleared.`)) {
                const cleaned = db.map(s => {
                    const copy = { ...s };
                    delete copy.subjectsData;
                    delete copy.grandTotal;
                    delete copy.maxTotalMarks;
                    delete copy.percentage;
                    delete copy.overallGrade;
                    delete copy.cgpa;
                    delete copy.resultStatus;
                    delete copy.autoRemark;
                    delete copy.examName;
                    delete copy.termName;
                    delete copy.minMarksVal;
                    delete copy.reopenDate;
                    delete copy.coScholasticData;
                    return copy;
                });
                saveDb(cleaned);
                renderDbTable();
                // Re-render saved cards if visible
                if (typeof renderSavedCards === 'function') renderSavedCards();
                alert('✅ All saved results deleted! Students are still in the database.');
            }
        });
    }

    // Fix Shifted Columns button
    const fixColumnsBtn = document.getElementById('fixColumnsBtn');
    if (fixColumnsBtn) {
        fixColumnsBtn.addEventListener('click', () => {
            const db = getDb();
            let fixedCount = 0;
            const classPattern = /^(LKG|UKG|1ST|2ND|3RD|4TH|5TH|6TH|7TH|8TH|9TH|10TH|11TH|12TH)$/i;
            const numPattern   = /^\d+(\.\d+)?$/;

            const repaired = db.map(s => {
                const isShifted = classPattern.test((s.fatherName || '').trim())
                               && (s.classSection || '').includes(' ');
                if (!isShifted) return s;
                fixedCount++;

                // Rescue marks from wrong fields BEFORE overwriting
                const subjects = {};
                if (numPattern.test((s.motherName   || '').trim())) subjects['HINDI']             = parseFloat(s.motherName.trim());
                if (numPattern.test((s.address      || '').trim())) subjects['ENGLISH']           = parseFloat(s.address.trim());
                if (numPattern.test((s.dob          || '').trim())) subjects['MATHEMATICS']       = parseFloat(s.dob.trim());
                if (numPattern.test((s.examName     || '').trim())) subjects['SCIENCE']           = parseFloat(s.examName.trim());
                if (numPattern.test((s.sessionYear  || '').trim())) subjects['COMPUTER']          = parseFloat(s.sessionYear.trim());
                if (numPattern.test((s.termName     || '').trim())) subjects['GENERAL KNOWLEDGE'] = parseFloat(s.termName.trim());
                if (numPattern.test((s.minMarksVal  || '').trim())) subjects['ART AND CRAFT']     = parseFloat(s.minMarksVal.trim());

                const subjectsData = Object.keys(subjects).length > 0
                    ? Object.entries(subjects).map(([n, m]) => `${n}:${m}`).join('|')
                    : (s.subjectsData || '');

                return {
                    ...s,
                    classSection: s.fatherName.trim().toUpperCase(),
                    fatherName:   s.classSection.trim().toUpperCase(),
                    motherName:   s.studentName.trim().toUpperCase(),
                    studentName:  s.studentName.trim().toUpperCase(),
                    address:      '',
                    dob:          '',
                    examName:     '',
                    sessionYear:  '',
                    termName:     '',
                    minMarksVal:  '',
                    subjectsData: subjectsData
                };
            });

            if (fixedCount === 0) {
                alert('No shifted data found. Columns already look correct!');
                return;
            }

            saveDb(repaired);
            renderDbTable();
            alert('Fixed ' + fixedCount + ' records!\n\nClass, Father Name, Mother Name - all correct.\nSubject marks moved to correct rows.\nAddress / DOB / Exam fields cleared.');
        });
    }

    function updateDashboardStats() {
        const db = getDb();
        const totalStudents = db.length;
        
        // Calculate unique classes
        const classes = new Set();
        db.forEach(s => {
            if (s.classSection) {
                const classVal = s.classSection.split('/')[0].trim().toUpperCase();
                if(classVal) classes.add(classVal);
            }
        });
        const totalClasses = classes.size;

        // Calculate generated results
        const totalResults = db.filter(s => !!s.subjectsData).length;

        // Update UI
        const totalStudentsEl = document.getElementById('statTotalStudents');
        const totalClassesEl = document.getElementById('statTotalClasses');
        const totalResultsEl = document.getElementById('statTotalResults');

        if (totalStudentsEl) totalStudentsEl.textContent = totalStudents;
        if (totalClassesEl) totalClassesEl.textContent = totalClasses;
        if (totalResultsEl) totalResultsEl.textContent = totalResults;
    }

    function renderDbTable() {
        if(!dbTableBody) return;
        updateDashboardStats();
        const db = getDb();
        const filter = filterClassDb ? filterClassDb.value : 'ALL';
        let filtered = db;
        if(filter !== 'ALL') {
            filtered = db.filter(s => s.classSection === filter);
        }
        
        filtered.sort((a, b) => a.studentName.localeCompare(b.studentName));
        
        dbTableBody.innerHTML = '';
        filtered.forEach(s => {
            const isDone = !!s.subjectsData;
            const statusBadge = isDone 
                ? `<span class="badge badge-success"><i class="ph ph-check-circle"></i> Generated</span>`
                : `<span class="badge badge-warning"><i class="ph ph-clock"></i> Pending</span>`;

            dbTableBody.innerHTML += `
                <tr>
                    <td>${s.studentName}</td>
                    <td>${s.classSection}</td>
                    <td>${s.fatherName}</td>
                    <td>${statusBadge}</td>
                    <td><button class="delete-btn" data-id="${s.id}"><i class="ph ph-trash" style="font-size: 15px;"></i> Delete</button></td>
                </tr>
            `;
        });
    }

    // Export & Import Logic (Excel / CSV)
    const exportDbBtn = document.getElementById('exportDbBtn');
    const importDbClicker = document.getElementById('importDbClicker');
    const importDbFile = document.getElementById('importDbFile');

    function convertToCSV(objArray) {
        let str = "ID,Class/Section,Student Name,Father's Name,Mother's Name,Address,DOB,Exam Name,Session,Term,Min Marks,Subjects & Marks,Total Obtained,Max Marks,Percentage,Grade,CGPA,Result Status,Remarks,School Reopen,CoScholastic\r\n";
        for (let i = 0; i < objArray.length; i++) {
            const s = objArray[i];
            const exam = s.examName || '';
            const sess = s.sessionYear || '';
            const term = s.termName || '';
            const minM = s.minMarksVal || '';
            const subMarks = s.subjectsData || '';
            const total = s.grandTotal || '';
            const maxM = s.maxTotalMarks || '';
            const perc = s.percentage || '';
            const grd = s.overallGrade || '';
            const cgpa = s.cgpa || '';
            const status = s.resultStatus || '';
            const rem = (s.autoRemark || '').replace(/"/g, '""'); // escape quotes for CSV
            const reopen = s.reopenDate || '';
            const coSchol = (s.coScholasticData || '').replace(/"/g, '""');

            str += `"${s.id}","${s.classSection}","${s.studentName}","${s.fatherName}","${s.motherName}","${s.address}","${s.dob}","${exam}","${sess}","${term}","${minM}","${subMarks}","${total}","${maxM}","${perc}","${grd}","${cgpa}","${status}","${rem}","${reopen}","${coSchol}"\r\n`;
        }
        return str;
    }

    function parseCSVRow(text) {
        let ret = [], inQuote = false, value = '';
        for (let i = 0; i < text.length; i++) {
            let char = text[i];
            if (inQuote) {
                if (char === '"') {
                    if (text[i+1] === '"') { value += '"'; i++; }
                    else inQuote = false;
                } else value += char;
            } else {
                if (char === '"') inQuote = true;
                else if (char === ',') { ret.push(value); value = ''; }
                else value += char;
            }
        }
        ret.push(value);
        return ret.map(v => v.trim());
    }

    if (exportDbBtn) {
        exportDbBtn.addEventListener('click', () => {
            const db = getDb();
            if (db.length === 0) {
                alert("The database is empty. There is nothing to export.");
                return;
            }
            const csvData = convertToCSV(db);
            const blob = new Blob([csvData], { type: 'text/csv;charset=utf-8;' });
            const url = URL.createObjectURL(blob);
            
            const downloadAnchorNode = document.createElement('a');
            downloadAnchorNode.setAttribute("href", url);
            downloadAnchorNode.setAttribute("download", "students_backup.csv");
            document.body.appendChild(downloadAnchorNode); 
            downloadAnchorNode.click();
            downloadAnchorNode.remove();
        });
    }

    if (importDbClicker && importDbFile) {
        importDbClicker.addEventListener('click', () => {
            importDbFile.click();
        });

        importDbFile.addEventListener('change', async (e) => {
            const file = e.target.files[0];
            if (!file) return;

            const reader = new FileReader();
            reader.onload = async function(event) {
                const csvText = event.target.result;
                const lines = csvText.split(/\r?\n/).filter(line => line.trim() !== '');
                if(lines.length < 2) {
                    alert("The Excel/CSV file appears to be empty or invalid. Please check the file.");
                    return;
                }
                
                let importedData = [];
                for (let i = 1; i < lines.length; i++) {
                    const row = parseCSVRow(lines[i]);
                    if(row.length >= 7) {
                        importedData.push({
                            id: row[0] || Date.now().toString() + i,
                            classSection: row[1] || '',
                            studentName: row[2] || '',
                            fatherName: row[3] || '',
                            motherName: row[4] || '',
                            address: row[5] || '',
                            dob: row[6] || '',
                            examName: row[7] || '',
                            sessionYear: row[8] || null,
                            termName: row[9] || null,
                            minMarksVal: row[10] || null,
                            subjectsData: row[11] || '',
                            grandTotal: row[12] || null,
                            maxTotalMarks: row[13] || '',
                            percentage: row[14] || '',
                            overallGrade: row[15] || '',
                            cgpa: row[16] || '',
                            resultStatus: row[17] || '',
                            autoRemark: row[18] || '',
                            reopenDate: row[19] || null,
                            coScholasticData: row[20] || null
                        });
                    }
                }

                if (importedData.length > 0) {
                    // Demo account import limit check
                    const currentUser = sessionStorage.getItem('currentUser');
                    if (currentUser === 'demo@school.com' && importedData.length > 10) {
                        alert(`🚫 Demo account allows a maximum of 10 students only!\n\nYour file has ${importedData.length} students. Only the first 10 will be imported.`);
                        importedData = importedData.slice(0, 10);
                    }
                    const existingDb = getDb();
                    if (confirm("Do you want to REPLACE the entire database with this file?\n\nClick OK to Replace, or Cancel to Merge instead.")) {
                        await saveDb(importedData);
                    } else {
                        const merged = existingDb.concat(importedData);
                        await saveDb(merged);
                    }
                    renderDbTable();
                    alert("Data imported successfully!");
                } else {
                    alert("Could not read valid data from this file. Please make sure it is a properly formatted CSV or Excel file.");
                }
            };
            reader.readAsText(file);
            importDbFile.value = ''; // Reset file input
        });
    }

    // Generate Results Logic
    let currentClassList = [];
    let currentStudentIndex = 0;
    const selectClassToGenerate = document.getElementById('selectClassToGenerate');
    const studentProgress = document.getElementById('studentProgress');
    const currentStudentNum = document.getElementById('currentStudentNum');
    const totalStudentsNum = document.getElementById('totalStudentsNum');
    const nextStudentBtn = document.getElementById('nextStudentBtn');
    const backwardBtn = document.getElementById('backwardBtn');
    const forwardBtn = document.getElementById('forwardBtn');

    if(selectClassToGenerate) {
        selectClassToGenerate.addEventListener('change', (e) => {
            const cls = e.target.value;
            if(!cls) {
                studentProgress.classList.add('hidden');
                document.getElementById('selectStudentToGenerate').disabled = true;
                document.getElementById('selectStudentToGenerate').innerHTML = '<option value="">-- Choose Student --</option>';
                return;
            }
            
            const freshDb = getDb();
            let dbStudents = freshDb.filter(s => s.classSection === cls);

            // Also pull from Excel data directly (if class matches)
            if (excelImportedData && excelImportedData.length > 0) {
                const excelForClass = excelImportedData.filter(ex =>
                    ex.classSection && ex.classSection.trim().toUpperCase() === cls.trim().toUpperCase()
                );
                excelForClass.forEach(exS => {
                    const alreadyInDb = dbStudents.find(s =>
                        s.studentName.trim().toUpperCase() === exS.name.trim().toUpperCase()
                    );
                    if (!alreadyInDb) {
                        // Add to DB and to list
                        const newStudent = {
                            id: 'ex_' + Date.now() + Math.random().toString(36).slice(2,5),
                            studentName: exS.name,
                            fatherName: exS.fatherName || '',
                            motherName: exS.motherName || '',
                            classSection: exS.classSection || cls,
                            address: '',
                            dob: ''
                        };
                        freshDb.push(newStudent);
                        dbStudents.push(newStudent);
                    }
                });
                // Sync to DB if new students were added
                saveDb(freshDb);
                renderDbTable();
            }

            currentClassList = dbStudents;
            currentClassList.sort((a, b) => {
                const aPending = !a.subjectsData;
                const bPending = !b.subjectsData;
                if (aPending && !bPending) return -1;
                if (!aPending && bPending) return 1;
                return a.studentName.localeCompare(b.studentName);
            });

            if (currentClassList.length === 0) {
                studentProgress.classList.remove('hidden');
                studentProgress.style.borderColor = '#ef4444';
                studentProgress.style.background = 'rgba(239,68,68,0.06)';
                studentProgress.innerHTML = `
                    <span style="color:#ef4444; font-weight:600; font-size:0.9rem;">
                        ⚠️ No students found for class <strong>${cls}</strong>.<br>
                        <span style="font-size:0.8rem; font-weight:400; color:var(--text-muted);">
                            Please go to <strong>Manage Students</strong> tab and add students,
                            or use the <strong>Import Marks from Excel</strong> section above to import them.
                        </span>
                    </span>`;
                document.getElementById('selectStudentToGenerate').disabled = true;
                document.getElementById('selectStudentToGenerate').innerHTML = '<option value="">-- No Students --</option>';
                return;
            }

            // Reset progress bar style if it was in error state
            studentProgress.style.borderColor = '';
            studentProgress.style.background = '';
            studentProgress.innerHTML = `Currently editing: Student <span id="currentStudentNum">1</span> of <span id="totalStudentsNum">${currentClassList.length}</span>`;

            totalStudentsNum.textContent = currentClassList.length;
            studentProgress.classList.remove('hidden');
            currentStudentIndex = 0;
            updateStudentDropdown();
            loadStudent(currentStudentIndex);
        });
    }

    function updateStudentDropdown() {
        const studentSelect = document.getElementById('selectStudentToGenerate');
        if (!studentSelect) return;
        studentSelect.innerHTML = '<option value="">-- Choose Student --</option>';
        const searchInput = document.getElementById('searchStudentInput');
        if(searchInput) searchInput.value = '';
        if (currentClassList.length === 0) {
            studentSelect.disabled = true;
            return;
        }
        studentSelect.disabled = false;
        currentClassList.forEach((s, idx) => {
            const opt = document.createElement('option');
            opt.value = idx;
            const status = s.subjectsData ? "✅ Done" : "⏳ Pending";
            opt.textContent = `${idx + 1}. ${s.studentName} - ${status}`;
            if (s.subjectsData) {
                opt.style.color = "green";
            } else {
                opt.style.color = "red";
            }
            studentSelect.appendChild(opt);
        });
        studentSelect.value = currentStudentIndex;
    }

    const studentSelect = document.getElementById('selectStudentToGenerate');
    if (studentSelect) {
        studentSelect.addEventListener('change', (e) => {
            if(e.target.value === "") return;
            currentStudentIndex = parseInt(e.target.value);
            loadStudent(currentStudentIndex);
            const targetStudent = currentClassList[currentStudentIndex];
            if (targetStudent && targetStudent.subjectsData) {
                // Generated, show the card
                const resultForm = document.getElementById('resultForm');
                if(resultForm) resultForm.dispatchEvent(new Event('submit'));
                
                const resultCard = document.getElementById('resultCard');
                if(resultCard) {
                    resultCard.style.opacity = '0';
                    setTimeout(() => resultCard.style.opacity = '1', 50);
                }
            } else {
                // Clean UI to let them generate
                const resultCard = document.getElementById('resultCard');
                const appContainer = document.querySelector('#mainAppWrapper .app-container');
                const printBtn = document.getElementById('printBtn');
                const generateBtn = document.getElementById('generateResultBtn');
                const editResultBtn = document.getElementById('editResultBtn');
                
                if(resultCard) resultCard.classList.add('hidden');
                if(appContainer) appContainer.classList.remove('has-results');
                if(printBtn) printBtn.disabled = true;
                if(generateBtn) generateBtn.classList.remove('hidden');
                if(editResultBtn) editResultBtn.classList.add('hidden');
            }
        });
    }

    function loadStudent(index) {
        if(index >= currentClassList.length) return;
        
        // Update dropdown if available
        const studentSelect = document.getElementById('selectStudentToGenerate');
        if (studentSelect && studentSelect.value != index) {
            studentSelect.value = index;
        }

        const student = currentClassList[index];
        document.getElementById('studentName').value = student.studentName || '';
        document.getElementById('fatherName').value = student.fatherName || '';
        document.getElementById('motherName').value = student.motherName || '';
        document.getElementById('classSection').value = student.classSection || '';
        document.getElementById('address').value = student.address || '';
        document.getElementById('dob').value = student.dob || '';
        
        // Load existing term details if they exist in DB
        if (student.termName) document.getElementById('termName').value = student.termName;
        if (student.examName) document.getElementById('examName').value = student.examName;
        if (student.sessionYear) document.getElementById('sessionYear').value = student.sessionYear;
        if (student.minMarksVal) document.getElementById('minMarks').value = student.minMarksVal;
        if (student.reopenDate) document.getElementById('reopenDate').value = student.reopenDate;

        // Load Co-Scholastic
        if (student.coScholasticData) {
            const grades = student.coScholasticData.split('|');
            if(grades.length >= 4) {
                document.getElementById('gradeDiscipline').value = grades[0];
                document.getElementById('gradeArt').value = grades[1];
                document.getElementById('gradeSports').value = grades[2];
                document.getElementById('gradeComputer').value = grades[3];
            }
        } else {
            document.getElementById('gradeDiscipline').value = '';
            document.getElementById('gradeArt').value = '';
            document.getElementById('gradeSports').value = '';
            document.getElementById('gradeComputer').value = '';
        }

        // Load subjects and marks if they exist
        const subjectsContainer = document.getElementById('subjectsContainer');
        if (student.subjectsData && typeof student.subjectsData === 'string') {
            if(subjectsContainer) {
                subjectsContainer.innerHTML = ''; // clear current inputs
                const subs = student.subjectsData.split('|');
                subs.forEach(subStr => {
                    const parts = subStr.split(':');
                    if (parts.length >= 2) {
                        const name = parts[0].trim();
                        const marks = parts[1].trim();
                        addSubjectRow(name, marks);
                    }
                });
            }
        } else {
            // Try Excel data first for marks fill
            if (excelImportedData && excelImportedData.length > 0) {
                const match = excelImportedData.find(d => {
                    const n = d.name.trim().toUpperCase();
                    const sn = student.studentName.trim().toUpperCase();
                    return n === sn || n.includes(sn) || sn.includes(n);
                });
                if (match && Object.keys(match.subjects || {}).length > 0) {
                    if(subjectsContainer) {
                        subjectsContainer.innerHTML = '';
                        Object.entries(match.subjects).forEach(([subName, marks]) => {
                            addSubjectRow(subName, marks);
                        });
                    }
                } else {
                    // No Excel marks → default subjects
                    if(subjectsContainer) {
                        subjectsContainer.innerHTML = '';
                        const defaultSubs = ['HINDI', 'ENGLISH', 'MATHEMATICS', 'ENVIRONMENTAL SCIENCE', 'COMPUTER', 'GENERAL KNOWLEDGE', 'ART and CRAFT'];
                        defaultSubs.forEach(sub => addSubjectRow(sub, ''));
                    }
                }
            } else {
                // No Excel loaded → default subjects
                if(subjectsContainer) {
                    subjectsContainer.innerHTML = '';
                    const defaultSubs = ['HINDI', 'ENGLISH', 'MATHEMATICS', 'ENVIRONMENTAL SCIENCE', 'COMPUTER', 'GENERAL KNOWLEDGE', 'ART and CRAFT'];
                    defaultSubs.forEach(sub => addSubjectRow(sub, ''));
                }
            }
        }
        
        currentStudentNum.textContent = index + 1;
        
        // Auto-render if this student is already generated
        if (student.subjectsData) {
            setTimeout(() => {
                const resultForm = document.getElementById('resultForm');
                if(resultForm) resultForm.dispatchEvent(new Event('submit'));
                
                const resultCard = document.getElementById('resultCard');
                if(resultCard) {
                    resultCard.style.opacity = '0';
                    setTimeout(() => resultCard.style.opacity = '1', 50);
                }
            }, 50);
        } else {
            // Clean UI to let them generate
            const resultCard = document.getElementById('resultCard');
            const appContainer = document.querySelector('#mainAppWrapper .app-container');
            const printBtn = document.getElementById('printBtn');
            const generateBtn = document.getElementById('generateResultBtn');
            const editResultBtn = document.getElementById('editResultBtn');
            
            if(resultCard) resultCard.classList.add('hidden');
            if(appContainer) appContainer.classList.remove('has-results');
            if(printBtn) printBtn.disabled = true;
            if(generateBtn) generateBtn.classList.remove('hidden');
            if(editResultBtn) editResultBtn.classList.add('hidden');
        }
    }

    function addSubjectRow(sub = '', marks = '85') {
        const row = document.createElement('div');
        row.className = 'subject-row';
        row.innerHTML = `
            <input type="text" name="subjectName[]" placeholder="Subject" value="${sub}" required>
            <input type="number" name="obtainedMarks[]" placeholder="Obtained / 100" value="${marks}" min="0" max="100">
            <button type="button" class="btn-remove" title="Remove Subject">×</button>
        `;
        row.querySelector('.btn-remove').addEventListener('click', () => {
            row.remove();
            if (document.getElementById('resultCard') && !document.getElementById('resultCard').classList.contains('hidden')) {
                resultForm.dispatchEvent(new Event('submit'));
            }
        });
        subjectsContainer.appendChild(row);
    }

    // =============================================
    // EXCEL IMPORT — AUTO PARSE (No Mapping Needed)
    // =============================================
    let excelImportedData = []; // [{name, fatherName, motherName, classSection, address, dob, subjects:{...}}]

    const excelMarksFile  = document.getElementById('excelMarksFile');
    const excelImportBtn  = document.getElementById('excelImportBtn');
    const excelClearBtn   = document.getElementById('excelClearBtn');
    const excelStatusMsg  = document.getElementById('excelStatusMsg');

    function showExcelStatus(msg, isError = false) {
        if (!excelStatusMsg) return;
        excelStatusMsg.style.display = 'block';
        excelStatusMsg.textContent = msg;
        excelStatusMsg.style.color = isError ? '#ef4444' : '#10b981';
    }

    function autoParseExcel(jsonData) {
        if (!jsonData.length) {
            showExcelStatus('❌ No data found in the file!', true);
            return;
        }

        const headers = Object.keys(jsonData[0]);

        // Auto-detect standard columns by header name
        const nameCol    = headers.find(h => /student\s*name|^name$/i.test(h))
                        || headers.find(h => /name/i.test(h) && !/father|mother/i.test(h));
        const fatherCol  = headers.find(h => /father/i.test(h));
        const motherCol  = headers.find(h => /mother/i.test(h));
        const classCol   = headers.find(h => /class|section/i.test(h));
        const addressCol = headers.find(h => /address|addr/i.test(h));
        const dobCol     = headers.find(h => /dob|date.*birth|birth.*date/i.test(h));
        const rollCol    = headers.find(h => /roll|sr\.?\s*no|serial/i.test(h));

        const skipCols = [nameCol, fatherCol, motherCol, classCol, addressCol, dobCol, rollCol].filter(Boolean);
        const subjectCols = headers.filter(h => !skipCols.includes(h));

        if (!nameCol) {
            showExcelStatus('❌ "Student Name" column not found. Please add a column named "Student Name" in your Excel file.', true);
            return;
        }

        // Parse all student rows
        excelImportedData = jsonData.map(row => {
            const rawName = String(row[nameCol] || '').trim().toUpperCase();
            if (!rawName) return null;
            const subjects = {};
            subjectCols.forEach(col => {
                const val = String(row[col] || '').trim();
                const marks = parseFloat(val);
                if (!isNaN(marks)) subjects[col.trim().toUpperCase()] = marks;
            });
            return {
                name:         rawName,
                fatherName:   fatherCol  ? String(row[fatherCol]  || '').trim() : '',
                motherName:   motherCol  ? String(row[motherCol]  || '').trim() : '',
                classSection: classCol   ? String(row[classCol]   || '').trim() : '',
                address:      addressCol ? String(row[addressCol] || '').trim() : '',
                dob:          dobCol     ? String(row[dobCol]     || '').trim() : '',
                subjects
            };
        }).filter(Boolean);

        // Add new students to DB automatically
        const db = getDb();
        let addedCount = 0;
        excelImportedData.forEach(exS => {
            const exists = db.find(s => s.studentName.trim().toUpperCase() === exS.name);
            if (!exists) {
                db.push({
                    id: Date.now().toString() + Math.random().toString(36).slice(2,6),
                    studentName:  exS.name,
                    fatherName:   exS.fatherName,
                    motherName:   exS.motherName,
                    classSection: exS.classSection,
                    address:      exS.address,
                    dob:          exS.dob
                });
                addedCount++;
            }
        });
        if (addedCount > 0) {
            saveDb(db);
            renderDbTable();
            refreshClassDropdown();
        }

        if (excelClearBtn) excelClearBtn.style.display = 'inline-flex';

        const classes = [...new Set(excelImportedData.map(s => s.classSection).filter(Boolean))];
        showExcelStatus(`✅ ${excelImportedData.length} students loaded from ${classes.length} class(es). Now select a class below — all details & marks will auto-fill!`);
    }

    if (excelImportBtn) {
        excelImportBtn.addEventListener('click', () => {
            if (excelMarksFile) excelMarksFile.click();
        });
    }

    if (excelMarksFile) {
        excelMarksFile.addEventListener('change', (e) => {
            const file = e.target.files[0];
            if (!file) return;
            showExcelStatus('⏳ Loading file, please wait...');
            const reader = new FileReader();
            const handleWb = (wb) => {
                const sheet = wb.Sheets[wb.SheetNames[0]];
                const jsonData = XLSX.utils.sheet_to_json(sheet, { defval: '' });
                autoParseExcel(jsonData);
            };
            if (file.name.toLowerCase().endsWith('.csv')) {
                reader.onload = ev => handleWb(XLSX.read(ev.target.result, { type: 'string' }));
                reader.readAsText(file);
            } else {
                reader.onload = ev => handleWb(XLSX.read(ev.target.result, { type: 'array' }));
                reader.readAsArrayBuffer(file);
            }
        });
    }

    if (excelClearBtn) {
        excelClearBtn.addEventListener('click', () => {
            excelImportedData = [];
            if (excelMarksFile) excelMarksFile.value = '';
            if (excelStatusMsg) excelStatusMsg.style.display = 'none';
            excelClearBtn.style.display = 'none';
        });
    }

    // Refresh class dropdown after DB update
    function refreshClassDropdown() {
        const sel = document.getElementById('selectClassToGenerate');
        if (!sel) return;
        const db = getDb();
        const classes = [...new Set(db.map(s => s.classSection).filter(Boolean))].sort();
        classes.forEach(cls => {
            if (![...sel.options].find(o => o.value === cls)) {
                const opt = document.createElement('option');
                opt.value = cls;
                opt.textContent = cls;
                sel.appendChild(opt);
            }
        });
    }


    const initialSubjects = ['HINDI', 'ENGLISH', 'MATHEMATICS', 'ENVIRONMENTAL SCIENCE', 'COMPUTER', 'GENERAL KNOWLEDGE', 'ART and CRAFT'];
    initialSubjects.forEach(sub => addSubjectRow(sub));

    addSubBtn.addEventListener('click', () => {
        addSubjectRow();
        if (document.getElementById('resultCard') && !document.getElementById('resultCard').classList.contains('hidden')) {
            resultForm.dispatchEvent(new Event('submit'));
        }
    });

    // Live update when form is edited
    resultForm.addEventListener('input', (e) => {
        const resultCard = document.getElementById('resultCard');
        if (resultCard && !resultCard.classList.contains('hidden')) {
            resultForm.dispatchEvent(new Event('submit'));
        }
    });
    resultForm.addEventListener('change', (e) => {
        const resultCard = document.getElementById('resultCard');
        if (resultCard && !resultCard.classList.contains('hidden')) {
            resultForm.dispatchEvent(new Event('submit'));
        }
    });

    resultForm.addEventListener('submit', (e) => {
        if(e && e.preventDefault) e.preventDefault();
        // Animate layout to split screen if not already
        const appContainer = document.querySelector('#mainAppWrapper .app-container');
        if (appContainer && !appContainer.classList.contains('has-results')) {
            appContainer.classList.add('has-results');
        }

        // Assign top student info
        const instName = document.getElementById('instName') ? document.getElementById('instName').value : 'S. TAGORE ACADEMY PUBLIC SCHOOL';
        const instTagline = document.getElementById('instTagline') ? document.getElementById('instTagline').value : 'A SCHOOL OF EXCELLENCE';
        
        document.getElementById('dispInstName').textContent = instName;
        document.getElementById('dispInstTagline').textContent = instTagline;
        
        // Affiliation Number & Board
        const instAff = document.getElementById('instAffiliation') ? document.getElementById('instAffiliation').value : '';
        const dispAff = document.getElementById('dispAffiliation');
        if(dispAff) {
            if(instAff.trim() !== '') {
                dispAff.textContent = 'Affiliation No - ' + instAff;
                dispAff.style.display = 'block';
            } else {
                dispAff.style.display = 'none';
            }
        }
        
        const boardVal = document.getElementById('boardSelect') ? document.getElementById('boardSelect').value : 'Affiliated to C.B.S.E. New Delhi';
        const dispBoard = document.getElementById('dispBoard');
        if(dispBoard) {
            if(boardVal !== 'none') {
                dispBoard.textContent = boardVal;
                dispBoard.style.display = 'block';
            } else {
                dispBoard.style.display = 'none';
            }
        }
        
        document.getElementById('dispStudentName').textContent = document.getElementById('studentName').value;
        document.getElementById('dispFatherName').textContent = document.getElementById('fatherName').value;
        document.getElementById('dispMotherName').textContent = document.getElementById('motherName').value;
        document.getElementById('dispClassSection').textContent = document.getElementById('classSection').value;
        document.getElementById('dispAddress').textContent = document.getElementById('address').value;
        document.getElementById('dispDob').textContent = document.getElementById('dob').value;
        
        // Assign term info (Remarks will be auto-calculated)
        document.getElementById('dispReopen').textContent = document.getElementById('reopenDate').value;
        
        const termNameInput = document.getElementById('termName');
        const termName = termNameInput ? termNameInput.value : 'TERM II';
        document.getElementById('dispTermName').textContent = termName.toUpperCase();
        
        document.getElementById('dispExamName').textContent = document.getElementById('examName') ? document.getElementById('examName').value : 'FINAL EXAM Marks Statement';
        document.getElementById('dispSessionYear').textContent = document.getElementById('sessionYear') ? document.getElementById('sessionYear').value : '2023-2024';
        
        // Co-Scholastic logic
        const gDisc = document.getElementById('gradeDiscipline') ? document.getElementById('gradeDiscipline').value : '';
        const gArt = document.getElementById('gradeArt') ? document.getElementById('gradeArt').value : '';
        const gSports = document.getElementById('gradeSports') ? document.getElementById('gradeSports').value : '';
        const gComp = document.getElementById('gradeComputer') ? document.getElementById('gradeComputer').value : '';
        
        if (document.getElementById('dispGradeDiscipline')) document.getElementById('dispGradeDiscipline').textContent = gDisc;
        if (document.getElementById('dispGradeArt')) document.getElementById('dispGradeArt').textContent = gArt;
        if (document.getElementById('dispGradeSports')) document.getElementById('dispGradeSports').textContent = gSports;
        if (document.getElementById('dispGradeComputer')) document.getElementById('dispGradeComputer').textContent = gComp;
        const coScholasticString = `${gDisc}|${gArt}|${gSports}|${gComp}`;

        const minMarksVal = parseFloat(document.getElementById('minMarks').value) || 33;
        const subjectNames = document.querySelectorAll('input[name="subjectName[]"]');
        const obtained = document.querySelectorAll('input[name="obtainedMarks[]"]');
        
        const marksTableBody = document.getElementById('marksTableBody');
        marksTableBody.innerHTML = '';

        let grandTotal = 0;
        let maxTotalMarks = subjectNames.length * 100;
        let hasFailedSubjects = false;
        let failedSubjects = [];

        for (let i = 0; i < subjectNames.length; i++) {
            const sub = subjectNames[i].value;
            const marks = parseFloat(obtained[i].value) || 0;
            grandTotal += marks;

            let grade = 'E';
            if(marks >= 91) grade = 'A1';
            else if(marks >= 81) grade = 'A2';
            else if(marks >= 71) grade = 'B1';
            else if(marks >= 61) grade = 'B2';
            else if(marks >= 51) grade = 'C1';
            else if(marks >= 41) grade = 'C2';
            else if(marks >= minMarksVal) grade = 'D';

            if(marks < minMarksVal) {
                hasFailedSubjects = true;
                failedSubjects.push(sub.toUpperCase());
            }

            marksTableBody.innerHTML += `
                <tr>
                    <td>${sub.toUpperCase()}</td>
                    <td>100</td>
                    <td>${minMarksVal}</td>
                    <td>${marks}</td>
                    <td>${grade}</td>
                </tr>
            `;
        }

        const percentage = (grandTotal / maxTotalMarks) * 100;
        
        let overallGrade = 'E';
        let autoRemark = 'Failed, please meet the class teacher.';
        if(percentage >= 91) { overallGrade = 'A1'; autoRemark = 'Outstanding! Keep it up.'; }
        else if(percentage >= 81) { overallGrade = 'A2'; autoRemark = 'Excellent performance.'; }
        else if(percentage >= 71) { overallGrade = 'B1'; autoRemark = 'Very Good, keep improving.'; }
        else if(percentage >= 61) { overallGrade = 'B2'; autoRemark = 'Good, but needs more focus.'; }
        else if(percentage >= 51) { overallGrade = 'C1'; autoRemark = 'Satisfactory, hard work required.'; }
        else if(percentage >= 41) { overallGrade = 'C2'; autoRemark = 'Needs significant improvement.'; }
        else if(percentage >= 35) { overallGrade = 'D'; autoRemark = 'Passed, needs careful attention.'; }
        
        if (percentage >= 35) {
            if (hasFailedSubjects) {
                autoRemark = `Passed. Needs to work hard in: ${failedSubjects.join(', ')}`;
            }
        } else {
            if (hasFailedSubjects) {
                autoRemark = `Failed. Needs to work hard in: ${failedSubjects.join(', ')}`;
            } else {
                autoRemark = 'Failed, please meet the class teacher.';
            }
        }
        
        document.getElementById('dispRemarks').textContent = autoRemark;

        const cgpa = (percentage / 9.5).toFixed(1);
        const resultStatus = (percentage >= 35) ? 'Passed' : 'Failed';

        document.getElementById('dispTotalMarks').textContent = `${grandTotal}/${maxTotalMarks}`;
        document.getElementById('dispPercentage').textContent = percentage.toFixed(2);
        document.getElementById('dispOverallGrade').textContent = overallGrade;
        document.getElementById('dispCGPA').textContent = cgpa;
        document.getElementById('dispResult').textContent = resultStatus;

        // --- Save to Database ---
        if(currentClassList.length > 0 && currentStudentIndex < currentClassList.length) {
            const currentStudentObj = currentClassList[currentStudentIndex];
            const fullDb = getDb();
            const dbIndex = fullDb.findIndex(s => s.id === currentStudentObj.id);
            if(dbIndex !== -1) {
                // Formatting subjects string for CSV export
                let subStrArr = [];
                for (let i = 0; i < subjectNames.length; i++) {
                    subStrArr.push(`${subjectNames[i].value}: ${obtained[i].value || 0}`);
                }
                
                fullDb[dbIndex].studentName = document.getElementById('studentName').value;
                fullDb[dbIndex].fatherName = document.getElementById('fatherName').value;
                fullDb[dbIndex].motherName = document.getElementById('motherName').value;
                fullDb[dbIndex].classSection = document.getElementById('classSection').value;
                fullDb[dbIndex].address = document.getElementById('address').value;
                fullDb[dbIndex].dob = document.getElementById('dob').value;
                fullDb[dbIndex].examName = document.getElementById('examName').value;
                fullDb[dbIndex].sessionYear = document.getElementById('sessionYear').value;
                
                const termNameInputForSave = document.getElementById('termName');
                fullDb[dbIndex].termName = termNameInputForSave ? termNameInputForSave.value : 'TERM II';
                
                fullDb[dbIndex].minMarksVal = minMarksVal;
                fullDb[dbIndex].reopenDate = document.getElementById('reopenDate').value;
                fullDb[dbIndex].coScholasticData = coScholasticString;
                fullDb[dbIndex].subjectsData = subStrArr.join(' | ');
                fullDb[dbIndex].grandTotal = grandTotal;
                fullDb[dbIndex].maxTotalMarks = maxTotalMarks;
                fullDb[dbIndex].percentage = percentage.toFixed(2);
                fullDb[dbIndex].overallGrade = overallGrade;
                fullDb[dbIndex].cgpa = cgpa;
                fullDb[dbIndex].resultStatus = resultStatus;
                fullDb[dbIndex].autoRemark = autoRemark;
                saveDb(fullDb);
            }
        }

        resultCard.classList.remove('hidden');
        
        if (printBtn) printBtn.disabled = false;
        if (generateResultBtn) generateResultBtn.classList.remove('hidden');
        if (editResultBtn) editResultBtn.classList.add('hidden');
        
        if(nextStudentBtn) {
            nextStudentBtn.classList.remove('hidden');
            nextStudentBtn.disabled = currentStudentIndex >= currentClassList.length - 1;
        }
        if(backwardBtn) {
            backwardBtn.classList.remove('hidden');
            backwardBtn.disabled = currentStudentIndex <= 0;
        }
        if(forwardBtn) {
            forwardBtn.classList.remove('hidden');
            forwardBtn.disabled = currentStudentIndex >= currentClassList.length - 1;
        }
        
        // Auto-scroll to the result so the user doesn't have to scroll manually
        setTimeout(() => {
            resultCard.scrollIntoView({ behavior: 'smooth', block: 'start' });
        }, 100);
        
    });

    printBtn.addEventListener('click', () => {
        const bulkPrintContainer = document.getElementById('bulkPrintContainer');
        if(bulkPrintContainer) bulkPrintContainer.innerHTML = '';
        window.print();
    });
    
    if (editResultBtn) {
        editResultBtn.addEventListener('click', () => {
            const resultCard = document.getElementById('resultCard');
            const appContainer = document.querySelector('#mainAppWrapper .app-container');
            const printBtn = document.getElementById('printBtn');
            const generateResultBtn = document.getElementById('generateResultBtn');
            
            if(resultCard) resultCard.classList.add('hidden');
            if(appContainer) appContainer.classList.remove('has-results');
            if(printBtn) printBtn.disabled = true;
            if(generateResultBtn) generateResultBtn.classList.remove('hidden');
            editResultBtn.classList.add('hidden');
            
            window.scrollTo({ top: 0, behavior: 'smooth' });
        });
    }

    if (backwardBtn) {
        backwardBtn.addEventListener('click', () => {
            const cls = document.getElementById('selectClassToGenerate').value;
            if (cls) {
                const freshDb = getDb();
                let currentStudentId = null;
                if (currentClassList.length > 0 && currentStudentIndex < currentClassList.length) {
                    currentStudentId = currentClassList[currentStudentIndex].id;
                }
                currentClassList = freshDb.filter(s => s.classSection === cls);
                currentClassList.sort((a, b) => {
                    const aPending = !a.subjectsData;
                    const bPending = !b.subjectsData;
                    if (aPending && !bPending) return -1;
                    if (!aPending && bPending) return 1;
                    return a.studentName.localeCompare(b.studentName);
                });
                
                if (currentStudentId !== null) {
                    const newIndex = currentClassList.findIndex(s => s.id === currentStudentId);
                    if (newIndex !== -1) currentStudentIndex = newIndex;
                }

                if(currentClassList.length > 0 && currentStudentIndex > 0) {
                    currentStudentIndex--;
                    loadStudent(currentStudentIndex);
                    
                    if(nextStudentBtn) nextStudentBtn.disabled = false;
                    if(backwardBtn) backwardBtn.disabled = currentStudentIndex <= 0;
                    if(forwardBtn) forwardBtn.disabled = currentStudentIndex >= currentClassList.length - 1;
                }
            }
        });
    }

    if (forwardBtn) {
        forwardBtn.addEventListener('click', () => {
            const cls = document.getElementById('selectClassToGenerate').value;
            if (cls) {
                const freshDb = getDb();
                let currentStudentId = null;
                if (currentClassList.length > 0 && currentStudentIndex < currentClassList.length) {
                    currentStudentId = currentClassList[currentStudentIndex].id;
                }
                currentClassList = freshDb.filter(s => s.classSection === cls);
                currentClassList.sort((a, b) => {
                    const aPending = !a.subjectsData;
                    const bPending = !b.subjectsData;
                    if (aPending && !bPending) return -1;
                    if (!aPending && bPending) return 1;
                    return a.studentName.localeCompare(b.studentName);
                });
                
                if (currentStudentId !== null) {
                    const newIndex = currentClassList.findIndex(s => s.id === currentStudentId);
                    if (newIndex !== -1) currentStudentIndex = newIndex;
                }

                if (currentClassList.length > 0 && currentStudentIndex < currentClassList.length - 1) {
                    currentStudentIndex++;
                    loadStudent(currentStudentIndex);
                    
                    if(nextStudentBtn) nextStudentBtn.disabled = currentStudentIndex >= currentClassList.length - 1;
                    if(backwardBtn) backwardBtn.disabled = false;
                    if(forwardBtn) forwardBtn.disabled = currentStudentIndex >= currentClassList.length - 1;
                }
            }
        });
    }

    if (nextStudentBtn) {
        nextStudentBtn.addEventListener('click', () => {
            // ALWAYS fetch fresh from DB to catch students added in other tabs
            const cls = document.getElementById('selectClassToGenerate').value;
            if (cls) {
                const freshDb = getDb();
                
                // Remember who we are currently looking at before we refresh the list
                let currentStudentId = null;
                if (currentClassList.length > 0 && currentStudentIndex < currentClassList.length) {
                    currentStudentId = currentClassList[currentStudentIndex].id;
                }

                currentClassList = freshDb.filter(s => s.classSection === cls);
                currentClassList.sort((a, b) => {
                    const aPending = !a.subjectsData;
                    const bPending = !b.subjectsData;
                    if (aPending && !bPending) return -1;
                    if (!aPending && bPending) return 1;
                    return a.studentName.localeCompare(b.studentName);
                });
                
                // Find their new position in the freshly sorted list
                if (currentStudentId !== null) {
                    const newIndex = currentClassList.findIndex(s => s.id === currentStudentId);
                    if (newIndex !== -1) {
                        currentStudentIndex = newIndex;
                    }
                }

                const totalElem = document.getElementById('totalStudentsNum');
                if(totalElem) totalElem.textContent = currentClassList.length;
            }

            if (currentClassList.length > 0 && currentStudentIndex < currentClassList.length - 1) {
                // Auto-save the current student's form before moving
                const resultForm = document.getElementById('resultForm');
                if(resultForm) resultForm.dispatchEvent(new Event('submit'));

                currentStudentIndex++;
                loadStudent(currentStudentIndex);
                
                if(nextStudentBtn) nextStudentBtn.disabled = currentStudentIndex >= currentClassList.length - 1;
                if(backwardBtn) backwardBtn.disabled = false;
                if(forwardBtn) forwardBtn.disabled = currentStudentIndex >= currentClassList.length - 1;
                
                // Hide result and show form cleanly for editing/review
                const resultCard = document.getElementById('resultCard');
                const appContainer = document.querySelector('#mainAppWrapper .app-container');
                const printBtn = document.getElementById('printBtn');
                const generateResultBtn = document.getElementById('generateResultBtn');
                const editResultBtn = document.getElementById('editResultBtn');
                
                if(resultCard) resultCard.classList.add('hidden');
                if(appContainer) appContainer.classList.remove('has-results');
                if(printBtn) printBtn.disabled = true;
                if(generateResultBtn) generateResultBtn.classList.remove('hidden');
                if(editResultBtn) editResultBtn.classList.add('hidden');
                
                window.scrollTo({ top: 0, behavior: 'smooth' });
            } else {
                alert("All students from this class have been processed!");
            }
        });
    }
    
    // Initialize DB Table if Manage Database tab is active
    renderDbTable();

    // --- Bulk Print Logic ---
    const selectClassBulk = document.getElementById('selectClassBulk');
    const bulkPrintBtn = document.getElementById('bulkPrintBtn');
    const bulkPrintContainer = document.getElementById('bulkPrintContainer');
    let bulkPrintStudents = [];
    if (selectClassBulk && bulkPrintBtn) {
        const searchNameBulk = document.getElementById('searchNameBulk');
        const searchParentBulk = document.getElementById('searchParentBulk');
        function populateCardData(cardNode, student) {
        const q = (sel) => cardNode.querySelector(sel);
        
        if(q('#dispStudentName')) q('#dispStudentName').textContent = student.studentName || '';
        if(q('#dispFatherName')) q('#dispFatherName').textContent = student.fatherName || '';
        if(q('#dispMotherName')) q('#dispMotherName').textContent = student.motherName || '';
        if(q('#dispClassSection')) q('#dispClassSection').textContent = student.classSection || '';
        if(q('#dispAddress')) q('#dispAddress').textContent = student.address || '';
        if(q('#dispDob')) q('#dispDob').textContent = student.dob || '';
        
        if(q('#dispTermName')) q('#dispTermName').textContent = (student.termName || '').toUpperCase();
        if(q('#dispExamName')) q('#dispExamName').textContent = student.examName || '';
        if(q('#dispSessionYear')) q('#dispSessionYear').textContent = student.sessionYear || '';
        if(q('#dispReopen')) q('#dispReopen').textContent = student.reopenDate || '';
        
        if (student.coScholasticData) {
            const grades = student.coScholasticData.split('|');
            if(grades.length >= 4) {
                if(q('#dispGradeDiscipline')) q('#dispGradeDiscipline').textContent = grades[0];
                if(q('#dispGradeArt')) q('#dispGradeArt').textContent = grades[1];
                if(q('#dispGradeSports')) q('#dispGradeSports').textContent = grades[2];
                if(q('#dispGradeComputer')) q('#dispGradeComputer').textContent = grades[3];
            }
        } else {
            if(q('#dispGradeDiscipline')) q('#dispGradeDiscipline').textContent = '';
            if(q('#dispGradeArt')) q('#dispGradeArt').textContent = '';
            if(q('#dispGradeSports')) q('#dispGradeSports').textContent = '';
            if(q('#dispGradeComputer')) q('#dispGradeComputer').textContent = '';
        }
        
        const marksBody = q('#marksTableBody');
        if(marksBody && student.subjectsData) {
            marksBody.innerHTML = '';
            const subs = student.subjectsData.split('|');
            subs.forEach(subStr => {
                const parts = subStr.split(':');
                if(parts.length >= 2) {
                    const name = parts[0].trim();
                    const marks = parseFloat(parts[1].trim()) || 0;
                    const minM = parseFloat(student.minMarksVal) || 33;
                    
                    let grade = 'E';
                    if(marks >= 91) grade = 'A1';
                    else if(marks >= 81) grade = 'A2';
                    else if(marks >= 71) grade = 'B1';
                    else if(marks >= 61) grade = 'B2';
                    else if(marks >= 51) grade = 'C1';
                    else if(marks >= 41) grade = 'C2';
                    else if(marks >= minM) grade = 'D';

                    marksBody.innerHTML += `
                        <tr>
                            <td style="text-align:left;">${name}</td>
                            <td>100</td>
                            <td>${minM}</td>
                            <td>${marks}</td>
                            <td>${grade}</td>
                        </tr>
                    `;
                }
            });
        }
        
        if(q('#dispTotalMarks')) q('#dispTotalMarks').textContent = student.grandTotal ? (student.grandTotal + '/' + (student.maxTotalMarks || '')) : '';
        if(q('#dispPercentage')) q('#dispPercentage').textContent = student.percentage ? student.percentage + '%' : '';
        if(q('#dispOverallGrade')) q('#dispOverallGrade').textContent = student.overallGrade || '';
        if(q('#dispCGPA')) q('#dispCGPA').textContent = student.cgpa || '';
        
        // Recalculate result status & remarks on-the-fly based on 35% rule
        const storedPerc = parseFloat(student.percentage) || 0;
        const recalcStatus = (storedPerc >= 35) ? 'Passed' : 'Failed';
        
        // Recalculate remarks based on failed subjects
        let recalcRemark = student.autoRemark || '';
        if (student.subjectsData) {
            const minM = parseFloat(student.minMarksVal) || 33;
            const subs2 = student.subjectsData.split('|');
            const failedSubs2 = [];
            subs2.forEach(subStr => {
                const parts = subStr.split(':');
                if(parts.length >= 2) {
                    const marks2 = parseFloat(parts[1].trim()) || 0;
                    if(marks2 < minM) failedSubs2.push(parts[0].trim().toUpperCase());
                }
            });
            if(storedPerc >= 35) {
                if(failedSubs2.length > 0) {
                    recalcRemark = `Passed. Needs to work hard in: ${failedSubs2.join(', ')}`;
                } else {
                    // Use original remark if it was a positive one
                    recalcRemark = student.autoRemark || 'Passed.';
                }
            } else {
                if(failedSubs2.length > 0) {
                    recalcRemark = `Failed. Needs to work hard in: ${failedSubs2.join(', ')}`;
                } else {
                    recalcRemark = 'Failed, please meet the class teacher.';
                }
            }
        }
        
        if(q('#dispResult')) {
            const el = q('#dispResult');
            el.textContent = recalcStatus;
            el.className = 'italic-black ' + (recalcStatus === 'Failed' ? 'fail' : 'pass');
        }
        if(q('#dispRemarks')) q('#dispRemarks').textContent = recalcRemark;
    }


    function renderBulkPrint() {
            const cls = selectClassBulk.value;
            const searchName = searchNameBulk ? searchNameBulk.value.toLowerCase().trim() : '';
            const searchParent = searchParentBulk ? searchParentBulk.value.toLowerCase().trim() : '';
            const fullDb = getDb();
            
            bulkPrintStudents = fullDb.filter(s => {
                // A result is only "generated" if it has subjectsData
                if(!s.classSection || !s.subjectsData) return false;
                if(cls && !s.classSection.toUpperCase().includes(cls.toUpperCase())) return false;
                
                if(searchName) {
                    const nameMatch = s.studentName && s.studentName.toLowerCase().includes(searchName);
                    if(!nameMatch) return false;
                }
                
                if(searchParent) {
                    const fatherMatch = s.fatherName && s.fatherName.toLowerCase().includes(searchParent);
                    const motherMatch = s.motherName && s.motherName.toLowerCase().includes(searchParent);
                    if(!fatherMatch && !motherMatch) return false;
                }
                
                return true;
            });
            
            const templateCard = document.getElementById('resultCard');
            bulkPrintContainer.innerHTML = '';
            templateCard.classList.add('hidden');
            
            if (bulkPrintStudents.length > 0) {
                bulkPrintBtn.classList.remove('hidden');
                const appContainer = document.querySelector('#mainAppWrapper .app-container');
                if (appContainer) appContainer.classList.add('has-results');
                bulkPrintBtn.innerHTML = `<i class="ph ph-printer"></i> Print All ${bulkPrintStudents.length} Results`;
                
                bulkPrintStudents.forEach(student => {
                    const clone = templateCard.cloneNode(true);
                    clone.id = '';
                    clone.classList.remove('hidden');
                    clone.classList.add('bulk-print-card');
                    clone.style.margin = "0 auto";
                    clone.style.boxShadow = "0 10px 30px rgba(0,0,0,0.15)";
                    
                    // Add click to view modal
                    clone.addEventListener('click', () => {
                        const modal = document.getElementById('resultModal');
                        const cardContainer = document.getElementById('modalCardContainer');
                        if (modal && cardContainer) {
                            cardContainer.innerHTML = '';
                            const modalClone = clone.cloneNode(true);
                            // Ensure the clone inside modal doesn't have the click listener itself doing weird things
                            modalClone.style.margin = "0";
                            modalClone.style.boxShadow = "none";
                            cardContainer.appendChild(modalClone);
                            modal.classList.remove('hidden');
                        }
                    });
                    
                    populateCardData(clone, student);
                    bulkPrintContainer.appendChild(clone);
                });
            } else {
                bulkPrintBtn.classList.add('hidden');
                bulkPrintContainer.innerHTML = '<p style="margin-top: 2rem; color: var(--text-muted); font-size: 1.1rem;">No saved results found for this search/class.</p>';
            }
        }

        selectClassBulk.addEventListener('change', renderBulkPrint);
        if (searchNameBulk) searchNameBulk.addEventListener('input', renderBulkPrint);
        if (searchParentBulk) searchParentBulk.addEventListener('input', renderBulkPrint);

        bulkPrintBtn.addEventListener('click', () => {
            window.print();
        });
    }

    // Modal close and print handlers
    const closeModalBtn = document.getElementById('closeModalBtn');
    const modalPrintBtn = document.getElementById('modalPrintBtn');
    const resultModal = document.getElementById('resultModal');
    const modalCardContainer = document.getElementById('modalCardContainer');

    if(closeModalBtn && resultModal) {
        closeModalBtn.addEventListener('click', () => {
            resultModal.classList.add('hidden');
            if(modalCardContainer) modalCardContainer.innerHTML = '';
        });
    }
    
    if(modalPrintBtn && modalCardContainer) {
        modalPrintBtn.addEventListener('click', () => {
            // We want to print ONLY the modal card container.
            // A quick way is to hide everything else using CSS during print.
            // But we already have a nice print stylesheet. 
            // The cleanest way is to inject a print class to the body.
            document.body.classList.add('printing-modal');
            window.print();
            document.body.classList.remove('printing-modal');
        });
    }

});
