import * as Tone from 'tone';

export class MidiEngine {
    constructor() {
        this.midi = null;
        this.synths = [];
        this.isPlaying = false;
        this.liveNotes = new Set();
        this.userPlayedNotes = new Set(); // Notes played by user input
        this.allMidiNotes = new Set(); // All unique notes in the MIDI file
        this.originalBpm = 120;
        this.handView = 'both';
        this.currentInstrument = 'piano';

        // Create initial synth
        this.createSynth('piano');
    }

    createSynth(instrumentType) {
        // Dispose of old synths
        this.synths.forEach(synth => synth.dispose());
        this.synths = [];

        // Create new synth based on type
        let synth;
        switch (instrumentType) {
            case 'piano':
                synth = new Tone.PolySynth(Tone.Synth, {
                    oscillator: { type: "triangle" },
                    envelope: { attack: 0.02, decay: 0.1, sustain: 0.3, release: 1 }
                }).toDestination();
                break;
            case 'electric':
                synth = new Tone.PolySynth(Tone.Synth, {
                    oscillator: { type: "square" },
                    envelope: { attack: 0.005, decay: 0.1, sustain: 0.4, release: 0.8 }
                }).toDestination();
                break;
            case 'organ':
                synth = new Tone.PolySynth(Tone.Synth, {
                    oscillator: { type: "sine" },
                    envelope: { attack: 0.001, decay: 0.1, sustain: 0.9, release: 0.1 }
                }).toDestination();
                break;
            case 'strings':
                synth = new Tone.PolySynth(Tone.Synth, {
                    oscillator: { type: "sawtooth" },
                    envelope: { attack: 0.3, decay: 0.2, sustain: 0.7, release: 1.5 }
                }).toDestination();
                break;
            case 'synth':
                synth = new Tone.PolySynth(Tone.Synth, {
                    oscillator: { type: "sine" },
                    envelope: { attack: 0.1, decay: 0.2, sustain: 0.5, release: 1.2 }
                }).toDestination();
                break;
            default:
                synth = new Tone.PolySynth(Tone.Synth, {
                    oscillator: { type: "triangle" },
                    envelope: { attack: 0.02, decay: 0.1, sustain: 0.3, release: 1 }
                }).toDestination();
        }

        this.mainSynth = synth;
        this.synths.push(synth);
        this.currentInstrument = instrumentType;
    }

    setInstrument(instrumentType) {
        this.createSynth(instrumentType);
    }

