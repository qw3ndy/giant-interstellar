import React, { useEffect, useState, useRef, useMemo } from 'react';
import { Stage, Container, Graphics, Text, Sprite, useTick } from '@pixi/react';
import { midiEngine } from '../../utils/MidiEngine';
import { WHITE_KEY_WIDTH, BLACK_KEY_WIDTH, NOTE_FALL_SPEED, START_NOTE, END_NOTE } from '../../utils/visualConstants';
import * as Tone from 'tone';
import pianoLogo from '../../assets/piano-logo.png';

// Note Component for PixiJS
const FallingNotes = ({ midiData, screenHeight, screenWidth, handView, showParticles }) => {
    const graphicsRef = useRef(null);

    const lastTimeRef = useRef(0);
    const particlesRef = useRef([]);

    // Pre-calculate start MIDI to avoid doing it in the loop
    const startMidi = useMemo(() => Tone.Frequency(START_NOTE).toMidi(), []);

    useTick((delta) => {
        if (!graphicsRef.current || !midiData || screenHeight === 0) return;

        const g = graphicsRef.current;
        g.clear();

        const currentTime = midiEngine.getCurrentTime();
        const lastTime = lastTimeRef.current;
        const lookAheadTime = screenHeight / NOTE_FALL_SPEED;

        // Update and draw particles
        // Filter out dead particles
        particlesRef.current = particlesRef.current.filter(p => p.life > 0);

        particlesRef.current.forEach(p => {
            p.x += p.vx * delta;
            p.y += p.vy * delta;
            p.life -= 0.05 * delta;
            p.alpha = Math.max(0, p.life);

            g.beginFill(p.color, p.alpha);
            g.drawCircle(p.x, p.y, p.size);
            g.endFill();
        });

        midiData.tracks.forEach((track, trackIndex) => {
            // Hand Filtering Logic
            // Track 0 = Right Hand (usually), Track 1 = Left Hand (usually)
            if (handView === 'right' && trackIndex !== 0) return;
            if (handView === 'left' && trackIndex !== 1) return;
            // If 'both', show all (or maybe just first two? let's show all for now but color first two)

            // Color Logic
            // Right Hand (Track 0) = Gold/Yellow (0xFFD700)
            // Left Hand (Track 1) = Cyan/Blue (0x00F3FF)
            // Others = Grey/Default
            let baseColor = 0x999999;
            if (trackIndex === 0) baseColor = 0xFFD700; // Gold
            if (trackIndex === 1) baseColor = 0x00F3FF; // Cyan

            track.notes.forEach(note => {
                const timeToHit = note.time - currentTime;

                // Hit Detection
                // If note time is between last frame time and current time, it just hit
                if (note.time > lastTime && note.time <= currentTime) {
                    if (showParticles) {
                        // Spawn particles
                        // Calculate X (reusing logic - ideally should be a helper, but keeping inline for now)
                        let x = 0;
                        for (let i = startMidi; i < note.midi; i++) {
                            const pitchClass = i % 12;
                            const isSharp = [1, 3, 6, 8, 10].includes(pitchClass);
                            if (!isSharp) x += WHITE_KEY_WIDTH;
                        }
                        let finalX = x;
                        let width = WHITE_KEY_WIDTH - 2;
                        const currentPitchClass = note.midi % 12;
                        const isCurrentSharp = [1, 3, 6, 8, 10].includes(currentPitchClass);
                        if (isCurrentSharp) {
                            finalX = x - (BLACK_KEY_WIDTH / 2);
                            width = BLACK_KEY_WIDTH;
                        }

                        // Center offset
                        const endMidi = Tone.Frequency(END_NOTE).toMidi();
                        let totalWhiteKeys = 0;
                        for (let i = startMidi; i <= endMidi; i++) {
                            const pc = i % 12;
                            if (![1, 3, 6, 8, 10].includes(pc)) totalWhiteKeys++;
                        }
                        const totalPianoWidth = totalWhiteKeys * WHITE_KEY_WIDTH;
                        const startOffset = (screenWidth - totalPianoWidth) / 2;
                        finalX += startOffset;

                        const hitX = finalX + width / 2;
                        const hitY = screenHeight; // Bottom of screen/top of keys

                        // Use the track color for particles too
                        const color = baseColor;

                        // Create burst
                        for (let i = 0; i < 8; i++) {
                            particlesRef.current.push({
                                x: hitX,
                                y: hitY,
                                vx: (Math.random() - 0.5) * 5,
                                vy: -(Math.random() * 5 + 2), // Upwards
                                life: 1.0,
                                size: Math.random() * 3 + 1,
                                color: color
                            });
                        }
                    }
                }

                // Relaxed visibility check
                // Show notes that are about to hit (timeToHit < lookAheadTime)
                // And notes that have passed but might still be visible (timeToHit > -5)
                if (timeToHit > lookAheadTime || timeToHit < -5) {
                    return;
                }

                const noteHeight = note.duration * NOTE_FALL_SPEED;
                const distanceToHit = timeToHit * NOTE_FALL_SPEED;
                const y = screenHeight - distanceToHit - noteHeight;

                // X Calculation
                let x = 0;
                for (let i = startMidi; i < note.midi; i++) {
                    const pitchClass = i % 12;
                    const isSharp = [1, 3, 6, 8, 10].includes(pitchClass);
                    if (!isSharp) {
                        x += WHITE_KEY_WIDTH;
                    }
                }

                let finalX = x;
                let width = WHITE_KEY_WIDTH - 2;

                const currentPitchClass = note.midi % 12;
                const isCurrentSharp = [1, 3, 6, 8, 10].includes(currentPitchClass);

                if (isCurrentSharp) {
                    finalX = x - (BLACK_KEY_WIDTH / 2);
                    width = BLACK_KEY_WIDTH;
                }

                // Center the visualizer
                const endMidi = Tone.Frequency(END_NOTE).toMidi();
                let totalWhiteKeys = 0;
                for (let i = startMidi; i <= endMidi; i++) {
                    const pc = i % 12;
                    if (![1, 3, 6, 8, 10].includes(pc)) totalWhiteKeys++;
                }
                const totalPianoWidth = totalWhiteKeys * WHITE_KEY_WIDTH;
                const startOffset = (screenWidth - totalPianoWidth) / 2;

                finalX += startOffset;

                // Draw
                // Use track color
                const color = baseColor;

                g.beginFill(color);
                const radius = width / 2;
                g.drawRoundedRect(finalX, y, width, noteHeight, radius);
                g.endFill();

                g.beginFill(0xffffff, 0.3);
                g.drawRoundedRect(finalX + 4, y + 4, width - 8, Math.max(0, noteHeight - 8), radius - 2);
                g.endFill();
            });
        });

        lastTimeRef.current = currentTime;
    });

    return <Graphics ref={graphicsRef} />;
};

