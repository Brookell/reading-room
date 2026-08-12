import * as THREE from "three";
import { DRACOLoader } from "three/addons/loaders/DRACOLoader.js";
import { GLTFLoader } from "three/addons/loaders/GLTFLoader.js";
import { OrbitControls } from "three/addons/controls/OrbitControls.js";

const MODEL_URL = "./assets/room/models/brooke-study-web.glb?v=20260728-2";
const POSTER_TEXTURE_URL = "./assets/room/textures/delphine-behind-camera.png?v=20260729-1";
const INTEREST_PHOTOS = {
  reading: {
    count: 3,
    caption: "Reading / 01",
    note: "Pages, margins, and the places I return to quietly.",
  },
  films: {
    count: 2,
    caption: "Films / 01",
    note: "Frames and small observations collected along the way.",
  },
  music: {
    count: 5,
    caption: "Music / 01",
    note: "A few scenes from the songs and rooms that stay with me.",
  },
  sports: {
    count: 6,
    caption: "Sports / 01",
    note: "Practice, movement, and the patience of repetition.",
  },
};

const CURATION_DATA = {
  reading: {
    title: "Reading & Film",
    description: "A quiet observer of the world, gathering fragments of life through literature and cinema. Stories that make room for a different pace of looking.",
    icon: "book-open",
    images: ["./assets/photos/interests/web/reading/01.jpg", "./assets/photos/interests/web/reading/02.jpg", "./assets/photos/interests/web/reading/03.jpg"],
  },
  music: {
    title: "Music",
    description: "Voice notes, records, and first takes that change the temperature of a room. I keep music close for the spaces it opens.",
    icon: "music-2",
    images: ["./assets/photos/interests/web/music/01.jpg", "./assets/photos/interests/web/music/02.jpg", "./assets/photos/interests/web/music/03.jpg", "./assets/photos/interests/web/music/04.jpg", "./assets/photos/interests/web/music/05.jpg"],
  },
  sports: {
    title: "Sports",
    description: "Practice, movement, and the patience of repetition. I return to sport for the quiet focus it leaves behind.",
    icon: "activity",
    images: ["./assets/photos/interests/web/sports/01.jpg", "./assets/photos/interests/web/sports/02.jpg", "./assets/photos/interests/web/sports/03.jpg", "./assets/photos/interests/web/sports/04.jpg", "./assets/photos/interests/web/sports/05.jpg", "./assets/photos/interests/web/sports/06.jpg"],
  },
  photography: {
    title: "Photography",
    description: "Light, distance, and the small details that ask to be kept. A collection of moments from the camera rolls on my desk.",
    icon: "camera",
    images: ["./assets/photos/interests/web/films/01.jpg", "./assets/photos/interests/web/films/02.jpg", "./assets/photos/interests/web/reading/01.jpg"],
  },
};
const DESK_CAMERA_MODEL_URL = "./assets/room/models/camera-kiev-4am-helios.glb?v=20260729-1";
const FILM_ROLL_MODEL_URL = "./assets/room/models/film-roll-35mm.glb?v=20260811-1";
const COFFEE_CUP_MODEL_URL = "./assets/room/models/coffee-cup.glb?v=20260730-2";
const BOOKSHELF_EMBED_URL = "./bookshelf/?v=20260811-24";
const DRACO_URL = "./vendor/three/draco/";
const MINIMUM_LOADING_TIME = 1500;
const HOME_VIEW_DISTANCE_SCALE = 0.8;
const HOME_VIEW_VERTICAL_OFFSET = 0.02;
const OBJECT_FOCUS_DURATION = 1450;
const HOME_RETURN_DURATION = 1220;
const loadingStartedAt = performance.now();

const app = document.querySelector("#app");
const canvas = document.querySelector("#scene");
const loadingOverlay = document.querySelector("#loadingOverlay");
const loadingBar = document.querySelector("#loadingBar");
const loadingPhase = document.querySelector("#loadingPhase");
const loadingText = document.querySelector("#loadingText");
const loadingPercent = document.querySelector("#loadingPercent");
const errorNotice = document.querySelector("#errorNotice");
const lampToggle = document.querySelector("#lampToggle");
const timeToggle = document.querySelector("#timeToggle");
const indexToggle = document.querySelector("#indexToggle");
const objectMenu = document.querySelector("#objectMenu");
const focusControls = document.querySelector("#focusControls");
const hoverLabel = document.querySelector("#hoverLabel");
const laptopHotspot = document.querySelector("#laptopHotspot");
const contentPanel = document.querySelector("#contentPanel");
const panelClose = document.querySelector("#panelClose");
const panelEyebrow = document.querySelector("#panelEyebrow");
const panelTitle = document.querySelector("#panelTitle");
const panelBody = document.querySelector("#panelBody");
const terminalOverlay = document.querySelector("#terminalOverlay");
const terminalShell = document.querySelector(".terminal-shell");
const terminalOutput = document.querySelector("#terminalOutput");
const terminalForm = document.querySelector("#terminalForm");
const terminalInput = document.querySelector("#terminalInput");
const rainingIntro = document.querySelector("#rainingIntro");
const rainingIntroToggle = document.querySelector("#rainingIntroToggle");
const rainingIntroCharacters = document.querySelector("#rainingIntroCharacters");
const rainingIntroTitle = document.querySelector("#rainingIntroTitle");
const rainingTuner = document.querySelector("#rainingTuner");
const rainingTextContent = document.querySelector("#rainingTextContent");
const rainingColor = document.querySelector("#rainingColor");
const rainingColorValue = document.querySelector("#rainingColorValue");
const rainingSave = document.querySelector("#rainingSave");
const rainingSaveStatus = document.querySelector("#rainingSaveStatus");
const rainingReset = document.querySelector("#rainingReset");
const rainingTunerToggle = document.querySelector("#rainingTunerToggle");
const rainingTunerToggleLabel = document.querySelector("#rainingTunerToggleLabel");
const rainingSpeed = document.querySelector("#rainingSpeed");
const rainingSpeedNumber = document.querySelector("#rainingSpeedNumber");
const rainingTextSpeed = document.querySelector("#rainingTextSpeed");
const rainingTextSpeedNumber = document.querySelector("#rainingTextSpeedNumber");
const rainingScrambleSpeed = document.querySelector("#rainingScrambleSpeed");
const rainingScrambleSpeedNumber = document.querySelector("#rainingScrambleSpeedNumber");

window.lucide?.createIcons({ attrs: { "aria-hidden": "true" } });

const rainingIntroDefaults = {
  color: "#f367c2",
  fallSpeed: 15,
  textDisplaySeconds: 2.4,
  textScrambleSeconds: 0.6,
  phrases: [
    "Hi, I'm Brooke.",
    "LIAO YUXIN",
    "‘I am rooted, but I flow.’",
  ],
};

let rainingIntroPhrases = [...rainingIntroDefaults.phrases];

const RAINING_SETTINGS_KEY = "brooke-study-raining-settings-v3";

function getStoredRainingSettings() {
  try {
    const stored = JSON.parse(window.localStorage.getItem(RAINING_SETTINGS_KEY) || "null");
    if (!stored || typeof stored !== "object") return { ...rainingIntroDefaults };
    const asNumber = (value, fallback, minimum, maximum) => {
      const number = Number(value);
      return Number.isFinite(number) ? Math.min(maximum, Math.max(minimum, number)) : fallback;
    };
    return {
      color: typeof stored.color === "string" && /^#[0-9a-f]{6}$/i.test(stored.color)
        ? stored.color
        : rainingIntroDefaults.color,
      fallSpeed: asNumber(stored.fallSpeed, rainingIntroDefaults.fallSpeed, 2, 60),
      textDisplaySeconds: asNumber(stored.textDisplaySeconds, rainingIntroDefaults.textDisplaySeconds, 0.8, 8),
      textScrambleSeconds: asNumber(stored.textScrambleSeconds, rainingIntroDefaults.textScrambleSeconds, 0.4, 3),
      collapsed: stored.collapsed === true,
      phrases: Array.isArray(stored.phrases) && stored.phrases.some((phrase) => typeof phrase === "string" && phrase.trim())
        ? stored.phrases.map((phrase) => String(phrase).trim()).filter(Boolean).slice(0, 12)
        : [...rainingIntroDefaults.phrases],
    };
  } catch {
    return { ...rainingIntroDefaults };
  }
}

function startRainingIntro() {
  if (!rainingIntro || !rainingIntroCharacters || !rainingIntroTitle) return;

  const storedSettings = getStoredRainingSettings();
  rainingIntroPhrases = [...storedSettings.phrases];
  rainingIntro.style.setProperty("--raining-accent", storedSettings.color);
  if (rainingColor) rainingColor.value = storedSettings.color;
  if (rainingColorValue) rainingColorValue.textContent = storedSettings.color.toUpperCase();
  if (rainingSpeed) rainingSpeed.value = String(storedSettings.fallSpeed);
  if (rainingSpeedNumber) rainingSpeedNumber.value = String(storedSettings.fallSpeed);
  if (rainingTextSpeed) rainingTextSpeed.value = String(storedSettings.textDisplaySeconds);
  if (rainingTextSpeedNumber) rainingTextSpeedNumber.value = String(storedSettings.textDisplaySeconds);
  if (rainingScrambleSpeed) rainingScrambleSpeed.value = String(storedSettings.textScrambleSeconds);
  if (rainingScrambleSpeedNumber) rainingScrambleSpeedNumber.value = String(storedSettings.textScrambleSeconds);
  if (rainingTextContent) rainingTextContent.value = rainingIntroPhrases.join("\n");
  rainingTuner?.querySelectorAll("[data-raining-color]").forEach((button) => {
    button.setAttribute("aria-pressed", String(button.dataset.rainingColor.toUpperCase() === storedSettings.color.toUpperCase()));
  });
  rainingTuner?.classList.toggle("is-collapsed", storedSettings.collapsed);
  if (rainingTunerToggle) {
    rainingTunerToggle.setAttribute("aria-expanded", String(!storedSettings.collapsed));
    rainingTunerToggle.title = storedSettings.collapsed ? "Expand controls" : "Collapse controls";
  }
  if (rainingTunerToggleLabel) rainingTunerToggleLabel.textContent = storedSettings.collapsed ? "Expand controls" : "Collapse controls";

  const glyphs = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789!@#$%^&*()_+-=[]{}|;:,.<>?";
  const titleGlyphs = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789!@#$%^*-+=?";
  const characters = [];
  const characterCount = Math.min(220, Math.max(110, Math.floor((window.innerWidth * window.innerHeight) / 6500)));
  let speedPixelsPerSecond = Number(rainingSpeed?.value || 15);
  let textDisplaySeconds = Number(rainingTextSpeed?.value || 2.4);
  let textScrambleSeconds = Number(rainingScrambleSpeed?.value || 0.6);
  let saveStatusTimer = 0;

  const persistRainingSettings = () => {
    try {
      window.localStorage.setItem(RAINING_SETTINGS_KEY, JSON.stringify({
        color: rainingColor?.value || rainingIntroDefaults.color,
        fallSpeed: Number(rainingSpeed?.value || rainingIntroDefaults.fallSpeed),
        textDisplaySeconds: Number(rainingTextSpeed?.value || rainingIntroDefaults.textDisplaySeconds),
        textScrambleSeconds: Number(rainingScrambleSpeed?.value || rainingIntroDefaults.textScrambleSeconds),
        collapsed: rainingTuner?.classList.contains("is-collapsed") === true,
        phrases: [...rainingIntroPhrases],
      }));
      return true;
    } catch {
      // Storage can be unavailable in privacy-restricted contexts.
      return false;
    }
  };

  for (let index = 0; index < characterCount; index += 1) {
    const element = document.createElement("span");
    element.className = "raining-intro-character";
    element.textContent = glyphs[Math.floor(Math.random() * glyphs.length)];
    element.style.left = `${Math.random() * 100}%`;
    element.style.transform = `translateY(${Math.random() * 105}vh)`;
    rainingIntroCharacters.append(element);
    characters.push({ element, speedFactor: 0.55 + Math.random() * 0.9, y: Math.random() * 105 });
  }

  let lastTime = performance.now();
  let activeTimer = 0;
  let titleTimer = 0;
  let titleCycleTimer = 0;
  let currentPhraseText = rainingIntroPhrases[0];
  let phraseIndex = 0;
  let introAnimationFrame = 0;

  const animate = (now) => {
    const delta = Math.min(40, now - lastTime);
    lastTime = now;
    const viewportHeight = Math.max(1, window.innerHeight);
    characters.forEach((character) => {
      character.y += (speedPixelsPerSecond * character.speedFactor * delta * 0.1) / viewportHeight;
      if (character.y > 108) {
        character.y = -6;
        character.element.textContent = glyphs[Math.floor(Math.random() * glyphs.length)];
      }
      character.element.style.transform = `translateY(${character.y}vh)`;
    });
    introAnimationFrame = requestAnimationFrame(animate);
  };

  const updateActive = () => {
    characters.forEach(({ element }) => element.classList.remove("is-active"));
    const activeCount = Math.floor(Math.random() * 3) + 3;
    for (let index = 0; index < activeCount; index += 1) {
      characters[Math.floor(Math.random() * characters.length)]?.element.classList.add("is-active");
    }
    activeTimer = window.setTimeout(updateActive, 120);
  };

  const scrambleTitle = (nextText) => {
    currentPhraseText = nextText;
    const currentText = rainingIntroTitle.textContent || "";
    const length = Math.max(currentText.length, nextText.length);
    const scrambleFrames = Math.max(24, Math.round(textScrambleSeconds * 60));
    rainingIntroTitle.classList.toggle("is-long", nextText.length > 13 && nextText.length <= 20);
    rainingIntroTitle.classList.toggle("is-very-long", nextText.length > 20);
    rainingIntroTitle.classList.add("is-scrambling");
    const queue = Array.from({ length }, (_, index) => ({
      from: currentText[index] || "",
      to: nextText[index] || "",
      start: Math.floor(Math.random() * scrambleFrames * 0.42),
      end: Math.floor(scrambleFrames * 0.48) + Math.floor(Math.random() * scrambleFrames * 0.42),
      char: "",
    }));
    const scrambleDurationMs = textScrambleSeconds * 1000;
    const flickerIntervalMs = Math.max(70, Math.min(400, textScrambleSeconds * 120));
    const scrambleStartedAt = performance.now();
    let lastFlickerAt = -Infinity;
    const renderTitle = (now) => {
      const elapsed = now - scrambleStartedAt;
      if (elapsed - lastFlickerAt < flickerIntervalMs && elapsed < scrambleDurationMs) {
        titleTimer = requestAnimationFrame(renderTitle);
        return;
      }

      lastFlickerAt = elapsed;
      const frame = Math.min(scrambleFrames, Math.floor((elapsed / scrambleDurationMs) * scrambleFrames));
      rainingIntroTitle.innerHTML = queue.map((item) => {
        if (frame >= item.end) return item.to;
        if (frame < item.start) return item.from;
        item.char = titleGlyphs[Math.floor(Math.random() * titleGlyphs.length)];
        return `<span class="dud">${item.char}</span>`;
      }).join("");
      if (elapsed < scrambleDurationMs) {
        titleTimer = requestAnimationFrame(renderTitle);
      } else {
        rainingIntroTitle.classList.remove("is-scrambling");
      }
    };
    cancelAnimationFrame(titleTimer);
    titleTimer = requestAnimationFrame(renderTitle);
  };

  const dismiss = () => {
    if (rainingIntro.classList.contains("is-dismissed")) return;
    rainingIntro.classList.add("is-dismissed");
    rainingIntro.setAttribute("aria-hidden", "true");
  };

  const requestDismiss = (event) => {
    if (event.target instanceof Element && event.target.closest("#rainingTuner")) return;
    dismiss();
  };

  const onKeyDown = (event) => {
    if (event.target instanceof Element && event.target.closest("#rainingTuner")) return;
    if (event.key === "Escape" || event.key === "Enter" || event.key === " ") dismiss();
  };

  const setPhraseContent = (value) => {
    const phrases = value
      .split(/\r?\n/)
      .map((phrase) => phrase.trim())
      .filter(Boolean)
      .slice(0, 12);
    if (!phrases.length) return;
    rainingIntroPhrases = phrases;
    phraseIndex = 0;
    if (rainingTextContent) rainingTextContent.value = phrases.join("\n");
    scrambleTitle(phrases[0]);
    if (titleCycleTimer) scheduleTitleCycle();
    persistRainingSettings();
  };

  rainingTextContent?.addEventListener("input", () => setPhraseContent(rainingTextContent.value));

  const setAccentColor = (value) => {
    const normalized = value.toUpperCase();
    rainingIntro.style.setProperty("--raining-accent", value);
    if (rainingColor) rainingColor.value = value;
    if (rainingColorValue) rainingColorValue.textContent = normalized;
    rainingTuner?.querySelectorAll("[data-raining-color]").forEach((button) => {
      button.setAttribute("aria-pressed", String(button.dataset.rainingColor.toUpperCase() === normalized));
    });
    persistRainingSettings();
  };

  rainingColor?.addEventListener("input", () => setAccentColor(rainingColor.value));
  rainingTuner?.querySelectorAll("[data-raining-color]").forEach((button) => {
    button.addEventListener("click", () => setAccentColor(button.dataset.rainingColor));
  });
  const setSpeed = (value) => {
    const nextSpeed = Math.min(60, Math.max(2, Math.round(Number(value) || 15)));
    speedPixelsPerSecond = nextSpeed;
    if (rainingSpeed) rainingSpeed.value = String(nextSpeed);
    if (rainingSpeedNumber) rainingSpeedNumber.value = String(nextSpeed);
    persistRainingSettings();
  };

  rainingSpeed?.addEventListener("input", () => setSpeed(rainingSpeed.value));
  rainingSpeedNumber?.addEventListener("input", () => setSpeed(rainingSpeedNumber.value));

  const setTextDisplaySeconds = (value) => {
    const nextSeconds = Math.min(8, Math.max(0.8, Math.round((Number(value) || 2.4) * 10) / 10));
    textDisplaySeconds = nextSeconds;
    if (rainingTextSpeed) rainingTextSpeed.value = String(nextSeconds);
    if (rainingTextSpeedNumber) rainingTextSpeedNumber.value = String(nextSeconds);
    if (titleCycleTimer) scheduleTitleCycle();
    persistRainingSettings();
  };

  rainingTextSpeed?.addEventListener("input", () => setTextDisplaySeconds(rainingTextSpeed.value));
  rainingTextSpeedNumber?.addEventListener("input", () => setTextDisplaySeconds(rainingTextSpeedNumber.value));

  const setTextScrambleSeconds = (value) => {
    const nextSeconds = Math.min(3, Math.max(0.4, Math.round((Number(value) || 0.6) * 10) / 10));
    textScrambleSeconds = nextSeconds;
    if (rainingScrambleSpeed) rainingScrambleSpeed.value = String(nextSeconds);
    if (rainingScrambleSpeedNumber) rainingScrambleSpeedNumber.value = String(nextSeconds);
    if (!rainingIntro.classList.contains("is-dismissed")) scrambleTitle(currentPhraseText);
    persistRainingSettings();
  };

  rainingScrambleSpeed?.addEventListener("input", () => setTextScrambleSeconds(rainingScrambleSpeed.value));
  rainingScrambleSpeedNumber?.addEventListener("input", () => setTextScrambleSeconds(rainingScrambleSpeedNumber.value));
  const setTunerCollapsed = (collapsed) => {
    rainingTuner?.classList.toggle("is-collapsed", collapsed);
    rainingTunerToggle?.setAttribute("aria-expanded", String(!collapsed));
    if (rainingTunerToggle) rainingTunerToggle.title = collapsed ? "Expand controls" : "Collapse controls";
    if (rainingTunerToggleLabel) rainingTunerToggleLabel.textContent = collapsed ? "Expand controls" : "Collapse controls";
    persistRainingSettings();
  };

  rainingTunerToggle?.addEventListener("click", () => {
    setTunerCollapsed(!rainingTuner?.classList.contains("is-collapsed"));
  });
  rainingSave?.addEventListener("click", () => {
    const saved = persistRainingSettings();
    if (rainingSaveStatus) rainingSaveStatus.textContent = saved ? "SAVED" : "SAVE FAILED";
    rainingSave.classList.toggle("is-saved", saved);
    window.clearTimeout(saveStatusTimer);
    saveStatusTimer = window.setTimeout(() => {
      if (rainingSaveStatus) rainingSaveStatus.textContent = "";
      rainingSave.classList.remove("is-saved");
    }, 1500);
    rainingSave.blur();
  });
  rainingReset?.addEventListener("click", () => {
    setAccentColor(rainingIntroDefaults.color);
    setPhraseContent(rainingIntroDefaults.phrases.join("\n"));
    setSpeed(rainingIntroDefaults.fallSpeed);
    setTextDisplaySeconds(rainingIntroDefaults.textDisplaySeconds);
    setTextScrambleSeconds(rainingIntroDefaults.textScrambleSeconds);
    rainingReset.blur();
  });

  rainingIntroToggle?.addEventListener("click", () => {
    rainingIntro.classList.remove("is-dismissed");
    rainingIntro.setAttribute("aria-hidden", "false");
    scheduleTitleCycle();
  });

  window.addEventListener("wheel", requestDismiss, { passive: true });
  window.addEventListener("touchstart", requestDismiss, { passive: true });
  window.addEventListener("keydown", onKeyDown);
  scrambleTitle(rainingIntroPhrases[0]);
  const cycleTitle = () => {
    if (rainingIntro.classList.contains("is-dismissed")) return;
    phraseIndex = (phraseIndex + 1) % rainingIntroPhrases.length;
    scrambleTitle(rainingIntroPhrases[phraseIndex]);
    scheduleTitleCycle();
  };
  const scheduleTitleCycle = () => {
    window.clearTimeout(titleCycleTimer);
    titleCycleTimer = window.setTimeout(cycleTitle, textDisplaySeconds * 1000);
  };
  scheduleTitleCycle();
  updateActive();
  introAnimationFrame = requestAnimationFrame(animate);
}