    async loadMidi(midiData) {
        this.midi = midiData;

        // Stop and reset transport to ensure we start from 0
        Tone.Transport.stop();
        Tone.Transport.position = 0;
        Tone.Transport.cancel();

        // Store original BPM (default to 120 if not present)
        this.originalBpm = this.midi.header.tempos.length > 0 ? this.midi.header.tempos[0].bpm : 120;
        Tone.Transport.bpm.value = this.originalBpm;

        // Build set of all unique MIDI notes in the file
        this.allMidiNotes.clear();
        if (this.midi.tracks) {
            this.midi.tracks.forEach(track => {
                track.notes.forEach(note => {
                    this.allMidiNotes.add(note.midi);
                });
            });
        }

        // Schedule notes
        if (this.midi.tracks) {
            this.midi.tracks.forEach((track, trackIndex) => {
                track.notes.forEach(note => {
                    Tone.Transport.schedule((time) => {
                        // Check if this track should play based on handView
                        // Track 0 = Right, Track 1 = Left
                        if (this.handView === 'right' && trackIndex !== 0) return;
                        if (this.handView === 'left' && trackIndex !== 1) return;

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
        if (!this.midi || !this.originalBpm) return 0;
        // Calculate time based on ticks and original BPM to keep visualizer in sync
        // ticks / PPQ * 60 / originalBPM
        const ppq = Tone.Transport.PPQ;
        return (Tone.Transport.ticks / ppq) * (60 / this.originalBpm);
    }

    // Live Input Methods
    noteOn(midiNote, velocity = 0.7) {
        const noteName = Tone.Frequency(midiNote, "midi").toNote();
        this.mainSynth.triggerAttack(noteName, Tone.now(), velocity);
        this.liveNotes.add(midiNote);
        this.userPlayedNotes.add(midiNote); // Mark as user-played
    }

    noteOff(midiNote) {
        const noteName = Tone.Frequency(midiNote, "midi").toNote();
        this.mainSynth.triggerRelease(noteName);
        this.liveNotes.delete(midiNote);
        this.userPlayedNotes.delete(midiNote); // Remove from user-played
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

    getActiveNotesWithTracks() {
        const activeNotes = [];

        // Live notes don't have track info, default to track 0 (right hand/gold)
        this.liveNotes.forEach(midiNote => {
            activeNotes.push({ midi: midiNote, track: 99 });
        });

        if (this.midi && (this.isPlaying || Tone.Transport.state === 'started')) {
            const time = this.getCurrentTime();
            this.midi.tracks.forEach((track, trackIndex) => {
                track.notes.forEach(note => {
                    if (time >= note.time && time < note.time + note.duration) {
                        activeNotes.push({ midi: note.midi, track: trackIndex });
                    }
                });
            });
        }

        // Remove duplicates, preferring the first occurrence (live notes or first track)
        const uniqueNotes = new Map();
        activeNotes.forEach(noteInfo => {
            if (!uniqueNotes.has(noteInfo.midi)) {
                uniqueNotes.set(noteInfo.midi, noteInfo.track);
            }
        });

        return Array.from(uniqueNotes.entries()).map(([midi, track]) => ({ midi, track }));
    }

    getActiveNotesWithFeedback() {
        const activeNotes = [];

        // Get notes currently being played by MIDI
        const midiActiveNotes = new Set();
        if (this.midi && (this.isPlaying || Tone.Transport.state === 'started')) {
            const time = this.getCurrentTime();
            this.midi.tracks.forEach((track, trackIndex) => {
                track.notes.forEach(note => {
                    if (time >= note.time && time < note.time + note.duration) {
                        midiActiveNotes.add(note.midi);
                    }
                });
            });
        }

        // Get all active notes with track info
        const notesWithTracks = this.getActiveNotesWithTracks();

        notesWithTracks.forEach(noteInfo => {
            let feedback = null;

            // Check if this note was played by the user
            if (this.userPlayedNotes.has(noteInfo.midi)) {
                // Check if the note is currently being played by MIDI (timing correct)
                if (midiActiveNotes.has(noteInfo.midi)) {
                    feedback = 'correct'; // Green: timing is correct
                } else {
                    feedback = 'incorrect'; // Red: wrong timing or wrong note
                }
            }

            activeNotes.push({
                midi: noteInfo.midi,
                track: noteInfo.track,
                feedback: feedback // null for MIDI auto-play, 'correct' or 'incorrect' for user
            });
        });

        return activeNotes;
    }

    setTime(seconds) {
        if (seconds >= 0 && seconds <= this.getDuration() && this.originalBpm) {
            const ppq = Tone.Transport.PPQ;
            const ticks = (seconds * this.originalBpm / 60) * ppq;
            Tone.Transport.ticks = ticks;
        }
    }

    setPlaybackRate(rate) {
        if (this.originalBpm) {
            Tone.Transport.bpm.value = this.originalBpm * rate;
        }
    }

    setHandView(handView) {
        // 'both', 'right' (track 0), 'left' (track 1)
        // We can't easily mute individual notes in the scheduler once scheduled, 
        // but we can control the volume of the synth or filtering logic.
        // However, since we are using a single PolySynth for all tracks, we can't mute just one track's notes easily 
        // WITHOUT rescheduling or having separate synths per track.

        // REFACTOR: To support muting, we should probably have separate synths or 
        // just filter the notes in the scheduler?
        // Actually, the easiest way with the current setup (single synth) is to NOT schedule the notes 
        // for the muted track, OR to have a check inside the schedule callback.

        // Let's update the scheduler to check a mutedTracks set.
        this.handView = handView;
    }

    getDuration() {
        return this.midi ? this.midi.duration : 0;
    }
}

export const midiEngine = new MidiEngine();
