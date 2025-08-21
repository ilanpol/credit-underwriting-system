/**
 * מערכת חישוב דירוגי אשראי
 * כולל חישוב 10 פרמטרים משוקללים ודירוג סופי
 */

// 🧮 מחשבון דירוג אשראי
const RatingCalculator = {
    // תוצאות חישוב אחרונות
    lastCalculation: null,
    
    // הגדרות חישוב
    calculationSettings: {
        useExternalScore: true,
        adjustForInflation: false,
        strictMode: false
    },

    /**
     * חישוב דירוג אשראי מלא
     * @param {string} payerID - מזהה המושך
     * @param {number} checkAmount - סכום השיק
     * @returns {Object} - תוצאת החישוב
     */
    calculateCreditRating(payerID, checkAmount) {
        LogUtils.info('מתחיל חישוב דירוג אשראי', { payerID, checkAmount });

        try {
            // בדיקות קלט
            this.validateInputs(payerID, checkAmount);
            
            // קבלת נתוני המושך
            const payerData = this.getPayerData(payerID);
            
            // חישוב כל הפרמטרים
            const parameters = this.calculateAllParameters(payerData, checkAmount);
            
            // חישוב ציון כולל
            const totalScore = this.calculateTotalScore(parameters);
            
            // קביעת דירוג אותיות
            const letterRating = this.getLetterRating(totalScore);
            
            // יצירת המלצה
            const recommendation = this.generateRecommendation(totalScore, payerData, parameters);
            
            // שמירת תוצאות
            this.lastCalculation = {
                payerID,
                payerData,
                checkAmount,
                parameters,
                totalScore,
                letterRating,
                recommendation,
                timestamp: new Date(),
                calculationId: GeneralUtils.generateUniqueId()
            };
            
            LogUtils.success('חישוב דירוג הושלם', { 
                payerID, 
                totalScore, 
                letterRating: letterRating.letter 
            });
            
            return this.lastCalculation;
            
        } catch (error) {
            LogUtils.error('שגיאה בחישוב דירוג', error);
            throw error;
        }
    },

    /**
     * בדיקת תקינות קלט
     * @param {string} payerID - מזהה מושך
     * @param {number} checkAmount - סכום שיק
     */
    validateInputs(payerID, checkAmount) {
        if (StringUtils.isEmpty(payerID)) {
            throw new Error('מספר זהות מושך נדרש');
        }
        
        if (!NumberUtils.isValidNumber(checkAmount) || checkAmount <= 0) {
            throw new Error('סכום שיק חייב להיות מספר חיובי');
        }
        
        if (checkAmount > 10000000) { // 10 מיליון
            throw new Error('סכום שיק גבוה מהמותר במערכת');
        }
    },

    /**
     * קבלת נתוני מושך עם בדיקת קיום
     * @param {string} payerID - מזהה מושך
     * @returns {Object} - נתוני המושך
     */
    getPayerData(payerID) {
        const payerData = window.DataProcessor.getPayerData(payerID);
        
        if (!payerData) {
            throw new Error(`לא נמצאו נתונים עבור מושך ${payerID}. אנא ודא שהקובץ נטען בהצלחה.`);
        }
        
        if (!payerData.transactions || payerData.transactions.length === 0) {
            throw new Error(`לא נמצאו עסקאות עבור מושך ${payerData.name}`);
        }
        
        return payerData;
    },

    /**
     * חישוב כל הפרמטרים
     * @param {Object} payerData - נתוני המושך
     * @param {number} checkAmount - סכום השיק
     * @returns {Object} - כל הפרמטרים מחושבים
     */
    calculateAllParameters(payerData, checkAmount) {
        LogUtils.info('מחשב פרמטרי דירוג...');

        // חישוב נתונים בסיסיים
        const basicStats = this.calculateBasicStats(payerData);
        
        // חישוב פרמטרים נורמליים
        const parameters = {};
        
        // 1. אורך היסטוריה
        parameters.historyLength = this.calculateHistoryLength(payerData, basicStats);
        
        // 2. כמות עסקאות
        parameters.transactionCount = this.calculateTransactionCount(payerData, basicStats);
        
        // 3. עסקה ממוצעת
        parameters.averageAmount = this.calculateAverageAmount(payerData, basicStats);
        
        // 4. סך עסקאות
        parameters.totalAmount = this.calculateTotalAmount(payerData, basicStats);
        
        // 5. ימי אשראי ממוצעים
        parameters.avgCreditDays = this.calculateAvgCreditDays(payerData, basicStats);
        
        // 6. שיעור עמלה ממוצע
        parameters.avgCommissionRate = this.calculateAvgCommissionRate(payerData, basicStats);
        
        // 7. שיקים חוזרים
        parameters.returnedChecks = this.calculateReturnedChecks(payerData);
        
        // 8. ביטולים/אכ"מ
        parameters.cancellations = this.calculateCancellations(payerData);
        
        // 9. יחס סכום עסקה
        parameters.checkAmountRatio = this.calculateCheckAmountRatio(checkAmount, basicStats);
        
        // 10. דירוג חיצוני
        parameters.externalScore = this.calculateExternalScore(payerData);

        LogUtils.info('פרמטרים חושבו', Object.keys(parameters));
        return parameters;
    },

    /**
     * חישוב נתונים בסיסיים
     * @param {Object} payerData - נתוני המושך
     * @returns {Object} - נתונים בסיסיים
     */
    calculateBasicStats(payerData) {
        const now = new Date();
        const firstDate = DateUtils.parseDate(payerData.firstTransaction);
        
        return {
            historyMonths: firstDate ? 
                Math.max(1, (now - firstDate) / (1000 * 60 * 60 * 24 * 30)) : 1,
            transactionCount: payerData.transactions.length,
            avgAmount: payerData.totalAmount / payerData.transactions.length,
            totalAmount: payerData.totalAmount,
            avgCreditDays: payerData.totalCreditDays / payerData.transactions.length,
            avgCommissionRate: payerData.totalCommission > 0 ? 
                (payerData.totalCommission / payerData.totalAmount) * 100 : 0,
            cancelledTransactions: payerData.cancelledTransactions || 0
        };
    },

    /**
     * חישוב פרמטר אורך היסטוריה
     * @param {Object} payerData - נתוני המושך
     * @param {Object} basicStats - נתונים בסיסיים
     * @returns {Object} - פרמטר מחושב
     */
    calculateHistoryLength(payerData, basicStats) {
        const raw = basicStats.historyMonths;
        const normalized = Math.min(100, raw * 2); // 50 חודשים = 100 נקודות
        
        return {
            raw: raw,
            normalized: normalized,
            description: `${raw.toFixed(1)} חודשים של היסטוריה`
        };
    },

    /**
     * חישוב פרמטר כמות עסקאות
     * @param {Object} payerData - נתוני המושך
     * @param {Object} basicStats - נתונים בסיסיים
     * @returns {Object} - פרמטר מחושב
     */
    calculateTransactionCount(payerData, basicStats) {
        const raw = basicStats.transactionCount;
        const normalized = Math.min(100, raw * 2); // 50 עסקאות = 100 נקודות
        
        return {
            raw: raw,
            normalized: normalized,
            description: `${raw} עסקאות קודמות`
        };
    },

    /**
     * חישוב פרמטר עסקה ממוצעת
     * @param {Object} payerData - נתוני המושך
     * @param {Object} basicStats - נתונים בסיסיים
     * @returns {Object} - פרמטר מחושב
     */
    calculateAverageAmount(payerData, basicStats) {
        const raw = basicStats.avgAmount;
        const normalized = Math.min(100, (raw / 100000) * 50); // 100K = 50 נקודות
        
        return {
            raw: raw,
            normalized: normalized,
            description: `עסקה ממוצעת: ${NumberUtils.formatCurrency(raw)}`
        };
    },

    /**
     * חישוב פרמטר סך עסקאות
     * @param {Object} payerData - נתוני המושך
     * @param {Object} basicStats - נתונים בסיסיים
     * @returns {Object} - פרמטר מחושב
     */
    calculateTotalAmount(payerData, basicStats) {
        const raw = basicStats.totalAmount;
        const normalized = Math.min(100, (raw / 1000000) * 30); // 1M = 30 נקודות
        
        return {
            raw: raw,
            normalized: normalized,
            description: `סך עסקאות: ${NumberUtils.formatCurrency(raw)}`
        };
    },

    /**
     * חישוב פרמטר ימי אשראי ממוצעים
     * @param {Object} payerData - נתוני המושך
     * @param {Object} basicStats - נתונים בסיסיים
     * @returns {Object} - פרמטר מחושב
     */
    calculateAvgCreditDays(payerData, basicStats) {
        const raw = basicStats.avgCreditDays;
        const normalized = Math.max(0, 100 - (raw - 30) * 2); // 30 ימים = 100 נקודות
        
        return {
            raw: raw,
            normalized: normalized,
            description: `ממוצע ${raw.toFixed(1)} ימי אשראי`
        };
    },

    /**
     * חישוב פרמטר שיעור עמלה ממוצע
     * @param {Object} payerData - נתוני המושך
     * @param {Object} basicStats - נתונים בסיסיים
     * @returns {Object} - פרמטר מחושב
     */
    calculateAvgCommissionRate(payerData, basicStats) {
        const raw = basicStats.avgCommissionRate;
        const normalized = Math.max(0, 100 - raw * 10); // 0% = 100 נקודות, 10% = 0 נקודות
        
        return {
            raw: raw,
            normalized: normalized,
            description: `עמלה ממוצעת: ${NumberUtils.formatPercentage(raw)}`
        };
    },

    /**
     * חישוב פרמטר שיקים חוזרים
     * @param {Object} payerData - נתוני המושך
     * @returns {Object} - פרמטר מחושב
     */
    calculateReturnedChecks(payerData) {
        const raw = this.countReturnedChecks(payerData);
        const normalized = Math.max(0, 100 - raw * 20); // כל שיק חוזר = -20 נקודות
        
        return {
            raw: raw,
            normalized: normalized,
            description: raw > 0 ? `${raw} שיקים חוזרים` : 'אין שיקים חוזרים'
        };
    },

    /**
     * ספירת שיקים חוזרים
     * @param {Object} payerData - נתוני המושך
     * @returns {number} - מספר שיקים חוזרים
     */
    countReturnedChecks(payerData) {
        if (payerData.returnedChecks && Array.isArray(payerData.returnedChecks)) {
            return payerData.returnedChecks.length;
        }
        
        // חיפוש בנתונים גלובליים
        if (window.CreditSystem.excelData.שיקים_חוזרים) {
            const returnedSheet = window.CreditSystem.excelData.שיקים_חוזרים;
            if (Array.isArray(returnedSheet) && returnedSheet.length > 1) {
                const headers = returnedSheet[0];
                const rows = returnedSheet.slice(1);
                
                const payerIDIndex = headers.findIndex(header => 
                    header && (header.toString().includes('מספר מזהה מושך') || 
                              header.toString().includes('מספר זהות'))
                );
                
                if (payerIDIndex !== -1) {
                    return rows.filter(row => 
                        row[payerIDIndex] && 
                        row[payerIDIndex].toString().trim() === payerData.id.toString().trim()
                    ).length;
                }
            }
        }
        
        return 0;
    },

    /**
     * חישוב פרמטר ביטולים/אכ"מ
     * @param {Object} payerData - נתוני המושך
     * @returns {Object} - פרמטר מחושב
     */
    calculateCancellations(payerData) {
        const raw = payerData.cancelledTransactions || 0;
        const normalized = Math.max(0, 100 - raw * 15); // כל ביטול = -15 נקודות
        
        return {
            raw: raw,
            normalized: normalized,
            description: raw > 0 ? `${raw} ביטולים/אכ"מ` : 'אין ביטולים'
        };
    },

    /**
     * חישוב פרמטר יחס סכום עסקה
     * @param {number} checkAmount - סכום השיק
     * @param {Object} basicStats - נתונים בסיסיים
     * @returns {Object} - פרמטר מחושב
     */
    calculateCheckAmountRatio(checkAmount, basicStats) {
        const ratio = checkAmount / basicStats.avgAmount;
        const raw = ratio;
        // יחס של 1 = 100 נקודות, ככל שמתרחק מ-1 כך הציון יורד
        const normalized = Math.min(100, Math.max(0, 100 - Math.abs(1 - ratio) * 50));
        
        let description;
        if (ratio > 1.5) {
            description = `השיק גבוה פי ${ratio.toFixed(1)} מהממוצע`;
        } else if (ratio < 0.5) {
            description = `השיק נמוך פי ${(1/ratio).toFixed(1)} מהממוצע`;
        } else {
            description = `השיק דומה לעסקה ממוצעת (יחס ${ratio.toFixed(2)})`;
        }
        
        return {
            raw: raw,
            normalized: normalized,
            description: description
        };
    },

    /**
     * חישוב פרמטר דירוג חיצוני
     * @param {Object} payerData - נתוני המושך
     * @returns {Object} - פרמטר מחושב
     */
    calculateExternalScore(payerData) {
        let raw = DATA_PROCESSING_CONFIG.defaults.externalScore;
        let description = 'אין דירוג חיצוני';
        
        if (payerData.creditScore && NumberUtils.isValidNumber(payerData.creditScore.score)) {
            raw = payerData.creditScore.score;
            description = `דירוג חיצוני: ${raw}`;
            
            if (payerData.creditScore.category) {
                description += ` (קטגוריה ${payerData.creditScore.category})`;
            }
        }
        
        const normalized = raw; // הדירוג החיצוני כבר בסקלה 0-100
        
        return {
            raw: raw,
            normalized: normalized,
            description: description
        };
    },

    /**
     * חישוב ציון כולל משוקלל
     * @param {Object} parameters - כל הפרמטרים
     * @returns {number} - ציון כולל
     */
    calculateTotalScore(parameters) {
        let totalScore = 0;
        
        Object.keys(RATING_PARAMETERS).forEach(paramKey => {
            if (parameters[paramKey]) {
                const paramData = parameters[paramKey];
                const weight = RATING_PARAMETERS[paramKey].weight;
                const weightedScore = paramData.normalized * weight;
                totalScore += weightedScore;
                
                LogUtils.info(`${paramKey}: ${paramData.normalized.toFixed(1)} * ${weight} = ${weightedScore.toFixed(2)}`);
            }
        });
        
        const finalScore = Math.round(Math.max(0, Math.min(100, totalScore)));
        LogUtils.info(`ציון כולל: ${finalScore}`);
        
        return finalScore;
    },

    /**
     * קביעת דירוג אותיות
     * @param {number} score - ציון מספרי
     * @returns {Object} - דירוג אותיות עם פרטים
     */
    getLetterRating(score) {
        return ConfigHelpers.getLetterRating(score);
    },

    /**
     * יצירת המלצה מפורטת
     * @param {number} totalScore - ציון כולל
     * @param {Object} payerData - נתוני המושך
     * @param {Object} parameters - פרמטרים
     * @returns {Object} - המלצה
     */
    generateRecommendation(totalScore, payerData, parameters) {
        const letterRating = this.getLetterRating(totalScore);
        const returnedChecks = parameters.returnedChecks.raw;
        const cancellations = parameters.cancellations.raw;
        const avgAmount = NumberUtils.formatCurrency(parameters.averageAmount.raw);
        const transactionCount = parameters.transactionCount.raw;
        
        let recommendation = {
            class: '',
            title: '',
            message: '',
            risks: [],
            strengths: [],
            conditions: []
        };

        // קביעת רמת סיכון והמלצה
        if (totalScore >= 80) {
            recommendation.class = 'excellent';
            recommendation.title = '✅ מומלץ לאישור';
            recommendation.message = `לקוח איכותי עם סיכון נמוך. ${transactionCount} עסקאות קודמות, ${returnedChecks} חזרות.`;
            
            if (parameters.externalScore.raw > 70) {
                recommendation.strengths.push('דירוג חיצוני גבוה');
            }
            if (transactionCount >= 10) {
                recommendation.strengths.push('היסטוריה עשירה');
            }
            
        } else if (totalScore >= 65) {
            recommendation.class = 'good';
            recommendation.title = '👍 ניתן לאישור בתנאים רגילים';
            recommendation.message = `לקוח טוב עם סיכון בינוני נמוך. עסקה ממוצעת: ${avgAmount}.`;
            
            if (returnedChecks > 0) {
                recommendation.risks.push(`${returnedChecks} שיקים חוזרים בעבר`);
            }
            
        } else if (totalScore >= 50) {
            recommendation.class = 'average';
            recommendation.title = '⚠️ דרוש בדיקה נוספת או תנאים מיוחדים';
            recommendation.message = `סיכון בינוני. ${cancellations > 0 ? `יש ${cancellations} ביטולים` : 'אין ביטולים'}.`;
            
            recommendation.conditions.push('שקול ערובות נוספות');
            recommendation.conditions.push('בדוק התעדכנות נתונים');
            
            if (parameters.externalScore.raw < 50) {
                recommendation.risks.push('דירוג חיצוני נמוך');
            }
            
        } else if (totalScore >= 35) {
            recommendation.class = 'poor';
            recommendation.title = '❌ לא מומלץ או דרושות ערובות חזקות';
            recommendation.message = `סיכון גבוה. ${returnedChecks} שיקים חוזרים, ${cancellations} ביטולים.`;
            
            recommendation.risks.push('היסטוריה בעייתית');
            recommendation.conditions.push('ערובות חזקות נדרשות');
            recommendation.conditions.push('בדיקה מעמיקה של המושך');
            
        } else {
            recommendation.class = 'danger';
            recommendation.title = '🚫 אין לאשר';
            recommendation.message = `סיכון גבוה מאוד. נתונים בעייתיים: ${returnedChecks} חזרות, ${cancellations} ביטולים.`;
            
            recommendation.risks.push('סיכון קיצוני');
            recommendation.risks.push('נתונים בעייתיים מרובים');
        }

        return recommendation;
    },

    /**
     * קבלת תוצאות החישוב האחרון
     * @returns {Object|null} - תוצאות או null
     */
    getLastCalculation() {
        return this.lastCalculation;
    },

    /**
     * איפוס תוצאות חישוב
     */
    clearLastCalculation() {
        this.lastCalculation = null;
        LogUtils.info('תוצאות חישוב אופסו');
    },

    /**
     * שמירת הגדרות חישוב
     * @param {Object} settings - הגדרות חדשות
     */
    updateCalculationSettings(settings) {
        Object.assign(this.calculationSettings, settings);
        LogUtils.info('הגדרות חישוב עודכנו', this.calculationSettings);
    }
};