startRainingIntro();

const PANEL_CONTENT = {
  books: {
    eyebrow: "READING NOTES / SHELF 01",
    title: "A room built from sentences.",
    body: `
      <div class="project-browser-experience bookshelf-experience">
        <div class="bookshelf-intro">
          <p>Literature is where I practice paying attention. This reading room gathers the books I return to and the notes they leave behind.</p>
          <p class="project-entry-hint"><i data-lucide="mouse-pointer-click"></i><span>Click the preview to enter the Reading Room.</span></p>
        </div>
        <section class="project-preview-frame embedded-browser" data-project-browser="bookshelf" aria-label="Brooke's Reading Room website preview">
          <div class="embedded-browser-chrome">
            <div class="browser-address">127.0.0.1:4173/bookshelf/</div>
          </div>
          <div class="embedded-browser-viewport">
            <iframe src="${BOOKSHELF_EMBED_URL}" title="Brooke's Reading Room" loading="lazy" referrerpolicy="strict-origin-when-cross-origin"></iframe>
            <div class="browser-embed-loading" aria-hidden="true"><span>Opening Reading Room...</span></div>
            <span class="browser-preview-cue" aria-hidden="true"><i data-lucide="maximize-2"></i></span>
            <button class="browser-preview-hit" type="button" data-open-project-browser aria-label="Open Brooke's Reading Room"></button>
          </div>
        </section>
      </div>
    `,
  },
  turntable: {
    eyebrow: "LISTENING SHELF / SIDE A",
    title: "Needle down. Everything else can wait.",
    body: `
      <div class="project-browser-experience turntable-experience">
        <div class="turntable-intro">
          <p>Music changes the temperature of a room. This listening shelf is for records worth hearing without rushing.</p>
          <p class="project-entry-hint"><i data-lucide="mouse-pointer-click"></i><span>Click the preview to experience Cosmic Vinyl.</span></p>
        </div>
        <section class="project-preview-frame embedded-browser" data-project-browser="cosmic-vinyl" aria-label="Cosmic Vinyl website preview">
          <div class="embedded-browser-chrome">
            <div class="browser-address">brookell.github.io/cosmic-vinyl</div>
          </div>
          <div class="embedded-browser-viewport">
            <iframe src="https://brookell.github.io/cosmic-vinyl/" title="Cosmic Vinyl — 3D Gesture Audio Gallery" loading="lazy" referrerpolicy="strict-origin-when-cross-origin"></iframe>
            <div class="browser-embed-loading" aria-hidden="true"><span>Opening Cosmic Vinyl...</span></div>
            <span class="browser-preview-cue" aria-hidden="true"><i data-lucide="maximize-2"></i></span>
            <button class="browser-preview-hit" type="button" data-open-project-browser aria-label="Open the Cosmic Vinyl website"></button>
          </div>
        </section>
        <p class="vinyl-project-note"><strong>Cosmic Vinyl</strong> is a gesture-controlled 3D audio gallery built with MediaPipe and the Web Audio API.</p>
      </div>
    `,
  },
  coffee: {
    eyebrow: "DAILY RITUAL / CUP 01",
    title: "A small ritual, made visible.",
    body: `
      <div class="project-browser-experience phone-experience">
        <div class="phone-project-intro">
          <p>Cat-puccino turns an everyday coffee habit into a playful daily tracker, with a little personality in every cup.</p>
          <p class="project-entry-hint"><i data-lucide="mouse-pointer-click"></i><span>Tap the phone to experience Cat-puccino.</span></p>
        </div>
        <section class="project-preview-frame embedded-phone" data-project-browser="cat-puccino" aria-label="Cat-puccino mobile app preview">
          <span class="phone-speaker" aria-hidden="true"></span>
          <div class="embedded-phone-viewport">
            <iframe
              src="./assets/embeds/cat-puccino-preview.html"
              data-preview-src="./assets/embeds/cat-puccino-preview.html"
              data-live-src="./assets/embeds/cat-puccino-live.html"
              title="Cat-puccino — Daily Brew Tracker"
              loading="lazy"
              tabindex="-1"
              referrerpolicy="strict-origin-when-cross-origin"
            ></iframe>
            <div class="browser-embed-loading" aria-hidden="true"><span>Opening Cat-puccino...</span></div>
            <span class="browser-preview-cue" aria-hidden="true"><i data-lucide="maximize-2"></i></span>
            <button class="browser-preview-hit" type="button" data-open-project-browser aria-label="Open the Cat-puccino mobile app"></button>
          </div>
          <span class="phone-home-indicator" aria-hidden="true"></span>
        </section>
      </div>
    `,
  },
  poster: {
    eyebrow: "MOVING IMAGES / WALL 01",
    title: "Films I return to.",
    body: `
      <div class="project-browser-experience poster-experience">
        <div class="film-recommendations">
          <p>Her Gaze began with a desire for another truth. It is not simply a list of films, but an archaeology of perspective: a space for cinema that refuses stereotypes and makes room for the broken, the fluid, and the unruly.</p>
          <p class="project-entry-hint"><i data-lucide="mouse-pointer-click"></i><span>Click the preview to experience Her Gaze.</span></p>
        </div>
        <section class="project-preview-frame embedded-browser" aria-label="Her Gaze website preview">
          <div class="embedded-browser-chrome">
            <div class="browser-address">brookell.github.io/her-gaze</div>
          </div>
          <div class="embedded-browser-viewport">
            <iframe src="https://brookell.github.io/her-gaze/" title="Her Gaze — A Cinematic Collection" loading="lazy" referrerpolicy="strict-origin-when-cross-origin"></iframe>
            <div class="browser-embed-loading" aria-hidden="true"><span>Opening Her Gaze...</span></div>
            <span class="browser-preview-cue" aria-hidden="true"><i data-lucide="maximize-2"></i></span>
            <button class="browser-preview-hit" type="button" data-open-project-browser aria-label="Open the Her Gaze website"></button>
          </div>
        </section>
        <div class="film-recommendations">
          <p class="film-index-label">A SHORT WATCHLIST</p>
          <ol class="film-index">
            <li><button type="button" data-film-note="jeanne-dielman" aria-expanded="false" aria-controls="film-note-jeanne-dielman"><span class="film-index-copy"><strong>Jeanne Dielman</strong><span>Chantal Akerman · 1975</span></span><i class="film-index-chevron" data-lucide="chevron-down"></i></button></li>
            <li><button type="button" data-film-note="news-from-home" aria-expanded="false" aria-controls="film-note-news-from-home"><span class="film-index-copy"><strong>News from Home</strong><span>Chantal Akerman · 1977</span></span><i class="film-index-chevron" data-lucide="chevron-down"></i></button></li>
            <li><button type="button" data-film-note="meetings-of-anna" aria-expanded="false" aria-controls="film-note-meetings-of-anna"><span class="film-index-copy"><strong>The Meetings of Anna</strong><span>Chantal Akerman · 1978</span></span><i class="film-index-chevron" data-lucide="chevron-down"></i></button></li>
            <li><button type="button" data-film-note="cleo-from-5-to-7" aria-expanded="false" aria-controls="film-note-cleo-from-5-to-7"><span class="film-index-copy"><strong>Cleo from 5 to 7</strong><span>Agnes Varda · 1962</span></span><i class="film-index-chevron" data-lucide="chevron-down"></i></button></li>
            <li><button type="button" data-film-note="vagabond" aria-expanded="false" aria-controls="film-note-vagabond"><span class="film-index-copy"><strong>Vagabond</strong><span>Agnes Varda · 1985</span></span><i class="film-index-chevron" data-lucide="chevron-down"></i></button></li>
            <li><button type="button" data-film-note="gleaners-and-i" aria-expanded="false" aria-controls="film-note-gleaners-and-i"><span class="film-index-copy"><strong>The Gleaners and I</strong><span>Agnes Varda · 2000</span></span><i class="film-index-chevron" data-lucide="chevron-down"></i></button></li>
          </ol>
        </div>
      </div>
    `,
  },
  camera: {
    eyebrow: "PHOTOGRAPHS",
    title: "Brooke's film archive",
    body: `
      <div class="camera-archive">
        <header class="camera-archive-header">
          <div class="camera-roll-tabs" role="tablist" aria-label="Choose a photo roll">
            <button class="camera-roll-tab is-active" type="button" role="tab" data-camera-roll="open-air" aria-selected="true" aria-controls="camera-roll-open-air">
              <strong><span></span>Roll 01 · Open Air</strong>
            </button>
            <button class="camera-roll-tab" type="button" role="tab" data-camera-roll="quiet-light" aria-selected="false" aria-controls="camera-roll-quiet-light">
              <strong><span></span>Roll 02 · Quiet Light</strong>
            </button>
            <button class="camera-roll-tab" type="button" role="tab" data-camera-roll="monochrome-tide" aria-selected="false" aria-controls="camera-roll-monochrome-tide">
              <strong><span></span>Roll 03 · Monochrome Tide</strong>
            </button>
          </div>
        </header>

        <div class="camera-film-stage">
          <section class="camera-film-roll is-active" id="camera-roll-open-air" role="tabpanel" data-camera-roll-panel="open-air" aria-label="Roll 01, Open Air">
            <div class="camera-film-track">
              <figure class="camera-film-frame" data-camera-frame>
                <span class="camera-frame-index">1 <i></i></span><span class="camera-frame-image"><img src="./assets/photos/camera/web/roll-01/IMG_0079.jpg" alt="A quiet harbour framed by stone posts and a chain" decoding="async" /></span>
              </figure>
              <figure class="camera-film-frame" data-camera-frame>
                <span class="camera-frame-index">2 <i></i></span><span class="camera-frame-image"><img src="./assets/photos/camera/web/roll-01/IMG_0558.jpg" alt="A bird flying over sunlit water" loading="lazy" decoding="async" /></span>
              </figure>
              <figure class="camera-film-frame" data-camera-frame>
                <span class="camera-frame-index">3 <i></i></span><span class="camera-frame-image"><img src="./assets/photos/camera/web/roll-01/IMG_9266.jpg" alt="Wind turbines rising above a green field and blue water" loading="lazy" decoding="async" /></span>
              </figure>
              <figure class="camera-film-frame" data-camera-frame>
                <span class="camera-frame-index">4 <i></i></span><span class="camera-frame-image"><img src="./assets/photos/camera/web/roll-01/IMG_9485.jpg" alt="Horses grazing beside a wide blue lake" loading="lazy" decoding="async" /></span>
              </figure>
            </div>
          </section>

          <section class="camera-film-roll" id="camera-roll-quiet-light" role="tabpanel" data-camera-roll-panel="quiet-light" aria-label="Roll 02, Quiet Light" hidden>
            <div class="camera-film-track">
              <figure class="camera-film-frame" data-camera-frame><span class="camera-frame-index">5 <i></i></span><span class="camera-frame-image"><img src="./assets/photos/camera/web/roll-02/IMG_4016.jpg" alt="An empty classroom with green trees beyond the windows" loading="lazy" decoding="async" /></span></figure>
              <figure class="camera-film-frame" data-camera-frame><span class="camera-frame-index">6 <i></i></span><span class="camera-frame-image"><img src="./assets/photos/camera/web/roll-02/IMG_4029.jpg" alt="Late afternoon sunlight falling across a garden path" loading="lazy" decoding="async" /></span></figure>
              <figure class="camera-film-frame" data-camera-frame><span class="camera-frame-index">7 <i></i></span><span class="camera-frame-image"><img src="./assets/photos/camera/web/roll-02/IMG_4031.jpg" alt="Willow trees beside a lake at blue hour" loading="lazy" decoding="async" /></span></figure>
              <figure class="camera-film-frame" data-camera-frame><span class="camera-frame-index">8 <i></i></span><span class="camera-frame-image"><img src="./assets/photos/camera/web/roll-02/IMG_9536.jpg" alt="Golden autumn leaves seen through a dark window" loading="lazy" decoding="async" /></span></figure>
              <figure class="camera-film-frame" data-camera-frame><span class="camera-frame-index">9 <i></i></span><span class="camera-frame-image"><img src="./assets/photos/camera/web/roll-02/IMG_9735.jpg" alt="A quiet landscape held in soft evening light" loading="lazy" decoding="async" /></span></figure>
            </div>
          </section>

          <section class="camera-film-roll" id="camera-roll-monochrome-tide" role="tabpanel" data-camera-roll-panel="monochrome-tide" aria-label="Roll 03, Monochrome Tide" hidden>
            <div class="camera-film-track">
              <figure class="camera-film-frame" data-camera-frame><span class="camera-frame-index">10 <i></i></span><span class="camera-frame-image"><img src="./assets/photos/camera/web/roll-03/IMG_9875.jpg" alt="Black-and-white waves breaking against a seawall" loading="lazy" decoding="async" /></span></figure>
              <figure class="camera-film-frame" data-camera-frame><span class="camera-frame-index">11 <i></i></span><span class="camera-frame-image"><img src="./assets/photos/camera/web/roll-03/IMG_9876.jpg" alt="A monochrome marina beneath a hazy skyline" loading="lazy" decoding="async" /></span></figure>
              <figure class="camera-film-frame" data-camera-frame><span class="camera-frame-index">12 <i></i></span><span class="camera-frame-image"><img src="./assets/photos/camera/web/roll-03/IMG_9877.jpg" alt="A black-and-white coastal study from Brooke's archive" loading="lazy" decoding="async" /></span></figure>
              <figure class="camera-film-frame" data-camera-frame><span class="camera-frame-index">13 <i></i></span><span class="camera-frame-image"><img src="./assets/photos/camera/web/roll-03/IMG_9878.jpg" alt="A vertical monochrome study of the shoreline" loading="lazy" decoding="async" /></span></figure>
              <figure class="camera-film-frame" data-camera-frame><span class="camera-frame-index">14 <i></i></span><span class="camera-frame-image"><img src="./assets/photos/camera/web/roll-03/IMG_9879.jpg" alt="A quiet black-and-white moment beside the water" loading="lazy" decoding="async" /></span></figure>
              <figure class="camera-film-frame" data-camera-frame><span class="camera-frame-index">15 <i></i></span><span class="camera-frame-image"><img src="./assets/photos/camera/web/roll-03/IMG_9880.jpg" alt="Light and shadow meeting across a monochrome seascape" loading="lazy" decoding="async" /></span></figure>
              <figure class="camera-film-frame" data-camera-frame><span class="camera-frame-index">16 <i></i></span><span class="camera-frame-image"><img src="./assets/photos/camera/web/roll-03/IMG_9881.jpg" alt="A final black-and-white coastal frame" loading="lazy" decoding="async" /></span></figure>
            </div>
          </section>
        </div>

      </div>
    `,
  },
  sports: {
    eyebrow: "INTERESTS & HOBBIES",
    title: "Personal Curations",
    body: `
      <div class="curation-experience" data-curation>
        <div class="curation-main">
          <div class="curation-gallery">
            <div class="curation-image-frame"><img data-curation-image src="./assets/photos/interests/web/sports/01.jpg" alt="Sports archive photo 1" /></div>
            <div class="curation-dots" role="group" aria-label="Choose curation image">
              <button type="button" data-curation-slide="0" aria-label="Show image 1" aria-current="true"></button>
              <button type="button" data-curation-slide="1" aria-label="Show image 2"></button>
              <button type="button" data-curation-slide="2" aria-label="Show image 3"></button>
              <button type="button" data-curation-slide="3" aria-label="Show image 4"></button>
              <button type="button" data-curation-slide="4" aria-label="Show image 5"></button>
              <button type="button" data-curation-slide="5" aria-label="Show image 6"></button>
            </div>
          </div>
          <div class="curation-copy">
            <div class="curation-icon" aria-hidden="true"><i data-lucide="activity"></i></div>
            <h3 data-curation-title>Sports</h3>
            <p data-curation-description>Practice, movement, and the patience of repetition. I return to sport for the quiet focus it leaves behind.</p>
            <div class="curation-tip"><i data-lucide="lightbulb" aria-hidden="true"></i> Click the image or dots to switch photos</div>
          </div>
        </div>
        <nav class="curation-tabs" aria-label="Choose an interest">
          <button type="button" data-curation-category="reading" aria-pressed="false">Reading &amp; Film</button>
          <button type="button" data-curation-category="music" aria-pressed="false">Music</button>
          <button type="button" data-curation-category="sports" aria-pressed="true">Sports</button>
          <button type="button" data-curation-category="photography" aria-pressed="false">Photography</button>
        </nav>
      </div>
    `,
  },
  music: {
    eyebrow: "VOICE NOTES / AFTER HOURS",
    title: "Songs kept close to the first take.",
    body: `
      <div class="ukulele-audio-note">
        <form class="ukulele-access" data-ukulele-access>
          <label for="ukulelePassword">A small private archive</label>
          <p>Enter the password to listen.</p>
          <div class="ukulele-access-row">
            <input id="ukulelePassword" name="password" type="password" inputmode="numeric" autocomplete="off" maxlength="4" placeholder="----" aria-describedby="ukuleleAccessMessage" />
            <button type="submit">Enter</button>
          </div>
          <span id="ukuleleAccessMessage" class="ukulele-access-message" role="status" aria-live="polite"></span>
        </form>
        <section class="ukulele-player" data-ukulele-player aria-label="Ukulele voice note player" hidden>
          <audio data-ukulele-audio preload="metadata"></audio>
          <div class="ukulele-controls" role="group" aria-label="Voice note controls">
            <button type="button" data-ukulele-action="previous" title="Previous recording"><i data-lucide="skip-back"></i><span class="sr-only">Previous recording</span></button>
            <button class="ukulele-play" type="button" data-ukulele-action="play" title="Play recording"><i data-lucide="play"></i><span class="sr-only">Play recording</span></button>
            <button type="button" data-ukulele-action="next" title="Next recording"><i data-lucide="skip-forward"></i><span class="sr-only">Next recording</span></button>
          </div>
        </section>

        <ol class="ukulele-track-list" aria-label="Ukulele voice notes">
          <li>
            <button type="button" data-ukulele-track="0" data-src="./assets/audio/ukulele/绝对占有 相对自由.m4a" data-title="绝对占有 相对自由" data-meta="Ukulele + voice / voice memo" aria-pressed="true">
              <span class="ukulele-track-number">01</span><span class="ukulele-track-copy"><strong>绝对占有 相对自由</strong><span>Ukulele + voice</span></span><span class="ukulele-track-duration">--:--</span>
            </button>
          </li>
          <li>
            <button type="button" data-ukulele-track="1" data-src="./assets/audio/ukulele/刻在我心底的名字.m4a" data-title="刻在我心底的名字" data-meta="Ukulele + voice / voice memo" aria-pressed="false">
              <span class="ukulele-track-number">02</span><span class="ukulele-track-copy"><strong>刻在我心底的名字</strong><span>Ukulele + voice</span></span><span class="ukulele-track-duration">--:--</span>
            </button>
          </li>
          <li>
            <button type="button" data-ukulele-track="2" data-src="./assets/audio/ukulele/无眠.m4a" data-title="无眠" data-meta="Ukulele + voice / voice memo" aria-pressed="false">
              <span class="ukulele-track-number">03</span><span class="ukulele-track-copy"><strong>无眠</strong><span>Ukulele + voice</span></span><span class="ukulele-track-duration">--:--</span>
            </button>
          </li>
          <li>
            <button type="button" data-ukulele-track="3" data-src="./assets/audio/ukulele/至少还有你.m4a" data-title="至少还有你" data-meta="Ukulele + voice / voice memo" aria-pressed="false">
              <span class="ukulele-track-number">04</span><span class="ukulele-track-copy"><strong>至少还有你</strong><span>Ukulele + voice</span></span><span class="ukulele-track-duration">--:--</span>
            </button>
          </li>
          <li>
            <button type="button" data-ukulele-track="4" data-src="./assets/audio/ukulele/Don’t look back in anger.m4a" data-title="Don’t Look Back in Anger" data-meta="Ukulele + voice / voice memo" aria-pressed="false">
              <span class="ukulele-track-number">05</span><span class="ukulele-track-copy"><strong>Don’t Look Back in Anger</strong><span>Ukulele + voice</span></span><span class="ukulele-track-duration">--:--</span>
            </button>
          </li>
        </ol>
      </div>
    `,
  },
};

