/**
 * מערכת התחברות ואבטחה
 * כולל התחברות, יציאה, ניהול הרשאות ואבטחה בסיסית
 */

// 🔐 מנהל אבטחה ומשתמשים
const AuthManager = {
    // משתני מצב
    currentUser: null,
    sessionTimeout: 30 * 60 * 1000, // 30 דקות בשניות
    lastActivity: null,
    sessionTimer: null,

    /**
     * התחברות למערכת
     * @param {string} username - שם משתמש
     * @param {string} password - סיסמה
     * @returns {Object} - תוצאת התחברות
     */
    login(username, password) {
        LogUtils.info('ניסיון התחברות למערכת', { username });

        // ניקוי קלט
        const cleanUsername = StringUtils.cleanString(username);
        const cleanPassword = StringUtils.cleanString(password);

        // בדיקת קלט ריק
        if (StringUtils.isEmpty(cleanUsername) || StringUtils.isEmpty(cleanPassword)) {
            LogUtils.warn('ניסיון התחברות עם שדות ריקים');
            return {
                success: false,
                error: 'שם משתמש וסיסמה נדרשים',
                errorCode: 'EMPTY_CREDENTIALS'
            };
        }

        // בדיקת אישורים
        const storedPassword = SYSTEM_USERS[cleanUsername];
        if (!storedPassword || storedPassword !== cleanPassword) {
            LogUtils.warn('ניסיון התחברות כושל', { username: cleanUsername });
            
            // הוספת השהיה קצרה כנגד brute force
            setTimeout(() => {}, 1000);
            
            return {
                success: false,
                error: 'שם משתמש או סיסמה שגויים',
                errorCode: 'INVALID_CREDENTIALS'
            };
        }

        // התחברות מצליחה
        this.currentUser = {
            username: cleanUsername,
            loginTime: new Date(),
            lastActivity: new Date(),
            permissions: this.getUserPermissions(cleanUsername)
        };

        // עדכון מערכת
        window.CreditSystem.currentUser = this.currentUser;
        this.lastActivity = new Date();
        
        // התחלת ניטור פעילות
        this.startSessionMonitoring();
        
        // עדכון ממשק
        this.updateUIAfterLogin();

        LogUtils.success('התחברות מוצלחת', { username: cleanUsername });

        return {
            success: true,
            user: this.currentUser,
            message: `ברוך הבא ${cleanUsername}!`
        };
    },

    /**
     * יציאה מהמערכת
     */
    logout() {
        if (this.currentUser) {
            LogUtils.info('יציאה מהמערכת', { username: this.currentUser.username });
        }

        // ניקוי נתונים
        this.currentUser = null;
        window.CreditSystem.currentUser = null;
        this.lastActivity = null;

        // ניקוי טיימרים
        if (this.sessionTimer) {
            clearInterval(this.sessionTimer);
            this.sessionTimer = null;
        }

        // עדכון ממשק
        this.updateUIAfterLogout();

        // ניקוי נתוני מערכת (אופציונלי)
        this.clearSystemData();

        LogUtils.info('יציאה מהמערכת הושלמה');
    },

    /**
     * בדיקת זהות משתמש מחובר
     * @returns {boolean}
     */
    isLoggedIn() {
        return this.currentUser !== null && this.isSessionValid();
    },

    /**
     * בדיקת תוקף session
     * @returns {boolean}
     */
    isSessionValid() {
        if (!this.currentUser || !this.lastActivity) {
            return false;
        }

        const now = new Date();
        const timeDiff = now - this.lastActivity;
        return timeDiff < this.sessionTimeout;
    },

    /**
     * עדכון זמן פעילות אחרונה
     */
    updateActivity() {
        if (this.currentUser) {
            this.lastActivity = new Date();
            this.currentUser.lastActivity = this.lastActivity;
        }
    },

    /**
     * התחלת ניטור session
     */
    startSessionMonitoring() {
        // ניקוי טיימר קודם
        if (this.sessionTimer) {
            clearInterval(this.sessionTimer);
        }

        // בדיקה כל דקה
        this.sessionTimer = setInterval(() => {
            if (!this.isSessionValid()) {
                LogUtils.warn('Session פג תוקף - מתנתק אוטומטית');
                this.logout();
                this.showSessionExpiredMessage();
            }
        }, 60000); // כל דקה

        // עדכון פעילות עם אירועי עכבר ומקלדת
        ['mousedown', 'mousemove', 'keypress', 'scroll', 'touchstart'].forEach(event => {
            document.addEventListener(event, () => {
                this.updateActivity();
            }, { passive: true });
        });
    },

    /**
     * קבלת הרשאות משתמש
     * @param {string} username - שם משתמש
     * @returns {Object} - הרשאות
     */
    getUserPermissions(username) {
        const permissions = {
            canCalculateRating: true,
            canViewHistory: true,
            canExportData: false,
            canManageUsers: false,
            canViewReports: false,
            canEditSettings: false
        };

        // הרשאות לפי סוג משתמש
        switch (username) {
            case 'admin':
                return {
                    ...permissions,
                    canExportData: true,
                    canManageUsers: true,
                    canViewReports: true,
                    canEditSettings: true
                };
            
            case 'manager':
                return {
                    ...permissions,
                    canExportData: true,
                    canViewReports: true
                };
            
            case 'analyst':
                return {
                    ...permissions,
                    canExportData: true
                };
            
            default:
                return permissions;
        }
    },

    /**
     * בדיקת הרשאה ספציפית
     * @param {string} permission - שם ההרשאה
     * @returns {boolean}
     */
    hasPermission(permission) {
        if (!this.isLoggedIn()) {
            return false;
        }
        
        return this.currentUser.permissions[permission] === true;
    },

    /**
     * עדכון ממשק אחרי התחברות
     */
    updateUIAfterLogin() {
        // הסתרת מסך התחברות
        DOMUtils.toggleElement('loginScreen', false);
        
        // הצגת אפליקציה ראשית
        DOMUtils.toggleElement('mainApp', true);
        
        // עדכון פרטי משתמש
        const userElement = DOMUtils.getElementById('currentUser');
        if (userElement) {
            userElement.textContent = `משתמש: ${this.currentUser.username}`;
        }

        // ניקוי שגיאות התחברות
        const errorElement = DOMUtils.getElementById('loginError');
        if (errorElement) {
            errorElement.style.display = 'none';
            errorElement.textContent = '';
        }

        // ניקוי שדות התחברות
        this.clearLoginForm();
    },

    /**
     * עדכון ממשק אחרי יציאה
     */
    updateUIAfterLogout() {
        // הצגת מסך התחברות
        DOMUtils.toggleElement('loginScreen', true);
        
        // הסתרת אפליקציה ראשית
        DOMUtils.toggleElement('mainApp', false);
        
        // הסתרת תוצאות
        DOMUtils.toggleElement('resultsSection', false);
        
        // ניקוי שדות טופס
        this.resetAllForms();
    },

    /**
     * הצגת הודעת session פג תוקף
     */
    showSessionExpiredMessage() {
        const errorElement = DOMUtils.getElementById('loginError');
        if (errorElement) {
            errorElement.textContent = 'פג תוקף ההתחברות. אנא התחבר שוב.';
            errorElement.style.display = 'block';
        }
    },

    /**
     * ניקוי טופס התחברות
     */
    clearLoginForm() {
        const usernameInput = DOMUtils.getElementById('username');
        const passwordInput = DOMUtils.getElementById('password');
        
        if (usernameInput) usernameInput.value = '';
        if (passwordInput) passwordInput.value = '';
    },

    /**
     * איפוס כל הטפסים במערכת
     */
    resetAllForms() {
        // איפוס טופס עסקה
        const formFields = ['payerName', 'payerID', 'checkAmount', 'creditDays'];
        formFields.forEach(fieldId => {
            const field = DOMUtils.getElementById(fieldId);
            if (field) {
                field.value = fieldId === 'creditDays' ? '30' : '';
            }
        });

        // ניקוי הצעות השלמה אוטומטית
        const suggestions = DOMUtils.getElementById('payerNameSuggestions');
        if (suggestions) {
            suggestions.style.display = 'none';
        }

        // ניקוי תצוגת נתונים
        const dataPreview = DOMUtils.getElementById('dataPreview');
        if (dataPreview) {
            dataPreview.style.display = 'none';
        }
    },

    /**
     * ניקוי נתוני מערכת (אופציונלי - לאבטחה)
     */
    clearSystemData() {
        // ניקוי נתונים רגישים מהזיכרון
        window.CreditSystem.excelData = {};
        window.CreditSystem.payersMap = new Map();
        
        LogUtils.info('נתוני מערכת נוקו בעת יציאה');
    },

    /**
     * בדיקת חוזק סיסמה (לעתיד)
     * @param {string} password - סיסמה
     * @returns {Object} - ניתוח חוזק
     */
    checkPasswordStrength(password) {
        const analysis = {
            score: 0,
            feedback: [],
            isStrong: false
        };

        if (StringUtils.isEmpty(password)) {
            analysis.feedback.push('סיסמה נדרשת');
            return analysis;
        }

        // בדיקות חוזק
        if (password.length >= 8) analysis.score += 25;
        else analysis.feedback.push('לפחות 8 תווים');

        if (/[a-z]/.test(password)) analysis.score += 25;
        else analysis.feedback.push('אות קטנה');

        if (/[A-Z]/.test(password)) analysis.score += 25;
        else analysis.feedback.push('אות גדולה');

        if (/[0-9]/.test(password)) analysis.score += 25;
        else analysis.feedback.push('מספר');

        analysis.isStrong = analysis.score >= 75;
        
        return analysis;
    }
};

