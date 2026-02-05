import React, { useState, useEffect, useCallback } from 'react';
import { useTranslation } from './useTranslation';

interface Language {
  code: string;
  name: string;
  nativeName: string;
  direction: 'ltr' | 'rtl';
}

interface LanguageSwitcherProps {
  onLanguageChange?: (locale: string) => void;
  showFlags?: boolean;
  compact?: boolean;
}

export const LanguageSwitcher: React.FC<LanguageSwitcherProps> = ({
  onLanguageChange,
  showFlags = true,
  compact = false,
}) => {
  const { currentLocale, setLocale, availableLocales, isLoading } = useTranslation();
  const [isOpen, setIsOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  const filteredLocales = availableLocales.filter(
    (lang) =>
      lang.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      lang.nativeName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      lang.code.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleLanguageSelect = useCallback(
    async (locale: string) => {
      await setLocale(locale);
      onLanguageChange?.(locale);
      setIsOpen(false);
    },
    [setLocale, onLanguageChange]
  );

  const currentLanguage = availableLocales.find((l) => l.code === currentLocale);

  // Get flag emoji from language code
  const getFlagEmoji = (code: string): string => {
    const codePoints = code
      .toUpperCase()
      .split('')
      .map((char) => 127397 + char.charCodeAt(0));
    return String.fromCodePoint(...codePoints);
  };

  if (isLoading) {
    return (
      <div className="language-switcher loading">
        <span className="spinner" />
        Loading...
      </div>
    );
  }

  return (
    <div className={`language-switcher ${compact ? 'compact' : ''}`}>
      <button
        className="language-switcher-trigger"
        onClick={() => setIsOpen(!isOpen)}
        aria-expanded={isOpen}
        aria-haspopup="listbox"
      >
        {showFlags && currentLanguage && (
          <span className="flag">{getFlagEmoji(currentLanguage.code)}</span>
        )}
        {!compact && (
          <>
            <span className="language-name">{currentLanguage?.nativeName || currentLanguage?.name}</span>
            <span className="dropdown-arrow">▼</span>
          </>
        )}
      </button>

      {isOpen && (
        <>
          <div className="dropdown-backdrop" onClick={() => setIsOpen(false)} />
          <div className="language-dropdown">
            <div className="search-container">
              <input
                type="text"
                placeholder="Search languages..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="language-search"
                autoFocus
              />
            </div>
            <ul className="language-list" role="listbox">
              {filteredLocales.map((lang) => (
                <li
                  key={lang.code}
                  className={`language-item ${lang.code === currentLocale ? 'active' : ''} ${
                    lang.direction === 'rtl' ? 'rtl' : ''
                  }`}
                  role="option"
                  aria-selected={lang.code === currentLocale}
                  onClick={() => handleLanguageSelect(lang.code)}
                >
                  {showFlags && <span className="flag">{getFlagEmoji(lang.code)}</span>}
                  <span className="language-native-name">{lang.nativeName}</span>
                  <span className="language-name-en">({lang.name})</span>
                  {lang.direction === 'rtl' && <span className="rtl-badge">RTL</span>}
                </li>
              ))}
            </ul>
          </div>
        </>
      )}
    </div>
  );
};

export default LanguageSwitcher;
