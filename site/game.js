(() => {
  const canvas = document.querySelector('#game');
  const ctx = canvas.getContext('2d');
  const overlay = document.querySelector('#overlay');
  const title = document.querySelector('#overlayTitle');
  const description = document.querySelector('#overlayDesc');
  const controlHint = document.querySelector('#controlHint');
  const startButton = document.querySelector('#startButton');
  const returnToTitleButton = document.querySelector('#returnToTitleButton');
  const campaignRoute = document.querySelector('#campaignRoute');
  const mobileControls = document.querySelector('#mobileControls');
  const handednessToggle = document.querySelector('#handednessToggle');
  const audioButton = document.querySelector('#audioToggle');
  const sfxButton = document.querySelector('#sfxToggle');
  const musicVolumeControl = document.querySelector('#musicVolume');
  const sfxVolumeControl = document.querySelector('#sfxVolume');
  const musicVolumeValue = document.querySelector('#musicVolumeValue');
  const sfxVolumeValue = document.querySelector('#sfxVolumeValue');
  const fullscreenButton = document.querySelector('#fullscreenToggle');
  const albumButton = document.querySelector('#albumButton');
  const shareRunButton = document.querySelector('#shareRunButton');
  const runGradeBadge = document.querySelector('#runGradeBadge');
  const runGradeMark = document.querySelector('#runGradeMark');
  const runGradeTitle = document.querySelector('#runGradeTitle');
  const runGradeDetails = document.querySelector('#runGradeDetails');
  const gameStatus = document.querySelector('#gameStatus');
  const saveTransfer = document.querySelector('#saveTransfer');
  const saveTransferHint = document.querySelector('#saveTransferHint');
  const defaultSaveTransferHint = saveTransferHint?.textContent || '';
  const saveFileInput = document.querySelector('#saveFileInput');
  const overlayBackground = [
    document.querySelector('.topline'), canvas, gameStatus, document.querySelector('#pauseButton'),
    mobileControls, document.querySelector('.footer'), document.querySelector('.rotate-hint')
  ].filter(Boolean);
  function setOverlayVisible(visible) {
    overlay.style.display = visible ? 'grid' : 'none';
    overlayBackground.forEach(element => { element.inert = visible; });
  }
  const W = canvas.width;
  const H = canvas.height;
  const compactControlsQuery = window.matchMedia?.('(pointer: coarse), (max-width: 700px)');
  const reducedMotionQuery = window.matchMedia?.('(prefers-reduced-motion: reduce)');
  let prefersReducedMotion = reducedMotionQuery?.matches ?? false;
  const syncReducedMotionPreference = event => { prefersReducedMotion = event.matches; };
  if (reducedMotionQuery?.addEventListener) reducedMotionQuery.addEventListener('change', syncReducedMotionPreference);
  else reducedMotionQuery?.addListener?.(syncReducedMotionPreference);
  let fullscreenAutoRequested = false;
  let telegramOrientationLockDismissed = false;
  let compactHudScale = 1;
  const updateCompactHudScale = () => { compactHudScale = clamp(W / (canvas.clientWidth || W), 1, 2.6); };
  updateCompactHudScale();
  window.addEventListener('resize', updateCompactHudScale);
  const compactHudResizeObserver = typeof ResizeObserver === 'function' ? new ResizeObserver(updateCompactHudScale) : null;
  compactHudResizeObserver?.observe(canvas);
  const telegramApp = window.Telegram?.WebApp;
  const desktopControlHint = 'WASD / стрелки — движение · Space — прыжок · J / Z — удар рукой<br>После FRY KING: V — нога · после NUGGET BRUTE: L — хлыст<br>Перед финалом L — огненный кулак · P / Esc — пауза<br>Геймпад: стик · A прыжок · B рука · RB нога · LB особый удар';
  const touchControlHint = 'Слева — движение · справа — прыжок и доступные удары<br>Нога откроется после первого босса, хлыст — после третьего';
  const leftHandedTouchControlHint = 'Справа — движение · слева — прыжок и доступные удары<br>Нога откроется после первого босса, хлыст — после третьего';
  let leftHandedControls = false;
  try { leftHandedControls = localStorage.getItem('tooHungryLeftHanded') === 'true'; } catch { /* The layout preference can stay session-only if storage is blocked. */ }
  function syncHandednessToggle() {
    mobileControls?.classList.toggle('is-left-handed', leftHandedControls);
    document.querySelector('#pauseButton')?.classList.toggle('is-left-handed', leftHandedControls);
    handednessToggle?.setAttribute('aria-pressed', String(leftHandedControls));
    handednessToggle?.setAttribute('aria-label', leftHandedControls ? 'Атаки слева, движение справа' : 'Атаки справа, движение слева');
    if (handednessToggle) handednessToggle.textContent = leftHandedControls ? 'АТАКА СЛЕВА' : 'АТАКА СПРАВА';
  }
  syncHandednessToggle();
  handednessToggle?.addEventListener('click', () => {
    leftHandedControls = !leftHandedControls;
    syncHandednessToggle();
    syncControlHint();
    try { localStorage.setItem('tooHungryLeftHanded', String(leftHandedControls)); } catch { /* Keep the selected layout for this session. */ }
  });
  function syncControlHint() {
    if (controlHint) controlHint.innerHTML = compactControlsQuery?.matches ? (leftHandedControls ? leftHandedTouchControlHint : touchControlHint) : desktopControlHint;
  }
  syncControlHint();
  if (compactControlsQuery?.addEventListener) compactControlsQuery.addEventListener('change', syncControlHint);
  else compactControlsQuery?.addListener?.(syncControlHint);
  function syncTelegramOrientationLock() {
    if (!telegramApp?.lockOrientation || telegramOrientationLockDismissed) return;
    try {
      if (running && window.matchMedia?.('(orientation: landscape)').matches) telegramApp.lockOrientation();
    } catch { /* Orientation lock is optional on older Telegram clients. */ }
  }
  function requestPlayFullscreen() {
    if (fullscreenAutoRequested) return;
    try {
      if (telegramApp) {
        fullscreenAutoRequested = true;
        const request = telegramApp.isFullscreen ? null : telegramApp.requestFullscreen?.();
        request?.catch?.(() => {});
        return;
      }
      if (!window.matchMedia?.('(pointer: coarse)').matches || !document.fullscreenEnabled || document.fullscreenElement) return;
      fullscreenAutoRequested = true;
      const request = document.documentElement.requestFullscreen?.({ navigationUI: 'hide' });
      request?.catch?.(() => {});
    } catch { /* Browser and Telegram fullscreen support is optional. */ }
  }
  function syncFullscreenButton() {
    if (!fullscreenButton) return;
    const fullscreen = Boolean(telegramApp?.isFullscreen || document.fullscreenElement);
    fullscreenButton.setAttribute('aria-pressed', String(fullscreen));
    fullscreenButton.setAttribute('aria-label', fullscreen ? 'Выйти из полноэкранного режима' : 'Включить полноэкранный режим');
    fullscreenButton.title = fullscreen ? 'Выйти из полного экрана' : 'Полный экран';
    fullscreenButton.textContent = fullscreen ? '⤢' : '⛶';
  }
  function handleTelegramFullscreenChange() {
    syncFullscreenButton();
    if (!telegramApp) return;
    telegramOrientationLockDismissed = !telegramApp.isFullscreen;
    if (telegramApp.isFullscreen) syncTelegramOrientationLock();
    else {
      try { telegramApp.unlockOrientation?.(); } catch { /* Older Telegram clients can ignore orientation unlock. */ }
    }
  }
  function togglePlayFullscreen() {
    fullscreenAutoRequested = true;
    try {
      if (telegramApp) {
        const wasFullscreen = Boolean(telegramApp.isFullscreen);
        const toggle = wasFullscreen ? telegramApp.exitFullscreen : telegramApp.requestFullscreen;
        if (typeof toggle === 'function') toggle.call(telegramApp);
        else announce('Полный экран недоступен в этой версии Telegram.');
        if (wasFullscreen) {
          telegramOrientationLockDismissed = true;
          try { telegramApp.unlockOrientation?.(); } catch { /* Older Telegram clients can ignore orientation unlock. */ }
        } else {
          telegramOrientationLockDismissed = false;
          syncTelegramOrientationLock();
        }
        return;
      }
      if (document.fullscreenElement) {
        document.exitFullscreen?.()?.catch?.(() => announce('Браузер не разрешил выйти из полного экрана.'));
      } else if (document.fullscreenEnabled) {
        document.documentElement.requestFullscreen?.({ navigationUI: 'hide' })?.catch?.(() => announce('Браузер не разрешил включить полный экран.'));
      } else announce('Полный экран недоступен в этом браузере.');
    } catch {
      announce('Не удалось изменить режим экрана.');
    }
  }
  fullscreenButton?.addEventListener('click', togglePlayFullscreen);
  document.addEventListener('fullscreenchange', syncFullscreenButton);
  window.addEventListener('orientationchange', syncTelegramOrientationLock);
  if (telegramApp) {
    telegramApp.BackButton?.onClick?.(() => { if (running) pauseGame(); });
    telegramApp.onEvent?.('fullscreenChanged', handleTelegramFullscreenChange);
    telegramApp.onEvent?.('fullscreenFailed', event => {
      syncFullscreenButton();
      if (event?.error === 'UNSUPPORTED') announce('Полный экран не поддерживается этим клиентом Telegram.');
    });
  }
  syncFullscreenButton();

  const levels = [
    { name: 'КУХНЯ ФРИТЮРНИЦЫ', chapter: 'THE FIRST SIZZLE', chapterLine: 'Жар обжигает, но первый осколок уже зовёт вперёд.', accent: '#ff765e', boss: 'FRY KING', key: 'fryKing', background: 'assets/backgrounds/fry-kitchen-background.jpg', track: 1, trackTitle: 'BREAKFAST', waves: 2, ability: 'УДАР НОГОЙ', shard: 'ОСКОЛОК I', bossLine: 'ЗДЕСЬ ВСЁ ГОРЯЧЕЕ. ОСОБЕННО Я.', victoryLine: 'Фритюрница остыла. Даже картошка выдохнула.' },
    { name: 'ПИЦЦЕРИЯ', chapter: 'A SLICE OF TROUBLE', chapterLine: 'За хрустящей корочкой спрятан второй осколок.', accent: '#ffc177', boss: 'PIZZA SLICE', key: 'pizzaSlice', background: 'assets/backgrounds/pizzeria-background.jpg', track: 2, trackTitle: 'BANK', waves: 2, ability: 'УСИЛЕННАЯ НОГА', shard: 'ОСКОЛОК II', bossLine: 'ТВОЙ ПУТЬ ОТРЕЗАН. МОЙ КУСОК.', victoryLine: 'Последний кусок взят. Пиццерия закрывается.' },
    { name: 'ХОЛОДНЫЙ СКЛАД', chapter: 'COLD STORAGE', chapterLine: 'На морозе искра слабеет. Капля всё равно не сдаётся.', accent: '#9bdfe9', boss: 'NUGGET BRUTE', key: 'nuggetBrute', background: 'assets/backgrounds/cold-storage-background.jpg', track: 3, trackTitle: 'BASE', waves: 2, ability: 'СОУСНЫЙ ХЛЫСТ', shard: 'ОСКОЛОК III', bossLine: 'ЗАМОРОЖУ ТЕБЯ ДО САМОГО ФИНАЛА.', victoryLine: 'Наггет крошится. На этот раз — буквально.' },
    { name: 'ПАРОВАЯ КУХНЯ', chapter: 'STEAM & STRINGS', chapterLine: 'Последний осколок спрятан за клубком живой пасты.', accent: '#ee8fca', boss: 'SPAGHETTI MONSTER', key: 'spaghettiMonster', background: 'assets/backgrounds/pasta-kitchen-background.jpg', track: 4, trackTitle: 'NO HOOK ft. GURME', waves: 2, ability: 'ОГНЕННЫЙ КУЛАК', shard: 'ОСКОЛОК IV', bossLine: 'ПОПРОБУЙ НЕ ЗАПУТАТЬСЯ В МОЁМ БИТЕ.', victoryLine: 'Спагетти распутаны. Поварской кошмар закончен.' },
    { name: 'TOO HUNGRY', chapter: 'BACK TO THE TABLE', chapterLine: 'Четыре осколка собрались. Шеф и блюдо уже рядом.', accent: '#ffdc8a', boss: 'BURGER TOO HUNGRY', key: 'burger', background: 'assets/backgrounds/final-counter-background.jpg', track: 5, trackTitle: 'HOFMANNITA', finale: true }
  ];

  const art = {
    burger: deferArt('assets/characters-web/burger-too-hungry.png'),
    hotplate: deferArt('assets/obstacles/flaming-hotplate.png'),
    platedSteak: loadArt('assets/food/plated-ribeye.png'),
    hero: loadArt('assets/characters-web/sauce-drop.png'),
    heroRun: loadArt('assets/characters-web/sauce-drop-run.png'),
    heroRunAlt: deferArt('assets/characters-web/sauce-drop-run-alt.png'),
    heroPunch: loadArt('assets/characters-web/sauce-drop-punch.png'),
    heroHeavy: deferArt('assets/characters-web/sauce-drop-heavy.png'),
    heroWhip: deferArt('assets/characters-web/sauce-drop-whip.png'),
    heroDodge: deferArt('assets/characters-web/sauce-drop-dodge.png'),
    heroJump: loadArt('assets/characters-web/sauce-drop-jump.png'),
    chef: deferArt('assets/characters-web/xarizma19-chef.png'),
    chefPour: deferArt('assets/characters-web/xarizma19-chef-pour.png'),
    chefMiss: deferArt('assets/characters-web/xarizma19-chef-miss.png'),
    chefWin: deferArt('assets/characters-web/xarizma19-chef-win.png'),
    npcs: {
      garlic: deferArt('assets/characters-web/garlic-guard.png'),
      tomato: deferArt('assets/characters-web/tomato-bomber.png'),
      mozzarella: deferArt('assets/characters-web/mozzarella-bruiser.png'),
      pepper: deferArt('assets/characters-web/pepper-sprinter.png')
    },
    npcAttacks: {
      garlic: deferArt('assets/characters-web/garlic-guard-attack.png'),
      tomato: deferArt('assets/characters-web/tomato-bomber-attack.png'),
      mozzarella: deferArt('assets/characters-web/mozzarella-bruiser-attack.png'),
      pepper: deferArt('assets/characters-web/pepper-sprinter-attack.png')
    },
    bosses: {
      fryKing: [deferArt('assets/characters-web/fry-king.png'), deferArt('assets/characters-web/fry-king-attack.png')],
      pizzaSlice: [deferArt('assets/characters-web/pizza-slice.png'), deferArt('assets/characters-web/pizza-slice-attack.png')],
      nuggetBrute: [deferArt('assets/characters-web/nugget-brute.png'), deferArt('assets/characters-web/nugget-brute-attack.png')],
      spaghettiMonster: [deferArt('assets/characters-web/spaghetti-monster.png'), deferArt('assets/characters-web/spaghetti-monster-attack.png')]
    },
    backgrounds: levels.map((level, index) => index === 0 ? loadArt(level.background) : deferArt(level.background))
  };

  const keys = new Set();
  const touch = { left: false, right: false, up: false, down: false };
  const touchAttackTimers = new Map();
  let gamepadId = null;
  let gamepadPressed = new Set();
  let cutsceneGamepadId = null;
  let cutsceneGamepadPressed = new Set();
  let menuGamepadTimer = 0;
  let menuGamepadId = null;
  let menuGamepadPressed = new Set();
  let menuGamepadDirection = '';
  let menuGamepadRepeatAt = 0;
  const music = new Audio();
  music.loop = true;
  const MUSIC_MAX_VOLUME = 0.38;
  music.volume = MUSIC_MAX_VOLUME;
  let audioContext = null;
  let sfxOutput = null;
  const noiseBufferCache = new Map();
  let musicState = 'MUSIC FILES NOT ADDED';
  let saveStorageUnavailable = false, saveWarningAnnounced = false, saveRecoveredFromBackup = false;
  let gameState = loadProgress();
  let musicEnabled = gameState.musicEnabled !== false;
  let levelIndex = Math.min(gameState.maxLevel, levels.length - 1);
  let player, enemies, boss, hazards, particles, drops, damageNumbers = [], finaleObstacles = [], dashStains = [];
  let cameraX = 0, worldWidth = W, waveIndex = -1, nextWaveAt = 620, fightGate = 0, wavesCleared = 0, enemiesDefeated = 0, totalEnemies = 0, waveQueue = [], waveKills = 0, waveReinforcementAt = 0, bossSpawned = false, bossIntro = 0;
  let running = false, playerMoving = false, time = 0, lastTime = 0, shake = 0, hitStop = 0, toast = '', toastTime = 0, stageIntroTime = 0, saveTimer = 0, streakKills = 0, streakTime = 0, sauceRushTime = 0, sauceRushMaxTime = 0, perfectDodgeTime = 0, counterTime = 0, attractAnimationFrame = 0, attractStartedAt = 0;
  let cutscene = null, pendingBossVictory = null;
  let gameFrameId = 0, paused = false;
  let finaleMiniDefeated = false, finaleMiniSpawned = false, finaleMiniSavedHp = 900, finaleBarriers = [];
  let lastAnnouncement = '', announcementVersion = 0;

  function announce(message) {
    if (!gameStatus || message === lastAnnouncement) return;
    lastAnnouncement = message;
    const version = ++announcementVersion;
    gameStatus.textContent = '';
    requestAnimationFrame(() => { if (version === announcementVersion) gameStatus.textContent = message; });
  }

  function loadArt(src) {
    const image = new Image();
    image.assetSource = src;
    return requestArt(image);
  }

  function deferArt(src) {
    const image = new Image();
    image.assetSource = src;
    return image;
  }

  function requestArt(image) {
    if (image && !image.src && image.assetSource) image.src = image.assetSource;
    return image;
  }

  function preloadStageArt(index) {
    const stage = levels[index];
    requestArt(art.backgrounds[index]);
    requestArt(art.heroRunAlt);
    Object.values(art.npcs).forEach(requestArt);
    Object.values(art.npcAttacks).forEach(requestArt);
    if (stage.key && art.bosses[stage.key]) art.bosses[stage.key].forEach(requestArt);
    if (gameState.dash) requestArt(art.heroDodge);
    if (gameState.whip) requestArt(art.heroWhip);
    if (gameState.heavy) requestArt(art.heroHeavy);
    if (stage.finale) [art.chefWin, art.burger, art.hotplate].forEach(requestArt);
  }

  function loadProgress() {
    const fresh = { maxLevel: 0, shards: 0, dash: false, whip: false, heavy: false, introSeen: false, secretSeen: false, musicEnabled: true, sfxEnabled: true, musicVolume: 100, sfxVolume: 100, checkpoint: null, runSeconds: 0, runKills: 0, runDodges: 0, runPeakStreak: 0, runStartLevel: 0, currentLevel: 0, bestRunSeconds: null, runFinished: false, lastRunIsRecord: false };
    try {
      const parseSaveObject = raw => {
        if (typeof raw !== 'string' || !raw.trim()) return null;
        try {
          const value = JSON.parse(raw);
          return value && typeof value === 'object' && !Array.isArray(value) ? value : null;
        } catch { return null; }
      };
      const integer = (value, min, max) => Number.isInteger(value) && value >= min && value <= max;
      const numeric = (value, min = 0, max = 1e7) => Number.isFinite(value) && value >= min && value <= max;
      let stored = parseSaveObject(localStorage.getItem('tooHungrySave'));
      if (!integer(stored?.maxLevel, 0, levels.length - 1)) {
        const backup = parseSaveObject(localStorage.getItem('tooHungrySaveBackup'));
        if (integer(backup?.maxLevel, 0, levels.length - 1)) {
          stored = backup;
          saveRecoveredFromBackup = true;
        } else {
          const access = Number(localStorage.getItem('tooHungryUnlockedLevel') || 0);
          if (integer(access, 1, levels.length - 1)) stored = { ...fresh, maxLevel: access, currentLevel: access };
          else return fresh;
        }
      }
      const backupAccess = parseSaveObject(localStorage.getItem('tooHungrySaveBackup'));
      const watermark = Number(localStorage.getItem('tooHungryUnlockedLevel') || 0);
      const maxLevel = Math.max(stored.maxLevel, integer(backupAccess?.maxLevel, 0, 4) ? backupAccess.maxLevel : 0, integer(watermark, 0, 4) ? watermark : 0);
      const secretSeen = stored.secretSeen === true;
      return {
        ...fresh,
        maxLevel,
        shards: Math.max(integer(stored.shards, 0, levels.length - 1) ? stored.shards : 0, maxLevel),
        dash: stored.dash === true || maxLevel >= 1,
        whip: stored.whip === true || maxLevel >= 2,
        heavy: stored.heavy === true || maxLevel >= 3,
        introSeen: stored.introSeen === true,
        secretSeen,
        musicEnabled: stored.musicEnabled !== false,
        sfxEnabled: stored.sfxEnabled !== false,
        musicVolume: integer(stored.musicVolume, 0, 100) ? stored.musicVolume : 100,
        sfxVolume: integer(stored.sfxVolume, 0, 100) ? stored.sfxVolume : 100,
        checkpoint: normalizeCheckpoint(stored.checkpoint, maxLevel, secretSeen),
        runSeconds: numeric(stored.runSeconds) ? stored.runSeconds : 0,
        runKills: integer(stored.runKills, 0, 1e7) ? stored.runKills : 0,
        runDodges: integer(stored.runDodges, 0, 1e7) ? stored.runDodges : 0,
        runPeakStreak: integer(stored.runPeakStreak, 0, 1e7) ? stored.runPeakStreak : 0,
        runStartLevel: integer(stored.runStartLevel, 0, maxLevel) ? stored.runStartLevel : 0,
        currentLevel: integer(stored.currentLevel, 0, maxLevel) ? stored.currentLevel : maxLevel,
        bestRunSeconds: stored.bestRunSeconds === null || numeric(stored.bestRunSeconds, 0.01) ? stored.bestRunSeconds : null,
        runFinished: stored.runFinished === true,
        lastRunIsRecord: stored.lastRunIsRecord === true
      };
    } catch {
      saveStorageUnavailable = true;
      return fresh;
    }
  }

  function normalizeCheckpoint(checkpoint, maxLevel, secretSeen) {
    const integer = (value, min, max) => Number.isInteger(value) && value >= min && value <= max;
    const numeric = (value, min = 0, max = 1e7) => Number.isFinite(value) && value >= min && value <= max;
    if (!checkpoint || typeof checkpoint !== 'object' || Array.isArray(checkpoint)) return null;
    const stageIndex = checkpoint.stageIndex;
    if (!integer(stageIndex, 0, levels.length - 1) || stageIndex > maxLevel) return null;
    const stage = levels[stageIndex];
    const maxPlayerHp = secretSeen ? 119 : 100;
    if (!numeric(checkpoint.playerX) || !numeric(checkpoint.hp, 1, maxPlayerHp) || !integer(checkpoint.kills, 0, 1e7)) return null;
    const stageWidth = stage.finale ? 4200 : 1900 + stage.waves * 1370;
    const playerX = clamp(checkpoint.playerX, 42, stageWidth - 42);
    const playerY = numeric(checkpoint.playerY, 382, 477) ? checkpoint.playerY : stage.finale ? 452 : 420;
    const pickups = Array.isArray(checkpoint.pickups) ? checkpoint.pickups.slice(0,16).filter(drop => drop && numeric(drop.x,42,stageWidth-42) && numeric(drop.y,200,500) && numeric(drop.amount,1,119) && numeric(drop.life,.01,120)).map(drop => ({ type: drop.type === 'medkit' ? 'medkit' : 'sauce', x: drop.x, y: drop.y, amount: drop.amount, life: drop.life, elite: drop.elite === true, fullRestore: drop.fullRestore === true })) : [];
    if (checkpoint.finale === true && stage.finale) {
      return integer(checkpoint.obstacles, 0, 4) ? { stageIndex, finale: true, playerX, playerY, pickups, hp: clamp(checkpoint.hp, Math.ceil(maxPlayerHp / 2), maxPlayerHp), obstacles: checkpoint.obstacles, miniDefeated: checkpoint.miniDefeated === true || numeric(checkpoint.bossHp,1,bossHealth(4)), miniHp: numeric(checkpoint.miniHp,1,900) ? checkpoint.miniHp : 900, kills: checkpoint.kills, bossHealMask: integer(checkpoint.bossHealMask, 0, 3) ? checkpoint.bossHealMask : 0, ...(numeric(checkpoint.bossHp, 1, bossHealth(4)) ? { bossHp: checkpoint.bossHp } : {}) } : null;
    }
    if (checkpoint.finale === true || stage.finale || !integer(checkpoint.waveIndex, 0, stage.waves)) return null;
    if (checkpoint.boss === true ? checkpoint.waveIndex !== stage.waves : checkpoint.waveIndex >= stage.waves) return null;
    const normalized = { bossHealMask: integer(checkpoint.bossHealMask, 0, 3) ? checkpoint.bossHealMask : 0, stageIndex, waveIndex: checkpoint.waveIndex, playerX, playerY, pickups, hp: checkpoint.hp, kills: checkpoint.kills, boss: checkpoint.boss === true };
    const maxBossHp = bossHealth(stageIndex);
    if (normalized.boss) normalized.bossHp = numeric(checkpoint.bossHp, 1, maxBossHp) ? checkpoint.bossHp : maxBossHp;
    const total = 5 + stageIndex;
    const before = Array.from({ length: normalized.waveIndex }, (_, i) => Math.floor(total / stage.waves) + Number(i < total % stage.waves)).reduce((sum, n) => sum + n, 0);
    if (normalized.boss) normalized.kills = total;
    else {
      const state = checkpoint.waveState;
      const types = ['garlic','tomato','mozzarella','pepper'];
      const validActor = entry => entry && types.includes(entry.type) && numeric(entry.x,42,stageWidth-42) && numeric(entry.y,382,477) && numeric(entry.hp,1,2000);
      const validQueue = entry => entry && types.includes(entry.type) && numeric(entry.x,42,stageWidth-42);
      const amount = Math.floor(total / stage.waves) + Number(normalized.waveIndex < total % stage.waves);
      if (state?.v === 1 && Array.isArray(state.enemies) && Array.isArray(state.queue) && state.enemies.length <= 8 && state.queue.length <= 8 && state.enemies.every(validActor) && state.queue.every(validQueue) && integer(state.waveKills,0,amount) && state.enemies.length + state.queue.length === amount - state.waveKills && checkpoint.kills === before + state.waveKills && numeric(state.gate,0,stageWidth) && numeric(state.nextAt,0,stageWidth+2000)) {
        normalized.waveState = { v: 1, gate: state.gate, nextAt: state.nextAt, waveKills: state.waveKills,
          enemies: state.enemies.map(entry => ({ type: entry.type, x: entry.x, y: entry.y, hp: entry.hp, elite: entry.elite === true, enraged: entry.enraged === true, face: entry.face === 1 ? 1 : -1 })),
          queue: state.queue.map(entry => ({ type: entry.type, x: entry.x, elite: entry.elite === true })) };
      } else normalized.kills = before;
    }
    return normalized;
  }

  function saveProgress() {
    if (gameState.checkpoint) {
      const maxHp = gameState.secretSeen ? 119 : 100;
      gameState.checkpoint.hp = clamp(gameState.checkpoint.hp ?? maxHp, Math.ceil(maxHp / 2), maxHp);
    }
    try {
      try {
        const previous = localStorage.getItem('tooHungrySave');
        if (previous) {
          const parsed = JSON.parse(previous);
          if (parsed && typeof parsed === 'object' && !Array.isArray(parsed) && Number.isInteger(parsed.maxLevel) && parsed.maxLevel >= 0 && parsed.maxLevel < levels.length) {
            localStorage.setItem('tooHungrySaveBackup', previous);
          }
        }
      } catch { /* A backup is optional; it must never block the main save. */ }
      const unlocked = Number(localStorage.getItem('tooHungryUnlockedLevel') || 0);
      if (Number.isInteger(unlocked) && unlocked >= 0 && unlocked < levels.length) gameState.maxLevel = Math.max(gameState.maxLevel, unlocked);
      localStorage.setItem('tooHungryUnlockedLevel', String(gameState.maxLevel));
      localStorage.setItem('tooHungrySave', JSON.stringify(gameState));
      saveStorageUnavailable = false;
      saveWarningAnnounced = false;
      syncSaveTransferHint();
    } catch {
      saveStorageUnavailable = true;
      syncSaveTransferHint();
      if (!saveWarningAnnounced) {
        saveWarningAnnounced = true;
        announce('Автосохранение недоступно. Скачай файл прохождения в меню, чтобы не потерять прогресс.');
      }
    }
  }

  function syncSaveTransferHint() {
    if (!saveTransferHint) return;
    saveTransferHint.textContent = saveStorageUnavailable
      ? 'Автосохранение в браузере недоступно или не читается. Скачай файл текущего прогресса в меню перед закрытием игры.'
      : defaultSaveTransferHint;
    saveTransferHint.classList.toggle('is-warning', saveStorageUnavailable);
  }

  function newPlayer() {
    const maxHp = gameState.secretSeen ? 119 : 100;
    return { x: 145, y: 420, z: 0, vz: 0, jumpBuffer: 0, coyoteTime: 0, landingFx: 0, hp: maxHp, hpTrail: maxHp, maxHp, face: 1, attack: 0, attackPose: '', attackDuration: 0, attackCooldown: 0, dash: 0, dashCooldown: 0, whipCooldown: 0, heavyCooldown: 0, kickCooldown: 0, invuln: 0, dodgeReady: false, combo: 0, attackCombo: 0, comboTime: 0, finisher: 0, walk: 0, stepCooldown: 0, hurt: 0 };
  }

  function chapterAbilities(index = levelIndex) {
    return { kick: index >= 1, special: index >= 3, upgraded: index >= 4, specialName: index >= 4 ? 'ОГНЕННЫЙ КУЛАК' : 'ХЛЫСТ' };
  }

  function startLevel(index, resume = false) {
    stopGameLoop(); paused = false; resetGameInput();
    stopTitleAttract();
    stopMenuGamepadNavigation();
    const connectedGamepad = connectedStandardGamepad();
    gamepadId = connectedGamepad?.id || null;
    gamepadPressed = new Set(connectedGamepad?.buttons.map((button, buttonIndex) => button.pressed ? buttonIndex : -1).filter(buttonIndex => buttonIndex >= 0) || []);
    telegramApp?.BackButton?.show?.();
    requestPlayFullscreen();
    levelIndex = Math.max(0, Math.min(index, levels.length - 1));
    const stage = levels[levelIndex];
    gameState.dash = false; gameState.heavy = false; gameState.whip = chapterAbilities().special;
    syncControlHint();
    preloadStageArt(levelIndex);
    const checkpoint = resume && gameState.checkpoint?.stageIndex === levelIndex ? gameState.checkpoint : null;
    gameState.currentLevel = levelIndex;
    if (!checkpoint) gameState.checkpoint = null;
    saveProgress();
    player = newPlayer();
    if (stage.finale) player.y = 452;
    worldWidth = stage.finale ? 4200 : 1900 + stage.waves * 1370;
    cameraX = 0;
    if (checkpoint) {
      player.x = clamp(checkpoint.playerX ?? 145, 42, worldWidth - 42);
      player.hp = clamp(checkpoint.hp ?? player.maxHp, Math.ceil(player.maxHp / 2), player.maxHp);
      player.invuln = 1;
    }
    if (checkpoint?.playerY) player.y = checkpoint.playerY;
    player.hpTrail = player.hp;
    enemies = [];
    boss = null;
    waveIndex = checkpoint ? checkpoint.finale ? -1 : checkpoint.boss ? stage.waves - 1 : checkpoint.waveIndex - 1 : -1;
    nextWaveAt = 680;
    fightGate = 0;
    wavesCleared = 0;
    enemiesDefeated = checkpoint?.kills ?? 0;
    waveQueue = [];
    waveKills = 0;
    waveReinforcementAt = 0;
    streakKills = 0;
    streakTime = 0;
    sauceRushTime = 0;
    sauceRushMaxTime = 0;
    perfectDodgeTime = 0;
    counterTime = 0;
    totalEnemies = stage.finale ? 0 : 5 + levelIndex;
    bossSpawned = false;
    bossIntro = 0;
    hazards = [];
    particles = [];
    dashStains = [];
    drops = [];
    damageNumbers = [];
    if (checkpoint?.pickups) drops = checkpoint.pickups.map(drop => ({ ...drop }));
    if (checkpoint?.waveState && !checkpoint.boss && !stage.finale) {
      const state = checkpoint.waveState;
      waveIndex = checkpoint.waveIndex; fightGate = state.gate; nextWaveAt = state.nextAt;
      waveKills = state.waveKills; wavesCleared = waveIndex;
      waveQueue = state.queue.map(entry => ({ ...entry }));
      enemies = state.enemies.map(saved => {
        const enemy = makeEnemy(saved.x, saved.type, saved.elite);
        Object.assign(enemy, { y: saved.y, hp: Math.min(saved.hp, enemy.maxHp), face: saved.face, enraged: saved.enraged, attackCooldown: 1, timer: .55 });
        enemy.hpTrail = enemy.hp; return enemy;
      });
      waveReinforcementAt = waveQueue.length ? waveKills + 3 : Infinity;
    }
    finaleObstacles = stage.finale ? [780, 1510, 2260, 3020].map((x, i) => ({ x, cleared: i < (checkpoint?.obstacles ?? 0) })) : [];
    if (stage.finale) {
      finaleMiniDefeated = !!checkpoint?.miniDefeated;
      finaleMiniSpawned = finaleMiniDefeated;
      finaleMiniSavedHp = checkpoint?.miniHp || 900;
      finaleBarriers = [1120,1880,2670].map((x,i)=>({ x, type: i===1 ? 'steam' : 'skewer', cycle: Math.random()*2, hit:false }));
      finaleObstacles.forEach(o=>Object.assign(o,{ cycle:Math.random()*2, state:'low', timer:1.2+Math.random()*1.4 }));
    }
    time = 0;
    stageIntroTime = checkpoint ? 0 : 2.8;
    shake = 0;
    hitStop = 0;
    toast = stage.finale ? 'ФИНАЛЬНЫЙ ЗАБЕГ · ПРЫГАЙ ЧЕРЕЗ ПРЕПЯТСТВИЯ' : `ЭТАП ${String(levelIndex + 1).padStart(2, '0')} · ${stage.waves} ВОЛНЫ ДО ${stage.boss}`;
    toastTime = 2.5;
    announce(`Глава ${levelIndex + 1}. ${stage.chapter}. ${stage.chapterLine} ${stage.name}. Музыка: ${stage.trackTitle}.`);
    unlockAudio();
    updateMusic(stage.track);
    if (stage.finale && !checkpoint) {
      gameState.checkpoint = { stageIndex: levelIndex, finale: true, playerX: player.x, hp: player.hp, obstacles: 0, kills: 0 };
      saveProgress();
    }
    setOverlayVisible(false);
    document.body.classList.add('playing');
    running = true;
    playerMoving = false;
    canvas.focus({ preventScroll: true });
    syncTelegramOrientationLock();
    lastTime = performance.now();
    scheduleGameFrame();
  }

  function bossHealth(index) { return [1100, 1500, 1950, 2450, 3400][index]; }

  function makeEnemy(x, type, elite = false) {
    const baseHp = 150 + levelIndex * 44 + Math.max(0, waveIndex) * 12;
    const hp = Math.round(baseHp * (elite ? 1.5 : 1));
    return { x, y: 412 + Math.random() * 52, type, elite, enraged: false, hp, hpTrail: hp, maxHp: hp, alive: true, spawn: prefersReducedMotion ? 0 : 0.32, hit: 0, knockback: 0, timer: 0.7 + Math.random(), vx: 0, swing: Math.random() * 6, face: -1, state: 'idle', stateTime: 0, attackCooldown: (levelIndex === 0 ? 1.45 + Math.random() * 0.9 : 0.9 + Math.random() * 1.2) * (elite ? 0.82 : 1), guardCooldown: 1.2 + Math.random() * 2, guarding: 0 };
  }

  function updateMusic(trackNumber) {
    music.pause();
    music.volume = MUSIC_MAX_VOLUME * (gameState.musicVolume ?? 100) / 100;
    musicState = `${levels[levelIndex].trackTitle} · TRACK ${String(trackNumber).padStart(2, '0')}`;
    if (!musicEnabled) {
      music.removeAttribute('src');
      music.load();
      return;
    }
    music.src = `assets/audio/track-${String(trackNumber).padStart(2, '0')}.mp3`;
    music.load();
    music.play().catch(() => {});
  }

  function toggleMusic() {
    musicEnabled = !musicEnabled;
    gameState.musicEnabled = musicEnabled;
    syncMusicButton();
    saveProgress();
    if (musicEnabled) updateMusic(levels[levelIndex].track);
    else {
      music.pause();
      music.removeAttribute('src');
      music.load();
    }
  }

  function syncMusicButton() {
    audioButton?.setAttribute('aria-pressed', String(musicEnabled));
    audioButton?.setAttribute('aria-label', musicEnabled ? 'Выключить музыку' : 'Включить музыку');
    if (audioButton) audioButton.textContent = musicEnabled ? '♪' : '♫̸';
  }

  function syncSfxButton() {
    const enabled = gameState.sfxEnabled !== false;
    sfxButton?.setAttribute('aria-pressed', String(enabled));
    sfxButton?.setAttribute('aria-label', enabled ? 'Выключить звуковые эффекты' : 'Включить звуковые эффекты');
    if (sfxButton) sfxButton.textContent = enabled ? 'SFX' : 'SFX×';
  }

  function toggleSfx() {
    gameState.sfxEnabled = !(gameState.sfxEnabled !== false);
    syncSfxButton();
    saveProgress();
  }

  function syncMixerControls() {
    const musicVolume = gameState.musicVolume ?? 100;
    const sfxVolume = gameState.sfxVolume ?? 100;
    if (musicVolumeControl) musicVolumeControl.value = String(musicVolume);
    if (sfxVolumeControl) sfxVolumeControl.value = String(sfxVolume);
    if (musicVolumeValue) musicVolumeValue.value = `${musicVolume}%`;
    if (sfxVolumeValue) sfxVolumeValue.value = `${sfxVolume}%`;
    music.volume = MUSIC_MAX_VOLUME * musicVolume / 100;
    if (sfxOutput && audioContext) sfxOutput.gain.setTargetAtTime(0.9 * sfxVolume / 100, audioContext.currentTime, 0.025);
  }

  function setMixerVolume(kind, value, persist = false) {
    gameState[kind] = Math.max(0, Math.min(100, Math.round(Number(value) || 0)));
    syncMixerControls();
    if (persist) saveProgress();
  }

  musicVolumeControl?.addEventListener('input', event => setMixerVolume('musicVolume', event.currentTarget.value));
  musicVolumeControl?.addEventListener('change', event => setMixerVolume('musicVolume', event.currentTarget.value, true));
  sfxVolumeControl?.addEventListener('input', event => setMixerVolume('sfxVolume', event.currentTarget.value));
  sfxVolumeControl?.addEventListener('change', event => setMixerVolume('sfxVolume', event.currentTarget.value, true));

  music.addEventListener('error', () => {
    if (!musicEnabled) return;
    const trackTitle = levels[levelIndex]?.trackTitle || 'ALBUM TRACK';
    musicState = `${trackTitle} · TRACK UNAVAILABLE`;
    announce(`Не удалось загрузить трек ${trackTitle}.`);
  });
  audioButton?.addEventListener('click', toggleMusic);
  sfxButton?.addEventListener('click', toggleSfx);
  syncMusicButton();
  syncSfxButton();
  syncMixerControls();

  function unlockAudio() {
    const AudioContextClass = window.AudioContext || window.webkitAudioContext;
    if (!audioContext && AudioContextClass) audioContext = new AudioContextClass();
    if (audioContext && !sfxOutput) {
      const output = audioContext.createGain();
      const compressor = audioContext.createDynamicsCompressor?.();
      output.gain.value = 0.9 * (gameState.sfxVolume ?? 100) / 100;
      if (compressor) {
        compressor.threshold.value = -8;
        compressor.knee.value = 12;
        compressor.ratio.value = 3;
        compressor.attack.value = 0.004;
        compressor.release.value = 0.14;
        output.connect(compressor);
        compressor.connect(audioContext.destination);
      } else output.connect(audioContext.destination);
      sfxOutput = output;
    }
    if (audioContext?.state === 'suspended') audioContext.resume().catch(() => {});
  }

  function sound(kind, variant = 0) {
    if (gameState.sfxEnabled === false || !audioContext) return;
    const now = audioContext.currentTime;
    const tone = (frequency, endFrequency, duration, type, volume, delay = 0) => {
      const oscillator = audioContext.createOscillator();
      const gain = audioContext.createGain();
      oscillator.type = type;
      oscillator.frequency.setValueAtTime(frequency, now + delay);
      oscillator.frequency.exponentialRampToValueAtTime(Math.max(1, endFrequency), now + delay + duration);
      gain.gain.setValueAtTime(0.0001, now + delay);
      gain.gain.exponentialRampToValueAtTime(volume, now + delay + 0.012);
      gain.gain.exponentialRampToValueAtTime(0.0001, now + delay + duration);
      oscillator.connect(gain).connect(sfxOutput || audioContext.destination);
      oscillator.start(now + delay);
      oscillator.stop(now + delay + duration + 0.02);
    };
    const noise = (duration, volume, cutoff, delay = 0) => {
      const length = Math.ceil(audioContext.sampleRate * duration);
      let buffer = noiseBufferCache.get(length);
      if (!buffer) {
        buffer = audioContext.createBuffer(1, length, audioContext.sampleRate);
        const samples = buffer.getChannelData(0);
        for (let i = 0; i < length; i++) samples[i] = (Math.random() * 2 - 1) * (1 - i / length);
        noiseBufferCache.set(length, buffer);
      }
      const source = audioContext.createBufferSource();
      const filter = audioContext.createBiquadFilter();
      const gain = audioContext.createGain();
      source.buffer = buffer;
      filter.type = 'lowpass';
      filter.frequency.value = cutoff;
      gain.gain.setValueAtTime(volume, now + delay);
      gain.gain.exponentialRampToValueAtTime(0.0001, now + delay + duration);
      source.connect(filter).connect(gain).connect(sfxOutput || audioContext.destination);
      source.start(now + delay);
    };
    const bossSounds = [
      () => { noise(0.22, 0.14, 1800); tone(115, 58, 0.24, 'triangle', 0.16); },
      () => { noise(0.2, 0.11, 2600); tone(760, 220, 0.2, 'sawtooth', 0.08); },
      () => { tone(105, 42, 0.32, 'sine', 0.19); noise(0.1, 0.1, 900, 0.03); },
      () => { tone(460, 120, 0.34, 'triangle', 0.13); tone(520, 180, 0.38, 'sine', 0.08, 0.04); },
      () => { tone(82, 36, .3, 'triangle', .16); noise(.24, .1, 1500); tone(310, 95, .24, 'sawtooth', .055, .06); }
    ];
    const bossTelegraphSounds = [
      () => { tone(245, 490, 0.14, 'triangle', 0.06); tone(610, 350, 0.16, 'sine', 0.045, 0.08); },
      () => { tone(880, 470, 0.16, 'square', 0.035); noise(0.07, 0.035, 2800, 0.04); },
      () => { tone(150, 68, 0.2, 'sine', 0.1); noise(0.06, 0.06, 700, 0.04); },
      () => { tone(430, 760, 0.18, 'sawtooth', 0.045); tone(680, 520, 0.18, 'sine', 0.055, 0.06); },
      () => { tone(110, 220, .18, 'triangle', .08); tone(330, 165, .2, 'sine', .055, .08); }
    ];
    const enemyDefeatSounds = [
      () => { tone(720, 1260, 0.12, 'square', 0.045); tone(1080, 1720, 0.17, 'sine', 0.06, 0.045); },
      () => { tone(430, 180, 0.13, 'sine', 0.09); noise(0.08, 0.07, 1800, 0.02); },
      () => { tone(640, 390, 0.16, 'triangle', 0.07); tone(260, 720, 0.2, 'sine', 0.06, 0.08); },
      () => { noise(0.11, 0.055, 4200); tone(1100, 520, 0.16, 'sawtooth', 0.04); }
    ];
    switch (kind) {
      case 'playerDown': noise(0.28, 0.12, 520); tone(190, 48, 0.42, 'triangle', 0.15, 0.035); break;
      case 'waveSpawn': tone(210, 470, 0.16, 'triangle', 0.065); noise(0.09, 0.045, 980, 0.04); break;
      case 'abilityUnlock': [392, 523, 784].forEach((note, i) => tone(note, note * 1.08, 0.23, 'sine', 0.07, i * 0.11)); break;
      case 'enemyTell': tone(310, 180, 0.1, 'triangle', 0.04); break;
      case 'jump': tone(250, 620, 0.13, 'sine', 0.09); break;
      case 'step': tone(88 + Math.random() * 16, 56, 0.055, 'triangle', 0.026); noise(0.035, 0.028, 560); break;
      case 'land': tone(155, 65, 0.11, 'triangle', 0.08); noise(0.06, 0.055, 740, 0.01); break;
      case 'attack': noise(0.1, 0.1, 2300); tone(210, 110, 0.09, 'triangle', 0.1); break;
      case 'dash': noise(0.24, 0.13, 1500); tone(520, 90, 0.23, 'sawtooth', 0.08); break;
      case 'dodge': tone(740, 1460, 0.16, 'sine', 0.09); tone(1110, 1880, 0.2, 'triangle', 0.065, 0.035); break;
      case 'counter': tone(230, 1120, 0.11, 'sawtooth', 0.13); tone(620, 1460, 0.2, 'triangle', 0.09, 0.025); break;
      case 'whip': noise(0.18, 0.14, 3200); tone(980, 180, 0.18, 'sawtooth', 0.09); break;
      case 'heavy': tone(105, 38, 0.28, 'sine', 0.2); noise(0.08, 0.17, 700, 0.015); break;
      case 'damage': tone(175, 52, 0.25, 'square', 0.1); noise(0.12, 0.1, 850); break;
      case 'enemyHit': noise(0.09, 0.1, 1300); tone(310, 150, 0.1, 'triangle', 0.07); break;
      case 'enemyDefeat': enemyDefeatSounds[variant]?.(); break;
      case 'garlicStab': tone(1120, 420, 0.1, 'square', 0.06); noise(0.07, 0.045, 2200, 0.03); break;
      case 'tomatoBump': tone(270, 92, 0.15, 'triangle', 0.075); noise(0.08, 0.045, 900); break;
      case 'pepperRush': noise(0.13, 0.08, 3800); tone(760, 190, 0.15, 'sawtooth', 0.055); break;
      case 'tomatoThrow': noise(0.24, 0.1, 2100); tone(330, 115, 0.24, 'triangle', 0.09); break;
      case 'guard': tone(880, 370, 0.12, 'square', 0.06); tone(1320, 880, 0.1, 'sine', 0.04, 0.025); break;
      case 'enemyRush': noise(0.15, 0.1, 1900); tone(420, 180, 0.15, 'sawtooth', 0.055); break;
      case 'bossHit': tone(245, 82, 0.18, 'sawtooth', 0.14); noise(0.16, 0.1, 1150); break;
      case 'bossEnrage': tone(250, 54, 0.42, 'sawtooth', 0.12); tone(115, 38, 0.36, 'sine', 0.17, 0.035); noise(0.3, 0.13, 1250, 0.02); break;
      case 'bossTell': bossTelegraphSounds[levelIndex]?.(); break;
      case 'bossAttack': bossSounds[levelIndex]?.(); break;
      case 'pickup': tone(530, 980, 0.13, 'sine', 0.1); tone(790, 1350, 0.18, 'sine', 0.09, 0.09); break;
      case 'finaleLaunch': tone(230, 720, 0.32, 'sine', 0.075); noise(0.11, 0.045, 2100, 0.08); break;
      case 'finaleImpact': noise(0.22, 0.18, 1050); tone(185, 58, 0.34, 'triangle', 0.17); tone(690, 1040, 0.42, 'sine', 0.06, 0.13); break;
      case 'introSplash': noise(0.18, 0.12, 1250); tone(245, 78, 0.24, 'triangle', 0.11); tone(720, 460, 0.2, 'sine', 0.045, 0.035); break;
      case 'introJar': tone(920, 560, 0.16, 'sine', 0.055); tone(1220, 880, 0.11, 'triangle', 0.035, 0.06); break;
      case 'introPour': noise(0.55, 0.045, 820); tone(180, 125, 0.5, 'sine', 0.035); break;
      case 'introWhistle': tone(1100, 1680, 0.2, 'sine', 0.06); tone(1580, 980, 0.26, 'triangle', 0.045, 0.11); break;
      case 'introWake': [440, 660, 880].forEach((note, i) => tone(note, note * 1.12, 0.2, 'sine', 0.055, i * 0.09)); break;
      case 'introStep': tone(155, 72, 0.09, 'triangle', 0.06); noise(0.045, 0.04, 760, 0.015); break;
      case 'introSting': [392, 494, 659, 784].forEach((note, i) => tone(note, note * 1.025, 0.48, 'sine', 0.052, i * 0.095)); break;
      case 'kick': noise(0.08, 0.12, 900); tone(180, 72, 0.16, 'triangle', 0.14); break;
      case 'victory': [523, 659, 784].forEach((note, i) => tone(note, note * 1.15, 0.34, 'sine', 0.09, i * 0.09)); break;
    }
  }

  function haptic(style = 'light') {
    try {
      if (telegramApp?.HapticFeedback?.impactOccurred) {
        telegramApp.HapticFeedback.impactOccurred(style);
        return;
      }
      if ('vibrate' in navigator) navigator.vibrate(style === 'heavy' ? 34 : style === 'medium' ? 21 : 11);
    } catch { /* Haptics are optional. */ }
  }

  document.addEventListener('keydown', event => {
    if (event.key !== 'Tab' || overlay.style.display !== 'grid') return;
    const focusable = [...overlay.querySelectorAll('a[href], button:not([disabled]), input:not([disabled]), [tabindex]:not([tabindex="-1"])')]
      .filter(element => !element.hidden && element.getClientRects().length > 0);
    if (!focusable.length) {
      event.preventDefault();
      return;
    }
    const first = focusable[0];
    const last = focusable[focusable.length - 1];
    const activeInside = overlay.contains(document.activeElement);
    if (event.shiftKey && (!activeInside || document.activeElement === first)) {
      event.preventDefault();
      last.focus({ preventScroll: true });
    } else if (!event.shiftKey && (!activeInside || document.activeElement === last)) {
      event.preventDefault();
      first.focus({ preventScroll: true });
    }
  }, true);

  function showOverlay(heading, body, buttonText, action) {
    stopTitleAttract();
    stopGameLoop(); paused = false;
    document.querySelector('.panel')?.classList.remove('is-level-menu');
    running = false;
    telegramApp?.BackButton?.hide?.();
    try { telegramApp?.unlockOrientation?.(); } catch { /* Older Telegram clients can ignore orientation unlock. */ }
    document.body.classList.remove('playing');
    title.textContent = heading;
    description.textContent = body;
    startButton.textContent = buttonText;
    const albumButton = document.querySelector('#albumButton');
    if (albumButton) albumButton.hidden = true;
    if (shareRunButton) shareRunButton.hidden = true;
    if (runGradeBadge) runGradeBadge.hidden = true;
    if (campaignRoute) campaignRoute.hidden = true;
    const routeLabel = document.querySelector('#routeLabel'); if (routeLabel) routeLabel.hidden = true;
    const albumGreeting = document.querySelector('#albumGreeting'); if (albumGreeting) albumGreeting.hidden = true;
    if (saveTransfer) saveTransfer.hidden = true;
    if (saveTransferHint) saveTransferHint.hidden = true;
    if (returnToTitleButton) returnToTitleButton.hidden = true;
    startButton.onclick = action;
    setOverlayVisible(true);
    startButton.focus({ preventScroll: true });
    startMenuGamepadNavigation();
  }

  function connectedStandardGamepad() {
    if (typeof navigator.getGamepads !== 'function') return null;
    try { return Array.from(navigator.getGamepads() || []).find(candidate => candidate?.connected && candidate.mapping === 'standard') || null; }
    catch { return null; }
  }

  function startMenuGamepadNavigation() {
    stopMenuGamepadNavigation();
    if (typeof navigator.getGamepads !== 'function') return;
    const current = connectedStandardGamepad();
    menuGamepadId = current?.id || null;
    menuGamepadPressed = new Set(current?.buttons.map((button, index) => button.pressed ? index : -1).filter(index => index >= 0) || []);
    menuGamepadDirection = current ? menuDirectionFor(current) : '';
    menuGamepadRepeatAt = performance.now() + 330;
    menuGamepadTimer = window.setInterval(readMenuGamepad, 80);
  }

  function stopMenuGamepadNavigation() {
    if (menuGamepadTimer) window.clearInterval(menuGamepadTimer);
    menuGamepadTimer = 0;
    menuGamepadId = null;
    menuGamepadPressed.clear();
    menuGamepadDirection = '';
  }

  function menuDirectionFor(gamepad) {
    const axisX = gamepad.axes[0] || 0;
    const axisY = gamepad.axes[1] || 0;
    return gamepad.buttons[12]?.pressed || axisY < -0.55 ? 'up'
      : gamepad.buttons[13]?.pressed || axisY > 0.55 ? 'down'
        : gamepad.buttons[14]?.pressed || axisX < -0.55 ? 'left'
          : gamepad.buttons[15]?.pressed || axisX > 0.55 ? 'right' : '';
  }

  function readMenuGamepad() {
    if (overlay.style.display !== 'grid') { stopMenuGamepadNavigation(); return; }
    const gamepad = connectedStandardGamepad();
    if (!gamepad) {
      menuGamepadId = null;
      menuGamepadPressed.clear();
      menuGamepadDirection = '';
      return;
    }
    const pressed = new Set(gamepad.buttons.map((button, index) => button.pressed ? index : -1).filter(index => index >= 0));
    if (menuGamepadId !== gamepad.id) {
      menuGamepadId = gamepad.id;
      menuGamepadPressed = pressed;
      menuGamepadDirection = menuDirectionFor(gamepad);
      menuGamepadRepeatAt = performance.now() + 330;
      return;
    }
    const justPressed = index => pressed.has(index) && !menuGamepadPressed.has(index);
    const direction = menuDirectionFor(gamepad);
    if (direction) {
      const now = performance.now();
      const changed = direction !== menuGamepadDirection;
      if (changed || now >= menuGamepadRepeatAt) {
        const options = [...overlay.querySelectorAll('a[href],button:not(:disabled)')].filter(element => !element.hidden && element.getClientRects().length > 0);
        if (options.length) {
          const currentIndex = options.indexOf(document.activeElement);
          const delta = direction === 'down' || direction === 'right' ? 1 : -1;
          const nextIndex = currentIndex < 0
            ? delta > 0 ? 0 : options.length - 1
            : (currentIndex + delta + options.length) % options.length;
          options[nextIndex].focus({ preventScroll: true });
        }
        menuGamepadRepeatAt = now + (changed ? 330 : 145);
      }
    }
    if (justPressed(0)) {
      const options = [...overlay.querySelectorAll('a[href],button:not(:disabled)')].filter(element => !element.hidden && element.getClientRects().length > 0);
      const focused = options.includes(document.activeElement) ? document.activeElement : startButton;
      focused?.click();
    }
    if (justPressed(1) && returnToTitleButton && !returnToTitleButton.hidden) returnToTitleButton.click();
    menuGamepadDirection = direction;
    menuGamepadPressed = pressed;
  }

  function showTitle() {
    const savedCheckpoint = gameState.checkpoint;
    const checkpointIsCurrent = savedCheckpoint && savedCheckpoint.stageIndex <= gameState.maxLevel;
    const next = checkpointIsCurrent ? savedCheckpoint.stageIndex : Math.min(gameState.currentLevel ?? gameState.maxLevel, gameState.maxLevel, levels.length - 1);
    const checkpoint = checkpointIsCurrent ? savedCheckpoint : null;
    const checkpointLabel = checkpoint?.boss ? 'БОСС' : checkpoint?.finale ? 'ФИНАЛ' : checkpoint ? `ВОЛНА ${checkpoint.waveIndex + 1}` : '';
    const continueText = gameState.runFinished ? 'НОВЫЙ ЗАБЕГ' : checkpoint ? `Продолжить · этап ${next + 1} · ${checkpointLabel}` : next > 0 ? `Продолжить · этап ${next + 1}` : 'Начать забег';
    const recap = gameState.maxLevel > 0 ? 'Прогресс сохранён. Продолжи с контрольной точки или выбери любой открытый уровень ниже. Новый забег не закрывает пройденные уровни.' : 'Ой, капля соуса не попала в блюдо. Теперь ей предстоит самостоятельно проделать путь до блюда.';
    renderCampaignRoute(next);
    showOverlay('TOO HUNGRY', recap, continueText, () => gameState.runFinished ? restartCampaign() : startLevel(next, Boolean(checkpoint)));
    document.querySelector('.panel')?.classList.add('is-level-menu');
    if (campaignRoute) campaignRoute.hidden = false;
    const routeLabel = document.querySelector('#routeLabel'); if (routeLabel) routeLabel.hidden = false;
    if (saveTransfer) saveTransfer.hidden = false;
    if (saveTransferHint) saveTransferHint.hidden = false;
    syncSaveTransferHint();
    startTitleAttract();
  }

  function stopTitleAttract() {
    if (attractAnimationFrame) cancelAnimationFrame(attractAnimationFrame);
    attractAnimationFrame = 0;
  }

  function drawTitleBackdrop() {
    ctx.save();
    const background = art.backgrounds[levelIndex];
    requestArt(background);
    const drift = prefersReducedMotion ? 0 : Math.sin(time * 0.24) * 5;
    if (background?.complete && background.naturalWidth) {
      ctx.drawImage(background, -drift, 0, W, H);
      ctx.drawImage(background, W - drift, 0, W, H);
      const shade = ctx.createLinearGradient(0, 0, 0, H);
      shade.addColorStop(0, '#09080d39');
      shade.addColorStop(1, '#08060948');
      ctx.fillStyle = shade;
      ctx.fillRect(0, 0, W, H);
    } else {
      ctx.fillStyle = '#151214';
      ctx.fillRect(0, 0, W, H);
    }
    drawStageDetails();
    ctx.save();
    ctx.translate(-cameraX, 0);
    drawFloor();
    drawPlayer();
    ctx.restore();
    ctx.restore();
  }

  function titleAttractLoop(now) {
    if (running || cutscene || overlay.style.display !== 'grid') {
      attractAnimationFrame = 0;
      return;
    }
    time = (now - attractStartedAt) / 1000;
    drawTitleBackdrop();
    attractAnimationFrame = requestAnimationFrame(titleAttractLoop);
  }

  function startTitleAttract() {
    stopTitleAttract();
    attractStartedAt = performance.now();
    time = 0;
    drawTitleBackdrop();
    if (!prefersReducedMotion) attractAnimationFrame = requestAnimationFrame(titleAttractLoop);
  }

  function exportProgress() {
    const payload = {
      format: 'too-hungry-save',
      version: 1,
      savedAt: new Date().toISOString(),
      progress: {
        maxLevel: gameState.maxLevel,
        shards: gameState.shards,
        dash: gameState.dash,
        whip: gameState.whip,
        heavy: gameState.heavy,
        introSeen: gameState.introSeen,
        secretSeen: gameState.secretSeen,
        checkpoint: gameState.checkpoint,
        runSeconds: gameState.runSeconds,
        runKills: gameState.runKills,
        runDodges: gameState.runDodges,
        runPeakStreak: gameState.runPeakStreak,
        runStartLevel: gameState.runStartLevel,
        currentLevel: gameState.currentLevel,
        bestRunSeconds: gameState.bestRunSeconds,
        runFinished: gameState.runFinished,
        lastRunIsRecord: gameState.lastRunIsRecord,
        musicEnabled,
        sfxEnabled: gameState.sfxEnabled,
        musicVolume: gameState.musicVolume,
        sfxVolume: gameState.sfxVolume
      }
    };
    const blob = new Blob([JSON.stringify(payload, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `too-hungry-save-${new Date().toISOString().slice(0, 10)}.json`;
    document.body.append(link);
    link.click();
    link.remove();
    window.setTimeout(() => URL.revokeObjectURL(url), 1500);
    announce('Файл сохранения скачан. Перенеси его на другое устройство и загрузи в меню игры.');
  }

  function normalizeImportedProgress(data) {
    const integer = (value, min, max) => Number.isInteger(value) && value >= min && value <= max;
    const numeric = (value, min = 0, max = 1e7) => Number.isFinite(value) && value >= min && value <= max;
    if (!data || data.format !== 'too-hungry-save' || data.version !== 1 || !data.progress || typeof data.progress !== 'object') throw new Error('Формат файла сохранения не распознан.');
    const source = data.progress;
    if (!integer(source.maxLevel, 0, levels.length - 1)) throw new Error('В файле указана неверная кампания.');
    if (!numeric(source.runSeconds) || !integer(source.runKills, 0, 1e7) || !integer(source.runDodges, 0, 1e7) || !integer(source.runPeakStreak, 0, 1e7)) throw new Error('Статистика сохранения повреждена.');
    const normalized = {
      ...gameState,
      maxLevel: source.maxLevel,
      shards: Math.max(integer(source.shards, 0, levels.length - 1) ? source.shards : 0, source.maxLevel),
      dash: source.dash === true || source.maxLevel >= 1, whip: source.whip === true || source.maxLevel >= 2, heavy: source.heavy === true || source.maxLevel >= 3,
      introSeen: source.introSeen === true, secretSeen: source.secretSeen === true,
      runSeconds: source.runSeconds, runKills: source.runKills, runDodges: source.runDodges, runPeakStreak: source.runPeakStreak,
      runStartLevel: integer(source.runStartLevel, 0, source.maxLevel) ? source.runStartLevel : 0,
      currentLevel: integer(source.currentLevel, 0, levels.length - 1) ? source.currentLevel : source.maxLevel,
      runFinished: source.runFinished === true, lastRunIsRecord: source.lastRunIsRecord === true,
      musicEnabled: source.musicEnabled !== false, sfxEnabled: source.sfxEnabled !== false,
      musicVolume: Number.isInteger(source.musicVolume) && source.musicVolume >= 0 && source.musicVolume <= 100 ? source.musicVolume : 100,
      sfxVolume: Number.isInteger(source.sfxVolume) && source.sfxVolume >= 0 && source.sfxVolume <= 100 ? source.sfxVolume : 100,
      checkpoint: null
    };
    const best = source.bestRunSeconds;
    if (best === null || numeric(best, 0.01)) {
      const localBest = gameState.bestRunSeconds;
      normalized.bestRunSeconds = best === null ? localBest : numeric(localBest, 0.01) ? Math.min(localBest, best) : best;
    }
    normalized.checkpoint = normalizeCheckpoint(source.checkpoint, normalized.maxLevel, normalized.secretSeen);
    return normalized;
  }

  async function importProgress(file) {
    try {
      if (file.size > 131072) throw new Error('Файл сохранения слишком большой или повреждён.');
      if (!window.confirm('Загрузить выбранный файл? Он заменит текущий этап и контрольную точку. Лучшее локальное время и открытые этапы сохранятся.')) return;
      const parsed = JSON.parse(await file.text());
      const imported = normalizeImportedProgress(parsed);
      imported.maxLevel = Math.max(gameState.maxLevel, imported.maxLevel);
      imported.shards = Math.max(gameState.shards || 0, imported.shards);
      imported.dash = gameState.dash || imported.dash;
      imported.whip = gameState.whip || imported.whip;
      imported.heavy = gameState.heavy || imported.heavy;
      imported.checkpoint = imported.checkpoint && imported.checkpoint.stageIndex <= imported.maxLevel ? imported.checkpoint : null;
      imported.bestRunSeconds = imported.bestRunSeconds ?? gameState.bestRunSeconds;
      gameState = imported;
      levelIndex = Math.min(imported.currentLevel, imported.maxLevel);
      musicEnabled = gameState.musicEnabled !== false;
      syncMusicButton();
      syncSfxButton();
      syncMixerControls();
      music.pause();
      music.removeAttribute('src');
      music.load();
      saveProgress();
      showTitle();
      announce('Прохождение загружено. Можно продолжить с контрольной точки.');
    } catch (error) {
      announce(error?.message || 'Не удалось прочитать файл сохранения.');
      window.alert(error?.message || 'Не удалось прочитать файл сохранения.');
    } finally {
      if (saveFileInput) saveFileInput.value = '';
    }
  }

  document.querySelector('#exportSaveButton')?.addEventListener('click', exportProgress);
  document.querySelector('#importSaveButton')?.addEventListener('click', () => saveFileInput?.click());
  saveFileInput?.addEventListener('change', () => { const file = saveFileInput.files?.[0]; if (file) importProgress(file); });

  function renderCampaignRoute(currentIndex) {
    if (!campaignRoute) return;
    campaignRoute.replaceChildren(...levels.map((stage, index) => {
      const unlocked = index <= gameState.maxLevel;
      const completed = index < gameState.maxLevel;
      const button = document.createElement('button');
      button.type = 'button';
      button.className = `route-stop${unlocked ? ' is-open' : ''}${completed ? ' is-done' : ''}${index === currentIndex ? ' is-current' : ''}`;
      button.style.setProperty('--route-accent', ['#ff765e', '#ffc177', '#9bdfe9', '#ee8fca', '#ffdc8a'][index]);
      button.disabled = !unlocked;
      button.setAttribute('aria-label', unlocked ? `Этап ${index + 1}: ${stage.name}, босс ${stage.boss || 'финальный забег'}, трек ${stage.trackTitle}. Нажмите, чтобы ${completed ? 'переиграть' : 'начать'}.` : `Этап ${index + 1}: ${stage.name}. Сначала пройдите предыдущий этап.`);
      if (index === currentIndex) button.setAttribute('aria-current', 'step');
      button.innerHTML = `<span class="route-number">0${index + 1}</span><span class="route-state">${completed ? '✓' : unlocked ? '●' : 'LOCK'}</span><span class="route-name">${stage.name}</span><span class="route-boss">${stage.boss || 'FINAL RUN'}</span><span class="route-track">♪ ${stage.trackTitle}</span>`;
      button.addEventListener('click', () => {
        if (!unlocked) return;
        const checkpoint = index === currentIndex && gameState.checkpoint?.stageIndex === index;
        const continueCurrentRun = index === currentIndex && !gameState.runFinished && (checkpoint || index === gameState.currentLevel);
        if (!continueCurrentRun) {
          gameState.runSeconds = 0;
          gameState.runKills = 0;
          gameState.runDodges = 0;
          gameState.runPeakStreak = 0;
          gameState.runStartLevel = index;
          gameState.runFinished = false;
        }
        startLevel(index, checkpoint);
      });
      return button;
    }));
  }

  function scheduleCutsceneFrame() {
    if (!cutscene || cutscene.pausedAt || cutscene.frameQueued) return;
    const frameToken = (cutscene.frameToken || 0) + 1;
    cutscene.frameToken = frameToken;
    cutscene.frameQueued = true;
    requestAnimationFrame(now => {
      if (!cutscene || cutscene.frameToken !== frameToken) return;
      cutscene.frameQueued = false;
      cutsceneLoop(now);
    });
  }

  function pauseCutscene() {
    if (!cutscene || cutscene.pausedAt) return;
    cutscene.pausedAt = performance.now();
    cutscene.frameToken = (cutscene.frameToken || 0) + 1;
    cutscene.frameQueued = false;
    music.pause();
  }

  function resumeCutscene() {
    if (!cutscene?.pausedAt || document.visibilityState === 'hidden') return;
    const now = performance.now();
    cutscene.started += now - cutscene.pausedAt;
    if (cutscene.lastFrame !== undefined) cutscene.lastFrame = now;
    cutscene.pausedAt = 0;
    if (cutscene.mode === 'bossVictory' && musicEnabled && music.src) music.play().catch(() => {});
    scheduleCutsceneFrame();
  }

  function prepareCutsceneGamepad() {
    const current = connectedStandardGamepad();
    cutsceneGamepadId = current?.id || null;
    cutsceneGamepadPressed = new Set(current?.buttons.map((button, index) => button.pressed ? index : -1).filter(index => index >= 0) || []);
  }

  function cutsceneSkipPressed() {
    const gamepad = connectedStandardGamepad();
    if (!gamepad) {
      cutsceneGamepadId = null;
      cutsceneGamepadPressed.clear();
      return false;
    }
    const pressed = new Set(gamepad.buttons.map((button, index) => button.pressed ? index : -1).filter(index => index >= 0));
    if (cutsceneGamepadId !== gamepad.id) {
      cutsceneGamepadId = gamepad.id;
      cutsceneGamepadPressed = pressed;
      return false;
    }
    const shouldSkip = [0, 1, 9].some(index => pressed.has(index) && !cutsceneGamepadPressed.has(index));
    cutsceneGamepadPressed = pressed;
    if (shouldSkip && cutscene?.awaitingStart) { startCutsceneWithSound(); return false; }
    return shouldSkip;
  }

  function playCutscene() {
    stopGameLoop(); paused = false;
    running = false;
    music.pause();
    keys.clear();
    touchAttackTimers.forEach(timer => window.clearInterval(timer));
    touchAttackTimers.clear();
    Object.keys(touch).forEach(direction => { touch[direction] = false; });
    stopTitleAttract();
    stopMenuGamepadNavigation();
    prepareCutsceneGamepad();
    [art.chef, art.chefPour, art.chefMiss].forEach(requestArt);
    preloadStageArt(0);
    cutscene = { started: 0, awaitingStart: true, time: 0, jarCue: false, pourCue: false, whistleCue: false, splashCue: false, wakeCue: false, stepOneCue: false, stepTwoCue: false, stingCue: false };
    document.body.classList.remove('playing');
    setOverlayVisible(false);
    canvas.focus({ preventScroll: true });
    scheduleCutsceneFrame();
  }

  function startCutsceneWithSound() {
    if (!cutscene?.awaitingStart) return;
    unlockAudio();
    cutscene.awaitingStart = false;
    cutscene.started = performance.now();
    sound('introJar');
    cutscene.jarCue = true;
  }

  function skipCutscene() {
    if (!cutscene) return;
    if (cutscene.mode === 'ending') { showEndingReward(); return; }
    if (cutscene.mode === 'bossVictory') { finishBossVictory(); return; }
    cutscene = null;
    gameState.introSeen = true;
    saveProgress();
    showTitle();
  }

  function cutsceneLoop(now) {
    if (!cutscene || cutscene.pausedAt) return;
    if (cutsceneSkipPressed()) { skipCutscene(); return; }
    if (cutscene.awaitingStart) {
      drawCutscene(0);
      scheduleCutsceneFrame();
      return;
    }
    cutscene.time = (now - cutscene.started) / 1000;
    if (cutscene.mode === 'bossVictory') {
      const dt = Math.min(0.05, Math.max(0, (now - cutscene.lastFrame) / 1000));
      cutscene.lastFrame = now;
      time = cutscene.time;
      if (!cutscene.shardCue && cutscene.time >= 1.48) {
        cutscene.shardCue = true;
        sound('pickup');
        haptic('soft');
      }
      music.volume = MUSIC_MAX_VOLUME * (gameState.musicVolume / 100) * (1 - clamp(cutscene.time / 2.45, 0, 1));
      for (const particle of particles) {
        particle.life -= dt;
        particle.x += particle.vx * dt;
        particle.y += particle.vy * dt;
        particle.vy += 350 * dt;
        particle.rotation += particle.spin * dt;
      }
      particles = particles.filter(particle => particle.life > 0);
      damageNumbers = damageNumbers.filter(item => (item.life -= dt) > 0);
      if (cutscene.time >= 2.45) { finishBossVictory(); return; }
      draw();
      drawBossVictorySequence(cutscene.time);
      scheduleCutsceneFrame();
      return;
    }
    if (cutscene.mode === 'ending') {
      if (!cutscene.launchCue && cutscene.time >= 1.65) {
        cutscene.launchCue = true;
        sound('finaleLaunch');
      }
      if (!cutscene.impactCue && cutscene.time >= 4.82) {
        cutscene.impactCue = true;
        sound('finaleImpact');
        haptic('medium');
      }
      if (!cutscene.rewardCue && cutscene.time >= 5.18) {
        cutscene.rewardCue = true;
        sound('pickup');
      }
      if (cutscene.time >= 10.5) { showEndingReward(); return; }
      drawEnding(cutscene.time);
      scheduleCutsceneFrame();
      return;
    }
    if (!cutscene.jarCue && cutscene.time >= 0.55) { cutscene.jarCue = true; sound('introJar'); }
    if (!cutscene.pourCue && cutscene.time >= 3.25) { cutscene.pourCue = true; sound('introPour'); }
    if (!cutscene.whistleCue && cutscene.time >= 6.15) { cutscene.whistleCue = true; sound('introWhistle'); }
    if (!cutscene.splashCue && cutscene.time >= 8.2) {
      cutscene.splashCue = true;
      sound('introSplash');
      haptic('soft');
    }
    if (!cutscene.wakeCue && cutscene.time >= 9.15) { cutscene.wakeCue = true; sound('introWake'); }
    if (!cutscene.stepOneCue && cutscene.time >= 10.45) { cutscene.stepOneCue = true; sound('introStep'); }
    if (!cutscene.stepTwoCue && cutscene.time >= 11.25) { cutscene.stepTwoCue = true; sound('introStep'); }
    if (!cutscene.stingCue && cutscene.time >= 14.35) { cutscene.stingCue = true; sound('introSting'); }
    if (cutscene.time >= 18) { skipCutscene(); return; }
    drawCutscene(cutscene.time);
    scheduleCutsceneFrame();
  }

  function drawCutscene(seconds) {
    const background = art.backgrounds[0];
    if (background.complete && background.naturalWidth) ctx.drawImage(background, 0, 0, W, H);
    else { ctx.fillStyle = '#120d10'; ctx.fillRect(0, 0, W, H); }
    ctx.fillStyle = '#09070ab0'; ctx.fillRect(0, 0, W, H);
    if (!prefersReducedMotion) { const light = ctx.createRadialGradient(245, 236, 30, 478, 236, 510); light.addColorStop(0, 'rgba(255,112,73,.12)'); light.addColorStop(1, 'rgba(8,4,8,0)'); ctx.fillStyle = light; ctx.fillRect(0,0,W,H); }
    const cameraZoom = prefersReducedMotion ? 1 : 1 + clamp(seconds / 18, 0, 1) * 0.055;
    const impactShake = !prefersReducedMotion && seconds >= 8.2 && seconds < 8.62 ? (1 - (seconds - 8.2) / 0.42) : 0;
    const shakeX = impactShake * Math.sin(seconds * 73) * 4.5;
    const shakeY = impactShake * Math.cos(seconds * 61) * 2.5;
    ctx.save();
    ctx.translate(W / 2 + shakeX, H / 2 + shakeY);
    ctx.scale(cameraZoom, cameraZoom);
    ctx.translate(-W / 2, -H / 2);
    const chef = seconds > 8.2 ? art.chefMiss : seconds > 3.25 ? art.chefPour : art.chef;
    if (chef.complete && chef.naturalWidth) {
      const entrance = prefersReducedMotion ? 1 : Math.min(1, seconds / 1.2);
      const reaction = !prefersReducedMotion && seconds > 8.2 && seconds < 9.2 ? Math.sin(seconds * 34) * 5 : 0;
      ctx.save(); ctx.globalAlpha = entrance; ctx.translate((1 - entrance) * 150 + reaction, 0);
      ctx.drawImage(chef, 110, 25 + (prefersReducedMotion ? 0 : Math.sin(seconds * 2) * 2), 283, 425);
      ctx.restore();
    }
    drawCutscenePlate();
    if (seconds > 3.45 && seconds < 8.2) {
      const progress = Math.min(1, (seconds - 3.45) / 4.75);
      const t = progress;
      const x = prefersReducedMotion ? 390 : (1-t)*(1-t)*144 + 2*(1-t)*t*310 + t*t*390;
      const y = prefersReducedMotion ? 433 : 77 + Math.pow(t, 2.15) * 356;
      if (!prefersReducedMotion) {
        ctx.save(); ctx.globalAlpha = .32 + t * .28; ctx.strokeStyle = '#f2483d'; ctx.lineWidth = 3 + t * 5; ctx.lineCap = 'round';
        ctx.beginPath(); ctx.moveTo(x + 7, y - 17 - t * 30); ctx.quadraticCurveTo(x + 3, y - 14, x, y - 5); ctx.stroke(); ctx.restore();
      }
      drawSauceDrop(x, y + (prefersReducedMotion ? 0 : Math.sin(seconds * 18) * 4), 12);
    }
    if (seconds >= 8.2) {
      const splash = prefersReducedMotion ? 0.78 : Math.max(0, 1 - (seconds - 8.2) * 1.2);
      ctx.globalAlpha = splash;
      ctx.fillStyle = '#ed372f'; ctx.beginPath(); ctx.ellipse(390, 445, 34 + (1-splash)*36, 8 + (1-splash)*5, 0, 0, Math.PI * 2); ctx.fill();
      ctx.globalAlpha = 1;
      if (!prefersReducedMotion && seconds < 8.95) {
        const age = seconds - 8.2;
        for (let i = 0; i < 9; i++) {
          const direction = (i - 4) / 4;
          const px = 390 + direction * age * (76 + (i % 3) * 24);
          const py = 441 - age * (80 + (i % 4) * 24) + age * age * 240;
          ctx.globalAlpha = clamp(1 - age / .75, 0, 1);
          drawSauceDrop(px, Math.min(446, py), 2.4 + (i % 3));
        }
        ctx.globalAlpha = 1;
      }
      if (seconds > 9.2) {
        const run = prefersReducedMotion ? 0 : Math.min(1, (seconds - 9.2) / 4.1);
        const heroX = prefersReducedMotion ? 480 : 390 + run * 660;
        const hero = art.heroRun.complete && art.heroRun.naturalWidth ? art.heroRun : art.hero;
        if (hero.complete && hero.naturalWidth) {
          ctx.save(); ctx.translate(heroX, 460 + (prefersReducedMotion ? 0 : Math.sin(seconds * 16) * 4));
          if (!prefersReducedMotion) ctx.rotate(Math.sin(seconds * 15) * 0.06);
          ctx.drawImage(hero, -46, -90, 92, 92); ctx.restore();
        }
      }
    }
    ctx.restore();
    const caption = seconds < 3.2 ? 'XARIZMA19 ГОТОВИТ СВОЙ ФИРМЕННЫЙ СОУС TOO HUNGRY' : seconds < 6.3 ? 'ОДНА КАПЛЯ — И БЛЮДО СТАНЕТ ЛЕГЕНДОЙ…' : seconds < 8.2 ? 'ОЙ. КАПЛЯ ЛЕТИТ МИМО!' : seconds < 9.2 ? 'ТИШИНА. А ПОТОМ — ПЕРВОЕ ДВИЖЕНИЕ.' : seconds < 14 ? 'КАПЛЯ ОЖИЛА. И ДОБЕРЁТСЯ ДО БЛЮДА САМА.' : 'ЧЕТЫРЕ КУХНИ · ПЯТЬ БОССОВ · ОДНА ПОСЛЕДНЯЯ КАПЛЯ';
    announce(caption);
    rounded(560, 32, 348, 35, 4, '#100d10d9');
    text('XARIZMA19  /  TOO HUNGRY', 577, 54, 10, '#ff806c', 'left', 900);
    rounded(52, 462, 620, 46, 5, '#100d10e8');
    ctx.strokeStyle = '#743b38'; ctx.strokeRect(52.5, 462.5, 619, 45);
    text(caption, 72, 491, 11, '#fff0df', 'left', 900);
    text(cutscene?.awaitingStart ? 'ENTER / SPACE / TAP — НАЧАТЬ СО ЗВУКОМ' : 'A / B / START / ENTER / SPACE / TAP — ПРОПУСТИТЬ', 928, 520, 8, '#f0d7c1', 'right', 700);
  }

  function drawEnding(seconds) {
    const background = art.backgrounds[4];
    if (background?.complete && background.naturalWidth) ctx.drawImage(background, 0, 0, W, H);
    else { ctx.fillStyle = '#171115'; ctx.fillRect(0, 0, W, H); }
    ctx.fillStyle = '#08070bc7'; ctx.fillRect(0, 0, W, H);
    const light = ctx.createRadialGradient(255, 350, 15, 255, 350, 280);
    light.addColorStop(0, 'rgba(255,178,86,.12)'); light.addColorStop(1, 'rgba(255,178,86,0)');ctx.fillStyle=light;ctx.fillRect(0,0,W,H);
    if (art.chefWin.complete && art.chefWin.naturalWidth) {
      ctx.save();ctx.translate(380, 229 + (prefersReducedMotion ? 0 : Math.sin(seconds * 2) * 1.2));
      ctx.rotate(prefersReducedMotion ? 0 : Math.sin(seconds * 1.4) * .006);
      ctx.drawImage(art.chefWin, -125, -192, 250, 400);ctx.restore();
    }
    drawCutscenePlate();
    const launchAt = 1.65, landingAt = 4.82;
    if (seconds < launchAt) {
      const walk = prefersReducedMotion ? 1 : clamp(seconds / launchAt, 0, 1);
      const heroX = -45 + walk * 125;
      const hero = art.heroRun.complete && art.heroRun.naturalWidth ? art.heroRun : art.hero;
      ctx.save();ctx.translate(heroX, 452 - (prefersReducedMotion ? 0 : Math.abs(Math.sin(seconds * 13)) * 3));ctx.drawImage(hero,-42,-84,84,84);ctx.restore();
    } else if (seconds < landingAt) {
      const t = prefersReducedMotion ? 1 : clamp((seconds - launchAt) / (landingAt - launchAt), 0, 1);
      const x = 80 + t * 150, y = 430 + (375 - 430) * t - Math.sin(t * Math.PI) * 172;
      drawSauceDrop(x, y, 14 - t * 3);
      if (!prefersReducedMotion) {
        ctx.save();ctx.strokeStyle='#ee503e';ctx.lineWidth=3;ctx.globalAlpha=.35;ctx.lineCap='round';ctx.beginPath();ctx.moveTo(x-8,y-13);ctx.quadraticCurveTo(x-4,y-8,x-2,y-5);ctx.stroke();ctx.restore();
      }
    }
    if (seconds >= landingAt) {
      const age = seconds - landingAt, spread = prefersReducedMotion ? 1 : 1 - Math.exp(-age * 9);
      ctx.save();ctx.translate(230,375);ctx.scale(.45+spread*.55,.45+spread*.55);
      const sauce=ctx.createLinearGradient(0,-5,0,10);sauce.addColorStop(0,'#ff6950');sauce.addColorStop(.5,'#c33225');sauce.addColorStop(1,'#791b1b');ctx.fillStyle=sauce;
      ctx.beginPath();ctx.moveTo(-17,0);ctx.bezierCurveTo(-18,-8,-4,-5,3,-6);ctx.bezierCurveTo(17,-8,24,0,17,5);ctx.bezierCurveTo(10,9,-3,3,-9,7);ctx.bezierCurveTo(-23,8,-23,3,-17,0);ctx.fill();
      ctx.strokeStyle='#ffbe91';ctx.lineWidth=1.3;ctx.beginPath();ctx.moveTo(-10,-2);ctx.quadraticCurveTo(-4,-4,1,-2);ctx.stroke();ctx.restore();
      if (!prefersReducedMotion && age < .7) {
        for(let i=0;i<9;i++){const angle=i*Math.PI*2/9, distance=10+age*48;ctx.globalAlpha=(1-age/.7)*.8;ctx.fillStyle=i%2?'#ffd68a':'#ff6a47';ctx.save();ctx.translate(230+Math.cos(angle)*distance,375+Math.sin(angle)*distance*.55-age*12);ctx.rotate(angle);ctx.fillRect(-1,-3,2,6);ctx.restore()}ctx.globalAlpha=1;
      }
      text('БЛЮДО ГОТОВО', 710, 232, 24, '#ffdfa7', 'center', 950);
      text('Приятного прослушивания!', 710, 264, 14, '#f2c794', 'center', 800);
      text('TOO HUNGRY · XARIZMA19', 710, 291, 9, '#bda393', 'center', 800);
    }
    rounded(560,32,348,35,4,'#100d10d9');text('XARIZMA19  /  TOO HUNGRY',577,54,10,'#ff806c','left',900);
    const caption=seconds<launchAt?'ПОСЛЕДНЯЯ КАПЛЯ ВОЗВРАЩАЕТСЯ К БЛЮДУ':seconds<landingAt?'ЕЩЁ ОДИН ПРЫЖОК — ТОЧНО НА СТЕЙК':'ПУТЬ ПРОЙДЕН · ТЕПЕРЬ ВРЕМЯ АЛЬБОМА';
    announce(caption);rounded(52,470,650,38,5,'#100d10e8');text(caption,72,494,10,'#fff0df','left',900);
    text('ENTER / TAP — К АЛЬБОМУ',928,520,8,'#f0d7c1','right',700);
  }

  function drawBossVictorySequence(seconds) {
    const stage = pendingBossVictory?.stage;
    if (!stage || !boss || !player) return;
    const progress = clamp(seconds / 2.45, 0, 1);
    const sourceX = clamp(boss.x - cameraX, 110, W - 110);
    const sourceY = clamp(boss.y - 154, 145, 315);
    const targetX = clamp(player.x - cameraX, 88, W - 88);
    const targetY = clamp(player.y - 150, 180, 360);
    const flight = prefersReducedMotion ? 1 : clamp((seconds - 0.2) / 1.32, 0, 1);
    const eased = prefersReducedMotion ? 1 : flight * flight * (3 - 2 * flight);
    const arc = prefersReducedMotion ? 0 : Math.sin(flight * Math.PI) * 116;
    const shardX = sourceX + (targetX - sourceX) * eased;
    const shardY = sourceY + (targetY - sourceY) * eased - arc;
    const cardIn = prefersReducedMotion ? 1 : clamp((seconds - 0.72) / 0.42, 0, 1);
    const cardEase = prefersReducedMotion ? 1 : 1 - Math.pow(1 - cardIn, 3);

    ctx.save();
    const shade = prefersReducedMotion ? 0.25 : 0.19 + Math.min(0.13, progress * 0.13);
    ctx.fillStyle = `rgba(8,6,8,${shade})`;
    ctx.fillRect(0, 0, W, H);

    if (flight < 1) {
      ctx.save();
      ctx.globalAlpha = 0.42 + 0.48 * (1 - flight);
      ctx.strokeStyle = '#ffd17b';
      ctx.lineWidth = 1.4;
      ctx.setLineDash(prefersReducedMotion ? [] : [3, 8]);
      ctx.beginPath();
      ctx.moveTo(sourceX, sourceY);
      ctx.quadraticCurveTo((sourceX + targetX) / 2, Math.min(sourceY, targetY) - 145, targetX, targetY);
      ctx.stroke();
      ctx.setLineDash([]);
      ctx.restore();

      ctx.save();
      ctx.translate(shardX, shardY);
      if (!prefersReducedMotion) ctx.rotate(seconds * 5.4);
      ctx.globalAlpha = Math.min(1, flight * 5 + 0.25);
      ctx.shadowColor = '#ffd17b';
      ctx.shadowBlur = prefersReducedMotion ? 8 : 15 + Math.sin(seconds * 8) * 4;
      ctx.fillStyle = '#ffe1a0';
      ctx.strokeStyle = '#fff4d2';
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      ctx.moveTo(0, -15); ctx.lineTo(8, -4); ctx.lineTo(5, 10); ctx.lineTo(0, 16); ctx.lineTo(-7, 5); ctx.lineTo(-5, -8); ctx.closePath();
      ctx.fill(); ctx.stroke();
      ctx.shadowBlur = 0;
      ctx.globalAlpha *= 0.8;
      ctx.fillStyle = '#fff9e9';
      ctx.beginPath(); ctx.moveTo(0, -10); ctx.lineTo(3, -2); ctx.lineTo(0, 8); ctx.lineTo(-2, -1); ctx.closePath(); ctx.fill();
      ctx.restore();
    } else {
      const ring = prefersReducedMotion ? 1 : 0.8 + Math.sin(seconds * 8) * 0.08;
      ctx.strokeStyle = '#ffda91'; ctx.globalAlpha = 0.75;
      ctx.lineWidth = 2;
      ctx.beginPath(); ctx.ellipse(targetX, targetY, 22 * ring, 10 * ring, 0, 0, Math.PI * 2); ctx.stroke();
      ctx.globalAlpha = 1;
    }

    const panelY = 102 + (1 - cardEase) * 18;
    ctx.globalAlpha = cardEase;
    rounded(288, panelY, 384, 86, 5, '#100d10ed');
    ctx.strokeStyle = '#a4654c'; ctx.lineWidth = 1;
    ctx.strokeRect(288.5, panelY + 0.5, 383, 85);
    ctx.fillStyle = '#ffcc7c';
    ctx.fillRect(311, panelY + 15, 3, 54);
    text('КУХНЯ ЗАЧИЩЕНА', 329, panelY + 28, 8, '#ffc887', 'left', 900);
    text(stage.shard, 329, panelY + 51, 18, '#fff0df', 'left', 950);
    text(stage.ability ? `ОТКРЫТА: ${stage.ability}` : 'ПУТЬ К ФИНАЛУ ОТКРЫТ', 329, panelY + 70, 8, '#e8bd8c', 'left', 850);
    ctx.globalAlpha = 0.8;
    text('A / ENTER / TAP — ДАЛЬШЕ', 480, 517, 8, '#f0d7c1', 'center', 700);
    ctx.restore();
  }

  function playEnding() {
    stopGameLoop(); paused = false;
    stopMenuGamepadNavigation();
    prepareCutsceneGamepad();
    running = false;
    cutscene = { started: performance.now(), time: 0, mode: 'ending', launchCue: false, impactCue: false, rewardCue: false };
    document.body.classList.remove('playing');
    setOverlayVisible(false);
    canvas.focus({ preventScroll: true });
    scheduleCutsceneFrame();
  }

  function showEndingReward() {
    cutscene = null;
    const fullCampaign = (gameState.runStartLevel ?? 0) === 0;
    const recordText = fullCampaign
      ? (gameState.lastRunIsRecord ? 'НОВЫЙ РЕКОРД!' : `ЛУЧШЕЕ ВРЕМЯ ${formatTime(gameState.bestRunSeconds)}`)
      : 'ПОВТОРНЫЙ ЗАБЕГ';
    const summary = `ПОПАЛИ В БЛЮДО. ЗАБЕГ ${formatTime(gameState.runSeconds)} · ВРАГИ ${gameState.runKills} · ЛУЧШАЯ СЕРИЯ ${gameState.runPeakStreak || 0} · ${recordText}. Спасибо, что прошёл этот путь под альбом TOO HUNGRY.`;
    showOverlay('TOO HUNGRY', summary, 'НОВЫЙ ЗАБЕГ', restartCampaign);
    if (fullCampaign && runGradeBadge) {
      const grade = getChefGrade();
      runGradeBadge.dataset.rank = grade.rank;
      runGradeMark.textContent = grade.rank;
      runGradeTitle.textContent = grade.title;
      runGradeDetails.textContent = `СЕРИЯ ${gameState.runPeakStreak || 0} · УВОРОТЫ ${gameState.runDodges || 0}`;
      runGradeBadge.hidden = false;
    }
    if (albumButton) albumButton.hidden = false;
    const greeting = document.querySelector('#albumGreeting'); if (greeting) greeting.hidden = false;
    if (returnToTitleButton) { returnToTitleButton.hidden = false; returnToTitleButton.textContent = 'ВЫБРАТЬ УРОВЕНЬ'; returnToTitleButton.onclick = showTitle; }
    if (shareRunButton) shareRunButton.hidden = false;
  }

  async function shareRun() {
    const campaign = (gameState.runStartLevel ?? 0) === 0 ? 'ПОЛНАЯ КАМПАНИЯ' : 'ПОВТОРНЫЙ ЗАБЕГ';
    const rank = (gameState.runStartLevel ?? 0) === 0 ? ` · ранг: ${getChefGrade().rank}` : '';
    const shareUrl = location.protocol === 'https:' ? `${location.origin}${location.pathname}` : '';
    const summary = `TOO HUNGRY · ${campaign}${rank}\nЗабег: ${formatTime(gameState.runSeconds)} · враги: ${gameState.runKills} · серия: ${gameState.runPeakStreak || 0}.`;
    const message = `${summary}${shareUrl ? `\n\nСыграй тоже: ${shareUrl}` : ''}`;
    try {
      if (navigator.share) {
        await navigator.share({ title: 'TOO HUNGRY', text: summary, ...(shareUrl ? { url: shareUrl } : {}) });
      announce('Забег отправлен.');
        return;
      }
      throw new Error('Системная отправка недоступна.');
    } catch (error) {
      if (error?.name === 'AbortError') return;
    }
    try {
      await navigator.clipboard.writeText(message);
      announce('Карточка забега скопирована. Вставь её в чат.');
    } catch {
      window.prompt('Скопируй карточку забега и отправь её в чат:', message);
    }
  }

  shareRunButton?.addEventListener('click', shareRun);

  function restartCampaign() {
    // A new run resets the run, never the library of unlocked chapters.
    gameState.shards = 0;
    gameState.dash = false;
    gameState.whip = false;
    gameState.heavy = false;
    gameState.checkpoint = null;
    gameState.runSeconds = 0;
    gameState.runKills = 0;
    gameState.runDodges = 0;
    gameState.runPeakStreak = 0;
    gameState.runStartLevel = 0;
    gameState.currentLevel = 0;
    gameState.runFinished = false;
    gameState.lastRunIsRecord = false;
    saveProgress();
    playCutscene();
    startCutsceneWithSound();
  }

  function formatTime(seconds) {
    const safeSeconds = Math.max(0, Number(seconds) || 0);
    const minutes = Math.floor(safeSeconds / 60);
    const remainder = Math.floor(safeSeconds % 60);
    return `${minutes}:${String(remainder).padStart(2, '0')}`;
  }

  function getChefGrade() {
    const streak = gameState.runPeakStreak || 0;
    const dodges = gameState.runDodges || 0;
    if (streak >= 8) return { rank: 'S', title: 'XARIZMA19 · ЛЕГЕНДА' };
    if (streak >= 6) return { rank: 'A', title: 'ШЕФСКИЙ УРОВЕНЬ' };
    if (streak >= 3 || dodges >= 2) return { rank: 'B', title: 'СМЕНА ЗАКРЫТА' };
    return { rank: 'C', title: 'БЛЮДО СПАСЕНО' };
  }

  function drawCutscenePlate() {
    ctx.save();
    ctx.fillStyle = 'rgba(0,0,0,.45)'; ctx.beginPath(); ctx.ellipse(230, 445, 101, 10, 0, 0, Math.PI * 2); ctx.fill();
    if (art.platedSteak.complete && art.platedSteak.naturalWidth) {
      const width = 220, height = width * art.platedSteak.naturalHeight / art.platedSteak.naturalWidth;
      ctx.drawImage(art.platedSteak, 120, 446 - height, width, height);
    }
    if (!prefersReducedMotion) {
      const sceneTime = cutscene?.time ?? time;
      for (let i = 0; i < 3; i++) {
        const phase = (sceneTime * .43 + i * .32) % 1, x = 207 + i * 15 + Math.sin(phase * 4 + i) * 3;
        ctx.globalAlpha = Math.sin(phase * Math.PI) * .18; ctx.strokeStyle = '#fff0dc'; ctx.lineWidth = 1.2 + phase;
        ctx.beginPath(); ctx.moveTo(x, 373 - phase * 24); ctx.bezierCurveTo(x - 5, 365 - phase * 24, x + 7, 357 - phase * 24, x + 2, 349 - phase * 24); ctx.stroke();
      }
    }
    ctx.restore();
  }

  function drawSauceDrop(x, y, size, gold = false) {
    const gradient = ctx.createLinearGradient(x-size, y-size, x+size, y+size);
    gradient.addColorStop(0, gold ? '#fff0b3' : '#ff9b72'); gradient.addColorStop(0.45, gold ? '#ffc65b' : '#f33b32'); gradient.addColorStop(1, gold ? '#a95b24' : '#99131e');
    ctx.fillStyle = gradient; ctx.beginPath(); ctx.moveTo(x, y-size*1.55);
    ctx.bezierCurveTo(x+size*0.55, y-size*0.65, x+size, y-size*0.15, x+size*0.88, y+size*0.48);
    ctx.bezierCurveTo(x+size*0.72, y+size*1.25, x-size*0.75, y+size*1.25, x-size*0.9, y+size*0.48);
    ctx.bezierCurveTo(x-size, y-size*0.18, x-size*0.55, y-size*0.75, x, y-size*1.55); ctx.fill();
    ctx.fillStyle = '#fff4df'; ctx.beginPath(); ctx.ellipse(x-size*0.22, y-size*0.05, size*0.2, size*0.38, -0.35, 0, Math.PI*2); ctx.fill();
  }

  const physicalKeys = { KeyA:'a', KeyW:'w', KeyD:'d', KeyS:'s', KeyJ:'j', KeyZ:'z', KeyK:'k', KeyX:'x', KeyL:'l', KeyI:'i', KeyM:'m', KeyV:'v', KeyP:'p', Space:' ', Enter:'enter', Escape:'escape', ArrowUp:'arrowup', ArrowDown:'arrowdown', ArrowLeft:'arrowleft', ArrowRight:'arrowright' };
  const keyFromEvent = event => physicalKeys[event.code] || event.key.toLowerCase();
  let cutsceneClickGuard = null;
  // A new physical press is intentional; only the release-click from skipping is blocked.
  document.addEventListener('pointerdown', () => { cutsceneClickGuard = null; }, true);
  document.addEventListener('click', event => {
    const guard = cutsceneClickGuard;
    if (!guard || event.detail === 0) return;
    if (performance.now() > guard.until) { cutsceneClickGuard = null; return; }
    if (event.pointerId === guard.id || Math.hypot(event.clientX - guard.x, event.clientY - guard.y) < 6) {
      cutsceneClickGuard = null;
      event.preventDefault(); event.stopImmediatePropagation();
    }
  }, true);
  canvas.addEventListener('pointerdown', event => {
    if (!cutscene) return;
    event.preventDefault(); event.stopPropagation();
    canvas.setPointerCapture?.(event.pointerId);
    if (cutscene.awaitingStart) startCutsceneWithSound();
    else {
      cutsceneClickGuard = { id: event.pointerId, x: event.clientX, y: event.clientY, until: performance.now() + 600 };
      skipCutscene();
    }
  });
  const pauseButton = document.querySelector('#pauseButton');
  pauseButton.title = 'Пауза · P / З / Esc';
  pauseButton.addEventListener('click', pauseGame);
  window.addEventListener('keydown', event => {
    const key = keyFromEvent(event);
    const editingTarget = event.target instanceof Element && event.target.closest('input,select,textarea,[contenteditable="true"]');
    if (overlay.style.display === 'grid' && !editingTarget && !event.repeat && ['arrowup', 'arrowdown', 'arrowleft', 'arrowright', 'home', 'end'].includes(key)) {
      const focusable = [...overlay.querySelectorAll('a[href],button:not(:disabled)')].filter(element => !element.hidden && element.getClientRects().length > 0);
      if (focusable.length) {
        const currentIndex = focusable.indexOf(document.activeElement);
        const direction = ['arrowdown', 'arrowright'].includes(key) ? 1 : -1;
        let nextIndex;
        if (key === 'home') nextIndex = 0;
        else if (key === 'end') nextIndex = focusable.length - 1;
        else if (currentIndex < 0) nextIndex = direction > 0 ? 0 : focusable.length - 1;
        else nextIndex = (currentIndex + direction + focusable.length) % focusable.length;
        focusable[nextIndex].focus({ preventScroll: true });
      }
      event.preventDefault();
      return;
    }
    if (cutscene) {
      if (['escape', 'enter', ' '].includes(key)) {
        event.preventDefault();
        if (cutscene.awaitingStart) startCutsceneWithSound();
        else skipCutscene();
      }
      return;
    }
    if (running && (key === 'escape' || key === 'p')) { event.preventDefault(); pauseGame(); return; }
    const interactiveTarget = event.target instanceof Element ? event.target.closest('button,a[href],input,select,textarea,summary,[contenteditable="true"]') : null;
    if (interactiveTarget && (interactiveTarget.matches('input,select,textarea,[contenteditable="true"]') || ['enter', ' '].includes(key))) return;
    if (['arrowup', 'arrowdown', 'arrowleft', 'arrowright', ' '].includes(key)) event.preventDefault();
    if (key === 'm' && !event.repeat) toggleMusic();
    if ((key === 'j' || key === 'z') && !event.repeat) attack();
    if (key === 'k' || key === 'x') dash();
    if (key === 'l') whip();
    if (key === 'i') heavyPunch();
    if (key === 'v' && !event.repeat) kick();
    if (key === ' ' && !event.repeat) jump();
    if (!running && overlay.style.display !== 'grid' && key === 'enter') {
      event.preventDefault();
      startButton.click();
    }
    keys.add(key);
  });
  window.addEventListener('keyup', event => keys.delete(keyFromEvent(event)));

  document.querySelectorAll('[data-hold]').forEach(button => {
    const direction = button.dataset.hold;
    const down = event => { event.preventDefault(); button.setPointerCapture?.(event.pointerId); touch[direction] = true; };
    const up = event => { event.preventDefault(); touch[direction] = false; };
    button.addEventListener('pointerdown', down);
    button.addEventListener('pointerup', up);
    button.addEventListener('pointercancel', up);
    button.addEventListener('lostpointercapture', up);
  });

  document.querySelectorAll('[data-press]').forEach(button => {
    const release = event => {
      event.preventDefault?.();
      const timer = touchAttackTimers.get(button);
      if (timer) window.clearInterval(timer);
      touchAttackTimers.delete(button);
    };
    button.addEventListener('pointerdown', event => {
      event.preventDefault();
      const action = button.dataset.press;
      if (action === 'attack') {
        button.setPointerCapture?.(event.pointerId);
        attack();
        touchAttackTimers.set(button, window.setInterval(attack, 110));
      }
      if (action === 'dash') dash();
      if (action === 'jump') jump();
      if (action === 'whip') whip();
      if (action === 'heavy') heavyPunch();
      if (action === 'kick') kick();
    });
    button.addEventListener('pointerup', release);
    button.addEventListener('pointercancel', release);
    button.addEventListener('lostpointercapture', release);
  });

  function attack() {
    if (!running || player.attackCooldown > 0) return;
    const nextCombo = player.comboTime > 0 ? player.combo % 3 + 1 : 1;
    player.attackCombo = nextCombo;
    player.attack = 0.27;
    player.attackPose = 'punch';
    player.attackDuration = 0.27;
    player.attackCooldown = 0.38;
    const connected = hitTargets(nextCombo === 3 ? 102 : 82, nextCombo === 3 ? 32 : 19, nextCombo === 3 ? 54 : 42);
    if (connected) {
      player.combo = nextCombo;
      player.comboTime = 1;
      if (nextCombo === 3) player.finisher = prefersReducedMotion ? 0.14 : 0.24;
    }
    burst(player.x + player.face * 45, player.y - 42, sauceRushTime > 0 || nextCombo === 3 ? '#ffbd68' : '#ff6558', nextCombo === 3 || sauceRushTime > 0 ? 18 : 7);
    sound(nextCombo === 3 ? 'heavy' : 'attack');
    haptic(connected && nextCombo === 3 ? 'heavy' : connected && nextCombo === 2 ? 'medium' : 'light');
  }

  function jump() {
    if (!running) return;
    player.jumpBuffer = 0.12;
    launchBufferedJump();
  }

  function launchBufferedJump() {
    if (!player || player.jumpBuffer <= 0 || (player.z !== 0 && player.coyoteTime <= 0)) return;
    player.jumpBuffer = 0;
    player.coyoteTime = 0;
    player.vz = -455;
    burst(player.x, player.y, '#ff554a', 5);
    sound('jump');
    haptic('soft');
  }

  function dash() {}

  function whip() {
    if (!running || !chapterAbilities().special || player.whipCooldown > 0) return;
    player.whipCooldown = 1.05;
    player.attack = 0.34;
    player.attackPose = 'whip';
    player.attackDuration = 0.34;
    const upgraded = chapterAbilities().upgraded;
    hitTargets(upgraded ? 225 : 186, upgraded ? 68 : 38, 54);
    toast = chapterAbilities().specialName; toastTime = .55;
    for (let i = 0; i < 8; i++) burst(player.x + player.face * (36 + i * 13), player.y - 42 + Math.sin(i) * 9, '#ff7867', 1);
    sound('whip');
  }

  function heavyPunch() {}

  function hitTargets(range, damage, depth) {
    let enemyHit = false;
    let enemyDeathType = -1;
    let counterHit = false;
    const hitDamage = Math.round(damage * (counterTime > 0 ? 1.55 : 1) * (sauceRushTime > 0 ? 1.2 : 1));
    for (const enemy of enemies) {
      if (enemy.alive && Math.abs(enemy.x - player.x) < range && (enemy.x - player.x) * player.face > -12 && Math.abs(enemy.y - player.y) < depth) {
        const result = hurtEnemy(enemy, hitDamage);
        if (result) spawnDamageNumber(enemy.x, enemy.y - 120, result.damage, result.blocked, counterTime > 0);
        enemyHit = true;
        if (!enemy.alive) enemyDeathType = ['garlic', 'tomato', 'mozzarella', 'pepper'].indexOf(enemy.type);
        counterHit = true;
      }
    }
    if (boss?.alive && bossIntro <= 0 && Math.abs(boss.x - player.x) < range + 18 && (boss.x - player.x) * player.face > -18 && Math.abs(boss.y - player.y) < depth + 15 && boss.stun <= 0) {
      const armor = boss.state === 'recover' ? 1.25 : boss.state === 'attack' ? .35 : boss.state === 'tell' ? .55 : .8;
      const dealt = Math.max(1, Math.round(hitDamage * armor));
      boss.hp -= dealt;
      dropBossHealing();
      spawnDamageNumber(boss.x, boss.y - 154, dealt, armor < 1, counterTime > 0, true);
      counterHit = true;
      boss.stun = 0.10;
      burst(boss.x - 25, boss.y - 60, counterTime > 0 ? '#fff0ad' : '#ffca73', counterTime > 0 ? 18 : 10);
      shake = Math.max(shake, 5);
      if (boss.hp <= 0) winBoss();
      sound('bossHit');
    }
    if (enemyHit) sound(enemyDeathType >= 0 ? 'enemyDefeat' : 'enemyHit', enemyDeathType);
    if (counterHit) hitStop = Math.max(hitStop, damage >= 40 ? 0.065 : 0.035);
    if (counterHit && counterTime > 0) {
      counterTime = 0;
      toast = 'КОНТРАТАКА · ×1.55';
      toastTime = 0.9;
      sound('counter');
      haptic('medium');
    }
    return counterHit;
  }

  function hurtEnemy(enemy, damage) {
    if (!enemy.alive) return null;
    const blocked = enemy.type === 'garlic' && enemy.guarding > 0;
    const finisherHit = !blocked && player.attackPose === 'punch' && player.attackCombo === 3;
    if (blocked) {
      damage = Math.max(4, Math.round(damage * 0.22));
      burst(enemy.x + enemy.face * 28, enemy.y - 45, '#f4d6a3', 5);
      sound('guard');
    }
    enemy.hp -= damage;
    enemy.hit = 0.22;
    enemy.knockback = Math.sign(enemy.x - player.x || player.face) * Math.min(enemy.miniBoss ? 60 : 190, damage * (blocked ? 2 : 3) / (1 + levelIndex * .18));
    if (enemy.elite && !enemy.enraged && enemy.hp > 0 && enemy.hp <= enemy.maxHp * 0.45) {
      enemy.enraged = true;
      enemy.attackCooldown = Math.min(enemy.attackCooldown, 0.28);
      burst(enemy.x, enemy.y - 46, '#ffc35d', 14);
      toast = 'ЭЛИТА · В ЯРОСТИ';
      toastTime = 1.4;
      announce('Элитный противник вошёл в ярость и атакует быстрее.');
      sound('enemyRush');
      haptic('medium');
    }
    const defeatColors = { garlic: '#efd4a0', tomato: '#fa624c', mozzarella: '#fff0ce', pepper: '#a9cb77' };
    burst(enemy.x, enemy.y - 26, finisherHit ? '#ffcf78' : enemy.elite ? '#ffd17b' : defeatColors[enemy.type], finisherHit ? enemy.hp <= 0 ? 24 : 15 : enemy.hp <= 0 ? enemy.elite ? 20 : 12 : 8);
    if (finisherHit) shake = Math.max(shake, 4.2);
    if (enemy.hp <= 0) {
      enemy.alive = false;
      if (enemy.miniBoss) {
        finaleMiniDefeated = true; fightGate = 0;
        drops.push({type:'medkit',x:enemy.x-60,y:enemy.y-24,life:60,amount:Math.ceil(player.maxHp*.3)});
        toast='ПЕРЕЦ-ПОДЖИГАТЕЛЬ ПОБЕЖДЁН · ДАЛЬШЕ БУРГЕР'; toastTime=2.5;
        saveReturnCheckpoint(); saveProgress(); return {damage,blocked};
      }
      enemiesDefeated++;
      waveKills++;
      gameState.runKills = (gameState.runKills || 0) + 1;
      streakKills = streakTime > 0 ? streakKills + 1 : 1;
      streakTime = 5.2;
      gameState.runPeakStreak = Math.max(gameState.runPeakStreak || 0, streakKills);
      if (streakKills === 5 || streakKills === 10 || streakKills === 19) {
        const rushDuration = streakKills === 19 ? 8 : 5.5;
        sauceRushTime = Math.max(sauceRushTime, rushDuration);
        sauceRushMaxTime = Math.max(sauceRushMaxTime, sauceRushTime);
        burst(player.x, player.y - 58, '#ffc76c', streakKills === 19 ? 25 : 18);
        sound('pickup');
        haptic('medium');
      }
      if (streakKills === 2 || streakKills === 5 || streakKills === 10 || streakKills === 19) {
        const calls = { 2: 'ДВОЙНАЯ ПОДАЧА', 5: 'SAUCE RUSH · УРОН +20%', 10: 'SAUCE RUSH ПРОДЛЁН · КУХНЯ В ШОКЕ', 19: 'XARIZMA19 · ЛЕГЕНДА МЕНЮ · RUSH MAX' };
        toast = calls[streakKills];
        toastTime = 1.5;
      }
      const lastEnemyBeforeBoss = !levels[levelIndex].finale && enemiesDefeated >= totalEnemies;
      const waveCleared = !enemies.some(other => other.alive) && waveQueue.length === 0;
      const guaranteedMedkit = enemiesDefeated === 2 || waveCleared || lastEnemyBeforeBoss || (levelIndex > 0 && enemiesDefeated % Math.max(2, 5 - levelIndex) === 0);
      if (enemy.elite || (enemiesDefeated % 4 === 0 && !guaranteedMedkit)) drops.push({ x: clamp(enemy.x + (guaranteedMedkit ? (enemy.x < player.x ? -34 : 34) : 0), 42, worldWidth - 42), y: enemy.y - 24, life: 24, amount: enemy.elite ? 34 + levelIndex * 8 : 22 + levelIndex * 10, elite: enemy.elite });
      if (guaranteedMedkit) {
        drops.push({ type: 'medkit', fullRestore: lastEnemyBeforeBoss, x: enemy.x, y: enemy.y - 32, life: lastEnemyBeforeBoss ? 60 : 30, amount: lastEnemyBeforeBoss ? player.maxHp : Math.ceil(player.maxHp * Math.min(0.62, 0.32 + levelIndex * 0.07)), elite: false });
        if (lastEnemyBeforeBoss) {
          toast = 'ПОСЛЕДНЯЯ ХИЛКА · ПЕРЕД БОССОМ';
          toastTime = 2.2;
          announce('Последняя хилка перед боссом. Подбери её, чтобы полностью восстановить здоровье.');
        } else {
          toast = 'ХИЛКА ВЫПАЛА · ПОДБЕРИ';
          toastTime = 1.5;
          announce('Выпала хилка. Подбери её, чтобы восстановить здоровье.');
        }
        sound('pickup');
      }
      const secretRecipe = gameState.runKills >= 19 && !gameState.secretSeen;
      if (secretRecipe) {
        gameState.secretSeen = true;
        const previousHp = player.hp;
        player.maxHp = Math.max(player.maxHp, 119);
        const restored = Math.min(19, player.maxHp - previousHp);
        player.hp = previousHp + restored;
        player.hpTrail = Math.max(player.hpTrail, player.hp);
        if (gameState.checkpoint?.stageIndex === levelIndex) gameState.checkpoint = { ...gameState.checkpoint, hp: player.hp, kills: enemiesDefeated };
        saveProgress();
        if (restored > 0) spawnDamageNumber(player.x, player.y - 124, restored, false, false, false, true, true);
        burst(enemy.x, enemy.y - 36, '#ffd17c', 22);
        toast = 'XARIZMA19 · МАКС. HP +19';
        toastTime = 2.3;
        sound('pickup');
      announce(`Секретный рецепт XARIZMA19. Максимум здоровья увеличен до ${player.maxHp}. Восстановлено ${restored} здоровья.`);
      } else if (!enemies.some(other => other.alive)) {
        const lastWave = waveIndex + 1 >= levels[levelIndex].waves;
        toast = lastWave ? lastEnemyBeforeBoss ? 'ХИЛКА ПОЛНОГО HP · ЗАБЕРИ ПЕРЕД БОССОМ' : 'ПУТЬ К БОССУ ОТКРЫТ' : `ВОЛНА ${waveIndex + 1} ЗАЧИЩЕНА · ДВИГАЙСЯ ДАЛЬШЕ`;
        toastTime = 1.8;
      announce(lastWave ? lastEnemyBeforeBoss ? 'Все волны зачищены. Перед боссом выпала полная хилка. Подбери её, чтобы восстановить здоровье.' : 'Все волны зачищены. Путь к боссу открыт.' : `Волна ${waveIndex + 1} зачищена. Двигайся дальше.`);
      } else if (enemiesDefeated % 8 === 0) {
        const quips = ['СЕКРЕТНЫЙ ИНГРЕДИЕНТ: ДЕРЗОСТЬ', 'ПОВАР НЕ ВИДЕЛ ЭТОГО', 'ЗАПИШЕМ В КУХОННЫЕ РАСХОДЫ'];
        toast = quips[Math.floor(Math.random() * quips.length)];
        toastTime = 1.2;
      }
    }
    if (!enemy.alive) saveReturnCheckpoint();
    return { damage, blocked };
  }

  function spawnDamageNumber(x, y, damage, blocked = false, counter = false, isBoss = false, isPlayer = false, heal = false) {
    damageNumbers.push({ x, y, damage, blocked, counter, isBoss, isPlayer, heal, life: 0.78, maxLife: 0.78 });
  }

  function update(dt) {
    const gamepad = updateGamepadControls();
    if (!running) return;
    time += dt;
    stageIntroTime = Math.max(0, stageIntroTime - dt);
    damageNumbers = damageNumbers.filter(item => (item.life -= dt) > 0);
    gameState.runSeconds = (gameState.runSeconds || 0) + dt;
    saveTimer += dt;
    if (saveTimer >= 5) {
      saveTimer = 0;
      saveReturnCheckpoint();
      saveProgress();
    }
    player.attack = Math.max(0, player.attack - dt);
    player.finisher = Math.max(0, player.finisher - dt);
    const healthChase = player.hp < player.hpTrail ? 2.8 : 7.5;
    player.hpTrail += (player.hp - player.hpTrail) * Math.min(1, healthChase * dt);
    player.landingFx = Math.max(0, player.landingFx - dt);
    player.attackCooldown = Math.max(0, player.attackCooldown - dt);
    if (keys.has('j') || keys.has('z')) attack();
    if (!running) return;
    player.dashCooldown = Math.max(0, player.dashCooldown - dt);
    player.whipCooldown = Math.max(0, player.whipCooldown - dt);
    player.heavyCooldown = Math.max(0, player.heavyCooldown - dt);
    player.kickCooldown = Math.max(0, player.kickCooldown - dt);
    player.invuln = Math.max(0, player.invuln - dt);
    player.jumpBuffer = Math.max(0, player.jumpBuffer - dt);
    if (player.z === 0 && player.vz === 0) player.coyoteTime = 0.1;
    else player.coyoteTime = Math.max(0, player.coyoteTime - dt);
    launchBufferedJump();
    perfectDodgeTime = Math.max(0, perfectDodgeTime - dt);
    counterTime = Math.max(0, counterTime - dt);
    sauceRushTime = Math.max(0, sauceRushTime - dt);
    if (sauceRushTime <= 0) sauceRushMaxTime = 0;
    if (player.invuln <= 0 && player.dash <= 0) player.dodgeReady = false;
    player.hurt = Math.max(0, player.hurt - dt);
    player.slowTime = Math.max(0, (player.slowTime || 0) - dt);
    player.comboTime = Math.max(0, player.comboTime - dt);
    streakTime = Math.max(0, streakTime - dt);
    if (streakTime <= 0) streakKills = 0;
    if (!levels[levelIndex].finale) updateWaves();
    if (toastTime > 0) toastTime -= dt;
    if (shake > 0) shake = Math.max(0, shake - 25 * dt);

    const movementStartX = player.x, movementStartY = player.y;
    const left = keys.has('a') || keys.has('arrowleft') || touch.left || gamepad.left;
    const right = keys.has('d') || keys.has('arrowright') || touch.right || gamepad.right;
    const up = keys.has('w') || keys.has('arrowup') || touch.up || gamepad.up;
    const down = keys.has('s') || keys.has('arrowdown') || touch.down || gamepad.down;
    const walking = left !== right || up !== down;
    playerMoving = walking;
    player.stepCooldown = Math.max(0, player.stepCooldown - dt);
    if (player.dash > 0) player.dash = Math.max(0, player.dash - dt);
    else {
      if (left !== right) {
        player.x += (right ? 1 : -1) * 222 * dt * (player.slowTime > 0 ? .62 : 1);
        player.face = right ? 1 : -1;
      }
      if (up !== down && !(levels[levelIndex].finale && !bossSpawned)) player.y += (down ? 1 : -1) * 128 * dt * (player.slowTime > 0 ? .62 : 1);
      if (levels[levelIndex].finale && !bossSpawned) player.y = 452;
    }
    const livingEnemies = enemies.some(enemy => enemy.alive);
    const maxX = boss?.alive ? boss.x - 48 : livingEnemies && fightGate > 0 ? fightGate : worldWidth - 42;
    player.x = clamp(player.x, 42, maxX);
    player.y = clamp(player.y, 382, 477);
    const stepped = advanceGait(player, player.z === 0 ? player.x - movementStartX : 0, player.z === 0 ? player.y - movementStartY : 0, dt, 'hero');
    player.walk = player.gaitPhase || 0;
    playerMoving = Math.hypot(player.x - movementStartX,player.y - movementStartY) > .015;
    if (stepped && player.z === 0 && player.stepCooldown <= 0) {
      sound('step');player.stepCooldown=.1;
      if(!prefersReducedMotion)dashStains.push({x:player.x-player.face*9,y:player.y+1,life:1.8,maxLife:1.8,size:2.5+Math.random()*1.5});
    }
    cameraX = clamp(player.x - W * 0.38, 0, Math.max(0, worldWidth - W));

    if (player.z < 0 || player.vz < 0) {
      player.z += player.vz * dt;
      player.vz += 1050 * dt;
      if (player.z > 0) {
        player.z = 0;
        player.vz = 0;
        player.landingFx = 0.34;
        burst(player.x, player.y, '#d9674e', 9);
        sound('land');
      }
    }

    for (const enemy of enemies) updateEnemy(enemy, dt);
    if (boss?.alive) {
      updateBoss(dt);
      const hpChase = boss.hp < boss.hpTrail ? 2.8 : 7.5;
      boss.hpTrail += (boss.hp - boss.hpTrail) * Math.min(1, hpChase * dt);
    }
    if (levels[levelIndex].finale) updateFinale(dt);
    updateHazards(dt);
    updateDrops(dt);
    if (player.hp <= 0) loseLevel();
  }

  function updateGamepadControls() {
    const gamepad = connectedStandardGamepad();
    if (!gamepad) {
      gamepadId = null;
      gamepadPressed.clear();
      return { left: false, right: false, up: false, down: false };
    }
    if (gamepadId !== gamepad.id) {
      gamepadId = gamepad.id;
      gamepadPressed.clear();
    }
    const currentButtons = new Set(gamepad.buttons.map((button, index) => button.pressed ? index : -1).filter(index => index >= 0));
    const justPressed = index => currentButtons.has(index) && !gamepadPressed.has(index);
    if (justPressed(9)) {
      gamepadPressed = currentButtons;
      pauseGame();
      return { left: false, right: false, up: false, down: false };
    }
    if (justPressed(0)) jump();
    if (currentButtons.has(1)) attack();
    if (justPressed(2)) dash();
    if (justPressed(3)) heavyPunch();
    if (justPressed(4)) whip();
    if (justPressed(5)) kick();
    gamepadPressed = currentButtons;
    const horizontal = gamepad.axes[0] || 0;
    const vertical = gamepad.axes[1] || 0;
    const button = index => Boolean(gamepad.buttons[index]?.pressed);
    return {
      left: horizontal < -0.35 || button(14),
      right: horizontal > 0.35 || button(15),
      up: vertical < -0.35 || button(12),
      down: vertical > 0.35 || button(13)
    };
  }

  function updateWaves() {
    const stage = levels[levelIndex];
    if (waveIndex < 0) {
      spawnWave(0);
      return;
    }
    if (enemies.some(enemy => enemy.alive)) {
      if (waveQueue.length && waveKills >= waveReinforcementAt) spawnWaveBatch(4, true);
      return;
    }
    if (waveQueue.length) {
      spawnWaveBatch(4, true);
      return;
    }
    if (waveIndex + 1 < stage.waves) {
      if (player.x >= fightGate - 105) spawnWave(waveIndex + 1);
      return;
    }
    if (!bossSpawned && player.x >= worldWidth - W * 0.86) {
      const maxHp = bossHealth(levelIndex);
      const savedBoss = gameState.checkpoint?.stageIndex === levelIndex && gameState.checkpoint?.boss ? gameState.checkpoint : null;
      const hp = Math.min(maxHp, savedBoss?.bossHp ?? maxHp);
      boss = { healMask: savedBoss?.bossHealMask || 0, healCollected: savedBoss?.bossHealMask || 0, x: worldWidth - 205, y: 414, hp, hpTrail: hp, maxHp, alive: true, state: 'idle', timer: 1.25, stun: 0, phase: hp / maxHp > 0.55 ? 1 : hp / maxHp > 0.24 ? 2 : 3, phaseFlash: 0, attack: 1, lastAttack: 0, chainRemaining: 0, hitDone: false };
      bossSpawned = true;
      bossIntro = 2.35;
      gameState.checkpoint = { stageIndex: levelIndex, waveIndex: stage.waves, boss: true, bossHp: hp, bossHealMask: boss.healCollected, playerX: player.x, hp: player.hp, kills: enemiesDefeated };
      saveProgress();
      fightGate = worldWidth - 110;
      toast = `${stage.boss} ВЫХОДИТ НА АРЕНУ`;
      toastTime = 2.2;
      announce(`${stage.boss} выходит на арену. ${stage.bossLine || ''}`.trim());
      sound('bossAttack');
      haptic('heavy');
    }
  }

  function spawnWave(index) {
    waveIndex = index;
    wavesCleared = index;
    const amount = Math.floor((5 + levelIndex) / levels[levelIndex].waves) + (index < (5 + levelIndex) % levels[levelIndex].waves ? 1 : 0);
    const start = Math.max(540 + index * 1050, nextWaveAt - 160);
    const end = Math.min(worldWidth - 570, start + 760);
    fightGate = end + 110;
    nextWaveAt = fightGate + 660;
    const kitchenMixes = [
      ['garlic', 'tomato', 'garlic', 'pepper', 'tomato', 'mozzarella', 'garlic', 'tomato'],
      ['tomato', 'mozzarella', 'pepper', 'tomato', 'mozzarella', 'garlic', 'pepper', 'mozzarella'],
      ['garlic', 'mozzarella', 'garlic', 'pepper', 'mozzarella', 'tomato', 'garlic', 'mozzarella'],
      ['pepper', 'tomato', 'mozzarella', 'pepper', 'garlic', 'mozzarella', 'tomato', 'pepper']
    ];
    const mix = kitchenMixes[levelIndex] || kitchenMixes[0];
    const eliteCount = index < 1 || levelIndex === 0 ? 0 : 1 + (levelIndex >= 2 && index >= 5 ? 1 : 0) + (levelIndex >= 3 && index >= 7 ? 1 : 0);
    waveQueue = [];
    waveKills = 0;
    for (let i = 0; i < amount; i++) {
      const x = start + 65 + (end - start - 90) * (i / Math.max(1, amount - 1)) + Math.random() * 50;
      const elite = i >= amount - eliteCount;
      waveQueue.push({ x, type: mix[(i + index * 2) % mix.length], elite });
    }
    spawnWaveBatch(Math.min(6, waveQueue.length), false);
    toast = `ВОЛНА ${index + 1} / ${levels[levelIndex].waves} · ${amount} ПРОТИВНИКОВ`;
    toastTime = 2.1;
    announce(`Волна ${index + 1} из ${levels[levelIndex].waves}. Противников: ${amount}.`);
    gameState.checkpoint = { stageIndex: levelIndex, waveIndex: index, playerX: player.x, hp: player.hp, kills: enemiesDefeated };
    saveProgress();
    sound('waveSpawn');
    if (index > 0) haptic('medium');
  }

  function spawnWaveBatch(count, reinforcement) {
    const batch = waveQueue.splice(0, count);
    for (const entry of batch) enemies.push(makeEnemy(entry.x, entry.type, entry.elite));
    waveReinforcementAt = waveQueue.length ? waveKills + 3 : Infinity;
    if (reinforcement && batch.length) {
      toast = waveQueue.length ? `ПОДКРЕПЛЕНИЕ · ЕЩЁ ${waveQueue.length} НА ПОДХОДЕ` : 'ПОСЛЕДНИЕ ПРОТИВНИКИ · ЗАКРОЙ СМЕНУ';
      toastTime = 1.35;
      sound('enemyRush');
      haptic('light');
      announce(waveQueue.length ? `Подкрепление. Ещё ${waveQueue.length} противников на подходе.` : 'Последнее подкрепление на арене.');
    }
  }

  function saveReturnCheckpoint() {
    if (!running || !player || player.hp <= 0) return;
    const checkpoint = gameState.checkpoint;
    if (!checkpoint || checkpoint.stageIndex !== levelIndex) return;
    if (levels[levelIndex].finale) {
      gameState.checkpoint = { ...checkpoint, playerX: player.x, hp: player.hp, obstacles: finaleObstacles.filter(item => item.cleared).length, miniDefeated: finaleMiniDefeated, miniHp: enemies.find(e=>e.miniBoss&&e.alive)?.hp || finaleMiniSavedHp, ...(boss?.alive ? { bossHp: Math.max(1, boss.hp), bossHealMask: boss.healCollected || 0 } : {}) };
    } else if (boss?.alive) {
      gameState.checkpoint = { ...checkpoint, boss: true, bossHp: boss.hp, bossHealMask: boss.healCollected || 0, playerX: player.x, hp: player.hp, kills: enemiesDefeated };
    } else {
      gameState.checkpoint = { ...checkpoint, boss: false, playerX: player.x, hp: player.hp };
    }
    gameState.checkpoint.playerY = player.y;
    gameState.checkpoint.pickups = drops.filter(drop => drop.life > 0 && !drop.bossHealBit).slice(0, 16).map(drop => ({ type: drop.type === 'medkit' ? 'medkit' : 'sauce', x: drop.x, y: drop.y, amount: drop.amount, life: drop.life, elite: !!drop.elite, fullRestore: !!drop.fullRestore }));
    if (!levels[levelIndex].finale && !boss?.alive && waveIndex >= 0) {
      gameState.checkpoint.waveIndex = waveIndex;
      gameState.checkpoint.kills = enemiesDefeated;
      gameState.checkpoint.waveState = {
        v: 1, gate: fightGate, nextAt: nextWaveAt, waveKills,
        enemies: enemies.filter(enemy => enemy.alive).map(enemy => ({ type: enemy.type, x: clamp(enemy.x, 42, worldWidth - 42), y: enemy.y, hp: enemy.hp, elite: !!enemy.elite, enraged: !!enemy.enraged, face: enemy.face })),
        queue: waveQueue.map(entry => ({ ...entry }))
      };
    } else delete gameState.checkpoint.waveState;
    saveProgress();
  }

  function resumeGame() {
    if (!paused || !player || player.hp <= 0) return;
    resetGameInput(); stopMenuGamepadNavigation();
    const pad = connectedStandardGamepad(); gamepadId = pad?.id || null;
    gamepadPressed = new Set(pad?.buttons.map((button, i) => button.pressed ? i : -1).filter(i => i >= 0) || []);
    paused = false; running = true;
    setOverlayVisible(false); document.body.classList.add('playing');
    telegramApp?.BackButton?.show?.(); canvas.focus({ preventScroll: true });
    if (musicEnabled && music.src) music.play().catch(() => {});
    lastTime = performance.now(); scheduleGameFrame();
  }

  function pauseGame() {
    if (!running) return;
    resetGameInput(); saveReturnCheckpoint(); music.pause();
    showOverlay('ПАУЗА', 'Бой остановлен. Продолжишь с того же места. Контрольная точка сохранена отдельно.', 'ПРОДОЛЖИТЬ', resumeGame);
    paused = true;
    if (returnToTitleButton) {
      returnToTitleButton.hidden = false; returnToTitleButton.textContent = 'ВЫБРАТЬ УРОВЕНЬ';
      returnToTitleButton.onclick = showTitle;
    }
  }

  window.addEventListener('blur', () => { pauseGame(); pauseCutscene(); });
  window.addEventListener('focus', resumeCutscene);
  document.addEventListener('visibilitychange', () => {
    if (document.visibilityState === 'hidden') {
      if (running) pauseGame();
      else pauseCutscene();
      return;
    }
    resumeCutscene();
  });
  window.addEventListener('pagehide', () => { saveReturnCheckpoint(); pauseCutscene(); });
  window.addEventListener('pageshow', resumeCutscene);

  function updateEnemy(enemy, dt) {
    if (!enemy.alive) return;
    const gaitStartX = enemy.x, gaitStartY = enemy.y;
    enemy.spawn = Math.max(0, enemy.spawn - dt);
    enemy.hit = Math.max(0, enemy.hit - dt);
    const hpChase = enemy.hp < enemy.hpTrail ? 2.8 : 7.5;
    enemy.hpTrail += (enemy.hp - enemy.hpTrail) * Math.min(1, hpChase * dt);
    enemy.swing += dt * (2.6 + Math.min(1, Math.abs(enemy.vx) / 120) * 10);
    enemy.attackCooldown -= dt * (enemy.elite && enemy.enraged ? 1.35 : 1);
    if (enemy.type === 'garlic') {
      if (enemy.guarding > 0) enemy.guarding = Math.max(0, enemy.guarding - dt);
      else {
        enemy.guardCooldown -= dt;
        if (enemy.guardCooldown <= 0) {
          enemy.guarding = 0.9;
          enemy.guardCooldown = 3.4;
          sound('guard');
        }
      }
    }
    const dx = player.x - enemy.x;
    const distance = Math.abs(dx);
    const depth = Math.abs(enemy.y - player.y);
    enemy.face = Math.sign(dx) || enemy.face;
    if (enemy.state === 'stunned') {
      enemy.stateTime -= dt;
      enemy.vx *= Math.pow(0.06, dt);
      if (enemy.stateTime <= 0) enemy.state = 'idle';
    } else if (enemy.state === 'tell') {
      enemy.stateTime -= dt;
      enemy.vx = 0;
      if (enemy.stateTime <= 0) {
        enemy.state = 'attack';
        enemy.stateTime = 0.28;
        if (enemy.miniBoss) performMiniAttack(enemy);
        if (enemy.type === 'tomato' && distance > 115) {
          const flight = 0.7;
          hazards.push({ type: 'tomato', x: enemy.x, y: enemy.y - 76, startX: enemy.x, startY: enemy.y - 76, targetX: player.x, targetY: player.y - 8, flight, elapsed: 0, damage: (levelIndex === 0 ? 8 : 11 + levelIndex * 2) + (enemy.elite ? 4 : 0), life: flight + 0.5, landed: false, hit: false });
          sound('tomatoThrow');
        } else if (distance < 96 && depth < 50 && player.z > -36 && canBeHit()) {
          damagePlayer((enemy.type === 'mozzarella' ? 14 + levelIndex*4 : 10 + levelIndex*3) + (enemy.elite ? 3 : 0), enemy.x);
          const impactSound = { garlic: 'garlicStab', tomato: 'tomatoBump', mozzarella: 'heavy', pepper: 'pepperRush' }[enemy.type];
          sound(impactSound || 'enemyRush');
        }
      }
    } else if (enemy.state === 'attack') {
      enemy.stateTime -= dt;
      if (enemy.stateTime <= 0) enemy.state = 'idle';
    }
    if (enemy.state === 'idle') {
      if (distance < 520 && depth > 8) enemy.y = clamp(enemy.y + Math.sign(player.y-enemy.y) * Math.min(depth-8,(30+levelIndex*9)*dt),382,477);
      enemy.timer -= dt;
      if (enemy.timer <= 0 && distance < 560) {
        const speed = (enemy.type === 'pepper' ? 150 : enemy.type === 'mozzarella' ? 68 : 94) * (0.98 + levelIndex * 0.04);
        enemy.vx = Math.sign(dx) * speed * (enemy.elite ? enemy.enraged ? 1.34 : 1.12 : 1);
        enemy.timer = enemy.type === 'pepper' ? 0.22 : 0.3;
      }
      if (enemy.attackCooldown <= 0 && depth < 64 && ((enemy.type === 'tomato' && distance < 390 && distance > 100) || distance < 76)) {
        enemy.state = 'tell';
        sound('enemyTell');
        const tell = (enemy.type === 'pepper' ? 0.3 : enemy.type === 'mozzarella' ? 0.72 : 0.52) + (levelIndex === 0 ? 0.18 : 0);
        enemy.stateTime = tell * (enemy.elite ? enemy.enraged ? 0.64 : 0.82 : 1);
        const cooldown = enemy.type === 'tomato' ? 2.8 : enemy.type === 'pepper' ? 1.8 : 2.25;
        enemy.attackCooldown = cooldown * (1-levelIndex*.09) * (enemy.elite ? enemy.enraged ? 0.68 : 0.86 : 1);
      }
    }
    enemy.x += enemy.vx * dt;
    enemy.vx *= Math.pow(enemy.type === 'pepper' ? 0.25 : 0.07, dt);
    if (Math.abs(enemy.knockback) > 0.5) {
      enemy.x = clamp(enemy.x + enemy.knockback * dt, 42, worldWidth - 42);
      enemy.knockback *= Math.pow(0.018, dt);
    } else enemy.knockback = 0;
    advanceGait(enemy, enemy.state === 'idle' ? enemy.x-gaitStartX : 0, enemy.state === 'idle' ? enemy.y-gaitStartY : 0, dt, enemy.type);
    if (distance < 38 && depth < 32 && canBeHit() && enemy.state === 'idle') damagePlayer(levelIndex === 0 ? 3 : 5, enemy.x);
  }

  function updateBoss(dt) {
    dropBossHealing();
    if (bossIntro > 0) { bossIntro = Math.max(0, bossIntro - dt); return; }
    const nextPhase = boss.hp <= boss.maxHp * 0.24 ? 3 : boss.hp <= boss.maxHp * 0.55 ? 2 : 1;
    if (nextPhase > boss.phase) {
      boss.phase = nextPhase;
      boss.phaseFlash = 0.82;
      announce(`${levels[levelIndex].boss}: фаза ${nextPhase}. Атаки стали быстрее.`);
      shake = Math.max(shake, 12);
      toast = `ФАЗА 0${nextPhase} · ${nextPhase === 3 ? 'БОСС В ЯРОСТИ' : 'БОСС УСКОРЯЕТСЯ'}`;
      toastTime = 1.8;
      sound('bossEnrage');
      haptic('heavy');
    }
    boss.phaseFlash = Math.max(0, boss.phaseFlash - dt);
    boss.sweepFlash = Math.max(0,(boss.sweepFlash||0)-dt);
    boss.timer -= dt * (1 + levelIndex * .10);
    boss.stun = Math.max(0, boss.stun - dt);
    if (boss.state === 'idle' && boss.timer <= 0) {
      boss.chainRemaining = boss.phase === 3 ? (levelIndex >= 3 ? 2 : 1) : boss.phase === 2 && levelIndex >= 2 ? 1 : 0;
      warnBossAttack((boss.phase === 1 ? 1.05 : boss.phase === 2 ? 0.72 : 0.48) + (levelIndex === 0 ? 0.24 : 0), false, boss.chainRemaining > 0);
    } else if (boss.state === 'tell' && boss.timer <= 0) {
      boss.state = 'attack';
      boss.attackDuration = boss.phase === 3 ? 0.64 : 0.52;
      boss.timer = boss.attackDuration;
      performBossAttack();
    } else if (boss.state === 'attack' && boss.timer <= 0) {
      if (boss.chainRemaining > 0) {
        boss.chainRemaining -= 1;
        warnBossAttack(0.42, true);
        toast = `ФИНАЛ СВЯЗКИ · ${bossWarning()}`;
      } else {
        boss.state = 'recover';
        boss.timer = (boss.phase === 1 ? 1.35 : boss.phase === 2 ? 0.86 : 0.62) + (levelIndex === 0 ? 0.24 : 0);
      }
    } else if (boss.state === 'recover' && boss.timer <= 0) {
      boss.state = 'idle';
        boss.timer = (boss.phase === 1 ? 1.12 : boss.phase === 2 ? 0.72 : 0.5) + (levelIndex === 0 ? 0.2 : 0);
    }
  }

  function warnBossAttack(delay, avoidPrevious, comboStart = false) {
    boss.state = 'tell';
    boss.attack = 1 + Math.floor(Math.random() * 3);
    if (avoidPrevious && boss.attack === boss.lastAttack) boss.attack = boss.attack % 3 + 1;
    if (boss.attack === boss.lastAttack) boss.attack = boss.attack % 3 + 1;
    boss.lastAttack = boss.attack;
    boss.timer = delay;
    boss.hitDone = false;
    boss.aimX = player.x; boss.aimY = player.y;
    if (Math.abs(player.x-boss.x)<180) { toast = 'ЗАМАХ · ПРЫГАЙ ИЛИ ОТОЙДИ'; toastTime = delay; }
    toast = `${bossWarning()}${comboStart ? ' · СВЯЗКА' : ''}`;
    toastTime = delay;
    const dodgeHint = 'Следи за ингредиентами. Прыгай через низкие снаряды, уходи с линии нити и с места падения.';
    announce(`${bossWarning()}. ${dodgeHint}${comboStart ? ' После него сразу последует второй приём.' : ''}`);
    sound('bossTell');
  }

  function bossWarning() {
    const names = ['КОПЬЯ ИЗ КАРТОШКИ', 'ДОЖДЬ ФРИТЮРА', 'ГОРЯЧЕЕ МАСЛО', 'СЫРНАЯ НИТЬ', 'ПИЦЦА-БУМЕРАНГ', 'ВЕЕР ПЕППЕРОНИ', 'НАГГЕТ-МЕТЕОР', 'ВОЛНА КРОШЕК', 'ХРУСТЯЩАЯ КАРТЕЧЬ', 'ЩУПАЛЬЦЕ ПАСТЫ', 'ЗАЛП ФРИКАДЕЛЕК', 'ЛОВУШКА ИЗ ЛАПШИ', 'КОТЛЕТНЫЙ ОБВАЛ', 'ПЛАМЯ ГРИЛЯ', 'ОГУРЕЧНЫЙ БУМЕРАНГ'];
    const index = (levelIndex * 3) + boss.attack - 1;
    return names[index] || 'БЕРЕГИСЬ';
  }

  function dropBossHealing() {
    if (!boss?.alive) return;
    [.67, .34].forEach((threshold, index) => {
      const bit = 1 << index;
      if (boss.hp > boss.maxHp * threshold || (boss.healMask || 0) & bit) return;
      boss.healMask = (boss.healMask || 0) | bit;
      const targetX = clamp(player.x - 90 - index * 28, 42, worldWidth - 42);
      drops.push({ type: 'medkit', bossHealBit: bit, x: boss.x - 30, y: boss.y - 80, fromX: boss.x - 30, fromY: boss.y - 80, targetX, targetY: player.y - 24, emerge: .6, life: 120, amount: Math.ceil(player.maxHp * .35), elite: false });
      toast = 'БОСС ВЫРОНИЛ ХИЛКУ · +35% HP'; toastTime = 2;
      burst(boss.x - 30, boss.y - 80, '#a7e6b1', 16); sound('pickup');
      announce('Босс выронил лечение. Восстанавливает 35 процентов максимального здоровья.');
    });
  }

  function bossWeapon(kind, motion, targetX, targetY, damage, options = {}) {
    const startX = boss.x - 18, startY = boss.y;
    const h = { bossWeapon: true, type: kind, motion, startX, startY, targetX: clamp(targetX, 42, worldWidth - 42), targetY: clamp(targetY, 382, 477), x: startX, y: startY, height: -42, age: 0, duration: .85, delay: 0, linger: 0, radius: 23, depth: 30, jumpClear: 54, hit: false, damage: Math.round(damage * (1 + levelIndex * .19)), seed: Math.random() * 10, ...options };
    h.life = h.duration + h.delay + h.linger;
    hazards.push(h); return h;
  }

  function performBossAttack() {
    sound('bossAttack');
    // The same windup also commits a close-range sweep: face-tanking is unsafe.
    boss.sweepFlash = .35;
    if (Math.abs(player.x-boss.x)<155 && Math.abs(player.y-boss.y)<65 && player.z>-65 && canBeHit()) damagePlayer(18+levelIndex*5,boss.x);
    const key = levels[levelIndex].key;
    if (key === 'pizzaSlice' || key === 'spaghettiMonster') sound(boss.attack === 1 ? 'whip' : 'tomatoThrow');
    if (key === 'nuggetBrute') sound('heavy');
    if (key === 'fryKing') sound('pepperRush');
    const x = boss.aimX ?? player.x, y = boss.aimY ?? player.y;
    const frenzy = boss.phase === 3;
    if (key === 'fryKing') {
      if (boss.attack === 1) {
        [-1, 0, 1].forEach((lane, i) => bossWeapon('fry', 'line', x - 180, y + lane * 27, 13, { duration: .8, delay: i * .11, startY: boss.y + lane * 27, radius: 19 }));
      } else if (boss.attack === 2) {
        for (let i = 0; i < (frenzy ? 7 : 5); i++) bossWeapon('fry', 'fall', x + (i - (frenzy ? 3 : 2)) * 62, y + Math.sin(i * 2) * 26, 12, { duration: .64, delay: i * .13, linger: .18 });
      } else [-1, 0, 1].forEach((offset, i) => bossWeapon('oil', 'arc', x + offset * 90, y, 11, { duration: .85, delay: i * .12, linger: 1.4, radius: 34, jumpClear: 48 }));
    } else if (key === 'pizzaSlice') {
      if (boss.attack === 1) bossWeapon('cheeseThread', 'beam', boss.x - 340, y, 19, { duration: .65, delay: .16, radius: 12, depth: 23, jumpClear: 45 });
      else if (boss.attack === 2) bossWeapon('pizza', 'boomerang', x - 170, y, 16, { duration: 1.85, radius: 33, jumpClear: 64 });
      else [-1, 0, 1].forEach((offset, i) => bossWeapon('pizza', 'line', x - 200, y + offset * 54, 12, { duration: 1.12, delay: i * .13, startY: boss.y + offset * 10, radius: 25 }));
    } else if (key === 'nuggetBrute') {
      if (boss.attack === 1) {
        bossWeapon('nugget', 'fall', x, y, 24, { duration: .68, radius: 45, depth: 35, linger: .35, jumpClear: 65 });
        [-1, 1].forEach(direction => bossWeapon('crack', 'line', x + direction * 260, y, 12, { startX: x, startY: y, duration: .9, delay: .68, height: 0, radius: 30, jumpClear: 35 }));
      } else if (boss.attack === 2) {
        [0, .2, .4].forEach(delay => bossWeapon('crack', 'line', boss.x - 540, boss.y, 14, { duration: 1.45, delay, height: 0, radius: 31, depth: 35, jumpClear: 35 }));
      } else [-2, -1, 0, 1, 2].forEach((offset, i) => bossWeapon('crumb', 'line', x - 190, y + offset * 33, 10, { duration: .9, delay: i * .06, radius: 15, startY: boss.y + offset * 9 }));
    } else if (key === 'spaghettiMonster') {
      if (boss.attack === 1) bossWeapon('tentacle', 'beam', boss.x - 380, y, 18, { duration: .8, depth: 24, jumpClear: 60, slow: .65 });
      else if (boss.attack === 2) [-1, 0, 1].forEach((offset, i) => bossWeapon('meatball', 'arc', x + offset * 95, y, 15, { duration: 1.05, delay: i * .18, linger: .25, radius: 27 }));
      else [-1, 0, 1].forEach((offset, i) => bossWeapon('noodleTrap', 'rise', x + offset * 92, y, 12, { duration: .7, delay: i * .16, linger: 1, radius: 24, jumpClear: 95, slow: .85 }));
    } else if (key === 'burger') {
      if (boss.attack === 1) [-1, 0, 1].forEach((offset, i) => bossWeapon('patty', 'fall', x + offset * 96, y, 19, { duration: .78, delay: i * .24, radius: 38, linger: .24, jumpClear: 65 }));
      else if (boss.attack === 2) [0, .3].forEach(delay => bossWeapon('flame', 'line', boss.x - 590, boss.y, 16, { duration: 1.4, delay, radius: 40, depth: 30, jumpClear: 70 }));
      else [-1, 1].forEach((offset, i) => bossWeapon('pickle', 'boomerang', x - 180, y + offset * 32, 13, { duration: 1.9, delay: i * .28, radius: 25, jumpClear: 60 }));
    }
  }

  function updateBossWeapon(h, dt) {
    h.age += dt; h.life -= dt;
    const p = clamp((h.age - h.delay) / h.duration, 0, 1);
    h.progress = p;
    const flight = h.motion === 'boomerang' ? Math.sin(p * Math.PI) : p;
    if (h.motion === 'beam') {
      h.x = h.targetX; h.y = h.targetY; h.height = -48;
    } else if (h.motion === 'fall' || h.motion === 'rise') {
      h.x = h.targetX; h.y = h.targetY;
      h.height = h.motion === 'fall' ? -260 * Math.pow(1 - p, 1.7) : -Math.sin(p * Math.PI / 2) * 48;
    } else {
      h.x = h.startX + (h.targetX - h.startX) * flight;
      h.y = h.startY + (h.targetY - h.startY) * flight;
      h.height = h.motion === 'arc' ? -Math.sin(p * Math.PI) * 155 : h.type === 'crack' ? 0 : -42;
    }
    const before = h.age < h.delay;
    const landed = p >= 1 && h.motion !== 'beam';
    if (landed && !h.impact) {
      h.impact = true;
      if (h.motion === 'fall' || h.motion === 'arc') {
        burst(h.x, h.y - 8, h.type === 'oil' ? '#ffad45' : '#e7a55b', h.type === 'nugget' ? 22 : 9);
        if (h.type === 'nugget' || h.type === 'patty') { shake = Math.max(shake, 6); sound('heavy'); }
      }
    }
    const requiresLanding = h.type === 'oil' || h.type === 'meatball' || h.type === 'nugget' || h.type === 'patty';
    const active = !before && (requiresLanding ? landed : h.type === 'noodleTrap' ? p > .55 : h.height > -85);
    const beamEnd = h.startX + (h.targetX - h.startX) * clamp(p / .2, 0, 1);
    const inX = h.motion === 'beam' ? player.x >= Math.min(h.startX, beamEnd) - 12 && player.x <= Math.max(h.startX, beamEnd) + 12 : Math.abs(player.x - h.x) < h.radius;
    const hitLane = h.motion === 'beam' ? h.startY + (h.targetY - h.startY) * clamp((player.x - h.startX) / (beamEnd - h.startX || 1), 0, 1) : h.y;
    if (!h.hit && active && inX && Math.abs(player.y - hitLane) < h.depth && player.z > -h.jumpClear && canBeHit()) {
      h.hit = true; const hpBefore = player.hp; damagePlayer(h.damage, h.x);
      if (h.slow && player.hp < hpBefore) { player.slowTime = h.slow; toast = 'ПАСТА ПРИЛИПЛА · ВЫРЫВАЙСЯ'; toastTime = .8; }
    }
  }


  function canBeHit() { return player.invuln <= 0 || player.dodgeReady; }

  function damagePlayer(damage, sourceX) {
    if (player.invuln > 0) {
      if (player.dodgeReady) {
        player.dodgeReady = false;
        perfectDodgeTime = 0.72;
        counterTime = 1.25;
        gameState.runDodges = (gameState.runDodges || 0) + 1;
        toast = 'ИДЕАЛЬНЫЙ УВОРОТ';
        toastTime = 1.05;
      announce('Идеальный уворот. Следующая атака усилена для контратаки.');
        burst(player.x, player.y - 58, '#fff0ad', 14);
        sound('dodge');
        haptic('light');
        saveProgress();
      }
      return;
    }
    player.dodgeReady = false;
    const previousHp = player.hp;
    player.hp -= damage;
    const remainingHp = `${Math.max(0, Math.ceil(player.hp))} из ${player.maxHp}`;
    if (previousHp > player.maxHp * 0.25 && player.hp <= player.maxHp * 0.25) announce(`Критическое здоровье капли — четверть или меньше: ${remainingHp}.`);
    else if (previousHp > player.maxHp * 0.5 && player.hp <= player.maxHp * 0.5) announce(`Осталась половина здоровья капли или меньше: ${remainingHp}.`);
    else if (previousHp > player.maxHp * 0.75 && player.hp <= player.maxHp * 0.75) announce(`Осталось не больше трёх четвертей здоровья капли: ${remainingHp}.`);
    spawnDamageNumber(player.x, player.y - 124, damage, false, false, false, true);
    streakKills = 0;
    streakTime = 0;
    player.combo = 0;
    player.comboTime = 0;
    player.invuln = 0.72;
    player.hurt = 0.36;
    player.x = clamp(player.x + Math.sign(player.x - sourceX || -1) * 28, 42, worldWidth - 42);
    shake = Math.max(shake, 7);
    toast = `КАПЛЯ · −${damage}`;
    toastTime = 0.75;
    sound('damage');
    haptic('heavy');
  }

  function updateHazards(dt) {
    for (const hazard of hazards) {
      if (hazard.bossWeapon) { updateBossWeapon(hazard, dt); continue; }
      if (hazard.type === 'tomato' && !hazard.landed) {
        hazard.elapsed += dt;
        const progress = Math.min(1, hazard.elapsed / hazard.flight);
        hazard.x = hazard.startX + (hazard.targetX - hazard.startX) * progress;
        hazard.y = hazard.startY + (hazard.targetY - hazard.startY) * progress - Math.sin(progress * Math.PI) * 105;
        if (progress >= 1) {
          hazard.landed = true;
          hazard.life = 0.58;
          hazard.y = hazard.targetY;
        }
        continue;
      }
      hazard.life -= dt;
      if (!hazard.hit && hazard.life < 0.62 && Math.abs(player.x - hazard.x) < 29 && Math.abs(player.y - hazard.y) < 33 && player.z > -45 && canBeHit()) {
        hazard.hit = true;
        damagePlayer(hazard.damage, hazard.x);
      }
    }
    hazards = hazards.filter(hazard => hazard.life > 0);
    for (const particle of particles) {
      particle.life -= dt;
      particle.x += particle.vx * dt;
      particle.y += particle.vy * dt;
      particle.vy += 350 * dt;
      particle.rotation += particle.spin * dt;
    }
    particles = particles.filter(particle => particle.life > 0);
    for (const stain of dashStains) stain.life -= dt;
    dashStains = dashStains.filter(stain => stain.life > 0);
  }

  function updateDrops(dt) {
    for (const drop of drops) {
      drop.life -= dt;
      if (drop.emerge > 0) {
        drop.emerge = Math.max(0, drop.emerge - dt);
        const t = 1 - drop.emerge / .6;
        drop.x = drop.fromX + (drop.targetX - drop.fromX) * t;
        drop.y = drop.fromY + (drop.targetY - drop.fromY) * t - Math.sin(t * Math.PI) * 75;
        continue;
      }
      const pullX = player.x - drop.x;
      const pullY = player.y - 24 - drop.y;
      const distance = Math.hypot(pullX, pullY);
      const magnetRange = drop.fullRestore ? 700 : drop.type === 'medkit' ? 235 : 180;
      drop.magnetized = player.hp < player.maxHp && distance < magnetRange && Math.abs(pullY) < (drop.fullRestore ? 170 : 105);
      if (drop.magnetized && distance > 0.01) {
        const speed = 300 + (magnetRange - Math.min(distance, magnetRange)) * 0.55;
        const step = Math.min(distance, speed * dt);
        drop.x += pullX / distance * step;
        drop.y += pullY / distance * step;
      }
      if (player.hp < player.maxHp && Math.abs(player.x - drop.x) < 32 && Math.abs(player.y - drop.y) < 50) {
        const restored = Math.min(drop.amount, player.maxHp - player.hp);
        player.hp += restored;
        if (restored > 0) spawnDamageNumber(player.x, player.y - 124, restored, false, false, false, true, true);
        drop.life = 0;
        if (drop.bossHealBit && boss?.alive) {
          boss.healCollected = (boss.healCollected || 0) | drop.bossHealBit;
          saveReturnCheckpoint();
        }
        burst(drop.x, drop.y, drop.elite ? '#ffd17b' : '#ff5348', drop.elite ? 14 : 9);
        const medkit = drop.type === 'medkit';
        toast = restored > 0 ? `${medkit ? 'ХИЛКА' : 'СОУС'} +${restored}${player.hp >= player.maxHp ? ' · HP ПОЛНО' : ''}` : 'ЗДОРОВЬЕ ПОЛНО';
        toastTime = medkit ? 1.5 : 0.8;
        announce(restored > 0 ? `Подобрана ${medkit ? 'хилка' : 'порция соуса'}. Восстановлено ${restored} здоровья${player.hp >= player.maxHp ? ', здоровье полностью восстановлено' : ''}.` : 'Здоровье уже полное.');
        if (restored > 0) sound('pickup');
      }
    }
    drops = drops.filter(drop => drop.life > 0);
  }

  function kick() {
    if (!running || !chapterAbilities().kick || player.kickCooldown > 0) return;
    player.kickCooldown = 0.72;
    player.attackPose = 'kick';
    player.attack = 0.32;
    player.attackDuration = 0.32;
    player.combo = 0; player.comboTime = 0;
    const connected = hitTargets(118, levelIndex >= 2 ? 52 : 42, 48);
    if (connected) { player.finisher = prefersReducedMotion ? 0.12 : 0.2; shake = Math.max(shake, 4); }
    burst(player.x + player.face * 52, player.y - 20, '#ffbd68', connected ? 13 : 6);
    toast = connected ? 'УДАР НОГОЙ!' : 'УДАР НОГОЙ'; toastTime = 0.55;
    sound('kick'); haptic(connected ? 'medium' : 'light');
  }

  function performMiniAttack(enemy) {
    enemy.vx = 0;
    for(let i=0;i<2;i++) hazards.push({bossWeapon:true,type:'flame',motion:'line',startX:enemy.x-18,startY:452,targetX:Math.max(42,player.x-200),targetY:452,x:enemy.x-18,y:452,height:-42,age:0,duration:1.05,delay:i*.32,linger:0,radius:30,depth:46,jumpClear:58,hit:false,damage:23,seed:i,life:1.05+i*.32});
    toast='ПЕРЕЦ · ДВОЙНАЯ ОГНЕННАЯ ВОЛНА';toastTime=1.2;sound('bossAttack');
  }

  function updateFinaleDangers(dt) {
    if (bossSpawned) return;
    for(const o of finaleObstacles) {
      o.timer-=dt;
      if(o.timer<=0){
        if(o.state==='low'){o.state='warn';o.timer=.85;if(Math.abs(player.x-o.x)<260){sound('bossTell');toast='ПЛИТА РАСКАЛЯЕТСЯ · ОТОЙДИ';toastTime=.85;}}
        else if(o.state==='warn'){o.state='surge';o.timer=1.05;sound('heavy');}
        else {o.state='low';o.timer=1.7+Math.random()*1.6;}
      }
      // A tall flare is unsafe even at the apex of a jump. Wait for it to subside.
      if(o.state==='surge' && Math.abs(player.x-o.x)<62 && player.z>-175 && canBeHit()) damagePlayer(29,o.x);
    }
    for(const barrier of finaleBarriers){
      barrier.cycle=(barrier.cycle+dt)%4.2;
      if(barrier.type==='steam' && barrier.cycle>=1.1 && barrier.cycle<2.45 && Math.abs(player.x-barrier.x)<43 && player.z>-190 && canBeHit()) damagePlayer(26,barrier.x);
      if(barrier.type==='skewer' && Math.abs(player.x-barrier.x)<38 && player.z>-64 && canBeHit()) damagePlayer(21,barrier.x);
    }
  }

  function drawSurgeFlame(x,y,width,height) {
    ctx.save();ctx.translate(x,y);
    const glow=ctx.createRadialGradient(0,-height*.35,4,0,-height*.35,height*.8);
    glow.addColorStop(0,'#ff9b353f');glow.addColorStop(1,'#ff4c0000');ctx.fillStyle=glow;ctx.fillRect(-width,-height*1.4,width*2,height*1.6);
    for(let i=0;i<7;i++){
      const sway=Math.sin(time*13+i*2.1)*width*.045;
      const fx=(i-3)*width*.12,h=height*(.65+.25*Math.sin(i*2+time*9));
      const g=ctx.createLinearGradient(fx,0,fx,-h);g.addColorStop(0,'#fff1a5');g.addColorStop(.35,'#ffb436');g.addColorStop(1,'#ef3e16aa');ctx.fillStyle=g;
      ctx.beginPath();ctx.moveTo(fx-width*.14,0);ctx.bezierCurveTo(fx-width*.2,-h*.4,fx+sway+width*.13,-h*.55,fx+sway,-h);ctx.bezierCurveTo(fx+sway+width*.02,-h*.5,fx+width*.23,-h*.25,fx+width*.14,0);ctx.closePath();ctx.fill();
    }ctx.restore();
  }

  function drawFinaleBarriers(){
    for(const b of finaleBarriers){
      ctx.save();ctx.translate(b.x,459);
      if(b.type==='skewer'){
        ctx.fillStyle='#0006';ctx.beginPath();ctx.ellipse(0,1,47,9,0,0,Math.PI*2);ctx.fill();
        ctx.strokeStyle='#6a3631';ctx.lineWidth=9;ctx.lineCap='round';ctx.beginPath();ctx.moveTo(-36,-12);ctx.lineTo(35,-12);ctx.stroke();
        const metal=ctx.createLinearGradient(-8,0,8,0);metal.addColorStop(0,'#5a4542');metal.addColorStop(.5,'#e1c6a0');metal.addColorStop(1,'#614037');ctx.fillStyle=metal;
        for(let i=-1;i<=1;i++){ctx.beginPath();ctx.moveTo(i*25-5,-12);ctx.lineTo(i*25,-64);ctx.lineTo(i*25+5,-12);ctx.closePath();ctx.fill();}
        text('ПРЫЖОК',0,-83,8,'#ffd3a0','center',900);
      } else {
        ctx.strokeStyle='#765346';ctx.lineWidth=8;ctx.beginPath();ctx.moveTo(-29,0);ctx.lineTo(29,0);ctx.stroke();
        ctx.strokeStyle='#e7b77f';ctx.lineWidth=3;for(let i=-2;i<=2;i++){ctx.beginPath();ctx.moveTo(i*10,-5);ctx.lineTo(i*10+4,4);ctx.stroke();}
        if(b.cycle<1.1){text('ПАР · СТОП',0,-85,10,'#ffe0a5','center',900);}
        if(b.cycle>=1.1 && b.cycle<2.45){
          for(let i=0;i<11;i++){const t=(time*1.3+i/11)%1;ctx.globalAlpha=(1-t)*.6;ctx.fillStyle=i%2?'#fff2d5':'#d4c5b5';ctx.beginPath();ctx.ellipse(Math.sin(i*3+time)*12*(1+t),-15-t*170,12+t*20,15+t*25,0,0,Math.PI*2);ctx.fill();}ctx.globalAlpha=1;
        }
      }ctx.restore();
    }
  }

  function updateFinale(dt) {
    updateFinaleDangers(dt);
    for (const obstacle of finaleObstacles) {
      if (!obstacle.cleared && player.x >= obstacle.x - 8) {
        obstacle.cleared = true;
        if (player.z > -54) {
          damagePlayer(24, obstacle.x);
          player.x = Math.max(42, player.x - 48);
          toast = 'ПРЫГАЙ ЧЕРЕЗ ОГНЕННЫЕ ПЛИТЫ';
          toastTime = 1.2;
        } else {
          sound('pickup');
          burst(obstacle.x, player.y - 28, '#ffbe67', 10);
        }
        gameState.checkpoint = { stageIndex: levelIndex, finale: true, playerX: player.x, hp: player.hp, obstacles: finaleObstacles.filter(item => item.cleared).length, miniDefeated: finaleMiniDefeated, miniHp: enemies.find(e=>e.miniBoss&&e.alive)?.hp || finaleMiniSavedHp, kills: 0 };
        saveProgress();
      }
    }
    if (!finaleMiniSpawned && player.x > 3070) {
      const mini=makeEnemy(3290,'pepper',true);
      Object.assign(mini,{miniBoss:true,y:452,hp:finaleMiniSavedHp,hpTrail:finaleMiniSavedHp,maxHp:900,attackCooldown:1.5,timer:.2});
      enemies.push(mini); finaleMiniSpawned=true; fightGate=3330;
      toast='ПЕРЕЦ-ПОДЖИГАТЕЛЬ · СТРАЖ ГРИЛЯ';toastTime=2.5; sound('bossTell');
    }
    if (!bossSpawned && finaleMiniDefeated && player.x > 3470) {
      const saved = gameState.checkpoint;
      const hp = Math.min(bossHealth(4), saved?.bossHp ?? bossHealth(4));
      boss = { healMask: saved?.bossHealMask || 0, healCollected: saved?.bossHealMask || 0, x: 3760, y: 425, hp, hpTrail: hp, maxHp: bossHealth(4), alive: true, state: 'idle', timer: 1.25, stun: 0, phase: hp / bossHealth(4) > .55 ? 1 : hp / bossHealth(4) > .24 ? 2 : 3, phaseFlash: 0, attack: 1, lastAttack: 0, chainRemaining: 0, hitDone: false };
      bossSpawned = true; bossIntro = 2.35;
      toast = 'BURGER TOO HUNGRY · ПОСЛЕДНИЙ БОСС'; toastTime = 2.35;
      announce(toast); sound('bossAttack');
      gameState.checkpoint = { stageIndex: levelIndex, finale: true, playerX: player.x, hp: player.hp, obstacles: finaleObstacles.filter(item => item.cleared).length, miniDefeated: finaleMiniDefeated, miniHp: enemies.find(e=>e.miniBoss&&e.alive)?.hp || finaleMiniSavedHp, kills: 0, bossHp: hp, bossHealMask: boss.healCollected };
      saveProgress();
    }
  }

  function winBoss() {
    if (!boss?.alive) return;
    if (levels[levelIndex].finale) {
      boss.alive = false; boss.state = 'defeated';
      burst(boss.x, boss.y - 100, '#ffca69', 42);
      finishGame(); return;
    }
    stopGameLoop();
    boss.state = 'defeated';
    gameState.shards = Math.max(gameState.shards, levelIndex + 1);
    gameState.dash = false; gameState.heavy = false;
    gameState.maxLevel = Math.max(gameState.maxLevel, levelIndex + 1);
    gameState.currentLevel = Math.min(levelIndex + 1, levels.length - 1);
    gameState.checkpoint = null;
    saveProgress();
    burst(boss.x, boss.y - 85, '#ffca69', 30);
    sound('victory');
    const stage = levels[levelIndex];
    preloadStageArt(Math.min(levelIndex + 1, levels.length - 1));
    const abilityGuides = [
      'Теперь доступен удар ногой. ПК: V · телефон: «НОГА» · геймпад: RB.',
      'Тот же удар ногой стал сильнее. Новая кнопка не нужна.',
      'Рука вытягивается вперёд. ПК: L · телефон: «ХЛЫСТ» · геймпад: LB.',
      'Огненный кулак заменяет хлыст: больше дальность и урон. Та же кнопка L / LB.'
    ];
    const abilityText = stage.ability ? ` НОВАЯ СПОСОБНОСТЬ: ${stage.ability}! ${abilityGuides[levelIndex]}` : '';
    pendingBossVictory = { stage, abilityText };
    toast = '';
    enemies = [];
    hazards = [];
    dashStains = [];
    running = false;
    telegramApp?.BackButton?.hide?.();
    document.body.classList.remove('playing');
    const started = performance.now();
    cutscene = { started, lastFrame: started, time: 0, mode: 'bossVictory', shardCue: false };
    prepareCutsceneGamepad();
    scheduleCutsceneFrame();
  }

  function finishBossVictory() {
    if (!pendingBossVictory) return;
    const { stage, abilityText } = pendingBossVictory;
    pendingBossVictory = null;
    cutscene = null;
    music.pause();
    music.volume = MUSIC_MAX_VOLUME * gameState.musicVolume / 100;
    if (boss) boss.alive = false;
    if (stage.ability) sound('abilityUnlock');
    showOverlay(`${stage.shard} ПОЛУЧЕН`, `Ты одолел ${stage.boss}. ${stage.victoryLine}${abilityText} Музыка этого этапа — трек ${String(stage.track).padStart(2, '0')}.`, 'СЛЕДУЮЩИЙ ЭТАП', () => startLevel(levelIndex + 1));
  }

  function loseLevel() {
    music.pause();
    sound('playerDown');
    const canResume = gameState.checkpoint?.stageIndex === levelIndex;
    if (canResume && boss?.alive) {
      gameState.checkpoint = { ...gameState.checkpoint, ...(levels[levelIndex].finale ? {} : { boss: true }), bossHp: Math.max(1, boss.hp), bossHealMask: boss.healCollected || 0, playerX: player.x };
      saveProgress();
    }
    showOverlay('КАПЛЯ РАСТЕКЛАСЬ', canResume ? 'Выбери, как продолжить: вернуться к последней контрольной точке или начать забег с первой кухни. Новый забег сбросит осколки и способности.' : 'Выбери, как продолжить: повторить этот этап или начать забег с первой кухни. Новый забег сбросит осколки и способности.', canResume ? 'С КОНТРОЛЬНОЙ ТОЧКИ' : 'ПОВТОРИТЬ ЭТАП', () => startLevel(levelIndex, canResume));
    if (returnToTitleButton) {
      returnToTitleButton.hidden = false;
      returnToTitleButton.textContent = 'ВЫБРАТЬ УРОВЕНЬ';
      returnToTitleButton.onclick = showTitle;
    }
  }

  function finishGame() {
    gameState.maxLevel = levels.length - 1;
    gameState.checkpoint = null;
    const fullCampaign = (gameState.runStartLevel ?? 0) === 0;
    gameState.lastRunIsRecord = fullCampaign && (gameState.bestRunSeconds == null || gameState.runSeconds < gameState.bestRunSeconds);
    if (fullCampaign) gameState.bestRunSeconds = gameState.bestRunSeconds == null ? gameState.runSeconds : Math.min(gameState.bestRunSeconds, gameState.runSeconds);
    gameState.runFinished = true;
    saveProgress();
    music.pause();
    sound('victory');
    playEnding();
  }

  function burst(x, y, color, count) {
    const red = Number.parseInt(color.slice(1, 3), 16) || 0;
    const green = Number.parseInt(color.slice(3, 5), 16) || 0;
    const blue = Number.parseInt(color.slice(5, 7), 16) || 0;
    const sauce = red > green * 1.35 && red > blue * 1.35;
    const gold = red > 190 && green > 125 && blue < 155;
    const amount = prefersReducedMotion ? Math.max(2, Math.ceil(count * 0.35)) : count;
    for (let i = 0; i < amount; i++) {
      const shape = gold ? (i % 3 === 0 ? 'shard' : 'spark') : sauce ? (i % 3 === 0 ? 'drop' : 'spark') : (i % 4 === 0 ? 'shard' : 'spark');
      const motionScale = prefersReducedMotion ? 0.55 : 1;
      particles.push({
        x, y,
        vx: (Math.random() - 0.5) * 210 * motionScale,
        vy: -Math.random() * 190 * motionScale,
        life: (0.24 + Math.random() * 0.42) * motionScale,
        color,
        size: (3 + Math.random() * (gold ? 6 : 5)) * (prefersReducedMotion ? 0.8 : 1),
        shape,
        rotation: Math.random() * Math.PI * 2,
        spin: (Math.random() - 0.5) * (gold ? 8 : 5) * motionScale
      });
    }
  }

  function clamp(value, min, max) { return Math.max(min, Math.min(max, value)); }
  function rounded(x, y, width, height, radius, color) {
    ctx.fillStyle = color;
    ctx.beginPath();
    ctx.roundRect(x, y, width, height, radius);
    ctx.fill();
  }
  function text(value, x, y, size, color, align = 'left', weight = 700) {
    ctx.font = `${weight} ${size}px Inter, system-ui, sans-serif`;
    ctx.fillStyle = color;
    ctx.textAlign = align;
    ctx.fillText(value, x, y);
  }

  function draw() {
    ctx.save();
    if (shake > 0 && !prefersReducedMotion) ctx.translate((Math.random() - 0.5) * shake, (Math.random() - 0.5) * shake);
    const background = art.backgrounds[levelIndex];
    if (background?.complete && background.naturalWidth) {
      const parallaxX = -(cameraX * 0.18 % W);
      ctx.drawImage(background, parallaxX, 0, W, H);
      ctx.drawImage(background, parallaxX + W, 0, W, H);
      const grade = ctx.createLinearGradient(0, 0, 0, H);
      grade.addColorStop(0, '#09080d39');
      grade.addColorStop(0.55, '#09080d08');
      grade.addColorStop(1, '#08060942');
      ctx.fillStyle = grade;
      ctx.fillRect(0, 0, W, H);
    } else {
      ctx.fillStyle = '#151214';
      ctx.fillRect(0, 0, W, H);
    }
    drawStageDetails();
    ctx.save();
    ctx.translate(-cameraX, 0);
    drawFloor();
    drawDashStains();
    if (levels[levelIndex].finale) drawFinaleObstacles();
    for (const hazard of hazards) drawHazard(hazard);
    for (const drop of drops) drawDrop(drop);
    // Feet determine arena depth, including while the hero jumps.
    const actors = enemies.filter(enemy => enemy.alive).map(enemy => ({ y: enemy.y, draw: () => drawEnemy(enemy) }));
    if (boss?.alive) actors.push({ y: boss.y, draw: drawBoss });
    actors.push({ y: player.y, draw: drawPlayer });
    actors.sort((a, b) => a.y - b.y).forEach(actor => actor.draw());
    if(boss?.alive && (boss.state==='tell' || boss.sweepFlash>0)) {
      ctx.save();ctx.globalAlpha=boss.sweepFlash>0?.85:.45;ctx.strokeStyle=boss.sweepFlash>0?'#fff1c2':'#ffad5c';ctx.lineWidth=boss.sweepFlash>0?12:4;
      ctx.beginPath();ctx.ellipse(boss.x-45,boss.y-30,102,45,-.15,Math.PI*.5,Math.PI*1.5);ctx.stroke();ctx.restore();
    }
    drawParticles();
    drawDamageNumbers();
    ctx.restore();
    if (player.hp < 35) {
      const danger = clamp((35 - player.hp) / 35, 0, 1);
      const pulse = prefersReducedMotion ? 1 : 0.84 + Math.sin(time * 4.5) * 0.16;
      const vignette = ctx.createRadialGradient(W / 2, H / 2, 120, W / 2, H / 2, 650);
      vignette.addColorStop(0, '#b4151d00');
      vignette.addColorStop(1, `rgba(180, 21, 29, ${0.34 * danger * pulse})`);
      ctx.fillStyle = vignette;
      ctx.fillRect(0, 0, W, H);
    }
    drawHud();
    if (stageIntroTime > 0) drawChapterIntro(levels[levelIndex]);
    if (toastTime > 0) drawToast();
    drawStreak();
    if (boss?.phaseFlash > 0 && !prefersReducedMotion) {
      const flash = boss.phaseFlash / 0.82;
      ctx.fillStyle = `rgba(239,53,45,${0.09 * flash})`;
      ctx.fillRect(0, 0, W, H);
      ctx.strokeStyle = `rgba(255,190,126,${0.72 * flash})`;
      ctx.lineWidth = 2;
      ctx.strokeRect(10, 10, W - 20, H - 20);
    }
    ctx.restore();
  }

  function drawChapterIntro(stage) {
    const elapsed = 2.8 - stageIntroTime;
    const fadeIn = prefersReducedMotion ? 1 : clamp(elapsed / 0.28, 0, 1);
    const fadeOut = prefersReducedMotion ? 1 : clamp(stageIntroTime / 0.52, 0, 1);
    const alpha = Math.min(fadeIn, fadeOut);
    const slide = prefersReducedMotion ? 0 : (1 - fadeIn) * 14;
    const cardWidth = 470;
    const cardX = (W - cardWidth) / 2;
    const cardY = 102 + slide;
    ctx.save();
    ctx.globalAlpha = alpha;
    rounded(cardX, cardY, cardWidth, 92, 5, '#100e11e8');
    ctx.strokeStyle = `${stage.accent}a8`;
    ctx.lineWidth = 1;
    ctx.strokeRect(cardX + 0.5, cardY + 0.5, cardWidth - 1, 91);
    ctx.fillStyle = stage.accent;
    ctx.fillRect(cardX + 17, cardY + 17, 3, 58);
    text(`CHAPTER 0${levelIndex + 1}  /  ${stage.chapter}`, cardX + 31, cardY + 31, 9, stage.accent, 'left', 900);
    text(stage.name, cardX + 31, cardY + 54, 16, '#fff0df', 'left', 950);
    text(stage.chapterLine, cardX + 31, cardY + 73, 9, '#d2c0b5', 'left', 700);
    const trackLabel = `TRACK 0${stage.track}  ·  ${stage.trackTitle}`;
    text(trackLabel, cardX + cardWidth - 17, cardY + 31, 8, '#d5b590', 'right', 850);
    const accentLength = prefersReducedMotion ? cardWidth - 34 : (cardWidth - 34) * clamp(elapsed / 1.2, 0, 1);
    ctx.globalAlpha *= 0.78;
    ctx.fillStyle = stage.accent;
    ctx.fillRect(cardX + 17, cardY + 82, accentLength, 2);
    ctx.restore();
  }

  function drawShardOrbit(x, y) {
    const count = clamp(gameState.shards || 0, 0, 4);
    if (!count) return;
    ctx.save();
    ctx.globalCompositeOperation = 'screen';
    ctx.strokeStyle = '#ffd17b38';
    ctx.lineWidth = 1;

    for (let i = 0; i < count; i++) {
      const angle = prefersReducedMotion ? i * Math.PI * 2 / count : time * 1.7 + i * Math.PI * 2 / count;
      const depth = Math.sin(angle);
      const shardX = x + Math.cos(angle) * 37;
      const shardY = y - 56 + depth * 18;
      const size = 2.5 + (depth + 1) * 0.75;
      ctx.save();
      ctx.globalAlpha = 0.48 + (depth + 1) * 0.2;
      ctx.translate(shardX, shardY);
      if (!prefersReducedMotion) ctx.rotate(angle * 0.7);
      ctx.shadowColor = '#ffc86d';
      ctx.shadowBlur = prefersReducedMotion ? 3 : 5 + (depth + 1) * 2;
      ctx.fillStyle = i % 2 ? '#ffe2a0' : '#ffbd67';
      ctx.strokeStyle = '#fff1c9';
      ctx.lineWidth = 0.8;
      ctx.beginPath();
      ctx.moveTo(0, -size * 1.7);
      ctx.lineTo(size * 0.8, -size * 0.2);
      ctx.lineTo(0, size * 1.7);
      ctx.lineTo(-size * 0.8, -size * 0.2);
      ctx.closePath();
      ctx.fill();
      ctx.stroke();
      ctx.restore();
    }
    ctx.restore();
  }

  function drawStageDetails() {
    ctx.fillStyle = '#09080b18';
    ctx.fillRect(0, 0, W, H);
    const stage = levels[levelIndex];
    text(stage.name, 480, 90, 10, '#fff0dcad', 'center', 800);
    const motes = [
      { color: '#ff9b55', drift: -8, shape: 'ember' },
      { color: '#ffd391', drift: 10, shape: 'crumb' },
      { color: '#c9ecf0', drift: 28, shape: 'snow' },
      { color: '#f4bc8b', drift: -14, shape: 'steam' },
      { color: '#ffd184', drift: -5, shape: 'glow' }
    ][levelIndex];
    ctx.save();
    ctx.globalCompositeOperation = 'screen';
    for (let i = 0; !prefersReducedMotion && i < 22; i++) {
      const seed = i * 137.5 + 31;
      const x = ((seed + time * motes.drift * (0.35 + (i % 4) * 0.17)) % (W + 36) + W + 36) % (W + 36) - 18;
      const baseY = (seed * 1.61) % H;
      const y = (baseY + Math.sin(time * (0.7 + (i % 3) * 0.18) + i) * 13 + time * (motes.shape === 'snow' ? 9 : -4)) % H;
      const alpha = 0.13 + (Math.sin(time * 2.1 + i * 3) + 1) * 0.075;
      const size = 1.2 + (i % 4) * 0.55;
      ctx.globalAlpha = alpha;
      ctx.fillStyle = motes.color;
      if (motes.shape === 'crumb') {
        ctx.save(); ctx.translate(x, y); ctx.rotate(time * 0.5 + i); ctx.fillRect(-size, -size, size * 2, size * 2); ctx.restore();
      } else {
        ctx.beginPath(); ctx.ellipse(x, y, size, motes.shape === 'ember' ? size * 1.8 : size, time * 0.3 + i, 0, Math.PI * 2); ctx.fill();
      }
    }
    ctx.globalAlpha = 1;
    if (motes.shape === 'steam' && !prefersReducedMotion) {
      ctx.strokeStyle = '#ffe1bc'; ctx.lineWidth = 1.4;
      for (let i = 0; i < 6; i++) {
        const x = 72 + i * 168 + Math.sin(time * 0.9 + i * 2) * 12;
        const y = 224 + Math.sin(time * 0.7 + i) * 19;
        ctx.globalAlpha = 0.12 + (Math.sin(time * 1.5 + i * 2) + 1) * 0.055;
        ctx.beginPath(); ctx.moveTo(x, y + 28); ctx.bezierCurveTo(x - 14, y + 12, x + 15, y - 2, x, y - 22); ctx.stroke();
      }
    }
    ctx.restore();
    if (stage.finale) {
      ctx.fillStyle = '#ffb04a19';
      ctx.beginPath();
      ctx.ellipse(858, 270, 92, 180, 0, 0, Math.PI * 2);
      ctx.fill();
    }
  }

  function drawFloor() {
    const start = Math.floor(cameraX / 150) * 150;
    const right = cameraX + W + 150;
    const palette = ['#d7784b55', '#e5a15155', '#a6d5d655', '#eb755b55', '#ffd08b55'][levelIndex];
    ctx.fillStyle = '#100e12';
    ctx.fillRect(start, 483, right - start, 57);
    ctx.strokeStyle = palette; ctx.lineWidth = 2;
    ctx.beginPath(); ctx.moveTo(start, 484); ctx.lineTo(right, 484); ctx.stroke();
    ctx.strokeStyle = '#ffffff0b'; ctx.lineWidth = 1;
    for (let x = start; x < right; x += 150) {
      ctx.beginPath(); ctx.moveTo(x, 486); ctx.lineTo(x, 539); ctx.stroke();
    }
    for (let x = Math.floor(start / 300) * 300; x < right; x += 300) {
      const seed = Math.abs(Math.sin(x * 0.013 + levelIndex * 11));
      if (seed > 0.55) {
        ctx.globalAlpha = 0.15 + seed * 0.16;
        ctx.fillStyle = seed > 0.82 ? '#ec5a4428' : '#e4d2bb22';
        ctx.beginPath(); ctx.ellipse(x + seed * 95, 506 + seed * 23, 10 + seed * 12, 2 + seed * 2, seed, 0, Math.PI * 2); ctx.fill();
      }
    }
    ctx.globalAlpha = 1;
  }

  function drawFinaleObstacles() {
    drawFinaleBarriers();
    for (const obstacle of finaleObstacles) {
      ctx.save(); ctx.translate(obstacle.x, 459);
      if (obstacle.state==='warn') { text('ПЛАМЯ!',0,-130,12,'#ffe3a0','center',950); }
      if (obstacle.state==='surge') drawSurgeFlame(0,0,110,160);
      ctx.fillStyle = 'rgba(0,0,0,.5)'; ctx.beginPath(); ctx.ellipse(0, 4, 55, 9, 0, 0, Math.PI * 2); ctx.fill();
      if (art.hotplate.complete && art.hotplate.naturalWidth) {
        const width = 122, height = width * art.hotplate.naturalHeight / art.hotplate.naturalWidth;
        const cut = .45, sway = prefersReducedMotion ? 0 : Math.sin(time * 9 + obstacle.x) * height * .045;
        ctx.drawImage(art.hotplate, 0, art.hotplate.naturalHeight * cut, art.hotplate.naturalWidth, art.hotplate.naturalHeight * (1 - cut), -width / 2, -height + height * cut, width, height * (1 - cut));
        ctx.drawImage(art.hotplate, 0, 0, art.hotplate.naturalWidth, art.hotplate.naturalHeight * cut, -width / 2, -height + sway, width, height * cut - sway);
      }
      if (!prefersReducedMotion) {
        for (let i = 0; i < 6; i++) {
          const phase = (time * .8 + i * .17 + obstacle.x * .001) % 1;
          ctx.globalAlpha = (1 - phase) * .7;
          ctx.fillStyle = i % 2 ? '#ffe7a0' : '#ff8937';
          const x = Math.sin(i * 3 + time) * 36 + phase * 7;
          ctx.beginPath(); ctx.moveTo(x, -29 - phase * 60); ctx.lineTo(x - 2, -33 - phase * 60); ctx.lineTo(x + 2, -37 - phase * 60); ctx.closePath(); ctx.fill();
        }
        ctx.globalAlpha = .2 + Math.sin(time * 8 + obstacle.x) * .06;
        ctx.strokeStyle = '#ffd8a0'; ctx.lineWidth = 1;
        for(let i = 0; i < 3; i++){const x=-25+i*25;ctx.beginPath();ctx.moveTo(x,-55);ctx.bezierCurveTo(x-4,-65,x+5,-75,x,-85);ctx.stroke()}
      }
      ctx.restore();
    }
  }

  const gaitRigs = {
    hero: { stride: 120, duty:.4, lift: 15, skin: ['#ff7e4b','#e53b2c','#8c1e22'], outline:'#631b20', thickness:8, hips:[[.43,.82],[.57,.82]], feet:[[.18,.88,.17,.12],[.575,.88,.19,.10]], footSize:[24,14], masks:[[.15,.76,.25,.24],[.55,.78,.25,.22]] },
    garlic: { stride:64, lift:9, skin:['#ffe2b0','#df9e67','#9d5141'],outline:'#70372c',thickness:6.5,hips:[[.39,.80],[.51,.80]],feet:[[.15,.86,.20,.14],[.55,.86,.20,.14]],footSize:[23,16],masks:[[.14,.78,.25,.22],[.51,.78,.27,.22]] },
    tomato: { stride:66,lift:10,skin:['#ff774b','#cf2c22','#7e2025'],outline:'#641d20',thickness:6,hips:[[.41,.78],[.53,.78]],feet:[[.12,.86,.20,.14],[.61,.84,.22,.14]],footSize:[24,15],masks:[[.08,.77,.27,.23],[.59,.75,.26,.25]] },
    mozzarella: { stride:46,lift:8,skin:['#fff4b5','#edb859','#a75d35'],outline:'#98512d',thickness:9,hips:[[.40,.84],[.52,.84]],feet:[[.17,.89,.20,.11],[.59,.89,.20,.11]],footSize:[25,12],masks:[[.15,.84,.25,.16],[.56,.84,.26,.16]] },
    pepper: { stride:76,lift:16,skin:['#ff8153','#d92e24','#8d2028'],outline:'#681b20',thickness:5.5,hips:[[.36,.74],[.45,.73]],feet:[[.60,.75,.21,.155],[.60,.75,.21,.155]],footRotation:.60,footSize:[23,13],masks:[],polygons:[[[0,.61],[.28,.61],[.37,.76],[.27,.83],[0,.83]],[[.40,.65],[.86,.65],[.86,.95],[.51,.95],[.40,.80]]] }
  };

  function advanceGait(entity, dx, dy, dt, kind) {
    const rig = gaitRigs[kind];
    const distance = Math.hypot(dx, dy * .65);
    const moving = distance > .015;
    const previous = entity.gaitPhase || 0;
    const direction = Math.abs(dx) > .01 ? Math.sign(dx * (entity.face || 1)) : 1;
    entity.gaitPhase = previous + (moving ? distance * direction / rig.stride * Math.PI * 2 : 0);
    entity.gaitBlend = clamp((entity.gaitBlend || 0) + dt * (moving ? 10 : -12), 0, 1);
    entity.gaitSpeed = moving ? distance / Math.max(dt,.001) : 0;
    return moving && Math.floor(previous / Math.PI) !== Math.floor(entity.gaitPhase / Math.PI);
  }

  function gaitFoot(kind, phase, leg, blend = 1) {
    const rig=gaitRigs[kind], duty=rig.duty||.6;
    const u=((phase/(Math.PI*2)+leg*.5)%1+1)%1, span=rig.stride*duty;
    if(u<duty)return {x:span*(.5-u/duty)*blend,y:0,angle:0,planted:true};
    const t=(u-duty)/(1-duty), smooth=t*t*(3-2*t);
    return {x:(-.5+smooth)*span*blend,y:-Math.sin(t*Math.PI)*rig.lift*blend,angle:-Math.sin(t*Math.PI)*.18*blend,planted:false};
  }

  function clipStandingLegs(kind,width,height,anchor=.5) {
    const rig=gaitRigs[kind];
    ctx.beginPath();ctx.rect(-width*anchor-2,-height-2,width+4,height+4);
    for(const [x,y,w,h]of rig.masks)ctx.rect((x-anchor)*width,(y-1)*height,w*width,h*height+2);
    for(const polygon of rig.polygons||[]){polygon.forEach(([x,y],i)=>{if(i)ctx.lineTo((x-anchor)*width,(y-1)*height);else ctx.moveTo((x-anchor)*width,(y-1)*height)});ctx.closePath()}
    ctx.clip('evenodd');
  }

  const footTextureCache = new WeakMap();
  function gaitFootTexture(image,crop,rotation=0) {
    let textures=footTextureCache.get(image);if(!textures){textures=new Map();footTextureCache.set(image,textures)}
    const key=crop.join(',')+':'+rotation;if(textures.has(key))return textures.get(key);
    const sw=Math.ceil(crop[2]*image.naturalWidth),sh=Math.ceil(crop[3]*image.naturalHeight),extent=Math.ceil(Math.hypot(sw,sh))+4;
    const surface=document.createElement('canvas');surface.width=surface.height=extent;const gc=surface.getContext('2d',{willReadFrequently:true});
    gc.translate(extent/2,extent/2);gc.rotate(rotation);gc.drawImage(image,crop[0]*image.naturalWidth,crop[1]*image.naturalHeight,sw,sh,-sw/2,-sh/2,sw,sh);gc.setTransform(1,0,0,1,0,0);
    try{const pixels=gc.getImageData(0,0,extent,extent).data;let x0=extent,y0=extent,x1=0,y1=0;for(let y=0;y<extent;y++)for(let x=0;x<extent;x++)if(pixels[(y*extent+x)*4+3]>32){x0=Math.min(x0,x);x1=Math.max(x1,x);y0=Math.min(y0,y);y1=Math.max(y1,y)}
      const texture={surface,x:x0,y:y0,width:Math.max(1,x1-x0+1),height:Math.max(1,y1-y0+1)};textures.set(key,texture);return texture;
    }catch{const texture={surface,x:0,y:0,width:extent,height:extent};textures.set(key,texture);return texture}
  }

  function drawGaitLegs(image,kind,phase,blend,width,height,anchor=.5,bodyX=0,bodyY=0) {
    const rig=gaitRigs[kind];
    for(let leg=0;leg<2;leg++){
      const step=gaitFoot(kind,phase,leg,blend), hipX=(rig.hips[leg][0]-anchor)*width+bodyX,hipY=(rig.hips[leg][1]-1)*height+bodyY;
      const hipCentre=(rig.hips[0][0]+rig.hips[1][0])*.5;
      const walkBase=(hipCentre-anchor)*width+(leg===0?-4:4);
      const neutral=kind==='pepper'?walkBase:(rig.feet[leg][0]+rig.feet[leg][2]*.5-anchor)*width;
      const footX=neutral*(1-blend)+walkBase*blend+step.x,footY=step.y;
      const ankleY=footY-rig.footSize[1]*.6;
      const dx=footX-hipX,dy=ankleY-hipY,distance=Math.max(1,Math.hypot(dx,dy));
      const kneeBend=step.planted?2.5:Math.min(10,height*.075);
      const kneeX=hipX+dx*.5+dy/distance*kneeBend,kneeY=hipY+dy*.5-dx/distance*kneeBend;
      ctx.save();if(leg===0)ctx.filter='brightness(.84)';ctx.lineCap='round';ctx.lineJoin='round';
      ctx.strokeStyle=rig.outline;ctx.lineWidth=rig.thickness+2.4;ctx.beginPath();ctx.moveTo(hipX,hipY);ctx.quadraticCurveTo(kneeX,kneeY,footX,ankleY);ctx.stroke();
      const skin=ctx.createLinearGradient(hipX-4,hipY,footX+5,ankleY);rig.skin.forEach((color,i)=>skin.addColorStop(i/2,color));ctx.strokeStyle=skin;ctx.lineWidth=rig.thickness;ctx.stroke();
      ctx.strokeStyle=rig.skin[0];ctx.lineWidth=1.2;ctx.beginPath();ctx.moveTo(hipX-1,hipY+3);ctx.lineTo(kneeX-1,kneeY);ctx.stroke();
      ctx.translate(footX,footY);ctx.rotate(step.angle);
      if(rig.feet){const texture=gaitFootTexture(image,rig.feet[leg],rig.footRotation||0);ctx.drawImage(texture.surface,texture.x,texture.y,texture.width,texture.height,-rig.footSize[0]*.47,-rig.footSize[1]+.3,rig.footSize[0],rig.footSize[1])}
      else {const boot=ctx.createLinearGradient(0,-13,0,0);boot.addColorStop(0,'#ff8860');boot.addColorStop(.45,'#d92c25');boot.addColorStop(1,'#7d2025');ctx.fillStyle=boot;ctx.strokeStyle='#58191e';ctx.lineWidth=1.5;ctx.beginPath();ctx.moveTo(-10,-2);ctx.lineTo(-9,-12);ctx.quadraticCurveTo(-2,-15,3,-8);ctx.quadraticCurveTo(17,-8,14,-1);ctx.lineTo(-10,-1);ctx.fill();ctx.stroke();ctx.strokeStyle='#ffd4a0';ctx.lineWidth=2;ctx.beginPath();ctx.moveTo(-9,-1);ctx.lineTo(13,-1);ctx.stroke()}
      ctx.restore();
    }
  }


  function drawPlayer() {
    const x = player.x;
    const y = player.y + player.z;
    const dodging = player.dash > 0 || player.dodgeReady && player.invuln > 0;
    const airborne = clamp(-player.z / 112, 0, 1);
    ctx.fillStyle = '#0009';
    ctx.globalAlpha = 0.56 - airborne * 0.28;
    ctx.beginPath();
    ctx.ellipse(player.x, player.y + 5, 30 - airborne * 10, 8 - airborne * 2, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.globalAlpha = 1;
    if (sauceRushTime > 0) {
      ctx.save();
      ctx.globalAlpha = 0.74 + Math.sin(time * 11) * 0.16;
      for (let i = 0; i < 4; i++) {
        const phase = prefersReducedMotion ? i * 1.4 : time * 7 + i * 1.6;
        const px = x - player.face * (18 + ((phase % 3 + 3) % 3) * 12);
        const py = y - 24 - (i % 2) * 18 + Math.sin(phase) * 4;
        ctx.fillStyle = i % 2 ? '#ff7651' : '#ffe0a0';
        ctx.beginPath(); ctx.ellipse(px, py, 2.5, 5, -player.face * 0.45, 0, Math.PI * 2); ctx.fill();
      }
      ctx.restore();
    }
    if (player.landingFx > 0) {
      const progress = 1 - player.landingFx / 0.34;
      ctx.save();
      ctx.globalAlpha = player.landingFx / 0.34 * 0.72;
      ctx.strokeStyle = '#ffb26e';
      ctx.lineWidth = 2.5 * (1 - progress * 0.45);
      ctx.beginPath();
      ctx.moveTo(player.x - 20 - progress * 15, player.y + 5);
      ctx.quadraticCurveTo(player.x, player.y - 1, player.x + 20 + progress * 15, player.y + 5);
      ctx.stroke();
      ctx.restore();
    }
    if (perfectDodgeTime > 0) {
      ctx.save();
      ctx.globalAlpha = Math.min(1, perfectDodgeTime * 1.9);
      ctx.fillStyle = '#fff0ad';
      ctx.shadowColor = '#ffd66b';
      ctx.shadowBlur = 18;
      ctx.beginPath();
      ctx.moveTo(x + player.face * 35, y - 102); ctx.lineTo(x + player.face * 39, y - 92);
      ctx.lineTo(x + player.face * 48, y - 89); ctx.lineTo(x + player.face * 39, y - 86);
      ctx.lineTo(x + player.face * 35, y - 76); ctx.lineTo(x + player.face * 32, y - 86);
      ctx.lineTo(x + player.face * 23, y - 89); ctx.lineTo(x + player.face * 32, y - 92); ctx.closePath(); ctx.fill();
      ctx.restore();
    }
    if (counterTime > 0) {
      ctx.save();
      ctx.globalAlpha = 0.45 + Math.sin(time * 18) * 0.2;
      ctx.fillStyle = '#ffbd68';
      ctx.shadowColor = '#ff9b43';
      ctx.shadowBlur = 12;
      ctx.beginPath(); ctx.moveTo(x + player.face * 22, y - 116); ctx.lineTo(x + player.face * 30, y - 104); ctx.lineTo(x + player.face * 21, y - 109); ctx.closePath(); ctx.fill();
      ctx.restore();
      text('КОНТРАТАКА', x, y - 151, 8, '#ffd39a', 'center', 950);
    }
    drawShardOrbit(x, y - 4);
    ctx.save();
    if (player.invuln > 0 && Math.floor(time * 18) % 2 === 0) ctx.globalAlpha = 0.5;
    if (dodging) {
      ctx.save();
      ctx.globalAlpha *= 0.34;
      ctx.drawImage(art.heroRun, x - player.face * 35 - 74, y - 132, 148, 148);
      ctx.restore();
    }
    const isMoving = playerMoving;
    const alternateRunFrame = Math.floor(player.walk / Math.PI) % 2 === 1 && art.heroRunAlt.complete && art.heroRunAlt.naturalWidth;
    const runSprite = alternateRunFrame ? art.heroRunAlt : art.heroRun;
    const kicking = player.attack > 0 && player.attackPose === 'kick';
    const punching = player.attack > 0 && player.attackPose === 'punch';
    const gaitActive = player.z === 0 && !kicking;
    const sprite = dodging && art.heroDodge.complete && art.heroDodge.naturalWidth ? art.heroDodge : player.attack > 0 && player.attackPose === 'heavy' && art.heroHeavy.complete && art.heroHeavy.naturalWidth ? art.heroHeavy : player.attack > 0 && player.attackPose === 'whip' ? art.hero : kicking || punching ? art.hero : player.attack > 0 ? art.heroPunch : player.z < 0 && art.heroJump.complete && art.heroJump.naturalWidth ? art.heroJump : isMoving ? art.hero : art.hero;
    if (sprite.complete && sprite.naturalWidth) {
      const bounce = prefersReducedMotion ? 0 : gaitActive && isMoving ? -Math.pow(Math.sin(player.walk),2)*1.8 : Math.sin(time*3.4)*1;
      const scale = player.z < 0 ? 1.04 : 1;
      const whipping = player.attack > 0 && player.attackPose === 'whip';
      const width = 144 * scale;
      const height = 144 * scale;
      const attackProgress = player.attack > 0 ? clamp(1 - player.attack / (player.attackDuration || player.attack), 0, 1) : 0;
      const punchPulse = player.attack > 0 ? (attackProgress < .23 ? Math.sin(attackProgress / .23 * Math.PI / 2) : Math.pow(1 - (attackProgress - .23) / .77, 2)) : 0;
      const lunge = punchPulse * (player.attackCombo === 3 ? 15 : 9);
      const hurtPulse = clamp(player.hurt / 0.36, 0, 1);
      if(gaitActive){ctx.save();ctx.translate(x,y);ctx.scale(player.face,1);drawGaitLegs(art.hero,'hero',player.walk||0,player.gaitBlend||0,width,height,.5,lunge,bounce);ctx.restore()}
      ctx.save();
      ctx.translate(x + player.face * lunge, y + bounce + punchPulse * 2);
      ctx.scale(player.face, 1);
      if (hurtPulse > 0) ctx.filter = 'brightness(1.55) saturate(.62)';
      const idleBreath = !isMoving && player.attack <= 0 && !dodging && player.z === 0 && !prefersReducedMotion ? Math.sin(time * 2.4) * 0.016 : 0;
      const stepSway = isMoving && !prefersReducedMotion ? Math.sin(player.walk) * 0.035 : 0;
      const stride = isMoving && !prefersReducedMotion ? Math.cos(player.walk * 2) * 0.025 : 0;
      ctx.scale(1 - stride, 1 + stride);
      ctx.rotate((player.attack > 0 ? -player.face * punchPulse * 0.055 : 0) + player.face * hurtPulse * 0.09 + stepSway);
      ctx.scale(1 + punchPulse * 0.045 + hurtPulse * 0.035 + idleBreath, 1 - punchPulse * 0.035 - hurtPulse * 0.075 - idleBreath);
      ctx.save();
      if(gaitActive)clipStandingLegs('hero',width,height);
      if (kicking) {
        // Hide the resting right foot while that same foot swings forward.
        ctx.beginPath(); ctx.rect(-width / 2 - 1, -height - 1, width + 2, height + 2);
        ctx.rect(width * .065, -height * .225, width * .22, height * .23);
        ctx.clip('evenodd');
      }
      if (whipping || punching) {
        ctx.beginPath(); ctx.rect(-width / 2 - 1, -height - 1, width + 2, height + 2);
        ctx.rect(width * .245, -height * .49, width * .24, height * .29);
        ctx.clip('evenodd');
      }
      const spriteChanged = player.renderSprite && player.renderSprite !== sprite;
      if (spriteChanged) { player.previousSprite = player.renderSprite; player.spriteChangedAt = performance.now(); }
      player.renderSprite = sprite;
      const blend = prefersReducedMotion || !player.previousSprite ? 1 : clamp((performance.now() - player.spriteChangedAt) / 75, 0, 1);
      const alpha = ctx.globalAlpha;
      if (blend < 1 && player.previousSprite.complete && player.previousSprite.naturalWidth) {
        ctx.globalAlpha = alpha * (1 - blend);
        ctx.drawImage(player.previousSprite, -width / 2, -height, width, height);
      }
      ctx.globalAlpha = alpha * blend;
      ctx.drawImage(sprite, -width / 2, -height, width, height);
      ctx.restore();
      if(punching && art.heroPunch.complete && art.heroPunch.naturalWidth){
        ctx.save();ctx.translate(width*.21,-height*.43);
        const extension=.25+punchPulse*(player.attackCombo===3?1.15:.85);
        ctx.drawImage(art.heroPunch,art.heroPunch.naturalWidth*.60,art.heroPunch.naturalHeight*.46,art.heroPunch.naturalWidth*.23,art.heroPunch.naturalHeight*.24,-7,-17,38*extension,35);
        ctx.drawImage(art.heroPunch,art.heroPunch.naturalWidth*.82,art.heroPunch.naturalHeight*.46,art.heroPunch.naturalWidth*.18,art.heroPunch.naturalHeight*.24,-7+38*extension,-17,29,35);ctx.restore();
      }
      if (whipping && art.heroPunch.complete && art.heroPunch.naturalWidth) {
        const reach = Math.sin(Math.PI * Math.pow(attackProgress, .65));
        ctx.save(); ctx.translate(width * .21, -height * .43);
        const extension = .65 + reach * (chapterAbilities().upgraded ? 3.1 : 2.5);
        if (chapterAbilities().upgraded) {
          ctx.save(); ctx.translate(20 + 38 * extension, 0); ctx.rotate(Math.PI / 2); ctx.globalAlpha *= reach * .9;
          drawBossIngredient('flame', .72); ctx.restore();
          ctx.shadowColor = '#ff8d36'; ctx.shadowBlur = 16;
        }
        ctx.drawImage(art.heroPunch, art.heroPunch.naturalWidth * .60, art.heroPunch.naturalHeight * .46, art.heroPunch.naturalWidth * .23, art.heroPunch.naturalHeight * .24, -7, -17, 38 * extension, 35);
        // Stretch the sauce forearm only; the fist keeps its natural proportions.
        ctx.drawImage(art.heroPunch, art.heroPunch.naturalWidth * .82, art.heroPunch.naturalHeight * .46, art.heroPunch.naturalWidth * .18, art.heroPunch.naturalHeight * .24, -7 + 38 * extension, -17, 29, 35);
        ctx.restore();
      }
      if (kicking) {
        const snap = Math.sin(Math.PI * Math.pow(attackProgress, .65));
        ctx.save(); ctx.translate(width * .146, -height * .202);
        ctx.rotate(-snap * 1.35); ctx.scale(1, 1 + snap * .3);
        ctx.drawImage(art.hero, art.hero.naturalWidth * .565, art.hero.naturalHeight * .775, art.hero.naturalWidth * .21, art.hero.naturalHeight * .225, -3, -3, width * .208, height * .222);
        ctx.restore();
      }
      ctx.restore();
    }
    if (player.attack > 0 && player.attackPose === 'punch' && player.attackCombo < 3) {
      const progress = clamp(1 - player.attack / (player.attackDuration || player.attack), 0, 1);
      if (progress > 0.12 && progress < 0.88) {
        const fade = prefersReducedMotion ? 0.32 : Math.sin(Math.PI * progress) * 0.72;
        ctx.save();
        ctx.translate(x + player.face * 49, y - 76);
        ctx.scale(player.face, 1);
        if (!prefersReducedMotion) ctx.rotate((progress - 0.5) * 0.12);
        ctx.globalAlpha = fade;
        ctx.lineCap = 'round';
        ctx.strokeStyle = player.attackCombo === 2 ? '#ffc36f' : '#ff7165';
        ctx.lineWidth = player.attackCombo === 2 ? 6 : 4.5;
        ctx.shadowColor = player.attackCombo === 2 ? '#ffad57' : '#ff5147';
        ctx.shadowBlur = prefersReducedMotion ? 0 : 10;
        ctx.beginPath(); ctx.moveTo(-9, -17); ctx.quadraticCurveTo(8, -7, 35, -2); ctx.stroke();
        ctx.shadowBlur = 0;
        ctx.strokeStyle = '#fff0d0';
        ctx.lineWidth = 1.3;
        ctx.globalAlpha *= 0.82;
        ctx.beginPath(); ctx.moveTo(-3, -20); ctx.quadraticCurveTo(13, -9, 39, -4); ctx.stroke();
        ctx.restore();
      }
    }
    if (player.finisher > 0) {
      const progress = prefersReducedMotion ? 0.42 : 1 - player.finisher / 0.24;
      const fade = prefersReducedMotion ? 0.72 : Math.sin(Math.PI * clamp(progress, 0.08, 0.92));
      ctx.save();
      ctx.translate(x + player.face * (38 + progress * 16), y - 68);
      ctx.scale(player.face, 1);
      ctx.globalAlpha = fade * 0.86;
      const slash = ctx.createLinearGradient(-8, -50, 55, 47);
      slash.addColorStop(0, '#fff1bf');
      slash.addColorStop(0.42, '#ffce76');
      slash.addColorStop(1, '#ff6847');
      ctx.strokeStyle = slash;
      ctx.lineCap = 'round';
      ctx.lineWidth = 9 * (1 - progress * 0.5);
      ctx.shadowColor = '#ff9c50';
      ctx.shadowBlur = prefersReducedMotion ? 3 : 16;
      ctx.beginPath(); ctx.moveTo(-17, 18); ctx.quadraticCurveTo(4, -9, 42 + progress * 18, -40); ctx.stroke();
      ctx.shadowBlur = 0;
      ctx.strokeStyle = '#fff2c7';
      ctx.lineWidth = 2;
      ctx.beginPath(); ctx.moveTo(-10, 22); ctx.quadraticCurveTo(10, -3, 47 + progress * 18, -34); ctx.stroke();
      for (let i = 0; i < 3; i++) {
        const moteX = 33 + progress * 22 + i * 8;
        const moteY = -23 + i * 18;
        ctx.fillStyle = i === 1 ? '#fff0b0' : '#ff8051';
        ctx.beginPath();
        ctx.ellipse(moteX, moteY, 3.5, 5.5, 0.25, 0, Math.PI * 2);
        ctx.fill();
      }
      ctx.restore();
    }
    if (player.comboTime > 0 && player.combo >= 2) {
      const alpha = ctx.globalAlpha;
      ctx.globalAlpha = Math.min(alpha, player.comboTime * 2);
      text(`${player.combo} HIT COMBO`, x, y - 152, 9, '#ffd49c', 'center', 950);
      ctx.globalAlpha = alpha;
    }
    ctx.restore();
  }

  function drawEnemy(enemy) {
    const movement = prefersReducedMotion ? 0 : clamp(Math.abs(enemy.vx) / 140, 0, 1);
    const idlePulse = prefersReducedMotion ? 0 : Math.sin(time * 2.5 + enemy.swing * 0.24);
    const stepPulse = prefersReducedMotion ? 0 : Math.sin(enemy.swing);
    const bob = prefersReducedMotion ? 0 : Math.sin(time * 2.2 + enemy.swing * 0.26) * (1.6 + movement * 2.2) + Math.abs(stepPulse) * movement * 1.2;
    const gaitActive = enemy.state === 'idle';
    const bodyBob = gaitActive && enemy.gaitSpeed > 4 ? -Math.pow(Math.sin(enemy.gaitPhase||0),2)*1.3 : bob*.45;
    const x = enemy.x, y = enemy.y + bodyBob;
    const indicatorScale = compactControlsQuery?.matches ? clamp(compactHudScale, 1, 1.8) : 1;
    const spawnProgress = enemy.spawn > 0 ? 1 - enemy.spawn / 0.32 : 1;
    const tellDuration = ((enemy.type === 'pepper' ? 0.3 : enemy.type === 'mozzarella' ? 0.72 : 0.52) + (levelIndex === 0 ? 0.18 : 0)) * (enemy.elite ? enemy.enraged ? 0.64 : 0.82 : 1);
    const tellProgress = enemy.state === 'tell' ? clamp(1 - enemy.stateTime / tellDuration, 0, 1) : 0;
    const anticipation = prefersReducedMotion ? 0 : enemy.state === 'tell' ? Math.sin(tellProgress * Math.PI * 0.72) : 0;
    const attackProgress = enemy.state === 'attack' ? clamp(1 - enemy.stateTime / 0.28, 0, 1) : 0;
    const attackPulse = prefersReducedMotion ? 0 : attackProgress < .22 ? Math.sin(attackProgress / .22 * Math.PI / 2) : Math.pow(1 - (attackProgress - .22) / .78, 2);
    const hitPulse = clamp(enemy.hit / 0.22, 0, 1);
    ctx.fillStyle = '#0008';
    ctx.beginPath();
    ctx.ellipse(x, enemy.y + 5, 23 + movement * 3, 7 - movement * 0.8, 0, 0, Math.PI * 2);
    ctx.fill();
    const attackFrame = enemy.state === 'attack' ? art.npcAttacks[enemy.type] : null;
    const hasAttackFrame = attackFrame?.complete && attackFrame.naturalWidth;
    const sprite = hasAttackFrame ? attackFrame : art.npcs[enemy.type];
    if (enemy.elite) {
      text(enemy.enraged ? 'ЯРОСТЬ' : 'ЭЛИТА', x, y - 126, 6 * indicatorScale, enemy.enraged ? '#ffab83' : '#ffe0a1', 'center', 950);
    }
    if (enemy.state === 'tell') {
      ctx.globalAlpha = prefersReducedMotion ? 0.82 : 0.56 + Math.sin(time * 23 + enemy.swing) * 0.36;
      text('!', x + enemy.face * 32, y - 139 - anticipation * 8, 20, enemy.elite && !enemy.enraged ? '#ffd17b' : '#ff795f', 'center', 950);
      ctx.globalAlpha = 1;
    }
    if (sprite?.complete && sprite.naturalWidth) {
      const anchor = hasAttackFrame ? ({garlic:.39,tomato:.37,mozzarella:.40,pepper:.59}[enemy.type]) : ({garlic:.43,tomato:.45,mozzarella:.43,pepper:.53}[enemy.type]);
      const spriteWidth = Math.min(240,112*sprite.naturalWidth/sprite.naturalHeight);
      if(gaitActive){ctx.save();ctx.translate(x,enemy.y);ctx.scale(enemy.face,1);drawGaitLegs(sprite,enemy.type,enemy.gaitPhase||0,enemy.gaitBlend||0,spriteWidth,112,anchor,0,bodyBob);ctx.restore()}
      ctx.save();
      ctx.translate(x + enemy.face * (attackPulse * 13 - anticipation * 3), y - anticipation * 3 + attackPulse * 3);
      ctx.globalAlpha *= spawnProgress;
      const spawnScale = 0.76 + spawnProgress * 0.24;
      if (enemy.hit > 0) ctx.filter = 'brightness(1.8) saturate(.5)';
      const lean = clamp(enemy.vx * 0.00055 - enemy.face * anticipation * 0.1 + enemy.face * attackPulse * 0.075 - Math.sign(enemy.knockback) * hitPulse * 0.13 + idlePulse * 0.012, -0.34, 0.34);
      ctx.scale(enemy.face,1);
      ctx.rotate(lean*enemy.face);
      const squash = anticipation * 0.035 + attackPulse * 0.055 + hitPulse * 0.04;
      const stretch = anticipation * 0.025 + attackPulse * 0.045 + movement * Math.abs(stepPulse) * 0.012;
      ctx.scale(spawnScale * (1 + idlePulse * 0.018 + stretch - squash * 0.25), spawnScale * (1 - idlePulse * 0.014 - stretch + squash));
      if(gaitActive)clipStandingLegs(enemy.type,spriteWidth,112,anchor);
      ctx.drawImage(sprite, -spriteWidth * anchor, -112, spriteWidth, 112);
      ctx.restore();
    }
    const barWidth = 50 * indicatorScale;
    const barHeight = 5 * indicatorScale;
    const barX = x - barWidth / 2;
    const barY = y - 116;
    rounded(barX, barY, barWidth, barHeight, 2, '#171315');
    const hpWidth = 50 * enemy.hp / enemy.maxHp;
    const hpTrailWidth = 50 * enemy.hpTrail / enemy.maxHp;
    if (hpTrailWidth > hpWidth + 0.5) rounded(barX, barY, hpTrailWidth * indicatorScale, barHeight, 2, '#e5a34f');
    if (enemy.miniBoss) text('ПЕРЕЦ-ПОДЖИГАТЕЛЬ',x,barY-12,9,'#ffd17b','center',900);
    rounded(barX, barY, hpWidth * indicatorScale, barHeight, 2, enemy.elite ? enemy.enraged ? '#ff684c' : '#ffd17b' : enemy.type === 'tomato' ? '#f2654b' : '#e6b66f');
  }

  function drawBurgerBoss() {
    const attacking = boss.state === 'attack';
    const progress = attacking ? clamp(1 - boss.timer / (boss.attackDuration || .52), 0, 1) : 0;
    const pulse = Math.sin(progress * Math.PI), breath = prefersReducedMotion ? 0 : Math.sin(time * 2.7) * .018;
    ctx.save(); ctx.fillStyle = '#0008'; ctx.beginPath(); ctx.ellipse(boss.x, boss.y + 6, 73, 11, 0, 0, Math.PI * 2); ctx.fill();
    ctx.translate(boss.x - pulse * 24, boss.y + pulse * 2);
    ctx.rotate(prefersReducedMotion ? 0 : -pulse * .07 + breath);
    ctx.scale(1 + breath + pulse * .045, 1 - breath - pulse * .055);
    if (boss.stun > 0) ctx.filter = 'brightness(1.45)';
    if (art.burger.complete && art.burger.naturalWidth) {
      const height = 234, width = height * art.burger.naturalWidth / art.burger.naturalHeight;
      ctx.drawImage(art.burger, -width / 2, -height, width, height);
    }
    ctx.restore();
    if (boss.state === 'tell') text('!', boss.x - 100, boss.y - 235, 30, '#ffb472', 'center', 950);
  }

  function drawBossIngredient(kind, size = 1, phase = 0) {
    ctx.save(); ctx.scale(size, size); ctx.lineJoin = 'round'; ctx.lineCap = 'round';
    const warm = ctx.createLinearGradient(-20, -24, 15, 22);
    warm.addColorStop(0, '#fff0af'); warm.addColorStop(.38, '#f4b449'); warm.addColorStop(1, '#a84624');
    ctx.strokeStyle = '#5c291b'; ctx.lineWidth = 2.5;
    if (kind === 'fry') {
      ctx.rotate(.18); ctx.fillStyle = warm;
      ctx.beginPath(); ctx.moveTo(-7,-28); ctx.lineTo(6,-26); ctx.lineTo(8,25); ctx.lineTo(-6,28); ctx.closePath(); ctx.fill(); ctx.stroke();
      ctx.strokeStyle = '#ffe9a6'; ctx.lineWidth = 2; ctx.beginPath(); ctx.moveTo(-2,-21); ctx.lineTo(-1,19); ctx.stroke();
      ctx.fillStyle='#804321'; for(let i=0;i<4;i++)ctx.fillRect(-4+i%2*7,-17+i*11,2,3);
      ctx.fillStyle='#fff3cc'; ctx.fillRect(2,-12,2,2); ctx.fillRect(-2,9,2,2);
    } else if (kind === 'pizza') {
      ctx.fillStyle = '#f7c45e'; ctx.beginPath(); ctx.moveTo(-24,-21); ctx.quadraticCurveTo(0,-35,25,-19); ctx.lineTo(1,28); ctx.closePath(); ctx.fill(); ctx.stroke();
      ctx.strokeStyle='#bb642c';ctx.lineWidth=10;ctx.beginPath();ctx.moveTo(-20,-21);ctx.quadraticCurveTo(0,-31,21,-20);ctx.stroke();
      ctx.strokeStyle='#ffe1a0';ctx.lineWidth=2;ctx.beginPath();ctx.moveTo(-18,-24);ctx.quadraticCurveTo(0,-31,18,-23);ctx.stroke();
      for(const [x,y,r]of[[-9,-9,6],[10,-7,5],[1,9,5]]){ctx.fillStyle='#af312b';ctx.beginPath();ctx.arc(x,y,r,0,Math.PI*2);ctx.fill();ctx.fillStyle='#f98046';ctx.fillRect(x-2,y-2,2,2)}
      ctx.fillStyle='#698a3c';ctx.fillRect(-6,2,3,5);ctx.fillRect(6,-16,3,4);
      ctx.strokeStyle='#fff0b3';ctx.lineWidth=2;ctx.beginPath();ctx.moveTo(4,17);ctx.lineTo(1,27);ctx.stroke();
    } else if (kind === 'nugget' || kind === 'crumb') {
      ctx.fillStyle=warm;ctx.beginPath();ctx.moveTo(-22,-14);ctx.lineTo(-8,-26);ctx.lineTo(15,-23);ctx.lineTo(27,-7);ctx.lineTo(22,14);ctx.lineTo(5,24);ctx.lineTo(-19,18);ctx.closePath();ctx.fill();ctx.stroke();
      for(let i=0;i<14;i++){const x=Math.sin(i*4.3)*19,y=Math.cos(i*2.7)*16;ctx.fillStyle=i%2?'#ffe29a':'#b86828';ctx.beginPath();ctx.moveTo(x,y);ctx.lineTo(x+4,y-2);ctx.lineTo(x+3,y+3);ctx.closePath();ctx.fill()}
      ctx.strokeStyle='#fff0bf';ctx.lineWidth=2;ctx.beginPath();ctx.moveTo(-15,-13);ctx.quadraticCurveTo(-6,-21,8,-17);ctx.stroke();
    } else if (kind === 'meatball' || kind === 'patty') {
      const meat=ctx.createRadialGradient(-8,-9,2,0,0,28);meat.addColorStop(0,'#d27a42');meat.addColorStop(.55,'#8e3b27');meat.addColorStop(1,'#3d1a18');ctx.fillStyle=meat;
      ctx.beginPath();ctx.moveTo(-25,0);ctx.bezierCurveTo(-27,-25,20,-32,26,-5);ctx.bezierCurveTo(33,24,-22,31,-25,0);ctx.fill();ctx.stroke();
      for(let i=0;i<15;i++){const x=Math.sin(i*3.7)*20,y=Math.cos(i*2.4)*16;ctx.fillStyle=i%3?'#4f211c':'#e89c57';ctx.fillRect(x,y,3,2)}
      ctx.strokeStyle='#f5b67b';ctx.lineWidth=2;ctx.beginPath();ctx.moveTo(-16,-13);ctx.quadraticCurveTo(-10,-22,0,-17);ctx.stroke();
      ctx.fillStyle='#7d9a49';ctx.fillRect(-7,-5,4,3);ctx.fillRect(11,7,3,4);
      if(kind==='patty'){ctx.strokeStyle='#2d1516';ctx.lineWidth=4;for(let i=-1;i<=1;i++){ctx.beginPath();ctx.moveTo(-17,i*9-4);ctx.lineTo(16,i*9+3);ctx.stroke()}}
    } else if (kind === 'pickle') {
      const green=ctx.createLinearGradient(-20,-8,20,10);green.addColorStop(0,'#c7dc6c');green.addColorStop(.5,'#86ae42');green.addColorStop(1,'#345c30');ctx.fillStyle=green;ctx.strokeStyle='#31502b';ctx.lineWidth=4;
      ctx.beginPath();ctx.moveTo(-25,-4);ctx.bezierCurveTo(-22,-22,21,-24,27,-3);ctx.bezierCurveTo(32,20,-20,23,-25,-4);ctx.fill();ctx.stroke();
      ctx.strokeStyle='#dceba0';ctx.lineWidth=1.5;for(let i=0;i<7;i++){const angle=i*Math.PI*2/7;ctx.beginPath();ctx.moveTo(Math.cos(angle)*5,Math.sin(angle)*4);ctx.lineTo(Math.cos(angle)*18,Math.sin(angle)*11);ctx.stroke()}
      ctx.fillStyle='#edf1b4';for(let i=0;i<5;i++){ctx.beginPath();ctx.ellipse(Math.sin(i*2.4)*12,Math.cos(i*2.4)*7,2,3,i,0,Math.PI*2);ctx.fill()}
    } else if (kind === 'oil') {
      ctx.fillStyle='#ffc755';ctx.beginPath();ctx.moveTo(0,-27);ctx.bezierCurveTo(6,-13,21,5,10,16);ctx.bezierCurveTo(-1,29,-23,9,-11,-5);ctx.closePath();ctx.fill();ctx.strokeStyle='#ffe9b3';ctx.lineWidth=3;ctx.beginPath();ctx.moveTo(-5,-5);ctx.quadraticCurveTo(-12,8,-3,12);ctx.stroke();
    } else if (kind === 'tentacle' || kind === 'noodleTrap' || kind === 'cheeseThread') {
      const pasta = kind !== 'cheeseThread';
      for(let strand=0;strand<(pasta?4:2);strand++) {
        ctx.strokeStyle=strand%2?'#ffe3a0':'#bd8441';ctx.lineWidth=pasta?5:7;ctx.beginPath();ctx.moveTo(-20+strand*7,22);ctx.bezierCurveTo(-30+strand*7,-9,20+strand*3,-2,8+strand*5,-23);ctx.stroke();
      }
    } else if (kind === 'flame') {
      ctx.fillStyle='#dc3f23';ctx.beginPath();ctx.moveTo(-28,12);ctx.quadraticCurveTo(-42,-5,-24,-24);ctx.lineTo(-20,-2);ctx.quadraticCurveTo(-4,-45,3,-47);ctx.quadraticCurveTo(3,-20,19,-14);ctx.lineTo(20,-31);ctx.quadraticCurveTo(44,-3,25,17);ctx.closePath();ctx.fill();
      ctx.fillStyle='#ffa53c';ctx.beginPath();ctx.moveTo(-17,12);ctx.quadraticCurveTo(-24,-5,-10,-12);ctx.lineTo(-7,0);ctx.lineTo(3,-27);ctx.quadraticCurveTo(9,-6,19,3);ctx.lineTo(15,17);ctx.closePath();ctx.fill();ctx.fillStyle='#fff0aa';ctx.beginPath();ctx.moveTo(-6,14);ctx.quadraticCurveTo(-8,2,1,-8);ctx.quadraticCurveTo(11,7,8,16);ctx.fill();
    }
    ctx.restore();
  }

  function drawBossWeapon(h) {
    const p=h.progress||0, age=Math.max(0,h.age-h.delay), active=h.age>=h.delay;
    const remaining=clamp(h.life/.22,0,1);
    ctx.save();ctx.globalAlpha=remaining;
    if(h.motion==='beam') {
      if(!active){ctx.restore();return}
      const reach=clamp(p/.2,0,1), end=h.startX+(h.targetX-h.startX)*reach;
      const tension=Math.sin(p*Math.PI); const pasta=h.type==='tentacle';
      for(let strand=0;strand<(pasta?4:2);strand++){
        ctx.strokeStyle=pasta?(strand%2?'#f7d78b':'#bf7d40'):(strand?'#fff1a7':'#df9d37');ctx.lineWidth=pasta?5-strand*.5:strand?3:9;ctx.lineCap='round';
        ctx.shadowColor=pasta?'#ffab60':'#ffcc60';ctx.shadowBlur=6;
        ctx.beginPath();ctx.moveTo(h.startX,h.startY-58+strand*4);
        ctx.bezierCurveTo(h.startX-70,h.startY-75+Math.sin(age*13+strand)*12,end+70,h.y-40+Math.sin(age*10+strand)*14,end,h.y-47+strand*3);ctx.stroke();
      }
      ctx.shadowBlur=0;ctx.fillStyle=pasta?'#da4b36':'#ffe6a0';
      for(let i=0;i<4;i++){const x=end+(h.startX-end)*i/4;ctx.beginPath();ctx.moveTo(x,h.y-40);ctx.quadraticCurveTo(x-4,h.y-20+Math.sin(age*9+i)*7,x+3,h.y-29);ctx.lineTo(x+5,h.y-42);ctx.fill()}
      ctx.restore();return;
    }
    // Falling ingredients cast a soft food-shaped preview, never a targeting ring.
    if(h.motion==='fall' && p<.8){ctx.save();ctx.translate(h.targetX,h.targetY+2);ctx.scale(1,.28);ctx.globalAlpha=remaining*.16;drawBossIngredient(h.type,h.type==='nugget'?1.6:1,0);ctx.restore()}
    if(!active){ctx.restore();return}
    if(h.type==='crack') {
      ctx.translate(h.x,h.y);ctx.lineCap='round';
      for(let line=0;line<3;line++){ctx.strokeStyle=line===0?'#2c171b':line===1?'#f09d59':'#ffdaa0';ctx.lineWidth=line===0?7:line===1?3:1;ctx.beginPath();ctx.moveTo(-34,-2);ctx.lineTo(-22,-11);ctx.lineTo(-10,1);ctx.lineTo(1,-9);ctx.lineTo(12,4);ctx.lineTo(23,-7);ctx.lineTo(34,0);ctx.stroke()}
      for(let i=0;i<5;i++){ctx.save();ctx.translate((i-2)*17,-10-Math.abs(Math.sin(age*12+i))*25);ctx.rotate(i+age*4);drawBossIngredient('crumb',.12);ctx.restore()}
      ctx.restore();return;
    }
    if(h.type==='noodleTrap') {
      ctx.translate(h.x,h.y);const grow=clamp(p*1.6,0,1);
      for(let i=0;i<5;i++){const x=(i-2)*10;ctx.strokeStyle=i%2?'#f7d482':'#ac7543';ctx.lineWidth=5;ctx.lineCap='round';ctx.beginPath();ctx.moveTo(x,5);ctx.bezierCurveTo(x-14,-15*grow,x+20,-43*grow,x+Math.sin(age*8+i)*10,-78*grow);ctx.stroke();ctx.strokeStyle='#fff0ba';ctx.lineWidth=1.2;ctx.stroke()}
      ctx.restore();return;
    }
    if(h.type==='oil' && p>=1) {
      ctx.translate(h.x,h.y);const simmer=1+Math.sin(age*12)*.04;ctx.scale(simmer,1);
      const oil=ctx.createLinearGradient(0,-12,0,15);oil.addColorStop(0,'#e88a25');oil.addColorStop(.5,'#a63e1c');oil.addColorStop(1,'#44201d');ctx.fillStyle=oil;ctx.beginPath();ctx.moveTo(-39,1);ctx.bezierCurveTo(-34,-17,-15,-8,-5,-13);ctx.bezierCurveTo(8,-17,13,-6,31,-8);ctx.bezierCurveTo(50,2,32,14,17,9);ctx.bezierCurveTo(5,20,-7,9,-22,13);ctx.bezierCurveTo(-44,13,-50,7,-39,1);ctx.fill();
      ctx.strokeStyle='#ffd889';ctx.lineWidth=2;ctx.beginPath();ctx.moveTo(-22,-3);ctx.quadraticCurveTo(-13,-9,-3,-5);ctx.stroke();
      for(let i=0;i<4;i++){const t=(age*2+i*.3)%1;ctx.globalAlpha=remaining*(1-t)*.7;ctx.fillStyle='#ffbd54';ctx.beginPath();ctx.moveTo(-22+i*14,-5-t*20);ctx.lineTo(-25+i*14,-9-t*20);ctx.lineTo(-20+i*14,-12-t*20);ctx.lineTo(-18+i*14,-7-t*20);ctx.fill()}
      ctx.restore();return;
    }
    const rotation=prefersReducedMotion?0:h.motion==='boomerang'?age*13:h.type==='fry'?-.8:h.type==='flame'?Math.sin(age*22)*.09:age*4;
    const scale=h.type==='nugget'?1.65:h.type==='crumb'?.35:h.type==='patty'?1.45:h.type==='pizza'?.95:1;
    if(h.motion!=='fall' && !prefersReducedMotion){for(let i=3;i>=1;i--){ctx.save();ctx.globalAlpha=remaining*.09*(4-i);ctx.translate(h.x+(h.startX-h.targetX)*.025*i,h.y+h.height+2*i);ctx.rotate(rotation-i*.3);drawBossIngredient(h.type,scale*(1-i*.06));ctx.restore()}}
    ctx.translate(h.x,h.y+h.height);ctx.rotate(rotation);ctx.shadowColor=h.type==='pickle'?'#aecb58':h.type==='flame'?'#ff6727':'#ffbc63';ctx.shadowBlur=h.type==='flame'?18:5;drawBossIngredient(h.type,scale);ctx.restore();
  }

  function drawBossWindup() {
    if(!boss?.alive || boss.state!=='tell')return;
    const kinds={fryKing:['fry','fry','oil'],pizzaSlice:['cheeseThread','pizza','pizza'],nuggetBrute:['nugget','crumb','crumb'],spaghettiMonster:['tentacle','meatball','noodleTrap'],burger:['patty','flame','pickle']};
    const kind=kinds[levels[levelIndex].key]?.[boss.attack-1];if(!kind)return;
    const bob=prefersReducedMotion?0:Math.sin(time*9)*4;
    ctx.save();ctx.translate(boss.x-72,boss.y-105+bob);ctx.rotate(prefersReducedMotion?0:Math.sin(time*5)*.15);ctx.globalAlpha=.9;drawBossIngredient(kind,.72);ctx.restore();
  }


  function drawBoss() {
    const stage = levels[levelIndex];
    if (stage.key === 'burger') { drawBurgerBoss(); drawBossWindup(); return; }
    const [idle, attack] = art.bosses[stage.key];
    const animated = boss.state === 'attack';
    const sprite = animated ? attack : idle;
    const dimensions = stage.key === 'nuggetBrute' ? 210 : stage.key === 'spaghettiMonster' ? 205 : 190;
    const idlePulse = prefersReducedMotion ? 0 : Math.sin(time * 2.6 + levelIndex * 0.7);
    const bob = boss.state === 'idle' ? idlePulse * 3 : 0;
    const x = boss.x;
    const leap = stage.key === 'nuggetBrute' && animated && boss.attack === 1 && !prefersReducedMotion ? Math.sin(Math.PI * clamp(1 - boss.timer / (boss.attackDuration || .52), 0, 1)) * 65 : 0;
    const y = boss.y + bob - leap;
    const defeatProgress = boss.state === 'defeated' ? clamp((cutscene?.time || 0) / 0.88, 0, 1) : 0;
    const attackProgress = animated ? clamp(1 - boss.timer / (boss.attackDuration || 0.52), 0, 1) : 0;
    const attackPulse = Math.sin(attackProgress * Math.PI);
    const lunge = animated ? attackPulse * (boss.attack === 1 ? 25 : 15) : boss.state === 'recover' ? -7 : 0;
    ctx.fillStyle = '#0009';
    ctx.beginPath(); ctx.ellipse(x, boss.y + 9, 58, 12, 0, 0, Math.PI * 2); ctx.fill();
    if (boss.state === 'tell') {

      const tellSide = player.x >= x ? 1 : -1;
      text('!', x + tellSide * 65, y - dimensions - 18, 32, '#ff7059', 'center', 950);
    }
    if (sprite.complete && sprite.naturalWidth) {
      ctx.save();
      ctx.globalAlpha *= 1 - defeatProgress;
      if (boss.stun > 0) ctx.filter = 'brightness(1.5)';
      ctx.translate(x - lunge, y + attackPulse * 3 + defeatProgress * 40);
      ctx.rotate(boss.state === 'defeated' ? defeatProgress * 0.95 : animated ? -attackPulse * 0.055 : boss.state === 'recover' ? 0.025 : boss.state === 'idle' ? idlePulse * 0.018 : 0);
      const hitPulse = clamp(boss.stun / 0.22, 0, 1);
      const scaleX = boss.state === 'defeated' ? 1 - defeatProgress * 0.28 : animated ? 1 + attackPulse * 0.055 : boss.state === 'recover' ? 0.98 : boss.state === 'idle' ? 1 + idlePulse * 0.012 : 1 + hitPulse * 0.045;
      const scaleY = boss.state === 'defeated' ? 1 - defeatProgress * 0.18 : animated ? 1 - attackPulse * 0.075 : boss.state === 'recover' ? 1.025 : boss.state === 'idle' ? 1 - idlePulse * 0.009 : 1 - hitPulse * 0.04;
      ctx.scale(scaleX, scaleY);
      ctx.drawImage(sprite, -dimensions / 2, -dimensions, dimensions, dimensions);
      ctx.restore();
    }
    ctx.globalAlpha = 1;
    drawBossWindup();
  }

  function drawHazard(hazard) {
    if (hazard.bossWeapon) { drawBossWeapon(hazard); return; }
    ctx.save();
    if (hazard.type === 'tomato' && !hazard.landed) {
      const skin = ctx.createRadialGradient(hazard.x - 4, hazard.y - 5, 1, hazard.x, hazard.y, 14);
      skin.addColorStop(0, '#ffbd83'); skin.addColorStop(.3, '#f35a3b'); skin.addColorStop(1, '#7e2221');
      ctx.fillStyle = skin; ctx.beginPath(); ctx.arc(hazard.x, hazard.y, 12, 0, Math.PI * 2); ctx.fill();
      ctx.fillStyle = '#789e43'; ctx.beginPath(); ctx.moveTo(hazard.x, hazard.y - 10); ctx.lineTo(hazard.x - 8, hazard.y - 17); ctx.lineTo(hazard.x - 2, hazard.y - 15); ctx.lineTo(hazard.x + 4, hazard.y - 18); ctx.lineTo(hazard.x + 5, hazard.y - 11); ctx.closePath(); ctx.fill();
    } else {
      ctx.translate(hazard.x, hazard.y); ctx.globalAlpha = clamp(hazard.life * 2, 0, .85);
      ctx.fillStyle = '#c33d2d'; ctx.beginPath(); ctx.moveTo(-29,0); ctx.bezierCurveTo(-30,-12,-12,-6,-3,-10); ctx.bezierCurveTo(11,-13,17,-2,27,-4); ctx.bezierCurveTo(40,8,16,15,5,10); ctx.bezierCurveTo(-11,18,-39,9,-29,0); ctx.fill();
      ctx.strokeStyle = '#ffae79'; ctx.lineWidth = 2; ctx.beginPath(); ctx.moveTo(-16,-3); ctx.quadraticCurveTo(-7,-8,0,-4); ctx.stroke();
    }
    ctx.restore();
  }

  function drawDrop(drop) {
    const medkit = drop.type === 'medkit';
    const pulse = prefersReducedMotion ? 1 : 0.86 + Math.sin(time * 8 + drop.x) * 0.14;
    ctx.save();
    ctx.globalAlpha = Math.min(1, drop.life) * pulse;
    if (drop.magnetized && !prefersReducedMotion) {
      ctx.save();
      ctx.globalAlpha *= 0.42;
      ctx.strokeStyle = medkit ? '#a8f4bf' : drop.elite ? '#ffd17b' : '#ff9b72';
      ctx.lineWidth = 1.5;
      ctx.setLineDash([2, 5]);
      ctx.lineDashOffset = -time * 12;
      ctx.beginPath(); ctx.moveTo(drop.x, drop.y); ctx.lineTo(player.x, player.y - 24); ctx.stroke();
      ctx.restore();
    }
    if (drop.elite || medkit) {
      ctx.strokeStyle = medkit ? '#a8f4bf' : '#ffd17b'; ctx.lineWidth = 1.5;
      const ring = prefersReducedMotion ? 14 : 14 + Math.sin(time * 7) * 2;
      ctx.beginPath(); ctx.ellipse(drop.x, drop.y, ring, ring + 3, 0, 0, Math.PI * 2); ctx.stroke();
    }
    if (medkit) {
      ctx.fillStyle = '#154b37'; ctx.strokeStyle = '#c9ffdb'; ctx.lineWidth = 2;
      ctx.shadowColor = '#8ff0ad'; ctx.shadowBlur = 18;
      ctx.beginPath(); ctx.arc(drop.x, drop.y, 10, 0, Math.PI * 2); ctx.fill(); ctx.stroke();
      ctx.shadowBlur = 0; ctx.fillStyle = '#edfff2';
      ctx.fillRect(drop.x - 2.2, drop.y - 6, 4.4, 12); ctx.fillRect(drop.x - 6, drop.y - 2.2, 12, 4.4);
      text('ХИЛКА', drop.x, drop.y - 16, 6, '#c9ffdb', 'center', 950);
    } else {
      ctx.fillStyle = drop.elite ? '#ffc65b' : '#ff433b';
      ctx.shadowColor = drop.elite ? '#ffc65b' : '#ff433b'; ctx.shadowBlur = drop.elite ? 16 : 8;
      drawSauceDrop(drop.x, drop.y, drop.elite ? 8 : 7, drop.elite);
      ctx.shadowBlur = 0;
      text('+', drop.x, drop.y + 5, 8, '#fff2d5', 'center', 950);
    }
    ctx.restore();
  }

  function drawParticles() {
    for (const particle of particles) {
      ctx.globalAlpha = Math.max(0, Math.min(1, particle.life * 2));
      ctx.fillStyle = particle.color;
      const size = particle.size * Math.max(0.2, particle.life);
      ctx.save();
      ctx.translate(particle.x, particle.y);
      ctx.rotate(particle.rotation);
      ctx.beginPath();
      if (particle.shape === 'drop') {
        ctx.moveTo(0, -size * 1.25);
        ctx.quadraticCurveTo(size * 0.95, -size * 0.05, size * 0.66, size * 0.72);
        ctx.quadraticCurveTo(0, size * 1.28, -size * 0.66, size * 0.72);
        ctx.quadraticCurveTo(-size * 0.95, -size * 0.05, 0, -size * 1.25);
      } else if (particle.shape === 'shard') {
        ctx.moveTo(0, -size * 1.45);
        ctx.lineTo(size * 0.52, -size * 0.08);
        ctx.lineTo(size * 0.18, size * 1.15);
        ctx.lineTo(-size * 0.48, size * 0.2);
      } else {
        ctx.moveTo(0, -size * 1.25);
        ctx.lineTo(size * 0.34, -size * 0.2);
        ctx.lineTo(size * 1.18, 0);
        ctx.lineTo(size * 0.34, size * 0.2);
        ctx.lineTo(0, size * 1.25);
        ctx.lineTo(-size * 0.34, size * 0.2);
        ctx.lineTo(-size * 1.18, 0);
        ctx.lineTo(-size * 0.34, -size * 0.2);
      }
      ctx.closePath();
      ctx.fill();
      ctx.restore();
    }
    ctx.globalAlpha = 1;
  }

  function drawDashStains() {
    if (prefersReducedMotion) return;
    for (const stain of dashStains) {
      const fade = clamp(stain.life / stain.maxLife, 0, 1);
      ctx.save();
      ctx.globalAlpha = fade * 0.62;
      ctx.fillStyle = '#d42e32';
      ctx.shadowColor = '#ff493c';
      ctx.shadowBlur = 9 * fade;
      ctx.beginPath();
      ctx.ellipse(stain.x, stain.y, stain.size * (1.35 - fade * 0.25), stain.size * 0.48, 0, 0, Math.PI * 2);
      ctx.fill();
      ctx.shadowBlur = 0;
      ctx.globalAlpha *= 0.78;
      ctx.strokeStyle = '#ffb36b';
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.moveTo(stain.x - stain.size * 0.65, stain.y - 2);
      ctx.lineTo(stain.x + stain.size * 0.55, stain.y - 2);
      ctx.stroke();
      ctx.restore();
    }
  }

  function drawDamageNumbers() {
    for (const item of damageNumbers) {
      const progress = 1 - item.life / item.maxLife;
      const alpha = prefersReducedMotion ? 1 : clamp(progress * 7, 0, 1) * clamp((1 - progress) * 3, 0, 1);
      const rise = prefersReducedMotion ? 0 : progress * 28;
      const label = item.heal ? `+${item.damage}` : item.blocked ? `БЛОК · −${item.damage}` : `−${item.damage}`;
      ctx.save();
      ctx.globalAlpha = alpha;
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.font = `900 ${item.counter || item.isPlayer ? 15 : item.isBoss ? 14 : 12}px Inter, system-ui, sans-serif`;
      ctx.lineJoin = 'round';
      ctx.lineWidth = item.counter ? 4 : 3;
      ctx.strokeStyle = '#170d0de8';
      ctx.strokeText(label, item.x, item.y - rise);
      ctx.fillStyle = item.heal ? '#a7e6b1' : item.blocked ? '#ded2bd' : item.isPlayer ? '#ff7168' : item.counter ? '#ffe09a' : item.isBoss ? '#ffab8f' : '#fff0df';
      ctx.fillText(label, item.x, item.y - rise);
      if (item.counter && !item.heal) {
        ctx.font = '850 7px Inter, system-ui, sans-serif';
        ctx.fillStyle = '#ffe6b0';
        ctx.fillText('КОНТРАТАКА ×1.55', item.x, item.y - rise + 15);
      }
      ctx.restore();
    }
  }

  function drawHud() {
    const stage = levels[levelIndex];
    updateTouchControls();
    rounded(18, 15, 270, 48, 5, '#111012e8');
    ctx.strokeStyle = '#65403e'; ctx.lineWidth = 1; ctx.strokeRect(18.5, 15.5, 269, 47);
    ctx.fillStyle = '#ec463e'; ctx.beginPath(); ctx.arc(32, 31, 4, 0, Math.PI * 2); ctx.fill();
    text(`DROP · ${String(Math.ceil(player.hp)).padStart(3, '0')}`, 44, 34, 9, '#f0ded7', 'left', 900);
    rounded(31, 45, 240, 7, 2, '#302a2b');
    const hp = ctx.createLinearGradient(31, 45, 271, 52); hp.addColorStop(0, player.hp < 35 ? '#fa342f' : '#f2473c'); hp.addColorStop(1, '#ff9172');
    const hpWidth = 240 * player.hp / player.maxHp;
    const hpTrailWidth = 240 * player.hpTrail / player.maxHp;
    if (hpTrailWidth > hpWidth + 0.5) rounded(31, 45, hpTrailWidth, 7, 2, '#e5a34f');
    rounded(31, 45, hpWidth, 7, 2, hp);

    rounded(342, 15, 276, 48, 5, '#111012e8');
    ctx.strokeStyle = '#65403e'; ctx.strokeRect(342.5, 15.5, 275, 47);
    text(`LEVEL ${String(levelIndex + 1).padStart(2, '0')} / 05`, 480, 31, 9, '#d8cac1', 'center', 900);
    const musicUnavailable = musicState.includes('NOT ADDED') || musicState.includes('UNAVAILABLE');
    text(musicState, 480, 48, 8, musicUnavailable ? '#b99483' : '#f4c08d', 'center', 700);

    if (boss?.alive && boss.state !== 'defeated') {
      rounded(672, 15, 270, 48, 5, '#111012e8');
      ctx.strokeStyle = boss.phase > 1 ? '#9e453e' : '#65403e'; ctx.strokeRect(672.5, 15.5, 269, 47);
      text('KITCHEN BOSS', 685, 29, 8, '#a69b98', 'left', 800);
      text(stage.boss, 685, 44, 11, '#f4e9df', 'left', 950);
      text(`PHASE 0${boss.phase}`, 928, 31, 8, boss.phase > 1 ? '#ff7968' : '#ddb994', 'right', 900);
      rounded(685, 49, 243, 6, 2, '#302a2b');
      const bar = ctx.createLinearGradient(685, 49, 928, 55); bar.addColorStop(0, boss.phase > 1 ? '#ff463c' : '#e7a55d'); bar.addColorStop(1, boss.phase > 1 ? '#a91e28' : '#ffcc83');
      const hpWidth = 243 * boss.hp / boss.maxHp;
      const hpTrailWidth = 243 * (boss.hpTrail ?? boss.hp) / boss.maxHp;
      if (hpTrailWidth > hpWidth + 0.5) rounded(685, 49, hpTrailWidth, 6, 2, '#e5a34f');
      rounded(685, 49, hpWidth, 6, 2, bar);
      ctx.fillStyle = '#fff0d2';
      [0.55, 0.24].forEach(threshold => ctx.fillRect(685 + 243 * threshold - 1, 47, 2, 10));
    } else {
      rounded(672, 15, 270, 48, 5, '#111012e8');
      if (boss?.state === 'defeated') text('BOSS DEFEATED', 807, 35, 10, '#ffce8d', 'center', 900);
      else if (stage.finale) text('FINAL RUN', 807, 35, 10, '#ffce8d', 'center', 900);
      else {
        const totalWaves = stage.waves;
        const label = bossSpawned ? 'BOSS ARENA' : waveIndex >= 0 ? `WAVE ${waveIndex + 1} / ${totalWaves} · ${enemies.filter(enemy => enemy.alive).length + waveQueue.length} LEFT` : 'THE KITCHEN IS QUIET';
        text(label, 807, 35, 10, '#ffce8d', 'center', 900);
      }
    }
    // Keep the sauce trail in the world; omit the redundant full-width HUD strip.
    if (compactControlsQuery?.matches) {
      const enemiesLeft = enemies.reduce((count, enemy) => count + Number(enemy.alive), 0) + waveQueue.length;
      const status = stage.finale ? 'ФИНАЛЬНЫЙ ЗАБЕГ' : boss?.alive ? `БОСС · ФАЗА ${boss.phase}` : `ВОЛНА ${Math.max(1, waveIndex + 1)}/${stage.waves} · ${enemiesLeft} ОСТАЛОСЬ`;
      const hudScale = compactHudScale;
      const hudWidth = clamp(140 * hudScale, 140, 360);
      const hudHeight = clamp(38 * hudScale, 38, 78);
      const hudX = (W - hudWidth) / 2;
      const hudY = H - hudHeight - 4;
      const statusSize = clamp(9 * hudScale, 9, 24);
      const timerSize = clamp(10 * hudScale, 10, 26);
      rounded(hudX, hudY, hudWidth, hudHeight, 4, '#111012df');
      ctx.strokeStyle = '#65403e'; ctx.strokeRect(hudX + 0.5, hudY + 0.5, hudWidth - 1, hudHeight - 1);
      text(status, W / 2, hudY + hudHeight * 0.48, statusSize, '#ffe3cf', 'center', 850);
      text(formatTime(gameState.runSeconds), W / 2, hudY + hudHeight * 0.83, timerSize, '#e8bb8a', 'center', 850);
    } else {
      drawAbilityBar();
      if (!stage.finale) text(`ЗАЧИЩЕНО ${enemiesDefeated} / ${totalEnemies}`, 22, 523, 8, '#ffe3cf', 'left', 800);
      text(`ЗАБЕГ ${formatTime(gameState.runSeconds)}`, W - 22, 523, 8, '#e8bb8a', 'right', 850);
    }
  }

  function drawStageProgress(stage) {
    const x = 24;
    const y = 73;
    const width = W - 48;
    const color = ['#ff765e', '#ffc177', '#9bdfe9', '#ee8fca', '#ffdc8a'][levelIndex];
    const progress = clamp(player.x / Math.max(1, worldWidth - 42), 0, 1);
    ctx.save();
    rounded(x, y, width, 3, 1.5, '#130f11cc');
    const routeFill = ctx.createLinearGradient(x, y, x + width * progress, y);
    routeFill.addColorStop(0, color);
    routeFill.addColorStop(1, '#fff0cf');
    rounded(x, y, width * progress, 3, 1.5, routeFill);
    if (!stage.finale) {
      for (let i = 0; i < stage.waves; i++) {
        const markerX = x + width * ((i + 1) / (stage.waves + 1));
        ctx.fillStyle = i < waveIndex ? '#fff0cf' : '#5a4844';
        ctx.fillRect(markerX - 1, y - 2, 2, 7);
      }
    } else {
      for (const obstacle of finaleObstacles) {
        const markerX = x + width * obstacle.x / worldWidth;
        ctx.fillStyle = obstacle.cleared ? '#fff0cf' : '#865d4c';
        ctx.fillRect(markerX - 1, y - 2, 2, 7);
      }
    }
    const markerX = x + width * progress;
    ctx.fillStyle = '#fff0dc';
    ctx.strokeStyle = color;
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.arc(markerX, y + 1.5, 4, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();
    const goalX = x + width - 2;
    ctx.fillStyle = stage.finale ? '#fff0bc' : '#ffcc85';
    ctx.beginPath();
    ctx.moveTo(goalX, y - 4);
    ctx.lineTo(goalX + 4, y + 1.5);
    ctx.lineTo(goalX, y + 7);
    ctx.lineTo(goalX - 4, y + 1.5);
    ctx.closePath();
    ctx.fill();
    ctx.restore();
  }

  function updateTouchControls() {
    const cooldowns = {
      attack: { remaining: player.attackCooldown, duration: 0.38, unlocked: true },
      dash: { remaining: player.dashCooldown, duration: 1, unlocked: gameState.dash },
      whip: { remaining: player.whipCooldown, duration: 1.05, unlocked: chapterAbilities().special },
      heavy: { remaining: player.heavyCooldown, duration: 1.35, unlocked: gameState.heavy },
      kick: { remaining: player.kickCooldown, duration: 0.72, unlocked: chapterAbilities().kick }
    };
    document.querySelectorAll('#mobileControls [data-press]').forEach(button => {
      const action = cooldowns[button.dataset.press];
      if (!action) return;
      button.hidden = !action.unlocked;
      if (button.dataset.press === 'whip') { button.textContent = chapterAbilities().upgraded ? 'ОГОНЬ' : 'ХЛЫСТ'; button.setAttribute('aria-label', chapterAbilities().specialName); }
      if (button.dataset.press === 'kick') {
        const label = 'НОГА';
        const accessibleLabel = 'Удар ногой';
        if (button.textContent !== label) button.textContent = label;
        if (button.getAttribute('aria-label') !== accessibleLabel) button.setAttribute('aria-label', accessibleLabel);
      }
      const charge = Math.round(clamp(1 - action.remaining / action.duration, 0, 1) * 100) / 100;
      const angle = `${charge * 360}deg`;
      if (button.dataset.chargeAngle !== angle) {
        button.style.setProperty('--charge-angle', angle);
        button.dataset.chargeAngle = angle;
      }
      button.classList.toggle('is-locked', !action.unlocked);
      button.classList.toggle('is-ready', action.unlocked && charge >= 1);
    });
  }

  function drawAbilityBar() {
    const actions = [
      { key: 'J/О', name: 'УДАР', cooldown: player.attackCooldown, duration: 0.38 },
      chapterAbilities().special && { key: 'L/Д', name: chapterAbilities().upgraded ? 'ОГОНЬ' : 'ХЛЫСТ', cooldown: player.whipCooldown, duration: 1.05 },
      chapterAbilities().kick && { key: 'V/М', name: 'НОГА', cooldown: player.kickCooldown, duration: 0.72 }
    ].filter(Boolean);
    const width = 96;
    const gap = 5;
    const total = actions.length * width + (actions.length - 1) * gap;
    const start = (W - total) / 2;
    actions.forEach((action, index) => {
      const x = start + index * (width + gap);
      const available = action.cooldown <= 0;
      rounded(x, 493, width, 37, 4, available ? '#171315ed' : '#111012e8');
      ctx.strokeStyle = available ? '#75433b' : '#403536';
      ctx.lineWidth = 1;
      ctx.strokeRect(x + 0.5, 493.5, width - 1, 36);
      text(action.key, x + 7, 507, 7, available ? '#ff826a' : '#8c7770', 'left', 950);
      text(action.name, x + 30, 507, 7, available ? '#f5e8dd' : '#9d918b', 'left', 850);
      text(available ? 'ГОТОВО' : `${action.cooldown.toFixed(1)}с`, x + width - 7, 507, 6, available ? '#e5bd8b' : '#b89d8b', 'right', 800);
      rounded(x + 8, 516, width - 16, 4, 2, '#332c2d');
      const charge = clamp(1 - action.cooldown / action.duration, 0, 1);
      if (charge > 0) rounded(x + 8, 516, (width - 16) * charge, 4, 2, available ? '#ff6755' : '#c47a58');
    });
  }

  function drawToast() {
    if (bossIntro > 0 && boss?.alive) {
      const alpha = Math.min(1, (2.35 - bossIntro) * 3, bossIntro * 1.8);
      ctx.globalAlpha = alpha;
      rounded(270, 106, 420, 89, 4, '#100d10ed');
      ctx.strokeStyle = '#ff7655'; ctx.strokeRect(270.5, 106.5, 419, 88);
      text('KITCHEN BOSS', 480, 126, 8, '#ffc887', 'center', 900);
      text(levels[levelIndex].boss, 480, 149, 17, '#fff0df', 'center', 950);
      text(levels[levelIndex].bossLine || 'ЭТА КУХНЯ ЕЩЁ НЕ СКАЗАЛА ПОСЛЕДНЕЕ СЛОВО.', 480, 164, 7, '#e7ad8e', 'center', 800);
      const tips = ['ПРЫГАЙ ЧЕРЕЗ ФРИ · НЕ СТОЙ В МАСЛЕ', 'БУМЕРАНГ ВЕРНЁТСЯ · ПРЫГАЙ ЧЕРЕЗ СЫР', 'УХОДИ ОТ МЕТЕОРА · ПЕРЕПРЫГНИ ТРЕЩИНЫ', 'ПАСТА ЗАМЕДЛЯЕТ · УХОДИ ОТ ЩУПАЛЕЦ', 'НЕ СТОЙ ПОД КОТЛЕТОЙ · ПРЫГАЙ ЧЕРЕЗ ПЛАМЯ'];
      text(tips[levelIndex], 480, 184, 7, '#ffe0b2', 'center', 850);
      ctx.globalAlpha = 1;
      return;
    }
    const alpha = Math.min(1, toastTime * 1.7);
    ctx.globalAlpha = alpha;
    rounded(318, 78, 324, 36, 4, '#100d10df');
    ctx.strokeStyle = '#9e4a43'; ctx.strokeRect(318.5, 78.5, 323, 35);
    text(toast, 480, 101, 10, '#fff0dd', 'center', 900);
    ctx.globalAlpha = 1;
  }

  function drawStreak() {
    if ((streakKills < 2 || streakTime <= 0) && sauceRushTime <= 0 || bossIntro > 0) return;
    const remainingRatio = sauceRushTime > 0 ? sauceRushTime / (sauceRushMaxTime || 1) : streakTime / 5.2;
    const alpha = Math.min(1, Math.max(streakTime * 2.8, sauceRushTime * 2.8));
    const pulse = prefersReducedMotion ? 1 : 1 + (1 - Math.min(1, remainingRatio)) * 0.12;
    ctx.save();
    ctx.globalAlpha = alpha;
    ctx.translate(480, 143);
    ctx.scale(pulse, pulse);
    rounded(-112, -24, 224, 49, 5, '#120e10e8');
    ctx.strokeStyle = streakKills >= 10 ? '#ffbd68' : streakKills >= 5 ? '#ff7561' : '#9b5147';
    ctx.lineWidth = streakKills >= 10 ? 2 : 1;
    ctx.strokeRect(-111.5, -23.5, 223, 48);
    text(sauceRushTime > 0 ? 'SAUCE RUSH' : `СЕРИЯ × ${String(streakKills).padStart(2, '0')}`, 0, -8, 13, sauceRushTime > 0 || streakKills >= 10 ? '#ffd28a' : '#fff0df', 'center', 950);
    text(sauceRushTime > 0 ? `УРОН +20% · ${sauceRushTime.toFixed(1)} СЕК` : `ДО SAUCE RUSH · ${Math.max(0, 5 - streakKills)}`, 0, 8, 7, sauceRushTime > 0 ? '#ffbd68' : '#d2b2a1', 'center', 850);
    ctx.restore();
  }

  function resetGameInput() {
    keys.clear(); Object.keys(touch).forEach(direction => { touch[direction] = false; });
    touchAttackTimers.forEach(timer => window.clearInterval(timer)); touchAttackTimers.clear();
  }

  function stopGameLoop() {
    if (gameFrameId) cancelAnimationFrame(gameFrameId);
    gameFrameId = 0;
  }

  function scheduleGameFrame() {
    if (!running || gameFrameId) return;
    gameFrameId = requestAnimationFrame(now => { gameFrameId = 0; loop(now); });
  }

  function loop(now) {
    if (!running) return;
    const dt = Math.min(0.033, (now - lastTime) / 1000 || 0);
    lastTime = now;
    if (hitStop > 0) hitStop = Math.max(0, hitStop - dt);
    else update(dt);
    draw();
    if (running) scheduleGameFrame();
  }

  player = newPlayer();
  enemies = [];
  boss = null;
  hazards = [];
  particles = [];
  drops = [];
  damageNumbers = [];
  showTitle();
  initializeTelegramShell();
  if (saveRecoveredFromBackup) {
    saveProgress();
    announce('Основное сохранение было повреждено. Игра восстановила последнюю резервную копию.');
  }
  playCutscene();

  function initializeTelegramShell() {
    if (!telegramApp) return;
    try { telegramApp.setHeaderColor?.('#101113'); } catch { /* Older Telegram clients may not support custom header colors. */ }
    try { telegramApp.setBackgroundColor?.('#101113'); } catch { /* Keep the default Telegram shell if the method is unsupported. */ }
    try { telegramApp.expand?.(); } catch { /* Expansion is optional in clients that manage their own viewport. */ }
    try { telegramApp.ready?.(); } catch { /* The game remains playable if a legacy client ignores ready(). */ }
  }
})();