const FILM_NOTES = {
  "jeanne-dielman": {
    title: "Jeanne Dielman",
    meta: "Chantal Akerman · 1975",
    poster: "./assets/films/posters/jeanne-dielman.png",
    note: "A domestic routine becomes a precise architecture of time, labor, and quiet pressure.",
    detail: "I keep thinking about what changes when a camera refuses to hurry.",
  },
  "news-from-home": {
    title: "News from Home",
    meta: "Chantal Akerman · 1977",
    poster: "./assets/films/posters/news-from-home.png",
    note: "Letters, distance, and the city share the same frame without resolving each other.",
    detail: "The emotional force lives in the space between a voice and the place receiving it.",
  },
  "meetings-of-anna": {
    title: "The Meetings of Anna",
    meta: "Chantal Akerman · 1978",
    poster: "./assets/films/posters/meetings-of-anna.png",
    note: "Travel becomes a series of rooms, conversations, and temporary identities.",
    detail: "It is a film about movement that still feels deeply interior.",
  },
  "cleo-from-5-to-7": {
    title: "Cleo from 5 to 7",
    meta: "Agnes Varda · 1962",
    poster: "./assets/films/posters/cleo-from-5-to-7.png",
    note: "A real-time walk through fear, performance, and the possibility of looking again.",
    detail: "Varda makes the city feel like a second consciousness following Cleo.",
  },
  vagabond: {
    title: "Vagabond",
    meta: "Agnes Varda · 1985",
    poster: "./assets/films/posters/vagabond.png",
    note: "A life seen through fragments, witnesses, and the refusal to make solitude comfortable.",
    detail: "The shifting points of view keep asking who gets to tell a story.",
  },
  "gleaners-and-i": {
    title: "The Gleaners and I",
    meta: "Agnes Varda · 2000",
    poster: "./assets/films/posters/gleaners-and-i.png",
    note: "A generous camera finds beauty in what systems leave behind.",
    detail: "It is curious, playful, and political without losing its human scale.",
  },
};

const OBJECT_DEFINITIONS = {
  laptop: {
    label: "Laptop / open terminal",
    nodes: ["MacBook_Anchor"],
    focusNodes: ["MacBook__VQmfhbMzfNAuKAD"],
    mode: "terminal",
    focusPadding: 1.55,
    focusPaddingWide: 2.3,
  },
  books: {
    label: "Bookshelf / reading notes",
    nodes: ["Bookshelf_Anchor"],
    panel: "books",
    focusPadding: 1.12,
  },
  turntable: {
    label: "Turntable / listening shelf",
    nodes: ["Turntable_Anchor"],
    focusNodes: ["Turntable_Anchor"],
    panel: "turntable",
    focusPadding: 1.25,
    focusDuration: 1520,
  },
  coffee: {
    label: "Coffee cup / Cat-puccino",
    nodes: ["Coffee_Cup_Desk"],
    panel: "coffee",
    focusPadding: 1.35,
    focusMinDistance: 0.65,
    focusMaxDistance: 1.8,
    compositionOffset: 0.2,
  },
  poster: {
    label: "Wall poster / films and gaze",
    nodes: ["Wall_Art_Gallery"],
    panel: "poster",
    focusPadding: 1.18,
  },
  sports: {
    label: "Basketball / practice and endurance",
    nodes: ["Basketball_Anchor"],
    panel: "sports",
    focusPadding: 1.6,
  },
  camera: {
    label: "Kiev-4 camera / photo archive",
    nodes: ["Kiev_4AM_Desk_Camera", "Film_Roll_35mm_Desk", "Film_Roll_35mm_Hit_Target"],
    panel: "camera",
    centered: true,
    focusPadding: 1.15,
    focusMinDistance: 0.58,
    focusDuration: 1500,
  },
  music: {
    label: "Instrument / after hours",
    nodes: ["Ukulele_Anchor"],
    panel: "music",
    focusPadding: 1.25,
  },
  lamp: {
    label: "Desk lamp / toggle light",
    nodes: ["Desk_Lamp_Anchor"],
    mode: "lamp",
  },
};

const scene = new THREE.Scene();
scene.background = new THREE.Color(0xcfccc7);
scene.fog = new THREE.Fog(0xcfccc7, 11, 28);

const camera = new THREE.PerspectiveCamera(42, 1, 0.01, 100);
const renderer = new THREE.WebGLRenderer({
  canvas,
  antialias: true,
  alpha: false,
  powerPreference: "high-performance",
});
renderer.setPixelRatio(Math.min(window.devicePixelRatio, 1.6));
renderer.outputColorSpace = THREE.SRGBColorSpace;
renderer.toneMapping = THREE.ACESFilmicToneMapping;
renderer.toneMappingExposure = 1.05;
renderer.shadowMap.enabled = window.innerWidth > 720;
renderer.shadowMap.type = THREE.PCFSoftShadowMap;

const controls = new OrbitControls(camera, canvas);
controls.enableDamping = true;
controls.dampingFactor = 0.06;
controls.enablePan = false;
controls.minPolarAngle = Math.PI * 0.27;
controls.maxPolarAngle = Math.PI * 0.49;
controls.minDistance = 0.55;
controls.maxDistance = 12;
controls.rotateSpeed = 0.34;
controls.zoomSpeed = 0.62;
controls.touches.ONE = THREE.TOUCH.ROTATE;
controls.touches.TWO = THREE.TOUCH.DOLLY_PAN;

const hemisphere = new THREE.HemisphereLight(0xf3f1e8, 0x50545d, 2.1);
scene.add(hemisphere);

const keyLight = new THREE.DirectionalLight(0xfff2df, 3.4);
keyLight.position.set(-4, 7, 5);
keyLight.castShadow = renderer.shadowMap.enabled;
keyLight.shadow.mapSize.set(1024, 1024);
keyLight.shadow.camera.near = 0.1;
keyLight.shadow.camera.far = 30;
keyLight.shadow.camera.left = -7;
keyLight.shadow.camera.right = 7;
keyLight.shadow.camera.top = 7;
keyLight.shadow.camera.bottom = -7;
scene.add(keyLight);

const rimLight = new THREE.DirectionalLight(0x9cb8d8, 0.85);
rimLight.position.set(5, 4, -3);
scene.add(rimLight);

const lampLight = new THREE.PointLight(0xff9b55, 1.1, 5.5, 1.7);
lampLight.position.set(-0.7, 3.2, 1.1);
lampLight.castShadow = renderer.shadowMap.enabled;
lampLight.shadow.mapSize.set(512, 512);
scene.add(lampLight);

const modelRoot = new THREE.Group();
scene.add(modelRoot);

const raycaster = new THREE.Raycaster();
const pointer = new THREE.Vector2();
const interactiveMeshes = [];
const interactiveRoots = new Map();
const homeTarget = new THREE.Vector3();
const homePosition = new THREE.Vector3();
const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

let roomModel = null;
let homeBox = null;
let hoveredId = null;
let focusedId = null;
let cameraTween = null;
let pointerDown = null;
let isNight = false;
let lampOn = false;
let laptopScreenMesh = null;
let laptopScreenLocalCorners = null;
let laptopScreenOriginalMaterial = null;
let terminalScreenCanvas = null;
let terminalScreenContext = null;
let terminalScreenTexture = null;
let terminalScreenMaterial = null;
let terminalTextureDirty = true;
let terminalCursorPhase = -1;
let terminalScrollOffset = 0;
let terminalMaxScroll = 0;
let terminalScrollPointerId = null;
let terminalScrollPointerY = 0;
let focusSequenceId = 0;
let homeMaxDistance = 12;
let ignoreCanvasClick = false;
let openGroundMaterial = null;

function easeInOutSine(value) {
  return -(Math.cos(Math.PI * value) - 1) / 2;
}

function setLoading(progress, message) {
  const clampedProgress = Math.max(2, Math.min(100, progress));
  loadingBar.style.width = `${clampedProgress}%`;
  loadingPercent.textContent = `${String(Math.round(clampedProgress)).padStart(2, "0")}%`;
  if (message) loadingText.textContent = message;
  const progressBar = loadingBar.closest("[role=progressbar]");
  progressBar?.setAttribute("aria-valuenow", String(Math.round(clampedProgress)));

  loadingOverlay.dataset.stage = clampedProgress >= 100 ? "ready" : "room";
  loadingPhase.textContent = clampedProgress >= 100 ? "Opening room..." : "Loading room...";
}

function boxForNodes(root, names) {
  const box = new THREE.Box3();
  let found = false;
  names.forEach((name) => {
    const node = root.getObjectByName(name);
    if (!node) return;
    box.union(new THREE.Box3().setFromObject(node));
    found = true;
  });
  return found ? box : null;
}

function normalizeModel(root) {
  const framingNames = [
    "Studio_Floor",
    "Studio_BackWall",
    "Studio_LeftWall",
    "Studio_RightWall",
    "Main_Table_Anchor",
    "Office_Chair_Anchor",
    "Bookshelf_Anchor",
    "MacBook_Anchor",
    "Turntable_Anchor",
    "Desk_Lamp_Anchor",
    "Basketball_Anchor",
    "Ukulele_Anchor",
    "Wall_Poster_Base",
  ];

  const sourceBox = boxForNodes(root, framingNames) ?? new THREE.Box3().setFromObject(root);
  const sourceSize = sourceBox.getSize(new THREE.Vector3());
  const sourceCenter = sourceBox.getCenter(new THREE.Vector3());
  const maxDimension = Math.max(sourceSize.x, sourceSize.y, sourceSize.z);
  const scale = Number.isFinite(maxDimension) && maxDimension > 0 ? 8 / maxDimension : 1;

  root.scale.setScalar(scale);
  root.position.set(-sourceCenter.x * scale, -sourceBox.min.y * scale, -sourceCenter.z * scale);
  root.updateMatrixWorld(true);

  homeBox = boxForNodes(root, framingNames) ?? new THREE.Box3().setFromObject(root);
}

function createOpenEnvironment(root) {
  const floor = root.getObjectByName("Studio_Floor");
  const floorTop = floor
    ? new THREE.Box3().setFromObject(floor).max.y
    : 0;

  [
    "Studio_Floor",
    "Studio_BackWall",
    "Studio_LeftWall",
    "Studio_RightWall",
    "Studio_BackTrim",
    "Studio_LeftTrim",
    "Studio_RightTrim",
  ].forEach((name) => {
    const node = root.getObjectByName(name);
    if (node) node.visible = false;
  });

  openGroundMaterial = new THREE.MeshStandardMaterial({
    color: 0xc7c4bf,
    roughness: 0.96,
    metalness: 0,
  });
  const ground = new THREE.Mesh(new THREE.PlaneGeometry(80, 80), openGroundMaterial);
  ground.name = "Open_Environment_Ground";
  ground.rotation.x = -Math.PI / 2;
  ground.position.y = floorTop - 0.004;
  ground.receiveShadow = true;
  scene.add(ground);
}

function removeHeadphones(root) {
  const headphones = root.getObjectByName("Headphones_Anchor");
  headphones?.removeFromParent();
}

function stabilizeUkuleleSurfaces(root) {
  const ukulele = root.getObjectByName("Ukulele_Anchor");
  if (!ukulele) return;

  const decalPattern = /alien|bowie|etiquette|nirvana|pizza|skate|trans/i;
  const detailPattern = /chords|dark|ring\.001/i;

  ukulele.traverse((child) => {
    if (!child.isMesh) return;
    child.frustumCulled = false;

    const isDecal = decalPattern.test(child.name);
    const isSurfaceDetail = detailPattern.test(child.name);
    if (!isDecal && !isSurfaceDetail) return;

    const materials = Array.isArray(child.material) ? child.material : [child.material];
    const stabilizedMaterials = materials.map((material) => {
      const stabilized = material.clone();
      stabilized.polygonOffset = true;
      stabilized.polygonOffsetFactor = isDecal ? -6 : -2;
      stabilized.polygonOffsetUnits = isDecal ? -6 : -2;
      stabilized.needsUpdate = true;
      return stabilized;
    });
    child.material = Array.isArray(child.material) ? stabilizedMaterials : stabilizedMaterials[0];
    child.renderOrder = isDecal ? 4 : 2;
    child.castShadow = false;
    child.receiveShadow = false;
  });
}

