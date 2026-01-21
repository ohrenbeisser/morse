/**
 * CW-Dilettant - Erkennen Module
 * Erkennung von Morse-Zeichen üben (Tastatur & Papier Modus)
 */

const Erkennen = (function() {
    'use strict';

    // Modus: 'keyboard' oder 'paper'
    let currentMode = 'keyboard';

    // Aktuelle Lektion
    let currentLesson = 1;

    // Übungszustand
    let isRunning = false;
    let stopRequested = false;

    // Generierte Gruppen für die aktuelle Übung
    let groups = [];
    let currentGroupIndex = 0;

    // Callbacks
    let callbacks = {
        onGroupStart: null,
        onGroupEnd: null,
        onProgress: null,
        onComplete: null,
        onAllGroupsPlayed: null,
        onCharPlayed: null
    };

    /**
     * Setzt den Modus
     * @param {string} mode - 'keyboard' oder 'paper'
     */
    function setMode(mode) {
        if (mode === 'keyboard' || mode === 'paper') {
            currentMode = mode;
        }
    }

    /**
     * Gibt den aktuellen Modus zurück
     * @returns {string}
     */
    function getMode() {
        return currentMode;
    }

    /**
     * Setzt die aktuelle Lektion
     * @param {number} lesson - Lektionsnummer (1-40)
     */
    function setCurrentLesson(lesson) {
        if (lesson >= 1 && lesson <= Koch.getTotalLessons()) {
            currentLesson = lesson;
        }
    }

    /**
     * Gibt die aktuelle Lektion zurück
     * @returns {number}
     */
    function getCurrentLesson() {
        return currentLesson;
    }

    /**
     * Geht zur nächsten Lektion
     * @returns {boolean} true wenn erfolgreich
     */
    function nextLesson() {
        if (currentLesson < Koch.getTotalLessons()) {
            currentLesson++;
            return true;
        }
        return false;
    }

    /**
     * Geht zur vorherigen Lektion
     * @returns {boolean} true wenn erfolgreich
     */
    function prevLesson() {
        if (currentLesson > 1) {
            currentLesson--;
            return true;
        }
        return false;
    }

    /**
     * Gibt die Lektionsdaten zurück
     * @returns {Object}
     */
    function getLessonData() {
        return Koch.getLesson(currentLesson);
    }

    /**
     * Gibt die generierten Gruppen zurück
     * @returns {string[][]}
     */
    function getGroups() {
        return groups;
    }

    /**
     * Führt den Tastatur-Modus durch
     * @param {Object} settings - Einstellungen
     * @returns {Promise<Object>} Ergebnis mit Auswertung
     */
    async function runKeyboardMode(settings) {
        const lesson = getLessonData();
        if (!lesson) return null;

        isRunning = true;
        stopRequested = false;

        const {
            wpm = 20,
            frequency = 600,
            groupSize = 5,
            numGroups = 10,
            pauseAfterGroup = 2500,
            newCharWeight = 0.4,
            reviewLessons = 5,
            instantFeedback = true
        } = settings;

        const morseOptions = { wpm, frequency };

        // Zeichen für Wiederholung (aus den letzten X Lektionen)
        const reviewChars = Koch.getReviewChars(currentLesson, reviewLessons);

        // Gruppen generieren
        groups = Koch.generateGroups(
            reviewChars,
            lesson.newChars,
            groupSize,
            numGroups,
            newCharWeight
        );

        currentGroupIndex = 0;
        const results = {
            totalGroups: numGroups,
            correctGroups: 0,
            totalChars: 0,
            correctChars: 0,
            groupResults: []
        };

        // Gruppen durchspielen
        for (let i = 0; i < groups.length; i++) {
            if (stopRequested) break;

            currentGroupIndex = i;
            const group = groups[i];
            const groupString = group.join('');

            // Callback: Gruppe startet
            if (callbacks.onGroupStart) {
                callbacks.onGroupStart(i, numGroups, group);
            }

            // Progress
            if (callbacks.onProgress) {
                callbacks.onProgress((i + 1) / numGroups);
            }

            // Gruppe abspielen
            const timing = Morse.calculateTiming(wpm);
            for (let j = 0; j < group.length; j++) {
                if (stopRequested) break;

                const char = group[j];
                await Morse.playChar(char, morseOptions);

                // Callback: Zeichen gespielt
                if (callbacks.onCharPlayed) {
                    callbacks.onCharPlayed(char, j, group.length);
                }

                // Pause zwischen Zeichen (außer nach letztem)
                if (j < group.length - 1) {
                    await Morse.wait(timing.letterGap);
                }
            }

            if (stopRequested) break;

            // Callback: Gruppe Ende - warte auf Eingabe
            if (callbacks.onGroupEnd) {
                // Warten auf Benutzereingabe (wird von app.js gesteuert)
                const userInput = await waitForInput();

                if (stopRequested) break;

                // Auswertung
                const isCorrect = userInput.toUpperCase() === groupString.toUpperCase();
                let charCorrect = 0;
                for (let k = 0; k < Math.min(userInput.length, groupString.length); k++) {
                    if (userInput[k].toUpperCase() === groupString[k].toUpperCase()) {
                        charCorrect++;
                    }
                }

                results.totalChars += groupString.length;
                results.correctChars += charCorrect;
                if (isCorrect) {
                    results.correctGroups++;
                }

                results.groupResults.push({
                    group: groupString,
                    input: userInput,
                    correct: isCorrect,
                    charCorrect: charCorrect
                });

                // Sofort-Feedback
                if (instantFeedback && callbacks.onGroupEnd) {
                    callbacks.onGroupEnd(groupString, userInput, isCorrect);
                }
            }

            // Pause nach Gruppe
            if (i < groups.length - 1 && !stopRequested) {
                await Morse.wait(pauseAfterGroup);
            }
        }

        isRunning = false;

        if (!stopRequested && callbacks.onComplete) {
            callbacks.onComplete(results);
        }

        return results;
    }

    // Promise für Eingabe-Warten
    let inputResolve = null;

    /**
     * Wartet auf Benutzereingabe
     * @returns {Promise<string>}
     */
    function waitForInput() {
        return new Promise((resolve) => {
            inputResolve = resolve;
        });
    }

    /**
     * Übermittelt die Benutzereingabe
     * @param {string} input
     */
    function submitInput(input) {
        if (inputResolve) {
            inputResolve(input);
            inputResolve = null;
        }
    }

    /**
     * Führt den Papier-Modus durch
     * @param {Object} settings - Einstellungen
     * @returns {Promise}
     */
    async function runPaperMode(settings) {
        const lesson = getLessonData();
        if (!lesson) return;

        isRunning = true;
        stopRequested = false;

        const {
            wpm = 20,
            frequency = 600,
            groupSize = 5,
            numGroups = 10,
            pauseAfterGroup = 2500,
            newCharWeight = 0.4,
            reviewLessons = 5
        } = settings;

        const morseOptions = { wpm, frequency };

        // Zeichen für Wiederholung (aus den letzten X Lektionen)
        const reviewChars = Koch.getReviewChars(currentLesson, reviewLessons);

        // Gruppen generieren
        groups = Koch.generateGroups(
            reviewChars,
            lesson.newChars,
            groupSize,
            numGroups,
            newCharWeight
        );

        currentGroupIndex = 0;

        // Alle Gruppen durchspielen
        for (let i = 0; i < groups.length; i++) {
            if (stopRequested) break;

            currentGroupIndex = i;
            const group = groups[i];

            // Callback: Gruppe startet
            if (callbacks.onGroupStart) {
                callbacks.onGroupStart(i, numGroups, group);
            }

            // Progress
            if (callbacks.onProgress) {
                callbacks.onProgress((i + 1) / numGroups);
            }

            // Gruppe abspielen
            const timing = Morse.calculateTiming(wpm);
            for (let j = 0; j < group.length; j++) {
                if (stopRequested) break;

                const char = group[j];
                await Morse.playChar(char, morseOptions);

                // Callback: Zeichen gespielt
                if (callbacks.onCharPlayed) {
                    callbacks.onCharPlayed(char, j, group.length);
                }

                // Pause zwischen Zeichen (außer nach letztem)
                if (j < group.length - 1) {
                    await Morse.wait(timing.letterGap);
                }
            }

            // Pause nach Gruppe
            if (i < groups.length - 1 && !stopRequested) {
                await Morse.wait(pauseAfterGroup);
            }
        }

        isRunning = false;

        // Callback: Alle Gruppen gespielt
        if (!stopRequested && callbacks.onAllGroupsPlayed) {
            callbacks.onAllGroupsPlayed(groups);
        }
    }

    /**
     * Berechnet das Ergebnis im Papier-Modus
     * @param {number} errorCount - Anzahl der Fehler
     * @returns {Object} Ergebnis
     */
    function calculatePaperResult(errorCount) {
        const totalChars = groups.reduce((sum, g) => sum + g.length, 0);
        const correctChars = Math.max(0, totalChars - errorCount);
        const correctPercent = totalChars > 0 ? Math.round((correctChars / totalChars) * 100) : 0;

        return {
            totalGroups: groups.length,
            totalChars: totalChars,
            errorCount: errorCount,
            correctChars: correctChars,
            correctPercent: correctPercent
        };
    }

    /**
     * Spricht die Lösung mit TTS aus
     * @returns {Promise}
     */
    async function speakSolution() {
        for (let i = 0; i < groups.length; i++) {
            if (stopRequested) break;

            const group = groups[i];

            // Zeichen ansagen
            for (const char of group) {
                if (stopRequested) break;

                const speech = Phonetic.getForSpeech(char);
                await Speaker.speak(speech.word, speech.lang);
                await Morse.wait(100);
            }

            // Pause zwischen Gruppen (außer nach letzter)
            if (i < groups.length - 1) {
                await Morse.wait(500);
            }
        }
    }

    /**
     * Spielt eine einzelne Gruppe ab (Morse-Töne)
     * @param {number} groupIndex - Index der Gruppe
     * @param {Object} options - Optionen (wpm, frequency)
     * @returns {Promise}
     */
    async function playGroup(groupIndex, options = {}) {
        if (groupIndex < 0 || groupIndex >= groups.length) return;

        const group = groups[groupIndex];
        const { wpm = 20, frequency = 600 } = options;
        const morseOptions = { wpm, frequency };
        const timing = Morse.calculateTiming(wpm);

        // Gruppe abspielen
        for (let j = 0; j < group.length; j++) {
            const char = group[j];
            await Morse.playChar(char, morseOptions);

            // Pause zwischen Zeichen (außer nach letztem)
            if (j < group.length - 1) {
                await Morse.wait(timing.letterGap);
            }
        }
    }

    /**
     * Spricht eine einzelne Gruppe mit TTS aus
     * @param {number} groupIndex - Index der Gruppe
     * @returns {Promise}
     */
    async function speakGroup(groupIndex) {
        if (groupIndex < 0 || groupIndex >= groups.length) return;

        const group = groups[groupIndex];

        // Zeichen ansagen
        for (const char of group) {
            const speech = Phonetic.getForSpeech(char);
            await Speaker.speak(speech.word, speech.lang);
            await Morse.wait(300);
        }
    }

    /**
     * Stoppt die aktuelle Übung
     */
    function stop() {
        stopRequested = true;
        Morse.stop();
        Speaker.stop();
        isRunning = false;

        // Falls auf Eingabe gewartet wird, abbrechen
        if (inputResolve) {
            inputResolve('');
            inputResolve = null;
        }
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
     * @param {Object} cbs
     */
    function setCallbacks(cbs) {
        if (cbs.onGroupStart) callbacks.onGroupStart = cbs.onGroupStart;
        if (cbs.onGroupEnd) callbacks.onGroupEnd = cbs.onGroupEnd;
        if (cbs.onProgress) callbacks.onProgress = cbs.onProgress;
        if (cbs.onComplete) callbacks.onComplete = cbs.onComplete;
        if (cbs.onAllGroupsPlayed) callbacks.onAllGroupsPlayed = cbs.onAllGroupsPlayed;
        if (cbs.onCharPlayed) callbacks.onCharPlayed = cbs.onCharPlayed;
    }

    // Public API
    return {
        setMode,
        getMode,
        setCurrentLesson,
        getCurrentLesson,
        nextLesson,
        prevLesson,
        getLessonData,
        getGroups,
        runKeyboardMode,
        runPaperMode,
        submitInput,
        calculatePaperResult,
        speakSolution,
        playGroup,
        speakGroup,
        stop,
        isRunning: getIsRunning,
        setCallbacks
    };
})();