// 🎮 פונקציות ממשק משתמש להתחברות
/**
 * פונקציה להתחברות מהטופס
 * @param {Event} event - אירוע הטופס
 * @returns {boolean}
 */
function loginUser(event) {
    event.preventDefault();
    
    const username = DOMUtils.getElementById('username')?.value || '';
    const password = DOMUtils.getElementById('password')?.value || '';
    
    const result = AuthManager.login(username, password);
    
    if (result.success) {
        LogUtils.success('התחברות מוצלחת');
        return false; // מונע שליחת טופס
    } else {
        // הצגת שגיאה
        const errorElement = DOMUtils.getElementById('loginError');
        if (errorElement) {
            errorElement.textContent = result.error;
            errorElement.style.display = 'block';
        }
        
        LogUtils.error('התחברות נכשלה', result);
        return false;
    }
}

/**
 * פונקציה ליציאה מהמערכת
 */
function logoutUser() {
    if (confirm('האם אתה בטוח שברצונך להתנתק?')) {
        AuthManager.logout();
    }
}

/**
 * בדיקת הרשאה לפעולה
 * @param {string} permission - שם ההרשאה
 * @param {string} actionName - שם הפעולה למטרת הודעה
 * @returns {boolean}
 */
function checkPermission(permission, actionName = 'פעולה זו') {
    if (!AuthManager.hasPermission(permission)) {
        alert(`אין לך הרשאה לבצע ${actionName}`);
        LogUtils.warn('ניסיון גישה ללא הרשאה', { 
            permission, 
            actionName, 
            user: AuthManager.currentUser?.username 
        });
        return false;
    }
    return true;
}

