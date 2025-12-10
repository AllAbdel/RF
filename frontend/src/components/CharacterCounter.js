import React from 'react';
import '../styles/CharacterCounter.css';

const CharacterCounter = ({ currentLength, maxLength, warning = 0.8 }) => {
  const percentage = currentLength / maxLength;
  const isWarning = percentage >= warning;
  const isError = currentLength > maxLength;

  return (
    <div className={`character-counter ${isWarning ? 'warning' : ''} ${isError ? 'error' : ''}`}>
      <span className="counter-text">
        {currentLength} / {maxLength} caractères
      </span>
      <div className="counter-bar">
        <div 
          className="counter-fill" 
          style={{ width: `${Math.min(percentage * 100, 100)}%` }}
        />
      </div>
    </div>
  );
};

export default CharacterCounter;
