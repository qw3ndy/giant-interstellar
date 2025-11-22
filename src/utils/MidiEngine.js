import * as Tone from 'tone';

export class MidiEngine {
    constructor() {
        this.midi = null;
        this.synths = [];
        this.isPlaying = false;
        this.liveNotes = new Set();

        // Main synth for playback and live input
        this.mainSynth = new Tone.PolySynth(Tone.Synth, {
            oscillator: { type: "triangle" },
            envelope: { attack: 0.02, decay: 0.1, sustain: 0.3, release: 1 }
        }).toDestination();
        this.synths.push(this.mainSynth);
    }

    async loadMidi(midiData) {
        this.midi = midiData;

        // Stop and reset transport to ensure we start from 0
        Tone.Transport.stop();
        Tone.Transport.position = 0;
        Tone.Transport.cancel();

        // Schedule notes
        if (this.midi.tracks) {
            this.midi.tracks.forEach(track => {
                track.notes.forEach(note => {
                    Tone.Transport.schedule((time) => {
                        this.mainSynth.triggerAttackRelease(note.name, note.duration, time, note.velocity);
                    }, note.time);
                });
            });
        }
    }

    async start() {
        await Tone.start();
        if (Tone.Transport.state !== 'started') {
            Tone.Transport.start();
        }
        this.isPlaying = true;
    }

    stop() {
        Tone.Transport.stop();
        this.isPlaying = false;
    }

    pause() {
        Tone.Transport.pause();
        this.isPlaying = false;
    }

    getCurrentTime() {
        return Tone.Transport.seconds;
    }

    // Live Input Methods
    noteOn(midiNote, velocity = 0.7) {
        const noteName = Tone.Frequency(midiNote, "midi").toNote();
        this.mainSynth.triggerAttack(noteName, Tone.now(), velocity);
        this.liveNotes.add(midiNote);
    }

    noteOff(midiNote) {
        const noteName = Tone.Frequency(midiNote, "midi").toNote();
        this.mainSynth.triggerRelease(noteName);
        this.liveNotes.delete(midiNote);
    }

    getActiveNotes() {
        const activeNotes = Array.from(this.liveNotes);

        if (this.midi && (this.isPlaying || Tone.Transport.state === 'started')) {
            const time = this.getCurrentTime();
            this.midi.tracks.forEach(track => {
                track.notes.forEach(note => {
                    if (time >= note.time && time < note.time + note.duration) {
                        activeNotes.push(note.midi);
                    }
                });
            });
        }
        return [...new Set(activeNotes)];
    }
}

export const midiEngine = new MidiEngine();
