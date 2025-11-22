
import React, { useState, useEffect } from 'react';
import Piano from './components/Piano/Piano';
import Visualizer from './components/Visualizer/Visualizer';
import MidiLoader from './components/MidiLoader/MidiLoader';
import MidiDevice from './components/MidiDevice/MidiDevice';
import { midiEngine } from './utils/MidiEngine';
import { Play, Pause, RefreshCw } from 'lucide-react';
import { PIANO_HEIGHT, TOTAL_PIANO_WIDTH } from './utils/visualConstants';

import './App.css';

function App() {
  const [midiData, setMidiData] = useState(null);
  const [isPlaying, setIsPlaying] = useState(false);

  useEffect(() => {
    if (midiData) {
      setIsPlaying(false); // Reset playing state
      midiEngine.loadMidi(midiData);
    }
  }, [midiData]);

  const togglePlay = async () => {
    if (isPlaying) {
      midiEngine.pause();
    } else {
      await midiEngine.start();
    }
    setIsPlaying(!isPlaying);
  };

  const restart = () => {
    midiEngine.stop();
    setIsPlaying(false);
    // small delay to allow stop to process
    setTimeout(() => {
      midiEngine.start();
      setIsPlaying(true);
    }, 100);
  };

  return (
    <div className="app-container">
      <MidiDevice />

      <div className="controls-overlay">
        <MidiLoader onMidiLoaded={setMidiData} />
        <button
          onClick={togglePlay}
          className="control-btn"
          disabled={!midiData}
          title={isPlaying ? "Pause" : "Play"}
        >
          {isPlaying ? <Pause size={20} /> : <Play size={20} />}
        </button>
        <button
          onClick={restart}
          className="control-btn"
          disabled={!midiData}
          title="Restart"
        >
          <RefreshCw size={20} />
        </button>
      </div>

      <div
        className="scroll-content"
        style={{ minWidth: TOTAL_PIANO_WIDTH, width: 'max-content' }}
      >
        <div className="visualizer-container">
          <Visualizer key={midiData ? midiData.header.name : 'empty'} midiData={midiData} isPlaying={isPlaying} />
        </div>

        <div className="piano-container" style={{ height: PIANO_HEIGHT }}>
          <Piano />
        </div>
      </div>
    </div>
  );
}

export default App;
