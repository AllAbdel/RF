import React, { useState, useEffect } from 'react';

const ThemeSwitcher = () => {
  const [showMenu, setShowMenu] = useState(false);
  const [themeMode, setThemeMode] = useState('dark'); // 'light' or 'dark'
  const [themeColor, setThemeColor] = useState('orange'); // 'orange', 'blue', 'purple', 'green', 'red'

  // Load theme preferences from localStorage on mount
  useEffect(() => {
    const savedMode = localStorage.getItem('themeMode') || 'dark';
    const savedColor = localStorage.getItem('themeColor') || 'orange';
    
    setThemeMode(savedMode);
    setThemeColor(savedColor);
    applyTheme(savedMode, savedColor);
  }, []);

  // Apply theme to document
  const applyTheme = (mode, color) => {
    document.documentElement.setAttribute('data-theme-mode', mode);
    document.documentElement.setAttribute('data-theme', color);
    
    // Apply light mode if selected
    if (mode === 'light') {
      document.documentElement.setAttribute('data-theme', 'light');
    } else if (color !== 'orange') {
      document.documentElement.setAttribute('data-theme', color);
    }
  };

  // Handle mode change (light/dark)
  const handleModeChange = (mode) => {
    setThemeMode(mode);
    localStorage.setItem('themeMode', mode);
    applyTheme(mode, themeColor);
  };

  // Handle color change
  const handleColorChange = (color) => {
    setThemeColor(color);
    localStorage.setItem('themeColor', color);
    applyTheme(themeMode, color);
  };

  return (
    <div className="theme-switcher">
      {showMenu && (
        <div className="theme-menu">
          <div className="theme-menu-header">Mode d'affichage</div>
          <div className="theme-mode-toggle">
            <button
              className={`mode-btn ${themeMode === 'light' ? 'active' : ''}`}
              onClick={() => handleModeChange('light')}
            >
              ☀️ Clair
            </button>
            <button
              className={`mode-btn ${themeMode === 'dark' ? 'active' : ''}`}
              onClick={() => handleModeChange('dark')}
            >
              🌙 Sombre
            </button>
          </div>

          <div className="theme-menu-header">Couleur d'accent</div>
          <div className="theme-colors">
            <button
              className={`color-option ${themeColor === 'orange' ? 'active' : ''}`}
              data-theme="orange"
              onClick={() => handleColorChange('orange')}
              title="Orange"
            />
            <button
              className={`color-option ${themeColor === 'blue' ? 'active' : ''}`}
              data-theme="blue"
              onClick={() => handleColorChange('blue')}
              title="Bleu"
            />
            <button
              className={`color-option ${themeColor === 'purple' ? 'active' : ''}`}
              data-theme="purple"
              onClick={() => handleColorChange('purple')}
              title="Violet"
            />
            <button
              className={`color-option ${themeColor === 'green' ? 'active' : ''}`}
              data-theme="green"
              onClick={() => handleColorChange('green')}
              title="Vert"
            />
            <button
              className={`color-option ${themeColor === 'red' ? 'active' : ''}`}
              data-theme="red"
              onClick={() => handleColorChange('red')}
              title="Rouge"
            />
          </div>
        </div>
      )}

      <button
        className="theme-toggle-btn"
        onClick={() => setShowMenu(!showMenu)}
        title="Changer le thème"
      >
        {themeMode === 'dark' ? '🌙' : '☀️'}
      </button>
    </div>
  );
};

export default ThemeSwitcher;
