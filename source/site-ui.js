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
      'nav.blogMenu.label': 'Browse blog categories',
      'nav.blogMenu.all': 'All Posts',
      'nav.blogMenu.course': 'Courses',
      'nav.blogMenu.academic': 'Academic',
      'nav.blogMenu.reflection': 'Reflections',
      'nav.blogMenu.dailyLife': 'Daily Life',
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
      'nav.blogMenu.label': '浏览博客分类',
      'nav.blogMenu.all': '全部文章',
      'nav.blogMenu.course': '课程',
      'nav.blogMenu.academic': '学术',
      'nav.blogMenu.reflection': '思考',
      'nav.blogMenu.dailyLife': '日常',
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

  function initBlogDropdown(){
    document.querySelectorAll('.nav-links').forEach((nav,index) => {
      const blogLink = Array.from(nav.children).find(element => (
        element.matches?.('a[href="blog.html"]')
      ));
      if(!blogLink || blogLink.closest('.nav-blog-group')) return;

      const group = document.createElement('div');
      group.className = 'nav-blog-group';
      const menuId = `navBlogMenu${index + 1}`;
      nav.insertBefore(group,blogLink);
      group.appendChild(blogLink);
      blogLink.classList.add('nav-blog-link');
      blogLink.setAttribute('aria-haspopup','true');

      const toggle = document.createElement('button');
      toggle.className = 'nav-blog-toggle';
      toggle.type = 'button';
      toggle.setAttribute('aria-expanded','false');
      toggle.setAttribute('aria-controls',menuId);
      toggle.dataset.i18nAriaLabel = 'nav.blogMenu.label';
      toggle.innerHTML = '<span aria-hidden="true">▾</span>';

      const menu = document.createElement('div');
      menu.id = menuId;
      menu.className = 'nav-blog-menu';
      menu.setAttribute('aria-label','Browse blog categories');
      menu.dataset.i18nAriaLabel = 'nav.blogMenu.label';
      [
        ['all','nav.blogMenu.all'],
        ['course','nav.blogMenu.course'],
        ['academic','nav.blogMenu.academic'],
        ['reflection','nav.blogMenu.reflection'],
        ['daily-life','nav.blogMenu.dailyLife']
      ].forEach(([category,key]) => {
        const link = document.createElement('a');
        link.href = category === 'all' ? 'blog.html' : `blog.html?category=${category}`;
        link.dataset.i18n = key;
        link.dataset.blogCategory = category;
        link.textContent = key;
        const currentPage = location.pathname.split('/').pop() || 'index.html';
        const currentCategory = new URLSearchParams(location.search).get('category') || 'all';
        if(currentPage === 'blog.html' && currentCategory === category) link.setAttribute('aria-current','page');
        menu.appendChild(link);
      });

      group.append(toggle,menu);
      const setOpen = open => {
        group.classList.toggle('is-open',open);
        toggle.setAttribute('aria-expanded',String(open));
      };
      toggle.addEventListener('click',event => {
        event.stopPropagation();
        setOpen(!group.classList.contains('is-open'));
      });
      group.addEventListener('keydown',event => {
        if(event.key !== 'Escape') return;
        setOpen(false);
        blogLink.focus();
      });
    });

    document.addEventListener('click',event => {
      document.querySelectorAll('.nav-blog-group.is-open').forEach(group => {
        if(group.contains(event.target)) return;
        group.classList.remove('is-open');
        group.querySelector('.nav-blog-toggle')?.setAttribute('aria-expanded','false');
      });
    });
  }

  function initClickFireworks(){
    const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    const coarsePointer = window.matchMedia('(pointer: coarse)').matches;
    const capableDevice = (navigator.hardwareConcurrency || 4) > 4;
    if(reducedMotion || coarsePointer || !capableDevice) return;

    const activeParticles = new Set();
    let lastBurst = 0;

    function createParticle(x,y,angle,distance,color){
      if(activeParticles.size >= 50) return;
      const particle = document.createElement('span');
      const size = Math.random() * 6 + 8;
      particle.className = `click-particle color-${color}`;
      particle.setAttribute('aria-hidden','true');
      particle.style.setProperty('--dx',`${Math.cos(angle) * distance}px`);
      particle.style.setProperty('--dy',`${Math.sin(angle) * distance}px`);
      particle.style.left = `${x}px`;
      particle.style.top = `${y}px`;
      particle.style.width = `${size}px`;
      particle.style.height = `${size}px`;
      activeParticles.add(particle);
      document.body.appendChild(particle);
      const remove = () => {
        activeParticles.delete(particle);
        particle.remove();
      };
      particle.addEventListener('animationend',remove,{once:true});
      window.setTimeout(remove,1200);
    }

    function burst(x,y){
      for(let index = 0; index < 8; index += 1){
        const angle = Math.PI * 2 / 8 * index;
        const distance = 16 + Math.random() * 8;
        window.setTimeout(() => createParticle(x,y,angle,distance,index % 10 + 1),index * 12);
      }
      for(let index = 0; index < 2; index += 1){
        const angle = Math.random() * Math.PI * 2;
        const distance = 16 + Math.random() * 10;
        const color = Math.floor(Math.random() * 10) + 1;
        window.setTimeout(() => createParticle(x,y,angle,distance,color),(8 + index) * 12);
      }
    }

    document.addEventListener('click',event => {
      if(event.target.closest?.('[data-no-fireworks],input,textarea,select')) return;
      if(!event.clientX && !event.clientY) return;
      const now = performance.now();
      if(now - lastBurst < 60) return;
      lastBurst = now;
      burst(event.clientX,event.clientY);
    },{passive:true});
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
    initBlogDropdown();
    initClickFireworks();
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
