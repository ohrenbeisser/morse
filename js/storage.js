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
        wpm: 12,                    // Geschwindigkeit
        effWpm: 12,                 // Effektiv-Geschwindigkeit (Farnsworth)
        frequency: 600,             // Grundfrequenz
        pitchOffset: 0,             // Tonhöhen-Offset für Dit/Dah (Hz)
        letters: true,
        numbers: true,
        special: false,

        // Aussprache
        phoneticLang: 'en',  // 'en' = NATO, 'de' = Deutsch
        announce: true,

        // Hören-Einstellungen
        repetitionsWithPause: 3,    // Wiederholungen mit Pause (0-10)
        repetitionsNoPause: 3,      // Wiederholungen ohne Pause (0-10)
        pauseBetweenReps: 800,      // Pause zwischen Wiederholungen (ms)
        groupSize: 5,               // Zeichen pro Gruppe
        numGroups: 10,              // Anzahl Übungsgruppen
        pauseAfterGroup: 2500,      // Pause nach jeder Gruppe (ms)
        newCharWeight: 40,          // Gewichtung neues Zeichen (%)
        reviewLessons: 6,           // Anzahl Lektionen für Wiederholung (0-40)
        charPauseFactor: 0,         // Zusätzliche Zeichenpause (Faktor 0-5)
        endless: false,             // Endlos-Modus
        announceGroups: false,      // Gruppen ansagen
        announceDitDah: false,      // Dit/Dah ansagen bei Zeichenvorstellung

        // Erkennen-Einstellungen
        erkennenGroupSize: 5,           // 3-7
        erkennenNumGroups: 10,          // 5-20
        erkennenPauseAfterGroup: 2500,  // ms
        erkennenInstantFeedback: true,  // Sofort-Feedback (Tastatur)
        erkennenMode: 'keyboard',       // 'keyboard' | 'paper'

        // Geben-Einstellungen
        gebenShowScope: true,           // Oszilloskop anzeigen
        gebenShowSequence: false        // Morse-Sequenz anzeigen
    };

    // Standard-Statistik
    const defaultStats = {
        // Gesamt
        sessions: 0,
        correctPercent: 0,
        totalChars: 0,
        totalTimeMinutes: 0,

        // Pro Modul
        hoeren: {
            sessions: 0,
            timeMinutes: 0,
            lessonsCompleted: 0
        },
        erkennen: {
            sessions: 0,
            timeMinutes: 0,
            totalChars: 0,
            correctChars: 0,
            bestPercent: 0
        },
        geben: {
            sessions: 0,
            timeMinutes: 0,
            totalChars: 0
        },

        // Streak-Tracking
        currentStreak: 0,
        bestStreak: 0,
        lastActiveDate: null,

        // Verlauf (letzte 7 Tage für Mini-Chart)
        history: []  // [{date: 'YYYY-MM-DD', sessions: n, percent: n, chars: n, minutes: n}]
    };

    // Standard Koch-Fortschritt
    const defaultKoch = {
        currentLesson: 1,
        completedLessons: [],
        lessonStats: {},
        erkennenLesson: 1       // Separate Lektion für Erkennen
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
     * Aktualisiert den Streak-Zähler
     */
    function updateStreak() {
        const stats = getStats();
        const today = new Date().toISOString().split('T')[0];

        if (stats.lastActiveDate === today) {
            // Bereits heute aktiv gewesen
            return;
        }

        const yesterday = new Date(Date.now() - 86400000).toISOString().split('T')[0];

        if (stats.lastActiveDate === yesterday) {
            // Streak fortsetzen
            stats.currentStreak++;
        } else if (stats.lastActiveDate !== today) {
            // Streak zurücksetzen (mehr als 1 Tag Pause)
            stats.currentStreak = 1;
        }

        // Best Streak aktualisieren
        if (stats.currentStreak > stats.bestStreak) {
            stats.bestStreak = stats.currentStreak;
        }

        stats.lastActiveDate = today;
        saveStats(stats);
    }

    /**
     * Fügt einen Eintrag zur History hinzu (für Mini-Chart)
     * @param {Object} entry - {sessions, percent, chars, minutes}
     */
    function addHistoryEntry(entry) {
        const stats = getStats();
        const today = new Date().toISOString().split('T')[0];

        // Initialisiere history falls nicht vorhanden
        if (!Array.isArray(stats.history)) {
            stats.history = [];
        }

        // Suche heutigen Eintrag
        const todayIndex = stats.history.findIndex(h => h.date === today);

        if (todayIndex >= 0) {
            // Heutigen Eintrag aktualisieren
            const existing = stats.history[todayIndex];
            stats.history[todayIndex] = {
                date: today,
                sessions: (existing.sessions || 0) + (entry.sessions || 0),
                percent: entry.percent || existing.percent,
                chars: (existing.chars || 0) + (entry.chars || 0),
                minutes: (existing.minutes || 0) + (entry.minutes || 0)
            };
        } else {
            // Neuen Eintrag hinzufügen
            stats.history.push({
                date: today,
                sessions: entry.sessions || 0,
                percent: entry.percent || 0,
                chars: entry.chars || 0,
                minutes: entry.minutes || 0
            });
        }

        // Nur letzte 7 Tage behalten
        stats.history = stats.history
            .sort((a, b) => a.date.localeCompare(b.date))
            .slice(-7);

        saveStats(stats);
    }

    /**
     * Gibt die History der letzten 7 Tage zurück
     * @returns {Array} History-Einträge
     */
    function getHistory() {
        const stats = getStats();
        return stats.history || [];
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
     * Setzt die Erkennen-Lektion
     * @param {number} lesson - Lektionsnummer
     */
    function setErkennenLesson(lesson) {
        const koch = getKoch();
        koch.erkennenLesson = lesson;
        saveKoch(koch);
    }

    /**
     * Gibt die Erkennen-Lektion zurück
     * @returns {number} Lektionsnummer
     */
    function getErkennenLesson() {
        const koch = getKoch();
        return koch.erkennenLesson || 1;
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
        updateStreak,
        addHistoryEntry,
        getHistory,
        getKoch,
        saveKoch,
        setKochLesson,
        completeKochLesson,
        setErkennenLesson,
        getErkennenLesson,
        resetAll,
        resetStats,
        resetKoch,
        defaultSettings,
        defaultStats,
        defaultKoch
    };
})();
