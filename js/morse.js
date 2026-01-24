/**
 * CW-Dilettant - Morse Code Module
 * Morse-Code Definitionen und Web Audio API Generator
 */

const Morse = (function() {
    'use strict';

    // Morse-Code Tabelle
    const CODE = {
        'A': '.-',
        'B': '-...',
        'C': '-.-.',
        'D': '-..',
        'E': '.',
        'F': '..-.',
        'G': '--.',
        'H': '....',
        'I': '..',
        'J': '.---',
        'K': '-.-',
        'L': '.-..',
        'M': '--',
        'N': '-.',
        'O': '---',
        'P': '.--.',
        'Q': '--.-',
        'R': '.-.',
        'S': '...',
        'T': '-',
        'U': '..-',
        'V': '...-',
        'W': '.--',
        'X': '-..-',
        'Y': '-.--',
        'Z': '--..',
        '0': '-----',
        '1': '.----',
        '2': '..---',
        '3': '...--',
        '4': '....-',
        '5': '.....',
        '6': '-....',
        '7': '--...',
        '8': '---..',
        '9': '----.',
        '.': '.-.-.-',
        ',': '--..--',
        '?': '..--..',
        '/': '-..-.',
        '=': '-...-',
        '-': '-....-'
    };

    // Audio Context (lazy initialization)
    let audioContext = null;
    let gainNode = null;

    // Aktuelle Wiedergabe
    let isPlaying = false;
    let stopRequested = false;
    let currentOscillator = null;

    /**
     * Initialisiert den Audio Context
     */
    function initAudio() {
        if (!audioContext) {
            audioContext = new (window.AudioContext || window.webkitAudioContext)();
            gainNode = audioContext.createGain();
            gainNode.connect(audioContext.destination);
            gainNode.gain.value = 0.5;
        }
        // Resume falls suspended (Browser-Policy)
        if (audioContext.state === 'suspended') {
            audioContext.resume();
        }
    }

    /**
     * Berechnet Timing-Werte basierend auf WPM (mit Farnsworth-Unterstützung)
     * @param {number} wpm - Words per minute (Zeichen-Geschwindigkeit)
     * @param {number} effWpm - Effektive WPM (Farnsworth, für Pausen)
     * @returns {Object} Timing-Werte in Millisekunden
     */
    function calculateTiming(wpm, effWpm = null) {
        // PARIS-Standard: 50 Einheiten pro Wort
        // 1 Einheit = 1200ms / WPM
        const unit = 1200 / wpm;

        // Farnsworth: Pausen mit effWpm berechnen (wenn effWpm < wpm)
        const pauseUnit = (effWpm && effWpm < wpm) ? (1200 / effWpm) : unit;

        return {
            dit: unit,                  // Punkt: 1 Einheit (immer mit wpm)
            dah: unit * 3,              // Strich: 3 Einheiten (immer mit wpm)
            symbolGap: unit,            // Pause zwischen Symbolen: 1 Einheit (immer mit wpm)
            letterGap: pauseUnit * 3,   // Pause zwischen Buchstaben: 3 Einheiten (mit effWpm)
            wordGap: pauseUnit * 7      // Pause zwischen Wörtern: 7 Einheiten (mit effWpm)
        };
    }

    /**
     * Spielt einen einzelnen Ton ab
     * @param {number} frequency - Frequenz in Hz
     * @param {number} duration - Dauer in Millisekunden
     * @returns {Promise}
     */
    function playTone(frequency, duration) {
        return new Promise((resolve) => {
            if (stopRequested) {
                resolve();
                return;
            }

            initAudio();

            const oscillator = audioContext.createOscillator();
            currentOscillator = oscillator;

            oscillator.type = 'sine';
            oscillator.frequency.value = frequency;

            // Sanftes Ein-/Ausblenden (vermeidet Klicks)
            const envelope = audioContext.createGain();
            envelope.gain.value = 0;
            envelope.connect(gainNode);
            oscillator.connect(envelope);

            const now = audioContext.currentTime;
            const rampTime = 0.005; // 5ms Rampe

            envelope.gain.setValueAtTime(0, now);
            envelope.gain.linearRampToValueAtTime(1, now + rampTime);
            envelope.gain.setValueAtTime(1, now + duration / 1000 - rampTime);
            envelope.gain.linearRampToValueAtTime(0, now + duration / 1000);

            oscillator.start(now);
            oscillator.stop(now + duration / 1000);

            oscillator.onended = () => {
                currentOscillator = null;
                resolve();
            };
        });
    }

    /**
     * Wartet für eine bestimmte Zeit
     * @param {number} ms - Millisekunden
     * @returns {Promise}
     */
    function wait(ms) {
        return new Promise((resolve) => {
            if (stopRequested) {
                resolve();
                return;
            }
            setTimeout(resolve, ms);
        });
    }

    /**
     * Gibt den Morse-Code für ein Zeichen zurück
     * @param {string} char - Das Zeichen
     * @returns {string} Morse-Code (. und -)
     */
    function getCode(char) {
        return CODE[char.toUpperCase()] || '';
    }

    /**
     * Spielt ein einzelnes Zeichen ab
     * @param {string} char - Das Zeichen
     * @param {Object} options - Optionen (wpm, effWpm, frequency, pitchOffset)
     * @returns {Promise}
     */
    async function playChar(char, options = {}) {
        const { wpm = 20, effWpm = null, frequency = 600, pitchOffset = 0 } = options;
        const code = getCode(char);
        const timing = calculateTiming(wpm, effWpm);

        if (!code || stopRequested) return;

        for (let i = 0; i < code.length; i++) {
            if (stopRequested) break;

            const symbol = code[i];
            const duration = symbol === '.' ? timing.dit : timing.dah;

            // Tonhöhen-Offset: Dit höher, Dah tiefer für bessere Unterscheidbarkeit
            // Dies ist eine Lernhilfe - erfahrene Funker nutzen keinen Offset
            // Positive Werte: Dit wird höher, Dah tiefer (empfohlen für Anfänger)
            const freq = symbol === '.'
                ? frequency + pitchOffset
                : frequency - pitchOffset;

            await playTone(freq, duration);

            // Pause zwischen Symbolen (außer nach letztem)
            if (i < code.length - 1) {
                await wait(timing.symbolGap);
            }
        }
    }

    /**
     * Spielt ein Zeichen mehrfach ab MIT Pause dazwischen
     * @param {string} char - Das Zeichen
     * @param {number} repetitions - Anzahl Wiederholungen
     * @param {number} pauseMs - Pause zwischen Wiederholungen in ms
     * @param {Object} options - Optionen (wpm, frequency)
     * @returns {Promise}
     */
    async function playCharWithPause(char, repetitions, pauseMs, options = {}) {
        for (let i = 0; i < repetitions; i++) {
            if (stopRequested) break;
            await playChar(char, options);
            if (i < repetitions - 1) {
                await wait(pauseMs);
            }
        }
    }

    /**
     * Spielt ein Zeichen mehrfach ab OHNE Pause dazwischen
     * @param {string} char - Das Zeichen
     * @param {number} repetitions - Anzahl Wiederholungen
     * @param {Object} options - Optionen (wpm, effWpm, frequency, pitchOffset)
     * @returns {Promise}
     */
    async function playCharNoPause(char, repetitions, options = {}) {
        const { wpm = 20, effWpm = null } = options;
        const timing = calculateTiming(wpm, effWpm);

        for (let i = 0; i < repetitions; i++) {
            if (stopRequested) break;
            await playChar(char, options);
            if (i < repetitions - 1) {
                await wait(timing.letterGap); // Pause zwischen Zeichen: 3 Einheiten
            }
        }
    }

    /**
     * Spielt eine Gruppe von Zeichen ab
     * @param {string[]} chars - Array von Zeichen
     * @param {Object} options - Optionen (wpm, effWpm, frequency, pitchOffset)
     * @returns {Promise}
     */
    async function playGroup(chars, options = {}) {
        const { wpm = 20, effWpm = null } = options;
        const timing = calculateTiming(wpm, effWpm);

        for (let i = 0; i < chars.length; i++) {
            if (stopRequested) break;
            await playChar(chars[i], options);
            if (i < chars.length - 1) {
                await wait(timing.letterGap);
            }
        }
    }

    /**
     * Spielt einen Text ab
     * @param {string} text - Der Text
     * @param {Object} options - Optionen (wpm, frequency)
     * @returns {Promise}
     */
    async function playText(text, options = {}) {
        const { wpm = 20 } = options;
        const timing = calculateTiming(wpm);
        const chars = text.toUpperCase().split('');

        for (let i = 0; i < chars.length; i++) {
            if (stopRequested) break;

            const char = chars[i];

            if (char === ' ') {
                await wait(timing.wordGap);
            } else if (CODE[char]) {
                await playChar(char, options);
                if (i < chars.length - 1 && chars[i + 1] !== ' ') {
                    await wait(timing.letterGap);
                }
            }
        }
    }

    /**
     * Startet die Wiedergabe
     */
    function start() {
        isPlaying = true;
        stopRequested = false;
        initAudio();
    }

    /**
     * Stoppt die Wiedergabe
     */
    function stop() {
        stopRequested = true;
        isPlaying = false;

        // Aktuellen Oszillator sofort stoppen
        if (currentOscillator) {
            try {
                currentOscillator.stop();
            } catch (e) {
                // Ignorieren falls bereits gestoppt
            }
            currentOscillator = null;
        }
    }

    /**
     * Setzt die Lautstärke
     * @param {number} volume - Lautstärke (0-1)
     */
    function setVolume(volume) {
        if (gainNode) {
            gainNode.gain.value = Math.max(0, Math.min(1, volume));
        }
    }

    /**
     * Prüft ob gerade abgespielt wird
     * @returns {boolean}
     */
    function getIsPlaying() {
        return isPlaying;
    }

    /**
     * Prüft ob Stop angefordert wurde
     * @returns {boolean}
     */
    function isStopped() {
        return stopRequested;
    }

    // Public API
    return {
        CODE,
        getCode,
        calculateTiming,
        playTone,
        playChar,
        playCharWithPause,
        playCharNoPause,
        playGroup,
        playText,
        start,
        stop,
        setVolume,
        isPlaying: getIsPlaying,
        isStopped,
        wait,
        get audioContext() { return audioContext; }
    };
})();
