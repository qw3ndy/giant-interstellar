import React, { useEffect, useState, useRef, useMemo } from 'react';
import { Stage, Container, Graphics, Text, Sprite, useTick } from '@pixi/react';
import { midiEngine } from '../../utils/MidiEngine';
import { WHITE_KEY_WIDTH, BLACK_KEY_WIDTH, NOTE_FALL_SPEED, calculatePianoWidth } from '../../utils/visualConstants';
import * as Tone from 'tone';
import pianoLogo from '../../assets/piano-logo.png';

// Note Component for PixiJS
const FallingNotes = ({ midiData, screenHeight, screenWidth, handView, showParticles }) => {
    const graphicsRef = useRef(null);
    const lastTimeRef = useRef(0);
    const particlesRef = useRef([]);

    const startMidi = useMemo(() => {
        const range = midiEngine.getNoteRange();
        return range.minNote;
    }, [midiData]);

    useTick((delta) => {
        if (!graphicsRef.current || !midiData) return;

        const g = graphicsRef.current;
        g.clear();

        // Get current time - if at position 0, show preview from -2 seconds
        let currentTime = midiEngine.getCurrentTime();
        if (currentTime === 0) {
            currentTime = -2; // Show notes from 0 to ~3.5 seconds
        }

        const lastTime = lastTimeRef.current;
        const effectiveHeight = Math.max(screenHeight, 300);
        const lookAheadTime = effectiveHeight / NOTE_FALL_SPEED;

        // Update and draw particles
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
            if (handView === 'right' && trackIndex !== 0) return;
            if (handView === 'left' && trackIndex !== 1) return;

            // Color Logic
            let baseColor = 0x999999;
            if (trackIndex === 0) baseColor = 0xFFD700; // Gold
            if (trackIndex === 1) baseColor = 0x00F3FF; // Cyan

            track.notes.forEach(note => {
                const timeToHit = note.time - currentTime;

                // Hit Detection
                if (note.time > lastTime && note.time <= currentTime) {
                    if (showParticles) {
                        // Calculate X
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

                        const hitX = finalX + width / 2;
                        const hitY = screenHeight;
                        const color = baseColor;

                        for (let i = 0; i < 8; i++) {
                            particlesRef.current.push({
                                x: hitX,
                                y: hitY,
                                vx: (Math.random() - 0.5) * 5,
                                vy: -(Math.random() * 5 + 2),
                                life: 1.0,
                                size: Math.random() * 3 + 1,
                                color: color
                            });
                        }
                    }
                }

                // Visibility check
                if (timeToHit > lookAheadTime || timeToHit < -5) return;

                const noteHeight = note.duration * NOTE_FALL_SPEED;
                const distanceToHit = timeToHit * NOTE_FALL_SPEED;
                const y = screenHeight - distanceToHit - noteHeight;

                // X Calculation
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

                // Draw
                let color = baseColor;

                // Darken if sharp
                if (isCurrentSharp) {
                    if (trackIndex === 0) color = 0xB8860B; // Dark Gold
                    else if (trackIndex === 1) color = 0x008B8B; // Dark Cyan
                    else color = 0x666666;
                }

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
    const startMidi = useMemo(() => {
        const range = midiEngine.getNoteRange();
        return range.minNote;
    }, [midiData]);
    const [visibleNotes, setVisibleNotes] = useState([]);

    useTick(() => {
        if (!midiData) return;

        let currentTime = midiEngine.getCurrentTime();
        if (currentTime === 0) currentTime = -2;

        const effectiveHeight = Math.max(screenHeight, 300);
        const lookAheadTime = effectiveHeight / NOTE_FALL_SPEED;
        const notes = [];

        midiData.tracks.forEach((track, trackIndex) => {
            if (handView === 'right' && trackIndex !== 0) return;
            if (handView === 'left' && trackIndex !== 1) return;

            track.notes.forEach((note, noteIndex) => {
                const timeToHit = note.time - currentTime;
                if (timeToHit > lookAheadTime || timeToHit < -5) return;

                const noteHeight = note.duration * NOTE_FALL_SPEED;
                if (noteHeight < 25) return;

                const distanceToHit = timeToHit * NOTE_FALL_SPEED;
                const y = screenHeight - distanceToHit - noteHeight;

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

                notes.push({
                    name: note.name,
                    x: finalX + width / 2,
                    y: y + noteHeight / 2,
                    key: `${trackIndex}-${noteIndex}-${note.name}-${note.time}`
                });
            });
        });

        const uniqueNotes = [];
        const notesByPitch = {};

        notes.forEach(note => {
            if (!notesByPitch[note.name]) notesByPitch[note.name] = [];
            notesByPitch[note.name].push(note);
        });

        Object.values(notesByPitch).forEach(pitchNotes => {
            pitchNotes.sort((a, b) => a.y - b.y);
            let lastNote = null;
            pitchNotes.forEach(note => {
                if (!lastNote || Math.abs(note.y - lastNote.y) > 50) {
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

// Component for rendering background grid lines
const GridLines = ({ screenHeight, screenWidth }) => {
    const graphicsRef = useRef(null);
    const noteRange = useMemo(() => midiEngine.getNoteRange(), []);

    useTick(() => {
        if (!graphicsRef.current) return;

        const g = graphicsRef.current;
        g.clear();

        let x = 0;

        for (let i = noteRange.minNote; i <= noteRange.maxNote; i++) {
            const pitchClass = i % 12;
            const isSharp = [1, 3, 6, 8, 10].includes(pitchClass);

            if (pitchClass === 0) {
                const lineX = x;
                g.lineStyle(2, 0x333333, 0.5);
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

    useEffect(() => {
        const updateDimensions = () => {
            const range = midiEngine.getNoteRange();
            const pianoWidth = calculatePianoWidth(range.minNote, range.maxNote);

            const availableHeight = window.innerHeight - 240 - 150;
            setDimensions({
                width: pianoWidth,
                height: Math.max(availableHeight, 400)
            });
        };

        updateDimensions();
        window.addEventListener('resize', updateDimensions);
        return () => window.removeEventListener('resize', updateDimensions);
    }, [midiData]);

    if (!midiData) {
        return (
            <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#666' }}>
                Upload a MIDI file to start
            </div>
        );
    }

    const height = dimensions.height || 400;
    const width = dimensions.width || calculatePianoWidth(21, 108);

    return (
        <div ref={containerRef} style={{ width: '100%', height: '100%' }}>
            <Stage width={width} height={height} options={{ backgroundAlpha: 0, antialias: true }}>
                <Container>
                    <Sprite
                        image={pianoLogo}
                        x={width / 2}
                        y={height / 2}
                        anchor={0.5}
                        alpha={0.1}
                        scale={0.5}
                    />
                    <GridLines screenHeight={height} screenWidth={width} />
                    <FallingNotes
                        midiData={midiData}
                        screenHeight={height}
                        screenWidth={width}
                        handView={handView}
                        showParticles={showParticles}
                    />
                    <NoteLabels midiData={midiData} screenHeight={height} screenWidth={width} handView={handView} />
                </Container>
            </Stage>
        </div>
    );
};

export default Visualizer;
