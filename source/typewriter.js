(function(){
  'use strict';

  const lines = Array.from(document.querySelectorAll('[data-typewriter]'));
  const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  if(lines.length === 0 || reduceMotion) return;

  const numberFrom = (value, fallback) => {
    const parsed = Number(value);
    return Number.isFinite(parsed) && parsed >= 0 ? parsed : fallback;
  };

  const entries = lines.map(line => {
    const text = line.textContent.trim();
    const reserve = document.createElement('span');
    reserve.className = 'typewriter-reserve';
    reserve.setAttribute('aria-hidden', 'true');
    reserve.textContent = text;

    const visual = document.createElement('span');
    visual.className = 'typewriter-visual';
    visual.setAttribute('aria-hidden', 'true');

    const accessible = document.createElement('span');
    accessible.className = 'visually-hidden';
    accessible.textContent = text;

    line.classList.add('typewriter-controlled');
    line.replaceChildren(reserve, visual, accessible);

    return {
      line,
      reserve,
      visual,
      characters: Array.from(text),
      group: line.dataset.typewriterGroup || 'page',
      speed: numberFrom(line.dataset.typewriterSpeed, 46),
      start: numberFrom(line.dataset.typewriterStart, 380),
      gap: numberFrom(line.dataset.typewriterGap, 180)
    };
  });

  const groups = new Map();
  entries.forEach(entry => {
    if(!groups.has(entry.group)) groups.set(entry.group, []);
    groups.get(entry.group).push(entry);
  });

  const pause = duration => new Promise(resolve => window.setTimeout(resolve, duration));
  const isPunctuation = character => /[，。！？；：,.!?~]/.test(character);
  let generation = 0;

  async function playGroup(groupEntries, runGeneration){
    await pause(groupEntries[0].start);
    if(runGeneration !== generation) return;
    for(const entry of groupEntries){
      if(runGeneration !== generation) return;
      entry.line.classList.add('is-typing');
      for(const character of entry.characters){
        if(runGeneration !== generation) return;
        entry.visual.textContent += character;
        const delay = isPunctuation(character)
          ? Math.max(125, entry.speed * 2.4)
          : entry.speed;
        await pause(delay);
      }
      entry.line.classList.remove('is-typing');
      entry.line.classList.add('is-complete');
      window.setTimeout(() => entry.line.classList.remove('is-complete'), 1000);
      await pause(entry.gap);
    }
  }

  const play = () => {
    generation += 1;
    const runGeneration = generation;
    entries.forEach(entry => {
      entry.characters = Array.from(entry.reserve.textContent.trim());
      entry.visual.textContent = '';
      entry.line.classList.remove('is-typing', 'is-complete');
    });
    groups.forEach(groupEntries => { playGroup(groupEntries, runGeneration); });
  };
  if(document.readyState === 'complete'){
    play();
  }else{
    window.addEventListener('load', play, {once:true});
  }
  window.addEventListener('site-language-change', play);
})();
