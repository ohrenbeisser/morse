/**
 * CW-Dilettant - Main Application
 * Initialisierung und Event-Handling
 */

const App = (function() {
    'use strict';

    // Wake Lock für Display
    let wakeLock = null;

    // DOM Elements
    let menuBtn;
    let navDrawer;
    let navOverlay;
    let navItems;
    let actionCards;
    let tabs;
    let settingInputs;

    // Hören-Seite Elemente
    let hoerenElements;

    // Erkennen-Seite Elemente
    let erkennenElements;

    // Geben-Seite Elemente
    let gebenElements;

    // Geben: Eingegebener Text
    let gebenOutputText = '';

    // Geben: Ton aktiviert
    let gebenToneEnabled = true;

    // Speicher für aktuelle Gruppenzeichen
    let currentGroupChars = [];

    // Erkennen: Fehleranzahl
    let erkErrorCount = 0;

    /**
     * Initialisiert die App
     */
    function init() {
        // DOM Elemente cachen
        cacheElements();

        // Event Listener registrieren
        bindEvents();

        // Router initialisieren
        Router.init();

        // Einstellungen laden und anwenden
        loadSettings();

        // Statistik anzeigen
        updateStatsDisplay();

        // Hören-Modul initialisieren
        initHoeren();

        // Erkennen-Modul initialisieren
        initErkennen();

        // Geben-Modul initialisieren
        initGeben();

        // Service Worker registrieren
        registerServiceWorker();

        console.log('CW-Dilettant initialisiert');
    }

    /**
     * Cached DOM-Elemente für bessere Performance
     */
    function cacheElements() {
        menuBtn = document.getElementById('menuBtn');
        navDrawer = document.getElementById('navDrawer');
        navOverlay = document.getElementById('navOverlay');
        navItems = document.querySelectorAll('.nav-item');
        actionCards = document.querySelectorAll('.action-card');
        tabs = document.querySelectorAll('.tab');

        // Einstellungs-Elemente
        settingInputs = {
            // Allgemein
            darkMode: document.getElementById('settingDarkMode'),
            // CW-Parameter
            wpm: document.getElementById('settingWpm'),
            frequency: document.getElementById('settingFreq'),
            letters: document.getElementById('settingLetters'),
            numbers: document.getElementById('settingNumbers'),
            special: document.getElementById('settingSpecial'),
            // Aussprache
            phoneticLang: document.getElementById('settingPhoneticLang'),
            announce: document.getElementById('settingAnnounce'),
            // Hören
            repsWithPause: document.getElementById('settingRepsWithPause'),
            repsNoPause: document.getElementById('settingRepsNoPause'),
            pauseBetween: document.getElementById('settingPauseBetween'),
            groupSize: document.getElementById('settingGroupSize'),
            numGroups: document.getElementById('settingNumGroups'),
            pauseAfterGroup: document.getElementById('settingPauseAfterGroup'),
            newCharWeight: document.getElementById('settingNewCharWeight'),
            reviewLessons: document.getElementById('settingReviewLessons'),
            charPauseFactor: document.getElementById('settingCharPauseFactor'),
            endless: document.getElementById('settingEndless'),
            announceGroups: document.getElementById('settingAnnounceGroups'),
            // Erkennen-Einstellungen
            erkGroupSize: document.getElementById('settingErkGroupSize'),
            erkNumGroups: document.getElementById('settingErkNumGroups'),
            erkPauseAfterGroup: document.getElementById('settingErkPauseAfterGroup'),
            erkInstantFeedback: document.getElementById('settingErkInstantFeedback')
        };

        // Hören-Seite Elemente
        hoerenElements = {
            prevLesson: document.getElementById('prevLesson'),
            nextLesson: document.getElementById('nextLesson'),
            lessonNumber: document.getElementById('lessonNumber'),
            lessonChars: document.getElementById('lessonChars'),
            charDisplay: document.getElementById('charDisplay'),
            charLetter: document.getElementById('charLetter'),
            charMorse: document.getElementById('charMorse'),
            charPhonetic: document.getElementById('charPhonetic'),
            phaseLabel: document.getElementById('phaseLabel'),
            progressFill: document.getElementById('progressFill'),
            progressText: document.getElementById('progressText'),
            groupDisplay: document.getElementById('groupDisplay'),
            groupChars: document.getElementById('groupChars'),
            btnStart: document.getElementById('btnStart'),
            btnStop: document.getElementById('btnStop')
        };

        // Erkennen-Seite Elemente
        erkennenElements = {
            modeKeyboard: document.getElementById('erkModeKeyboard'),
            modePaper: document.getElementById('erkModePaper'),
            prevLesson: document.getElementById('erkPrevLesson'),
            nextLesson: document.getElementById('erkNextLesson'),
            lessonNumber: document.getElementById('erkLessonNumber'),
            lessonChars: document.getElementById('erkLessonChars'),
            phaseLabel: document.getElementById('erkPhaseLabel'),
            progressFill: document.getElementById('erkProgressFill'),
            progressText: document.getElementById('erkProgressText'),
            keyboardView: document.getElementById('erkKeyboardView'),
            paperView: document.getElementById('erkPaperView'),
            input: document.getElementById('erkInput'),
            inputFeedback: document.getElementById('erkInputFeedback'),
            solutionCard: document.getElementById('erkSolutionCard'),
            solutionList: document.getElementById('erkSolutionList'),
            speakSolution: document.getElementById('erkSpeakSolution'),
            errorCard: document.getElementById('erkErrorCard'),
            errorCount: document.getElementById('erkErrorCount'),
            errorStats: document.getElementById('erkErrorStats'),
            errorMinus: document.getElementById('erkErrorMinus'),
            errorPlus: document.getElementById('erkErrorPlus'),
            saveErrors: document.getElementById('erkSaveErrors'),
            resultCard: document.getElementById('erkResultCard'),
            resultIcon: document.getElementById('erkResultIcon'),
            resultPercent: document.getElementById('erkResultPercent'),
            resultText: document.getElementById('erkResultText'),
            newRound: document.getElementById('erkNewRound'),
            btnStart: document.getElementById('erkBtnStart'),
            btnStop: document.getElementById('erkBtnStop')
        };

        // Geben-Seite Elemente
        gebenElements = {
            sequence: document.getElementById('gebenSequence'),
            char: document.getElementById('gebenChar'),
            output: document.getElementById('gebenOutput'),
            clearBtn: document.getElementById('gebenClear'),
            toneToggle: document.getElementById('gebenToneToggle'),
            btnStart: document.getElementById('gebenBtnStart'),
            btnStop: document.getElementById('gebenBtnStop'),
            scope: document.getElementById('gebenScope')
        };
    }

    /**
     * Bindet alle Event Listener
     */
    function bindEvents() {
        // Hamburger Menu
        menuBtn.addEventListener('click', openDrawer);
        navOverlay.addEventListener('click', closeDrawer);

        // Navigation Items
        navItems.forEach(item => {
            item.addEventListener('click', (e) => {
                e.preventDefault();
                const page = item.dataset.page;
                Router.navigateTo(page);
                closeDrawer();
            });
        });

        // Action Cards (Home)
        actionCards.forEach(card => {
            card.addEventListener('click', () => {
                const page = card.dataset.navigate;
                Router.navigateTo(page);
            });
        });

        // Tabs (Einstellungen)
        tabs.forEach(tab => {
            tab.addEventListener('click', () => {
                switchTab(tab.dataset.tab);
            });
        });

        // Einstellungen Event Listener
        bindSettingsEvents();

        // Hören Event Listener
        bindHoerenEvents();

        // Erkennen Event Listener
        bindErkennenEvents();

        // Geben Event Listener
        bindGebenEvents();

        // Keyboard Navigation für Drawer
        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape') {
                if (navDrawer.classList.contains('open')) {
                    closeDrawer();
                }
                // Stop bei Escape auf Hören-Seite
                if (Koch.isRunning()) {
                    stopHoeren();
                }
                // Stop bei Escape auf Erkennen-Seite
                if (Erkennen.isRunning()) {
                    stopErkennen();
                }
                // Stop bei Escape auf Geben-Seite
                if (Geben.isActive()) {
                    stopGeben();
                }
            }
        });

        // Swipe Gesture für Drawer (Touch)
        let touchStartX = 0;
        let touchEndX = 0;

        document.addEventListener('touchstart', (e) => {
            touchStartX = e.changedTouches[0].screenX;
        }, { passive: true });

        document.addEventListener('touchend', (e) => {
            touchEndX = e.changedTouches[0].screenX;
            handleSwipe();
        }, { passive: true });

        function handleSwipe() {
            const swipeThreshold = 50;
            const swipeDistance = touchEndX - touchStartX;

            // Swipe von links nach rechts (Drawer öffnen)
            if (touchStartX < 30 && swipeDistance > swipeThreshold) {
                openDrawer();
            }
            // Swipe von rechts nach links (Drawer schließen)
            if (navDrawer.classList.contains('open') && swipeDistance < -swipeThreshold) {
                closeDrawer();
            }
        }

        // Wake Lock bei Tab-Wechsel reaktivieren
        document.addEventListener('visibilitychange', handleVisibilityChange);
    }

    /**
     * Bindet Event Listener für Einstellungen
     */
    function bindSettingsEvents() {
        // Dark Mode Toggle
        settingInputs.darkMode.addEventListener('change', (e) => {
            setDarkMode(e.target.checked);
            Storage.saveSetting('darkMode', e.target.checked);
        });

        // WPM Slider
        settingInputs.wpm.addEventListener('input', (e) => {
            const value = parseInt(e.target.value);
            document.getElementById('wpmValue').textContent = value;
            Storage.saveSetting('wpm', value);
        });

        // Frequenz Slider
        settingInputs.frequency.addEventListener('input', (e) => {
            const value = parseInt(e.target.value);
            document.getElementById('freqValue').textContent = value;
            Storage.saveSetting('frequency', value);
        });

        // Zeichensatz Checkboxen
        settingInputs.letters.addEventListener('change', (e) => {
            Storage.saveSetting('letters', e.target.checked);
        });

        settingInputs.numbers.addEventListener('change', (e) => {
            Storage.saveSetting('numbers', e.target.checked);
        });

        settingInputs.special.addEventListener('change', (e) => {
            Storage.saveSetting('special', e.target.checked);
        });

        // Aussprache-Sprache
        settingInputs.phoneticLang.addEventListener('change', (e) => {
            Storage.saveSetting('phoneticLang', e.target.value);
        });

        // Ansage Toggle
        settingInputs.announce.addEventListener('change', (e) => {
            Storage.saveSetting('announce', e.target.checked);
        });

        // Hören-Einstellungen
        settingInputs.repsWithPause.addEventListener('input', (e) => {
            const value = parseInt(e.target.value);
            document.getElementById('repsWithPauseValue').textContent = value;
            Storage.saveSetting('repetitionsWithPause', value);
        });

        settingInputs.repsNoPause.addEventListener('input', (e) => {
            const value = parseInt(e.target.value);
            document.getElementById('repsNoPauseValue').textContent = value;
            Storage.saveSetting('repetitionsNoPause', value);
        });

        settingInputs.pauseBetween.addEventListener('input', (e) => {
            const value = parseInt(e.target.value);
            document.getElementById('pauseBetweenValue').textContent = value;
            Storage.saveSetting('pauseBetweenReps', value);
        });

        settingInputs.groupSize.addEventListener('input', (e) => {
            const value = parseInt(e.target.value);
            document.getElementById('groupSizeValue').textContent = value;
            Storage.saveSetting('groupSize', value);
        });

        settingInputs.numGroups.addEventListener('input', (e) => {
            const value = parseInt(e.target.value);
            document.getElementById('numGroupsValue').textContent = value;
            Storage.saveSetting('numGroups', value);
        });

        settingInputs.pauseAfterGroup.addEventListener('input', (e) => {
            const value = parseInt(e.target.value);
            document.getElementById('pauseAfterGroupValue').textContent = (value / 1000).toFixed(1);
            Storage.saveSetting('pauseAfterGroup', value);
        });

        settingInputs.newCharWeight.addEventListener('input', (e) => {
            const value = parseInt(e.target.value);
            document.getElementById('newCharWeightValue').textContent = value;
            Storage.saveSetting('newCharWeight', value);
        });

        settingInputs.reviewLessons.addEventListener('input', (e) => {
            const value = parseInt(e.target.value);
            document.getElementById('reviewLessonsValue').textContent = value;
            Storage.saveSetting('reviewLessons', value);
        });

        settingInputs.charPauseFactor.addEventListener('input', (e) => {
            const value = parseFloat(e.target.value);
            document.getElementById('charPauseFactorValue').textContent = value;
            Storage.saveSetting('charPauseFactor', value);
        });

        settingInputs.endless.addEventListener('change', (e) => {
            Storage.saveSetting('endless', e.target.checked);
        });

        settingInputs.announceGroups.addEventListener('change', (e) => {
            Storage.saveSetting('announceGroups', e.target.checked);
        });

        // Erkennen-Einstellungen
        settingInputs.erkGroupSize.addEventListener('input', (e) => {
            const value = parseInt(e.target.value);
            document.getElementById('erkGroupSizeValue').textContent = value;
            Storage.saveSetting('erkennenGroupSize', value);
        });

        settingInputs.erkNumGroups.addEventListener('input', (e) => {
            const value = parseInt(e.target.value);
            document.getElementById('erkNumGroupsValue').textContent = value;
            Storage.saveSetting('erkennenNumGroups', value);
        });

        settingInputs.erkPauseAfterGroup.addEventListener('input', (e) => {
            const value = parseInt(e.target.value);
            document.getElementById('erkPauseAfterGroupValue').textContent = (value / 1000).toFixed(1);
            Storage.saveSetting('erkennenPauseAfterGroup', value);
        });

        settingInputs.erkInstantFeedback.addEventListener('change', (e) => {
            Storage.saveSetting('erkennenInstantFeedback', e.target.checked);
        });
    }

    /**
     * Bindet Event Listener für Hören-Seite
     */
    function bindHoerenEvents() {
        // Lektion Navigation
        hoerenElements.prevLesson.addEventListener('click', () => {
            if (Koch.prevLesson()) {
                updateLessonDisplay();
                Storage.setKochLesson(Koch.getCurrentLesson().lesson);
            }
        });

        hoerenElements.nextLesson.addEventListener('click', () => {
            if (Koch.nextLesson()) {
                updateLessonDisplay();
                Storage.setKochLesson(Koch.getCurrentLesson().lesson);
            }
        });

        // Start/Stop Buttons
        hoerenElements.btnStart.addEventListener('click', startHoeren);
        hoerenElements.btnStop.addEventListener('click', stopHoeren);
    }

    /**
     * Initialisiert das Hören-Modul
     */
    function initHoeren() {
        // Gespeicherte Lektion laden
        const kochData = Storage.getKoch();
        Koch.setCurrentLesson(kochData.currentLesson);

        // Callbacks für Koch-Modul setzen
        Koch.setCallbacks({
            onPhaseChange: handlePhaseChange,
            onCharChange: handleCharChange,
            onGroupChange: handleGroupChange,
            onGroupStart: handleGroupStart,
            onProgress: handleProgress,
            onComplete: handleComplete
        });

        // Initiale Anzeige aktualisieren
        updateLessonDisplay();
    }

    /**
     * Aktualisiert die Lektionsanzeige
     */
    function updateLessonDisplay() {
        const lesson = Koch.getCurrentLesson();
        if (!lesson) return;

        hoerenElements.lessonNumber.textContent = `Lektion ${lesson.lesson}`;

        // Nur die neuen Zeichen dieser Lektion anzeigen (mit Spans für Hervorhebung)
        hoerenElements.lessonChars.innerHTML = lesson.newChars
            .map(char => `<span data-char="${char}">${char}</span>`)
            .join(', ');

        // Navigation Buttons aktivieren/deaktivieren
        hoerenElements.prevLesson.disabled = lesson.lesson <= 1;
        hoerenElements.nextLesson.disabled = lesson.lesson >= Koch.getTotalLessons();

        // Zeichen-Display zurücksetzen
        resetCharDisplay();
    }

    /**
     * Hebt das aktuelle Zeichen in der Lektions-Card hervor
     * @param {string} char - Das aktuelle Zeichen
     */
    function highlightLessonChar(char) {
        // Alle Hervorhebungen entfernen
        const spans = hoerenElements.lessonChars.querySelectorAll('span');
        spans.forEach(span => span.classList.remove('active-char'));

        // Aktuelles Zeichen hervorheben
        const activeSpan = hoerenElements.lessonChars.querySelector(`span[data-char="${char}"]`);
        if (activeSpan) {
            activeSpan.classList.add('active-char');
        }
    }

    /**
     * Setzt das Zeichen-Display zurück
     */
    function resetCharDisplay() {
        hoerenElements.charLetter.textContent = '-';
        hoerenElements.charMorse.textContent = '';
        hoerenElements.charPhonetic.textContent = '';
        hoerenElements.charDisplay.classList.remove('playing');
        hoerenElements.phaseLabel.textContent = 'Bereit';
        hoerenElements.progressFill.style.width = '0%';
        hoerenElements.progressText.textContent = '';
        hoerenElements.groupDisplay.classList.remove('visible');
        hoerenElements.groupChars.textContent = '';
        hoerenElements.groupChars.classList.remove('fade-out');
        currentGroupChars = [];
    }

    /**
     * Startet die Hör-Übung
     */
    async function startHoeren() {
        // Buttons aktualisieren
        hoerenElements.btnStart.disabled = true;
        hoerenElements.btnStop.disabled = false;
        hoerenElements.prevLesson.disabled = true;
        hoerenElements.nextLesson.disabled = true;

        // Wake Lock aktivieren (verhindert Bildschirm-Abschaltung)
        await requestWakeLock();

        // Einstellungen laden
        const settings = Storage.getSettings();

        // Morse-Modul starten
        Morse.start();

        // Lektion starten
        await Koch.runLesson({
            wpm: settings.wpm,
            frequency: settings.frequency,
            repetitionsWithPause: settings.repetitionsWithPause,
            repetitionsNoPause: settings.repetitionsNoPause,
            pauseBetweenReps: settings.pauseBetweenReps,
            groupSize: settings.groupSize,
            numGroups: settings.numGroups,
            pauseAfterGroup: settings.pauseAfterGroup,
            newCharWeight: settings.newCharWeight / 100,
            reviewLessons: settings.reviewLessons,
            charPauseFactor: settings.charPauseFactor,
            announceEnabled: settings.announce,
            phoneticLang: settings.phoneticLang,
            announceGroups: settings.announceGroups,
            endless: settings.endless
        });

        // Buttons zurücksetzen
        hoerenElements.btnStart.disabled = false;
        hoerenElements.btnStop.disabled = true;
        updateLessonDisplay();
    }

    /**
     * Stoppt die Hör-Übung
     */
    async function stopHoeren() {
        Koch.stop();

        // Wake Lock freigeben
        await releaseWakeLock();

        // Buttons zurücksetzen
        hoerenElements.btnStart.disabled = false;
        hoerenElements.btnStop.disabled = true;
        updateLessonDisplay();
    }

    /**
     * Handler für Phasen-Wechsel
     */
    function handlePhaseChange(phase, chars) {
        const phaseLabels = {
            'introduce': 'Neue Zeichen',
            'review': 'Wiederholung',
            'groups': 'Übungsgruppen'
        };

        hoerenElements.phaseLabel.textContent = phaseLabels[phase] || phase;

        if (phase === 'groups') {
            hoerenElements.groupDisplay.classList.add('visible');
        } else {
            hoerenElements.groupDisplay.classList.remove('visible');
        }
    }

    /**
     * Handler für Zeichen-Wechsel
     */
    function handleCharChange(char, type) {
        const settings = Storage.getSettings();

        hoerenElements.charLetter.textContent = char;
        hoerenElements.charMorse.textContent = Morse.getCode(char);
        hoerenElements.charPhonetic.textContent = Phonetic.get(char, settings.phoneticLang);
        hoerenElements.charDisplay.classList.add('playing');

        // Zeichen in der Lektion-Card hervorheben (nur bei introduce/review)
        if (type === 'new' || type === 'review') {
            highlightLessonChar(char);
        }

        // Bei Gruppen: Zeichen zur Gruppenanzeige hinzufügen
        if (type === 'group') {
            addCharToGroupDisplay(char);
        }

        // Animation zurücksetzen nach kurzer Zeit
        setTimeout(() => {
            hoerenElements.charDisplay.classList.remove('playing');
        }, 300);
    }

    /**
     * Handler für Gruppen-Wechsel (wird vor der Ansage aufgerufen)
     */
    function handleGroupChange(group, current, total) {
        // Nur Fortschrittstext aktualisieren, Zeichen bleiben sichtbar
        hoerenElements.progressText.textContent = `Gruppe ${current} / ${total}`;
    }

    /**
     * Handler für Gruppen-Start (wird nach der Ansage aufgerufen)
     * Blendet alte Zeichen aus und bereitet neue Gruppe vor
     */
    function handleGroupStart(current, total) {
        const groupChars = hoerenElements.groupChars;

        // Fade-out starten
        groupChars.classList.add('fade-out');

        // Nach der Animation (500ms) Zeichen löschen
        setTimeout(() => {
            currentGroupChars = [];
            groupChars.textContent = '';
            groupChars.classList.remove('fade-out');
        }, 500);
    }

    /**
     * Fügt ein Zeichen zur Gruppenanzeige hinzu
     * @param {string} char - Das hinzuzufügende Zeichen
     */
    function addCharToGroupDisplay(char) {
        currentGroupChars.push(char);
        hoerenElements.groupChars.textContent = currentGroupChars.join(' ');
    }

    /**
     * Handler für Fortschritt
     */
    function handleProgress(progress) {
        hoerenElements.progressFill.style.width = `${progress * 100}%`;
    }

    /**
     * Handler für Übungs-Ende
     */
    async function handleComplete() {
        hoerenElements.phaseLabel.textContent = 'Abgeschlossen';
        hoerenElements.progressFill.style.width = '100%';

        // Wake Lock freigeben
        await releaseWakeLock();

        // Statistik aktualisieren
        const stats = Storage.getStats();
        stats.sessions++;
        Storage.saveStats(stats);
    }

    // ========================================
    // Erkennen-Modul Funktionen
    // ========================================

    /**
     * Bindet Event Listener für Erkennen-Seite
     */
    function bindErkennenEvents() {
        // Prüfen ob alle Elemente vorhanden sind
        if (!erkennenElements || !erkennenElements.modeKeyboard) {
            console.warn('Erkennen-Elemente nicht gefunden, Events nicht gebunden');
            return;
        }

        // Modus-Buttons
        erkennenElements.modeKeyboard.addEventListener('click', () => {
            setErkMode('keyboard');
        });

        erkennenElements.modePaper.addEventListener('click', () => {
            setErkMode('paper');
        });

        // Lektion Navigation
        erkennenElements.prevLesson.addEventListener('click', () => {
            if (Erkennen.prevLesson()) {
                updateErkLessonDisplay();
                Storage.setErkennenLesson(Erkennen.getCurrentLesson());
            }
        });

        erkennenElements.nextLesson.addEventListener('click', () => {
            if (Erkennen.nextLesson()) {
                updateErkLessonDisplay();
                Storage.setErkennenLesson(Erkennen.getCurrentLesson());
            }
        });

        // Start/Stop Buttons
        erkennenElements.btnStart.addEventListener('click', startErkennen);
        erkennenElements.btnStop.addEventListener('click', stopErkennen);

        // Eingabefeld - Enter zum Absenden
        erkennenElements.input.addEventListener('keydown', handleErkInputKeydown);

        // Papier-Modus: Lösung ansagen
        erkennenElements.speakSolution.addEventListener('click', async () => {
            erkennenElements.speakSolution.disabled = true;
            await Erkennen.speakSolution();
            erkennenElements.speakSolution.disabled = false;
        });

        // Papier-Modus: Fehleranzahl
        erkennenElements.errorMinus.addEventListener('click', () => {
            if (erkErrorCount > 0) {
                erkErrorCount--;
                erkennenElements.errorCount.textContent = erkErrorCount;
            }
        });

        erkennenElements.errorPlus.addEventListener('click', () => {
            erkErrorCount++;
            erkennenElements.errorCount.textContent = erkErrorCount;
        });

        // Papier-Modus: Fehler speichern
        erkennenElements.saveErrors.addEventListener('click', submitErkErrors);

        // Papier-Modus: Neue Runde
        erkennenElements.newRound.addEventListener('click', startNewErkRound);
    }

    /**
     * Initialisiert das Erkennen-Modul
     */
    function initErkennen() {
        // Prüfen ob alle Elemente vorhanden sind
        if (!erkennenElements || !erkennenElements.lessonNumber) {
            console.warn('Erkennen-Elemente nicht gefunden');
            return;
        }

        // Gespeicherte Lektion und Modus laden
        const erkennenLesson = Storage.getErkennenLesson();
        Erkennen.setCurrentLesson(erkennenLesson);

        const settings = Storage.getSettings();
        Erkennen.setMode(settings.erkennenMode || 'keyboard');

        // Callbacks für Erkennen-Modul setzen
        Erkennen.setCallbacks({
            onGroupStart: handleErkGroupStart,
            onGroupEnd: handleErkGroupEnd,
            onProgress: handleErkProgress,
            onComplete: handleErkComplete,
            onAllGroupsPlayed: handleErkAllGroupsPlayed,
            onCharPlayed: handleErkCharPlayed
        });

        // Initiale Anzeige aktualisieren
        updateErkLessonDisplay();
        updateErkModeView();

        console.log('Erkennen-Modul initialisiert');
    }

    /**
     * Setzt den Erkennen-Modus
     * @param {string} mode - 'keyboard' oder 'paper'
     */
    function setErkMode(mode) {
        Erkennen.setMode(mode);
        Storage.saveSetting('erkennenMode', mode);
        updateErkModeView();
    }

    /**
     * Aktualisiert die Modus-Ansicht
     */
    function updateErkModeView() {
        const mode = Erkennen.getMode();

        // Buttons aktualisieren
        if (mode === 'keyboard') {
            erkennenElements.modeKeyboard.classList.add('active');
            erkennenElements.modePaper.classList.remove('active');
            erkennenElements.keyboardView.classList.remove('hidden');
            erkennenElements.paperView.classList.add('hidden');
        } else {
            erkennenElements.modeKeyboard.classList.remove('active');
            erkennenElements.modePaper.classList.add('active');
            erkennenElements.keyboardView.classList.add('hidden');
            erkennenElements.paperView.classList.remove('hidden');
        }

        // Papier-Modus UI zurücksetzen
        resetErkPaperView();
    }

    /**
     * Aktualisiert die Lektionsanzeige für Erkennen
     */
    function updateErkLessonDisplay() {
        const lesson = Erkennen.getLessonData();
        if (!lesson) return;

        erkennenElements.lessonNumber.textContent = `Lektion ${lesson.lesson}`;
        erkennenElements.lessonChars.innerHTML = lesson.newChars
            .map(char => `<span data-char="${char}">${char}</span>`)
            .join(', ');

        // Navigation Buttons aktivieren/deaktivieren
        erkennenElements.prevLesson.disabled = lesson.lesson <= 1;
        erkennenElements.nextLesson.disabled = lesson.lesson >= Koch.getTotalLessons();

        // UI zurücksetzen
        resetErkDisplay();
    }

    /**
     * Setzt die Erkennen-Anzeige zurück
     */
    function resetErkDisplay() {
        erkennenElements.phaseLabel.textContent = 'Bereit';
        erkennenElements.progressFill.style.width = '0%';
        erkennenElements.progressText.textContent = '';
        erkennenElements.input.value = '';
        erkennenElements.inputFeedback.textContent = '';
        erkennenElements.inputFeedback.className = 'input-feedback';
        resetErkPaperView();
    }

    /**
     * Setzt die Papier-Modus Ansicht zurück
     */
    function resetErkPaperView() {
        erkennenElements.solutionCard.classList.remove('visible');
        erkennenElements.errorCard.classList.remove('visible');
        erkennenElements.resultCard.classList.remove('visible');
        erkennenElements.solutionList.innerHTML = '';
        erkErrorCount = 0;
        erkennenElements.errorCount.textContent = '0';
        erkennenElements.errorStats.textContent = '';
    }

    /**
     * Startet die Erkennen-Übung
     */
    async function startErkennen() {
        // UI aktualisieren
        erkennenElements.btnStart.disabled = true;
        erkennenElements.btnStop.disabled = false;
        erkennenElements.prevLesson.disabled = true;
        erkennenElements.nextLesson.disabled = true;
        erkennenElements.modeKeyboard.disabled = true;
        erkennenElements.modePaper.disabled = true;

        // Wake Lock aktivieren
        await requestWakeLock();

        // Einstellungen laden
        const settings = Storage.getSettings();

        // Morse-Modul starten
        Morse.start();

        const erkSettings = {
            wpm: settings.wpm,
            frequency: settings.frequency,
            groupSize: settings.erkennenGroupSize,
            numGroups: settings.erkennenNumGroups,
            pauseAfterGroup: settings.erkennenPauseAfterGroup,
            newCharWeight: settings.newCharWeight / 100,
            reviewLessons: settings.reviewLessons,
            instantFeedback: settings.erkennenInstantFeedback
        };

        const mode = Erkennen.getMode();
        if (mode === 'keyboard') {
            erkennenElements.input.disabled = false;
            erkennenElements.input.focus();
            await Erkennen.runKeyboardMode(erkSettings);

            // UI zurücksetzen (nur Tastatur-Modus)
            erkennenElements.btnStart.disabled = false;
            erkennenElements.btnStop.disabled = true;
            erkennenElements.modeKeyboard.disabled = false;
            erkennenElements.modePaper.disabled = false;
            updateErkLessonDisplay();
        } else {
            await Erkennen.runPaperMode(erkSettings);

            // Im Papier-Modus: Buttons zurücksetzen, aber NICHT die Anzeige
            // (Lösung und Fehler-Eingabe bleiben sichtbar)
            erkennenElements.btnStart.disabled = true;
            erkennenElements.btnStop.disabled = true;
            erkennenElements.modeKeyboard.disabled = true;
            erkennenElements.modePaper.disabled = true;
        }
    }

    /**
     * Stoppt die Erkennen-Übung
     */
    async function stopErkennen() {
        Erkennen.stop();

        // Wake Lock freigeben
        await releaseWakeLock();

        // UI zurücksetzen
        erkennenElements.btnStart.disabled = false;
        erkennenElements.btnStop.disabled = true;
        erkennenElements.modeKeyboard.disabled = false;
        erkennenElements.modePaper.disabled = false;
        erkennenElements.input.disabled = false;
        updateErkLessonDisplay();
    }

    /**
     * Handler für Gruppen-Start (Erkennen)
     */
    function handleErkGroupStart(index, total, group) {
        erkennenElements.phaseLabel.textContent = 'Übungsgruppen';
        erkennenElements.progressText.textContent = `Gruppe ${index + 1} / ${total}`;

        // Tastatur-Modus: Eingabe leeren
        if (Erkennen.getMode() === 'keyboard') {
            erkennenElements.input.value = '';
            erkennenElements.inputFeedback.textContent = '';
            erkennenElements.inputFeedback.className = 'input-feedback';
        }
    }

    /**
     * Handler für Zeichen gespielt (Erkennen)
     */
    function handleErkCharPlayed(char, index, total) {
        // Optional: Visuelles Feedback beim Abspielen
    }

    /**
     * Handler für Gruppen-Ende (Erkennen) - nur Tastatur-Modus
     */
    function handleErkGroupEnd(groupString, userInput, isCorrect) {
        const settings = Storage.getSettings();

        if (settings.erkennenInstantFeedback) {
            if (isCorrect) {
                erkennenElements.inputFeedback.textContent = `✓ Richtig: ${groupString}`;
                erkennenElements.inputFeedback.className = 'input-feedback correct';
            } else {
                erkennenElements.inputFeedback.textContent = `✗ Falsch - Richtig: ${groupString}`;
                erkennenElements.inputFeedback.className = 'input-feedback incorrect';
            }
        }
    }

    /**
     * Handler für Fortschritt (Erkennen)
     */
    function handleErkProgress(progress) {
        erkennenElements.progressFill.style.width = `${progress * 100}%`;
    }

    /**
     * Handler für Übungs-Ende (Erkennen) - nur Tastatur-Modus
     */
    async function handleErkComplete(results) {
        erkennenElements.phaseLabel.textContent = 'Abgeschlossen';
        erkennenElements.progressFill.style.width = '100%';

        // Wake Lock freigeben
        await releaseWakeLock();

        // Statistik speichern
        saveErkStats(results);

        // Ergebnis anzeigen
        const correctPercent = results.totalChars > 0
            ? Math.round((results.correctChars / results.totalChars) * 100)
            : 0;

        erkennenElements.inputFeedback.textContent =
            `Ergebnis: ${results.correctGroups}/${results.totalGroups} Gruppen richtig (${correctPercent}%)`;
        erkennenElements.inputFeedback.className =
            correctPercent >= 80 ? 'input-feedback correct' : 'input-feedback incorrect';
    }

    /**
     * Handler für alle Gruppen gespielt (Papier-Modus)
     */
    function handleErkAllGroupsPlayed(groups) {
        erkennenElements.phaseLabel.textContent = 'Auswertung';

        // Lösung anzeigen (alle Gruppen als einfacher Text)
        erkennenElements.solutionList.textContent = groups
            .map(g => g.join(''))
            .join(' ');

        erkennenElements.solutionCard.classList.add('visible');
        erkennenElements.errorCard.classList.add('visible');

        // Gesamtzeichen berechnen und anzeigen
        const totalChars = groups.reduce((sum, g) => sum + g.length, 0);
        erkErrorCount = 0;
        erkennenElements.errorCount.textContent = '0';
        erkennenElements.errorStats.textContent = `Gesamt: ${totalChars} Zeichen in ${groups.length} Gruppen`;
    }

    /**
     * Handler für Eingabe-Keydown (Erkennen Tastatur-Modus)
     */
    function handleErkInputKeydown(e) {
        if (e.key === 'Enter' && Erkennen.isRunning()) {
            e.preventDefault();
            const input = erkennenElements.input.value.trim();
            Erkennen.submitInput(input);
        }
    }

    /**
     * Speichert Fehler und zeigt Ergebnis (Papier-Modus)
     */
    async function submitErkErrors() {
        const results = Erkennen.calculatePaperResult(erkErrorCount);

        // Statistik speichern
        saveErkStats(results);

        // Wake Lock freigeben
        await releaseWakeLock();

        // Ergebnis-Card anzeigen
        erkennenElements.errorCard.classList.remove('visible');
        erkennenElements.resultPercent.textContent = results.correctPercent + '%';
        erkennenElements.resultText.textContent = `${results.correctChars} von ${results.totalChars} Zeichen richtig`;

        // Icon und Styling basierend auf Ergebnis
        erkennenElements.resultCard.classList.remove('success', 'warning', 'error');
        if (results.correctPercent >= 90) {
            erkennenElements.resultIcon.textContent = 'emoji_events';
            erkennenElements.resultCard.classList.add('success');
        } else if (results.correctPercent >= 70) {
            erkennenElements.resultIcon.textContent = 'thumb_up';
            erkennenElements.resultCard.classList.add('warning');
        } else {
            erkennenElements.resultIcon.textContent = 'fitness_center';
            erkennenElements.resultCard.classList.add('error');
        }

        erkennenElements.resultCard.classList.add('visible');
        erkennenElements.phaseLabel.textContent = 'Abgeschlossen';

        // Buttons zurücksetzen
        erkennenElements.btnStart.disabled = false;
        erkennenElements.btnStop.disabled = true;
        erkennenElements.modeKeyboard.disabled = false;
        erkennenElements.modePaper.disabled = false;
    }

    /**
     * Startet eine neue Runde im Papier-Modus
     */
    function startNewErkRound() {
        resetErkPaperView();
        updateErkLessonDisplay();
    }

    // ========================================
    // Geben-Modul Funktionen
    // ========================================

    /**
     * Bindet Event Listener für Geben-Seite
     */
    function bindGebenEvents() {
        if (!gebenElements || !gebenElements.btnStart) {
            console.warn('Geben-Elemente nicht gefunden');
            return;
        }

        gebenElements.btnStart.addEventListener('click', startGeben);
        gebenElements.btnStop.addEventListener('click', stopGeben);
        gebenElements.clearBtn.addEventListener('click', clearGebenOutput);
        gebenElements.toneToggle.addEventListener('click', toggleGebenTone);
    }

    /**
     * Initialisiert das Geben-Modul
     */
    function initGeben() {
        if (!gebenElements || !gebenElements.char) {
            console.warn('Geben-Elemente nicht gefunden');
            return;
        }

        // Oszilloskop initialisieren
        if (gebenElements.scope) {
            Scope.init(gebenElements.scope);
        }

        // Callbacks setzen
        Geben.setCallbacks({
            onElement: handleGebenElement,
            onChar: handleGebenChar,
            onWord: handleGebenWord,
            onSequence: handleGebenSequence,
            onKeyDown: () => Scope.setHigh(),
            onKeyUp: () => Scope.setLow()
        });

        console.log('Geben-Modul initialisiert');
    }

    /**
     * Startet das Geben-Modul
     */
    async function startGeben() {
        const settings = Storage.getSettings();

        // Audio-Kontext starten (erfordert User-Interaktion)
        Morse.start();

        Geben.start({
            wpm: settings.wpm,
            frequency: settings.frequency,
            toneEnabled: gebenToneEnabled
        });

        // Oszilloskop starten
        Scope.start();

        // UI aktualisieren
        gebenElements.btnStart.disabled = true;
        gebenElements.btnStop.disabled = false;
        gebenElements.char.textContent = '-';
        gebenElements.sequence.textContent = '';

        // Wake Lock aktivieren
        await requestWakeLock();
    }

    /**
     * Stoppt das Geben-Modul
     */
    async function stopGeben() {
        Geben.stop();

        // Oszilloskop stoppen
        Scope.stop();

        // UI aktualisieren
        gebenElements.btnStart.disabled = false;
        gebenElements.btnStop.disabled = true;

        // Wake Lock freigeben
        await releaseWakeLock();
    }

    /**
     * Löscht die Geben-Ausgabe
     */
    function clearGebenOutput() {
        gebenOutputText = '';
        gebenElements.output.textContent = '';
        gebenElements.char.textContent = '-';
        gebenElements.sequence.textContent = '';
    }

    /**
     * Schaltet den Ton beim Geben ein/aus
     */
    function toggleGebenTone() {
        gebenToneEnabled = !gebenToneEnabled;

        // Button-Darstellung aktualisieren
        if (gebenToneEnabled) {
            gebenElements.toneToggle.classList.add('active');
            gebenElements.toneToggle.querySelector('.material-icons').textContent = 'volume_up';
        } else {
            gebenElements.toneToggle.classList.remove('active');
            gebenElements.toneToggle.querySelector('.material-icons').textContent = 'volume_off';
        }

        // Falls Geben läuft, Einstellung aktualisieren
        if (Geben.isActive()) {
            Geben.setToneEnabled(gebenToneEnabled);
        }
    }

    /**
     * Handler für Dit/Dah erkannt
     */
    function handleGebenElement(element, duration) {
        // Visuelles Feedback
        gebenElements.char.classList.add('active');
        setTimeout(() => {
            gebenElements.char.classList.remove('active');
        }, 100);
    }

    /**
     * Handler für Zeichen dekodiert
     */
    function handleGebenChar(char, sequence) {
        gebenElements.char.textContent = char;
        gebenOutputText += char;
        gebenElements.output.textContent = gebenOutputText;
    }

    /**
     * Handler für Wort-Pause erkannt
     */
    function handleGebenWord() {
        gebenOutputText += ' ';
        gebenElements.output.textContent = gebenOutputText;
    }

    /**
     * Handler für Sequenz aktualisiert
     */
    function handleGebenSequence(sequence) {
        gebenElements.sequence.textContent = sequence;
    }

    /**
     * Speichert die Erkennen-Statistik
     * @param {Object} results - Ergebnisse
     */
    function saveErkStats(results) {
        const stats = Storage.getStats();
        stats.sessions++;
        stats.totalChars += results.totalChars || 0;

        // Durchschnittliche Trefferquote aktualisieren
        const correctPercent = results.correctPercent ||
            (results.totalChars > 0 ? Math.round((results.correctChars / results.totalChars) * 100) : 0);

        if (stats.sessions === 1) {
            stats.correctPercent = correctPercent;
        } else {
            // Gleitender Durchschnitt
            stats.correctPercent = Math.round(
                (stats.correctPercent * (stats.sessions - 1) + correctPercent) / stats.sessions
            );
        }

        Storage.saveStats(stats);
        updateStatsDisplay();
    }

    /**
     * Öffnet den Navigation Drawer
     */
    function openDrawer() {
        navDrawer.classList.add('open');
        navOverlay.classList.add('visible');
        document.body.style.overflow = 'hidden';
    }

    /**
     * Schließt den Navigation Drawer
     */
    function closeDrawer() {
        navDrawer.classList.remove('open');
        navOverlay.classList.remove('visible');
        document.body.style.overflow = '';
    }

    /**
     * Wechselt den aktiven Tab
     * @param {string} tabId - ID des Tabs
     */
    function switchTab(tabId) {
        // Tabs aktualisieren
        tabs.forEach(tab => {
            if (tab.dataset.tab === tabId) {
                tab.classList.add('active');
            } else {
                tab.classList.remove('active');
            }
        });

        // Tab-Content aktualisieren
        const tabContents = document.querySelectorAll('.tab-content');
        tabContents.forEach(content => {
            if (content.id === tabId) {
                content.classList.add('active');
            } else {
                content.classList.remove('active');
            }
        });
    }

    /**
     * Aktiviert/Deaktiviert den Dark Mode
     * @param {boolean} enabled - Dark Mode aktivieren
     */
    function setDarkMode(enabled) {
        if (enabled) {
            document.documentElement.setAttribute('data-theme', 'dark');
        } else {
            document.documentElement.removeAttribute('data-theme');
        }
    }

    /**
     * Lädt gespeicherte Einstellungen und wendet sie an
     */
    function loadSettings() {
        const settings = Storage.getSettings();

        // Allgemein
        settingInputs.darkMode.checked = settings.darkMode;
        setDarkMode(settings.darkMode);

        // CW-Parameter
        settingInputs.wpm.value = settings.wpm;
        document.getElementById('wpmValue').textContent = settings.wpm;

        settingInputs.frequency.value = settings.frequency;
        document.getElementById('freqValue').textContent = settings.frequency;

        settingInputs.letters.checked = settings.letters;
        settingInputs.numbers.checked = settings.numbers;
        settingInputs.special.checked = settings.special;

        // Aussprache
        settingInputs.phoneticLang.value = settings.phoneticLang;
        settingInputs.announce.checked = settings.announce;

        // Hören-Einstellungen
        settingInputs.repsWithPause.value = settings.repetitionsWithPause;
        document.getElementById('repsWithPauseValue').textContent = settings.repetitionsWithPause;

        settingInputs.repsNoPause.value = settings.repetitionsNoPause;
        document.getElementById('repsNoPauseValue').textContent = settings.repetitionsNoPause;

        settingInputs.pauseBetween.value = settings.pauseBetweenReps;
        document.getElementById('pauseBetweenValue').textContent = settings.pauseBetweenReps;

        settingInputs.groupSize.value = settings.groupSize;
        document.getElementById('groupSizeValue').textContent = settings.groupSize;

        settingInputs.numGroups.value = settings.numGroups;
        document.getElementById('numGroupsValue').textContent = settings.numGroups;

        settingInputs.pauseAfterGroup.value = settings.pauseAfterGroup;
        document.getElementById('pauseAfterGroupValue').textContent = (settings.pauseAfterGroup / 1000).toFixed(1);

        settingInputs.newCharWeight.value = settings.newCharWeight;
        document.getElementById('newCharWeightValue').textContent = settings.newCharWeight;

        settingInputs.reviewLessons.value = settings.reviewLessons;
        document.getElementById('reviewLessonsValue').textContent = settings.reviewLessons;

        settingInputs.charPauseFactor.value = settings.charPauseFactor;
        document.getElementById('charPauseFactorValue').textContent = settings.charPauseFactor;

        settingInputs.endless.checked = settings.endless;
        settingInputs.announceGroups.checked = settings.announceGroups;

        // Erkennen-Einstellungen
        settingInputs.erkGroupSize.value = settings.erkennenGroupSize;
        document.getElementById('erkGroupSizeValue').textContent = settings.erkennenGroupSize;

        settingInputs.erkNumGroups.value = settings.erkennenNumGroups;
        document.getElementById('erkNumGroupsValue').textContent = settings.erkennenNumGroups;

        settingInputs.erkPauseAfterGroup.value = settings.erkennenPauseAfterGroup;
        document.getElementById('erkPauseAfterGroupValue').textContent = (settings.erkennenPauseAfterGroup / 1000).toFixed(1);

        settingInputs.erkInstantFeedback.checked = settings.erkennenInstantFeedback;
    }

    /**
     * Aktualisiert die Statistik-Anzeige auf der Startseite
     */
    function updateStatsDisplay() {
        const stats = Storage.getStats();

        document.getElementById('statSessions').textContent = stats.sessions;
        document.getElementById('statCorrect').textContent = stats.correctPercent + '%';
        document.getElementById('statChars').textContent = stats.totalChars;

        // Zeit formatieren
        const hours = Math.floor(stats.totalTimeMinutes / 60);
        const minutes = stats.totalTimeMinutes % 60;
        const timeStr = hours > 0 ? `${hours}h ${minutes}m` : `${minutes}m`;
        document.getElementById('statTime').textContent = timeStr || '0m';
    }

    /**
     * Fordert einen Wake Lock an, um das Display aktiv zu halten
     */
    async function requestWakeLock() {
        if ('wakeLock' in navigator) {
            try {
                wakeLock = await navigator.wakeLock.request('screen');
                console.log('Wake Lock aktiviert');

                // Event Listener für Wake Lock Release
                wakeLock.addEventListener('release', () => {
                    console.log('Wake Lock freigegeben');
                });
            } catch (err) {
                console.warn('Wake Lock konnte nicht aktiviert werden:', err.message);
            }
        } else {
            console.log('Wake Lock API nicht unterstützt');
        }
    }

    /**
     * Gibt den Wake Lock frei
     */
    async function releaseWakeLock() {
        if (wakeLock !== null) {
            try {
                await wakeLock.release();
                wakeLock = null;
                console.log('Wake Lock manuell freigegeben');
            } catch (err) {
                console.warn('Fehler beim Freigeben des Wake Lock:', err.message);
            }
        }
    }

    /**
     * Reaktiviert den Wake Lock nach Tab-Wechsel
     */
    function handleVisibilityChange() {
        if (document.visibilityState === 'visible' && (Koch.isRunning() || Erkennen.isRunning())) {
            requestWakeLock();
        }
    }

    /**
     * Registriert den Service Worker
     */
    function registerServiceWorker() {
        if ('serviceWorker' in navigator) {
            window.addEventListener('load', () => {
                navigator.serviceWorker.register('/sw.js')
                    .then((registration) => {
                        console.log('ServiceWorker registriert:', registration.scope);

                        // Update verfügbar?
                        registration.addEventListener('updatefound', () => {
                            const newWorker = registration.installing;
                            newWorker.addEventListener('statechange', () => {
                                if (newWorker.state === 'installed' && navigator.serviceWorker.controller) {
                                    console.log('Neues Update verfügbar');
                                }
                            });
                        });
                    })
                    .catch((error) => {
                        console.error('ServiceWorker Registrierung fehlgeschlagen:', error);
                    });
            });
        }
    }

    // Public API
    return {
        init,
        openDrawer,
        closeDrawer,
        setDarkMode,
        updateStatsDisplay,
        startHoeren,
        stopHoeren
    };
})();

// App starten, wenn DOM bereit ist
document.addEventListener('DOMContentLoaded', App.init);
