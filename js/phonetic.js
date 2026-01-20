/**
 * CW-Dilettant - Phonetic Alphabets
 * NATO und Deutsche Buchstabiertafel
 */

const Phonetic = (function() {
    'use strict';

    // NATO Alphabet (International)
    const NATO = {
        'A': 'Alpha',
        'B': 'Bravo',
        'C': 'Charlie',
        'D': 'Delta',
        'E': 'Echo',
        'F': 'Foxtrot',
        'G': 'Golf',
        'H': 'Hotel',
        'I': 'India',
        'J': 'Juliet',
        'K': 'Kilo',
        'L': 'Lima',
        'M': 'Mike',
        'N': 'November',
        'O': 'Oscar',
        'P': 'Papa',
        'Q': 'Quebec',
        'R': 'Romeo',
        'S': 'Sierra',
        'T': 'Tango',
        'U': 'Uniform',
        'V': 'Victor',
        'W': 'Whiskey',
        'X': 'X-Ray',
        'Y': 'Yankee',
        'Z': 'Zulu',
        '0': 'Zero',
        '1': 'One',
        '2': 'Two',
        '3': 'Three',
        '4': 'Four',
        '5': 'Five',
        '6': 'Six',
        '7': 'Seven',
        '8': 'Eight',
        '9': 'Nine',
        '.': 'Point',
        ',': 'Comma',
        '?': 'Question',
        '/': 'Slash',
        '=': 'Equals',
        '-': 'Dash'
    };

    // Deutsche Buchstabiertafel
    const GERMAN = {
        'A': 'Anton',
        'B': 'Berta',
        'C': 'Cäsar',
        'D': 'Dora',
        'E': 'Emil',
        'F': 'Friedrich',
        'G': 'Gustav',
        'H': 'Heinrich',
        'I': 'Ida',
        'J': 'Julius',
        'K': 'Kaufmann',
        'L': 'Ludwig',
        'M': 'Martha',
        'N': 'Nordpol',
        'O': 'Otto',
        'P': 'Paula',
        'Q': 'Quelle',
        'R': 'Richard',
        'S': 'Samuel',
        'T': 'Theodor',
        'U': 'Ulrich',
        'V': 'Viktor',
        'W': 'Wilhelm',
        'X': 'Xanthippe',
        'Y': 'Ypsilon',
        'Z': 'Zacharias',
        '0': 'Null',
        '1': 'Eins',
        '2': 'Zwei',
        '3': 'Drei',
        '4': 'Vier',
        '5': 'Fünf',
        '6': 'Sechs',
        '7': 'Sieben',
        '8': 'Acht',
        '9': 'Neun',
        '.': 'Punkt',
        ',': 'Komma',
        '?': 'Fragezeichen',
        '/': 'Schrägstrich',
        '=': 'Gleich',
        '-': 'Bindestrich'
    };

    /**
     * Gibt das phonetische Wort für ein Zeichen zurück
     * @param {string} char - Das Zeichen
     * @param {string} lang - Sprache ('en' für NATO, 'de' für Deutsch)
     * @returns {string} Phonetisches Wort
     */
    function get(char, lang = 'en') {
        const upperChar = char.toUpperCase();
        const alphabet = lang === 'de' ? GERMAN : NATO;
        return alphabet[upperChar] || upperChar;
    }

    /**
     * Gibt das phonetische Wort und die Sprache für die Sprachausgabe zurück
     * A-Z werden immer in Englisch (NATO) angesagt, alles andere in Deutsch
     * @param {string} char - Das Zeichen
     * @returns {Object} { word: string, lang: 'en'|'de' }
     */
    function getForSpeech(char) {
        const upperChar = char.toUpperCase();

        // A-Z: NATO-Alphabet in Englisch
        if (upperChar >= 'A' && upperChar <= 'Z') {
            return {
                word: NATO[upperChar],
                lang: 'en'
            };
        }

        // Alles andere (Zahlen, Sonderzeichen): Deutsch
        return {
            word: GERMAN[upperChar] || upperChar,
            lang: 'de'
        };
    }

    /**
     * Gibt das gesamte Alphabet zurück
     * @param {string} lang - Sprache ('en' für NATO, 'de' für Deutsch)
     * @returns {Object} Alphabet-Objekt
     */
    function getAlphabet(lang = 'en') {
        return lang === 'de' ? { ...GERMAN } : { ...NATO };
    }

    /**
     * Prüft, ob ein Zeichen im Alphabet vorhanden ist
     * @param {string} char - Das Zeichen
     * @returns {boolean}
     */
    function hasChar(char) {
        return char.toUpperCase() in NATO;
    }

    // Public API
    return {
        get,
        getForSpeech,
        getAlphabet,
        hasChar,
        NATO,
        GERMAN
    };
})();
