import React, { useState } from 'react';

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
  selectedCohorts: number | 'all';
  setSelectedCohorts: (cohorts: number | 'all') => void;
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
  selectedCohorts,
  setSelectedCohorts,
}) => {
  const [isHovered, setIsHovered] = useState(false);

  return (
    <div
      className="filter-panel"
      style={{
        position: 'absolute',
        top: '10px',
        right: '10px',
        zIndex: 10,
        background: isHovered ? 'rgba(0,0,0,0.7)' : 'rgba(0,0,0,0.1)',
        padding: '15px',
        borderRadius: '8px',
        boxShadow: isHovered ? '0 4px 8px rgba(0,0,0,0.3)' : 'none',
        minWidth: '220px',
        transition: 'all 0.3s ease',
        opacity: isHovered ? 1 : 0.1,
        transform: isHovered ? 'translateX(0)' : 'translateX(10px)',
      }}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      <div
        style={{ opacity: isHovered ? 1 : 0, transition: 'opacity 0.3s ease' }}
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
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              marginBottom: '8px',
            }}
          >
            <span style={{ color: '#fff', fontSize: '12px', minWidth: '65px' }}>
              Cohorts:
            </span>
            <select
              value={selectedCohorts}
              onChange={(e) => {
                const value = e.target.value;
                setSelectedCohorts(value === 'all' ? 'all' : Number(value));
              }}
              style={{
                flex: 1,
                padding: '5px',
                borderRadius: '4px',
                border: '1px solid #0077B6',
                backgroundColor: 'rgba(0,0,0,0.4)',
                color: '#fff',
                fontSize: '12px',
              }}
            >
              <option value="all">All cohorts</option>
              {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map((value) => (
                <option key={value} value={value}>
                  Latest {value}
                </option>
              ))}
            </select>
          </div>

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
              background: highlightOrphans
                ? '#FF8500'
                : 'rgba(255,255,255,0.1)',
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
        </div>
      </div>

      {/* Always visible tab indicator */}
      <div
        style={{
          position: 'absolute',
          right: isHovered ? '15px' : '0',
          top: '0',
          padding: '8px 4px 4px 4px',
          borderRadius: '0 0 0 8px',
          opacity: isHovered ? 0 : 1,
          transition: 'all 0.3s ease',
          background: 'rgba(0,119,182,0.7)',
          transform: isHovered ? 'scale(0)' : 'scale(1)',
          transformOrigin: 'right top',
        }}
      >
        <span
          style={{
            color: '#fff',
            fontSize: '10px',
            fontWeight: 'bold',
            whiteSpace: 'nowrap',
          }}
        >
          Filter Controls
        </span>
      </div>
    </div>
  );
};

export default BraidPoolDAGControls;
