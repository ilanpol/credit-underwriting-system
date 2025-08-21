/**
 * קובץ ממשק משתמש למערכת חיתום אשראי
 * מנהל את כל האינטראקציות של המשתמש עם המערכת
 */

// 🎨 ממשק משתמש ראשי
class CreditSystemUI {
    constructor() {
        this.currentScreen = 'login';
        this.selectedPayer = null;
        this.searchResults = [];
        this.init();
    }

    // 🚀 אתחול המערכת
    init() {
        this.createLoginScreen();
        this.bindEvents();
        console.log('מערכת חיתום אשראי - ממשק משתמש הותחל');
    }

    // 🔐 יצירת מסך התחברות
    createLoginScreen() {
        const loginHTML = `
            <div id="loginScreen" class="screen active">
                <div class="login-container">
                    <div class="login-header">
                        <h1>🏦 מערכת חיתום אשראי</h1>
                        <p>נא הזן פרטי התחברות</p>
                    </div>
                    <form id="loginForm" class="login-form">
                        <div class="input-group">
                            <label for="username">שם משתמש:</label>
                            <input type="text" id="username" name="username" required>
                        </div>
                        <div class="input-group">
                            <label for="password">סיסמה:</label>
                            <input type="password" id="password" name="password" required>
                        </div>
                        <button type="submit" class="btn btn-primary">התחבר</button>
                        <div id="loginError" class="error-message"></div>
                    </form>
                    <div class="demo-users">
                        <h3>משתמשי דמו:</h3>
                        <ul>
                            <li>admin / admin123</li>
                            <li>manager / manager456</li>
                            <li>analyst / analyst789</li>
                            <li>demo / demo123</li>
                        </ul>
                    </div>
                </div>
            </div>
        `;
        document.body.innerHTML = loginHTML;
    }

    // 🏠 יצירת מסך ראשי
    createMainScreen() {
        const mainHTML = `
            <div id="mainScreen" class="screen active">
                <header class="main-header">
                    <div class="header-content">
                        <h1>🏦 מערכת חיתום אשראי</h1>
                        <div class="user-info">
                            <span>שלום, ${window.CreditSystem.currentUser}</span>
                            <button id="logoutBtn" class="btn btn-secondary">התנתק</button>
                        </div>
                    </div>
                </header>

                <nav class="main-nav">
                    <button id="navUpload" class="nav-btn active" data-section="upload">
                        📤 העלאת נתונים
                    </button>
                    <button id="navSearch" class="nav-btn" data-section="search">
                        🔍 חיפוש מושך
                    </button>
                    <button id="navRating" class="nav-btn" data-section="rating">
                        ⭐ דירוג אשראי
                    </button>
                    <button id="navReports" class="nav-btn" data-section="reports">
                        📊 דוחות
                    </button>
                    <button id="navSettings" class="nav-btn" data-section="settings">
                        ⚙️ הגדרות
                    </button>
                </nav>

                <main class="main-content">
                    <div id="uploadSection" class="content-section active">
                        ${this.createUploadSection()}
                    </div>
                    <div id="searchSection" class="content-section">
                        ${this.createSearchSection()}
                    </div>
                    <div id="ratingSection" class="content-section">
                        ${this.createRatingSection()}
                    </div>
                    <div id="reportsSection" class="content-section">
                        ${this.createReportsSection()}
                    </div>
                    <div id="settingsSection" class="content-section">
                        ${this.createSettingsSection()}
                    </div>
                </main>
            </div>
        `;
        document.body.innerHTML = mainHTML;
    }

    // 📤 יצירת סקציית העלאה
    createUploadSection() {
        return `
            <div class="upload-container">
                <h2>העלאת קובץ נתונים</h2>
                <div class="upload-area" id="uploadArea">
                    <div class="upload-content">
                        <div class="upload-icon">📋</div>
                        <p>גרור קובץ Excel לכאן או לחץ לבחירה</p>
                        <input type="file" id="fileInput" accept=".xlsx,.xls" style="display: none;">
                        <button id="selectFileBtn" class="btn btn-primary">בחר קובץ</button>
                    </div>
                </div>
                <div id="uploadProgress" class="upload-progress" style="display: none;">
                    <div class="progress-bar">
                        <div class="progress-fill"></div>
                    </div>
                    <span class="progress-text">מעלה קובץ...</span>
                </div>
                <div id="uploadResult" class="upload-result"></div>
                <div id="dataPreview" class="data-preview"></div>
            </div>
        `;
    }

    // 🔍 יצירת סקציית חיפוש
    createSearchSection() {
        return `
            <div class="search-container">
                <h2>חיפוש מושך</h2>
                <div class="search-form">
                    <div class="search-input-container">
                        <input type="text" id="payerSearch" placeholder="הזן שם מושך או מספר זהות..." class="search-input">
                        <button id="searchBtn" class="btn btn-primary">חפש</button>
                    </div>
                    <div id="searchSuggestions" class="search-suggestions"></div>
                </div>
                <div id="searchResults" class="search-results"></div>
            </div>
        `;
    }