function loadDeskCamera(root) {
  return new Promise((resolve) => {
    const accessoryLoader = new GLTFLoader();
    accessoryLoader.setDRACOLoader(dracoLoader);
    accessoryLoader.load(
      DESK_CAMERA_MODEL_URL,
      (gltf) => {
        const deskCamera = gltf.scene;
        deskCamera.name = "Kiev_4AM_Desk_Camera";
        root.add(deskCamera);

        const sourceBox = new THREE.Box3().setFromObject(deskCamera);
        const sourceSize = sourceBox.getSize(new THREE.Vector3());
        const targetWidth = 0.36;
        deskCamera.scale.setScalar(targetWidth / sourceSize.x);
        deskCamera.updateMatrixWorld(true);

        const table = root.getObjectByName("Main_Table_Anchor");
        const tableBox = table ? new THREE.Box3().setFromObject(table) : null;
        const tableSize = tableBox?.getSize(new THREE.Vector3());
        const cameraBox = new THREE.Box3().setFromObject(deskCamera);
        const cameraSize = cameraBox.getSize(new THREE.Vector3());
        const currentCenter = cameraBox.getCenter(new THREE.Vector3());
        const targetCenter = new THREE.Vector3(
          tableBox ? tableBox.min.x + (tableSize?.x ?? 1) * 0.27 : -0.7,
          (tableBox?.max.y ?? 0.94) + cameraSize.y * 0.5 + 0.008,
          tableBox ? tableBox.max.z - (tableSize?.z ?? 1) * 0.12 : -1.67,
        );
        deskCamera.position.add(targetCenter.sub(currentCenter));
        deskCamera.rotation.y = 0;
        prepareMaterials(deskCamera);
        resolve();
      },
      undefined,
      () => resolve(),
    );
  });
}

function loadCoffeeCup(root) {
  return new Promise((resolve) => {
    const accessoryLoader = new GLTFLoader();
    accessoryLoader.setDRACOLoader(dracoLoader);
    accessoryLoader.load(
      COFFEE_CUP_MODEL_URL,
      (gltf) => {
        const coffeeCup = gltf.scene;
        coffeeCup.name = "Coffee_Cup_Desk";
        root.add(coffeeCup);

        const sourceBox = new THREE.Box3().setFromObject(coffeeCup);
        const sourceSize = sourceBox.getSize(new THREE.Vector3());
        const targetWidth = 0.17;
        coffeeCup.scale.setScalar(targetWidth / Math.max(sourceSize.x, sourceSize.z));
        coffeeCup.rotation.y = THREE.MathUtils.degToRad(-28);
        coffeeCup.updateMatrixWorld(true);

        const table = root.getObjectByName("Main_Table_Anchor");
        const turntable = root.getObjectByName("Turntable_Anchor");
        const tableBox = table ? new THREE.Box3().setFromObject(table) : null;
        const turntableBox = turntable ? new THREE.Box3().setFromObject(turntable) : null;
        const tableSize = tableBox?.getSize(new THREE.Vector3());
        const turntableCenter = turntableBox?.getCenter(new THREE.Vector3());
        const cupBox = new THREE.Box3().setFromObject(coffeeCup);
        const cupCenter = cupBox.getCenter(new THREE.Vector3());
        const targetCenter = new THREE.Vector3(
          turntableBox
            ? turntableBox.min.x - 0.12
            : (tableBox ? tableBox.min.x + (tableSize?.x ?? 1) * 0.18 : -1.2),
          (tableBox?.max.y ?? 0.94) + (cupCenter.y - cupBox.min.y) + 0.006,
          turntableCenter
            ? turntableCenter.z + 0.16
            : (tableBox ? tableBox.max.z - (tableSize?.z ?? 1) * 0.18 : -1.6),
        );
        coffeeCup.position.add(targetCenter.sub(cupCenter));
        coffeeCup.updateMatrixWorld(true);
        prepareMaterials(coffeeCup);
        resolve();
      },
      undefined,
      () => resolve(),
    );
  });
}

function loadFilmRoll(root) {
  return new Promise((resolve) => {
    const accessoryLoader = new GLTFLoader();
    accessoryLoader.setDRACOLoader(dracoLoader);
    accessoryLoader.load(
      FILM_ROLL_MODEL_URL,
      (gltf) => {
        const filmRoll = gltf.scene;
        filmRoll.name = "Film_Roll_35mm_Desk";
        root.add(filmRoll);

        const sourceBox = new THREE.Box3().setFromObject(filmRoll);
        const sourceSize = sourceBox.getSize(new THREE.Vector3());
        const targetDiameter = 0.095;
        filmRoll.scale.setScalar(targetDiameter / Math.max(sourceSize.x, sourceSize.z));
        filmRoll.rotation.y = THREE.MathUtils.degToRad(18);
        filmRoll.updateMatrixWorld(true);

        const table = root.getObjectByName("Main_Table_Anchor");
        const deskCamera = root.getObjectByName("Kiev_4AM_Desk_Camera");
        const tableBox = table ? new THREE.Box3().setFromObject(table) : null;
        const cameraBox = deskCamera ? new THREE.Box3().setFromObject(deskCamera) : null;
        const cameraCenter = cameraBox?.getCenter(new THREE.Vector3());
        const rollBox = new THREE.Box3().setFromObject(filmRoll);
        const rollSize = rollBox.getSize(new THREE.Vector3());
        const rollCenter = rollBox.getCenter(new THREE.Vector3());
        const targetCenter = new THREE.Vector3(
          cameraBox ? cameraBox.min.x - rollSize.x * 0.72 : -0.84,
          (tableBox?.max.y ?? 0.94) + (rollCenter.y - rollBox.min.y) + 0.004,
          cameraCenter ? cameraCenter.z - rollSize.z * 0.08 : -1.67,
        );
        filmRoll.position.add(targetCenter.clone().sub(rollCenter));
        filmRoll.updateMatrixWorld(true);
        prepareMaterials(filmRoll);

        const hitTarget = new THREE.Mesh(
          new THREE.BoxGeometry(rollSize.x * 1.75, rollSize.y * 1.35, rollSize.z * 1.75),
          new THREE.MeshBasicMaterial({
            transparent: true,
            opacity: 0,
            depthWrite: false,
            colorWrite: false,
          }),
        );
        hitTarget.name = "Film_Roll_35mm_Hit_Target";
        hitTarget.position.copy(targetCenter);
        root.add(hitTarget);
        resolve();
      },
      undefined,
      () => resolve(),
    );
  });
}

async function applyWallPosterTexture(root) {
  const posterBase = root.getObjectByName("Wall_Poster_Base");
  if (!posterBase?.isMesh || !posterBase.parent) return;

  const textureLoader = new THREE.TextureLoader();
  const loadTexture = (url) => new Promise((resolve) => {
    textureLoader.load(url, resolve, undefined, () => resolve(null));
  });
  const filmTexture = await loadTexture(POSTER_TEXTURE_URL);

  [filmTexture].filter(Boolean).forEach((texture) => {
    texture.colorSpace = THREE.SRGBColorSpace;
    texture.wrapS = THREE.ClampToEdgeWrapping;
    texture.wrapT = THREE.ClampToEdgeWrapping;
    texture.anisotropy = Math.min(4, renderer.capabilities.getMaxAnisotropy());
  });

  posterBase.geometry.computeBoundingBox();
  const posterBox = posterBase.geometry.boundingBox;
  if (!posterBox) return;
  const posterSize = posterBox.getSize(new THREE.Vector3());
  const posterCenter = posterBox.getCenter(new THREE.Vector3());
  const gallery = new THREE.Group();
  gallery.name = "Wall_Art_Gallery";
  gallery.position.copy(posterBase.position);
  gallery.quaternion.copy(posterBase.quaternion);
  gallery.scale.copy(posterBase.scale);
  posterBase.parent.add(gallery);

  const createPanel = ({ name, texture, width, height, x, y, rotation, frameColor }) => {
    const panel = new THREE.Group();
    panel.name = name;
    panel.position.set(posterCenter.x + x, posterCenter.y + y, posterBox.max.z + 0.018);
    panel.rotation.z = rotation;

    const frameWidth = Math.min(width, height) * 0.045;
    const frameDepth = frameWidth * 0.62;
    const frame = new THREE.Mesh(
      new THREE.BoxGeometry(width + frameWidth * 2, height + frameWidth * 2, frameDepth),
      new THREE.MeshStandardMaterial({ color: frameColor, roughness: 0.82, metalness: 0 }),
    );
    frame.name = `${name}_Frame`;
    panel.add(frame);

    const image = new THREE.Mesh(
      new THREE.PlaneGeometry(width, height),
      new THREE.MeshStandardMaterial({
        color: texture ? 0xffffff : 0xddd8cf,
        map: texture,
        roughness: 0.9,
        metalness: 0,
      }),
    );
    image.name = `${name}_Image`;
    image.position.z = frameDepth * 0.5 + 0.002;
    panel.add(image);
    gallery.add(panel);
  };

  createPanel({
    name: "Wall_Art_Film",
    texture: filmTexture,
    width: posterSize.x * 0.94,
    height: posterSize.x * 0.94 * (1280 / 1920),
    x: 0,
    y: -posterSize.y * 0.32,
    rotation: 0,
    frameColor: 0x222222,
  });

  [
    "Wall_Poster_Base",
    "Wall_Poster_Frame",
    "Wall_Poster_Image",
    "Wall_Poster_Title",
    "Poster_A",
    "Poster_B",
    "Poster_Light_Bar",
  ].forEach((name) => {
    const oldPosterPart = root.getObjectByName(name);
    if (oldPosterPart) oldPosterPart.visible = false;
  });
}

function registerInteractiveObjects(root) {
  Object.entries(OBJECT_DEFINITIONS).forEach(([id, definition]) => {
    const roots = [];
    definition.nodes.forEach((name) => {
      const node = root.getObjectByName(name);
      if (!node) return;
      roots.push(node);
      node.traverse((child) => {
        if (!child.isMesh) return;
        child.userData.roomObjectId = id;
        interactiveMeshes.push(child);
      });
    });
    if (roots.length) interactiveRoots.set(id, roots);
  });

}

function registerLaptopScreen(root) {
  laptopScreenMesh = root.getObjectByName("MacBook__VQmfhbMzfNAuKAD");
  if (!laptopScreenMesh?.geometry) return;

  laptopScreenMesh.geometry.computeBoundingBox();
  const box = laptopScreenMesh.geometry.boundingBox;
  if (!box) return;

  // The imported display is a tilted plane: Y/Z move together from top to bottom.
  laptopScreenLocalCorners = [
    new THREE.Vector3(box.min.x, box.min.y, box.min.z),
    new THREE.Vector3(box.max.x, box.min.y, box.min.z),
    new THREE.Vector3(box.max.x, box.max.y, box.max.z),
    new THREE.Vector3(box.min.x, box.max.y, box.max.z),
  ];

  laptopScreenOriginalMaterial = laptopScreenMesh.material;
  terminalScreenCanvas = document.createElement("canvas");
  terminalScreenCanvas.width = 1280;
  terminalScreenCanvas.height = 800;
  terminalScreenContext = terminalScreenCanvas.getContext("2d");
  terminalScreenTexture = new THREE.CanvasTexture(terminalScreenCanvas);
  terminalScreenTexture.colorSpace = THREE.SRGBColorSpace;
  terminalScreenTexture.flipY = false;
  terminalScreenTexture.minFilter = THREE.LinearFilter;
  terminalScreenTexture.magFilter = THREE.LinearFilter;
  terminalScreenMaterial = new THREE.MeshBasicMaterial({
    map: terminalScreenTexture,
    side: laptopScreenOriginalMaterial?.side ?? THREE.FrontSide,
    toneMapped: false,
  });
}

function markTerminalTextureDirty() {
  terminalTextureDirty = true;
}

function setTerminalScrollOffset(value) {
  terminalScrollOffset = THREE.MathUtils.clamp(value, 0, terminalMaxScroll);
  markTerminalTextureDirty();
}

function setTerminalScreenActive(active) {
  if (!laptopScreenMesh || !terminalScreenMaterial || !laptopScreenOriginalMaterial) return;
  laptopScreenMesh.material = active ? terminalScreenMaterial : laptopScreenOriginalMaterial;
}

function wrapTerminalText(context, text, maxWidth) {
  const sourceLines = String(text).split("\n");
  const wrapped = [];

  sourceLines.forEach((sourceLine) => {
    if (!sourceLine) {
      wrapped.push("");
      return;
    }

    let remaining = sourceLine;
    while (context.measureText(remaining).width > maxWidth) {
      let splitAt = remaining.length - 1;
      while (splitAt > 1 && context.measureText(remaining.slice(0, splitAt)).width > maxWidth) splitAt -= 1;
      const spaceAt = remaining.lastIndexOf(" ", splitAt);
      if (spaceAt > Math.floor(splitAt * 0.55)) splitAt = spaceAt;
      wrapped.push(remaining.slice(0, splitAt));
      remaining = remaining.slice(splitAt).trimStart();
    }
    wrapped.push(remaining);
  });

  return wrapped;
}

function drawTerminalPrompt(context, text, x, y, fontSize) {
  context.font = `${fontSize}px "SFMono-Regular", Consolas, "Liberation Mono", Menlo, monospace`;
  const segments = [
    ["guest", "#ff5f56"],
    ["@", "#e8e8e2"],
    ["brooke", "#5db6e8"],
    [":~$", "#e8e8e2"],
  ];
  let cursorX = x;
  segments.forEach(([segment, color]) => {
    context.fillStyle = color;
    context.fillText(segment, cursorX, y);
    cursorX += context.measureText(segment).width;
  });

  const command = text.replace(/^guest@brooke:~\$\s*/, "");
  if (command) {
    context.fillStyle = "#70ff3b";
    context.fillText(` ${command}`, cursorX, y);
    cursorX += context.measureText(` ${command}`).width;
  } else {
    cursorX += context.measureText(" ").width;
  }
  return cursorX;
}

function renderTerminalScreen(now) {
  if (!terminalOverlay.classList.contains("is-open") || !terminalScreenContext || !terminalScreenTexture) return;
  const cursorPhase = Math.floor(now / 520) % 2;
  if (!terminalTextureDirty && cursorPhase === terminalCursorPhase) return;

  terminalTextureDirty = false;
  terminalCursorPhase = cursorPhase;

  const context = terminalScreenContext;
  const width = terminalScreenCanvas.width;
  const height = terminalScreenCanvas.height;
  const paddingX = 26;
  const paddingY = 22;
  const fontSize = 16;
  const asciiFontSize = 18;
  const lineHeight = 24;
  const maxWidth = width - paddingX * 2;
  const rows = [];

  Array.from(terminalOutput.children).forEach((element) => {
    if (element.classList.contains("terminal-ascii")) {
      rows.push({ gap: 10 });
      String(element.textContent).split("\n").forEach((text) => rows.push({ text, type: "ascii", height: 21 }));
      rows.push({ gap: 8 });
      return;
    }

    const isPrompt = element.classList.contains("is-command");
    const commandName = !isPrompt ? element.querySelector(".command-name")?.textContent ?? "" : "";
    const color = element.classList.contains("is-error")
      ? "#ff8d86"
      : element.classList.contains("is-muted")
        ? "#858d96"
        : "#e8e8e2";
    context.font = `${fontSize}px "SFMono-Regular", Consolas, "Liberation Mono", Menlo, monospace`;
    wrapTerminalText(context, element.textContent ?? "", maxWidth).forEach((text, index) => {
      rows.push({
        text,
        type: isPrompt && index === 0 ? "prompt" : "text",
        color,
        commandName: index === 0 ? commandName : "",
        height: lineHeight,
        gapBefore: isPrompt ? 8 : 0,
      });
    });
  });

  rows.push({
    text: `guest@brooke:~$ ${terminalInput.value}`,
    type: "input",
    height: lineHeight,
    gapBefore: 7,
  });

  context.fillStyle = "#17191b";
  context.fillRect(0, 0, width, height);
  const screenGlow = context.createLinearGradient(0, 0, 0, height);
  screenGlow.addColorStop(0, "rgba(255,255,255,0.025)");
  screenGlow.addColorStop(0.55, "rgba(255,255,255,0)");
  screenGlow.addColorStop(1, "rgba(0,0,0,0.08)");
  context.fillStyle = screenGlow;
  context.fillRect(0, 0, width, height);

  const totalHeight = rows.reduce((sum, row) => sum + (row.gap ?? row.height ?? 0) + (row.gapBefore ?? 0), 0);
  const availableHeight = height - paddingY * 2;
  terminalMaxScroll = Math.max(0, totalHeight - availableHeight);
  terminalScrollOffset = THREE.MathUtils.clamp(terminalScrollOffset, 0, terminalMaxScroll);
  let y = paddingY - terminalMaxScroll + terminalScrollOffset;

  rows.forEach((row) => {
    if (row.gap) {
      y += row.gap;
      return;
    }
    y += row.gapBefore ?? 0;
    const baseline = y + row.height * 0.78;

    if (baseline > 0 && y < height) {
      if (row.type === "ascii") {
        context.font = `${asciiFontSize}px "SFMono-Regular", Consolas, "Liberation Mono", Menlo, monospace`;
        context.fillStyle = "#f0f0e9";
        context.fillText(row.text, paddingX, baseline);
      } else if (row.type === "prompt" || row.type === "input") {
        const cursorX = drawTerminalPrompt(context, row.text, paddingX, baseline, fontSize);
        if (row.type === "input" && cursorPhase === 0) {
          context.fillStyle = "#70ff3b";
          context.fillRect(cursorX + 2, baseline - fontSize + 2, 2, fontSize + 2);
        }
      } else {
        context.font = `${fontSize}px "SFMono-Regular", Consolas, "Liberation Mono", Menlo, monospace`;
        if (row.commandName && row.text.startsWith(row.commandName)) {
          context.fillStyle = "#70ff3b";
          context.fillText(row.commandName, paddingX, baseline);
          context.fillStyle = row.color;
          context.fillText(row.text.slice(row.commandName.length), paddingX + context.measureText(row.commandName).width, baseline);
        } else {
          context.fillStyle = row.color;
          context.fillText(row.text, paddingX, baseline);
        }
      }
    }
    y += row.height;
  });

  if (terminalMaxScroll > 0) {
    const trackHeight = availableHeight;
    const thumbHeight = Math.max(42, trackHeight * (availableHeight / totalHeight));
    const scrollProgress = terminalScrollOffset / terminalMaxScroll;
    const thumbY = paddingY + (1 - scrollProgress) * (trackHeight - thumbHeight);
    context.fillStyle = "rgba(255,255,255,0.07)";
    context.fillRect(width - 10, paddingY, 2, trackHeight);
    context.fillStyle = "rgba(255,255,255,0.35)";
    context.fillRect(width - 11, thumbY, 4, thumbHeight);
  }

  terminalScreenTexture.needsUpdate = true;
}

