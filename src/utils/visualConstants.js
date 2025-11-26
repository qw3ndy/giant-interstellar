export const WHITE_KEY_WIDTH = 40;
export const BLACK_KEY_WIDTH = 24;
export const PIANO_HEIGHT = 240;
export const NOTE_FALL_SPEED = 200; // pixels per second
export const START_NOTE = "A0";
export const END_NOTE = "C8";
export const TOTAL_WHITE_KEYS = 52; // A0 to C8
export const TOTAL_PIANO_WIDTH = TOTAL_WHITE_KEYS * WHITE_KEY_WIDTH;

// Calculate total piano width based on note range
export const calculatePianoWidth = (startMidi, endMidi) => {
    let whiteKeyCount = 0;
    for (let midi = startMidi; midi <= endMidi; midi++) {
        const pitchClass = midi % 12;
        const isSharp = [1, 3, 6, 8, 10].includes(pitchClass);
        if (!isSharp) whiteKeyCount++;
    }
    return whiteKeyCount * WHITE_KEY_WIDTH;
};
