# Giant Interstellar - Piano Visualizer

A high-performance, real-time MIDI visualization tool built with React, Vite, and PixiJS. This application renders falling notes synchronized with audio playback, supporting both MIDI file uploads and live MIDI input.

## 🇬🇧 English Description

### Technical Overview
This project leverages modern web technologies to create a smooth and interactive musical experience. The core philosophy relies on separating the audio logic (Tone.js) from the visual rendering (PixiJS) while keeping them synchronized via a central clock.

### Technology Stack
*   **React 18 & Vite:** The foundation of the application, providing a fast development environment and component-based architecture.
*   **PixiJS (@pixi/react):** A 2D WebGL rendering engine used for the main visualizer. It handles the rendering of falling notes, particle effects, and grid lines with high performance, ensuring 60fps even with complex MIDI files.
*   **Tone.js:** A powerful audio framework for the Web Audio API. It handles:
    *   Polyphonic synthesis for playback.
    *   Precise scheduling and timekeeping (Transport) to sync visuals with audio.
*   **@tonejs/midi:** A library to parse binary MIDI files into JSON-like structures for easy consumption by the visualizer.
*   **Vanilla CSS:** All styling is done using standard CSS3 (no frameworks like Tailwind), utilizing Flexbox and absolute positioning for a robust, responsive layout.

### Key Features
*   **Dual Input Modes:** Drag-and-drop MIDI files or connect a MIDI keyboard for live visualization.
*   **Visual Engine:**
    *   **Falling Notes:** Color-coded notes (Cyan for white keys, Magenta for black keys).
    *   **Particle System:** "Splash" particle effects when notes hit the piano line.
    *   **Note Labels:** Dynamic text rendering on falling notes (e.g., "C4", "F#5").
    *   **Grid System:** Vertical lines demarcating octaves for better readability.
*   **Interactive Piano:** A bottom-fixed piano component that mirrors the visualizer, lighting up keys in real-time.
*   **Responsive Layout:** A scrollable container ensures the full 88-key piano is accessible while maintaining correct key proportions.

---

## 🇫🇷 Description en Français

### Aperçu Technique
Ce projet utilise des technologies web modernes pour créer une expérience musicale fluide et interactive. La philosophie centrale repose sur la séparation de la logique audio (Tone.js) du rendu visuel (PixiJS) tout en les gardant synchronisés via une horloge centrale.

### Stack Technique
*   **React 18 & Vite :** La base de l'application, offrant un environnement de développement rapide et une architecture basée sur les composants.
*   **PixiJS (@pixi/react) :** Un moteur de rendu 2D WebGL utilisé pour le visualiseur principal. Il gère le rendu des notes tombantes, des effets de particules et des lignes de grille avec une haute performance, assurant 60fps même avec des fichiers MIDI complexes.
*   **Tone.js :** Un framework audio puissant pour l'API Web Audio. Il gère :
    *   La synthèse polyphonique pour la lecture.
    *   La planification précise et le chronométrage (Transport) pour synchroniser les visuels avec l'audio.
*   **@tonejs/midi :** Une bibliothèque pour analyser les fichiers MIDI binaires en structures JSON faciles à consommer par le visualiseur.
*   **Vanilla CSS :** Tout le style est réalisé en CSS3 standard (sans frameworks comme Tailwind), utilisant Flexbox et le positionnement absolu pour une mise en page robuste et responsive.

### Fonctionnalités Clés
*   **Modes d'Entrée Double :** Glisser-déposer des fichiers MIDI ou connecter un clavier MIDI pour une visualisation en direct.
*   **Moteur Visuel :**
    *   **Notes Tombantes :** Notes codées par couleur (Cyan pour les touches blanches, Magenta pour les touches noires).
    *   **Système de Particules :** Effets d'éclaboussure ("splash") lorsque les notes touchent la ligne du piano.
    *   **Étiquettes de Notes :** Rendu dynamique du texte sur les notes tombantes (ex: "C4", "F#5").
    *   **Système de Grille :** Lignes verticales délimitant les octaves pour une meilleure lisibilité.
*   **Piano Interactif :** Un composant piano fixé en bas qui reflète le visualiseur, illuminant les touches en temps réel.
*   **Mise en Page Responsive :** Un conteneur défilable assure que le piano complet de 88 touches est accessible tout en maintenant les proportions correctes des touches.
