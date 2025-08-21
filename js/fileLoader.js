/**
 * מערכת טעינת וקריאת קבצים
 * כולל תמיכה בקבצי Excel (xlsx/xls) ו-CSV
 */

// 📁 מנהל קריאת קבצים
const FileLoader = {
    // מטמון לקבצים שנטענו
    loadedFiles: new Map(),
    
    // סטטוסים של טעינה
    loadingStatus: {
        transactions: false,
        scores: false,
        returned: false,
        warnings: false
    },

    /**
     * טעינת כל הקבצים מהממשק
     */
    async loadAllDataFiles() {
        LogUtils.info('מתחיל טעינת קבצים...');

        const fileInputs = {
            main: DOMUtils.getElementById('mainExcelFile'),
            scores: DOMUtils.getElementById('scoresFile'),
            returned: DOMUtils.getElementById('returnedFile'),
            warnings: DOMUtils.getElementById('warningsFile')
        };

        let loadedCount = 0;
        let totalPayers = 0;
        const loadingResults = [];

        try {
            // טעינת קובץ עסקאות ראשי
            if (fileInputs.main?.files?.length > 0) {
                this.loadingStatus.transactions = true;
                this.updateLoadingUI('transactions', 'טוען קובץ עסקאות...');
                
                LogUtils.info('טוען קובץ עסקאות ראשי...');
                const mainData = await this.readFileData(fileInputs.main.files[0]);
                
                if (mainData) {
                    if (typeof mainData === 'object' && !Array.isArray(mainData)) {
                        // קובץ Excel עם מספר גיליונות
                        Object.assign(window.CreditSystem.excelData, mainData);
                    } else {
                        // קובץ יחיד או CSV
                        window.CreditSystem.excelData.גיליון1 = mainData;
                    }
                    
                    loadedCount++;
                    loadingResults.push('✓ קובץ עסקאות נטען בהצלחה');
                    LogUtils.success('קובץ עסקאות נטען');
                    this.updateLoadingUI('transactions', 'נטען בהצלחה');
                }
                this.loadingStatus.transactions = false;
            }

            // טעינת קובץ דירוגים
            if (fileInputs.scores?.files?.length > 0) {
                this.loadingStatus.scores = true;
                this.updateLoadingUI('scores', 'טוען דירוגים...');
                
                LogUtils.info('טוען קובץ דירוגים...');
                const scoresData = await this.readFileData(fileInputs.scores.files[0]);
                
                if (scoresData) {
                    window.CreditSystem.excelData.scoreM_N = scoresData;
                    loadedCount++;
                    loadingResults.push('✓ קובץ דירוגים נטען בהצלחה');
                    LogUtils.success('קובץ דירוגים נטען');
                    this.updateLoadingUI('scores', 'נטען בהצלחה');
                }
                this.loadingStatus.scores = false;
            }

            // טעינת קובץ שיקים חוזרים
            if (fileInputs.returned?.files?.length > 0) {
                this.loadingStatus.returned = true;
                this.updateLoadingUI('returned', 'טוען שיקים חוזרים...');
                
                LogUtils.info('טוען קובץ שיקים חוזרים...');
                const returnedData = await this.readFileData(fileInputs.returned.files[0]);
                
                if (returnedData) {
                    window.CreditSystem.excelData.שיקים_חוזרים = returnedData;
                    loadedCount++;
                    loadingResults.push('✓ קובץ שיקים חוזרים נטען בהצלחה');
                    LogUtils.success('קובץ שיקים חוזרים נטען');
                    this.updateLoadingUI('returned', 'נטען בהצלחה');
                }
                this.loadingStatus.returned = false;
            }

            // טעינת קובץ אכ"מ/ביטולים
            if (fileInputs.warnings?.files?.length > 0) {
                this.loadingStatus.warnings = true;
                this.updateLoadingUI('warnings', 'טוען ביטולים...');
                
                LogUtils.info('טוען קובץ אכ"מ/ביטולים...');
                const warningsData = await this.readFileData(fileInputs.warnings.files[0]);
                
                if (warningsData) {
                    window.CreditSystem.excelData.אכ_מ_ביטולים = warningsData;
                    loadedCount++;
                    loadingResults.push('✓ קובץ אכ"מ/ביטולים נטען בהצלחה');
                    LogUtils.success('קובץ אכ"מ/ביטולים נטען');
                    this.updateLoadingUI('warnings', 'נטען בהצלחה');
                }
                this.loadingStatus.warnings = false;
            }

            if (loadedCount > 0) {
                LogUtils.info('מעבד נתונים...');
                
                // קריאה לעיבוד נתונים (יוגדר ב-dataProcessor.js)
                if (window.DataProcessor) {
                    await window.DataProcessor.processAllData();
                    totalPayers = window.CreditSystem.payersMap.size;
                }
                
                // עדכון ממשק
                if (window.UIManager) {
                    window.UIManager.updateDataStatus();
                    window.UIManager.setupAutocomplete();
                }
                
                if (totalPayers > 0) {
                    const successMessage = [
                        `🎉 נטענו ${loadedCount} קבצים בהצלחה!`,
                        `🏢 נמצאו ${totalPayers} משכים`,
                        `📊 המערכת מוכנה לחישוב דירוגים`,
                        '',
                        ...loadingResults
                    ].join('\n');
                    
                    alert(successMessage);
                    LogUtils.success('טעינת קבצים הושלמה', { loadedCount, totalPayers });
                } else {
                    const warningMessage = [
                        `⚠️ הקבצים נטענו אך לא נמצאו נתונים תקינים.`,
                        'אנא בדוק:',
                        '• מבנה הקבצים',
                        '• שמות העמודות',
                        '• תוכן הנתונים',
                        '',
                        'בדוק את תצוגת הנתונים המקדימה למטה.'
                    ].join('\n');
                    
                    alert(warningMessage);
                    LogUtils.warn('נטענו קבצים אך ללא נתונים תקינים');
                }
            } else {
                alert('❌ לא נבחרו קבצים לטעינה');
                LogUtils.warn('לא נבחרו קבצים');
            }

        } catch (error) {
            LogUtils.error('שגיאה בטעינת הקבצים', error);
            
            // איפוס סטטוסים
            Object.keys(this.loadingStatus).forEach(key => {
                this.loadingStatus[key] = false;
            });
            
            alert(`שגיאה בטעינת הקבצים: ${error.message}`);
        }
    },

    /**
     * קריאת נתוני קובץ (Excel או CSV)
     * @param {File} file - קובץ לקריאה
     * @returns {Promise} - נתוני הקובץ
     */
    async readFileData(file) {
        if (!file) {
            throw new Error('לא נבחר קובץ');
        }

        // בדיקת תקינות קובץ
        this.validateFile(file);

        return new Promise((resolve, reject) => {
            const reader = new FileReader();
            const fileType = FileUtils.getFileType(file.name);
            
            LogUtils.info(`קורא קובץ ${fileType}`, { 
                name: file.name, 
                size: FileUtils.formatFileSize(file.size) 
            });
            
            reader.onload = (e) => {
                try {
                    let data;
                    
                    if (fileType === 'csv') {
                        data = this.parseCSVFile(e.target.result);
                    } else if (fileType === 'excel') {
                        data = this.parseExcelFile(e.target.result);
                    } else {
                        throw new Error(`סוג קובץ לא נתמך: ${file.name}`);
                    }
                    
                    // שמירה במטמון
                    this.loadedFiles.set(file.name, {
                        data,
                        loadTime: new Date(),
                        fileType,
                        size: file.size
                    });
                    
                    LogUtils.success(`קובץ ${file.name} נקרא בהצלחה`);
                    resolve(data);
                    
                } catch (error) {
                    LogUtils.error(`שגיאה בקריאת קובץ ${file.name}`, error);
                    reject(new Error(`שגיאה בקריאת ${file.name}: ${error.message}`));
                }
            };
            
            reader.onerror = () => {
                const error = new Error(`שגיאה בקריאת הקובץ ${file.name}`);
                LogUtils.error('שגיאת FileReader', error);
                reject(error);
            };
            
            // קריאת הקובץ לפי סוג
            if (fileType === 'csv') {
                reader.readAsText(file, 'UTF-8');
            } else {
                reader.readAsArrayBuffer(file);
            }
        });
    },

    /**
     * עיבוד קובץ CSV
     * @param {string} csvText - תוכן הקובץ
     * @returns {Array} - נתונים מעובדים
     */
    parseCSVFile(csvText) {
        LogUtils.info('מעבד קובץ CSV');
        
        const parsed = Papa.parse(csvText, { 
            header: false,
            skipEmptyLines: true,
            encoding: 'UTF-8',
            delimiter: ',',
            delimitersToGuess: [',', '\t', '|', ';']
        });
        
        if (parsed.errors.length > 0) {
            LogUtils.warn('שגיאות בעיבוד CSV', parsed.errors);
        }
        
        const data = parsed.data.filter(row => 
            row && row.length > 0 && row.some(cell => 
                cell && cell.toString().trim() !== ''
            )
        );
        
        LogUtils.info(`CSV עובד - ${data.length} שורות`);
        return data;
    },

    /**
     * עיבוד קובץ Excel
     * @param {ArrayBuffer} arrayBuffer - תוכן הקובץ
     * @returns {Object|Array} - נתונים מעובדים
     */
    parseExcelFile(arrayBuffer) {
        LogUtils.info('מעבד קובץ Excel');
        
        const workbook = XLSX.read(arrayBuffer, { 
            type: 'array',
            cellStyles: true,
            cellFormulas: false,
            cellDates: true
        });
        
        LogUtils.info(`נמצאו ${workbook.SheetNames.length} גיליונות`, workbook.SheetNames);
        
        // אם יש גיליון יחיד, החזר אותו כמערך
        if (workbook.SheetNames.length === 1) {
            const worksheet = workbook.Sheets[workbook.SheetNames[0]];
            const data = this.convertWorksheetToArray(worksheet);
            LogUtils.info(`גיליון יחיד עובד - ${data.length} שורות`);
            return data;
        } else {
            // אם יש מספר גיליונות, החזר אובייקט
            const data = {};
            workbook.SheetNames.forEach(sheetName => {
                const worksheet = workbook.Sheets[sheetName];
                data[sheetName] = this.convertWorksheetToArray(worksheet);
                LogUtils.info(`גיליון "${sheetName}" עובד - ${data[sheetName].length} שורות`);
            });
            return data;
        }
    },

    /**
     * המרת גיליון Excel למערך
     * @param {Object} worksheet - גיליון עבודה
     * @returns {Array} - מערך נתונים
     */
    convertWorksheetToArray(worksheet) {
        const data = XLSX.utils.sheet_to_json(worksheet, { 
            header: 1,
            defval: '',
            blankrows: false
        });
        
        // סינון שורות ריקות
        return data.filter(row => 
            row && row.length > 0 && row.some(cell => 
                cell !== null && cell !== undefined && cell.toString().trim() !== ''
            )
        );
    },

    /**
     * בדיקת תקינות קובץ
     * @param {File} file - קובץ לבדיקה
     */
    validateFile(file) {
        // בדיקת גודל
        if (!FileUtils.isValidFileSize(file)) {
            throw new Error(`הקובץ גדול מדי. גודל מקסימלי: ${FileUtils.formatFileSize(FILE_CONFIG.maxFileSize)}`);
        }
        
        // בדיקת סוג
        if (!FileUtils.isValidFileType(file.name)) {
            throw new Error(`סוג קובץ לא נתמך: ${file.name}. סוגים נתמכים: ${FILE_CONFIG.supportedTypes.all.join(', ')}`);
        }
        
        LogUtils.info('קובץ עבר בדיקת תקינות', { 
            name: file.name, 
            type: FileUtils.getFileType(file.name),
            size: FileUtils.formatFileSize(file.size)
        });
    },

    /**
     * עדכון ממשק בזמן טעינה
     * @param {string} type - סוג הקובץ
     * @param {string} message - הודעה
     */
    updateLoadingUI(type, message) {
        const statusMap = {
            transactions: 'transactionsStatus',
            scores: 'warningsStatus',
            returned: 'returnedStatus',
            warnings: 'warningsStatus'
        };
        
        const elementId = statusMap[type];
        if (elementId) {
            const element = DOMUtils.getElementById(elementId);
            if (element) {
                if (message.includes('טוען')) {
                    element.innerHTML = `<span style="color: #f39c12;">⏳ ${message}</span>`;
                } else if (message.includes('הצלחה')) {
                    element.innerHTML = `<span class="status-loaded">✓ ${message}</span>`;
                } else {
                    element.innerHTML = `<span class="status-error">❌ ${message}</span>`;
                }
            }
        }
    },

    /**
     * טעינת נתוני דוגמה למטרות בדיקה
     */
    loadSampleDataForDemo() {
        LogUtils.info('טוען נתוני דוגמה...');
        
        // נתוני דוגמה מבוססים על המבנה האמיתי
        const sampleData = {
            גיליון1: [
                ['סוג עיסקה', 'שם לקוח', 'מ.זהות', 'תחום עיסוק לקוח', 'מספר שיק', 'מזהה שיק', 'ב-ס-ח', 'שם מושך', 'מספר זהות מושך', 'טלפון 1 מושך', 'טלפון 2 מושך', 'כתובת מושך', 'ת.פירעון', 'ת.פרעון בפועל', 'שם מוטב', 'סטטוס', 'עמלה', 'סכום', 'יתרה', 'יעד', 'איש מכירות', 'קטגוריה', 'תחום עיסוק מושך', 'מומלץ לגבייה', 'אחוז עמלה', 'תאריך הפקדה/מסירה'],
                ['חיתום', 'ב מ פרינס אחזקה ותשתיות בע"מ', '3333333', 'בנייה', '5021542', '4856', '10-983-15150042', 'עפיף ביאדסה ובניו - חברה לבנין, פיתוח והשקעות בע"מ', '512242595', '046384482', '', 'באקה אלגרביה', '25/12/2017', '25/12/2017', 'ע מוראד לעבודות קרצוף', 'נפרע', '2200', '72300', '0', 'פנינסולה אשראי מסחרי בע"מ', 'בנייה', '1.75', '', '', '', '17/10/2017'],
                ['חיתום', 'חברת בנייה חדשה בע"מ', '4444444', 'בנייה', '5021543', '4857', '11-555-123456', 'קבלנות דן בע"מ', '305346900', '052-9876543', '', 'ירושלים', '15/11/2017', '', 'ספק חומרים', 'ביטול', '1500', '50000', '50000', 'פנינסולה אשראי מסחרי בע"מ', 'בנייה', '3.0', '', '', '', '20/10/2017'],
                ['חיתום', 'מפעלי מתכת ישראל בע"מ', '5555555', 'תעשייה', '5021544', '4858', '10-777-654321', 'שרה לוי יזמות בע"מ', '123456788', '050-1122334', '', 'פתח תקווה', '10/01/2018', '10/01/2018', 'ספק מתכת', 'נפרע', '1800', '60000', '0', 'פנינסולה אשראי מסחרי בע"מ', 'תעשייה', '3.0', '', '', '', '15/12/2017'],
                ['חיתום', 'טכנולוגיות עתיד בע"מ', '6666666', 'הייטק', '5021545', '4859', '12-888-987654', 'חברת יועצים פיננסיים בע"מ', '987654321', '03-1234567', '', 'תל אביב', '20/02/2018', '20/02/2018', 'יועץ עסקי', 'נפרע', '3500', '120000', '0', 'פנינסולה אשראי מסחרי בע"מ', 'הייטק', '2.9', '', '', '', '05/02/2018']
            ],
            scoreM_N: [
                ['ח.פ', 'שם חברה', 'דירוג', 'קטגוריה', 'הערות'],
                ['512242595', 'עפיף ביאדסה ובניו', '75', 'A', 'לקוח מצוין'],
                ['305346900', 'קבלנות דן בע"מ', '45', 'C', 'זהירות - יש חזרות'],
                ['123456788', 'שרה לוי יזמות בע"מ', '68', 'B', 'לקוח טוב'],
                ['987654321', 'חברת יועצים פיננסיים בע"מ', '82', 'A', 'לקוח מעולה']
            ],
            שיקים_חוזרים: [
                ['מספר מזהה מושך', 'שם לקוח', 'סכום', 'סיבת החזרה', 'תאריך חזרה'],
                ['305346900', 'חברת בנייה חדשה בע"מ', '25000', 'אין כיסוי', '16/11/2017'],
                ['111222333', 'חברת דוגמה נוספת', '15000', 'חשבון סגור', '01/12/2017']
            ]
        };
        
        // הכנסת הנתונים למערכת
        window.CreditSystem.excelData = sampleData;
        
        try {
            // עיבוד הנתונים
            if (window.DataProcessor) {
                window.DataProcessor.processAllData();
            }
            
            // עדכון ממשק
            if (window.UIManager) {
                window.UIManager.updateDataStatus();
                window.UIManager.setupAutocomplete();
            }
            
            const payersCount = window.CreditSystem.payersMap.size;
            alert(`📋 נתוני דוגמה נטענו בהצלחה!\n🏢 ${payersCount} משכים זמינים\n✨ כעת תוכל לבחור מושך ולחשב דירוג`);
            
            LogUtils.success('נתוני דוגמה נטענו', { payersCount });
            
        } catch (error) {
            LogUtils.error('שגיאה בטעינת נתוני דוגמה', error);
            alert('שגיאה בטעינת נתוני דוגמה: ' + error.message);
        }
    },

    /**
     * ניקוי מטמון קבצים
     */
    clearCache() {
        this.loadedFiles.clear();
        LogUtils.info('מטמון קבצים נוקה');
    },

    /**
     * קבלת פרטי קובץ מהמטמון
     * @param {string} fileName - שם הקובץ
     * @returns {Object|null} - פרטי הקובץ
     */
    getFileInfo(fileName) {
        return this.loadedFiles.get(fileName) || null;
    }
};

// 📤 ייצוא לגלובל
window.FileLoader = FileLoader;
window.loadAllDataFiles = FileLoader.loadAllDataFiles.bind(FileLoader);
window.loadSampleDataForDemo = FileLoader.loadSampleDataForDemo.bind(FileLoader);

console.log('📁 מערכת טעינת קבצים נטענה בהצלחה');
