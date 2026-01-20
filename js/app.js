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

    // Speicher für aktuelle Gruppenzeichen
    let currentGroupChars = [];

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
            effWpm: document.getElementById('settingEffWpm'),
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
            newCharWeight: document.getElementById('settingNewCharWeight'),
            reviewLessons: document.getElementById('settingReviewLessons'),
            endless: document.getElementById('settingEndless'),
            announceGroups: document.getElementById('settingAnnounceGroups')
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

        // Effektive WPM Slider
        settingInputs.effWpm.addEventListener('input', (e) => {
            const value = parseInt(e.target.value);
            document.getElementById('effWpmValue').textContent = value;
            Storage.saveSetting('effWpm', value);
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

        settingInputs.endless.addEventListener('change', (e) => {
            Storage.saveSetting('endless', e.target.checked);
        });

        settingInputs.announceGroups.addEventListener('change', (e) => {
            Storage.saveSetting('announceGroups', e.target.checked);
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
            newCharWeight: settings.newCharWeight / 100,
            reviewLessons: settings.reviewLessons,
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
     * Handler für Gruppen-Wechsel
     */
    function handleGroupChange(group, current, total) {
        // Gruppe zurücksetzen (wird leer initialisiert)
        currentGroupChars = [];
        hoerenElements.groupChars.textContent = '';
        hoerenElements.progressText.textContent = `Gruppe ${current} / ${total}`;
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

        settingInputs.effWpm.value = settings.effWpm;
        document.getElementById('effWpmValue').textContent = settings.effWpm;

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

        settingInputs.newCharWeight.value = settings.newCharWeight;
        document.getElementById('newCharWeightValue').textContent = settings.newCharWeight;

        settingInputs.reviewLessons.value = settings.reviewLessons;
        document.getElementById('reviewLessonsValue').textContent = settings.reviewLessons;

        settingInputs.endless.checked = settings.endless;
        settingInputs.announceGroups.checked = settings.announceGroups;
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
        if (document.visibilityState === 'visible' && Koch.isRunning()) {
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
