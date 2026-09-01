(function(){
  'use strict';

  const LANGUAGE_KEY = 'site-language';
  const THEME_KEY = 'site-theme';
  const DEFAULT_LANGUAGE = 'en';
  const DEFAULT_THEME = 'dark';

  const COMMON_I18N = {
    en: {
      'brand.name': 'Yunli',
      'nav.label': 'Main navigation',
      'nav.blog': 'Blog',
      'nav.projects': 'Projects',
      'nav.about': 'About',
      'controls.language.label': 'Chinese interface',
      'controls.language.action': 'Switch to Chinese',
      'controls.theme.label': 'Dark mode',
      'controls.theme.toLight': 'Switch to light theme',
      'controls.theme.toDark': 'Switch to dark theme'
    },
    zh: {
      'brand.name': '云离',
      'nav.label': '主导航',
      'nav.blog': '博客',
      'nav.projects': '项目',
      'nav.about': '关于',
      'controls.language.label': '中文界面',
      'controls.language.action': '切换至英文',
      'controls.theme.label': '深色模式',
      'controls.theme.toLight': '切换到浅色主题',
      'controls.theme.toDark': '切换到深色主题'
    }
  };

  let currentLanguage = readPreference(LANGUAGE_KEY, ['en', 'zh'], DEFAULT_LANGUAGE);
  let currentTheme = readPreference(THEME_KEY, ['dark', 'light'], DEFAULT_THEME);

  function readPreference(key, allowed, fallback){
    try{
      const value = localStorage.getItem(key);
      return allowed.includes(value) ? value : fallback;
    }catch(error){
      return fallback;
    }
  }

  function writePreference(key, value){
    try{localStorage.setItem(key, value)}catch(error){}
  }

  function pageDictionary(language){
    const pageI18n = window.PAGE_I18N || {};
    return Object.assign({}, COMMON_I18N[language] || {}, pageI18n[language] || {});
  }

  function translate(key, replacements){
    const dictionary = pageDictionary(currentLanguage);
    const englishDictionary = pageDictionary('en');
    let value;
    if(Object.prototype.hasOwnProperty.call(dictionary, key)){
      value = dictionary[key];
    }else if(Object.prototype.hasOwnProperty.call(englishDictionary, key)){
      value = englishDictionary[key];
    }else{
      console.warn(`Missing translation: ${key}`);
      value = key;
    }
    if(replacements && typeof value === 'string'){
      Object.entries(replacements).forEach(([name, replacement]) => {
        value = value.replaceAll(`{${name}}`, String(replacement));
      });
    }
    return value;
  }

  function setTranslatedText(element, value){
    const text = String(value);
    if(element.classList.contains('typewriter-controlled')){
      const reserve = element.querySelector('.typewriter-reserve');
      const visual = element.querySelector('.typewriter-visual');
      const accessible = element.querySelector('.visually-hidden');
      if(reserve) reserve.textContent = text;
      if(visual) visual.textContent = text;
      if(accessible) accessible.textContent = text;
      return;
    }
    element.textContent = text;
  }

  function applyTranslations(){
    document.querySelectorAll('[data-i18n]').forEach(element => {
      setTranslatedText(element, translate(element.dataset.i18n));
    });

    document.querySelectorAll('[data-i18n-html]').forEach(element => {
      element.innerHTML = translate(element.dataset.i18nHtml);
    });

    const attributeBindings = [
      ['data-i18n-aria-label', 'aria-label'],
      ['data-i18n-title', 'title'],
      ['data-i18n-placeholder', 'placeholder'],
      ['data-i18n-alt', 'alt']
    ];

    attributeBindings.forEach(([dataAttribute, targetAttribute]) => {
      document.querySelectorAll(`[${dataAttribute}]`).forEach(element => {
        const key = element.getAttribute(dataAttribute);
        element.setAttribute(targetAttribute, translate(key));
      });
    });

    const translatedTitle = translate('meta.title');
    if(translatedTitle !== 'meta.title') document.title = translatedTitle;
    const description = document.querySelector('meta[name="description"]');
    const translatedDescription = translate('meta.description');
    if(description && translatedDescription !== 'meta.description'){
      description.setAttribute('content', translatedDescription);
    }
    delete document.documentElement.dataset.i18nPending;
  }

  function buildSwitch(button, type){
    if(button.querySelector('.switch-track')) return;
    const labels = type === 'language'
      ? ['EN', '中']
      : ['☀️', '🌙'];
    button.replaceChildren();
    const track = document.createElement('span');
    track.className = 'switch-track';
    track.setAttribute('aria-hidden', 'true');
    labels.forEach((label, index) => {
      const option = document.createElement('span');
      option.className = `switch-option switch-option-${index === 0 ? 'left' : 'right'}`;
      option.textContent = label;
      track.appendChild(option);
    });
    const thumb = document.createElement('span');
    thumb.className = 'switch-thumb';
    track.appendChild(thumb);
    button.appendChild(track);
  }

  function updateLanguageControls(){
    document.querySelectorAll('[data-language-toggle]').forEach(button => {
      buildSwitch(button, 'language');
      button.dataset.state = currentLanguage;
      button.setAttribute('role', 'switch');
      button.setAttribute('aria-checked', String(currentLanguage === 'zh'));
      button.setAttribute('aria-label', translate('controls.language.label'));
      button.setAttribute('title', translate('controls.language.action'));
    });
  }

  function updateThemeControls(){
    const isLight = currentTheme === 'light';
    document.querySelectorAll('[data-theme-toggle]').forEach(button => {
      buildSwitch(button, 'theme');
      button.dataset.state = currentTheme;
      button.setAttribute('role', 'switch');
      button.setAttribute('aria-checked', String(currentTheme === 'dark'));
      button.setAttribute('aria-label', translate('controls.theme.label'));
      button.setAttribute('title', translate(isLight ? 'controls.theme.toDark' : 'controls.theme.toLight'));
    });
  }

  function applyLanguage(language, persist = true){
    currentLanguage = language === 'zh' ? 'zh' : 'en';
    document.documentElement.lang = currentLanguage === 'zh' ? 'zh-CN' : 'en';
    document.documentElement.dataset.language = currentLanguage;
    applyTranslations();
    updateLanguageControls();
    updateThemeControls();
    if(persist) writePreference(LANGUAGE_KEY, currentLanguage);
    window.dispatchEvent(new CustomEvent('site-language-change', {
      detail: {language: currentLanguage}
    }));
  }

  function applyTheme(theme, persist = true){
    currentTheme = theme === 'light' ? 'light' : 'dark';
    document.body.classList.toggle('light', currentTheme === 'light');
    document.documentElement.dataset.theme = currentTheme;
    updateThemeControls();
    if(persist) writePreference(THEME_KEY, currentTheme);
    window.dispatchEvent(new CustomEvent('site-theme-change', {
      detail: {theme: currentTheme}
    }));
  }

  function restorePreferences(){
    const language = readPreference(LANGUAGE_KEY, ['en', 'zh'], DEFAULT_LANGUAGE);
    const theme = readPreference(THEME_KEY, ['dark', 'light'], DEFAULT_THEME);
    applyTheme(theme, false);
    applyLanguage(language, false);
    document.documentElement.dataset.i18nReady = 'true';
  }

  function init(){
    document.querySelectorAll('[data-language-toggle]').forEach(button => {
      button.addEventListener('click', () => {
        applyLanguage(currentLanguage === 'en' ? 'zh' : 'en');
      });
    });
    document.querySelectorAll('[data-theme-toggle]').forEach(button => {
      button.addEventListener('click', () => {
        applyTheme(currentTheme === 'dark' ? 'light' : 'dark');
      });
    });

    applyTheme(currentTheme, false);
    applyLanguage(currentLanguage, false);
    document.documentElement.dataset.i18nReady = 'true';

    window.addEventListener('pageshow', event => {
      if(event.persisted) restorePreferences();
    });
    window.addEventListener('storage', event => {
      if(event.key === null || event.key === LANGUAGE_KEY || event.key === THEME_KEY){
        restorePreferences();
      }
    });
  }

  window.SiteUI = {
    applyLanguage,
    applyTheme,
    restorePreferences,
    t: translate,
    get language(){return currentLanguage},
    get theme(){return currentTheme}
  };

  init();
})();
