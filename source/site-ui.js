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
      'controls.theme.toDark': 'Switch to dark theme',
      'search.open': 'Search site',
      'search.title': 'Search',
      'search.placeholder': 'Search blog posts and projects',
      'search.close': 'Close search',
      'search.start': 'Search across blog posts and projects.',
      'search.loading': 'Loading blog posts…',
      'search.empty': 'No matching posts or projects.',
      'search.blog': 'Blog',
      'search.project': 'Project',
      'search.results': 'Search results',
      'search.count': '{count} results'
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
      'controls.theme.toDark': '切换到深色主题',
      'search.open': '搜索网站',
      'search.title': '搜索',
      'search.placeholder': '搜索博客文章与项目',
      'search.close': '关闭搜索',
      'search.start': '搜索博客文章与项目。',
      'search.loading': '正在读取博客文章…',
      'search.empty': '没有找到匹配的文章或项目。',
      'search.blog': '博客',
      'search.project': '项目',
      'search.results': '搜索结果',
      'search.count': '共 {count} 项'
    }
  };

  const PROJECT_SEARCH_INDEX = [
    {
      href:'projects.html#project-klotski',
      title:{en:'CS109 · Klotski',zh:'CS109 · 三国华容道（Klotski）'},
      summary:{en:'A Java and Swing desktop puzzle game.',zh:'使用 Java 与 Swing 完成的桌面华容道游戏。'},
      keywords:'java swing game puzzle klotski 华容道 游戏'
    },
    {
      href:'projects.html#project-matrix',
      title:{en:'CS207 · FPGA Matrix Calculator',zh:'CS207 · FPGA 矩阵计算器（Matrix Calculator）'},
      summary:{en:'Matrix-calculation logic and interaction implemented on an FPGA.',zh:'在 FPGA 上实现矩阵运算逻辑与交互。'},
      keywords:'fpga verilog digital logic matrix calculator 数字逻辑 矩阵'
    },
    {
      href:'projects.html#project-recipe-management',
      title:{en:'CS307 · SUSTech Recipe Management System',zh:'CS307 · 南科大菜谱管理系统'},
      summary:{en:'A relational data model and core recipe-management flow.',zh:'菜谱关系数据模型与基础管理流程。'},
      keywords:'postgresql jdbc database recipe sustech 数据库 菜谱'
    },
    {
      href:'projects.html#project-recipe-database',
      title:{en:'CS307 · SUSTech Recipe Database System',zh:'CS307 · 南科大菜谱数据库系统'},
      summary:{en:'A database-backed recipe system with optimization and a Java interface.',zh:'包含数据库优化与 Java 界面的菜谱系统。'},
      keywords:'java database optimization frontend recipe 数据库优化 菜谱'
    },
    {
      href:'projects.html#project-visual-computing',
      title:{en:'NUS · Real-Time Face and Body Keypoint Analysis',zh:'NUS · 实时人脸与人体关键点分析'},
      summary:{en:'Expression recognition, dance scoring, and motion-controlled games.',zh:'表情识别、舞蹈评分与体感游戏。'},
      keywords:'python opencv yolov8 visual computing keypoint face body 视觉计算 关键点'
    },
    {
      href:'project-cs202.html',
      title:{en:'CS202 · Single-Cycle RISC-V CPU',zh:'CS202 · 单周期 RISC-V 处理器（CPU）'},
      summary:{en:'An RV32I datapath with UART debugging and interactive teaching support.',zh:'支持 UART 调试与交互式教学的 RV32I 数据通路。'},
      keywords:'risc-v riscv cpu rv32i verilog vivado uart 处理器 计算机组成'
    }
  ];

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

  function initSiteSearch(){
    const switchGroups = document.querySelectorAll('.utility-switches');
    if(!switchGroups.length || document.querySelector('.site-search-dialog')) return;

    const dialog = document.createElement('dialog');
    dialog.className = 'site-search-dialog';
    dialog.dataset.noFireworks = '';
    dialog.setAttribute('aria-labelledby','site-search-title');
    dialog.innerHTML = `
      <div class="site-search-panel">
        <div class="site-search-head">
          <div>
            <span class="site-search-kicker">YUNLI / INDEX</span>
            <h2 id="site-search-title" data-i18n="search.title">Search</h2>
          </div>
          <button class="site-search-close" type="button" data-no-fireworks data-i18n-aria-label="search.close" aria-label="Close search">×</button>
        </div>
        <label class="site-search-field">
          <svg viewBox="0 0 24 24" aria-hidden="true"><circle cx="11" cy="11" r="6.5"></circle><path d="m16 16 4 4"></path></svg>
          <input type="search" autocomplete="off" spellcheck="false" data-i18n-placeholder="search.placeholder" placeholder="Search blog posts and projects">
          <kbd>/</kbd>
        </label>
        <p class="visually-hidden site-search-status" role="status" aria-live="polite"></p>
        <div class="site-search-results" role="list" data-i18n-aria-label="search.results" aria-label="Search results"></div>
      </div>`;
    document.body.appendChild(dialog);

    switchGroups.forEach(group => {
      const trigger = document.createElement('button');
      trigger.className = 'site-search-trigger';
      trigger.type = 'button';
      trigger.dataset.noFireworks = '';
      trigger.dataset.i18nAriaLabel = 'search.open';
      trigger.setAttribute('aria-label','Search site');
      trigger.innerHTML = '<svg viewBox="0 0 24 24" aria-hidden="true"><circle cx="10.8" cy="10.8" r="6.3"></circle><path d="m15.6 15.6 4 4"></path></svg><kbd>/</kbd>';
      group.insertBefore(trigger,group.firstChild);
    });

    const input = dialog.querySelector('input');
    const results = dialog.querySelector('.site-search-results');
    const status = dialog.querySelector('.site-search-status');
    const closeButton = dialog.querySelector('.site-search-close');
    const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)');
    let blogItems = [];
    let blogState = 'idle';
    let closeTimer = 0;

    const normalize = value => String(value || '')
      .normalize('NFKC')
      .toLocaleLowerCase()
      .replace(/\s+/g,' ')
      .trim();

    function projectItems(){
      return PROJECT_SEARCH_INDEX.map(project => ({
        type:'project',
        href:project.href,
        title:project.title[currentLanguage] || project.title.en,
        summary:project.summary[currentLanguage] || project.summary.en,
        searchable:`${project.title.en} ${project.title.zh} ${project.summary.en} ${project.summary.zh} ${project.keywords}`
      }));
    }

    function renderMessage(key){
      const message = document.createElement('p');
      message.className = 'site-search-message';
      message.textContent = translate(key);
      results.replaceChildren(message);
      status.textContent = message.textContent;
    }

    function renderResults(){
      const query = normalize(input.value);
      if(!query){
        renderMessage('search.start');
        return;
      }

      const matches = projectItems().concat(blogItems)
        .map(item => {
          const title = normalize(item.title);
          const haystack = normalize(`${item.searchable || ''} ${item.title} ${item.summary}`);
          if(!haystack.includes(query)) return null;
          const score = title.startsWith(query) ? 0 : title.includes(query) ? 1 : 2;
          return {item,score};
        })
        .filter(Boolean)
        .sort((left,right) => left.score - right.score || left.item.title.localeCompare(right.item.title,currentLanguage === 'zh' ? 'zh-CN' : 'en'))
        .slice(0,10);

      if(!matches.length){
        renderMessage(blogState === 'loading' ? 'search.loading' : 'search.empty');
        return;
      }

      const fragment = document.createDocumentFragment();
      matches.forEach(({item}) => {
        const link = document.createElement('a');
        link.className = 'site-search-result';
        link.href = item.href;
        link.setAttribute('role','listitem');

        const meta = document.createElement('span');
        meta.className = 'site-search-result-type';
        meta.textContent = translate(item.type === 'blog' ? 'search.blog' : 'search.project');

        const title = document.createElement('strong');
        title.textContent = item.title;

        const summary = document.createElement('span');
        summary.className = 'site-search-result-summary';
        summary.textContent = item.summary || '';

        link.append(meta,title,summary);
        fragment.appendChild(link);
      });
      results.replaceChildren(fragment);
      status.textContent = translate('search.count',{count:matches.length});
    }

    async function loadBlogIndex(){
      if(blogState !== 'idle') return;
      blogState = 'loading';
      try{
        const response = await fetch('posts/index.json');
        if(!response.ok) throw new Error('Blog index unavailable');
        const posts = await response.json();
        blogItems = Array.isArray(posts) ? posts.map(post => ({
          type:'blog',
          href:`post.html?file=${encodeURIComponent(post.file || '')}`,
          title:post.title || post.file || '',
          summary:post.excerpt || '',
          searchable:`${post.title || ''} ${post.excerpt || ''} ${post.tags || ''} ${post.category || ''} ${post.date || ''}`
        })).filter(post => post.title && post.href) : [];
        blogState = 'ready';
      }catch(error){
        blogState = 'error';
        blogItems = [];
      }
      renderResults();
    }

    function openSearch(instant = false){
      if(closeTimer){
        window.clearTimeout(closeTimer);
        closeTimer = 0;
      }
      if(dialog.open){
        input.focus();
        return;
      }
      const skipMotion = instant || reducedMotion.matches;
      dialog.classList.toggle('is-instant',skipMotion);
      if(skipMotion) dialog.classList.add('is-open');
      dialog.showModal();
      if(skipMotion){
        input.focus();
      }else{
        requestAnimationFrame(() => {
          dialog.classList.add('is-open');
          input.focus();
        });
      }
      loadBlogIndex();
      renderResults();
    }

    function closeSearch(instant = false){
      if(!dialog.open) return;
      const skipMotion = instant || reducedMotion.matches;
      dialog.classList.remove('is-open');
      if(skipMotion){
        dialog.close();
        return;
      }
      closeTimer = window.setTimeout(() => {
        dialog.close();
        closeTimer = 0;
      },150);
    }

    document.querySelectorAll('.site-search-trigger').forEach(trigger => {
      trigger.addEventListener('click',() => openSearch(false));
    });
    closeButton.addEventListener('click',() => closeSearch(false));
    dialog.addEventListener('click',event => {
      if(event.target === dialog) closeSearch(false);
    });
    dialog.addEventListener('cancel',event => {
      event.preventDefault();
      closeSearch(true);
    });
    dialog.addEventListener('close',() => {
      dialog.classList.remove('is-open','is-instant');
      input.value = '';
      renderResults();
    });
    input.addEventListener('input',() => {
      loadBlogIndex();
      renderResults();
    });
    window.addEventListener('site-language-change',renderResults);
    document.addEventListener('keydown',event => {
      const target = event.target;
      const isTyping = target instanceof HTMLElement && (
        target.matches('input,textarea,select') || target.isContentEditable
      );
      if(event.key !== '/' || event.metaKey || event.ctrlKey || event.altKey || isTyping) return;
      event.preventDefault();
      openSearch(true);
    });
  }

  function initClickFireworks(){
    const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    const coarsePointer = window.matchMedia('(pointer: coarse)').matches;
    const capableDevice = (navigator.hardwareConcurrency || 4) > 4;
    if(reducedMotion || coarsePointer || !capableDevice) return;

    const particleLayer = document.createElement('div');
    particleLayer.className = 'click-particle-layer';
    particleLayer.setAttribute('aria-hidden','true');
    particleLayer.dataset.noFireworks = '';
    const particlePool = [];
    const particleFragment = document.createDocumentFragment();
    const particleSizes = [8,10,12,9,13,11,14,9,12,10];
    for(let index = 0; index < 50; index += 1){
      const particle = document.createElement('span');
      const size = particleSizes[index % particleSizes.length];
      particle.className = `click-particle color-${index % 10 + 1}`;
      particle.dataset.size = String(size);
      particle.style.width = `${size}px`;
      particle.style.height = `${size}px`;
      particlePool.push(particle);
      particleFragment.appendChild(particle);
    }
    particleLayer.appendChild(particleFragment);
    document.body.appendChild(particleLayer);

    let poolCursor = 0;
    let lastBurst = 0;

    function acquireParticle(){
      for(let offset = 0; offset < particlePool.length; offset += 1){
        const index = (poolCursor + offset) % particlePool.length;
        const particle = particlePool[index];
        if(!particle._fireworkAnimation){
          poolCursor = (index + 1) % particlePool.length;
          return particle;
        }
      }
      return null;
    }

    function animateParticle(x,y,angle,distance,delay){
      const particle = acquireParticle();
      if(!particle) return;
      const size = Number(particle.dataset.size) || 10;
      const originX = x - size / 2;
      const originY = y - size / 2;
      const dx = Math.cos(angle) * distance;
      const dy = Math.sin(angle) * distance;
      const transformAt = (multiplier,scale) => `translate3d(${originX + dx * multiplier}px,${originY + dy * multiplier}px,0) scale(${scale})`;
      particle.style.willChange = 'transform,opacity';
      const animation = particle.animate([
        {offset:0,opacity:1,transform:transformAt(0,.4)},
        {offset:.15,opacity:1,transform:transformAt(1,1.3)},
        {offset:.6,opacity:.8,transform:transformAt(2.5,1)},
        {offset:1,opacity:0,transform:transformAt(3.5,.3)}
      ],{
        duration:1100,
        delay,
        easing:'cubic-bezier(.23,1,.32,1)',
        fill:'none'
      });
      particle._fireworkAnimation = animation;
      const release = () => {
        if(particle._fireworkAnimation !== animation) return;
        particle._fireworkAnimation = null;
        particle.style.willChange = '';
      };
      animation.addEventListener('finish',release,{once:true});
      animation.addEventListener('cancel',release,{once:true});
    }

    function burst(x,y){
      for(let index = 0; index < 8; index += 1){
        const angle = Math.PI * 2 / 8 * index;
        const distance = 16 + Math.random() * 8;
        animateParticle(x,y,angle,distance,index * 12);
      }
      for(let index = 0; index < 2; index += 1){
        const angle = Math.random() * Math.PI * 2;
        const distance = 16 + Math.random() * 10;
        animateParticle(x,y,angle,distance,(8 + index) * 12);
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
    initSiteSearch();
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