    // ⭐ יצירת סקציית דירוג
    createRatingSection() {
        return `
            <div class="rating-container">
                <h2>דירוג אשראי</h2>
                <div id="ratingContent">
                    <div class="no-selection">
                        <div class="empty-state">
                            <div class="empty-icon">⭐</div>
                            <p>נא בחר מושך מתוך תוצאות החיפוש כדי לראות את הדירוג</p>
                        </div>
                    </div>
                </div>
            </div>
        `;
    }

    // 📊 יצירת סקציית דוחות
    createReportsSection() {
        return `
            <div class="reports-container">
                <h2>דוחות ואנליטיקה</h2>
                <div class="reports-grid">
                    <div class="report-card">
                        <h3>📈 דוח משוקים בתקופה</h3>
                        <p>רשימת כל המושכים שהיו פעילים בתקופה נבחרת</p>
                        <button class="btn btn-primary">הפק דוח</button>
                    </div>
                    <div class="report-card">
                        <h3>⚠️ דוח שיקים חוזרים</h3>
                        <p>מושכים עם שיעור גבוה של שיקים חוזרים</p>
                        <button class="btn btn-warning">הפק דוח</button>
                    </div>
                    <div class="report-card">
                        <h3>💰 דוח נפחי עסקאות</h3>
                        <p>ניתוח נפחים והיקף עסקאות לפי מושכים</p>
                        <button class="btn btn-primary">הפק דוח</button>
                    </div>
                    <div class="report-card">
                        <h3>📊 דוח דירוג אשראי כללי</h3>
                        <p>סקירה כללית של דירוגי האשראי במערכת</p>
                        <button class="btn btn-primary">הפק דוח</button>
                    </div>
                </div>
            </div>
        `;
    }

    // ⚙️ יצירת סקציית הגדרות
    createSettingsSection() {
        return `
            <div class="settings-container">
                <h2>הגדרות מערכת</h2>
                <div class="settings-tabs">
                    <button class="settings-tab active" data-tab="parameters">פרמטרי דירוג</button>
                    <button class="settings-tab" data-tab="ui">הגדרות ממשק</button>
                    <button class="settings-tab" data-tab="export">ייצוא נתונים</button>
                </div>
                
                <div id="parametersTab" class="settings-content active">
                    <h3>משקולות פרמטרי דירוג</h3>
                    <div class="parameters-list">
                        ${this.createParametersSettings()}
                    </div>
                    <button id="saveParameters" class="btn btn-primary">שמור הגדרות</button>
                </div>
                
                <div id="uiTab" class="settings-content">
                    <h3>הגדרות ממשק משתמש</h3>
                    <div class="ui-settings">
                        <div class="setting-item">
                            <label>מספר הצעות בחיפוש אוטומטי:</label>
                            <input type="number" id="autocompleteSuggestions" value="${window.CreditSystem.ui.autocompleteSuggestions}" min="5" max="20">
                        </div>
                        <div class="setting-item">
                            <label>מספר שורות בתצוגה מקדימה:</label>
                            <input type="number" id="previewRowsLimit" value="${window.CreditSystem.ui.previewRowsLimit}" min="3" max="10">
                        </div>
                    </div>
                    <button id="saveUISettings" class="btn btn-primary">שמור הגדרות</button>
                </div>
                
                <div id="exportTab" class="settings-content">
                    <h3>ייצוא נתונים</h3>
                    <div class="export-options">
                        <button class="btn btn-primary">ייצא נתוני מושכים</button>
                        <button class="btn btn-primary">ייצא דירוגי אשראי</button>
                        <button class="btn btn-primary">ייצא הגדרות מערכת</button>
                    </div>
                </div>
            </div>
        `;
    }

    // ⚖️ יצירת הגדרות פרמטרים
    createParametersSettings() {
        let html = '';
        Object.entries(RATING_PARAMETERS).forEach(([key, param]) => {
            html += `
                <div class="parameter-item">
                    <div class="parameter-info">
                        <strong>${param.name}</strong>
                        <span class="parameter-desc">${param.description}</span>
                    </div>
                    <div class="parameter-control">
                        <input type="range" id="param_${key}" min="0" max="0.3" step="0.01" value="${param.weight}">
                        <span class="weight-value">${(param.weight * 100).toFixed(1)}%</span>
                    </div>
                </div>
            `;
        });
        return html;
    }

