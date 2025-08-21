/**
 * קובץ פונקציות עזר כלליות
 * כולל פונקציות לעיבוד תאריכים, מספרים, קבצים ועוד
 */

// 📅 פונקציות עבודה עם תאריכים
const DateUtils = {
    /**
     * פרסור תאריך מפורמטים שונים
     * @param {string} dateStr - מחרוזת תאריך
     * @returns {Date|null} - אובייקט תאריך או null
     */
    parseDate(dateStr) {
        if (!dateStr) return null;
        
        const str = dateStr.toString().trim();
        const patterns = DATA_PROCESSING_CONFIG.dateFormats;
        
        for (let i = 0; i < patterns.length; i++) {
            const match = str.match(patterns[i]);
            if (match) {
                let day, month, year;
                
                if (i === 2) { // yyyy-mm-dd
                    year = parseInt(match[1]);
                    month = parseInt(match[2]) - 1; // JavaScript months are 0-based
                    day = parseInt(match[3]);
                } else { // dd/mm/yyyy or dd-mm-yyyy or dd.mm.yyyy
                    day = parseInt(match[1]);
                    month = parseInt(match[2]) - 1;
                    year = parseInt(match[3]);
                }
                
                const date = new Date(year, month, day);
                if (!isNaN(date.getTime())) {
                    return date;
                }
            }
        }
        
        // ניסיון אחרון עם Date constructor
        const date = new Date(str);
        return !isNaN(date.getTime()) ? date : null;
    },

    /**
     * חישוב הפרש ימים בין תאריכים
     * @param {Date|string} startDate - תאריך התחלה
     * @param {Date|string} endDate - תאריך סיום
     * @returns {number} - מספר ימים
     */
    daysDifference(startDate, endDate) {
        const start = typeof startDate === 'string' ? this.parseDate(startDate) : startDate;
        const end = typeof endDate === 'string' ? this.parseDate(endDate) : endDate;
        
        if (!start || !end) return 0;
        
        const diffTime = end - start;
        return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    },

    /**
     * בדיקה אם תאריך עתידי
     * @param {Date|string} date - תאריך לבדיקה
     * @returns {boolean}
     */
    isFutureDate(date) {
        const targetDate = typeof date === 'string' ? this.parseDate(date) : date;
        if (!targetDate) return false;
        
        return targetDate > new Date();
    },

    /**
     * עיצוב תאריך לתצוגה
     * @param {Date|string} date - תאריך
     * @returns {string} - תאריך מעוצב
     */
    formatDate(date) {
        const targetDate = typeof date === 'string' ? this.parseDate(date) : date;
        if (!targetDate) return '';
        
        return targetDate.toLocaleDateString('he-IL');
    },

    /**
     * חישוב ימי ניכיון מהיום
     * @param {Date|string} dueDate - תאריך פירעון
     * @returns {number} - ימי ניכיון
     */
    calculateDiscountDays(dueDate) {
        const due = typeof dueDate === 'string' ? this.parseDate(dueDate) : dueDate;
        if (!due) return 0;
        
        const today = new Date();
        return due > today ? Math.ceil((due - today) / (1000 * 60 * 60 * 24)) : 0;
    }
};

