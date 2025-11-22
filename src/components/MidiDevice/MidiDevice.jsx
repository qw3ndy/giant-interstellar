import React, { useEffect, useState } from 'react';
import { midiEngine } from '../../utils/MidiEngine';

const MidiDevice = () => {
    const [midiAccess, setMidiAccess] = useState(null);
    const [inputs, setInputs] = useState([]);

    useEffect(() => {
        if (navigator.requestMIDIAccess) {
            navigator.requestMIDIAccess().then(onMIDISuccess, onMIDIFailure);
        } else {
            console.warn("Web MIDI API not supported in this browser.");
        }
    }, []);

    const onMIDISuccess = (access) => {
        setMidiAccess(access);
        const inputs = Array.from(access.inputs.values());
        setInputs(inputs);

        inputs.forEach((input) => {
            input.onmidimessage = getMIDIMessage;
        });

        access.onstatechange = (e) => {
            console.log("MIDI state change", e);
            // Refresh inputs
            setInputs(Array.from(access.inputs.values()));
        };
    };

    const onMIDIFailure = () => {
        console.error("Could not access your MIDI devices.");
    };

    const getMIDIMessage = (message) => {
        const command = message.data[0];
        const note = message.data[1];
        const velocity = (message.data.length > 2) ? message.data[2] : 0;

        // Note On (usually 144-159)
        if (command >= 144 && command <= 159 && velocity > 0) {
            midiEngine.noteOn(note, velocity / 127);
        }
        // Note Off (usually 128-143, or Note On with velocity 0)
        else if ((command >= 128 && command <= 143) || (command >= 144 && command <= 159 && velocity === 0)) {
            midiEngine.noteOff(note);
        }
    };

    return null; // This component doesn't render anything visible
};

export default MidiDevice;
