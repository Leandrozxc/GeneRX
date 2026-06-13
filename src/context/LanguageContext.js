import React, { createContext, useContext, useState } from 'react';
import { LANGUAGES, DEFAULT_LANGUAGE } from '../constants/languages';

const LanguageContext = createContext();

export const LanguageProvider = ({ children }) => {
  const [currentLanguage, setCurrentLanguage] = useState(DEFAULT_LANGUAGE);
  const t = LANGUAGES[currentLanguage].strings;
  
  const switchLanguage = (lang) => {
    if (LANGUAGES[lang]) {
      setCurrentLanguage(lang);
    }
  };

  return (
    <LanguageContext.Provider value={{ t, currentLanguage, switchLanguage }}>
      {children}
    </LanguageContext.Provider>
  );
};

export const useLanguage = () => {
  const context = useContext(LanguageContext);
  if (!context) {
    throw new Error('useLanguage must be used within a LanguageProvider');
  }
  return context;
};