// 🔢 פונקציות עבודה עם מספרים
const NumberUtils = {
    /**
     * בדיקה אם ערך הוא מספר תקין
     * @param {any} value - ערך לבדיקה
     * @returns {boolean}
     */
    isValidNumber(value) {
        return !isNaN(parseFloat(value)) && isFinite(value);
    },

    /**
     * המרה בטוחה למספר
     * @param {any} value - ערך להמרה
     * @param {number} defaultValue - ערך ברירת מחדל
     * @returns {number}
     */
    safeParseFloat(value, defaultValue = 0) {
        const parsed = parseFloat(value);
        return this.isValidNumber(parsed) ? parsed : defaultValue;
    },

    /**
     * המרה בטוחה למספר שלם
     * @param {any} value - ערך להמרה
     * @param {number} defaultValue - ערך ברירת מחדל
     * @returns {number}
     */
    safeParseInt(value, defaultValue = 0) {
        const parsed = parseInt(value);
        return this.isValidNumber(parsed) ? parsed : defaultValue;
    },

    /**
     * עיצוב מספר עם פסיקים
     * @param {number} number - מספר לעיצוב
     * @param {number} decimals - מספר ספרות אחרי הנקודה
     * @returns {string}
     */
    formatNumber(number, decimals = 0) {
        if (!this.isValidNumber(number)) return '0';
        return number.toLocaleString('he-IL', { 
            minimumFractionDigits: decimals,
            maximumFractionDigits: decimals 
        });
    },

    /**
     * עיצוב מטבע
     * @param {number} amount - סכום
     * @returns {string}
     */
    formatCurrency(amount) {
        if (!this.isValidNumber(amount)) return '0 ₪';
        return `${this.formatNumber(amount)} ₪`;
    },

    /**
     * עיצוב אחוזים
     * @param {number} value - ערך
     * @param {number} decimals - ספרות אחרי הנקודה
     * @returns {string}
     */
    formatPercentage(value, decimals = 1) {
        if (!this.isValidNumber(value)) return '0%';
        return `${this.formatNumber(value, decimals)}%`;
    },

    /**
     * חישוב אחוז שינוי
     * @param {number} oldValue - ערך ישן
     * @param {number} newValue - ערך חדש
     * @returns {number}
     */
    calculatePercentageChange(oldValue, newValue) {
        if (!this.isValidNumber(oldValue) || !this.isValidNumber(newValue) || oldValue === 0) {
            return 0;
        }
        return ((newValue - oldValue) / oldValue) * 100;
    }
};

// 📝 פונקציות עבודה עם מחרוזות
const StringUtils = {
    /**
     * ניקוי וטרימינג מחרוזת
     * @param {any} value - ערך לניקוי
     * @returns {string}
     */
    cleanString(value) {
        if (value === null || value === undefined) return '';
        return value.toString().trim();
    },

    /**
     * בדיקה אם מחרוזת ריקה
     * @param {any} value - ערך לבדיקה
     * @returns {boolean}
     */
    isEmpty(value) {
        return !value || this.cleanString(value) === '';
    },

    /**
     * המרה לאותיות קטנות עם ניקוי
     * @param {string} str - מחרוזת
     * @returns {string}
     */
    toLowerClean(str) {
        return this.cleanString(str).toLowerCase();
    },

    /**
     * בדיקה אם מחרוזת מכילה טקסט אחר
     * @param {string} haystack - המחרוזת הראשית
     * @param {string} needle - הטקסט לחיפוש
     * @returns {boolean}
     */
    contains(haystack, needle) {
        if (this.isEmpty(haystack) || this.isEmpty(needle)) return false;
        return this.toLowerClean(haystack).includes(this.toLowerClean(needle));
    },

    /**
     * קיצור טקסט עם שלוש נקודות
     * @param {string} text - טקסט לקיצור
     * @param {number} maxLength - אורך מקסימלי
     * @returns {string}
     */
    truncate(text, maxLength = 50) {
        const clean = this.cleanString(text);
        if (clean.length <= maxLength) return clean;
        return clean.substring(0, maxLength - 3) + '...';
    },

    /**
     * הסרת תווים מיוחדים
     * @param {string} str - מחרוזת
     * @returns {string}
     */
    removeSpecialChars(str) {
        return this.cleanString(str).replace(/[^a-zA-Zא-ת0-9\s]/g, '');
    }
};