// Component for rendering note name labels
const NoteLabels = ({ midiData, screenHeight, screenWidth, handView }) => {
    const startMidi = useMemo(() => Tone.Frequency(START_NOTE).toMidi(), []);
    const [visibleNotes, setVisibleNotes] = useState([]);

    useTick(() => {
        if (!midiData || screenHeight === 0) return;

        const currentTime = midiEngine.getCurrentTime();
        const lookAheadTime = screenHeight / NOTE_FALL_SPEED;
        const notes = [];

        midiData.tracks.forEach((track, trackIndex) => {
            // Hand Filtering Logic
            if (handView === 'right' && trackIndex !== 0) return;
            if (handView === 'left' && trackIndex !== 1) return;

            track.notes.forEach((note, noteIndex) => {
                const timeToHit = note.time - currentTime;

                if (timeToHit > lookAheadTime || timeToHit < -5) {
                    return;
                }

                const noteHeight = note.duration * NOTE_FALL_SPEED;

                // Only show text if note is tall enough
                if (noteHeight < 25) return;

                const distanceToHit = timeToHit * NOTE_FALL_SPEED;
                const y = screenHeight - distanceToHit - noteHeight;

                // X Calculation (same as in FallingNotes)
                let x = 0;
                for (let i = startMidi; i < note.midi; i++) {
                    const pitchClass = i % 12;
                    const isSharp = [1, 3, 6, 8, 10].includes(pitchClass);
                    if (!isSharp) x += WHITE_KEY_WIDTH;
                }

                let finalX = x;
                let width = WHITE_KEY_WIDTH - 2;
                const currentPitchClass = note.midi % 12;
                const isCurrentSharp = [1, 3, 6, 8, 10].includes(currentPitchClass);

                if (isCurrentSharp) {
                    finalX = x - (BLACK_KEY_WIDTH / 2);
                    width = BLACK_KEY_WIDTH;
                }

                // Center offset
                const endMidi = Tone.Frequency(END_NOTE).toMidi();
                let totalWhiteKeys = 0;
                for (let i = startMidi; i <= endMidi; i++) {
                    const pc = i % 12;
                    if (![1, 3, 6, 8, 10].includes(pc)) totalWhiteKeys++;
                }
                const totalPianoWidth = totalWhiteKeys * WHITE_KEY_WIDTH;
                const startOffset = (screenWidth - totalPianoWidth) / 2;
                finalX += startOffset;

                notes.push({
                    name: note.name,
                    x: finalX + width / 2,
                    y: y + noteHeight / 2,
                    key: `${trackIndex}-${noteIndex}-${note.name}-${note.time}`
                });
            });
        });

        // De-duplicate overlapping labels
        const uniqueNotes = [];
        const notesByPitch = {};

        notes.forEach(note => {
            if (!notesByPitch[note.name]) {
                notesByPitch[note.name] = [];
            }
            notesByPitch[note.name].push(note);
        });

        Object.values(notesByPitch).forEach(pitchNotes => {
            // Sort by Y position
            pitchNotes.sort((a, b) => a.y - b.y);

            let lastNote = null;
            pitchNotes.forEach(note => {
                if (!lastNote || Math.abs(note.y - lastNote.y) > 50) { // 50px minimum distance
                    uniqueNotes.push(note);
                    lastNote = note;
                }
            });
        });

        setVisibleNotes(uniqueNotes);
    });

    return (
        <>
            {visibleNotes.map(note => (
                <Text
                    key={note.key}
                    text={note.name}
                    x={note.x}
                    y={note.y}
                    anchor={0.5}
                    style={{
                        fontSize: 11,
                        fontWeight: 'bold',
                        fill: 0xffffff,
                        stroke: 0x000000,
                        strokeThickness: 3
                    }}
                />
            ))}
        </>
    );
};

