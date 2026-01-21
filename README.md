# CW-Dilettant

Progressive Web App (PWA) zum Lernen von Telegrafie (Morsen/CW).

## Features

### Hören
Morse-Zeichen hören und lernen nach der Koch-Methode:
- 40 Lektionen mit schrittweiser Einführung neuer Zeichen
- Einstellbare Wiederholungen mit/ohne Pause
- Übungsgruppen mit konfigurierbarer Größe
- Optionale Ansage der Zeichen (TTS)

### Erkennen
Gehörte Morse-Zeichen identifizieren:
- **Tastatur-Modus**: Direkteingabe mit sofortigem Feedback
- **Papier-Modus**: Handschriftliche Notizen, danach Auswertung mit Fehleranzahl

### Geben
Selbst morsen üben:
- Leertaste als Morsetaste (kurz = Dit, lang = Dah)
- Automatische Zeichenerkennung
- Optionaler Mithörton
- Anschluss einer echten Morsetaste möglich (über USB-Adapter als Tastatur)

### Einstellungen
- Geschwindigkeit (WPM)
- Tonhöhe (Hz)
- Buchstabiertafel (NATO/Deutsch)
- Dunkles Design
- Diverse Übungsparameter

## Technologie

- HTML, CSS, Vanilla JavaScript (keine Frameworks)
- PWA mit Service Worker (offline-fähig)
- Material Design
- LocalStorage für Persistenz
- Web Audio API für Morse-Töne
- Web Speech API für Ansagen

## Installation

### Als PWA (empfohlen)
1. Seite im Browser öffnen
2. "Zum Startbildschirm hinzufügen" wählen
3. App offline nutzen

### Lokal entwickeln
```bash
# Repository klonen
git clone https://github.com/ohrenbeisser/morse.git
cd morse

# Server starten
python3 -m http.server 8080

# Browser öffnen
http://localhost:8080
```

## Projektstruktur

```
morse/
├── index.html          # SPA mit allen Seiten
├── manifest.json       # PWA Manifest
├── sw.js               # Service Worker
├── css/
│   └── style.css       # Material Design Styles
├── js/
│   ├── app.js          # Haupt-App, Event-Handling
│   ├── storage.js      # LocalStorage Modul
│   ├── router.js       # SPA-Navigation (Hash-basiert)
│   ├── morse.js        # Morse-Code & Audio-Generator
│   ├── koch.js         # Koch-Methode Lektionen
│   ├── erkennen.js     # Erkennen-Modul
│   ├── geben.js        # Geben-Modul
│   ├── speaker.js      # Text-to-Speech
│   └── phonetic.js     # Buchstabiertafeln
├── icons/              # App-Icons (72-512px)
└── lib/fonts/          # Roboto & Material Icons
```

## Koch-Methode

Die Lektionen folgen der Koch-Reihenfolge:

1. K, M
2. R
3. S
4. U
5. A
6. P
7. T
8. L
9. O
10. W
11. I
12. .
13. N
14. J
15. E
16. F
17. 0
18. Y
19. V
20. ,
21. G
22. 5
23. /
24. Q
25. 9
26. Z
27. H
28. 3
29. 8
30. B
31. ?
32. 4
33. 2
34. 7
35. C
36. 1
37. D
38. 6
39. X
40. =

## Autor

**Chris Seifert** (DL6LG)
- E-Mail: info@cseifert.de
- Web: www.ohrenbeisser.de

## Lizenz

MIT License
