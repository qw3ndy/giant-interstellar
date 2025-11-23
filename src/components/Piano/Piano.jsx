import React, { useMemo, useEffect, useState, useRef } from 'react';
import { generatePianoKeys } from '../../utils/pianoKeys';
import * as Tone from 'tone';
import { midiEngine } from '../../utils/MidiEngine';
import { WHITE_KEY_WIDTH, BLACK_KEY_WIDTH, START_NOTE, END_NOTE } from '../../utils/visualConstants';

const Piano = () => {
    const keys = useMemo(() => generatePianoKeys(START_NOTE, END_NOTE), []);
    const [activeNotes, setActiveNotes] = useState([]);
    const requestRef = useRef();

    const playNote = (note) => {
        const synth = new Tone.PolySynth(Tone.Synth).toDestination();
        synth.triggerAttackRelease(note, "8n");
    };

    useEffect(() => {
        const loop = () => {
            setActiveNotes(midiEngine.getActiveNotes());
            requestRef.current = requestAnimationFrame(loop);
        };
        requestRef.current = requestAnimationFrame(loop);
        return () => cancelAnimationFrame(requestRef.current);
    }, []);

    const containerStyle = {
        width: '100%',
        height: '100%',
        backgroundColor: '#1a1a1a',
        display: 'flex',
        // justifyContent: 'center', // REMOVED - piano starts at X=0 to match visualizer
        overflowX: 'auto',
        overflowY: 'hidden',
        position: 'relative',
        userSelect: 'none',
        boxShadow: '0 -10px 30px rgba(0,0,0,0.5)'
    };

    const feltStripStyle = {
        position: 'absolute',
        top: 0,
        left: 0,
        width: '100%',
        height: '8px',
        backgroundColor: '#ff0000',
        boxShadow: '0 0 10px #ff0000',
        zIndex: 5
    };

    const keysContainerStyle = {
        display: 'flex',
        height: '100%',
        position: 'relative',
        paddingTop: '8px'
    };

    const whiteKeyStyle = (isActive) => ({
        width: `${WHITE_KEY_WIDTH}px`,
        minWidth: `${WHITE_KEY_WIDTH}px`,
        height: '100%',
        background: isActive
            ? 'linear-gradient(to bottom, #93c5fd, #3b82f6)'
            : 'linear-gradient(to bottom, #ffffff, #e5e7eb)',
        border: '1px solid #9ca3af',
        borderTop: 'none',
        borderRadius: '0 0 8px 8px',
        cursor: 'pointer',
        position: 'relative',
        zIndex: 10,
        transition: 'all 0.075s ease-out',
        boxShadow: isActive
            ? 'inset 0 2px 4px rgba(0,0,0,0.3)'
            : '0 2px 5px rgba(0,0,0,0.1)',
        transform: isActive ? 'translateY(2px)' : 'translateY(0)'
    });

    const blackKeyStyle = (isActive) => ({
        width: `${BLACK_KEY_WIDTH}px`,
        height: '150px',
        position: 'absolute',
        right: `-${BLACK_KEY_WIDTH / 2}px`,
        top: 0,
        background: isActive
            ? 'linear-gradient(to bottom, #2563eb, #1e3a8a)'
            : 'linear-gradient(to bottom, #1f2937, #000000)',
        border: '1px solid #000000',
        borderTop: 'none',
        borderRadius: '0 0 8px 8px',
        cursor: 'pointer',
        zIndex: 20,
        transition: 'all 0.075s ease-out',
        boxShadow: isActive
            ? 'inset 0 2px 4px rgba(0,0,0,0.5)'
            : '2px 2px 5px rgba(0,0,0,0.5)'
    });

    return (
        <div style={containerStyle}>
            <div style={feltStripStyle}></div>

            <div style={keysContainerStyle}>
                {keys.map((key) => {
                    if (key.isSharp) return null;

                    const nextKey = keys.find(k => k.midi === key.midi + 1);
                    const hasSharp = nextKey && nextKey.isSharp;

                    const isActive = activeNotes.includes(key.midi);
                    const isSharpActive = nextKey && activeNotes.includes(nextKey.midi);

                    const isC = key.note.startsWith('C') && !key.note.includes('#');

                    return (
                        <div key={key.note} style={{ position: 'relative' }}>
                            {/* White Key */}
                            <div
                                style={{
                                    ...whiteKeyStyle(isActive),
                                    borderLeft: isC ? '2px solid #666' : '1px solid #9ca3af', // Octave separator
                                    display: 'flex',
                                    alignItems: 'flex-end',
                                    justifyContent: 'center',
                                    paddingBottom: '8px',
                                    color: isActive ? 'white' : '#666',
                                    fontSize: '10px',
                                    fontWeight: 'bold'
                                }}
                                onMouseDown={() => playNote(key.note)}
                            >
                                {key.note}
                            </div>

                            {/* Black Key */}
                            {hasSharp && (
                                <div
                                    style={{
                                        ...blackKeyStyle(isSharpActive),
                                        display: 'flex',
                                        alignItems: 'flex-end',
                                        justifyContent: 'center',
                                        paddingBottom: '8px',
                                        color: 'white',
                                        fontSize: '9px'
                                    }}
                                    onMouseDown={(e) => {
                                        e.stopPropagation();
                                        playNote(nextKey.note);
                                    }}
                                >
                                    {/* Optional: Label for black keys too, but might be crowded. Let's stick to white keys for now or minimal label */}
                                    {key.note}
                                </div>
                            )}
                        </div>
                    );
                })}
            </div>
        </div>
    );
};

export default Piano;
