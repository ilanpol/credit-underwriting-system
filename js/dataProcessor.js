/**
 * מערכת עיבוד נתונים וחישוב פרמטרים
 * כולל עיבוד עסקאות, דירוגים חיצוניים ושיקים חוזרים
 */

// 🔄 מעבד נתונים ראשי
const DataProcessor = {
    // סטטיסטיקות עיבוד
    processingStats: {
        totalTransactions: 0,
        uniquePayers: 0,
        externalScores: 0,
        returnedChecks: 0,
        processingTime: 0
    },

    /**
     * עיבוד כל הנתונים
     */
    async processAllData() {
        const startTime = performance.now();
        LogUtils.info('מתחיל עיבוד כל הנתונים...');

        try {
            // איפוס נתונים קודמים
            window.CreditSystem.payersMap.clear();
            this.resetProcessingStats();

            // עיבוד בשלבים
            await this.processTransactionsData();
            await this.processCreditScoresData();
            await this.processReturnedChecksData();
            await this.processWarningsData();

            // חישוב סטטיסטיקות סופיות
            const endTime = performance.now();
            this.processingStats.processingTime = Math.round(endTime - startTime);
            this.processingStats.uniquePayers = window.CreditSystem.payersMap.size;

            LogUtils.success('עיבוד נתונים הושלם', this.processingStats);

        } catch (error) {
            LogUtils.error('שגיאה בעיבוד נתונים', error);
            throw error;
        }
    },

    /**
     * עיבוד נתוני עסקאות מהגיליון הראשי
     */
    async processTransactionsData() {
        LogUtils.info('מעבד נתוני עסקאות...');

        let mainSheet = null;
        let sheetName = '';

        // חיפוש הגיליון הראשי
        const possibleNames = FILE_CONFIG.sheetNames.transactions;
        for (let name of possibleNames) {
            if (window.CreditSystem.excelData[name] && window.CreditSystem.excelData[name].length > 1) {
                mainSheet = window.CreditSystem.excelData[name];
                sheetName = name;
                break;
            }
        }

        // אם לא נמצא, חפש גיליון עם נתוני עסקאות
        if (!mainSheet) {
            for (let name in window.CreditSystem.excelData) {
                const sheet = window.CreditSystem.excelData[name];
                if (Array.isArray(sheet) && sheet.length > 1 && !name.toLowerCase().includes('score')) {
                    mainSheet = sheet;
                    sheetName = name;
                    LogUtils.info(`נמצא גיליון עם נתוני עסקאות: ${name}`);
                    break;
                }
            }
        }

        if (!mainSheet) {
            throw new Error('לא נמצא גיליון עם נתוני עסקאות');
        }

        // חיפוש שורת כותרות
        const { headersRowIndex, headers } = this.findHeadersRow(mainSheet);
        const rows = mainSheet.slice(headersRowIndex + 1);

        LogUtils.info(`נמצאה שורת כותרות בשורה ${headersRowIndex + 1} בגיליון ${sheetName}`);
        LogUtils.info('כותרות הגיליון', headers);

        // מיפוי עמודות
        const columnIndexes = this.mapTransactionColumns(headers);
        this.validateRequiredColumns(columnIndexes);

        let processedRows = 0;

        // עיבוד שורות
        rows.forEach((row, index) => {
            if (this.isValidRow(row)) {
                const transaction = this.parseTransactionRow(row, columnIndexes);
                
                if (this.isValidTransaction(transaction)) {
                    this.addTransactionToPayer(transaction);
                    processedRows++;
                    this.processingStats.totalTransactions++;
                }
            }
        });

        LogUtils.success(`עובדו ${processedRows} עסקאות מתוך ${rows.length} שורות`);
    },

    /**
     * חיפוש שורת כותרות בגיליון
     * @param {Array} sheet - גיליון נתונים
     * @returns {Object} - אינדקס וכותרות
     */
    findHeadersRow(sheet) {
        for (let i = 0; i < Math.min(5, sheet.length); i++) {
            const row = sheet[i];
            if (this.isHeadersRow(row)) {
                return {
                    headersRowIndex: i,
                    headers: row
                };
            }
        }
        
        // ברירת מחדל - שורה ראשונה
        return {
            headersRowIndex: 0,
            headers: sheet[0] || []
        };
    },

    /**
     * בדיקה אם שורה היא שורת כותרות
     * @param {Array} row - שורה לבדיקה
     * @returns {boolean}
     */
    isHeadersRow(row) {
        if (!row || !Array.isArray(row)) return false;
        
        const requiredHeaders = ['שם מושך', 'מספר זהות מושך', 'סכום'];
        return requiredHeaders.some(header => 
            row.some(cell => 
                cell && cell.toString().includes(header)
            )
        );
    },

    /**
     * מיפוי עמודות עסקאות
     * @param {Array} headers - כותרות
     * @returns {Object} - אינדקסי עמודות
     */
    mapTransactionColumns(headers) {
        const mapping = DATA_PROCESSING_CONFIG.requiredColumns;
        const optionalMapping = DATA_PROCESSING_CONFIG.optionalColumns;
        const allMapping = { ...mapping, ...optionalMapping };
        
        const columnIndexes = {};
        
        Object.keys(allMapping).forEach(key => {
            const columnName = allMapping[key];
            const index = headers.findIndex(header => 
                header && header.toString().trim() === columnName
            );
            columnIndexes[key] = index;
        });
        
        LogUtils.info('מיפוי עמודות', columnIndexes);
        return columnIndexes;
    },

    /**
     * בדיקת עמודות נדרשות
     * @param {Object} columnIndexes - אינדקסי עמודות
     */
    validateRequiredColumns(columnIndexes) {
        const required = ['payerName', 'payerID', 'amount'];
        const missing = required.filter(col => columnIndexes[col] === -1);
        
        if (missing.length > 0) {
            throw new Error(`חסרות עמודות נדרשות: ${missing.join(', ')}`);
        }
    },

    /**
     * בדיקת תקינות שורה
     * @param {Array} row - שורה לבדיקה
     * @returns {boolean}
     */
    isValidRow(row) {
        return row && Array.isArray(row) && row.length > 0;
    },

    /**
     * פרסור שורת עסקה
     * @param {Array} row - שורה
     * @param {Object} columnIndexes - אינדקסי עמודות
     * @returns {Object} - עסקה מפורסרת
     */
    parseTransactionRow(row, columnIndexes) {
        const transaction = {
            payerName: this.getCleanCellValue(row, columnIndexes.payerName),
            payerID: this.getCleanCellValue(row, columnIndexes.payerID),
            amount: NumberUtils.safeParseFloat(row[columnIndexes.amount]),
            commission: NumberUtils.safeParseFloat(row[columnIndexes.commission]),
            status: this.getCleanCellValue(row, columnIndexes.status),
            depositDate: this.getCleanCellValue(row, columnIndexes.depositDate),
            dueDate: this.getCleanCellValue(row, columnIndexes.dueDate),
            actualPayment: this.getCleanCellValue(row, columnIndexes.actualPayment)
        };

        // חישוב ימי אשראי/ניכיון מתאריכים
        transaction.creditDays = this.calculateCreditDays(
            transaction.depositDate, 
            transaction.dueDate
        );
        transaction.discountDays = this.calculateDiscountDays(transaction.dueDate);

        return transaction;
    },

    /**
     * קבלת ערך נקי מתא
     * @param {Array} row - שורה
     * @param {number} index - אינדקס עמודה
     * @returns {string} - ערך נקי
     */
    getCleanCellValue(row, index) {
        if (index === -1 || !row[index]) return '';
        return StringUtils.cleanString(row[index]);
    },

    /**
     * חישוב ימי אשראי מתאריכים
     * @param {string} depositDate - תאריך הפקדה
     * @param {string} dueDate - תאריך פירעון
     * @returns {number} - ימי אשראי
     */
    calculateCreditDays(depositDate, dueDate) {
        if (StringUtils.isEmpty(depositDate) || StringUtils.isEmpty(dueDate)) {
            return DATA_PROCESSING_CONFIG.defaults.creditDays;
        }

        const startDate = DateUtils.parseDate(depositDate);
        const endDate = DateUtils.parseDate(dueDate);

        if (!startDate || !endDate) {
            return DATA_PROCESSING_CONFIG.defaults.creditDays;
        }

        const days = DateUtils.daysDifference(startDate, endDate);
        return days > 0 ? days : DATA_PROCESSING_CONFIG.defaults.creditDays;
    },

    /**
     * חישוב ימי ניכיון
     * @param {string} dueDate - תאריך פירעון
     * @returns {number} - ימי ניכיון
     */
    calculateDiscountDays(dueDate) {
        if (StringUtils.isEmpty(dueDate)) return 0;
        return DateUtils.calculateDiscountDays(dueDate);
    },

    /**
     * בדיקת תקינות עסקה
     * @param {Object} transaction - עסקה
     * @returns {boolean}
     */
    isValidTransaction(transaction) {
        return !StringUtils.isEmpty(transaction.payerID) && 
               !StringUtils.isEmpty(transaction.payerName) && 
               transaction.amount > 0;
    },

    /**
     * הוספת עסקה למושך
     * @param {Object} transaction - עסקה
     */
    addTransactionToPayer(transaction) {
        const payerID = transaction.payerID;
        
        if (!window.CreditSystem.payersMap.has(payerID)) {
            window.CreditSystem.payersMap.set(payerID, {
                name: transaction.payerName,
                id: payerID,
                transactions: [],
                totalAmount: 0,
                totalCommission: 0,
                totalCreditDays: 0,
                totalDiscountDays: 0,
                firstTransaction: null,
                lastTransaction: null,
                cancelledTransactions: 0,
                creditScore: null
            });
        }

        const payer = window.CreditSystem.payersMap.get(payerID);
        
        payer.transactions.push({
            amount: transaction.amount,
            creditDays: transaction.creditDays,
            discountDays: transaction.discountDays,
            commission: transaction.commission,
            depositDate: transaction.depositDate,
            dueDate: transaction.dueDate,
            actualPayment: transaction.actualPayment,
            status: transaction.status
        });

        // עדכון סיכומים
        payer.totalAmount += transaction.amount;
        payer.totalCommission += transaction.commission;
        payer.totalCreditDays += transaction.creditDays;
        payer.totalDiscountDays += transaction.discountDays;

        // ספירת ביטולים
        if (ConfigHelpers.isProblematicStatus(transaction.status)) {
            payer.cancelledTransactions++;
        }

        // עדכון תאריכים
        this.updatePayerDates(payer, transaction.depositDate);
    },

    /**
     * עדכון תאריכי עסקאות מושך
     * @param {Object} payer - מושך
     * @param {string} transactionDate - תאריך עסקה
     */
    updatePayerDates(payer, transactionDate) {
        if (StringUtils.isEmpty(transactionDate)) return;

        if (!payer.firstTransaction || transactionDate < payer.firstTransaction) {
            payer.firstTransaction = transactionDate;
        }
        if (!payer.lastTransaction || transactionDate > payer.lastTransaction) {
            payer.lastTransaction = transactionDate;
        }
    },

    /**
     * עיבוד דירוגי אשראי חיצוניים
     */
    async processCreditScoresData() {
        LogUtils.info('מעבד דירוגי אשראי חיצוניים...');

        let scoresSheet = null;
        let scoresSheetName = '';

        // חיפוש גיליון דירוגים
        const possibleNames = FILE_CONFIG.sheetNames.scores;
        for (let name of possibleNames) {
            if (window.CreditSystem.excelData[name] && window.CreditSystem.excelData[name].length > 1) {
                scoresSheet = window.CreditSystem.excelData[name];
                scoresSheetName = name;
                break;
            }
        }

        // חיפוש בשמות שמכילים score
        if (!scoresSheet) {
            for (let sheetName in window.CreditSystem.excelData) {
                if (sheetName.toLowerCase().includes('score') && 
                    Array.isArray(window.CreditSystem.excelData[sheetName]) && 
                    window.CreditSystem.excelData[sheetName].length > 1) {
                    scoresSheet = window.CreditSystem.excelData[sheetName];
                    scoresSheetName = sheetName;
                    LogUtils.info(`נמצא גיליון דירוגים: ${sheetName}`);
                    break;
                }
            }
        }

        if (!scoresSheet) {
            LogUtils.warn('לא נמצא גיליון דירוגי אשראי (scoreM_N)');
            return;
        }

        LogUtils.info(`עיבוד גיליון דירוגים: ${scoresSheetName}`);

        // חיפוש שורת כותרות
        const { headersRowIndex, headers } = this.findScoresHeadersRow(scoresSheet);
        const rows = scoresSheet.slice(headersRowIndex + 1);

        LogUtils.info('כותרות גיליון דירוגים', headers);

        // מיפוי עמודות דירוגים
        const scoresColumnIndexes = this.mapScoresColumns(headers);

        if (scoresColumnIndexes.payerID === -1) {
            LogUtils.warn('לא נמצאה עמודת מספר זהות בגיליון דירוגים');
            return;
        }

        let scoresProcessed = 0;

        rows.forEach((row, index) => {
            if (this.isValidRow(row)) {
                const scoreData = this.parseScoreRow(row, scoresColumnIndexes);
                
                if (scoreData.payerID && window.CreditSystem.payersMap.has(scoreData.payerID)) {
                    const payer = window.CreditSystem.payersMap.get(scoreData.payerID);
                    payer.creditScore = {
                        score: scoreData.score,
                        category: scoreData.category,
                        riskLevel: scoreData.riskLevel
                    };
                    scoresProcessed++;
                    this.processingStats.externalScores++;
                    LogUtils.info(`עודכן דירוג עבור ${scoreData.payerID}: ${scoreData.score}`);
                }
            }
        });

        LogUtils.success(`עובדו ${scoresProcessed} דירוגי אשראי`);
    },

    /**
     * חיפוש שורת כותרות בגיליון דירוגים
     * @param {Array} sheet - גיליון דירוגים
     * @returns {Object} - אינדקס וכותרות
     */
    findScoresHeadersRow(sheet) {
        for (let i = 0; i < Math.min(3, sheet.length); i++) {
            const row = sheet[i];
            if (this.isScoresHeadersRow(row)) {
                return {
                    headersRowIndex: i,
                    headers: row
                };
            }
        }
        
        return {
            headersRowIndex: 0,
            headers: sheet[0] || []
        };
    },

    /**
     * בדיקה אם שורה היא כותרות דירוגים
     * @param {Array} row - שורה
     * @returns {boolean}
     */
    isScoresHeadersRow(row) {
        if (!row || !Array.isArray(row)) return false;
        
        const scoreHeaders = ['ח.פ', 'זהות', 'דירוג', 'ציון'];
        return scoreHeaders.some(header => 
            row.some(cell => 
                cell && cell.toString().includes(header)
            )
        );
    },

    /**
     * מיפוי עמודות דירוגים
     * @param {Array} headers - כותרות
     * @returns {Object} - אינדקסי עמודות
     */
    mapScoresColumns(headers) {
        const mapping = {
            payerID: ['ח.פ', 'מספר זהות', 'זהות', 'id'],
            score: ['דירוג', 'ציון', 'score', 'rating'],
            category: ['קטגוריה', 'סיווג', 'category'],
            riskLevel: ['רמת סיכון', 'סיכון', 'risk']
        };

        const columnIndexes = {};
        
        Object.keys(mapping).forEach(key => {
            const possibleNames = mapping[key];
            let index = -1;
            
            for (let name of possibleNames) {
                index = headers.findIndex(header => 
                    header && header.toString().toLowerCase().includes(name.toLowerCase())
                );
                if (index !== -1) break;
            }
            
            columnIndexes[key] = index;
        });
        
        LogUtils.info('מיפוי עמודות דירוגים', columnIndexes);
        return columnIndexes;
    },

    /**
     * פרסור שורת דירוג
     * @param {Array} row - שורה
     * @param {Object} columnIndexes - אינדקסי עמודות
     * @returns {Object} - נתוני דירוג
     */
    parseScoreRow(row, columnIndexes) {
        return {
            payerID: this.getCleanCellValue(row, columnIndexes.payerID),
            score: NumberUtils.safeParseFloat(row[columnIndexes.score], DATA_PROCESSING_CONFIG.defaults.externalScore),
            category: this.getCleanCellValue(row, columnIndexes.category),
            riskLevel: this.getCleanCellValue(row, columnIndexes.riskLevel)
        };
    },

    /**
     * עיבוד נתוני שיקים חוזרים
     */
    async processReturnedChecksData() {
        LogUtils.info('מעבד נתוני שיקים חוזרים...');

        let returnedSheet = null;
        const possibleNames = FILE_CONFIG.sheetNames.returned;
        
        for (let name of possibleNames) {
            if (window.CreditSystem.excelData[name] && window.CreditSystem.excelData[name].length > 1) {
                returnedSheet = window.CreditSystem.excelData[name];
                LogUtils.info(`נמצא גיליון שיקים חוזרים: ${name}`);
                break;
            }
        }

        if (!returnedSheet) {
            // חיפוש בשמות שמכילים "חוזר"
            for (let sheetName in window.CreditSystem.excelData) {
                if (sheetName.toLowerCase().includes('חוזר') || 
                    sheetName.toLowerCase().includes('returned')) {
                    returnedSheet = window.CreditSystem.excelData[sheetName];
                    LogUtils.info(`נמצא גיליון שיקים חוזרים: ${sheetName}`);
                    break;
                }
            }
        }

        if (!returnedSheet) {
            LogUtils.warn('לא נמצא גיליון שיקים חוזרים');
            return;
        }

        // עיבוד נתוני שיקים חוזרים ועדכון המושכים
        const headers = returnedSheet[0];
        const rows = returnedSheet.slice(1);
        
        const payerIDIndex = this.findColumnIndex(headers, ['מספר מזהה מושך', 'מספר זהות', 'ח.פ']);
        
        if (payerIDIndex === -1) {
            LogUtils.warn('לא נמצאה עמודת זהות בשיקים חוזרים');
            return;
        }

        let returnedProcessed = 0;
        
        rows.forEach(row => {
            if (this.isValidRow(row)) {
                const payerID = this.getCleanCellValue(row, payerIDIndex);
                if (payerID && window.CreditSystem.payersMap.has(payerID)) {
                    // הוספת מידע על שיק חוזר למושך
                    const payer = window.CreditSystem.payersMap.get(payerID);
                    if (!payer.returnedChecks) {
                        payer.returnedChecks = [];
                    }
                    payer.returnedChecks.push({
                        amount: NumberUtils.safeParseFloat(row[2]),
                        reason: this.getCleanCellValue(row, 3),
                        date: this.getCleanCellValue(row, 4)
                    });
                    returnedProcessed++;
                    this.processingStats.returnedChecks++;
                }
            }
        });

        LogUtils.success(`עובדו ${returnedProcessed} שיקים חוזרים`);
    },

    /**
     * עיבוד נתוני אכ"מ וביטולים
     */
    async processWarningsData() {
        LogUtils.info('מעבד נתוני אכ"מ וביטולים...');

        let warningsSheet = null;
        const possibleNames = FILE_CONFIG.sheetNames.warnings;
        
        for (let name of possibleNames) {
            if (window.CreditSystem.excelData[name] && window.CreditSystem.excelData[name].length > 1) {
                warningsSheet = window.CreditSystem.excelData[name];
                LogUtils.info(`נמצא גיליון אכ"מ: ${name}`);
                break;
            }
        }

        if (!warningsSheet) {
            LogUtils.info('לא נמצא גיליון אכ"מ/ביטולים נפרד - נסתמך על נתוני הסטטוס בגיליון הראשי');
            return;
        }

        // עיבוד נוסף לפי הצורך
        LogUtils.info('עיבוד נתוני אכ"מ הושלם');
    },

    /**
     * חיפוש אינדקס עמודה
     * @param {Array} headers - כותרות
     * @param {Array} possibleNames - שמות אפשריים
     * @returns {number} - אינדקס העמודה
     */
    findColumnIndex(headers, possibleNames) {
        for (let name of possibleNames) {
            const index = headers.findIndex(header => 
                header && header.toString().toLowerCase().includes(name.toLowerCase())
            );
            if (index !== -1) return index;
        }
        return -1;
    },

    /**
     * איפוס סטטיסטיקות עיבוד
     */
    resetProcessingStats() {
        this.processingStats = {
            totalTransactions: 0,
            uniquePayers: 0,
            externalScores: 0,
            returnedChecks: 0,
            processingTime: 0
        };
    },

    /**
     * קבלת סטטיסטיקות עיבוד
     * @returns {Object} - סטטיסטיקות
     */
    getProcessingStats() {
        return { ...this.processingStats };
    },

    /**
     * קבלת נתוני מושך
     * @param {string} payerID - מזהה מושך
     * @returns {Object|null} - נתוני המושך
     */
    getPayerData(payerID) {
        return window.CreditSystem.payersMap.get(payerID) || null;
    },

    /**
     * קבלת רשימת כל המשכים
     * @returns {Array} - מערך משכים
     */
    getAllPayers() {
        return Array.from(window.CreditSystem.payersMap.values());
    },

    /**
     * חיפוש משכים לפי שם
     * @param {string} searchTerm - מונח חיפוש
     * @returns {Array} - משכים מתאימים
     */
    searchPayers(searchTerm) {
        if (StringUtils.isEmpty(searchTerm)) return [];
        
        const results = [];
        const lowerSearchTerm = searchTerm.toLowerCase();
        
        for (let [id, payer] of window.CreditSystem.payersMap) {
            if (payer.name.toLowerCase().includes(lowerSearchTerm) || 
                id.includes(searchTerm)) {
                results.push({ id, ...payer });
            }
        }
        
        return results.sort((a, b) => a.name.localeCompare(b.name));
    }
};

// 📤 ייצוא לגלובל
window.DataProcessor = DataProcessor;

console.log('🔄 מערכת עיבוד נתונים נטענה בהצלחה');
