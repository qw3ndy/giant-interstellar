import React, { useState } from 'react';
import { Midi } from '@tonejs/midi';
import { Upload } from 'lucide-react';

const MidiLoader = ({ onMidiLoaded, onLoadStart }) => {
    const [isDragging, setIsDragging] = useState(false);
    const [fileName, setFileName] = useState('');

    const handleFile = async (file) => {
        if (!file) return;

        if (onLoadStart) onLoadStart();
        setFileName(file.name);

        try {
            const arrayBuffer = await file.arrayBuffer();
            const midi = new Midi(arrayBuffer);
            onMidiLoaded(midi);
        } catch (error) {
            console.error("Error parsing MIDI file:", error);
            alert("Failed to parse MIDI file.");
            setFileName(''); // Reset on error
        }
    };

    const onDrop = (e) => {
        e.preventDefault();
        setIsDragging(false);
        const file = e.dataTransfer.files[0];
        if (file) handleFile(file);
    };

    const onDragOver = (e) => {
        e.preventDefault();
        setIsDragging(true);
    };

    const onDragLeave = () => {
        setIsDragging(false);
    };

    const onChange = (e) => {
        const file = e.target.files[0];
        if (file) handleFile(file);
    };

    return (
        <div
            className={`midi-loader-container ${isDragging ? 'dragging' : ''}`}
            onDrop={onDrop}
            onDragOver={onDragOver}
            onDragLeave={onDragLeave}
        >
            <label className="midi-upload-label" title={fileName || "Upload MIDI file"}>
                <Upload size={18} />
                <span className="upload-text" style={{ maxWidth: '150px', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                    {fileName || "Upload MIDI"}
                </span>
                <input
                    type="file"
                    accept=".mid,.midi"
                    className="midi-file-input"
                    onChange={onChange}
                />
            </label>
        </div>
    );
};

export default MidiLoader;