function updateTerminalPlacement() {
  if (!laptopScreenMesh || !laptopScreenLocalCorners) return;

  laptopScreenMesh.updateWorldMatrix(true, false);
  const points = laptopScreenLocalCorners.map((corner) => {
    const projected = laptopScreenMesh.localToWorld(corner.clone()).project(camera);
    return {
      x: (projected.x * 0.5 + 0.5) * window.innerWidth,
      y: (-projected.y * 0.5 + 0.5) * window.innerHeight,
    };
  });

  const left = Math.min(...points.map((point) => point.x));
  const right = Math.max(...points.map((point) => point.x));
  const top = Math.min(...points.map((point) => point.y));
  const bottom = Math.max(...points.map((point) => point.y));

  const panelOpen = contentPanel.classList.contains("is-open");
  const hotspotVisible = terminalOverlay.classList.contains("is-open") && !panelOpen && objectMenu.hidden;
  laptopHotspot.hidden = !hotspotVisible;

  if (hotspotVisible) {
    const projectedWidth = right - left;
    const projectedHeight = bottom - top;
    const hitWidth = Math.max(projectedWidth, 48);
    const hitHeight = Math.max(projectedHeight, 48);
    laptopHotspot.style.left = `${left - (hitWidth - projectedWidth) * 0.5}px`;
    laptopHotspot.style.top = `${top - (hitHeight - projectedHeight) * 0.5}px`;
    laptopHotspot.style.width = `${hitWidth}px`;
    laptopHotspot.style.height = `${hitHeight}px`;
  }

}

function prepareMaterials(root) {
  root.traverse((child) => {
    if (!child.isMesh) return;
    const vertexCount = child.geometry?.attributes?.position?.count ?? 0;
    child.castShadow = renderer.shadowMap.enabled && vertexCount < 25000;
    child.receiveShadow = true;
    const materials = Array.isArray(child.material) ? child.material : [child.material];
    materials.filter(Boolean).forEach((material) => {
      material.needsUpdate = true;
      if (material.map) material.map.anisotropy = Math.min(4, renderer.capabilities.getMaxAnisotropy());
    });
  });
}

function positionLampLight() {
  const lamp = interactiveRoots.get("lamp")?.[0];
  if (!lamp) return;
  const box = new THREE.Box3().setFromObject(lamp);
  const center = box.getCenter(new THREE.Vector3());
  lampLight.position.copy(center).add(new THREE.Vector3(0, 0.15, 0.2));
}

function calculateHomeView() {
  if (!homeBox) return;
  const size = homeBox.getSize(new THREE.Vector3());
  const center = homeBox.getCenter(new THREE.Vector3());
  const verticalFov = THREE.MathUtils.degToRad(camera.fov);
  const horizontalFov = 2 * Math.atan(Math.tan(verticalFov / 2) * camera.aspect);
  const verticalDistance = (size.y * 0.58) / Math.tan(verticalFov / 2);
  const horizontalDistance = (size.x * 0.55) / Math.tan(horizontalFov / 2);
  const distance = Math.max(verticalDistance, horizontalDistance, 5.8)
    * (window.innerWidth < 720 ? 1.12 : 1)
    * HOME_VIEW_DISTANCE_SCALE;
  homeMaxDistance = distance * 1.35;

  homeTarget.set(center.x, center.y + size.y * (0.03 + HOME_VIEW_VERTICAL_OFFSET), center.z);
  homePosition.set(center.x, center.y + size.y * (0.09 + HOME_VIEW_VERTICAL_OFFSET), center.z + distance);

  if (!focusedId && !cameraTween) {
    controls.maxDistance = homeMaxDistance;
    camera.position.copy(homePosition);
    controls.target.copy(homeTarget);
    controls.update();
  }
}

function startCameraTween(position, target, onComplete, requestedDuration = HOME_RETURN_DURATION) {
  const duration = reduceMotion ? 1 : requestedDuration;
  cameraTween = {
    start: performance.now(),
    duration,
    fromPosition: camera.position.clone(),
    fromTarget: controls.target.clone(),
    toPosition: position.clone(),
    toTarget: target.clone(),
    onComplete,
  };
  controls.enabled = false;
}

function restoreHome() {
  focusSequenceId += 1;
  closeObjectMenu();
  closePanel(false);
  closeTerminal(false);
  focusedId = null;
  focusControls.hidden = true;
  controls.minAzimuthAngle = -Infinity;
  controls.maxAzimuthAngle = Infinity;
  controls.maxDistance = homeMaxDistance;
  startCameraTween(homePosition, homeTarget, () => {
    controls.enabled = true;
  }, HOME_RETURN_DURATION);
}

function getLaptopScreenCameraView() {
  if (!laptopScreenMesh || !laptopScreenLocalCorners) return null;

  laptopScreenMesh.updateWorldMatrix(true, false);
  const corners = laptopScreenLocalCorners.map((corner) => laptopScreenMesh.localToWorld(corner.clone()));
  const horizontal = corners[1].clone().sub(corners[0]);
  const vertical = corners[3].clone().sub(corners[0]);
  const center = corners.reduce((sum, corner) => sum.add(corner), new THREE.Vector3()).multiplyScalar(0.25);
  const normal = horizontal.clone().cross(vertical).normalize();
  if (normal.dot(homePosition.clone().sub(center)) < 0) normal.negate();

  const verticalFov = THREE.MathUtils.degToRad(camera.fov);
  const horizontalFov = 2 * Math.atan(Math.tan(verticalFov / 2) * camera.aspect);
  const fitHeight = (vertical.length() * 0.5) / Math.tan(verticalFov / 2);
  const fitWidth = (horizontal.length() * 0.5) / Math.tan(horizontalFov / 2);
  const padding = window.innerWidth < 720 ? 1.22 : 1.08;
  const distance = THREE.MathUtils.clamp(Math.max(fitHeight, fitWidth) * padding, 0.65, 3.2);

  return {
    position: center.clone().addScaledVector(normal, distance),
    target: center,
  };
}

function getTurntableCameraView() {
  const turntable = modelRoot.getObjectByName("Turntable_Anchor");
  if (!turntable) return null;

  const focusBox = new THREE.Box3().setFromObject(turntable);
  const center = focusBox.getCenter(new THREE.Vector3());
  const size = focusBox.getSize(new THREE.Vector3());
  const approach = new THREE.Vector3(0, 0.65, 1).normalize();
  const elevation = Math.atan2(approach.y, approach.z);
  const projectedHeight = size.y * Math.cos(elevation) + size.z * Math.sin(elevation);
  const verticalFov = THREE.MathUtils.degToRad(camera.fov);
  const horizontalFov = 2 * Math.atan(Math.tan(verticalFov / 2) * camera.aspect);
  const fitHeight = (projectedHeight * 0.5) / Math.tan(verticalFov / 2);
  const fitWidth = (size.x * 0.5) / Math.tan(horizontalFov / 2);
  const padding = window.innerWidth < 720 ? 1.58 : 1.48;
  const distance = THREE.MathUtils.clamp(
    Math.max(fitHeight, fitWidth) * padding + size.z * 0.25,
    0.9,
    4.2,
  );
  const forward = approach.clone().negate();
  const right = forward.clone().cross(camera.up).normalize();
  const compositionOffset = window.innerWidth < 720 ? 0 : size.x * 0.22;
  const target = center.clone().addScaledVector(right, compositionOffset);
  const position = center.clone()
    .addScaledVector(approach, distance)
    .addScaledVector(right, compositionOffset);

  return { position, target };
}

function getDeskCameraView() {
  const deskCamera = modelRoot.getObjectByName("Kiev_4AM_Desk_Camera");
  if (!deskCamera) return null;

  const focusBox = new THREE.Box3().setFromObject(deskCamera);
  const filmRoll = modelRoot.getObjectByName("Film_Roll_35mm_Desk");
  if (filmRoll) focusBox.union(new THREE.Box3().setFromObject(filmRoll));
  const center = focusBox.getCenter(new THREE.Vector3());
  const size = focusBox.getSize(new THREE.Vector3());
  const approach = new THREE.Vector3(-0.28, 0.3, 1).normalize();
  const yaw = Math.atan2(Math.abs(approach.x), approach.z);
  const elevation = Math.atan2(approach.y, Math.hypot(approach.x, approach.z));
  const projectedWidth = size.x * Math.cos(yaw) + size.z * Math.sin(yaw);
  const projectedHeight = size.y * Math.cos(elevation) + size.z * Math.sin(elevation);
  const verticalFov = THREE.MathUtils.degToRad(camera.fov);
  const horizontalFov = 2 * Math.atan(Math.tan(verticalFov / 2) * camera.aspect);
  const fitHeight = (projectedHeight * 0.5) / Math.tan(verticalFov / 2);
  const fitWidth = (projectedWidth * 0.5) / Math.tan(horizontalFov / 2);
  const padding = window.innerWidth < 720 ? 1.34 : 1.28;
  const distance = THREE.MathUtils.clamp(
    Math.max(fitHeight, fitWidth) * padding + size.z * 0.28,
    0.68,
    3.2,
  );
  const forward = approach.clone().negate();
  const right = forward.clone().cross(camera.up).normalize();
  const target = center.clone()
    .add(new THREE.Vector3(0, -size.y * 0.03, 0))
    .addScaledVector(right, -size.x * 0.1);
  const position = target.clone().addScaledVector(approach, distance);

  return { position, target };
}

function getCoffeeCameraView() {
  const coffeeCup = modelRoot.getObjectByName("Coffee_Cup_Desk");
  if (!coffeeCup) return null;

  const focusBox = new THREE.Box3().setFromObject(coffeeCup);
  const center = focusBox.getCenter(new THREE.Vector3());
  const approach = new THREE.Vector3(0.12, 0.72, 1).normalize();
  const forward = approach.clone().negate();
  const right = forward.clone().cross(camera.up).normalize();
  const compositionOffset = window.innerWidth < 720 ? 0 : 0.2;
  const target = center.clone().addScaledVector(right, compositionOffset);
  const distance = window.innerWidth < 720 ? 1.12 : 1.02;
  const position = target.clone().addScaledVector(approach, distance);

  return { position, target };
}

function getFocusedCameraView(id) {
  const definition = OBJECT_DEFINITIONS[id];
  if (!definition || !modelRoot) return null;
  if (id === "laptop") {
    const screenView = getLaptopScreenCameraView();
    if (screenView) return screenView;
  }
  if (id === "turntable") {
    const turntableView = getTurntableCameraView();
    if (turntableView) return turntableView;
  }
  if (id === "coffee") {
    const coffeeView = getCoffeeCameraView();
    if (coffeeView) return coffeeView;
  }
  if (id === "camera") {
    const deskCameraView = getDeskCameraView();
    if (deskCameraView) return deskCameraView;
  }

  const requestedFocusRoots = definition.focusNodes
    ?.map((name) => modelRoot.getObjectByName(name))
    .filter(Boolean);
  const roots = requestedFocusRoots?.length ? requestedFocusRoots : interactiveRoots.get(id);
  const focusBox = roots?.reduce((box, root) => box.union(new THREE.Box3().setFromObject(root)), new THREE.Box3());
  if (!focusBox || focusBox.isEmpty()) return null;

  const center = focusBox.getCenter(new THREE.Vector3());
  const size = focusBox.getSize(new THREE.Vector3());
  const verticalFov = THREE.MathUtils.degToRad(camera.fov);
  const horizontalFov = 2 * Math.atan(Math.tan(verticalFov / 2) * camera.aspect);
  const fitHeight = (size.y * 0.5) / Math.tan(verticalFov / 2);
  const fitWidth = (size.x * 0.5) / Math.tan(horizontalFov / 2);
  const focusPadding = window.innerWidth >= 900
    ? definition.focusPaddingWide ?? definition.focusPadding ?? 1.3
    : definition.focusPadding ?? 1.3;
  const distance = THREE.MathUtils.clamp(
    Math.max(fitHeight, fitWidth) * focusPadding + size.z * 0.55,
    definition.focusMinDistance ?? 0.85,
    definition.focusMaxDistance ?? 5.5,
  );

  const approach = new THREE.Vector3(0, 0, 1);
  const forward = approach.clone().negate();
  const right = forward.clone().cross(camera.up).normalize();
  const isTerminal = definition.mode === "terminal";
  const compositionOffset = isTerminal || definition.centered || window.innerWidth < 720
    ? 0
    : definition.compositionOffset ?? Math.max(size.x, size.y) * 0.22;
  const target = center.clone().addScaledVector(right, compositionOffset);
  const position = center.clone()
    .addScaledVector(approach, distance)
    .addScaledVector(right, compositionOffset);

  return { position, target };
}

function getPosterReadingView(closeView) {
  const roots = interactiveRoots.get("poster");
  if (!roots?.length || !closeView) return closeView;
  const focusBox = roots.reduce(
    (box, root) => box.union(new THREE.Box3().setFromObject(root)),
    new THREE.Box3(),
  );
  const size = focusBox.getSize(new THREE.Vector3());
  const offset = closeView.position.clone().sub(closeView.target).multiplyScalar(1.22);
  const target = closeView.target.clone().add(new THREE.Vector3(size.x * 0.14, 0, 0));
  const position = target.clone().add(offset);
  return { position, target };
}

function getLaptopEstablishingView() {
  const roots = ["Desk_Lamp_Anchor", "MacBook_Anchor", "Turntable_Anchor"]
    .map((name) => modelRoot.getObjectByName(name))
    .filter(Boolean);
  if (!roots.length) return null;

  const focusBox = roots.reduce(
    (box, root) => box.union(new THREE.Box3().setFromObject(root)),
    new THREE.Box3(),
  );
  const center = focusBox.getCenter(new THREE.Vector3());
  const size = focusBox.getSize(new THREE.Vector3());
  const verticalFov = THREE.MathUtils.degToRad(camera.fov);
  const horizontalFov = 2 * Math.atan(Math.tan(verticalFov / 2) * camera.aspect);
  const fitHeight = (size.y * 0.5) / Math.tan(verticalFov / 2);
  const fitWidth = (size.x * 0.5) / Math.tan(horizontalFov / 2);
  const padding = window.innerWidth < 720 ? 1.42 : 1.18;
  const distance = THREE.MathUtils.clamp(
    Math.max(fitHeight, fitWidth) * padding + size.z * 0.6,
    1.7,
    5.2,
  );
  const approach = new THREE.Vector3(0, 0, 1);
  const target = center.clone().add(new THREE.Vector3(0, -size.y * 0.05, 0));
  const position = target.clone().addScaledVector(approach, distance);

  return { position, target };
}

function focusObject(id) {
  const definition = OBJECT_DEFINITIONS[id];
  if (!definition) return;
  closeObjectMenu();
  setHover(null);

  if (definition.mode === "lamp") {
    lampOn = !lampOn;
    applyLighting();
    return;
  }

  closePanel(false);
  closeTerminal(false);
  const sequenceId = ++focusSequenceId;
  focusedId = id;
  focusControls.hidden = false;
  controls.minAzimuthAngle = -Infinity;
  controls.maxAzimuthAngle = Infinity;
  controls.maxDistance = id === "laptop" ? 5.2 : Math.min(homeMaxDistance, 8.5);

  const reveal = () => {
    if (sequenceId !== focusSequenceId || focusedId !== id) return;
    if (definition.panel) openPanel(definition.panel);
    if (id === "poster" && window.innerWidth >= 900) {
      controls.enabled = false;
      const moveToReadingView = () => {
        if (sequenceId !== focusSequenceId || focusedId !== id) return;
        contentPanel.classList.add("is-reading-stage");
        const readingView = getPosterReadingView(view);
        startCameraTween(readingView.position, readingView.target, () => {
          if (sequenceId !== focusSequenceId || focusedId !== id) return;
          controls.enabled = true;
          canvas.style.cursor = "grab";
        }, 960);
      };
      if (reduceMotion) moveToReadingView();
      else window.setTimeout(moveToReadingView, 700);
      return;
    }
    controls.enabled = true;
    canvas.style.cursor = "grab";
  };

  const view = getFocusedCameraView(id);
  if (!view) {
    if (definition.mode === "terminal") openTerminal();
    reveal();
    return;
  }

  if (definition.mode === "terminal") {
    openTerminal();
    const establishingView = getLaptopEstablishingView();
    if (!establishingView) {
      startCameraTween(view.position, view.target, reveal, OBJECT_FOCUS_DURATION);
      return;
    }

    startCameraTween(establishingView.position, establishingView.target, () => {
      if (sequenceId !== focusSequenceId || focusedId !== id) return;
      const continueToScreen = () => {
        if (sequenceId !== focusSequenceId || focusedId !== id) return;
        startCameraTween(view.position, view.target, reveal, 1180);
      };
      if (reduceMotion) continueToScreen();
      else window.setTimeout(continueToScreen, 180);
    }, 1060);
    return;
  }

  startCameraTween(view.position, view.target, reveal, definition.focusDuration ?? OBJECT_FOCUS_DURATION);
}

function adjustFocusedCamera(action) {
  if (!focusedId) return;

  focusSequenceId += 1;

  if (action === "exit") {
    restoreHome();
    return;
  }

  if (action === "reset") {
    const view = getFocusedCameraView(focusedId);
    if (!view) return;
    startCameraTween(view.position, view.target, () => {
      controls.enabled = true;
      if (terminalOverlay.classList.contains("is-open")) terminalInput.focus({ preventScroll: true });
    }, 420);
    return;
  }

  const offset = camera.position.clone().sub(controls.target);
  const spherical = new THREE.Spherical().setFromVector3(offset);

  if (action === "rotate-left") spherical.theta -= 0.2;
  else if (action === "rotate-right") spherical.theta += 0.2;
  else if (action === "zoom-in") spherical.radius *= 0.82;
  else if (action === "zoom-out") spherical.radius *= 1.2;
  else return;

  spherical.theta = THREE.MathUtils.clamp(spherical.theta, controls.minAzimuthAngle, controls.maxAzimuthAngle);
  spherical.radius = THREE.MathUtils.clamp(spherical.radius, controls.minDistance, controls.maxDistance);
  const position = new THREE.Vector3().setFromSpherical(spherical).add(controls.target);

  startCameraTween(position, controls.target, () => {
    controls.enabled = true;
    if (terminalOverlay.classList.contains("is-open")) terminalInput.focus({ preventScroll: true });
  }, 340);
}

