import React from 'react';

interface BraidPoolDAGControlsProps {
  showHWPOnly: boolean;
  setShowHWPOnly: (show: boolean) => void;
  highlightOrphans: boolean;
  setHighlightOrphans: (highlight: boolean) => void;
  colorMode: 'cohort' | 'age' | 'value';
  setColorMode: (mode: 'cohort' | 'age' | 'value') => void;
  paused: boolean;
  setPaused: (paused: boolean) => void;
  animationSpeed: number;
  setAnimationSpeed: (speed: number) => void;
}

const BraidPoolDAGControls: React.FC<BraidPoolDAGControlsProps> = ({
  showHWPOnly,
  setShowHWPOnly,
  highlightOrphans,
  setHighlightOrphans,
  colorMode,
  setColorMode,
  paused,
  setPaused,
  animationSpeed,
  setAnimationSpeed,
}) => {
  return (
    <div
      className="filter-panel"
      style={{
        position: 'absolute',
        top: '10px',
        right: '10px',
        zIndex: 10,
        background: 'rgba(0,0,0,0.7)',
        padding: '15px',
        borderRadius: '8px',
        boxShadow: '0 4px 8px rgba(0,0,0,0.3)',
        minWidth: '220px',
      }}
    >
      <h5
        style={{
          color: '#fff',
          margin: '0 0 10px 0',
          fontSize: '14px',
          fontWeight: 'bold',
        }}
      >
        Filter Nodes
      </h5>

      <div
        className="filter-buttons"
        style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}
      >
        <button
          style={{
            background: showHWPOnly ? '#FF8500' : 'rgba(255,255,255,0.1)',
            color: '#fff',
            border: 'none',
            padding: '6px 12px',
            borderRadius: '4px',
            cursor: 'pointer',
            fontSize: '12px',
            transition: 'all 0.2s',
          }}
          onClick={() => setShowHWPOnly(!showHWPOnly)}
        >
          Highest Work Path Only
        </button>

        <button
          style={{
            background: highlightOrphans ? '#FF8500' : 'rgba(255,255,255,0.1)',
            color: '#fff',
            border: 'none',
            padding: '6px 12px',
            borderRadius: '4px',
            cursor: 'pointer',
            fontSize: '12px',
            transition: 'all 0.2s',
          }}
          onClick={() => setHighlightOrphans(!highlightOrphans)}
        >
          Highlight Orphans
        </button>
      </div>

      <h5
        style={{
          color: '#fff',
          margin: '15px 0 10px 0',
          fontSize: '14px',
          fontWeight: 'bold',
        }}
      >
        Color By
      </h5>

      <div
        className="color-mode-buttons"
        style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}
      >
        <button
          style={{
            background:
              colorMode === 'cohort' ? '#FF8500' : 'rgba(255,255,255,0.1)',
            color: '#fff',
            border: 'none',
            padding: '6px 12px',
            borderRadius: '4px',
            cursor: 'pointer',
            fontSize: '12px',
            transition: 'all 0.2s',
          }}
          onClick={() => setColorMode('cohort')}
        >
          Cohort
        </button>

        <button
          style={{
            background:
              colorMode === 'age' ? '#FF8500' : 'rgba(255,255,255,0.1)',
            color: '#fff',
            border: 'none',
            padding: '6px 12px',
            borderRadius: '4px',
            cursor: 'pointer',
            fontSize: '12px',
            transition: 'all 0.2s',
          }}
          onClick={() => setColorMode('age')}
        >
          Age
        </button>

        <button
          style={{
            background:
              colorMode === 'value' ? '#FF8500' : 'rgba(255,255,255,0.1)',
            color: '#fff',
            border: 'none',
            padding: '6px 12px',
            borderRadius: '4px',
            cursor: 'pointer',
            fontSize: '12px',
            transition: 'all 0.2s',
          }}
          onClick={() => setColorMode('value')}
        >
          Value
        </button>
      </div>

      <h5
        style={{
          color: '#fff',
          margin: '15px 0 10px 0',
          fontSize: '14px',
          fontWeight: 'bold',
        }}
      >
        Animation
      </h5>

      <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
        <button
          style={{
            background: paused ? '#FF8500' : 'rgba(255,255,255,0.1)',
            color: '#fff',
            border: 'none',
            padding: '6px 12px',
            borderRadius: '4px',
            cursor: 'pointer',
            fontSize: '12px',
            transition: 'all 0.2s',
          }}
          onClick={() => setPaused(!paused)}
        >
          {paused ? 'Resume' : 'Pause'} Animation
        </button>

        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <span style={{ color: '#fff', fontSize: '12px', minWidth: '45px' }}>
            Speed:
          </span>
          <input
            type="range"
            min="1"
            max="10"
            value={animationSpeed}
            onChange={(e) => setAnimationSpeed(parseInt(e.target.value))}
            style={{ flex: 1 }}
          />
          <span style={{ color: '#fff', fontSize: '12px', minWidth: '20px' }}>
            {animationSpeed}x
          </span>
        </div>
      </div>
    </div>
  );
};

export default BraidPoolDAGControls;
