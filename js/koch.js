/**
 * CW-Dilettant - Koch Method Module
 * 40 Lektionen nach der Koch-Methode
 */

const Koch = (function() {
    'use strict';

    // Koch-Zeichenreihenfolge
    const KOCH_ORDER = [
        'K', 'M', 'U', 'R', 'E', 'S', 'N', 'A', 'P', 'T',
        'L', 'W', 'I', '.', 'J', 'Z', '=', 'F', 'O', 'Y',
        ',', 'V', 'G', '5', '/', 'Q', '9', '2', 'H', '3',
        '8', 'B', '?', '4', '7', 'C', '1', 'D', '6', '0', 'X'
    ];

    // Lektionen generieren
    const LESSONS = [];
    for (let i = 0; i < KOCH_ORDER.length; i++) {
        // Lektion 1 hat 2 Zeichen (K, M), danach jeweils 1 neues
        if (i === 0) {
            LESSONS.push({
                lesson: 1,
                newChars: ['K', 'M'],
                allChars: ['K', 'M']
            });
        } else {
            LESSONS.push({
                lesson: i + 1,
                newChars: [KOCH_ORDER[i]],
                allChars: KOCH_ORDER.slice(0, i + 1)
            });
        }
    }

    // Übungszustand
    let currentLesson = 1;
    let isRunning = false;
    let stopRequested = false;

    // Callbacks
    let onPhaseChange = null;
    let onCharChange = null;
    let onGroupChange = null;
    let onGroupStart = null;
    let onProgress = null;
    let onComplete = null;

    /**
     * Wandelt Morse-Code in Dit/Dah-Sprache um
     * @param {string} char - Das Zeichen
     * @returns {string} Dit/Dah-Text (z.B. "dittdaah" für A)
     */
    function getMorseSpeech(char) {
        const code = Morse.getCode(char);
        if (!code) return '';

        return code.split('').map(symbol =>
            symbol === '.' ? 'ditt' : 'daah'
        ).join('');
    }

    /**
     * Gibt eine Lektion zurück
     * @param {number} lessonNumber - Lektionsnummer (1-40)
     * @returns {Object} Lektionsdaten
     */
    function getLesson(lessonNumber) {
        const index = lessonNumber - 1;
        if (index >= 0 && index < LESSONS.length) {
            return LESSONS[index];
        }
        return null;
    }

    /**
     * Gibt die aktuelle Lektion zurück
     * @returns {Object}
     */
    function getCurrentLesson() {
        return getLesson(currentLesson);
    }

    /**
     * Setzt die aktuelle Lektion
     * @param {number} lessonNumber
     */
    function setCurrentLesson(lessonNumber) {
        if (lessonNumber >= 1 && lessonNumber <= LESSONS.length) {
            currentLesson = lessonNumber;
        }
    }

    /**
     * Geht zur nächsten Lektion
     * @returns {boolean} true wenn erfolgreich
     */
    function nextLesson() {
        if (currentLesson < LESSONS.length) {
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
     * Gibt die Zeichen aus den letzten X Lektionen zurück
     * @param {number} lessonNumber - Aktuelle Lektionsnummer
     * @param {number} numLessons - Anzahl der Lektionen für Wiederholung
     * @returns {string[]} Zeichen aus den letzten X Lektionen
     */
    function getReviewChars(lessonNumber, numLessons) {
        // Start-Lektion berechnen (mindestens 1)
        const startLesson = Math.max(1, lessonNumber - numLessons + 1);

        // Alle Zeichen von startLesson bis lessonNumber sammeln
        const startIndex = startLesson === 1 ? 0 : startLesson - 1;
        const endIndex = lessonNumber;

        // Bei Lektion 1 sind es K und M (Index 0 und 1)
        if (startLesson === 1) {
            return KOCH_ORDER.slice(0, endIndex);
        }

        return KOCH_ORDER.slice(startIndex, endIndex);
    }

    /**
     * Generiert zufällige Gruppen mit Gewichtung des neuen Zeichens
     * @param {string[]} allChars - Alle verfügbaren Zeichen
     * @param {string[]} newChars - Neue Zeichen (höhere Gewichtung)
     * @param {number} groupSize - Größe einer Gruppe
     * @param {number} numGroups - Anzahl Gruppen
     * @param {number} newCharWeight - Gewichtung neuer Zeichen (0-1, z.B. 0.4 = 40%)
     * @returns {string[][]} Array von Gruppen
     */
    function generateGroups(allChars, newChars, groupSize, numGroups, newCharWeight = 0.4) {
        const groups = [];
        const oldChars = allChars.filter(c => !newChars.includes(c));

        for (let g = 0; g < numGroups; g++) {
            const group = [];
            for (let i = 0; i < groupSize; i++) {
                // Entscheide ob neues oder altes Zeichen
                if (Math.random() < newCharWeight && newChars.length > 0) {
                    // Neues Zeichen
                    const idx = Math.floor(Math.random() * newChars.length);
                    group.push(newChars[idx]);
                } else if (oldChars.length > 0) {
                    // Altes Zeichen
                    const idx = Math.floor(Math.random() * oldChars.length);
                    group.push(oldChars[idx]);
                } else {
                    // Fallback: neues Zeichen
                    const idx = Math.floor(Math.random() * newChars.length);
                    group.push(newChars[idx]);
                }
            }
            groups.push(group);
        }

        return groups;
    }

    /**
     * Führt eine komplette Lektion durch
     * @param {Object} settings - Einstellungen
     * @returns {Promise}
     */
    async function runLesson(settings) {
        const lesson = getCurrentLesson();
        if (!lesson) return;

        isRunning = true;
        stopRequested = false;

        const {
            wpm = 20,
            frequency = 600,
            repetitionsWithPause = 3,
            repetitionsNoPause = 3,
            pauseBetweenReps = 800,
            groupSize = 5,
            numGroups = 10,
            pauseAfterGroup = 2500,
            newCharWeight = 0.4,
            reviewLessons = 5,
            charPauseFactor = 0,
            announceEnabled = true,
            phoneticLang = 'en',
            announceGroups = false,
            announceDitDah = false,
            endless = false
        } = settings;

        const morseOptions = { wpm, frequency };

        // Zeichen für Wiederholung (nur aus den letzten X Lektionen)
        const reviewChars = getReviewChars(currentLesson, reviewLessons);

        do {
            // PHASE 1: Neue Zeichen vorstellen
            if (onPhaseChange) onPhaseChange('introduce', lesson.newChars);

            for (const char of lesson.newChars) {
                if (stopRequested) break;

                if (onCharChange) onCharChange(char, 'new');

                // Ansage (A-Z in Englisch/NATO, Rest in Deutsch)
                if (announceEnabled) {
                    const speech = Phonetic.getForSpeech(char);
                    await Speaker.speak(speech.word, speech.lang);
                    await Morse.wait(500);

                    // Dit/Dah ansagen (optional)
                    if (announceDitDah) {
                        const ditDahText = getMorseSpeech(char);
                        if (ditDahText) {
                            await Speaker.speak(ditDahText, 'en');
                            await Morse.wait(500);
                        }
                    }
                }

                if (stopRequested) break;

                // Mit Pause abspielen
                await Morse.playCharWithPause(char, repetitionsWithPause, pauseBetweenReps, morseOptions);

                if (stopRequested) break;

                await Morse.wait(1000);

                // Ohne Pause abspielen
                await Morse.playCharNoPause(char, repetitionsNoPause, morseOptions);

                await Morse.wait(1500);
            }

            if (stopRequested) break;

            // PHASE 2: Zeichen aus den letzten X Lektionen wiederholen
            if (onPhaseChange) onPhaseChange('review', reviewChars);

            for (const char of reviewChars) {
                if (stopRequested) break;

                // Neue Zeichen überspringen (wurden schon ausführlich behandelt)
                if (lesson.newChars.includes(char)) continue;

                if (onCharChange) onCharChange(char, 'review');

                // Ansage (A-Z in Englisch/NATO, Rest in Deutsch)
                if (announceEnabled) {
                    const speech = Phonetic.getForSpeech(char);
                    await Speaker.speak(speech.word, speech.lang);
                    await Morse.wait(500);

                    // Dit/Dah ansagen (optional)
                    if (announceDitDah) {
                        const ditDahText = getMorseSpeech(char);
                        if (ditDahText) {
                            await Speaker.speak(ditDahText, 'en');
                            await Morse.wait(500);
                        }
                    }
                }

                if (stopRequested) break;

                // Kurze Wiederholung (2x mit Pause)
                await Morse.playCharWithPause(char, 2, pauseBetweenReps, morseOptions);

                await Morse.wait(1000);
            }

            if (stopRequested) break;

            // PHASE 3: Übungsgruppen (nur mit Zeichen aus den letzten X Lektionen)
            if (onPhaseChange) onPhaseChange('groups', null);

            const groups = generateGroups(
                reviewChars,
                lesson.newChars,
                groupSize,
                numGroups,
                newCharWeight
            );

            for (let i = 0; i < groups.length; i++) {
                if (stopRequested) break;

                const group = groups[i];

                // Gruppe ankündigen (Fortschritt aktualisieren)
                if (onGroupChange) onGroupChange([], i + 1, numGroups);
                if (onProgress) onProgress((i + 1) / numGroups);

                // Gruppe ansagen (optional) - immer auf Deutsch
                if (announceGroups && announceEnabled) {
                    await Speaker.speak(`Gruppe ${i + 1}`, 'de');
                    await Morse.wait(500);
                }

                // Gruppe startet - alte Zeichen ausblenden
                if (onGroupStart) onGroupStart(i + 1, numGroups);

                // Gruppe abspielen - Zeichen einzeln mit Callback nach Abspielen
                const timing = Morse.calculateTiming(wpm);
                for (let j = 0; j < group.length; j++) {
                    if (stopRequested) break;

                    const char = group[j];

                    // Zeichen abspielen
                    await Morse.playChar(char, morseOptions);

                    // Nach dem Abspielen: Zeichen zur Anzeige hinzufügen
                    if (onCharChange) onCharChange(char, 'group');

                    // Pause zwischen Zeichen (außer nach letztem)
                    if (j < group.length - 1) {
                        // Zusätzliche Pause = Faktor * letterGap
                        const extraPause = charPauseFactor * timing.letterGap;
                        await Morse.wait(timing.letterGap + extraPause);
                    }
                }

                // Pause zwischen Gruppen
                await Morse.wait(pauseAfterGroup);
            }

            if (onComplete && !stopRequested) onComplete();

        } while (endless && !stopRequested);

        isRunning = false;
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
        if (callbacks.onPhaseChange) onPhaseChange = callbacks.onPhaseChange;
        if (callbacks.onCharChange) onCharChange = callbacks.onCharChange;
        if (callbacks.onGroupChange) onGroupChange = callbacks.onGroupChange;
        if (callbacks.onGroupStart) onGroupStart = callbacks.onGroupStart;
        if (callbacks.onProgress) onProgress = callbacks.onProgress;
        if (callbacks.onComplete) onComplete = callbacks.onComplete;
    }

    /**
     * Gibt die Gesamtzahl der Lektionen zurück
     * @returns {number}
     */
    function getTotalLessons() {
        return LESSONS.length;
    }

    // Public API
    return {
        KOCH_ORDER,
        LESSONS,
        getLesson,
        getCurrentLesson,
        setCurrentLesson,
        nextLesson,
        prevLesson,
        getReviewChars,
        generateGroups,
        runLesson,
        stop,
        isRunning: getIsRunning,
        setCallbacks,
        getTotalLessons
    };
})();
