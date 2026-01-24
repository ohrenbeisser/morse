/**
 * CW-Dilettant - Geben Module
 * Morse-Eingabe über Tastatur (Leertaste als Morsetaste)
 */

const Geben = (function() {
    'use strict';

    // Zustand
    let isActive = false;
    let keyDownTime = 0;
    let currentSequence = '';
    let letterTimeout = null;
    let wordTimeout = null;

    // Einstellungen
    let wpm = 20;
    let frequency = 600;
    let toneEnabled = true;

    // Audio
    let oscillator = null;
    let gainNode = null;

    // Callbacks
    let callbacks = {
        onElement: null,      // Dit oder Dah erkannt
        onChar: null,         // Zeichen dekodiert
        onWord: null,         // Wort-Pause erkannt
        onSequence: null,     // Sequenz aktualisiert
        onKeyDown: null,      // Taste gedrückt (für Oszilloskop)
        onKeyUp: null         // Taste losgelassen (für Oszilloskop)
    };

    // Umgekehrte Morse-Tabelle (Code -> Zeichen)
    const MORSE_DECODE = {
        '.-': 'A', '-...': 'B', '-.-.': 'C', '-..': 'D', '.': 'E',
        '..-.': 'F', '--.': 'G', '....': 'H', '..': 'I', '.---': 'J',
        '-.-': 'K', '.-..': 'L', '--': 'M', '-.': 'N', '---': 'O',
        '.--.': 'P', '--.-': 'Q', '.-.': 'R', '...': 'S', '-': 'T',
        '..-': 'U', '...-': 'V', '.--': 'W', '-..-': 'X', '-.--': 'Y',
        '--..': 'Z',
        '-----': '0', '.----': '1', '..---': '2', '...--': '3',
        '....-': '4', '.....': '5', '-....': '6', '--...': '7',
        '---..': '8', '----.': '9',
        '.-.-.-': '.', '--..--': ',', '..--..': '?', '.----.': "'",
        '-.-.--': '!', '-..-.': '/', '-.--.': '(', '-.--.-': ')',
        '.-...': '&', '---...': ':', '-.-.-.': ';', '-...-': '=',
        '.-.-.': '+', '-....-': '-', '..--.-': '_', '.-..-.': '"',
        '...-..-': '$', '.--.-.': '@',
        '.-.-': 'Ä', '---.': 'Ö', '..--': 'Ü', '...--..': 'ß',
        '-.--.-': 'KN', '-.-.-': 'KA', '...-.-': 'SK', '.-...': 'AS'
    };

    /**
     * Berechnet Timing-Werte basierend auf WPM
     * Nutzt Morse.calculateTiming() und fügt threshold für Dit/Dah-Unterscheidung hinzu
     * @param {number} wpmValue - Geschwindigkeit in WPM
     * @returns {Object} Timing-Werte in ms
     */
    function calculateTiming(wpmValue) {
        // Basis-Timing von Morse-Modul holen
        const timing = Morse.calculateTiming(wpmValue);
        // Schwellwert für Dit/Dah-Unterscheidung (2 Einheiten = Mitte zwischen Dit und Dah)
        timing.threshold = timing.dit * 2;
        // Alias für Kompatibilität
        timing.elementGap = timing.symbolGap;
        return timing;
    }

    /**
     * Startet das Geben-Modul
     * @param {Object} options - Einstellungen
     */
    function start(options = {}) {
        if (isActive) return;

        wpm = options.wpm || 20;
        frequency = options.frequency || 600;
        toneEnabled = options.toneEnabled !== false;

        isActive = true;
        currentSequence = '';

        // Audio-Kontext initialisieren
        if (toneEnabled) {
            initAudio();
        }

        // Event-Listener hinzufügen
        document.addEventListener('keydown', handleKeyDown);
        document.addEventListener('keyup', handleKeyUp);

        console.log('Geben gestartet - WPM:', wpm);
    }

    /**
     * Stoppt das Geben-Modul
     */
    function stop() {
        if (!isActive) return;

        isActive = false;

        // Event-Listener entfernen
        document.removeEventListener('keydown', handleKeyDown);
        document.removeEventListener('keyup', handleKeyUp);

        // Timeouts löschen
        if (letterTimeout) clearTimeout(letterTimeout);
        if (wordTimeout) clearTimeout(wordTimeout);

        // Audio stoppen
        stopTone();

        currentSequence = '';

        console.log('Geben gestoppt');
    }

    /**
     * Initialisiert den Audio-Kontext
     */
    function initAudio() {
        if (!Morse.audioContext) {
            Morse.start();
        }
    }

    /**
     * Startet den Ton
     */
    function startTone() {
        if (!toneEnabled || !Morse.audioContext) return;

        try {
            oscillator = Morse.audioContext.createOscillator();
            gainNode = Morse.audioContext.createGain();

            oscillator.type = 'sine';
            oscillator.frequency.setValueAtTime(frequency, Morse.audioContext.currentTime);

            gainNode.gain.setValueAtTime(0.5, Morse.audioContext.currentTime);

            oscillator.connect(gainNode);
            gainNode.connect(Morse.audioContext.destination);

            oscillator.start();
        } catch (e) {
            console.warn('Audio-Fehler:', e);
        }
    }

    /**
     * Stoppt den Ton
     */
    function stopTone() {
        if (oscillator) {
            try {
                oscillator.stop();
                oscillator.disconnect();
            } catch (e) {
                // Ignorieren
            }
            oscillator = null;
        }
        if (gainNode) {
            try {
                gainNode.disconnect();
            } catch (e) {
                // Ignorieren
            }
            gainNode = null;
        }
    }

    /**
     * Handler für Taste gedrückt
     * @param {KeyboardEvent} e
     */
    function handleKeyDown(e) {
        // Nur Leertaste
        if (e.code !== 'Space') return;

        // Verhindern, dass die Seite scrollt
        e.preventDefault();

        // Ignorieren wenn bereits gedrückt (Key-Repeat)
        if (keyDownTime > 0) return;

        // Zeit merken
        keyDownTime = performance.now();

        // Timeouts löschen (wir tippen noch)
        if (letterTimeout) clearTimeout(letterTimeout);
        if (wordTimeout) clearTimeout(wordTimeout);

        // Ton starten
        startTone();

        // Callback für Oszilloskop
        if (callbacks.onKeyDown) callbacks.onKeyDown();
    }

    /**
     * Handler für Taste losgelassen
     * @param {KeyboardEvent} e
     */
    function handleKeyUp(e) {
        // Nur Leertaste
        if (e.code !== 'Space') return;

        e.preventDefault();

        if (keyDownTime === 0) return;

        // Dauer berechnen
        const duration = performance.now() - keyDownTime;
        keyDownTime = 0;

        // Ton stoppen
        stopTone();

        // Callback für Oszilloskop
        if (callbacks.onKeyUp) callbacks.onKeyUp();

        // Dit oder Dah?
        const timing = calculateTiming(wpm);
        const element = duration < timing.threshold ? '.' : '-';

        // Zur Sequenz hinzufügen
        currentSequence += element;

        // Callback
        if (callbacks.onElement) {
            callbacks.onElement(element, duration);
        }
        if (callbacks.onSequence) {
            callbacks.onSequence(currentSequence);
        }

        // Timer für Buchstaben-Ende setzen
        letterTimeout = setTimeout(() => {
            decodeLetter();
        }, timing.letterGap);

        // Timer für Wort-Ende setzen
        wordTimeout = setTimeout(() => {
            if (callbacks.onWord) {
                callbacks.onWord();
            }
        }, timing.wordGap);
    }

    /**
     * Dekodiert die aktuelle Sequenz zu einem Buchstaben
     */
    function decodeLetter() {
        if (currentSequence === '') return;

        const char = MORSE_DECODE[currentSequence] || '?';

        if (callbacks.onChar) {
            callbacks.onChar(char, currentSequence);
        }

        // Sequenz zurücksetzen
        currentSequence = '';

        if (callbacks.onSequence) {
            callbacks.onSequence('');
        }
    }

    /**
     * Setzt die Callbacks
     * @param {Object} cbs - Callback-Funktionen
     */
    function setCallbacks(cbs) {
        if (cbs.onElement) callbacks.onElement = cbs.onElement;
        if (cbs.onChar) callbacks.onChar = cbs.onChar;
        if (cbs.onWord) callbacks.onWord = cbs.onWord;
        if (cbs.onSequence) callbacks.onSequence = cbs.onSequence;
        if (cbs.onKeyDown) callbacks.onKeyDown = cbs.onKeyDown;
        if (cbs.onKeyUp) callbacks.onKeyUp = cbs.onKeyUp;
    }

    /**
     * Gibt zurück ob das Modul aktiv ist
     * @returns {boolean}
     */
    function getIsActive() {
        return isActive;
    }

    /**
     * Gibt die aktuelle Sequenz zurück
     * @returns {string}
     */
    function getSequence() {
        return currentSequence;
    }

    /**
     * Setzt die Sequenz zurück
     */
    function resetSequence() {
        currentSequence = '';
        if (letterTimeout) clearTimeout(letterTimeout);
        if (wordTimeout) clearTimeout(wordTimeout);
    }

    /**
     * Aktiviert/Deaktiviert den Ton
     * @param {boolean} enabled
     */
    function setToneEnabled(enabled) {
        toneEnabled = enabled;
        if (!enabled) {
            stopTone();
        }
    }

    /**
     * Simuliert Taste gedrückt (für Touch-Eingabe)
     */
    function simulateKeyDown() {
        if (!isActive) return;
        if (keyDownTime > 0) return; // Bereits gedrückt

        keyDownTime = performance.now();

        if (letterTimeout) clearTimeout(letterTimeout);
        if (wordTimeout) clearTimeout(wordTimeout);

        startTone();

        if (callbacks.onKeyDown) callbacks.onKeyDown();
    }

    /**
     * Simuliert Taste losgelassen (für Touch-Eingabe)
     */
    function simulateKeyUp() {
        if (!isActive) return;
        if (keyDownTime === 0) return; // War nicht gedrückt

        const duration = performance.now() - keyDownTime;
        keyDownTime = 0;

        stopTone();

        if (callbacks.onKeyUp) callbacks.onKeyUp();

        // Dit oder Dah?
        const timing = calculateTiming(wpm);
        const element = duration < timing.threshold ? '.' : '-';

        currentSequence += element;

        if (callbacks.onElement) {
            callbacks.onElement(element, duration);
        }
        if (callbacks.onSequence) {
            callbacks.onSequence(currentSequence);
        }

        letterTimeout = setTimeout(() => {
            decodeLetter();
        }, timing.letterGap);

        wordTimeout = setTimeout(() => {
            if (callbacks.onWord) {
                callbacks.onWord();
            }
        }, timing.wordGap);
    }

    // Public API
    return {
        start,
        stop,
        setCallbacks,
        setToneEnabled,
        simulateKeyDown,
        simulateKeyUp,
        isActive: getIsActive,
        getSequence,
        resetSequence,
        calculateTiming,
        MORSE_DECODE
    };
})();