// 📊 פונקציות עבודה עם מערכים
const ArrayUtils = {
    /**
     * בדיקה אם מערך ריק או לא קיים
     * @param {any} arr - מערך לבדיקה
     * @returns {boolean}
     */
    isEmpty(arr) {
        return !Array.isArray(arr) || arr.length === 0;
    },

    /**
     * סינון ערכים ריקים ממערך
     * @param {Array} arr - מערך לסינון
     * @returns {Array}
     */
    filterEmpty(arr) {
        if (this.isEmpty(arr)) return [];
        return arr.filter(item => 
            item !== null && 
            item !== undefined && 
            (typeof item !== 'string' || item.trim() !== '')
        );
    },

    /**
     * יצירת מערך ייחודי
     * @param {Array} arr - מערך
     * @returns {Array}
     */
    unique(arr) {
        if (this.isEmpty(arr)) return [];
        return [...new Set(arr)];
    },

    /**
     * חיפוש פריט במערך לפי מאפיין
     * @param {Array} arr - מערך
     * @param {string} property - שם המאפיין
     * @param {any} value - ערך לחיפוש
     * @returns {Object|null}
     */
    findByProperty(arr, property, value) {
        if (this.isEmpty(arr)) return null;
        return arr.find(item => item && item[property] === value) || null;
    },

    /**
     * מיון מערך לפי מאפיין
     * @param {Array} arr - מערך
     * @param {string} property - שם המאפיין
     * @param {boolean} ascending - סדר עולה/יורד
     * @returns {Array}
     */
    sortByProperty(arr, property, ascending = true) {
        if (this.isEmpty(arr)) return [];
        
        return [...arr].sort((a, b) => {
            const valueA = a[property];
            const valueB = b[property];
            
            if (valueA < valueB) return ascending ? -1 : 1;
            if (valueA > valueB) return ascending ? 1 : -1;
            return 0;
        });
    },

    /**
     * קבוצה לפי מאפיין
     * @param {Array} arr - מערך
     * @param {string} property - שם המאפיין
     * @returns {Object}
     */
    groupByProperty(arr, property) {
        if (this.isEmpty(arr)) return {};
        
        return arr.reduce((groups, item) => {
            const key = item[property];
            if (!groups[key]) {
                groups[key] = [];
            }
            groups[key].push(item);
            return groups;
        }, {});
    }
};

// 📁 פונקציות עבודה עם קבצים
const FileUtils = {
    /**
     * בדיקת סוג קובץ
     * @param {string} fileName - שם הקובץ
     * @param {Array} allowedTypes - סוגי קבצים מותרים
     * @returns {boolean}
     */
    isValidFileType(fileName, allowedTypes = FILE_CONFIG.supportedTypes.all) {
        if (StringUtils.isEmpty(fileName)) return false;
        
        const extension = fileName.toLowerCase().substring(fileName.lastIndexOf('.'));
        return allowedTypes.includes(extension);
    },

    /**
     * בדיקת גודל קובץ
     * @param {File} file - קובץ
     * @returns {boolean}
     */
    isValidFileSize(file) {
        if (!file || !file.size) return false;
        return file.size <= FILE_CONFIG.maxFileSize;
    },

    /**
     * קבלת סוג קובץ
     * @param {string} fileName - שם הקובץ
     * @returns {string}
     */
    getFileType(fileName) {
        if (StringUtils.isEmpty(fileName)) return 'unknown';
        
        const extension = fileName.toLowerCase().substring(fileName.lastIndexOf('.'));
        
        if (FILE_CONFIG.supportedTypes.excel.includes(extension)) {
            return 'excel';
        }
        if (FILE_CONFIG.supportedTypes.csv.includes(extension)) {
            return 'csv';
        }
        return 'unknown';
    },

    /**
     * עיצוב גודל קובץ
     * @param {number} bytes - גודל בבתים
     * @returns {string}
     */
    formatFileSize(bytes) {
        if (!NumberUtils.isValidNumber(bytes) || bytes === 0) return '0 B';
        
        const sizes = ['B', 'KB', 'MB', 'GB'];
        const i = Math.floor(Math.log(bytes) / Math.log(1024));
        
        return `${NumberUtils.formatNumber(bytes / Math.pow(1024, i), 1)} ${sizes[i]}`;
    }
};

