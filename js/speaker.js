/**
 * CW-Dilettant - Speaker Module
 * Web Speech API Wrapper für Text-to-Speech
 */

const Speaker = (function() {
    'use strict';

    // Synthesis Objekt
    const synth = window.speechSynthesis;

    // Verfügbare Stimmen
    let voices = [];
    let voicesLoaded = false;

    // Aktuelle Utterance
    let currentUtterance = null;

    /**
     * Lädt die verfügbaren Stimmen
     * @returns {Promise<SpeechSynthesisVoice[]>}
     */
    function loadVoices() {
        return new Promise((resolve) => {
            if (voicesLoaded && voices.length > 0) {
                resolve(voices);
                return;
            }

            voices = synth.getVoices();
            if (voices.length > 0) {
                voicesLoaded = true;
                resolve(voices);
                return;
            }

            // Warten auf voiceschanged Event
            synth.addEventListener('voiceschanged', () => {
                voices = synth.getVoices();
                voicesLoaded = true;
                resolve(voices);
            }, { once: true });

            // Timeout fallback
            setTimeout(() => {
                voices = synth.getVoices();
                voicesLoaded = true;
                resolve(voices);
            }, 1000);
        });
    }

    /**
     * Findet die beste Stimme für eine Sprache
     * @param {string} lang - Sprachcode ('en' oder 'de')
     * @returns {SpeechSynthesisVoice|null}
     */
    function findVoice(lang) {
        const langCode = lang === 'de' ? 'de' : 'en';

        // Priorität: 1. Exakte Übereinstimmung, 2. Sprache beginnt mit Code
        let voice = voices.find(v => v.lang.toLowerCase().startsWith(langCode));

        // Fallback: Erste verfügbare Stimme
        if (!voice && voices.length > 0) {
            voice = voices[0];
        }

        return voice;
    }

    /**
     * Spricht einen Text
     * @param {string} text - Der zu sprechende Text
     * @param {string} lang - Sprache ('en' oder 'de')
     * @returns {Promise}
     */
    async function speak(text, lang = 'en') {
        // Sicherstellen dass Stimmen geladen sind
        await loadVoices();

        return new Promise((resolve, reject) => {
            // Vorherige Ausgabe abbrechen
            if (synth.speaking) {
                synth.cancel();
            }

            const utterance = new SpeechSynthesisUtterance(text);
            currentUtterance = utterance;

            // Stimme setzen
            const voice = findVoice(lang);
            if (voice) {
                utterance.voice = voice;
            }

            // Sprache setzen
            utterance.lang = lang === 'de' ? 'de-DE' : 'en-US';

            // Parameter
            utterance.rate = 0.9;   // Etwas langsamer
            utterance.pitch = 1.0;
            utterance.volume = 1.0;

            // Events
            utterance.onend = () => {
                currentUtterance = null;
                resolve();
            };

            utterance.onerror = (event) => {
                currentUtterance = null;
                // Nur bei echten Fehlern rejecten, nicht bei cancel
                if (event.error !== 'canceled' && event.error !== 'interrupted') {
                    console.warn('Speech error:', event.error);
                }
                resolve(); // Trotzdem resolven um Flow nicht zu unterbrechen
            };

            // Sprechen starten
            synth.speak(utterance);
        });
    }

    /**
     * Stoppt die aktuelle Sprachausgabe
     */
    function stop() {
        if (synth.speaking) {
            synth.cancel();
        }
        currentUtterance = null;
    }

    /**
     * Prüft ob gerade gesprochen wird
     * @returns {boolean}
     */
    function isSpeaking() {
        return synth.speaking;
    }

    /**
     * Prüft ob Speech Synthesis unterstützt wird
     * @returns {boolean}
     */
    function isSupported() {
        return 'speechSynthesis' in window;
    }

    /**
     * Gibt alle verfügbaren Stimmen zurück
     * @returns {Promise<SpeechSynthesisVoice[]>}
     */
    async function getVoices() {
        await loadVoices();
        return voices;
    }

    /**
     * Gibt Stimmen für eine bestimmte Sprache zurück
     * @param {string} lang - Sprachcode
     * @returns {Promise<SpeechSynthesisVoice[]>}
     */
    async function getVoicesForLang(lang) {
        await loadVoices();
        const langCode = lang === 'de' ? 'de' : 'en';
        return voices.filter(v => v.lang.toLowerCase().startsWith(langCode));
    }

    // Stimmen beim Laden vorbereiten
    if (isSupported()) {
        loadVoices();
    }

    // Public API
    return {
        speak,
        stop,
        isSpeaking,
        isSupported,
        getVoices,
        getVoicesForLang,
        loadVoices
    };
})();