function prepareFilmIndex() {
  contentPanel.querySelectorAll("[data-film-note]").forEach((button) => {
    const film = FILM_NOTES[button.dataset.filmNote];
    const item = button.closest("li");
    if (!film || !item) return;
    const note = document.createElement("div");
    note.id = button.getAttribute("aria-controls");
    note.className = "film-inline-note";
    note.setAttribute("aria-hidden", "true");
    const inner = document.createElement("div");
    inner.className = "film-inline-note-inner";
    const poster = document.createElement("img");
    poster.className = "film-inline-poster";
    poster.src = film.poster;
    poster.alt = `${film.title} poster`;
    poster.loading = "lazy";
    poster.decoding = "async";
    const copy = document.createElement("div");
    copy.className = "film-inline-copy";
    const title = document.createElement("h3");
    title.textContent = film.title;
    const meta = document.createElement("p");
    meta.className = "film-inline-meta";
    meta.textContent = film.meta;
    const description = document.createElement("p");
    description.className = "film-inline-description";
    description.textContent = film.note;
    copy.append(title, meta, description);
    inner.append(poster, copy);
    note.append(inner);
    item.append(note);
  });
}

function toggleFilmNote(button) {
  const note = button.closest("li")?.querySelector(".film-inline-note");
  if (!note) return;
  const willOpen = button.getAttribute("aria-expanded") !== "true";

  contentPanel.querySelectorAll("[data-film-note][aria-expanded='true']").forEach((openButton) => {
    openButton.setAttribute("aria-expanded", "false");
    const openNote = openButton.closest("li")?.querySelector(".film-inline-note");
    openNote?.classList.remove("is-open");
    openNote?.setAttribute("aria-hidden", "true");
  });

  if (!willOpen) return;
  button.setAttribute("aria-expanded", "true");
  note.classList.add("is-open");
  note.setAttribute("aria-hidden", "false");
}

let herGazeViewTransition = null;
let herGazeTransitionId = 0;
let herGazePreviewRect = null;

function snapshotRect(element) {
  const rect = element.getBoundingClientRect();
  return { top: rect.top, left: rect.left, width: rect.width, height: rect.height };
}

function rectTransform(from, to) {
  return `translate3d(${from.left - to.left}px, ${from.top - to.top}px, 0) scale(${from.width / to.width}, ${from.height / to.height})`;
}

function runHerGazeGeometryTransition(expanded, updateState, focusNext, transitionId) {
  const browser = contentPanel.querySelector(".project-preview-frame");
  if (!browser) {
    updateState();
    requestAnimationFrame(focusNext);
    return;
  }
  const isPhone = browser.classList.contains("embedded-phone");
  const expandedBackground = isPhone ? "rgb(29, 26, 25)" : "rgb(207, 204, 199)";
  const transparentBackground = isPhone ? "rgba(29, 26, 25, 0)" : "rgba(207, 204, 199, 0)";

  app.classList.add("is-her-gaze-transitioning");
  const finishTransition = () => {
    if (transitionId !== herGazeTransitionId) return;
    app.classList.remove("is-her-gaze-geometry-opening", "is-her-gaze-geometry-closing");
    if (!expanded) updateState();
    browser.style.removeProperty("transform");
    browser.style.removeProperty("border-radius");
    contentPanel.style.removeProperty("background-color");
    app.classList.remove("is-her-gaze-transitioning");
    focusNext();
  };

  if (expanded) {
    const expandedRadius = isPhone ? "42px" : "8px";
    const previewRadius = isPhone ? "38px" : "11px";
    const startRect = snapshotRect(browser);
    herGazePreviewRect = startRect;
    updateState();
    const endRect = snapshotRect(browser);
    browser.style.transform = rectTransform(startRect, endRect);
    browser.style.borderRadius = previewRadius;
    contentPanel.style.backgroundColor = transparentBackground;
    void browser.offsetWidth;
    app.classList.add("is-her-gaze-geometry-opening");
    requestAnimationFrame(() => {
      browser.style.transform = "none";
      browser.style.borderRadius = expandedRadius;
      contentPanel.style.backgroundColor = expandedBackground;
    });
    window.setTimeout(finishTransition, 1040);
  } else if (herGazePreviewRect) {
    const expandedRadius = isPhone ? "42px" : "8px";
    const previewRadius = isPhone ? "38px" : "11px";
    const startRect = snapshotRect(browser);
    browser.style.transform = "none";
    browser.style.borderRadius = expandedRadius;
    contentPanel.style.backgroundColor = expandedBackground;
    void browser.offsetWidth;
    app.classList.add("is-her-gaze-geometry-closing");
    requestAnimationFrame(() => {
      browser.style.transform = rectTransform(herGazePreviewRect, startRect);
      browser.style.borderRadius = previewRadius;
      contentPanel.style.backgroundColor = transparentBackground;
    });
    window.setTimeout(finishTransition, 820);
  } else {
    updateState();
    app.classList.remove("is-her-gaze-transitioning");
    requestAnimationFrame(focusNext);
  }
}

function setHerGazeExpanded(expanded) {
  if (app.classList.contains("is-her-gaze-transitioning")) return;
  const transitionId = ++herGazeTransitionId;
  const updateState = () => {
    const wasExpanded = contentPanel.classList.contains("is-her-gaze-expanded");
    if (expanded && !wasExpanded) openEmbeddedExperience();
    if (!expanded && wasExpanded) resetHerGazePreview();
    app.classList.toggle("is-her-gaze-open", expanded);
    contentPanel.classList.toggle("is-her-gaze-expanded", expanded);
  };
  const focusNext = () => {
    if (transitionId !== herGazeTransitionId) return;
    const nextFocus = expanded
      ? contentPanel.querySelector(".project-preview-frame iframe")
      : contentPanel.querySelector("[data-open-project-browser]");
    nextFocus?.focus({ preventScroll: true });
  };

  if (!reduceMotion && typeof document.startViewTransition === "function") {
    herGazeViewTransition?.skipTransition();
    const transition = document.startViewTransition(updateState);
    herGazeViewTransition = transition;
    transition.finished.then(focusNext, focusNext);
    return;
  }

  if (!reduceMotion) {
    runHerGazeGeometryTransition(expanded, updateState, focusNext, transitionId);
    return;
  }

  updateState();
  requestAnimationFrame(focusNext);
}

function prepareEmbeddedBrowser() {
  const browser = contentPanel.querySelector(".project-preview-frame");
  const frame = browser?.querySelector("iframe");
  if (!browser || !frame) return;
  const loadId = String(Number(browser.dataset.frameLoadId || 0) + 1);
  browser.dataset.frameLoadId = loadId;
  const revealFrame = () => {
    if (browser.dataset.frameLoadId !== loadId) return;
    browser.classList.add("is-frame-ready");
    if (browser.classList.contains("embedded-phone") && !contentPanel.classList.contains("is-her-gaze-expanded")) {
      contentPanel.scrollTop = 0;
      panelClose.focus({ preventScroll: true });
    }
  };
  frame.addEventListener("load", () => window.setTimeout(revealFrame, 900), { once: true });
  window.setTimeout(revealFrame, 5000);
}

window.addEventListener("message", (event) => {
  if (event.data?.type !== "brooke:bookshelf-theme") return;
  const browser = contentPanel.querySelector('.embedded-browser[data-project-browser="bookshelf"]');
  const frame = browser?.querySelector("iframe");
  if (!browser || !frame || event.source !== frame.contentWindow) return;
  let frameOrigin = "null";
  try {
    frameOrigin = new URL(frame.src, window.location.href).origin;
  } catch {
    return;
  }
  if (event.origin !== frameOrigin) return;

  const isHexColor = (value) => typeof value === "string" && /^#[0-9a-f]{6}$/i.test(value);
  const hasTheme = event.data.state === "detail"
    && isHexColor(event.data.background)
    && isHexColor(event.data.ink);
  browser.classList.toggle("is-book-theme-active", hasTheme);
  if (hasTheme) {
    browser.style.setProperty("--bookshelf-theme-bg", event.data.background);
    browser.style.setProperty("--bookshelf-theme-ink", event.data.ink);
  } else {
    browser.style.removeProperty("--bookshelf-theme-bg");
    browser.style.removeProperty("--bookshelf-theme-ink");
  }
});

function resetHerGazePreview() {
  const browser = contentPanel.querySelector(".project-preview-frame");
  const frame = browser?.querySelector("iframe");
  const homeUrl = frame?.dataset.previewSrc || frame?.getAttribute("src");
  if (!browser || !frame || !homeUrl) return;
  browser.classList.remove("is-frame-ready");
  frame.setAttribute("src", homeUrl);
  prepareEmbeddedBrowser();
}

function openEmbeddedExperience() {
  const browser = contentPanel.querySelector(".project-preview-frame");
  const frame = browser?.querySelector("iframe");
  const liveUrl = frame?.dataset.liveSrc;
  if (!browser || !frame || !liveUrl || frame.getAttribute("src") === liveUrl) return;
  browser.classList.remove("is-frame-ready");
  frame.setAttribute("src", liveUrl);
  prepareEmbeddedBrowser();
}

function getInterestPhotoMarkup(category) {
  const copy = INTEREST_PHOTOS[category] || INTEREST_PHOTOS.sports;
  return Array.from({ length: copy.count }, (_, itemIndex) => itemIndex + 1).map((index) => `
    <figure class="interest-photo-frame">
      <img data-interest-photo src="./assets/photos/interests/web/${category}/${String(index).padStart(2, "0")}.jpg" alt="${copy.caption} photo ${index}" loading="lazy" decoding="async" />
      <div class="interest-photo-fallback" aria-hidden="true"><span>0${index}</span></div>
      <figcaption>${copy.caption.replace("01", String(index).padStart(2, "0"))}</figcaption>
    </figure>
  `).join("");
}

function toggleHobbyInline(category, trigger) {
  const archive = trigger?.closest("[data-hobby-archive]");
  const source = archive?.querySelector(`[data-hobby-panel="${category}"]`);
  if (!archive || !source) return;

  const current = archive.querySelector(`[data-hobby-inline="${category}"]`);
  if (current) {
    current.classList.remove("is-visible");
    trigger.setAttribute("aria-expanded", "false");
    window.setTimeout(() => current.remove(), 240);
    return;
  }

  archive.querySelectorAll("[data-hobby-inline]").forEach((panel) => panel.remove());
  archive.querySelectorAll("[data-hobby-category]").forEach((item) => item.setAttribute("aria-expanded", "false"));

  const inline = source.cloneNode(true);
  inline.className = "hobby-inline-panel";
  inline.hidden = false;
  inline.removeAttribute("data-hobby-panel");
  inline.removeAttribute("aria-labelledby");
  inline.dataset.hobbyInline = category;
  inline.querySelectorAll("[id]").forEach((element) => element.removeAttribute("id"));
  inline.querySelector("[data-ukulele-player]")?.remove();
  const photoStrip = inline.querySelector(".hobby-photo-strip");
  if (photoStrip) {
    photoStrip.innerHTML = getInterestPhotoMarkup(category);
    photoStrip.querySelectorAll("[data-interest-photo]").forEach((image) => {
      image.addEventListener("error", () => {
        image.hidden = true;
        image.nextElementSibling.hidden = false;
      }, { once: true });
    });
  }
  const note = inline.querySelector(":scope > p");
  if (note && INTEREST_PHOTOS[category]) note.textContent = INTEREST_PHOTOS[category].note;
  trigger.insertAdjacentElement("afterend", inline);
  trigger.setAttribute("aria-expanded", "true");
  requestAnimationFrame(() => inline.classList.add("is-visible"));
}

function setHobbyCategory(category) {
  const archive = contentPanel.querySelector("[data-hobby-archive]");
  const indexView = archive?.querySelector("[data-hobby-index-view]");
  const detailView = archive?.querySelector("[data-hobby-detail-view]");
  if (!archive || !indexView || !detailView || !category) return;
  const panel = detailView.querySelector(`[data-hobby-panel="${category}"]`);
  if (!panel) return;

  indexView.hidden = true;
  detailView.hidden = false;
  detailView.querySelectorAll("[data-hobby-panel]").forEach((item) => {
    item.hidden = item !== panel;
  });
  const label = detailView.querySelector("[data-hobby-detail-label]");
  if (label) label.textContent = category.toUpperCase();
  archive.dataset.activeHobby = category;
  contentPanel.scrollTop = 0;
}

function resetHobbyCategory() {
  const archive = contentPanel.querySelector("[data-hobby-archive]");
  const indexView = archive?.querySelector("[data-hobby-index-view]");
  const detailView = archive?.querySelector("[data-hobby-detail-view]");
  if (!archive || !indexView || !detailView) return;
  archive.querySelectorAll("[data-hobby-inline]").forEach((panel) => panel.remove());
  archive.querySelectorAll("[data-hobby-category]").forEach((item) => item.setAttribute("aria-expanded", "false"));
  indexView.hidden = false;
  detailView.hidden = true;
  archive.removeAttribute("data-active-hobby");
  contentPanel.scrollTop = 0;
}

function prepareHobbyArchive() {
  resetHobbyCategory();
}

function prepareCuration() {
  const root = contentPanel.querySelector("[data-curation]");
  if (!root) return;
  const tabs = [...root.querySelectorAll("[data-curation-category]")];
  const dots = [...root.querySelectorAll("[data-curation-slide]")];
  const image = root.querySelector("[data-curation-image]");
  const title = root.querySelector("[data-curation-title]");
  const description = root.querySelector("[data-curation-description]");
  const icon = root.querySelector(".curation-icon");
  let category = "sports";
  let slideIndex = 0;

  const render = (nextCategory = category, nextIndex = slideIndex) => {
    const data = CURATION_DATA[nextCategory] || CURATION_DATA.sports;
    category = nextCategory;
    slideIndex = (nextIndex + data.images.length) % data.images.length;
    tabs.forEach((tab) => tab.setAttribute("aria-pressed", String(tab.dataset.curationCategory === category)));
    dots.forEach((dot, index) => {
      const visible = index < data.images.length;
      dot.hidden = !visible;
      if (visible) {
        dot.setAttribute("aria-current", String(index === slideIndex));
        dot.setAttribute("aria-label", `Show ${data.title} image ${index + 1}`);
      }
    });
    if (image) {
      image.classList.add("is-changing");
      window.setTimeout(() => {
        image.src = data.images[slideIndex];
        image.alt = `${data.title} archive photo ${slideIndex + 1}`;
        image.classList.remove("is-changing");
      }, reduceMotion ? 0 : 120);
    }
    if (title) title.textContent = data.title;
    if (description) description.textContent = data.description;
    if (icon) {
      icon.innerHTML = `<i data-lucide="${data.icon}"></i>`;
      window.lucide?.createIcons({ attrs: { "aria-hidden": "true" } });
    }
  };

  tabs.forEach((tab) => tab.addEventListener("click", () => render(tab.dataset.curationCategory, 0)));
  dots.forEach((dot) => dot.addEventListener("click", () => render(category, Number(dot.dataset.curationSlide))));
  image?.addEventListener("click", () => render(category, slideIndex + 1));
  render();
}

function setCameraArchiveRoll(button) {
  const rollId = button.dataset.cameraRoll;
  if (!rollId) return;

  contentPanel.querySelectorAll("[data-camera-roll]").forEach((tab) => {
    const active = tab === button;
    tab.classList.toggle("is-active", active);
    tab.setAttribute("aria-selected", String(active));
  });

  contentPanel.querySelectorAll("[data-camera-roll-panel]").forEach((panel) => {
    const active = panel.dataset.cameraRollPanel === rollId;
    panel.classList.toggle("is-active", active);
    panel.hidden = !active;
    if (active) panel.querySelector(".camera-film-track")?.scrollTo({
      left: 0,
      behavior: reduceMotion ? "auto" : "smooth",
    });
  });
}

function prepareCameraArchive() {
  const firstRoll = contentPanel.querySelector("[data-camera-roll]");
  if (firstRoll) setCameraArchiveRoll(firstRoll);
}

function formatRecordingTime(value) {
  if (!Number.isFinite(value) || value < 0) return "--:--";
  const minutes = Math.floor(value / 60);
  const seconds = Math.floor(value % 60);
  return `${minutes}:${String(seconds).padStart(2, "0")}`;
}

function stopUkuleleAudio() {
  const audio = contentPanel.querySelector("[data-ukulele-audio]");
  if (!audio) return;
  audio.pause();
  audio.removeAttribute("src");
  audio.load();
}

function prepareUkuleleAccess() {
  const access = contentPanel.querySelector("[data-ukulele-access]");
  const player = contentPanel.querySelector("[data-ukulele-player]");
  const input = access?.querySelector("input[name=\"password\"]");
  const message = access?.querySelector("[data-ukulele-access-message], .ukulele-access-message");
  if (!access || !player || !input) return;

  access.addEventListener("submit", (event) => {
    event.preventDefault();
    const unlocked = input.value.trim() === "2026";
    if (!unlocked) {
      input.value = "";
      input.setAttribute("aria-invalid", "true");
      if (message) message.textContent = "That password does not open this recording.";
      input.focus({ preventScroll: true });
      return;
    }

    input.removeAttribute("aria-invalid");
    access.hidden = true;
    player.hidden = false;
    prepareUkulelePlayer();
  });
}