    // 🎯 קישור אירועים
    bindEvents() {
        // אירועי התחברות
        document.addEventListener('submit', (e) => {
            if (e.target.id === 'loginForm') {
                e.preventDefault();
                this.handleLogin();
            }
        });

        // אירועי ניווט
        document.addEventListener('click', (e) => {
            if (e.target.classList.contains('nav-btn')) {
                this.switchSection(e.target.dataset.section);
            }
            
            if (e.target.id === 'logoutBtn') {
                this.handleLogout();
            }

            if (e.target.id === 'selectFileBtn') {
                document.getElementById('fileInput').click();
            }

            if (e.target.id === 'searchBtn') {
                this.performSearch();
            }
        });

        // אירועי העלאת קובץ
        document.addEventListener('change', (e) => {
            if (e.target.id === 'fileInput') {
                this.handleFileUpload(e.target.files[0]);
            }
        });

        // אירועי חיפוש
        document.addEventListener('input', (e) => {
            if (e.target.id === 'payerSearch') {
                this.handleSearchInput(e.target.value);
            }
        });

        // אירועי הגדרות
        document.addEventListener('click', (e) => {
            if (e.target.classList.contains('settings-tab')) {
                this.switchSettingsTab(e.target.dataset.tab);
            }
        });
    }

    // 🔐 טיפול בהתחברות
    handleLogin() {
        const username = document.getElementById('username').value;
        const password = document.getElementById('password').value;
        const errorElement = document.getElementById('loginError');

        if (SYSTEM_USERS[username] && SYSTEM_USERS[username] === password) {
            window.CreditSystem.currentUser = username;
            window.CreditSystem.isInitialized = true;
            this.createMainScreen();
            this.bindEvents();
            errorElement.textContent = '';
        } else {
            errorElement.textContent = 'שם משתמש או סיסמה שגויים';
        }
    }

    // 🚪 התנתקות
    handleLogout() {
        window.CreditSystem.currentUser = null;
        window.CreditSystem.isInitialized = false;
        this.createLoginScreen();
        this.bindEvents();
    }

    // 🔄 החלפת סקציה
    switchSection(sectionName) {
        // הסרת פעיל מכל הכפתורים והסקציות
        document.querySelectorAll('.nav-btn').forEach(btn => btn.classList.remove('active'));
        document.querySelectorAll('.content-section').forEach(section => section.classList.remove('active'));

        // הוספת פעיל לכפתור והסקציה הנבחרים
        document.querySelector(`[data-section="${sectionName}"]`).classList.add('active');
        document.getElementById(`${sectionName}Section`).classList.add('active');

        this.currentScreen = sectionName;
    }

    // 🗂️ החלפת טאב הגדרות
    switchSettingsTab(tabName) {
        document.querySelectorAll('.settings-tab').forEach(tab => tab.classList.remove('active'));
        document.querySelectorAll('.settings-content').forEach(content => content.classList.remove('active'));

        document.querySelector(`[data-tab="${tabName}"]`).classList.add('active');
        document.getElementById(`${tabName}Tab`).classList.add('active');
    }

    // 📤 טיפול בהעלאת קובץ
    handleFileUpload(file) {
        if (!file) return;

        const progressElement = document.getElementById('uploadProgress');
        const resultElement = document.getElementById('uploadResult');
        
        progressElement.style.display = 'block';
        
        // סימולציה של העלאה
        setTimeout(() => {
            progressElement.style.display = 'none';
            resultElement.innerHTML = `
                <div class="success-message">
                    ✅ הקובץ ${file.name} הועלה בהצלחה!<br>
                    נמצאו ${Math.floor(Math.random() * 1000 + 500)} רשומות מושכים.
                </div>
            `;
            this.showDataPreview();
        }, 2000);
    }

    // 👁️ הצגת תצוגה מקדימה
    showDataPreview() {
        const previewElement = document.getElementById('dataPreview');
        previewElement.innerHTML = `
            <h3>תצוגה מקדימה</h3>
            <div class="preview-table">
                <table>
                    <thead>
                        <tr>
                            <th>מספר מושך</th>
                            <th>שם מושך</th>
                            <th>סכום עסקה</th>
                            <th>תאריך</th>
                            <th>סטטוס</th>
                        </tr>
                    </thead>
                    <tbody>
                        <tr><td>123456789</td><td>דוד כהן</td><td>₪15,000</td><td>01/08/2024</td><td>שולם</td></tr>
                        <tr><td>987654321</td><td>שרה לוי</td><td>₪8,500</td><td>02/08/2024</td><td>פתוח</td></tr>
                        <tr><td>456789123</td><td>אברהם ישראל</td><td>₪22,000</td><td>03/08/2024</td><td>שולם</td></tr>
                    </tbody>
                </table>
            </div>
        `;
    }

