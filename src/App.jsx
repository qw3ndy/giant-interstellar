
import React, { useState, useEffect } from 'react';
import Piano from './components/Piano/Piano';
import Visualizer from './components/Visualizer/Visualizer';
import MidiLoader from './components/MidiLoader/MidiLoader';
import MidiDevice from './components/MidiDevice/MidiDevice';
import { midiEngine } from './utils/MidiEngine';
import ControlPanel from './components/ControlPanel/ControlPanel';
import { PIANO_HEIGHT, TOTAL_PIANO_WIDTH } from './utils/visualConstants';

import './App.css';

function App() {
  const [midiData, setMidiData] = useState(null);
  const [isPlaying, setIsPlaying] = useState(false);

  const [showVisualizer, setShowVisualizer] = useState(true);
  const [handView, setHandView] = useState('both'); // 'both', 'right', 'left'

  useEffect(() => {
    midiEngine.setHandView(handView);
  }, [handView]);

  useEffect(() => {
    // Load the MIDI file when the component mounts
    // In a real app, this might come from a file input or URL
    // midiEngine.loadMidi(sampleMidi); 
  }, []);

  const handleMidiLoaded = async (midi) => {
    setMidiData(midi);
    setIsPlaying(false); // Reset play state
    await midiEngine.loadMidi(midi);
  };

  const togglePlay = async () => {
    if (midiEngine.isPlaying) {
      midiEngine.pause();
      setIsPlaying(false);
    } else {
      await midiEngine.start();
      setIsPlaying(true);
    }
  };

  const restart = () => {
    midiEngine.stop();
    setIsPlaying(false);
    midiEngine.start();
    setIsPlaying(true);
  };

  return (
    <div className="app-container">
      <MidiDevice />
      <ControlPanel
        midiData={midiData}
        isPlaying={isPlaying}
        onTogglePlay={togglePlay}
        onRestart={restart}
        onMidiLoaded={handleMidiLoaded}
        showVisualizer={showVisualizer}
        setShowVisualizer={setShowVisualizer}
        handView={handView}
        setHandView={setHandView}
      />

      <div className="scroll-content">
        <div className="visualizer-container">
          <Visualizer
            midiData={midiData}
            handView={handView}
            showParticles={showVisualizer}
          />
        </div>
        <div className="piano-container">
          <Piano totalWidth={TOTAL_PIANO_WIDTH} />
        </div>
      </div>
    </div>
  );
}

export default App;