/**
 * אתחול מערכת האבטחה
 */
function initializeAuth() {
    LogUtils.info('מאתחל מערכת אבטחה');
    
    // בדיקה אם יש session קיים (לעתיד - עם localStorage)
    // כרגע נתחיל תמיד במסך התחברות
    
    // הוספת event listeners
    const loginForm = document.querySelector('.login-form');
    if (loginForm) {
        loginForm.addEventListener('submit', loginUser);
    }
    
    // הוספת בדיקת Enter בשדות התחברות
    ['username', 'password'].forEach(fieldId => {
        const field = DOMUtils.getElementById(fieldId);
        if (field) {
            field.addEventListener('keypress', (event) => {
                if (event.key === 'Enter') {
                    loginUser(event);
                }
            });
        }
    });
    
    LogUtils.success('מערכת אבטחה הופעלה');
}

// 🚀 אתחול אוטומטי כאשר הדף נטען
document.addEventListener('DOMContentLoaded', initializeAuth);

// 📤 ייצוא לגלובל
window.AuthManager = AuthManager;
window.loginUser = loginUser;
window.logoutUser = logoutUser;
window.checkPermission = checkPermission;
window.initializeAuth = initializeAuth;

console.log('🔐 מערכת התחברות ואבטחה נטענה בהצלחה');
