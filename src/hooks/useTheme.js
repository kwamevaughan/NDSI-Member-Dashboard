// useTheme.js
import React, { createContext, useContext, useState, useEffect } from 'react';

const ThemeContext = createContext();

export const ThemeProvider = ({ children }) => {
  const [mode, setMode] = useState('light');

  useEffect(() => {
    const savedMode = localStorage.getItem('mode');
    if (savedMode) {
      setMode(savedMode);
    } else {
      const systemMode = window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
      setMode(systemMode);
    }
    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
    const handleChange = (e) => {
      if (!localStorage.getItem('mode') || localStorage.getItem('mode') === 'system') {
        setMode(e.matches ? 'dark' : 'light');
      }
    };
    mediaQuery.addEventListener('change', handleChange);
    return () => mediaQuery.removeEventListener('change', handleChange);
  }, []);

  const toggleMode = () => {
    setMode((prevMode) => {
      const newMode = prevMode === 'dark' ? 'light' : 'dark';
      localStorage.setItem('mode', newMode);
      return newMode;
    });
  };

  return (
    <ThemeContext.Provider value={{ mode, toggleMode }}>
      {children}
    </ThemeContext.Provider>
  );
};

export const useTheme = () => useContext(ThemeContext);
