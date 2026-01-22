/**
 * CW-Dilettant - Oszilloskop Module
 * Visualisiert Morse-Signale als Rechteckwelle
 */

const Scope = (function() {
    'use strict';

    // Canvas und Kontext
    let canvas = null;
    let ctx = null;

    // Zustand
    let isRunning = false;
    let signalHigh = false;
    let animationId = null;

    // Daten
    let dataPoints = [];
    let pointsPerFrame = 2;  // Wie viele Punkte pro Frame hinzugefügt werden (Scroll-Geschwindigkeit)

    // Farben (werden bei init aus CSS gelesen)
    let colors = {
        background: '#f5f5f5',
        line: '#1976D2',
        grid: '#e0e0e0'
    };

    /**
     * Initialisiert das Oszilloskop
     * @param {HTMLCanvasElement} canvasElement - Das Canvas-Element
     */
    function init(canvasElement) {
        canvas = canvasElement;
        ctx = canvas.getContext('2d');

        // Canvas-Größe an Container anpassen
        resizeCanvas();

        // Farben aus CSS-Variablen lesen
        updateColors();

        // Daten-Array initialisieren
        dataPoints = new Array(canvas.width).fill(0);

        // Resize-Listener
        window.addEventListener('resize', handleResize);
    }

    /**
     * Passt Canvas-Größe an
     */
    function resizeCanvas() {
        if (!canvas) return;

        const rect = canvas.getBoundingClientRect();
        const dpr = window.devicePixelRatio || 1;

        canvas.width = rect.width * dpr;
        canvas.height = rect.height * dpr;

        ctx.scale(dpr, dpr);

        // Daten-Array anpassen
        const newLength = Math.floor(rect.width);
        if (dataPoints.length !== newLength) {
            const oldData = dataPoints;
            dataPoints = new Array(newLength).fill(0);
            // Alte Daten übernehmen (von rechts)
            const copyStart = Math.max(0, oldData.length - newLength);
            const destStart = Math.max(0, newLength - oldData.length);
            for (let i = copyStart; i < oldData.length; i++) {
                dataPoints[destStart + (i - copyStart)] = oldData[i];
            }
        }
    }

    /**
     * Resize-Handler mit Debounce
     */
    let resizeTimeout = null;
    function handleResize() {
        if (resizeTimeout) clearTimeout(resizeTimeout);
        resizeTimeout = setTimeout(() => {
            resizeCanvas();
            updateColors();
        }, 100);
    }

    /**
     * Liest Farben aus CSS-Variablen
     */
    function updateColors() {
        if (!canvas) return;

        const style = getComputedStyle(document.documentElement);
        colors.background = style.getPropertyValue('--surface-variant').trim() || '#f5f5f5';
        colors.line = style.getPropertyValue('--primary').trim() || '#1976D2';
        colors.grid = style.getPropertyValue('--outline-variant').trim() || '#e0e0e0';
    }

    /**
     * Startet die Animation
     */
    function start() {
        if (isRunning) return;

        isRunning = true;
        signalHigh = false;

        // Daten zurücksetzen
        dataPoints.fill(0);

        // Animation starten
        animate();
    }

    /**
     * Stoppt die Animation
     */
    function stop() {
        isRunning = false;
        signalHigh = false;

        if (animationId) {
            cancelAnimationFrame(animationId);
            animationId = null;
        }

        // Letztes Frame zeichnen (leeres Signal)
        dataPoints.fill(0);
        draw();
    }

    /**
     * Signal auf HIGH setzen (Taste gedrückt)
     */
    function setHigh() {
        signalHigh = true;
    }

    /**
     * Signal auf LOW setzen (Taste losgelassen)
     */
    function setLow() {
        signalHigh = false;
    }

    /**
     * Animations-Loop
     */
    function animate() {
        if (!isRunning) return;

        // Neue Datenpunkte hinzufügen
        for (let i = 0; i < pointsPerFrame; i++) {
            // Alle Punkte nach links shiften
            dataPoints.shift();
            // Neuen Punkt am Ende hinzufügen
            dataPoints.push(signalHigh ? 1 : 0);
        }

        // Zeichnen
        draw();

        // Nächster Frame
        animationId = requestAnimationFrame(animate);
    }

    /**
     * Zeichnet das Oszilloskop
     */
    function draw() {
        if (!ctx || !canvas) return;

        const width = canvas.getBoundingClientRect().width;
        const height = canvas.getBoundingClientRect().height;

        // Hintergrund
        ctx.fillStyle = colors.background;
        ctx.fillRect(0, 0, width, height);

        // Mittellinie (Grid)
        ctx.strokeStyle = colors.grid;
        ctx.lineWidth = 1;
        ctx.setLineDash([4, 4]);
        ctx.beginPath();
        ctx.moveTo(0, height / 2);
        ctx.lineTo(width, height / 2);
        ctx.stroke();
        ctx.setLineDash([]);

        // Signal zeichnen
        const padding = 15;
        const signalHeight = height - (padding * 2);
        const lowY = height - padding;
        const highY = padding;

        ctx.strokeStyle = colors.line;
        ctx.lineWidth = 2;
        ctx.lineCap = 'square';
        ctx.lineJoin = 'miter';

        ctx.beginPath();

        let lastValue = dataPoints[0];
        let lastY = lastValue ? highY : lowY;
        ctx.moveTo(0, lastY);

        for (let x = 1; x < dataPoints.length; x++) {
            const value = dataPoints[x];
            const currentY = value ? highY : lowY;

            // Wenn sich der Wert ändert, erst vertikal, dann horizontal
            if (value !== lastValue) {
                // Vertikale Linie
                ctx.lineTo(x, lastY);
                ctx.lineTo(x, currentY);
            } else {
                // Horizontale Linie fortsetzen
                ctx.lineTo(x, currentY);
            }

            lastValue = value;
            lastY = currentY;
        }

        ctx.stroke();
    }

    /**
     * Gibt zurück ob das Oszilloskop läuft
     * @returns {boolean}
     */
    function getIsRunning() {
        return isRunning;
    }

    /**
     * Setzt die Scroll-Geschwindigkeit
     * @param {number} speed - Punkte pro Frame (1-5)
     */
    function setSpeed(speed) {
        pointsPerFrame = Math.max(1, Math.min(5, speed));
    }

    /**
     * Aufräumen
     */
    function destroy() {
        stop();
        window.removeEventListener('resize', handleResize);
        canvas = null;
        ctx = null;
    }

    // Public API
    return {
        init,
        start,
        stop,
        setHigh,
        setLow,
        isRunning: getIsRunning,
        setSpeed,
        updateColors,
        destroy
    };
})();
