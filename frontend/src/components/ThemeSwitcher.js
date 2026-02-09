import React, { useState, useEffect } from 'react';

const ThemeSwitcher = () => {
  const [showMenu, setShowMenu] = useState(false);
  const [themeMode, setThemeMode] = useState('dark'); // 'light' or 'dark'
  const [darkThemeColor, setDarkThemeColor] = useState('orange');
  const [lightThemeColor, setLightThemeColor] = useState('orange');

  // Load theme preferences from localStorage on mount
  useEffect(() => {
    const savedMode = localStorage.getItem('themeMode') || 'dark';
    const savedDarkColor = localStorage.getItem('darkThemeColor') || localStorage.getItem('themeColor') || 'orange';
    const savedLightColor = localStorage.getItem('lightThemeColor') || 'orange';
    
    setThemeMode(savedMode);
    setDarkThemeColor(savedDarkColor);
    setLightThemeColor(savedLightColor);
    applyTheme(savedMode, savedDarkColor, savedLightColor);
  }, []);

  // Apply theme to document
  const applyTheme = (mode, darkColor, lightColor) => {
    if (mode === 'light') {
      // Light mode with color customization
      if (lightColor === 'orange') {
        document.documentElement.setAttribute('data-theme', 'light');
      } else {
        document.documentElement.setAttribute('data-theme', `light-${lightColor}`);
      }
    } else {
      // Dark mode with color customization
      if (darkColor === 'orange') {
        document.documentElement.removeAttribute('data-theme');
      } else {
        document.documentElement.setAttribute('data-theme', darkColor);
      }
    }
  };

  // Handle mode change (light/dark)
  const handleModeChange = (mode) => {
    setThemeMode(mode);
    localStorage.setItem('themeMode', mode);
    applyTheme(mode, darkThemeColor, lightThemeColor);
  };

  // Handle color change
  const handleColorChange = (color) => {
    if (themeMode === 'dark') {
      setDarkThemeColor(color);
      localStorage.setItem('darkThemeColor', color);
      applyTheme(themeMode, color, lightThemeColor);
    } else {
      setLightThemeColor(color);
      localStorage.setItem('lightThemeColor', color);
      applyTheme(themeMode, darkThemeColor, color);
    }
  };

  // Get current active color based on mode
  const getCurrentColor = () => {
    return themeMode === 'dark' ? darkThemeColor : lightThemeColor;
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
              Clair
            </button>
            <button
              className={`mode-btn ${themeMode === 'dark' ? 'active' : ''}`}
              onClick={() => handleModeChange('dark')}
            >
              Sombre
            </button>
          </div>

          <div className="theme-colors-section">
            <div className="theme-menu-header">
              Couleur d'accent
            </div>
            <div className="theme-colors">
              <button
                className={`color-option ${getCurrentColor() === 'orange' ? 'active' : ''}`}
                data-theme="orange"
                onClick={() => handleColorChange('orange')}
                title="Orange"
              />
              <button
                className={`color-option ${getCurrentColor() === 'blue' ? 'active' : ''}`}
                data-theme="blue"
                onClick={() => handleColorChange('blue')}
                title="Bleu"
              />
              <button
                className={`color-option ${getCurrentColor() === 'purple' ? 'active' : ''}`}
                data-theme="purple"
                onClick={() => handleColorChange('purple')}
                title="Violet"
              />
              <button
                className={`color-option ${getCurrentColor() === 'green' ? 'active' : ''}`}
                data-theme="green"
                onClick={() => handleColorChange('green')}
                title="Vert"
              />
              <button
                className={`color-option ${getCurrentColor() === 'red' ? 'active' : ''}`}
                data-theme="red"
                onClick={() => handleColorChange('red')}
                title="Rouge"
              />
            </div>
          </div>
        </div>
      )}

      <button
        className="theme-toggle-btn"
        onClick={() => setShowMenu(!showMenu)}
        title="Changer le thème"
      >
        {themeMode === 'dark' ? 'Sombre' : 'Clair'}
      </button>
    </div>
  );
};

export default ThemeSwitcher;