    // 🔍 טיפול בקלט חיפוש
    handleSearchInput(value) {
        if (value.length < 2) {
            document.getElementById('searchSuggestions').innerHTML = '';
            return;
        }

        // סימולציה של הצעות
        const suggestions = [
            'דוד כהן - 123456789',
            'שרה לוי - 987654321',
            'אברהם ישראל - 456789123',
            'רחל גרין - 111222333'
        ].filter(suggestion => suggestion.includes(value));

        this.showSuggestions(suggestions.slice(0, window.CreditSystem.ui.autocompleteSuggestions));
    }

    // 💡 הצגת הצעות
    showSuggestions(suggestions) {
        const suggestionsElement = document.getElementById('searchSuggestions');
        if (suggestions.length === 0) {
            suggestionsElement.innerHTML = '';
            return;
        }

        const html = suggestions.map(suggestion => 
            `<div class="suggestion-item">${suggestion}</div>`
        ).join('');
        
        suggestionsElement.innerHTML = html;

        // קישור אירועים להצעות
        suggestionsElement.addEventListener('click', (e) => {
            if (e.target.classList.contains('suggestion-item')) {
                document.getElementById('payerSearch').value = e.target.textContent;
                suggestionsElement.innerHTML = '';
                this.performSearch();
            }
        });
    }

    // 🔎 ביצוע חיפוש
    performSearch() {
        const searchTerm = document.getElementById('payerSearch').value;
        if (!searchTerm.trim()) return;

        const resultsElement = document.getElementById('searchResults');
        resultsElement.innerHTML = `
            <div class="search-result-card">
                <div class="payer-header">
                    <h3>דוד כהן</h3>
                    <span class="payer-id">מספר זהות: 123456789</span>
                </div>
                <div class="payer-stats">
                    <div class="stat-item">
                        <label>סה"כ עסקאות:</label>
                        <span>47</span>
                    </div>
                    <div class="stat-item">
                        <label>היקף כולל:</label>
                        <span>₪285,000</span>
                    </div>
                    <div class="stat-item">
                        <label>שיקים חוזרים:</label>
                        <span class="warning">3</span>
                    </div>
                </div>
                <div class="payer-actions">
                    <button class="btn btn-primary" onclick="creditUI.showPayerRating('123456789')">
                        הצג דירוג אשראי
                    </button>
                </div>
            </div>
        `;
    }

    // ⭐ הצגת דירוג מושך
    showPayerRating(payerId) {
        this.switchSection('rating');
        
        const ratingElement = document.getElementById('ratingContent');
        ratingElement.innerHTML = `
            <div class="rating-card">
                <div class="rating-header">
                    <h3>דירוג אשראי - דוד כהן</h3>
                    <div class="credit-score">
                        <span class="score-value">78</span>
                        <span class="score-label">נקודות</span>
                        <div class="score-grade good">טוב</div>
                    </div>
                </div>
                
                <div class="rating-breakdown">
                    <h4>פירוט הדירוג</h4>
                    ${this.createRatingBreakdown()}
                </div>
                
                <div class="risk-assessment">
                    <h4>הערכת סיכון</h4>
                    <div class="risk-indicator low">
                        <span class="risk-level">סיכון נמוך</span>
                        <span class="risk-description">מושך אמין עם היסטוריה טובה</span>
                    </div>
                </div>
                
                <div class="recommendations">
                    <h4>המלצות</h4>
                    <ul>
                        <li>✅ ניתן לאשר אשראי עד ₪50,000</li>
                        <li>✅ תנאי תשלום: עד 60 יום</li>
                        <li>⚠️ מומלץ מעקב על שיקים חוזרים</li>
                    </ul>
                </div>
            </div>
        `;
    }

    // 📊 יצירת פירוט דירוג
    createRatingBreakdown() {
        let html = '<div class="parameters-breakdown">';
        
        Object.entries(RATING_PARAMETERS).forEach(([key, param]) => {
            const score = Math.floor(Math.random() * 100);
            const barWidth = score;
            
            html += `
                <div class="parameter-row">
                    <div class="parameter-name">${param.name}</div>
                    <div class="parameter-bar">
                        <div class="bar-fill" style="width: ${barWidth}%"></div>
                        <span class="bar-score">${score}</span>
                    </div>
                    <div class="parameter-weight">${(param.weight * 100).toFixed(1)}%</div>
                </div>
            `;
        });
        
        html += '</div>';
        return html;
    }

    // 📱 עדכון ממשק לנייד
    updateMobileLayout() {
        const isMobile = window.innerWidth < 768;
        document.body.classList.toggle('mobile-layout', isMobile);
    }
}

// 🎬 אתחול המערכת
let creditUI;
document.addEventListener('DOMContentLoaded', () => {
    creditUI = new CreditSystemUI();
    window.addEventListener('resize', () => creditUI.updateMobileLayout());
    creditUI.updateMobileLayout();
});

// 🌍 הפיכה לגלובלי
window.CreditSystemUI = CreditSystemUI;
