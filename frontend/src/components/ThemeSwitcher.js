import React, { useState, useEffect } from 'react';

const ThemeSwitcher = () => {
  const [showMenu, setShowMenu] = useState(false);
  const [themeMode, setThemeMode] = useState('dark'); // 'light' or 'dark'
  const [themeColor, setThemeColor] = useState('orange'); // Only for dark mode

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
    // Light mode always uses default (orange) - no color customization
    if (mode === 'light') {
      document.documentElement.setAttribute('data-theme', 'light');
    } else {
      // Dark mode can have different colors
      document.documentElement.removeAttribute('data-theme');
      if (color !== 'orange') {
        document.documentElement.setAttribute('data-theme', color);
      }
    }
  };

  // Handle mode change (light/dark)
  const handleModeChange = (mode) => {
    setThemeMode(mode);
    localStorage.setItem('themeMode', mode);
    applyTheme(mode, themeColor);
  };

  // Handle color change (only works in dark mode)
  const handleColorChange = (color) => {
    if (themeMode === 'dark') {
      setThemeColor(color);
      localStorage.setItem('themeColor', color);
      applyTheme(themeMode, color);
    }
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
              ☀ Clair
            </button>
            <button
              className={`mode-btn ${themeMode === 'dark' ? 'active' : ''}`}
              onClick={() => handleModeChange('dark')}
            >
              ☾ Sombre
            </button>
          </div>

          <div className="theme-colors-section">
            <div className="theme-menu-header">
              Couleur d'accent {themeMode === 'light' && '(Mode sombre uniquement)'}
            </div>
            <div className="theme-colors">
              <button
                className={`color-option ${themeColor === 'orange' ? 'active' : ''}`}
                data-theme="orange"
                onClick={() => handleColorChange('orange')}
                title="Orange"
                disabled={themeMode === 'light'}
              />
              <button
                className={`color-option ${themeColor === 'blue' ? 'active' : ''}`}
                data-theme="blue"
                onClick={() => handleColorChange('blue')}
                title="Bleu"
                disabled={themeMode === 'light'}
              />
              <button
                className={`color-option ${themeColor === 'purple' ? 'active' : ''}`}
                data-theme="purple"
                onClick={() => handleColorChange('purple')}
                title="Violet"
                disabled={themeMode === 'light'}
              />
              <button
                className={`color-option ${themeColor === 'green' ? 'active' : ''}`}
                data-theme="green"
                onClick={() => handleColorChange('green')}
                title="Vert"
                disabled={themeMode === 'light'}
              />
              <button
                className={`color-option ${themeColor === 'red' ? 'active' : ''}`}
                data-theme="red"
                onClick={() => handleColorChange('red')}
                title="Rouge"
                disabled={themeMode === 'light'}
              />
            </div>
            {themeMode === 'light' && (
              <p className="color-disabled-note">
                Le mode clair utilise toujours la couleur orange
              </p>
            )}
          </div>
        </div>
      )}

      <button
        className="theme-toggle-btn"
        onClick={() => setShowMenu(!showMenu)}
        title="Changer le thème"
      >
        {themeMode === 'dark' ? '☾' : '☀'}
      </button>
    </div>
  );
};

export default ThemeSwitcher;
