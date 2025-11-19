// 简单的番茄钟实现（静态 JS）
(() => {
  const $ = sel => document.querySelector(sel);
  // 胶片音乐相关
  const filmreel = document.getElementById('filmreel');
  const filmreelPlay = document.getElementById('filmreel-play');
  let audio = null;
  let isPlaying = false;

  function updatePlayIcon() {
    if (filmreelPlay) {
      filmreelPlay.textContent = isPlaying ? '⏸' : '▶';
    }
  }

  function toggleMusic() {
    console.log('toggleMusic called, isPlaying:', isPlaying, 'audio:', audio);
    if (!audio) {
      console.log('Creating audio element...');
      audio = new Audio();
      audio.crossOrigin = 'anonymous';
      audio.src = 'spaceWalk.mp3';
      console.log('Audio src set to:', audio.src);
      audio.loop = true;
      audio.volume = 0.7;
      
      audio.addEventListener('loadstart', () => {
        console.log('Audio: loadstart event');
      });
      audio.addEventListener('loadedmetadata', () => {
        console.log('Audio: loadedmetadata event, duration:', audio.duration);
      });
      audio.addEventListener('canplay', () => {
        console.log('Audio: canplay event');
      });
      audio.addEventListener('play', () => {
        console.log('Audio playing, duration:', audio.duration);
        if (filmreel) filmreel.style.animationPlayState = 'running';
      });
      audio.addEventListener('pause', () => {
        console.log('Audio paused');
        if (filmreel) filmreel.style.animationPlayState = 'paused';
      });
      audio.addEventListener('ended', () => {
        console.log('Audio ended');
        isPlaying = false;
        if (filmreel) filmreel.style.animationPlayState = 'paused';
        updatePlayIcon();
      });
      audio.addEventListener('error', (e) => {
        console.error('Audio error event:', e);
        console.error('Audio error:', audio.error);
        if (audio.error) {
          console.error('Error code:', audio.error.code, 'message:', audio.error.message);
        }
      });
    }
    
    try {
      if (isPlaying) {
        console.log('Pausing audio...');
        audio.pause();
        isPlaying = false;
      } else {
        console.log('Playing audio...');
        const playPromise = audio.play();
        console.log('Play promise:', playPromise);
        if (playPromise !== undefined) {
          playPromise
            .then(() => {
              console.log('Audio play succeeded');
              isPlaying = true;
              updatePlayIcon();
            })
            .catch((error) => {
              console.error('Play error:', error);
            });
        } else {
          isPlaying = true;
          updatePlayIcon();
        }
      }
    } catch (error) {
      console.error('Toggle music error:', error);
    }
  }

  if (filmreel) {
    filmreel.addEventListener('click', () => {
      console.log('Filmreel clicked!');
      toggleMusic();
    });
    filmreel.style.animationPlayState = 'paused';
    updatePlayIcon();
    console.log('Filmreel initialized');
  } else {
    console.warn('Filmreel element not found');
  }
  const timeEl = $('#time');
  const modeEl = $('#mode');
  const sessionEl = $('#session');
  const startBtn = $('#start');
  const pauseBtn = $('#pause');
  const resetBtn = $('#reset');

  const workInput = $('#work-min');
  const shortInput = $('#short-min');
  const longInput = $('#long-min');
  const roundsInput = $('#rounds');

  // SVG环形进度条相关
  const progressRing = $('#progress-ring');
  let ringTotal = 439.8; // 2πr, r=70
  let ringOffset = 0;
  let sessionTotal = 25 * 60;

  let interval = null;
  let remaining = 25 * 60; // seconds
  let mode = 'work'; // work | short | long
  let sessionCount = 0;

  function saveSettings(){
    const s = {
      work:+workInput.value,
      short:+shortInput.value,
      long:+longInput.value,
      rounds:+roundsInput.value
    };
    localStorage.setItem('pomodoro-settings', JSON.stringify(s));
  }

  function loadSettings(){
    const s = JSON.parse(localStorage.getItem('pomodoro-settings')||'null');
    if(s){
      workInput.value = s.work;
      shortInput.value = s.short;
      longInput.value = s.long;
      roundsInput.value = s.rounds;
    }
  }

  function formatTime(sec){
    const m = Math.floor(sec/60).toString().padStart(2,'0');
    const s = (sec%60).toString().padStart(2,'0');
    return `${m}:${s}`;
  }

  function updateUI(){
    timeEl.textContent = formatTime(remaining);
    modeEl.textContent = mode === 'work' ? '工作' : mode === 'short' ? '短休息' : '长休息';
    sessionEl.textContent = `第 ${sessionCount} / ${roundsInput.value} 回合`;
    document.title = `${formatTime(remaining)} — 番茄钟`;
    // 环形进度条
    if(progressRing){
      let percent = remaining/sessionTotal;
      ringOffset = ringTotal * (1-percent);
      progressRing.setAttribute('stroke-dashoffset', ringOffset);
    }
  }

  function playBeep(){
    try{
      const ctx = new (window.AudioContext || window.webkitAudioContext)();
      const o = ctx.createOscillator();
      const g = ctx.createGain();
      o.type = 'sine'; o.frequency.value = 880;
      g.gain.value = 0.05;
      o.connect(g); g.connect(ctx.destination);
      o.start();
      setTimeout(()=>{o.stop(); ctx.close()}, 300);
    }catch(e){console.warn('Audio not available',e)}
  }

  function switchMode(newMode){
    mode = newMode;
    if(mode === 'work'){
      sessionTotal = +workInput.value * 60;
      remaining = sessionTotal;
    } else if(mode === 'short'){
      sessionTotal = +shortInput.value * 60;
      remaining = sessionTotal;
    } else {
      sessionTotal = +longInput.value * 60;
      remaining = sessionTotal;
    }
    updateUI();
    playBeep();
  }

  function tick(){
    if(remaining > 0){
      remaining--;
      updateUI();
      return;
    }
    // 到时，切换
    if(mode === 'work'){
      sessionCount++;
      const rounds = +roundsInput.value;
      if(sessionCount % rounds === 0){
        switchMode('long');
      } else {
        switchMode('short');
      }
    } else {
      switchMode('work');
    }
  }

  function start(){
    if(interval) return;
    interval = setInterval(tick, 1000);
    startBtn.disabled = true; pauseBtn.disabled = false;
  }

  function pause(){
    if(!interval) return;
    clearInterval(interval); interval = null;
    startBtn.disabled = false; pauseBtn.disabled = true;
  }

  function reset(){
    pause();
    sessionCount = 0;
    mode = 'work';
    sessionTotal = +workInput.value * 60;
    remaining = sessionTotal;
    updateUI();
  }

  // Bind controls
  startBtn.addEventListener('click', ()=>{start();});
  pauseBtn.addEventListener('click', ()=>{pause();});
  resetBtn.addEventListener('click', ()=>{reset();});

  [workInput, shortInput, longInput, roundsInput].forEach(inp=>{
    inp.addEventListener('change', ()=>{saveSettings(); reset();});
  });

  // Keyboard shortcuts
  window.addEventListener('keydown', (e)=>{
    if(e.code === 'Space'){
      e.preventDefault();
      if(interval) pause(); else start();
    } else if(e.key.toLowerCase() === 'r'){
      reset();
    }
  });

  // init
  loadSettings();
  sessionTotal = +workInput.value * 60;
  remaining = sessionTotal;
  updateUI();
  pauseBtn.disabled = true;

})();
