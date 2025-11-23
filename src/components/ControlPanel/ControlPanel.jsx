import React, { useState, useEffect, useRef } from 'react';
import { Play, Pause, RefreshCw, Upload, Music, Settings } from 'lucide-react';
import { midiEngine } from '../../utils/MidiEngine';
import MidiLoader from '../MidiLoader/MidiLoader';

const ControlPanel = ({
    midiData,
    isPlaying,
    onTogglePlay,
    onRestart,
    onMidiLoaded,
    showVisualizer,
    setShowVisualizer,
    handView,
    setHandView,
    instrument,
    setInstrument
}) => {
    const [currentTime, setCurrentTime] = useState(0);
    const [duration, setDuration] = useState(0);
    const [isDragging, setIsDragging] = useState(false);
    const [playbackRate, setPlaybackRate] = useState(1);
    const [isLoading, setIsLoading] = useState(false);

    useEffect(() => {
        if (midiData) {
            setDuration(midiEngine.getDuration());
        }
    }, [midiData]);

    useEffect(() => {
        let interval;
        if (isPlaying && !isDragging) {
            interval = setInterval(() => {
                setCurrentTime(midiEngine.getCurrentTime());
            }, 100);
        }
        return () => clearInterval(interval);
    }, [isPlaying, isDragging]);

    const handleSeek = (e) => {
        const time = parseFloat(e.target.value);
        setCurrentTime(time);
        midiEngine.setTime(time);
    };

    const handleDragStart = () => {
        setIsDragging(true);
    };

    const handleDragEnd = (e) => {
        setIsDragging(false);
        const time = parseFloat(e.target.value);
        midiEngine.setTime(time);
    };

    const handleSpeedChange = (e) => {
        const rate = parseFloat(e.target.value);
        setPlaybackRate(rate);
        midiEngine.setPlaybackRate(rate);
    };

    const handleMidiLoadStart = () => {
        setIsLoading(true);
    };

    const handleMidiLoadEnd = (data) => {
        setIsLoading(false);
        onMidiLoaded(data);
    };

    const formatTime = (seconds) => {
        const mins = Math.floor(seconds / 60);
        const secs = Math.floor(seconds % 60);
        return `${mins}:${secs.toString().padStart(2, '0')}`;
    };

    return (
        <div className="control-panel">
            <div className="panel-row main-controls">
                <div className="left-section">
                    <div className="logo-area">
                        <Music size={24} color="#3b82f6" />
                        <span className="app-title">Giant Interstellar</span>
                    </div>

                    <div className="playback-controls">
                        <button
                            className="icon-btn"
                            onClick={onTogglePlay}
                            disabled={!midiData || isLoading}
                            title={isPlaying ? "Pause" : "Play"}
                        >
                            {isPlaying ? <Pause size={20} /> : <Play size={20} />}
                        </button>
                        <button
                            className="icon-btn"
                            onClick={onRestart}
                            disabled={!midiData || isLoading}
                            title="Restart"
                        >
                            <RefreshCw size={20} />
                        </button>

                        <select
                            className="speed-select"
                            value={playbackRate}
                            onChange={handleSpeedChange}
                            disabled={!midiData || isLoading}
                        >
                            <option value="0.5">0.5x</option>
                            <option value="0.75">0.75x</option>
                            <option value="1">1.0x</option>
                            <option value="1.25">1.25x</option>
                            <option value="1.5">1.5x</option>
                            <option value="2">2.0x</option>
                        </select>

                        <select
                            className="speed-select"
                            value={instrument}
                            onChange={(e) => setInstrument(e.target.value)}
                            disabled={!midiData || isLoading}
                            title="Instrument"
                        >
                            <option value="piano">Piano</option>
                            <option value="electric">Piano électrique</option>
                            <option value="organ">Orgue</option>
                            <option value="strings">Cordes</option>
                            <option value="synth">Synthé</option>
                        </select>
                    </div>
                </div>

                <div className="center-section">
                    <div className="timeline-container">
                        <span className="time-label">{formatTime(currentTime)}</span>
                        <input
                            type="range"
                            min="0"
                            max={duration || 100}
                            value={currentTime}
                            onChange={handleSeek}
                            onMouseDown={handleDragStart}
                            onMouseUp={handleDragEnd}
                            onTouchStart={handleDragStart}
                            onTouchEnd={handleDragEnd}
                            disabled={!midiData || isLoading}
                            className="timeline-slider"
                        />
                        <span className="time-label">{formatTime(duration)}</span>
                    </div>
                </div>

                <div className="right-section">
                    {isLoading && <span className="loading-text">Chargement MIDI...</span>}

                    <div className="visualizer-toggle">
                        <select
                            className="speed-select"
                            value={handView}
                            onChange={(e) => setHandView(e.target.value)}
                            style={{ marginRight: '10px' }}
                        >
                            <option value="both">Les deux mains</option>
                            <option value="right">Main droite</option>
                            <option value="left">Main gauche</option>
                        </select>

                        <label className="toggle-label">
                            <input
                                type="checkbox"
                                checked={showVisualizer}
                                onChange={(e) => setShowVisualizer(e.target.checked)}
                            />
                            <span className="toggle-text">Avec effets visuels</span>
                        </label>
                    </div>

                    <div className="upload-wrapper">
                        <MidiLoader
                            onMidiLoaded={handleMidiLoadEnd}
                            onLoadStart={handleMidiLoadStart}
                            compact={true}
                        />
                    </div>
                </div>
            </div>
        </div>
    );
};

export default ControlPanel;
