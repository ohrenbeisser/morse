/**
 * CW-Dilettant - Zusatzlektionen Module
 * Wörter, Abkürzungen und Q-Codes für Fortgeschrittene
 */

const Zusatz = (function() {
    'use strict';

    // Zusatzlektionen (werden aus JSON geladen)
    let LESSONS = [];
    let isLoaded = false;

    // Aktuelle Lektion
    let currentLessonIndex = 0;
    let isRunning = false;
    let stopRequested = false;

    // Callbacks
    let onWordChange = null;
    let onProgress = null;
    let onComplete = null;

    /**
     * Lädt die Zusatzlektionen aus der JSON-Datei
     * @returns {Promise<boolean>}
     */
    async function load() {
        if (isLoaded) return true;

        try {
            const response = await fetch('data/zusatzlektionen.json');
            const data = await response.json();
            LESSONS = data.lessons || [];
            isLoaded = true;
            return true;
        } catch (error) {
            console.error('Fehler beim Laden der Zusatzlektionen:', error);
            return false;
        }
    }

    /**
     * Gibt alle Zusatzlektionen zurück
     * @returns {Array}
     */
    function getLessons() {
        return LESSONS;
    }

    /**
     * Gibt eine Lektion nach Index zurück
     * @param {number} index - 0-basierter Index
     * @returns {Object|null}
     */
    function getLesson(index) {
        if (index >= 0 && index < LESSONS.length) {
            return LESSONS[index];
        }
        return null;
    }

    /**
     * Gibt die aktuelle Lektion zurück
     * @returns {Object|null}
     */
    function getCurrentLesson() {
        return getLesson(currentLessonIndex);
    }

    /**
     * Setzt die aktuelle Lektion
     * @param {number} index - 0-basierter Index
     */
    function setCurrentLesson(index) {
        if (index >= 0 && index < LESSONS.length) {
            currentLessonIndex = index;
        }
    }

    /**
     * Geht zur nächsten Lektion
     * @returns {boolean}
     */
    function nextLesson() {
        if (currentLessonIndex < LESSONS.length - 1) {
            currentLessonIndex++;
            return true;
        }
        return false;
    }

    /**
     * Geht zur vorherigen Lektion
     * @returns {boolean}
     */
    function prevLesson() {
        if (currentLessonIndex > 0) {
            currentLessonIndex--;
            return true;
        }
        return false;
    }

    /**
     * Gibt die Gesamtzahl der Lektionen zurück
     * @returns {number}
     */
    function getTotalLessons() {
        return LESSONS.length;
    }

    /**
     * Führt eine Zusatzlektion durch (spielt Wörter ab)
     * @param {Object} settings - Einstellungen
     * @returns {Promise}
     */
    async function runLesson(settings) {
        const lesson = getCurrentLesson();
        if (!lesson || !lesson.words) return;

        isRunning = true;
        stopRequested = false;

        const {
            wpm = 12,
            effWpm = 12,
            frequency = 600,
            pauseBetweenWords = 2000,
            repetitions = 1,
            shuffle = false,
            endless = false,
            announceEnabled = true
        } = settings;

        const morseOptions = { wpm, effWpm, frequency };

        // Wörter kopieren und optional mischen
        let words = [...lesson.words];

        do {
            if (shuffle) {
                words = shuffleArray([...lesson.words]);
            }

            for (let i = 0; i < words.length; i++) {
                if (stopRequested) break;

                const word = words[i];

                // Callback: Wort anzeigen
                if (onWordChange) onWordChange(word, i + 1, words.length);
                if (onProgress) onProgress((i + 1) / words.length);

                // Wort X-mal wiederholen
                for (let r = 0; r < repetitions; r++) {
                    if (stopRequested) break;

                    // Wort abspielen
                    await Morse.playText(word, morseOptions);

                    // Pause zwischen Wiederholungen
                    if (r < repetitions - 1) {
                        await Morse.wait(pauseBetweenWords / 2);
                    }
                }

                // Ansage (optional)
                if (announceEnabled && !stopRequested) {
                    await Morse.wait(500);
                    await Speaker.speak(word, 'en');
                }

                // Pause zwischen Wörtern
                if (i < words.length - 1 && !stopRequested) {
                    await Morse.wait(pauseBetweenWords);
                }
            }

            if (onComplete && !stopRequested) onComplete();

        } while (endless && !stopRequested);

        isRunning = false;
    }

    /**
     * Mischt ein Array (Fisher-Yates)
     * @param {Array} array
     * @returns {Array}
     */
    function shuffleArray(array) {
        for (let i = array.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [array[i], array[j]] = [array[j], array[i]];
        }
        return array;
    }

    /**
     * Stoppt die aktuelle Übung
     */
    function stop() {
        stopRequested = true;
        Morse.stop();
        Speaker.stop();
        isRunning = false;
    }

    /**
     * Prüft ob eine Übung läuft
     * @returns {boolean}
     */
    function getIsRunning() {
        return isRunning;
    }

    /**
     * Registriert Event-Callbacks
     * @param {Object} callbacks
     */
    function setCallbacks(callbacks) {
        if (callbacks.onWordChange) onWordChange = callbacks.onWordChange;
        if (callbacks.onProgress) onProgress = callbacks.onProgress;
        if (callbacks.onComplete) onComplete = callbacks.onComplete;
    }

    // Public API
    return {
        load,
        getLessons,
        getLesson,
        getCurrentLesson,
        setCurrentLesson,
        nextLesson,
        prevLesson,
        getTotalLessons,
        runLesson,
        stop,
        isRunning: getIsRunning,
        setCallbacks
    };
})();