// 🎮 פונקציה ראשית לחישוב מהממשק
function performCreditRatingCalculation() {
    LogUtils.info('מתחיל חישוב דירוג אשראי מהממשק');

    try {
        // בדיקת הרשאות
        if (!checkPermission('canCalculateRating', 'חישוב דירוג אשראי')) {
            return;
        }

        // קבלת נתונים מהטופס
        const payerID = StringUtils.cleanString(DOMUtils.getElementById('payerID')?.value);
        const checkAmount = NumberUtils.safeParseFloat(DOMUtils.getElementById('checkAmount')?.value);

        if (StringUtils.isEmpty(payerID) || checkAmount <= 0) {
            alert('אנא מלא את כל השדות הנדרשים:\n• מספר זהות מושך\n• סכום השיק (גדול מאפס)');
            return;
        }

        // חישוב הדירוג
        const calculation = RatingCalculator.calculateCreditRating(payerID, checkAmount);

        // הצגת תוצאות
        if (window.UIManager) {
            window.UIManager.displayResults(calculation);
        }

        LogUtils.success('חישוב דירוג הושלם בממשק', { 
            payerID, 
            score: calculation.totalScore 
        });

    } catch (error) {
        LogUtils.error('שגיאה בחישוב דירוג מהממשק', error);
        alert(`שגיאה בחישוב הדירוג:\n${error.message}`);
    }
}

// 📤 ייצוא לגלובל
window.RatingCalculator = RatingCalculator;
window.performCreditRatingCalculation = performCreditRatingCalculation;

console.log('🧮 מערכת חישוב דירוגי אשראי נטענה בהצלחה');