function prepareUkulelePlayer() {
  const player = contentPanel.querySelector("[data-ukulele-player]");
  const audio = player?.querySelector("[data-ukulele-audio]");
  const trackButtons = [...(contentPanel.querySelectorAll("[data-ukulele-track]") || [])];
  const playButton = player?.querySelector('[data-ukulele-action="play"]');
  if (!player || !audio || !trackButtons.length || !playButton) return;

  let currentIndex = 0;

  const setPlayIcon = (playing) => {
    playButton.querySelector("svg, [data-lucide]")?.remove();
    const icon = document.createElement("i");
    icon.dataset.lucide = playing ? "pause" : "play";
    playButton.prepend(icon);
    playButton.title = playing ? "Pause recording" : "Play recording";
    playButton.querySelector(".sr-only").textContent = playing ? "Pause recording" : "Play recording";
    window.lucide?.createIcons({ attrs: { "aria-hidden": "true" } });
  };

  const selectTrack = (index, autoplay = false) => {
    const nextIndex = (index + trackButtons.length) % trackButtons.length;
    const nextTrack = trackButtons[nextIndex];
    audio.pause();
    audio.removeAttribute("src");
    audio.removeAttribute("data-track-index");
    audio.load();
    currentIndex = nextIndex;
    trackButtons.forEach((button, buttonIndex) => {
      button.setAttribute("aria-pressed", String(buttonIndex === nextIndex));
    });
    player.classList.remove("is-playing", "has-audio-error");
    setPlayIcon(false);
    if (autoplay) playButton.click();
  };

  const playCurrentTrack = async () => {
    const track = trackButtons[currentIndex];
    if (!audio.getAttribute("src")) {
      audio.src = track.dataset.src;
      audio.dataset.trackIndex = String(currentIndex);
      audio.load();
    }
    try {
      await audio.play();
    } catch {
      player.classList.remove("is-playing");
      player.classList.add("has-audio-error");
      setPlayIcon(false);
    }
  };

  player.addEventListener("click", (event) => {
    const target = event.target instanceof Element ? event.target : null;
    const action = target?.closest("[data-ukulele-action]")?.dataset.ukuleleAction;
    if (!action) return;
    if (action === "play") {
      if (audio.paused) playCurrentTrack();
      else audio.pause();
      return;
    }
    const wasPlaying = !audio.paused;
    selectTrack(currentIndex + (action === "next" ? 1 : -1), wasPlaying);
  });

  contentPanel.querySelector(".ukulele-track-list")?.addEventListener("click", (event) => {
    const button = event.target instanceof Element ? event.target.closest("[data-ukulele-track]") : null;
    if (!button) return;
    const wasPlaying = !audio.paused;
    selectTrack(Number(button.dataset.ukuleleTrack), wasPlaying);
  });

  audio.addEventListener("loadedmetadata", () => {
    trackButtons[currentIndex].querySelector(".ukulele-track-duration").textContent = formatRecordingTime(audio.duration);
  });
  audio.addEventListener("play", () => {
    player.classList.add("is-playing");
    player.classList.remove("has-audio-error");
    setPlayIcon(true);
  });
  audio.addEventListener("pause", () => {
    player.classList.remove("is-playing");
    setPlayIcon(false);
  });
  audio.addEventListener("ended", () => selectTrack(currentIndex + 1, true));
  audio.addEventListener("error", () => {
    player.classList.remove("is-playing");
    player.classList.add("has-audio-error");
    setPlayIcon(false);
  });

  selectTrack(0);
}

function openPanel(key) {
  const content = PANEL_CONTENT[key];
  if (!content) return;
  const opensDirectlyInBrowser = key === "books";
  stopUkuleleAudio();
  panelEyebrow.textContent = content.eyebrow;
  panelTitle.textContent = content.title;
  panelBody.innerHTML = content.body;
  contentPanel.scrollTop = 0;
  if (key === "poster") prepareFilmIndex();
  contentPanel.classList.toggle("is-poster-panel", key === "poster");
  contentPanel.classList.toggle("is-turntable-panel", key === "turntable");
  contentPanel.classList.toggle("is-phone-panel", key === "coffee");
  contentPanel.classList.toggle("is-books-panel", key === "books");
  contentPanel.classList.toggle("is-sports-panel", key === "sports");
  contentPanel.classList.toggle("is-camera-panel", key === "camera");
  contentPanel.classList.toggle("is-music-panel", key === "music");
  contentPanel.classList.toggle("is-direct-browser", opensDirectlyInBrowser);
  contentPanel.classList.remove("is-reading-stage");
  contentPanel.classList.toggle("is-her-gaze-expanded", opensDirectlyInBrowser);
  app.classList.toggle("is-her-gaze-open", opensDirectlyInBrowser);
  if (key === "poster") void contentPanel.offsetWidth;
  contentPanel.classList.add("is-open");
  contentPanel.setAttribute("aria-hidden", "false");
  window.lucide?.createIcons({ attrs: { "aria-hidden": "true" } });
  if (key === "sports") prepareCuration();
  if (key === "camera") prepareCameraArchive();
  if (key === "music") prepareUkuleleAccess();
  if (key === "books" || key === "poster" || key === "turntable" || key === "coffee") prepareEmbeddedBrowser();
  if (opensDirectlyInBrowser) {
    requestAnimationFrame(() => contentPanel.querySelector(".project-preview-frame iframe")?.focus({ preventScroll: true }));
  } else {
    panelClose.focus({ preventScroll: true });
  }
}

function closePanel(restore = true) {
  stopUkuleleAudio();
  contentPanel.classList.remove("is-her-gaze-expanded", "is-direct-browser", "is-poster-panel", "is-turntable-panel", "is-phone-panel", "is-books-panel", "is-sports-panel", "is-camera-panel", "is-music-panel", "is-reading-stage");
  app.classList.remove("is-her-gaze-open");
  contentPanel.classList.remove("is-open");
  contentPanel.setAttribute("aria-hidden", "true");
  if (restore && focusedId) restoreHome();
}

function openTerminal() {
  contentPanel.classList.remove("is-open");
  app.classList.add("is-terminal-open");
  terminalOverlay.classList.add("is-open");
  terminalOverlay.setAttribute("aria-hidden", "false");
  resetTerminal();
  setTerminalScreenActive(true);
  markTerminalTextureDirty();
  requestAnimationFrame(() => {
    updateTerminalPlacement();
    terminalInput.focus({ preventScroll: true });
  });
}

function closeTerminal(restore = true) {
  app.classList.remove("is-terminal-open");
  terminalOverlay.classList.remove("is-open");
  terminalOverlay.setAttribute("aria-hidden", "true");
  setTerminalScreenActive(false);
  if (restore && focusedId) restoreHome();
}

function setHover(id) {
  if (hoveredId === id) return;
  hoveredId = id;
  const definition = id ? OBJECT_DEFINITIONS[id] : null;
  hoverLabel.querySelector("span").textContent = definition?.label ?? "";
  hoverLabel.classList.toggle("is-visible", Boolean(definition));
  canvas.style.cursor = definition ? "pointer" : "grab";
}

function raycastAt(clientX, clientY) {
  if (!roomModel || terminalOverlay.classList.contains("is-open") || contentPanel.classList.contains("is-open")) return null;
  const rect = canvas.getBoundingClientRect();
  pointer.x = ((clientX - rect.left) / rect.width) * 2 - 1;
  pointer.y = -((clientY - rect.top) / rect.height) * 2 + 1;
  raycaster.setFromCamera(pointer, camera);
  const hit = raycaster.intersectObjects(interactiveMeshes, false)[0];
  return hit?.object?.userData?.roomObjectId ?? null;
}

function applyLighting() {
  app.classList.toggle("is-night", isNight);
  app.classList.toggle("is-day", !isNight);
  const environmentColor = isNight ? 0x25272d : 0xcfccc7;
  scene.background.set(environmentColor);
  scene.fog.color.set(environmentColor);
  openGroundMaterial?.color.set(isNight ? 0x292b30 : 0xc7c4bf);
  hemisphere.color.set(isNight ? 0x60708c : 0xf3f1e8);
  hemisphere.groundColor.set(isNight ? 0x171820 : 0x50545d);
  hemisphere.intensity = isNight ? 1.05 : 2.1;
  keyLight.color.set(isNight ? 0x93a5c5 : 0xfff2df);
  keyLight.intensity = isNight ? 1.25 : 3.4;
  rimLight.color.set(isNight ? 0x8b5f85 : 0x9cb8d8);
  rimLight.intensity = isNight ? 1.4 : 0.85;
  lampLight.intensity = lampOn ? (isNight ? 9 : 1.1) : 0;
  renderer.toneMappingExposure = isNight ? 1 : 1.05;
  lampToggle.setAttribute("aria-pressed", String(lampOn));
  timeToggle.setAttribute("aria-pressed", String(isNight));
  const timeLabel = isNight ? "Switch to day" : "Switch to night";
  timeToggle.title = timeLabel;
  timeToggle.setAttribute("aria-label", timeLabel);
}

function toggleTime() {
  isNight = !isNight;
  applyLighting();
  const oldIcon = timeToggle.querySelector("svg, [data-lucide]");
  oldIcon?.remove();
  const icon = document.createElement("i");
  icon.dataset.lucide = isNight ? "sun" : "moon";
  timeToggle.prepend(icon);
  window.lucide?.createIcons({ attrs: { "aria-hidden": "true" } });
}

function closeObjectMenu() {
  objectMenu.hidden = true;
  indexToggle.setAttribute("aria-expanded", "false");
}

function toggleObjectMenu() {
  const willOpen = objectMenu.hidden;
  objectMenu.hidden = !willOpen;
  indexToggle.setAttribute("aria-expanded", String(willOpen));
}

const TERMINAL_COMMANDS = [
  "start",
  "help",
  "about",
  "experience",
  "projects",
  "open",
  "back",
  "ask",
  "recommend",
  "contact",
  "coffee",
  "sudo",
  "exit",
  "clear",
];

const terminalHistory = [];
let terminalHistoryIndex = 0;
let terminalContext = { mode: "root", projectId: null };

const ASCII_BROOKE = String.raw` ____  ____   ___   ___  _  _______
| __ )|  _ \ / _ \ / _ \| |/ / ____|
|  _ \| |_) | | | | | | | ' /|  _|
| |_) |  _ <| |_| | |_| | . \| |___
|____/|_| \_\\___/ \___/|_|\_\_____|`;

function appendTerminalLine(content = "", className = "", trustedHtml = false) {
  terminalScrollOffset = 0;
  const line = document.createElement("div");
  line.className = `terminal-line ${className}`.trim();
  if (trustedHtml) line.innerHTML = content;
  else line.textContent = content;
  terminalOutput.append(line);
  terminalShell.scrollTop = terminalShell.scrollHeight;
  markTerminalTextureDirty();
  return line;
}

function appendPrompt(command) {
  appendTerminalLine(
    `<span class="prompt-user">guest</span><span class="prompt-at">@</span><span class="prompt-host">brooke</span>:~$ <span class="command-name">${escapeHtml(command)}</span>`,
    "is-command",
    true,
  );
}

function escapeHtml(value) {
  return value.replace(/[&<>'"]/g, (character) => ({
    "&": "&amp;",
    "<": "&lt;",
    ">": "&gt;",
    "'": "&#39;",
    '"': "&quot;",
  })[character]);
}

function printWelcome(includePrompt = true) {
  if (includePrompt) appendPrompt("welcome");
  const ascii = document.createElement("pre");
  ascii.className = "terminal-ascii";
  ascii.textContent = ASCII_BROOKE;
  terminalOutput.append(ascii);
  markTerminalTextureDirty();
  appendTerminalLine("Hi, I am Brooke.");
  appendTerminalLine("Take your time. Nothing here is in a hurry.");
  appendTerminalLine("Type `start` for a guided visit, or `help` to look around.", "is-muted");
}

function resetTerminal() {
  terminalOutput.replaceChildren();
  terminalContext = { mode: "root", projectId: null };
  terminalScrollOffset = 0;
  terminalMaxScroll = 0;
  printWelcome(true);
  terminalHistoryIndex = terminalHistory.length;
  terminalShell.scrollTop = 0;
  markTerminalTextureDirty();
}

function printHelp() {
  appendTerminalLine("Available commands:", "is-muted");
  const commands = [
    ["start", "begin a guided introduction"],
    ["help", "check available commands"],
    ["about", "a short introduction"],
    ["experience", "view my professional experience"],
    ["projects", "view projects I have built"],
    ["ask", "ask about work or interests"],
    ["recommend", "get a book, film, song, or place"],
    ["contact", "find me elsewhere"],
    ["exit", "leave the terminal"],
    ["clear", "clear the terminal"],
  ];
  commands.forEach(([name, description]) => {
    appendTerminalLine(`<span class="command-name">${name.padEnd(12, " ")}</span> — ${description}`, "", true);
  });
}

function printExperience() {
  appendTerminalLine("AI Overseas Product Operations — Baidu", "");
  appendTerminalLine("Building AI applications, global community workflows, and overseas content systems.", "is-muted");
  appendTerminalLine("Overseas User Operations — ShengShu / Vidu", "");
  appendTerminalLine("Creator outreach, community activation, and product feedback for a global AI video platform.", "is-muted");
  appendTerminalLine("Overseas Content Operations — Ancher", "");
  appendTerminalLine("AI news curation, newsletter publishing, prompt iteration, and structured A/B testing.", "is-muted");
}

function printProjects() {
  const projects = [
    ["her-gaze", "Her Gaze", "https://brookell.github.io/her-gaze/", "A feminist editorial cinema platform exploring visual theory and reclaiming the gaze."],
    ["catpuccino", "Cat-puccino", "https://brookell.github.io/cat-pu-c-ci-no/", "A tactile hydration logger with fluid animation and playful health insights."],
    ["woolf-space", "Virginia Woolf Space", "URL pending publication", "An immersive stream-of-consciousness experience built around rootedness and flow."],
    ["cosmic-vinyl", "Cosmic Vinyl", "https://brookell.github.io/cosmic-vinyl/", "A gesture-controlled 3D audio gallery using MediaPipe and the Web Audio API."],
  ];
  projects.forEach(([id, name, url, description]) => {
    appendTerminalLine(`${name}  /  ${id}`);
    appendTerminalLine(url, "is-muted");
    appendTerminalLine(description, "is-muted");
  });
  appendTerminalLine("Click a project in the room, or type `open <project-id>` to enter a new interface and experience it.", "is-muted");
}

const randomFacts = [
  "I value genuine, quiet connections more than crowded rooms.",
  "Years of athletic practice shaped how I approach difficult work.",
  "I am happiest when strategy and creative making meet.",
  "Bookstores are one of my favorite ways to lose track of time.",
  "I try to keep a beginner's mind, especially around new technology.",
  "My name reminds me of a small stream: rooted, but still moving.",
];

const PROJECT_ARCHIVE = {
  "her-gaze": {
    title: "HER GAZE / PROJECT FILE 01",
    role: "Concept, product, and editorial design",
    focus: "Feminist film criticism and visual theory",
    question: "Who is allowed to look, and who is made visible?",
    status: "Editorial experiment",
    detail: "A quieter cinema platform that treats criticism as an experience rather than a feed.",
  },
  catpuccino: {
    title: "CATPUCCINO / PROJECT FILE 02",
    role: "Product concept and interaction design",
    focus: "Everyday hydration without clinical pressure",
    question: "Can a health habit feel tactile, playful, and kind?",
    status: "Interactive prototype",
    detail: "A fluid hydration logger shaped around small rituals, responsive motion, and gentle feedback.",
  },
  "woolf-space": {
    title: "VIRGINIA WOOLF SPACE / PROJECT FILE 03",
    role: "Creative direction and interaction design",
    focus: "Stream of consciousness in a spatial interface",
    question: "How can a sentence become a place to move through?",
    status: "Immersive web experiment",
    detail: "An experience built around Woolf's line: I am rooted, but I flow.",
  },
  "cosmic-vinyl": {
    title: "COSMIC VINYL / PROJECT FILE 04",
    role: "Creative coding and interaction design",
    focus: "Gesture-controlled listening",
    question: "What happens when browsing music becomes a physical gesture?",
    status: "Interactive audio experiment",
    detail: "A 3D audio gallery combining MediaPipe gesture input with the Web Audio API.",
  },
};

const PROJECT_ALIASES = {
  "her gaze": "her-gaze",
  "her-gaze": "her-gaze",
  catpuccino: "catpuccino",
  "virginia woolf space": "woolf-space",
  "woolf space": "woolf-space",
  "woolf-space": "woolf-space",
  "cosmic vinyl": "cosmic-vinyl",
  "cosmic-vinyl": "cosmic-vinyl",
};

const RECOMMENDATIONS = {
  book: [
    ["The Waves — Virginia Woolf", "For its rhythm, many voices, and the feeling of being rooted while still moving."],
    ["A Room of One's Own — Virginia Woolf", "For its clear argument that creative freedom needs space, time, and independence."],
  ],
  film: [
    ["Delphine and Carole, insoumuses", "A portrait of friendship, feminist filmmaking, and the politics of who holds the camera."],
  ],
  song: [
    ["The listening shelf is still being catalogued.", "Some recommendations are better added only after they have stayed for a while."],
  ],
  place: [
    ["A quiet bookstore with no reason to hurry", "The best place is often one where losing track of time feels useful."],
  ],
};

function printStartMenu() {
  terminalContext = { mode: "start", projectId: null };
  appendTerminalLine("What brought you here?");
  appendTerminalLine("[1] Work and experience");
  appendTerminalLine("[2] Projects and experiments");
  appendTerminalLine("[3] Books, films, and music");
  appendTerminalLine("[4] Something unexpected");
  appendTerminalLine("Reply with 1, 2, 3, or 4.", "is-muted");
}

function handleStartChoice(choice) {
  if (terminalContext.mode !== "start") return false;
  terminalContext.mode = "root";
  if (choice === "1") {
    printExperience();
  } else if (choice === "2") {
    printProjects();
  } else if (choice === "3") {
    appendTerminalLine("Ask me about books, films, music, sports, or photography.");
    appendTerminalLine("Try `ask what do you read` or `recommend film`.", "is-muted");
  } else if (choice === "4") {
    appendTerminalLine(randomFacts[Math.floor(Math.random() * randomFacts.length)]);
    appendTerminalLine("There are a few hidden commands here. Coffee may help.", "is-muted");
  } else {
    terminalContext.mode = "start";
    appendTerminalLine("Choose 1, 2, 3, or 4.", "is-error");
  }
  return true;
}

function openProjectFile(query) {
  const normalizedQuery = query.trim().toLowerCase().replace(/\s+/g, " ");
  if (!normalizedQuery) {
    printProjects();
    return;
  }
  const projectId = Object.hasOwn(PROJECT_ALIASES, normalizedQuery)
    ? PROJECT_ALIASES[normalizedQuery]
    : normalizedQuery.replace(/\s+/g, "-");
  const project = Object.hasOwn(PROJECT_ARCHIVE, projectId) ? PROJECT_ARCHIVE[projectId] : null;
  if (!project) {
    appendTerminalLine(`project not found: ${query}`, "is-error");
    appendTerminalLine("Try `projects` to see the available project IDs.", "is-muted");
    return;
  }

  terminalContext = { mode: "project", projectId };
  appendTerminalLine(project.title);
  appendTerminalLine(`Role      ${project.role}`, "is-muted");
  appendTerminalLine(`Focus     ${project.focus}`, "is-muted");
  appendTerminalLine(`Question  ${project.question}`, "is-muted");
  appendTerminalLine(`Status    ${project.status}`, "is-muted");
  appendTerminalLine(project.detail);
  appendTerminalLine("Type `back` to return to the project index.", "is-muted");
}

