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
        phoneticLang: 'de',
        announce: false
    };

    // Standard-Statistik
    const defaultStats = {
        sessions: 0,
        correctPercent: 0,
        totalChars: 0,
        totalTimeMinutes: 0
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
                    stats: { ...defaultStats, ...parsed.stats }
                };
            }
        } catch (e) {
            console.error('Fehler beim Laden der Daten:', e);
        }
        return {
            settings: { ...defaultSettings },
            stats: { ...defaultStats }
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
     * Setzt alle Daten auf Standardwerte zurück
     */
    function resetAll() {
        saveAll({
            settings: { ...defaultSettings },
            stats: { ...defaultStats }
        });
    }

    /**
     * Setzt nur die Statistik zurück
     */
    function resetStats() {
        saveStats({ ...defaultStats });
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
        resetAll,
        resetStats,
        defaultSettings,
        defaultStats
    };
})();
