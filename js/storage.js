/**
 * CW-Dilettant - Storage Module
 * Verwaltet alle LocalStorage Operationen
 */

const Storage = (function() {
    'use strict';

    const STORAGE_KEY = 'cw-dilettant';

    // Standard-Einstellungen
    const defaultSettings = {
        // Allgemein
        darkMode: false,

        // CW-Parameter
        wpm: 20,
        effWpm: 15,
        frequency: 600,
        letters: true,
        numbers: true,
        special: false,

        // Aussprache
        phoneticLang: 'en',  // 'en' = NATO, 'de' = Deutsch
        announce: true,

        // Hören-Einstellungen
        repetitionsWithPause: 3,    // Wiederholungen mit Pause
        repetitionsNoPause: 3,      // Wiederholungen ohne Pause
        pauseBetweenReps: 800,      // Pause zwischen Wiederholungen (ms)
        groupSize: 5,               // Zeichen pro Gruppe
        numGroups: 10,              // Anzahl Übungsgruppen
        newCharWeight: 40,          // Gewichtung neues Zeichen (%)
        reviewLessons: 5,           // Anzahl Lektionen für Wiederholung (3-10)
        endless: false,             // Endlos-Modus
        announceGroups: false       // Gruppen ansagen
    };

    // Standard-Statistik
    const defaultStats = {
        sessions: 0,
        correctPercent: 0,
        totalChars: 0,
        totalTimeMinutes: 0
    };

    // Standard Koch-Fortschritt
    const defaultKoch = {
        currentLesson: 1,
        completedLessons: [],
        lessonStats: {}
    };

    /**
     * Lädt alle Daten aus dem LocalStorage
     * @returns {Object} Gespeicherte Daten oder Defaults
     */
    function loadAll() {
        try {
            const data = localStorage.getItem(STORAGE_KEY);
            if (data) {
                const parsed = JSON.parse(data);
                return {
                    settings: { ...defaultSettings, ...parsed.settings },
                    stats: { ...defaultStats, ...parsed.stats },
                    koch: { ...defaultKoch, ...parsed.koch }
                };
            }
        } catch (e) {
            console.error('Fehler beim Laden der Daten:', e);
        }
        return {
            settings: { ...defaultSettings },
            stats: { ...defaultStats },
            koch: { ...defaultKoch }
        };
    }

    /**
     * Speichert alle Daten im LocalStorage
     * @param {Object} data - Zu speichernde Daten
     */
    function saveAll(data) {
        try {
            localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
        } catch (e) {
            console.error('Fehler beim Speichern der Daten:', e);
        }
    }

    /**
     * Lädt die Einstellungen
     * @returns {Object} Einstellungen
     */
    function getSettings() {
        return loadAll().settings;
    }

    /**
     * Speichert die Einstellungen
     * @param {Object} settings - Neue Einstellungen
     */
    function saveSettings(settings) {
        const data = loadAll();
        data.settings = { ...data.settings, ...settings };
        saveAll(data);
    }

    /**
     * Lädt eine einzelne Einstellung
     * @param {string} key - Einstellungsname
     * @returns {*} Einstellungswert
     */
    function getSetting(key) {
        const settings = getSettings();
        return settings[key];
    }

    /**
     * Speichert eine einzelne Einstellung
     * @param {string} key - Einstellungsname
     * @param {*} value - Neuer Wert
     */
    function saveSetting(key, value) {
        const settings = getSettings();
        settings[key] = value;
        saveSettings(settings);
    }

    /**
     * Lädt die Statistik
     * @returns {Object} Statistik
     */
    function getStats() {
        return loadAll().stats;
    }

    /**
     * Speichert die Statistik
     * @param {Object} stats - Neue Statistik
     */
    function saveStats(stats) {
        const data = loadAll();
        data.stats = { ...data.stats, ...stats };
        saveAll(data);
    }

    /**
     * Aktualisiert einen Statistikwert
     * @param {string} key - Statistikname
     * @param {*} value - Neuer Wert
     */
    function updateStat(key, value) {
        const stats = getStats();
        stats[key] = value;
        saveStats(stats);
    }

    /**
     * Lädt den Koch-Fortschritt
     * @returns {Object} Koch-Daten
     */
    function getKoch() {
        return loadAll().koch;
    }

    /**
     * Speichert den Koch-Fortschritt
     * @param {Object} koch - Koch-Daten
     */
    function saveKoch(koch) {
        const data = loadAll();
        data.koch = { ...data.koch, ...koch };
        saveAll(data);
    }

    /**
     * Setzt die aktuelle Koch-Lektion
     * @param {number} lesson - Lektionsnummer
     */
    function setKochLesson(lesson) {
        const koch = getKoch();
        koch.currentLesson = lesson;
        saveKoch(koch);
    }

    /**
     * Markiert eine Lektion als abgeschlossen
     * @param {number} lesson - Lektionsnummer
     */
    function completeKochLesson(lesson) {
        const koch = getKoch();
        if (!koch.completedLessons.includes(lesson)) {
            koch.completedLessons.push(lesson);
            koch.completedLessons.sort((a, b) => a - b);
        }
        saveKoch(koch);
    }

    /**
     * Setzt alle Daten auf Standardwerte zurück
     */
    function resetAll() {
        saveAll({
            settings: { ...defaultSettings },
            stats: { ...defaultStats },
            koch: { ...defaultKoch }
        });
    }

    /**
     * Setzt nur die Statistik zurück
     */
    function resetStats() {
        saveStats({ ...defaultStats });
    }

    /**
     * Setzt nur den Koch-Fortschritt zurück
     */
    function resetKoch() {
        saveKoch({ ...defaultKoch });
    }

    // Public API
    return {
        getSettings,
        saveSettings,
        getSetting,
        saveSetting,
        getStats,
        saveStats,
        updateStat,
        getKoch,
        saveKoch,
        setKochLesson,
        completeKochLesson,
        resetAll,
        resetStats,
        resetKoch,
        defaultSettings,
        defaultStats,
        defaultKoch
    };
})();
