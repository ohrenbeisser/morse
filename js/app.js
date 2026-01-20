/**
 * CW-Dilettant - Main Application
 * Initialisierung und Event-Handling
 */

const App = (function() {
    'use strict';

    // DOM Elements
    let menuBtn;
    let navDrawer;
    let navOverlay;
    let navItems;
    let actionCards;
    let tabs;
    let settingInputs;

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
        settingInputs = {
            darkMode: document.getElementById('settingDarkMode'),
            wpm: document.getElementById('settingWpm'),
            effWpm: document.getElementById('settingEffWpm'),
            frequency: document.getElementById('settingFreq'),
            letters: document.getElementById('settingLetters'),
            numbers: document.getElementById('settingNumbers'),
            special: document.getElementById('settingSpecial'),
            phoneticLang: document.getElementById('settingPhoneticLang'),
            announce: document.getElementById('settingAnnounce')
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

        // Keyboard Navigation für Drawer
        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape' && navDrawer.classList.contains('open')) {
                closeDrawer();
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

        // Dark Mode
        settingInputs.darkMode.checked = settings.darkMode;
        setDarkMode(settings.darkMode);

        // WPM
        settingInputs.wpm.value = settings.wpm;
        document.getElementById('wpmValue').textContent = settings.wpm;

        // Effektive WPM
        settingInputs.effWpm.value = settings.effWpm;
        document.getElementById('effWpmValue').textContent = settings.effWpm;

        // Frequenz
        settingInputs.frequency.value = settings.frequency;
        document.getElementById('freqValue').textContent = settings.frequency;

        // Zeichensatz
        settingInputs.letters.checked = settings.letters;
        settingInputs.numbers.checked = settings.numbers;
        settingInputs.special.checked = settings.special;

        // Aussprache
        settingInputs.phoneticLang.value = settings.phoneticLang;
        settingInputs.announce.checked = settings.announce;
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
                                    // Hier könnte man dem User ein Update anbieten
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
        updateStatsDisplay
    };
})();

// App starten, wenn DOM bereit ist
document.addEventListener('DOMContentLoaded', App.init);