function answerQuestion(question) {
  const normalizedQuestion = question.trim().toLowerCase();
  if (!normalizedQuestion) {
    appendTerminalLine("Try asking about work, books, films, music, sports, photography, or my name.", "is-muted");
    return;
  }

  if (/name|brooke/.test(normalizedQuestion)) {
    appendTerminalLine("My name reminds me of a small stream: rooted, but still moving.");
  } else if (/why product|product/.test(normalizedQuestion)) {
    appendTerminalLine("Product work lets strategy and creative making meet in something people can actually use.");
  } else if (/work|working|job|ai/.test(normalizedQuestion)) {
    appendTerminalLine("I work in AI overseas product operations at Baidu.");
    appendTerminalLine("I care about turning complex systems into useful global experiences.", "is-muted");
  } else if (/book|read/.test(normalizedQuestion)) {
    appendTerminalLine("I return to Virginia Woolf for rhythm, interiority, and the courage to remain fluid.");
  } else if (/film|cinema|gaze/.test(normalizedQuestion)) {
    appendTerminalLine("Films taught me to notice framing, silence, and who is allowed to look.");
  } else if (/music|song|vinyl/.test(normalizedQuestion)) {
    appendTerminalLine("I like music that changes the temperature of a room and rewards unhurried listening.");
  } else if (/sport|table tennis|athletic|training/.test(normalizedQuestion)) {
    appendTerminalLine("Eight years of athletics taught me that endurance is built quietly, one repetition at a time.");
  } else if (/photo|camera|photography/.test(normalizedQuestion)) {
    appendTerminalLine("I am drawn to ordinary light, unguarded moments, and photographs that feel like fragments of memory.");
  } else if (/happy|joy|love/.test(normalizedQuestion)) {
    appendTerminalLine("Making something thoughtful, finding a good bookstore, and having one honest conversation.");
  } else {
    appendTerminalLine("I do not have an answer for that yet.");
    appendTerminalLine("Try asking about work, books, films, music, sports, photography, or my name.", "is-muted");
  }
}

function printRecommendation(type) {
  const normalizedType = type.trim().toLowerCase();
  if (!normalizedType) {
    appendTerminalLine("Choose a recommendation: book, film, song, or place.", "is-muted");
    return;
  }
  const choices = Object.hasOwn(RECOMMENDATIONS, normalizedType) ? RECOMMENDATIONS[normalizedType] : null;
  if (!choices) {
    appendTerminalLine(`No recommendations filed under: ${type}`, "is-error");
    appendTerminalLine("Try `recommend book`, `recommend film`, `recommend song`, or `recommend place`.", "is-muted");
    return;
  }
  const [title, note] = choices[Math.floor(Math.random() * choices.length)];
  appendTerminalLine(title);
  appendTerminalLine(note, "is-muted");
}

function runTerminalCommand(rawValue) {
  const original = rawValue.trim();
  if (!original) return;
  const normalized = original.replace(/^\//, "");
  const [commandRaw, ...args] = normalized.split(/\s+/);
  const command = commandRaw.toLowerCase();
  terminalScrollOffset = 0;

  terminalHistory.push(original);
  terminalHistoryIndex = terminalHistory.length;

  if (command === "clear") {
    terminalContext = { mode: "root", projectId: null };
    terminalScrollOffset = 0;
    terminalMaxScroll = 0;
    terminalOutput.replaceChildren();
    return;
  }

  appendPrompt(original);

  switch (command) {
    case "start":
      printStartMenu();
      break;
    case "1":
    case "2":
    case "3":
    case "4":
      if (!handleStartChoice(command)) appendTerminalLine("Type `start` before choosing a path.", "is-muted");
      break;
    case "help":
      printHelp();
      break;
    case "about":
      appendTerminalLine("MIB @ Beijing Foreign Studies University.");
      appendTerminalLine("Competitive grit × creative soul. Rooted yet fluid.", "is-muted");
      appendTerminalLine("I work in AI overseas product operations, where strategy, global communities, and creative coding overlap.");
      break;
    case "now":
      appendTerminalLine("Working in AI overseas product operations at Baidu.");
      appendTerminalLine("Building global content systems, community workflows, and small experiments that turn ideas into usable products.", "is-muted");
      break;
    case "experience":
      printExperience();
      break;
    case "projects":
      terminalContext = { mode: "root", projectId: null };
      printProjects();
      break;
    case "open":
      openProjectFile(args.join(" "));
      break;
    case "back":
      if (terminalContext.projectId) {
        terminalContext = { mode: "root", projectId: null };
        printProjects();
      } else {
        appendTerminalLine("You are already at the main prompt.", "is-muted");
      }
      break;
    case "ask":
      answerQuestion(args.join(" "));
      break;
    case "recommend":
      printRecommendation(args.join(" "));
      break;
    case "books":
      appendTerminalLine("Virginia Woolf — The Waves");
      appendTerminalLine("“I am rooted, but I flow.”", "is-muted");
      appendTerminalLine("The rest of the shelf is still being annotated.");
      break;
    case "films":
      appendTerminalLine("I am interested in framing, silence, visual theory, and who is allowed to look.");
      appendTerminalLine("That line of thought became Her Gaze, a feminist editorial cinema project.", "is-muted");
      break;
    case "music":
      appendTerminalLine("Indie waves, tactile interfaces, and records that change the temperature of a room.");
      appendTerminalLine("Cosmic Vinyl turned that interest into a gesture-controlled 3D audio gallery.", "is-muted");
      break;
    case "sport":
    case "sports":
      appendTerminalLine("8+ years of athletics.");
      appendTerminalLine("Table tennis taught me that endurance is built quietly, one repetition at a time.", "is-muted");
      break;
    case "photos":
      appendTerminalLine("The photo archive is being developed.");
      appendTerminalLine("It will hold streets, friends, ordinary light, and the fragments worth keeping.", "is-muted");
      break;
    case "contact":
      appendTerminalLine('<a href="mailto:brookel0619@163.com">brookel0619@163.com</a>', "", true);
      appendTerminalLine('<a href="https://github.com/Brookell" target="_blank" rel="noreferrer">github.com/Brookell</a>', "", true);
      appendTerminalLine('<a href="https://www.linkedin.com/in/brooke-liao0619/" target="_blank" rel="noreferrer">linkedin.com/in/brooke-liao0619</a>', "", true);
      break;
    case "random":
      appendTerminalLine(randomFacts[Math.floor(Math.random() * randomFacts.length)]);
      break;
    case "echo":
      appendTerminalLine(args.join(" "));
      break;
    case "history":
      terminalHistory.forEach((entry, index) => appendTerminalLine(`${String(index + 1).padStart(3, " ")}  ${entry}`));
      break;
    case "welcome":
      printWelcome(false);
      break;
    case "coffee":
      appendTerminalLine("Brewing something strong enough for another round of edits...");
      appendTerminalLine("[..........]");
      appendTerminalLine("[#####.....]");
      appendTerminalLine("[##########] ready.", "is-muted");
      break;
    case "sudo":
      if (args.join(" ").toLowerCase() === "hire brooke") {
        appendTerminalLine("Permission granted.");
        appendTerminalLine('<a href="mailto:brookel0619@163.com">Opening contact: brookel0619@163.com</a>', "", true);
      } else {
        appendTerminalLine("Brooke trusts curiosity, not root access.", "is-error");
      }
      break;
    case "exit":
      appendTerminalLine("You can leave the terminal. The room will still be here.", "is-muted");
      window.setTimeout(() => closeTerminal(true), reduceMotion ? 1 : 850);
      break;
    default: {
      const suggestion = TERMINAL_COMMANDS.find((known) => known.startsWith(command[0] ?? ""));
      appendTerminalLine(`command not found: ${command}`, "is-error");
      if (suggestion) appendTerminalLine(`Did you mean '${suggestion}'?`, "is-muted");
    }
  }
}

terminalForm.addEventListener("submit", (event) => {
  event.preventDefault();
  const value = terminalInput.value;
  terminalInput.value = "";
  runTerminalCommand(value);
  markTerminalTextureDirty();
});

terminalInput.addEventListener("input", () => {
  terminalScrollOffset = 0;
  markTerminalTextureDirty();
});

terminalInput.addEventListener("keydown", (event) => {
  if (event.key === "Enter") {
    event.preventDefault();
    terminalForm.requestSubmit();
  } else if (event.key === "ArrowUp") {
    event.preventDefault();
    if (!terminalHistory.length) return;
    terminalHistoryIndex = Math.max(0, terminalHistoryIndex - 1);
    terminalInput.value = terminalHistory[terminalHistoryIndex] ?? "";
    markTerminalTextureDirty();
  } else if (event.key === "ArrowDown") {
    event.preventDefault();
    terminalHistoryIndex = Math.min(terminalHistory.length, terminalHistoryIndex + 1);
    terminalInput.value = terminalHistory[terminalHistoryIndex] ?? "";
    markTerminalTextureDirty();
  } else if (event.key === "Tab") {
    event.preventDefault();
    const partial = terminalInput.value.trim().replace(/^\//, "").toLowerCase();
    const match = TERMINAL_COMMANDS.find((command) => command.startsWith(partial));
    if (match) {
      terminalInput.value = match;
      markTerminalTextureDirty();
    }
  } else if (event.key === "PageUp") {
    event.preventDefault();
    setTerminalScrollOffset(terminalScrollOffset + terminalScreenCanvas.height * 0.72);
  } else if (event.key === "PageDown") {
    event.preventDefault();
    setTerminalScrollOffset(terminalScrollOffset - terminalScreenCanvas.height * 0.72);
  } else if (event.key === "Home" && (event.metaKey || event.ctrlKey)) {
    event.preventDefault();
    setTerminalScrollOffset(terminalMaxScroll);
  } else if (event.key === "End" && (event.metaKey || event.ctrlKey)) {
    event.preventDefault();
    setTerminalScrollOffset(0);
  }
});

canvas.addEventListener("pointerdown", (event) => {
  pointerDown = { x: event.clientX, y: event.clientY };
  canvas.style.cursor = hoveredId ? "pointer" : "grabbing";
});

canvas.addEventListener("pointermove", (event) => {
  setHover(raycastAt(event.clientX, event.clientY));
});

canvas.addEventListener("pointerleave", () => setHover(null));

canvas.addEventListener("pointerup", (event) => {
  canvas.style.cursor = hoveredId ? "pointer" : "grab";
  if (!pointerDown) return;
  const moved = Math.hypot(event.clientX - pointerDown.x, event.clientY - pointerDown.y);
  pointerDown = null;
  if (moved > 7) {
    ignoreCanvasClick = true;
    window.setTimeout(() => {
      ignoreCanvasClick = false;
    }, 0);
  }
});

app.addEventListener("click", (event) => {
  const target = event.target instanceof Element ? event.target : null;
  if (target?.closest("button, input, form, .content-panel, .object-menu")) return;
  if (ignoreCanvasClick) {
    ignoreCanvasClick = false;
    return;
  }
  const id = raycastAt(event.clientX, event.clientY);
  if (id) focusObject(id);
  else if (focusedId) restoreHome();
});

document.addEventListener("click", (event) => {
  if (!focusedId) return;
  const target = event.target instanceof Element ? event.target : null;
  if (target?.closest("button, input, form, .content-panel, .object-menu")) return;
  if (ignoreCanvasClick) {
    ignoreCanvasClick = false;
    return;
  }
  restoreHome();
}, true);

lampToggle.addEventListener("click", () => {
  lampOn = !lampOn;
  applyLighting();
});
timeToggle.addEventListener("click", toggleTime);
indexToggle.addEventListener("click", toggleObjectMenu);
panelClose.addEventListener("click", () => closePanel(true));
contentPanel.addEventListener("click", (event) => {
  const target = event.target instanceof Element ? event.target : null;
  if (
    contentPanel.classList.contains("is-her-gaze-expanded")
    && !target?.closest(".project-preview-frame")
  ) {
    if (contentPanel.classList.contains("is-direct-browser")) closePanel(true);
    else setHerGazeExpanded(false);
    return;
  }
  const curationCategory = target?.closest("[data-curation-category]");
  if (curationCategory) return;
  const cameraRoll = target?.closest("[data-camera-roll]");
  if (cameraRoll) {
    setCameraArchiveRoll(cameraRoll);
    return;
  }
  const filmButton = target?.closest("[data-film-note]");
  if (filmButton) {
    toggleFilmNote(filmButton);
    return;
  }
  if (target?.closest("[data-open-project-browser]")) {
    setHerGazeExpanded(true);
    return;
  }
});
laptopHotspot.addEventListener("click", () => {
  if (terminalOverlay.classList.contains("is-open")) terminalInput.focus({ preventScroll: true });
  else focusObject("laptop");
});
laptopHotspot.addEventListener("pointerenter", () => setHover("laptop"));
laptopHotspot.addEventListener("pointerleave", () => setHover(null));
laptopHotspot.addEventListener("wheel", (event) => {
  if (!terminalOverlay.classList.contains("is-open")) return;
  event.preventDefault();
  const deltaScale = event.deltaMode === 1
    ? 28
    : event.deltaMode === 2
      ? terminalScreenCanvas.height
      : 1;
  setTerminalScrollOffset(terminalScrollOffset - event.deltaY * deltaScale);
  terminalInput.focus({ preventScroll: true });
}, { passive: false });

laptopHotspot.addEventListener("pointerdown", (event) => {
  if (!terminalOverlay.classList.contains("is-open") || event.pointerType === "mouse") return;
  terminalScrollPointerId = event.pointerId;
  terminalScrollPointerY = event.clientY;
  laptopHotspot.setPointerCapture?.(event.pointerId);
});

laptopHotspot.addEventListener("pointermove", (event) => {
  if (event.pointerId !== terminalScrollPointerId) return;
  event.preventDefault();
  const deltaY = event.clientY - terminalScrollPointerY;
  terminalScrollPointerY = event.clientY;
  setTerminalScrollOffset(terminalScrollOffset + deltaY * 2);
});

const stopTerminalScrollPointer = (event) => {
  if (event.pointerId !== terminalScrollPointerId) return;
  terminalScrollPointerId = null;
  terminalInput.focus({ preventScroll: true });
};
laptopHotspot.addEventListener("pointerup", stopTerminalScrollPointer);
laptopHotspot.addEventListener("pointercancel", stopTerminalScrollPointer);

focusControls.addEventListener("click", (event) => {
  const button = event.target.closest("[data-camera-action]");
  if (button) adjustFocusedCamera(button.dataset.cameraAction);
});

objectMenu.addEventListener("click", (event) => {
  const button = event.target.closest("[data-focus-object]");
  if (button) focusObject(button.dataset.focusObject);
});

document.addEventListener("pointerdown", (event) => {
  if (objectMenu.hidden) return;
  if (objectMenu.contains(event.target) || indexToggle.contains(event.target)) return;
  closeObjectMenu();
});

document.addEventListener("keydown", (event) => {
  if (event.key !== "Escape") return;
  if (!objectMenu.hidden) {
    closeObjectMenu();
    return;
  }
  if (terminalOverlay.classList.contains("is-open")) closeTerminal(true);
  else if (contentPanel.classList.contains("is-her-gaze-expanded")) {
    if (contentPanel.classList.contains("is-direct-browser")) closePanel(true);
    else setHerGazeExpanded(false);
  }
  else if (contentPanel.classList.contains("is-open")) closePanel(true);
  else if (focusedId) restoreHome();
});

function resize() {
  const width = window.innerWidth;
  const height = window.innerHeight;
  camera.aspect = width / height;
  camera.updateProjectionMatrix();
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, width < 720 ? 1.35 : 1.6));
  renderer.setSize(width, height, false);
  calculateHomeView();

  if (focusedId && roomModel) {
    const view = getFocusedCameraView(focusedId);
    if (view) {
      cameraTween = null;
      camera.position.copy(view.position);
      controls.target.copy(view.target);
      controls.update();
      updateTerminalPlacement();
    }
  }

}

window.addEventListener("resize", resize);
resize();
applyLighting();

const clock = new THREE.Clock();
function render(now) {
  requestAnimationFrame(render);

  if (cameraTween) {
    const elapsed = now - cameraTween.start;
    const progress = Math.min(1, elapsed / cameraTween.duration);
    const eased = easeInOutSine(progress);
    camera.position.lerpVectors(cameraTween.fromPosition, cameraTween.toPosition, eased);
    controls.target.lerpVectors(cameraTween.fromTarget, cameraTween.toTarget, eased);
    controls.update();
    if (progress >= 1) {
      const onComplete = cameraTween.onComplete;
      cameraTween = null;
      onComplete?.();
    }
  } else {
    controls.update(clock.getDelta());
  }

  renderTerminalScreen(now);
  updateTerminalPlacement();
  renderer.render(scene, camera);
}
requestAnimationFrame(render);

const dracoLoader = new DRACOLoader();
dracoLoader.setDecoderPath(DRACO_URL);
dracoLoader.preload();

const loader = new GLTFLoader();
loader.setDRACOLoader(dracoLoader);
loader.load(
  MODEL_URL,
  async (gltf) => {
    window.clearTimeout(window.__roomBootTimer);
    roomModel = gltf.scene;
    modelRoot.add(roomModel);
    normalizeModel(roomModel);
    createOpenEnvironment(roomModel);
    removeHeadphones(roomModel);
    await applyWallPosterTexture(roomModel);
    prepareMaterials(modelRoot);
    stabilizeUkuleleSurfaces(roomModel);
    await loadDeskCamera(modelRoot);
    await loadFilmRoll(modelRoot);
    await loadCoffeeCup(modelRoot);
    registerInteractiveObjects(modelRoot);
    registerLaptopScreen(modelRoot);
    positionLampLight();
    calculateHomeView();
    setLoading(100, "Room ready");
    const revealDelay = Math.max(0, MINIMUM_LOADING_TIME - (performance.now() - loadingStartedAt));
    window.setTimeout(() => requestAnimationFrame(() => app.classList.add("is-ready")), revealDelay);
  },
  (event) => {
    const progress = event.total > 0 ? Math.min(99, (event.loaded / event.total) * 100) : Math.min(92, 12 + event.loaded / 70000);
    setLoading(progress, progress > 85 ? "Arranging the desk..." : "Loading the study...");
  },
  (error) => {
    window.clearTimeout(window.__roomBootTimer);
    console.error("Failed to load room model", error);
    setLoading(100, "Written archive ready");
    app.classList.add("is-ready");
    errorNotice.hidden = false;
  },
);
