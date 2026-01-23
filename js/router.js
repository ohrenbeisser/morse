/**
 * CW-Dilettant - Router Module
 * Verwaltet die Navigation zwischen Seiten (SPA-Routing)
 */

const Router = (function() {
    'use strict';

    let currentPage = 'home';
    const pageCallbacks = {};

    /**
     * Initialisiert den Router
     */
    function init() {
        // Hash-Change Event
        window.addEventListener('hashchange', handleHashChange);

        // Initial: Hash prüfen oder auf Home setzen
        handleHashChange();
    }

    /**
     * Verarbeitet Hash-Änderungen
     */
    function handleHashChange() {
        const hash = window.location.hash.slice(1) || 'home';
        navigateTo(hash, false);
    }

    /**
     * Navigiert zu einer Seite
     * @param {string} pageName - Name der Seite
     * @param {boolean} updateHash - Hash in URL aktualisieren (default: true)
     */
    function navigateTo(pageName, updateHash = true) {
        const page = document.getElementById('page-' + pageName);

        if (!page) {
            console.warn('Seite nicht gefunden:', pageName);
            return;
        }

        // Cleanup-Callback der alten Seite aufrufen, falls vorhanden
        const oldPage = currentPage;
        if (oldPage && pageCallbacks[oldPage + '_leave']) {
            pageCallbacks[oldPage + '_leave']();
        }

        // Alte Seite deaktivieren
        const activePage = document.querySelector('.page.active');
        if (activePage) {
            activePage.classList.remove('active');
        }

        // Neue Seite aktivieren
        page.classList.add('active');
        currentPage = pageName;

        // Navigation-Items aktualisieren
        updateNavItems(pageName);

        // App-Bar Titel aktualisieren
        updateAppBarTitle(pageName);

        // Hash aktualisieren (ohne erneutes Event auszulösen)
        if (updateHash) {
            history.pushState(null, '', '#' + pageName);
        }

        // Callback aufrufen, falls vorhanden
        if (pageCallbacks[pageName]) {
            pageCallbacks[pageName]();
        }

        // Scroll nach oben
        window.scrollTo(0, 0);
    }

    /**
     * Aktualisiert die aktive Navigation
     * @param {string} pageName - Name der aktuellen Seite
     */
    function updateNavItems(pageName) {
        const navItems = document.querySelectorAll('.nav-item');
        navItems.forEach(item => {
            if (item.dataset.page === pageName) {
                item.classList.add('active');
            } else {
                item.classList.remove('active');
            }
        });
    }

    /**
     * Aktualisiert den App-Bar Titel
     * @param {string} pageName - Name der aktuellen Seite
     */
    function updateAppBarTitle(pageName) {
        const titles = {
            'home': 'CW-Dilettant',
            'hoeren': 'Hören',
            'erkennen': 'Erkennen',
            'geben': 'Geben',
            'einstellungen': 'Einstellungen',
            'hilfe': 'Hilfe',
            'ueber': 'Über'
        };

        const titleEl = document.querySelector('.app-bar-title');
        if (titleEl) {
            titleEl.textContent = titles[pageName] || 'CW-Dilettant';
        }
    }

    /**
     * Registriert einen Callback für eine Seite
     * @param {string} pageName - Name der Seite
     * @param {Function} callback - Callback-Funktion
     */
    function onPageLoad(pageName, callback) {
        pageCallbacks[pageName] = callback;
    }

    /**
     * Gibt die aktuelle Seite zurück
     * @returns {string} Name der aktuellen Seite
     */
    function getCurrentPage() {
        return currentPage;
    }

    // Public API
    return {
        init,
        navigateTo,
        onPageLoad,
        getCurrentPage
    };
})();
