import React, { useState } from 'react';
import { Midi } from '@tonejs/midi';
import { Upload } from 'lucide-react';

const MidiLoader = ({ onMidiLoaded, onLoadStart }) => {
    const [isDragging, setIsDragging] = useState(false);

    const handleFile = async (file) => {
        if (!file) return;

        if (onLoadStart) onLoadStart();

        try {
            const arrayBuffer = await file.arrayBuffer();
            const midi = new Midi(arrayBuffer);
            onMidiLoaded(midi);
        } catch (error) {
            console.error("Error parsing MIDI file:", error);
            alert("Failed to parse MIDI file.");
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
            className={`absolute top-4 right-4 z-50 p-4 rounded-lg border-2 border-dashed transition-colors duration-200 ${isDragging ? 'border-blue-500 bg-blue-500/20' : 'border-gray-600 bg-gray-800/80'
                }`}
            onDrop={onDrop}
            onDragOver={onDragOver}
            onDragLeave={onDragLeave}
        >
            <label className="flex items-center gap-2 cursor-pointer text-white">
                <Upload size={20} />
                <span className="text-sm font-medium">Upload MIDI</span>
                <input
                    type="file"
                    accept=".mid,.midi"
                    className="hidden"
                    onChange={onChange}
                />
            </label>
        </div>
    );
};

export default MidiLoader;