// 🎨 פונקציות עבודה עם DOM
const DOMUtils = {
    /**
     * קבלת אלמנט לפי ID
     * @param {string} id - מזהה האלמנט
     * @returns {HTMLElement|null}
     */
    getElementById(id) {
        return document.getElementById(id);
    },

    /**
     * הצגת/הסתרת אלמנט
     * @param {string|HTMLElement} element - אלמנט או ID
     * @param {boolean} show - להציג או להסתיר
     */
    toggleElement(element, show) {
        const el = typeof element === 'string' ? this.getElementById(element) : element;
        if (el) {
            el.style.display = show ? 'block' : 'none';
        }
    },

    /**
     * עדכון תוכן אלמנט
     * @param {string|HTMLElement} element - אלמנט או ID
     * @param {string} content - תוכן חדש
     */
    updateContent(element, content) {
        const el = typeof element === 'string' ? this.getElementById(element) : element;
        if (el) {
            el.innerHTML = content;
        }
    },

    /**
     * הוספת class לאלמנט
     * @param {string|HTMLElement} element - אלמנט או ID
     * @param {string} className - שם ה-class
     */
    addClass(element, className) {
        const el = typeof element === 'string' ? this.getElementById(element) : element;
        if (el) {
            el.classList.add(className);
        }
    },

    /**
     * הסרת class מאלמנט
     * @param {string|HTMLElement} element - אלמנט או ID
     * @param {string} className - שם ה-class
     */
    removeClass(element, className) {
        const el = typeof element === 'string' ? this.getElementById(element) : element;
        if (el) {
            el.classList.remove(className);
        }
    },

    /**
     * יצירת אלמנט HTML
     * @param {string} tag - תג HTML
     * @param {Object} attributes - מאפיינים
     * @param {string} content - תוכן
     * @returns {HTMLElement}
     */
    createElement(tag, attributes = {}, content = '') {
        const element = document.createElement(tag);
        
        Object.entries(attributes).forEach(([key, value]) => {
            element.setAttribute(key, value);
        });
        
        if (content) {
            element.innerHTML = content;
        }
        
        return element;
    }
};

// 🔧 פונקציות עזר כלליות
const GeneralUtils = {
    /**
     * השהיה (delay)
     * @param {number} ms - מילישניות
     * @returns {Promise}
     */
    delay(ms) {
        return new Promise(resolve => setTimeout(resolve, ms));
    },

    /**
     * יצירת ID ייחודי
     * @returns {string}
     */
    generateUniqueId() {
        return Date.now().toString(36) + Math.random().toString(36).substr(2);
    },

    /**
     * העתקה עמוקה של אובייקט
     * @param {any} obj - אובייקט להעתקה
     * @returns {any}
     */
    deepClone(obj) {
        if (obj === null || typeof obj !== 'object') return obj;
        if (obj instanceof Date) return new Date(obj.getTime());
        if (obj instanceof Array) return obj.map(item => this.deepClone(item));
        if (typeof obj === 'object') {
            const cloned = {};
            Object.keys(obj).forEach(key => {
                cloned[key] = this.deepClone(obj[key]);
            });
            return cloned;
        }
        return obj;
    },

    /**
     * בדיקה אם אובייקט ריק
     * @param {Object} obj - אובייקט לבדיקה
     * @returns {boolean}
     */
    isEmptyObject(obj) {
        return obj && typeof obj === 'object' && Object.keys(obj).length === 0;
    },

    /**
     * מיזוג אובייקטים
     * @param {Object} target - אובייקט יעד
     * @param {...Object} sources - אובייקטים למיזוג
     * @returns {Object}
     */
    mergeObjects(target, ...sources) {
        if (!target) target = {};
        
        sources.forEach(source => {
            if (source && typeof source === 'object') {
                Object.assign(target, source);
            }
        });
        
        return target;
    }
};

// 🚨 פונקציות logging ו-debug
const LogUtils = {
    /**
     * לוג מידע
     * @param {string} message - הודעה
     * @param {...any} data - נתונים נוספים
     */
    info(message, ...data) {
        console.log(`ℹ️ ${message}`, ...data);
    },

    /**
     * לוג שגיאה
     * @param {string} message - הודעה
     * @param {...any} data - נתונים נוספים
     */
    error(message, ...data) {
        console.error(`❌ ${message}`, ...data);
    },

    /**
     * לוג אזהרה
     * @param {string} message - הודעה
     * @param {...any} data - נתונים נוספים
     */
    warn(message, ...data) {
        console.warn(`⚠️ ${message}`, ...data);
    },

    /**
     * לוג הצלחה
     * @param {string} message - הודעה
     * @param {...any} data - נתונים נוספים
     */
    success(message, ...data) {
        console.log(`✅ ${message}`, ...data);
    }
};

// 📤 ייצוא לגלובל
window.DateUtils = DateUtils;
window.NumberUtils = NumberUtils;
window.StringUtils = StringUtils;
window.ArrayUtils = ArrayUtils;
window.FileUtils = FileUtils;
window.DOMUtils = DOMUtils;
window.GeneralUtils = GeneralUtils;
window.LogUtils = LogUtils;

console.log('🛠️ קובץ פונקציות עזר נטען בהצלחה');
