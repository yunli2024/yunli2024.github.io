(function(){
  'use strict';

  const root = document.documentElement;
  let language = 'en';
  let theme = 'dark';

  try{
    if(localStorage.getItem('site-language') === 'zh') language = 'zh';
    if(localStorage.getItem('site-theme') === 'light') theme = 'light';
  }catch(error){}

  root.lang = language === 'zh' ? 'zh-CN' : 'en';
  root.dataset.language = language;
  root.dataset.theme = theme;
  if(language === 'zh'){
    root.dataset.i18nPending = 'true';
    window.setTimeout(() => delete root.dataset.i18nPending, 1500);
  }
})();