// Component for rendering background grid lines (octave separators)
const GridLines = ({ screenHeight, screenWidth }) => {
    const graphicsRef = useRef(null);
    const startMidi = useMemo(() => Tone.Frequency(START_NOTE).toMidi(), []);

    useTick(() => {
        if (!graphicsRef.current || screenHeight === 0) return;

        const g = graphicsRef.current;
        g.clear();

        // Center offset calculation
        const endMidi = Tone.Frequency(END_NOTE).toMidi();
        let totalWhiteKeys = 0;
        for (let i = startMidi; i <= endMidi; i++) {
            const pc = i % 12;
            if (![1, 3, 6, 8, 10].includes(pc)) totalWhiteKeys++;
        }
        const totalPianoWidth = totalWhiteKeys * WHITE_KEY_WIDTH;
        const startOffset = (screenWidth - totalPianoWidth) / 2;

        // Draw lines
        let x = 0;
        for (let i = startMidi; i <= endMidi; i++) {
            const pitchClass = i % 12;
            const isSharp = [1, 3, 6, 8, 10].includes(pitchClass);

            // If it's a C (0) and not the very first note (unless we want a line there too)
            if (pitchClass === 0) {
                const lineX = startOffset + x;
                g.lineStyle(2, 0x333333, 0.5); // Dark grey, semi-transparent
                g.moveTo(lineX, 0);
                g.lineTo(lineX, screenHeight);
            }

            if (!isSharp) {
                x += WHITE_KEY_WIDTH;
            }
        }
    });

    return <Graphics ref={graphicsRef} />;
};

const Visualizer = ({ midiData, handView, showParticles }) => {
    const containerRef = useRef(null);
    const [dimensions, setDimensions] = useState({ width: 0, height: 0 });

    console.log('Visualizer Render:', { midiData: !!midiData, handView, showParticles, dimensions });

    useEffect(() => {
        if (!containerRef.current) return;

        const resizeObserver = new ResizeObserver((entries) => {
            for (let entry of entries) {
                const { width, height } = entry.contentRect;
                if (width > 0 && height > 0) {
                    setDimensions({ width, height });
                }
            }
        });

        resizeObserver.observe(containerRef.current);
        return () => resizeObserver.disconnect();
    }, []);

    if (!midiData) {
        return (
            <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#666' }}>
                Upload a MIDI file to start
            </div>
        );
    }

    return (
        <div ref={containerRef} style={{ width: '100%', height: '100%' }}>
            {dimensions.width > 0 && (
                <Stage width={dimensions.width} height={dimensions.height} options={{ backgroundAlpha: 0, antialias: true }}>
                    <Container>
                        <Sprite
                            image={pianoLogo}
                            x={dimensions.width / 2}
                            y={dimensions.height / 2}
                            anchor={0.5}
                            alpha={0.1}
                            scale={0.5}
                        />
                        <GridLines screenHeight={dimensions.height} screenWidth={dimensions.width} />
                        <FallingNotes
                            midiData={midiData}
                            screenHeight={dimensions.height}
                            screenWidth={dimensions.width}
                            handView={handView}
                            showParticles={showParticles}
                        />
                        <NoteLabels midiData={midiData} screenHeight={dimensions.height} screenWidth={dimensions.width} handView={handView} />
                    </Container>
                </Stage>
            )}
        </div>
    );
};

export default Visualizer;
