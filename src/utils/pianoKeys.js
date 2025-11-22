import * as Tone from 'tone';

export const generatePianoKeys = (startNote = "A0", endNote = "C8") => {
    const notes = [];
    const startMidi = Tone.Frequency(startNote).toMidi();
    const endMidi = Tone.Frequency(endNote).toMidi();

    for (let i = startMidi; i <= endMidi; i++) {
        const noteName = Tone.Frequency(i, "midi").toNote();
        const isSharp = noteName.includes("#");
        // Parse octave and pitch from noteName (e.g. "C#4")
        // Regex to separate pitch (letter + optional sharp) and octave (number)
        const match = noteName.match(/^([A-G]#?)(\d+)$/);
        const pitch = match ? match[1] : "";
        const octave = match ? parseInt(match[2], 10) : 0;

        notes.push({
            note: noteName,
            midi: i,
            isSharp,
            octave,
            pitch,
        });
    }
    return notes;
};
