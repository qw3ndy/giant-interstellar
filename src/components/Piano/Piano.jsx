import React, { useMemo, useEffect, useState, useRef } from 'react';
import { generatePianoKeys } from '../../utils/pianoKeys';
import * as Tone from 'tone';
import { midiEngine } from '../../utils/MidiEngine';
import { WHITE_KEY_WIDTH, BLACK_KEY_WIDTH, START_NOTE, END_NOTE } from '../../utils/visualConstants';

const Piano = () => {
    const keys = useMemo(() => generatePianoKeys(START_NOTE, END_NOTE), []);
    const [activeNotesWithFeedback, setActiveNotesWithFeedback] = useState([]);
    const requestRef = useRef();

    const playNote = (note) => {
        const synth = new Tone.PolySynth(Tone.Synth).toDestination();
        synth.triggerAttackRelease(note, "8n");
    };

    useEffect(() => {
        const loop = () => {
            setActiveNotesWithFeedback(midiEngine.getActiveNotesWithFeedback());
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

    const whiteKeyStyle = (trackIndex, feedback) => {
        const isActive = trackIndex !== null;

        let background;
        if (isActive) {

            let topColor, midColor, bottomColor1, bottomColor2;

            if (feedback === 'correct') {
                console.log(trackIndex);
                bottomColor1 = '#00FF00';
                bottomColor2 = '#00CC00';
                topColor = '#00FF00';
                midColor = '#00CC00';
            } else if (feedback === 'incorrect') {
                console.log(trackIndex);
                bottomColor1 = '#FF0000';
                bottomColor2 = '#CC0000';
                topColor = '#ffffff';
                midColor = '#e5e7eb';
            } else {
                bottomColor1 = '#ffffff';
                bottomColor2 = '#e5e7eb';
                topColor = trackIndex === 0 ? '#FF8C00' : '#00F3FF';
                midColor = trackIndex === 0 ? '#FFA500' : '#00CED1';
            }

            background = `linear-gradient(to bottom, ${topColor} 0%, ${midColor} 70%, ${bottomColor1} 85%, ${bottomColor2} 100%)`;
        } else {
            background = 'linear-gradient(to bottom, #ffffff, #e5e7eb)';
        }

        return {
            width: `${WHITE_KEY_WIDTH}px`,
            minWidth: `${WHITE_KEY_WIDTH}px`,
            height: '100%',
            background,
            border: '1px solid #9ca3af',
            borderTop: 'none',
            borderRadius: '0 0 8px 8px',
            cursor: 'pointer',
            position: 'relative',
            zIndex: 10,
            transition: 'all 0.075s ease-out',
            boxShadow: isActive ? 'inset 0 2px 4px rgba(0,0,0,0.3)' : '0 2px 5px rgba(0,0,0,0.1)',
            transform: isActive ? 'translateY(2px)' : 'translateY(0)'
        };
    };

    const blackKeyStyle = (trackIndex, feedback) => {
        const isActive = trackIndex !== null;

        let background;
        if (isActive) {
            let topColor, midColor, bottomColor1, bottomColor2;

            if (feedback === 'correct') {
                bottomColor1 = '#00CC00';
                bottomColor2 = '#009900';
                topColor = '#00CC00';
                midColor = '#009900';
            } else if (feedback === 'incorrect') {
                bottomColor1 = '#CC0000';
                bottomColor2 = '#990000';
                topColor = '#1f2937';
                midColor = '#000000';
            } else {
                topColor = trackIndex === 0 ? '#B8860B' : '#008B8B';
                midColor = trackIndex === 0 ? '#996515' : '#006B6B';
                bottomColor1 = '#1f2937';
                bottomColor2 = '#000000';
            }

            background = `linear-gradient(to bottom, ${topColor} 0%, ${midColor} 70%, ${bottomColor1} 85%, ${bottomColor2} 100%)`;
        } else {
            background = 'linear-gradient(to bottom, #1f2937, #000000)';
        }

        return {
            width: `${BLACK_KEY_WIDTH}px`,
            height: '150px',
            position: 'absolute',
            right: `-${BLACK_KEY_WIDTH / 2}px`,
            top: 0,
            background,
            border: '1px solid #000000',
            borderTop: 'none',
            borderRadius: '0 0 8px 8px',
            cursor: 'pointer',
            zIndex: 20,
            transition: 'all 0.075s ease-out',
            boxShadow: isActive ? 'inset 0 2px 4px rgba(0,0,0,0.5)' : '2px 2px 5px rgba(0,0,0,0.5)'
        };
    };

    return (
        <div style={containerStyle}>
            <div style={feltStripStyle}></div>
            <div style={keysContainerStyle}>
                {keys.map((key) => {
                    if (key.isSharp) return null;

                    const nextKey = keys.find(k => k.midi === key.midi + 1);
                    const hasSharp = nextKey && nextKey.isSharp;

                    const activeNoteInfo = activeNotesWithFeedback.find(n => n.midi === key.midi);
                    const trackIndex = activeNoteInfo ? activeNoteInfo.track : null;
                    const feedback = activeNoteInfo ? activeNoteInfo.feedback : null;

                    const activeSharpInfo = nextKey ? activeNotesWithFeedback.find(n => n.midi === nextKey.midi) : null;
                    const sharpTrackIndex = activeSharpInfo ? activeSharpInfo.track : null;
                    const sharpFeedback = activeSharpInfo ? activeSharpInfo.feedback : null;

                    const isC = key.note.startsWith('C') && !key.note.includes('#');

                    return (
                        <div key={key.note} style={{ position: 'relative' }}>
                            <div
                                style={{
                                    ...whiteKeyStyle(trackIndex, feedback),
                                    borderLeft: isC ? '2px solid #666' : '1px solid #9ca3af',
                                    display: 'flex',
                                    alignItems: 'flex-end',
                                    justifyContent: 'center',
                                    paddingBottom: '8px',
                                    color: trackIndex !== null ? 'white' : '#666',
                                    fontSize: '10px',
                                    fontWeight: 'bold'
                                }}
                                onMouseDown={() => playNote(key.note)}
                            >
                                {key.note}
                            </div>

                            {hasSharp && (
                                <div
                                    style={{
                                        ...blackKeyStyle(sharpTrackIndex, sharpFeedback),
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
