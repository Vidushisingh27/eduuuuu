const slider = document.querySelector('[data-slider]');
const slides = Array.from(document.querySelectorAll('.hero-slide'));
const dots = Array.from(document.querySelectorAll('.dot'));
const prevButton = document.querySelector('.slider-arrow.left');
const nextButton = document.querySelector('.slider-arrow.right');
const skeletons = document.querySelectorAll('.skeleton');
const gameCards = Array.from(document.querySelectorAll('[data-game]'));
const gameModal = document.querySelector('.game-modal');
const gameCloseButtons = document.querySelectorAll('[data-game-close]');
const gameStartButton = document.querySelector('[data-game-start]');
const gameNextButton = document.querySelector('[data-game-next]');
const gameTitle = document.querySelector('[data-game-title]');
const gameDescription = document.querySelector('[data-game-description]');
const gameDifficulty = document.querySelector('[data-game-difficulty]');
const gameXp = document.querySelector('[data-game-xp]');
const gameScore = document.querySelector('[data-game-score]');
const gameTimer = document.querySelector('[data-game-timer]');
const gameStreak = document.querySelector('[data-game-streak]');
const gameLevel = document.querySelector('[data-game-level]');
const gameTag = document.querySelector('[data-game-tag]');
const gameQuestion = document.querySelector('[data-game-question]');
const gameOptions = document.querySelector('[data-game-options]');
const gameFeedback = document.querySelector('[data-game-feedback]');
const gameProgress = document.querySelector('[data-game-progress]');
const gamePlayerNameInput = document.querySelector('[data-game-player-name]');
const gameNameError = document.querySelector('[data-game-name-error]');
const gameSubmitLeaderboardButton = document.querySelector('[data-game-submit-leaderboard]');
const gameRankEl = document.querySelector('[data-game-rank]');
const gameLocalLeaderboardEl = document.querySelector('[data-game-local-leaderboard]');
const dashboardView = document.querySelector('[data-dashboard-view]');
const settingsShell = document.querySelector('[data-settings-shell]');
const profileMenu = document.querySelector('[data-profile-menu]');
const profileTrigger = document.querySelector('[data-profile-trigger]');
const profileDropdown = document.querySelector('[data-profile-dropdown]');
const openSettingsButtons = document.querySelectorAll('[data-open-settings]');
const closeSettingsButton = document.querySelector('[data-close-settings]');
const settingsNavButtons = Array.from(document.querySelectorAll('[data-settings-target]'));
const settingsTabs = Array.from(document.querySelectorAll('[data-settings-tab]'));
const saveButtons = document.querySelectorAll('[data-save-settings]');
const saveToast = document.querySelector('[data-save-toast]');
const deleteModal = document.querySelector('[data-delete-modal]');
const openDeleteModalButton = document.querySelector('[data-open-delete-modal]');
const closeDeleteModalButtons = document.querySelectorAll('[data-close-delete-modal]');
const confirmDeleteButton = document.querySelector('[data-confirm-delete]');
const themeModeToggle = document.querySelector('[data-theme-mode]');
const themeColorButtons = Array.from(document.querySelectorAll('[data-theme-color]'));
const fontSizeControl = document.querySelector('[data-font-size]');
const navRouteLinks = Array.from(document.querySelectorAll('[data-nav-route]'));
const profileActionButtons = Array.from(document.querySelectorAll('[data-profile-action]'));
const profileNameElement = document.querySelector('.profile-name');
const avatarLettersElement = document.querySelector('.avatar span');
const liveDashboardStatus = document.querySelector('[data-live-dashboard-status]');
const liveProgressSummary = document.querySelector('[data-live-progress-summary]');
const liveProgressMeta = document.querySelector('[data-live-progress-meta]');
const notificationsButton = document.querySelector('.icon-btn[aria-label="Notifications"]');
const imageUploadZone = document.querySelector('[data-image-upload-zone]');
const imageInput = document.querySelector('[data-image-input]');
const imagePreview = document.querySelector('[data-image-preview]');
const imagePlaceholder = document.querySelector('[data-image-placeholder]');
const uploadSelectButton = document.querySelector('[data-upload-select-btn]');
const uploadManualButton = document.querySelector('[data-upload-manual-btn]');
const uploadLoader = document.querySelector('[data-upload-loader]');
const uploadStatus = document.querySelector('[data-upload-status]');
const avatarPreview = document.querySelector('[data-avatar-preview]');
const SESSION_KEY = 'edunova-auth-session';
const SETTINGS_KEY = 'edunova-dashboard-settings';
const PLAYER_NAME_KEY = 'edunova-player-name';
const GAME_LEADERBOARD_KEY = 'edunova-game-leaderboards';
const COURSE_PLAYER_STATE_PREFIX = 'edunova-course-player:state:';

function toBackgroundImageValue(source, fallback = "url('img/continue-learning-cover.svg')") {
  if (!source || typeof source !== 'string') {
    return fallback;
  }

  const value = source.trim();
  if (!value) {
    return fallback;
  }

  if (/^(url\(|linear-gradient\(|radial-gradient\(|conic-gradient\(|var\()/i.test(value)) {
    return value;
  }

  if (/^(https?:\/\/|\/\/|data:|blob:|\/|img\/)/i.test(value)) {
    return `url("${encodeURI(value)}")`;
  }

  return fallback;
}

function formatResumeTime(totalSeconds) {
  const safeSeconds = Math.max(0, Math.floor(Number(totalSeconds) || 0));
  const minutes = Math.floor(safeSeconds / 60);
  const seconds = safeSeconds % 60;
  return `${minutes}m ${String(seconds).padStart(2, '0')}s`;
}

function getLessonByCourse(course, lessonId) {
  if (!course || !lessonId || !Array.isArray(course.modules)) {
    return null;
  }

  const numericLessonId = Number(lessonId);

  for (const module of course.modules) {
    const lesson = module.lessons?.find((item) => Number(item.id) === numericLessonId);
    if (lesson) {
      return {
        ...lesson,
        moduleTitle: module.title,
      };
    }
  }

  return null;
}

function getContinueLearningEntries() {
  if (typeof getCourseById !== 'function') {
    return [];
  }

  return Object.keys(localStorage)
    .filter((key) => key.startsWith(COURSE_PLAYER_STATE_PREFIX))
    .map((key) => {
      const courseId = Number(key.slice(COURSE_PLAYER_STATE_PREFIX.length));
      const course = getCourseById(courseId);
      if (!course) {
        return null;
      }

      try {
        const state = JSON.parse(localStorage.getItem(key) || 'null');
        if (!state) {
          return null;
        }

        const completedLessonIds = Array.isArray(state.completedLessonIds)
          ? state.completedLessonIds.map((lessonId) => Number(lessonId)).filter(Boolean)
          : [];
        const currentLessonId = Number(state.currentLessonId || completedLessonIds[completedLessonIds.length - 1] || 0);

        if (!currentLessonId && completedLessonIds.length === 0) {
          return null;
        }

        const totalLessons = Array.isArray(course.modules)
          ? course.modules.reduce((sum, module) => sum + (module.lessons?.length || 0), 0)
          : 0;
        const progress = totalLessons > 0
          ? Math.round((completedLessonIds.length / totalLessons) * 100)
          : 0;

        return {
          course,
          state,
          lesson: getLessonByCourse(course, currentLessonId),
          progress,
          totalLessons,
          currentLessonTime: Number(state.currentLessonTime || 0),
          hasCurrentLesson: Boolean(state.currentLessonId),
          lastUpdatedAt: Number(state.lastUpdatedAt || 0),
        };
      } catch {
        return null;
      }
    })
    .filter(Boolean)
    .sort((left, right) => {
      const leftScore = left.lastUpdatedAt || (Number(left.hasCurrentLesson) * 1000 + left.progress * 10 + left.currentLessonTime);
      const rightScore = right.lastUpdatedAt || (Number(right.hasCurrentLesson) * 1000 + right.progress * 10 + right.currentLessonTime);
      return rightScore - leftScore;
    });
}

function getSavedLessonMedia(courseId, lessonId) {
  try {
    const stored = localStorage.getItem(`edunova-course-player:media:${courseId}:${lessonId}`);
    return stored ? JSON.parse(stored) : null;
  } catch {
    return null;
  }
}

function renderContinueLearningSection() {
  const section = document.querySelector('[data-continue-section]');
  const media = document.querySelector('[data-continue-media]');
  const category = document.querySelector('[data-continue-course-category]');
  const title = document.querySelector('[data-continue-course-title]');
  const copy = document.querySelector('[data-continue-copy]');
  const lesson = document.querySelector('[data-continue-lesson]');
  const duration = document.querySelector('[data-continue-duration]');
  const progressValue = document.querySelector('[data-continue-progress-value]');
  const progressBar = document.querySelector('[data-continue-progress-bar]');
  const status = document.querySelector('[data-continue-status]');
  const continueCta = document.querySelector('[data-continue-cta]');
  const continueOpen = document.querySelector('[data-continue-open]');

  if (!section || !media || !category || !title || !copy || !lesson || !duration || !progressValue || !progressBar || !status || !continueCta || !continueOpen) {
    return;
  }

  const entries = getContinueLearningEntries();
  if (entries.length === 0) {
    section.hidden = true;
    return;
  }

  const current = entries[0];
  const resumeLesson = current.lesson;
  const progressPercent = current.progress;
  const hasVideoTime = current.currentLessonTime > 0;
  const lessonMedia = current.state.currentLessonId ? getSavedLessonMedia(current.course.id, current.state.currentLessonId) : null;
  const lessonLabel = lessonMedia?.label || resumeLesson?.title || 'Last watched lesson';

  media.style.backgroundImage = toBackgroundImageValue(current.course.coverImage || current.course.thumbnail);
  category.textContent = current.course.category || 'Continue Learning';
  title.textContent = current.course.title;
  copy.textContent = lessonMedia?.label
    ? `Video: ${lessonLabel}`
    : current.course.tagline || current.course.description || 'Continue exactly where you stopped.';
  lesson.textContent = resumeLesson
    ? `${resumeLesson.moduleTitle} • ${lessonLabel}`
    : lessonLabel;
  duration.textContent = current.course.duration || '';
  progressValue.textContent = `${progressPercent}%`;
  progressBar.style.width = `${Math.max(progressPercent, current.hasCurrentLesson ? 6 : 0)}%`;
  status.textContent = current.progress >= 100
    ? 'Course completed. Open the player to review any lesson.'
    : hasVideoTime
      ? `Paused at ${formatResumeTime(current.currentLessonTime)}.`
      : 'Ready to resume from your last lesson.';
  continueCta.href = `course-player.html?course=${current.course.id}`;
  continueOpen.href = `course-player.html?course=${current.course.id}`;
  section.hidden = false;
}

const games = {
  memory: {
    title: 'Memory Boost',
    description: 'Flashcards, speed recall, and streak building across all subjects.',
    difficulty: 'Beginner',
    xp: 120,
    timer: 8,
    questions: [
      {
        prompt: 'Which component stores temporary memory used while a process runs?',
        options: ['RAM', 'ROM', 'Cache', 'SSD'],
        answer: 0,
      },
      {
        prompt: 'What does CPU stand for?',
        options: ['Central Processing Unit', 'Computer Power Unit', 'Core Program Utility', 'Central Protocol Update'],
        answer: 0,
      },
      {
        prompt: 'Which SQL command retrieves data from a table?',
        options: ['SELECT', 'INSERT', 'UPDATE', 'DELETE'],
        answer: 0,
      },
    ],
  },
  logic: {
    title: 'Logic Puzzle',
    description: 'Pattern recognition, reasoning, and instant feedback challenges.',
    difficulty: 'Intermediate',
    xp: 160,
    timer: 10,
    questions: [
      {
        prompt: 'Find the next number: 2, 4, 8, 16, ?',
        options: ['20', '24', '32', '36'],
        answer: 2,
      },
      {
        prompt: 'If all bloops are razzies and some razzies are lazzies, which is true?',
        options: ['All bloops are lazzies', 'Some bloops may be razzies', 'No bloops are lazzies', 'All lazzies are bloops'],
        answer: 1,
      },
      {
        prompt: 'What comes next: A, C, F, J, ?',
        options: ['M', 'N', 'O', 'P'],
        answer: 2,
      },
    ],
  },
  code: {
    title: 'Code Sprint',
    description: 'Debug small code snippets under time pressure for maximum XP.',
    difficulty: 'Advanced',
    xp: 200,
    timer: 12,
    questions: [
      {
        prompt: 'Fix the bug: const nums = [1,2,3]; console.log(nums.lenght);',
        options: ['length', 'size', 'count', 'total'],
        answer: 0,
      },
      {
        prompt: 'Which keyword is missing? if (x = 5) { ... }',
        options: ['==', '===', '=>', '!='],
        answer: 1,
      },
      {
        prompt: 'What should replace console.log("Hello" + )?',
        options: ['world', '5', 'null', 'undefined'],
        answer: 0,
      },
    ],
  },
};

let activeGame = null;
let activeQuestionIndex = 0;
let currentTimer = null;
let timeLeft = 0;
let score = 0;
let streak = 0;
let level = 1;
let hasAnswered = false;
let gameCorrectCount = 0;
let gameWrongCount = 0;
let hasSubmittedGameScore = false;
let lastGameResult = null;

let currentSlide = 0;
let sliderTimer;
let toastTimer;
let selectedImageFile = null;
let imagePreviewObjectUrl = null;

function setUploadStatus(message, type = '') {
  if (!uploadStatus) {
    return;
  }

  uploadStatus.textContent = message;
  uploadStatus.classList.remove('success', 'error');
  if (type) {
    uploadStatus.classList.add(type);
  }
}

function setUploadLoading(isLoading) {
  if (uploadLoader) {
    uploadLoader.hidden = !isLoading;
  }

  if (uploadManualButton) {
    uploadManualButton.disabled = isLoading;
    uploadManualButton.textContent = isLoading ? 'Uploading...' : 'Upload Now';
  }

  if (uploadSelectButton) {
    uploadSelectButton.disabled = isLoading;
  }
}

function applyAvatarImage(imageUrl) {
  if (!avatarPreview) {
    return;
  }

  avatarPreview.style.backgroundImage = `url('${imageUrl}')`;
  avatarPreview.style.backgroundSize = 'cover';
  avatarPreview.style.backgroundPosition = 'center';
  const initialsEl = avatarPreview.querySelector('span');
  if (initialsEl) {
    initialsEl.style.opacity = '0';
  }
}

function renderImagePreview(file) {
  if (!imagePreview || !imagePlaceholder) {
    return;
  }

  if (imagePreviewObjectUrl) {
    URL.revokeObjectURL(imagePreviewObjectUrl);
    imagePreviewObjectUrl = null;
  }

  imagePreviewObjectUrl = URL.createObjectURL(file);
  imagePreview.src = imagePreviewObjectUrl;
  imagePreview.hidden = false;
  imagePlaceholder.hidden = true;
}

function validateImageFile(file) {
  if (!file) {
    return 'No file selected.';
  }

  if (!file.type.startsWith('image/')) {
    return 'Please choose a valid image file.';
  }

  const maxSizeBytes = 5 * 1024 * 1024;
  if (file.size > maxSizeBytes) {
    return 'Image size must be 5MB or less.';
  }

  return '';
}

function getApiBaseUrl() {
  if (window.EdunovaAPI?.getBaseUrl) {
    return window.EdunovaAPI.getBaseUrl();
  }

  return 'http://localhost:5000';
}

async function uploadSelectedImage({ autoTriggered = false } = {}) {
  if (!selectedImageFile) {
    setUploadStatus('Please select an image first.', 'error');
    return;
  }

  const validationError = validateImageFile(selectedImageFile);
  if (validationError) {
    setUploadStatus(validationError, 'error');
    return;
  }

  setUploadLoading(true);
  setUploadStatus(autoTriggered ? 'Auto upload started...' : 'Uploading image...');

  try {
    const formData = new FormData();
    formData.append('image', selectedImageFile);

    const session = window.EdunovaAPI?.getSession?.();
    const headers = {};
    if (session?.token) {
      headers.Authorization = `Bearer ${session.token}`;
    }

    const response = await fetch(`${getApiBaseUrl()}/api/upload/image`, {
      method: 'POST',
      body: formData,
      headers,
    });

    const payload = await response.json();
    if (!response.ok || payload?.success === false) {
      throw new Error(payload?.message || 'Upload failed.');
    }

    const imageUrl = payload?.data?.imageUrl;
    if (imageUrl) {
      applyAvatarImage(`${getApiBaseUrl()}${imageUrl}`);
    }
    setUploadStatus('Image uploaded successfully.', 'success');
  } catch (error) {
    setUploadStatus(error.message || 'Upload failed. Please try again.', 'error');
  } finally {
    setUploadLoading(false);
  }
}

function handleImageSelection(file) {
  const validationError = validateImageFile(file);
  if (validationError) {
    setUploadStatus(validationError, 'error');
    return;
  }

  selectedImageFile = file;
  renderImagePreview(file);
  setUploadStatus('Image selected. Auto uploading...');
  uploadSelectedImage({ autoTriggered: true });
}

function initializeImageUpload() {
  if (!imageUploadZone || !imageInput) {
    return;
  }

  uploadSelectButton?.addEventListener('click', () => {
    imageInput.click();
  });

  uploadManualButton?.addEventListener('click', () => {
    uploadSelectedImage({ autoTriggered: false });
  });

  imageInput.addEventListener('change', () => {
    const file = imageInput.files?.[0];
    if (!file) {
      return;
    }

    handleImageSelection(file);
  });

  imageUploadZone.addEventListener('dragover', (event) => {
    event.preventDefault();
    imageUploadZone.classList.add('is-dragover');
  });

  imageUploadZone.addEventListener('dragleave', () => {
    imageUploadZone.classList.remove('is-dragover');
  });

  imageUploadZone.addEventListener('drop', (event) => {
    event.preventDefault();
    imageUploadZone.classList.remove('is-dragover');
    const file = event.dataTransfer?.files?.[0];
    if (!file) {
      return;
    }

    imageInput.files = event.dataTransfer.files;
    handleImageSelection(file);
  });
}

function getSavedPlayerName() {
  return (localStorage.getItem(PLAYER_NAME_KEY) || '').trim();
}

function savePlayerName(name) {
  localStorage.setItem(PLAYER_NAME_KEY, name);
}

function medalByRank(rank) {
  if (rank === 1) return '🥇';
  if (rank === 2) return '🥈';
  if (rank === 3) return '🥉';
  return `#${rank}`;
}

function loadGameLeaderboards() {
  try {
    return JSON.parse(localStorage.getItem(GAME_LEADERBOARD_KEY) || '{}');
  } catch {
    return {};
  }
}

function saveGameLeaderboards(store) {
  localStorage.setItem(GAME_LEADERBOARD_KEY, JSON.stringify(store));
}

function renderGameLocalLeaderboard(gameKey, highlightedId = null) {
  if (!gameLocalLeaderboardEl) {
    return;
  }

  const store = loadGameLeaderboards();
  const board = Array.isArray(store[gameKey]) ? store[gameKey] : [];

  if (board.length === 0) {
    gameLocalLeaderboardEl.innerHTML = '<div class="leaderboard-loading"><p>No scores yet. Submit your run first.</p></div>';
    gameRankEl.textContent = '#--';
    return;
  }

  gameLocalLeaderboardEl.innerHTML = board.slice(0, 8).map((entry, index) => {
    const rank = index + 1;
    const isCurrent = highlightedId && highlightedId === entry.id;
    return `
      <div class="quiz-leaderboard-row rank-${rank} ${isCurrent ? 'is-current' : ''}">
        <strong>${medalByRank(rank)}</strong>
        <span>${entry.name}</span>
        <strong>${entry.score}</strong>
        <span>${entry.correct}/${entry.total}</span>
      </div>
    `;
  }).join('');

  if (highlightedId) {
    const rank = board.findIndex((entry) => entry.id === highlightedId) + 1;
    gameRankEl.textContent = rank > 0 ? `#${rank}` : '#--';
  }
}

function submitGameResult() {
  if (!activeGame || !lastGameResult || hasSubmittedGameScore) {
    return;
  }

  const store = loadGameLeaderboards();
  const board = Array.isArray(store[activeGame]) ? store[activeGame] : [];
  const entry = {
    id: `${activeGame}-${Date.now()}`,
    name: lastGameResult.name,
    score: lastGameResult.score,
    correct: lastGameResult.correct,
    wrong: lastGameResult.wrong,
    total: lastGameResult.total,
    timestamp: new Date().toISOString(),
  };

  board.push(entry);
  board.sort((left, right) => right.score - left.score || new Date(right.timestamp).getTime() - new Date(left.timestamp).getTime());
  store[activeGame] = board.slice(0, 30);
  saveGameLeaderboards(store);

  hasSubmittedGameScore = true;
  gameSubmitLeaderboardButton.disabled = true;
  renderGameLocalLeaderboard(activeGame, entry.id);
  setFeedback(`Submitted! Your rank is ${gameRankEl.textContent}.`, 'success');
}

function getAuthSession() {
  try {
    return JSON.parse(localStorage.getItem(SESSION_KEY) || 'null');
  } catch {
    return null;
  }
}

function redirectWithTransition(url) {
  document.body.classList.add('page-transition-out');
  window.setTimeout(() => {
    window.location.href = url;
  }, 180);
}

function ensureDashboardSession() {
  const session = getAuthSession();

  if (!session?.isLoggedIn) {
    redirectWithTransition('index.html');
    return null;
  }

  return session;
}

function getInitials(fullName) {
  const parts = String(fullName || 'Learner').trim().split(/\s+/).slice(0, 2);
  return parts.map((part) => part[0]?.toUpperCase() || '').join('') || 'LR';
}

function applySessionToHeader(session) {
  const safeName = session?.name || 'Learner';
  profileNameElement.textContent = safeName;
  avatarLettersElement.textContent = getInitials(safeName);
}

function clearEdunovaStorage() {
  Object.keys(localStorage).forEach((key) => {
    if (key.startsWith('edunova-')) {
      localStorage.removeItem(key);
    }
  });
}

function logoutUser() {
  const performLogout = async () => {
    try {
      if (window.EdunovaAPI) {
        await window.EdunovaAPI.logout();
      }
    } catch {
      // Ignore API logout failure and still clear client session
    } finally {
      clearEdunovaStorage();
      redirectWithTransition('index.html');
    }
  };

  performLogout();
}

function persistDashboardSettings() {
  const payload = {
    darkMode: Boolean(themeModeToggle?.checked),
    accent: document.body.getAttribute('data-accent') || 'blue',
    fontSize: Number(fontSizeControl?.value || 16),
  };

  localStorage.setItem(SETTINGS_KEY, JSON.stringify(payload));
}

function restoreDashboardSettings() {
  try {
    const settings = JSON.parse(localStorage.getItem(SETTINGS_KEY) || 'null');
    if (!settings) {
      return;
    }

    const accent = settings.accent || 'blue';
    document.body.setAttribute('data-accent', accent);
    themeColorButtons.forEach((button) => {
      button.classList.toggle('is-active', button.dataset.themeColor === accent);
    });

    const darkMode = settings.darkMode !== false;
    if (themeModeToggle) {
      themeModeToggle.checked = darkMode;
    }
    document.body.classList.toggle('light-mode', !darkMode);

    const fontSize = Number(settings.fontSize || 16);
    document.documentElement.style.fontSize = `${fontSize}px`;
    if (fontSizeControl) {
      fontSizeControl.value = String(fontSize);
    }
  } catch {
    // ignore corrupt local data
  }
}

async function loadSettingsFromApi() {
  const session = getAuthSession();
  if (!window.EdunovaAPI || !session?.user_id || !session?.token) {
    return;
  }

  try {
    const response = await window.EdunovaAPI.getSettings(session.user_id);
    const data = response?.data;
    if (!data) {
      return;
    }

    const normalized = {
      darkMode: data.theme !== 'light',
      accent: ['blue', 'purple', 'teal'].includes(data.theme) ? data.theme : 'blue',
      fontSize: Number(fontSizeControl?.value || 16),
    };

    localStorage.setItem(SETTINGS_KEY, JSON.stringify(normalized));
    restoreDashboardSettings();
  } catch {
    // Keep local fallback settings
  }
}

async function syncSettingsToApi() {
  const session = getAuthSession();
  if (!window.EdunovaAPI || !session?.user_id || !session?.token) {
    return;
  }

  try {
    await window.EdunovaAPI.saveSettings({
      user_id: Number(session.user_id),
      is_private: false,
      notifications_enabled: true,
      theme: document.body.classList.contains('light-mode')
        ? 'light'
        : (document.body.getAttribute('data-accent') || 'dark'),
    });
  } catch {
    // Keep local save behavior even if API fails
  }
}

async function loadNotificationsFromApi() {
  const session = getAuthSession();
  if (!window.EdunovaAPI || !session?.user_id || !session?.token || !notificationsButton) {
    return;
  }

  try {
    const response = await window.EdunovaAPI.getNotifications(session.user_id);
    const notifications = Array.isArray(response?.data) ? response.data : [];
    const unreadCount = notifications.filter((item) => item.status === 'unread').length;
    notificationsButton.setAttribute('title', unreadCount > 0 ? `${unreadCount} unread notifications` : 'No new notifications');
  } catch {
    notificationsButton.setAttribute('title', 'Notifications unavailable');
  }
}

function updateLiveProgressPanel(message, meta = '', status = '') {
  if (liveProgressSummary) {
    liveProgressSummary.textContent = message;
  }

  if (liveProgressMeta) {
    liveProgressMeta.textContent = meta;
  }

  if (liveDashboardStatus) {
    liveDashboardStatus.textContent = status || 'Live sync active';
  }
function scrollToRouteTarget(selector) {
  const target = document.querySelector(selector);
  if (!target) {
    return;
  }

  target.scrollIntoView({ behavior: 'smooth', block: 'start' });
}

function setActiveNavRoute(route) {
  navRouteLinks.forEach((link) => {
    link.classList.toggle('is-active', link.dataset.navRoute === route);
  });
}

function routeDashboard(route) {
  setActiveNavRoute(route);

  if (route === 'notes') {
    window.location.href = './notes.html';
    return;
  }

  if (route === 'chatbot') {
    window.location.href = './edunova-chatbot.html';
    return;
  }

  const routeMap = {
    home: '#top',
    courses: '#discover',
    notes: './notes.html',
    chatbot: './edunova-chatbot.html',
    quizzes: '#quizzes',
    games: '#games',
    settings: '#settings-shell',
  };

  if (route === 'settings') {
    openSettings('profile');
    return;
  }

  closeSettings();
  const selector = routeMap[route] || '#top';
  scrollToRouteTarget(selector);
}

function restoreRouteFromHash() {
  const hash = window.location.hash;
  const routeByHash = {
    '#discover': 'courses',
    '#quizzes': 'quizzes',
    '#games': 'games',
    '#settings-shell': 'settings',
    '#top': 'home',
  };

  const route = routeByHash[hash];
  if (route) {
    routeDashboard(route);
    return;
  }

  setActiveNavRoute('home');
}

const authSession = ensureDashboardSession();
if (authSession) {
  applySessionToHeader(authSession);
}

function showSlide(index) {
  currentSlide = (index + slides.length) % slides.length;

  slides.forEach((slide, slideIndex) => {
    slide.classList.toggle('is-active', slideIndex === currentSlide);
  });

  dots.forEach((dot, dotIndex) => {
    dot.classList.toggle('is-active', dotIndex === currentSlide);
  });
}

function startAutoPlay() {
  stopAutoPlay();
  sliderTimer = window.setInterval(() => {
    showSlide(currentSlide + 1);
  }, 5000);
}

function stopAutoPlay() {
  if (sliderTimer) {
    window.clearInterval(sliderTimer);
  }
}

function showToast(message) {
  if (!saveToast) {
    return;
  }

  saveToast.textContent = message;
  saveToast.classList.add('show');

  if (toastTimer) {
    window.clearTimeout(toastTimer);
  }

  toastTimer = window.setTimeout(() => {
    saveToast.classList.remove('show');
  }, 1800);
}

function closeProfileDropdown() {
  profileMenu?.classList.remove('is-open');
  profileTrigger?.setAttribute('aria-expanded', 'false');
  profileDropdown?.setAttribute('aria-hidden', 'true');
}

function openProfileDropdown() {
  profileMenu?.classList.add('is-open');
  profileTrigger?.setAttribute('aria-expanded', 'true');
  profileDropdown?.setAttribute('aria-hidden', 'false');
}

function toggleProfileDropdown() {
  if (profileMenu?.classList.contains('is-open')) {
    closeProfileDropdown();
  } else {
    openProfileDropdown();
  }
}

function switchSettingsTab(tabKey) {
  settingsNavButtons.forEach((button) => {
    button.classList.toggle('is-active', button.dataset.settingsTarget === tabKey);
  });

  settingsTabs.forEach((tab) => {
    tab.classList.toggle('is-active', tab.dataset.settingsTab === tabKey);
  });
}

function openSettings(tabKey = 'profile') {
  dashboardView.hidden = true;
  settingsShell.hidden = false;
  switchSettingsTab(tabKey);
  closeProfileDropdown();
  stopAutoPlay();
}

function closeSettings() {
  settingsShell.hidden = true;
  dashboardView.hidden = false;
  startAutoPlay();
}

function openDeleteModal() {
  deleteModal?.classList.add('is-open');
  deleteModal?.setAttribute('aria-hidden', 'false');
}

function closeDeleteModal() {
  deleteModal?.classList.remove('is-open');
  deleteModal?.setAttribute('aria-hidden', 'true');
}

prevButton?.addEventListener('click', () => {
  showSlide(currentSlide - 1);
  startAutoPlay();
});

nextButton?.addEventListener('click', () => {
  showSlide(currentSlide + 1);
  startAutoPlay();
});

dots.forEach((dot, index) => {
  dot.addEventListener('click', () => {
    showSlide(index);
    startAutoPlay();
  });
});

slider?.addEventListener('mouseenter', stopAutoPlay);
slider?.addEventListener('mouseleave', startAutoPlay);

let touchStartX = 0;
let touchEndX = 0;

slider?.addEventListener('touchstart', (event) => {
  touchStartX = event.changedTouches[0].screenX;
});

slider?.addEventListener('touchend', (event) => {
  touchEndX = event.changedTouches[0].screenX;
  const delta = touchEndX - touchStartX;

  if (Math.abs(delta) > 40) {
    if (delta < 0) {
      showSlide(currentSlide + 1);
    } else {
      showSlide(currentSlide - 1);
    }
    startAutoPlay();
  }
});

window.addEventListener('keydown', (event) => {
  if (event.key === 'Escape') {
    closeProfileDropdown();
    closeDeleteModal();
    closeGame();
  }

  if (event.key === 'ArrowLeft') {
    showSlide(currentSlide - 1);
    startAutoPlay();
  }

  if (event.key === 'ArrowRight') {
    showSlide(currentSlide + 1);
    startAutoPlay();
  }
});

window.setTimeout(() => {
  skeletons.forEach((skeleton) => skeleton.classList.add('loaded'));
}, 1100);

function stopTimer() {
  if (currentTimer) {
    window.clearInterval(currentTimer);
    currentTimer = null;
  }
}

function updateHUD() {
  if (!activeGame) {
    return;
  }

  const questionCount = games[activeGame].questions.length;
  gameScore.textContent = String(score);
  gameTimer.textContent = String(timeLeft);
  gameStreak.textContent = String(streak);
  gameLevel.textContent = String(level);
  gameXp.textContent = String(games[activeGame].xp + score * 10);
  gameTag.textContent = `Question ${activeQuestionIndex + 1} of ${questionCount}`;
  gameProgress.style.width = `${((activeQuestionIndex) / questionCount) * 100}%`;
}

function setFeedback(message, type = '') {
  gameFeedback.textContent = message;
  gameFeedback.className = `game-feedback ${type}`.trim();
}

function renderQuestion() {
  if (!activeGame) {
    return;
  }

  const game = games[activeGame];
  const question = game.questions[activeQuestionIndex];
  hasAnswered = false;

  gameQuestion.textContent = question.prompt;
  gameOptions.innerHTML = '';
  gameNextButton.disabled = true;
  gameStartButton.textContent = activeQuestionIndex === 0 ? 'Start Game' : 'Continue';

  question.options.forEach((option, index) => {
    const optionButton = document.createElement('button');
    optionButton.type = 'button';
    optionButton.className = 'option-btn';
    optionButton.textContent = option;
    optionButton.addEventListener('click', () => handleAnswer(index, question.answer, optionButton));
    gameOptions.appendChild(optionButton);
  });

  timeLeft = game.timer;
  updateHUD();
  gameProgress.style.width = `${(activeQuestionIndex / game.questions.length) * 100}%`;
  setFeedback('Pick an answer before the timer runs out.');
}

function startTimer() {
  stopTimer();
  currentTimer = window.setInterval(() => {
    timeLeft -= 1;
    gameTimer.textContent = String(timeLeft);

    if (timeLeft <= 0) {
      stopTimer();
      if (!hasAnswered) {
        streak = 0;
        gameWrongCount += 1;
        setFeedback('Time is up. Move to the next challenge.', 'error');
        gameModal?.classList.add('is-wrong');
        window.setTimeout(() => gameModal?.classList.remove('is-wrong'), 260);
        revealCorrectAnswer();
        gameNextButton.disabled = false;
      }
    }
  }, 1000);
}

function revealCorrectAnswer() {
  const game = games[activeGame];
  const question = game.questions[activeQuestionIndex];
  Array.from(gameOptions.children).forEach((button, index) => {
    if (index === question.answer) {
      button.classList.add('correct');
    }
  });
}

function handleAnswer(selectedIndex, correctIndex, button) {
  if (hasAnswered) {
    return;
  }

  hasAnswered = true;
  stopTimer();

  const correct = selectedIndex === correctIndex;

  if (correct) {
    score += Math.max(25, timeLeft * 5);
    gameCorrectCount += 1;
    streak += 1;
    if (streak % 3 === 0) {
      level += 1;
    }
    button.classList.add('correct');
    gameModal?.classList.add('is-correct');
    window.setTimeout(() => gameModal?.classList.remove('is-correct'), 260);
    setFeedback('Correct. Nice run! Keep the streak going.', 'success');
  } else {
    streak = 0;
    gameWrongCount += 1;
    button.classList.add('wrong');
    gameModal?.classList.add('is-shaking');
    window.setTimeout(() => gameModal?.classList.remove('is-shaking'), 260);
    setFeedback('Wrong answer. Review and try the next one.', 'error');
    revealCorrectAnswer();
  }

  gameNextButton.disabled = false;
  updateHUD();
}

function finishGame() {
  stopTimer();
  const totalQuestions = games[activeGame].questions.length;
  const finalScore = Math.round(score + streak * 20 + level * 15);
  const playerName = getSavedPlayerName() || 'Learner';
  lastGameResult = {
    name: playerName,
    score: finalScore,
    correct: gameCorrectCount,
    wrong: gameWrongCount,
    total: totalQuestions,
  };
  gameQuestion.textContent = 'Game Completed';
  gameOptions.innerHTML = '';
  gameNextButton.disabled = true;
  gameSubmitLeaderboardButton.disabled = hasSubmittedGameScore;
  setFeedback(`${playerName}, final score: ${finalScore} (${gameCorrectCount}/${totalQuestions} correct). Submit to leaderboard to lock your rank.`, 'success');
  gameProgress.style.width = '100%';
}

function nextQuestion() {
  const game = games[activeGame];
  if (activeQuestionIndex >= game.questions.length - 1) {
    finishGame();
    return;
  }

  activeQuestionIndex += 1;
  renderQuestion();
  startTimer();
}

function openGame(gameKey) {
  activeGame = gameKey;
  activeQuestionIndex = 0;
  score = 0;
  streak = 0;
  level = 1;
  hasAnswered = false;
  gameCorrectCount = 0;
  gameWrongCount = 0;
  hasSubmittedGameScore = false;
  lastGameResult = null;

  const game = games[activeGame];
  gameTitle.textContent = game.title;
  gameDescription.textContent = game.description;
  gameDifficulty.textContent = game.difficulty;
  gameXp.textContent = String(game.xp);
  gameScore.textContent = '0';
  gameStreak.textContent = '0';
  gameLevel.textContent = '1';
  gameRankEl.textContent = '#--';
  gamePlayerNameInput.value = getSavedPlayerName();
  gameNameError.textContent = '';
  gameProgress.style.width = '0%';
  gameModal?.classList.add('is-open');
  gameModal?.setAttribute('aria-hidden', 'false');
  document.body.style.overflow = 'hidden';
  renderQuestion();
  stopTimer();
  renderGameLocalLeaderboard(activeGame);
  gameSubmitLeaderboardButton.disabled = true;
  setFeedback('Enter your name, then press Start Game.');
  gameStartButton.disabled = false;
}

function closeGame() {
  stopTimer();
  gameModal?.classList.remove('is-open', 'is-shaking', 'is-correct', 'is-wrong');
  gameModal?.setAttribute('aria-hidden', 'true');
  document.body.style.overflow = '';
}

gameCards.forEach((card) => {
  card.addEventListener('click', () => openGame(card.dataset.game));
  card.addEventListener('keydown', (event) => {
    if (event.key === 'Enter' || event.key === ' ') {
      event.preventDefault();
      openGame(card.dataset.game);
    }
  });
});

gameCloseButtons.forEach((button) => button.addEventListener('click', closeGame));

gameModal?.addEventListener('click', (event) => {
  if (event.target === gameModal) {
    closeGame();
  }
});

gameStartButton?.addEventListener('click', () => {
  const playerName = (gamePlayerNameInput?.value || '').trim();
  if (!playerName) {
    gameNameError.textContent = 'Name is required.';
    gamePlayerNameInput?.focus();
    return;
  }

  savePlayerName(playerName);
  gameNameError.textContent = '';
  gameStartButton.disabled = true;
  renderQuestion();
  startTimer();
});

gameNextButton?.addEventListener('click', nextQuestion);
gameSubmitLeaderboardButton?.addEventListener('click', submitGameResult);

profileTrigger?.addEventListener('click', toggleProfileDropdown);

document.addEventListener('click', (event) => {
  if (profileMenu && !profileMenu.contains(event.target)) {
    closeProfileDropdown();
  }
});

openSettingsButtons.forEach((button) => {
  button.addEventListener('click', () => openSettings(button.dataset.openSettings));
});

profileActionButtons.forEach((button) => {
  button.addEventListener('click', () => {
    const action = button.dataset.profileAction;

    if (action === 'profile') {
      openSettings('profile');
      return;
    }

    if (action === 'learning') {
      closeProfileDropdown();
      routeDashboard('courses');
      return;
    }

    if (action === 'settings') {
      openSettings('account');
      return;
    }

    if (action === 'logout') {
      logoutUser();
    }
  });
});

settingsNavButtons.forEach((button) => {
  button.addEventListener('click', () => switchSettingsTab(button.dataset.settingsTarget));
});

closeSettingsButton?.addEventListener('click', closeSettings);

saveButtons.forEach((button) => {
  button.addEventListener('click', () => {
    persistDashboardSettings();
    syncSettingsToApi();
    showToast('Changes saved ✅');
  });
});

openDeleteModalButton?.addEventListener('click', openDeleteModal);
closeDeleteModalButtons.forEach((button) => button.addEventListener('click', closeDeleteModal));

confirmDeleteButton?.addEventListener('click', () => {
  closeDeleteModal();
  showToast('Account deletion request submitted');
});

themeModeToggle?.addEventListener('change', () => {
  document.body.classList.toggle('light-mode', !themeModeToggle.checked);
  persistDashboardSettings();
  showToast(themeModeToggle.checked ? 'Dark mode enabled' : 'Light mode enabled');
});

themeColorButtons.forEach((button) => {
  button.addEventListener('click', () => {
    themeColorButtons.forEach((node) => node.classList.remove('is-active'));
    button.classList.add('is-active');
    document.body.setAttribute('data-accent', button.dataset.themeColor);
    persistDashboardSettings();
    showToast('Theme updated');
  });
});

fontSizeControl?.addEventListener('input', () => {
  document.documentElement.style.fontSize = `${fontSizeControl.value}px`;
  persistDashboardSettings();
});

navRouteLinks.forEach((link) => {
  link.addEventListener('click', (event) => {
    const route = link.dataset.navRoute;
    if (!route) {
      return;
    }

    if (link.target === '_blank') {
      return;
    }

    event.preventDefault();
    routeDashboard(route);
  });
});

window.addEventListener('hashchange', restoreRouteFromHash);

restoreDashboardSettings();
restoreRouteFromHash();
renderContinueLearningSection();
loadSettingsFromApi();
loadNotificationsFromApi();
initializeImageUpload();

showSlide(0);
startAutoPlay();

// ===== LEADERBOARD SYSTEM =====

async function loadLeaderboards() {
  ['memory', 'logic', 'code'].forEach(gameKey => {
    loadGameLeaderboard(gameKey);
  });
}

async function loadGameLeaderboard(gameKey) {
  const leaderboardList = document.querySelector(`[data-leaderboard-list="${gameKey}"]`);
  if (!leaderboardList) return;

  leaderboardList.innerHTML = '<div class="leaderboard-loading"><p>Loading leaderboard...</p></div>';

  try {
    const topPlayers = await fetchLeaderboard(gameKey);

    if (topPlayers && topPlayers.length > 0) {
      leaderboardList.innerHTML = '';
      topPlayers.forEach((player, index) => {
        const rowDiv = document.createElement('div');
        rowDiv.className = 'leaderboard-row';
        const points = Number(player.points ?? player.score ?? 0);
        
        if (currentUser && player.userId === currentUser.uid) {
          rowDiv.classList.add('current-user');
        }

        const rankClass = index < 3 ? 'top-3' : '';
        const rankEmoji = index === 0 ? '🥇' : index === 1 ? '🥈' : index === 2 ? '🥉' : '';
        const rankText = rankEmoji ? rankEmoji : `#${index + 1}`;

        rowDiv.innerHTML = `
          <div class="rank-badge ${rankClass} rank-${index + 1}">${rankText}</div>
          <div class="player-info">
            <div class="player-name">${player.name}</div>
            <div class="player-email">${player.email || ''}</div>
          </div>
          <div class="score-value">${points} pts</div>
          <div class="level-badge"><i class="ri-star-fill"></i> Lvl ${player.level}</div>
        `;
        leaderboardList.appendChild(rowDiv);
      });
    } else {
      leaderboardList.innerHTML = '<div class="leaderboard-loading"><p>No scores yet! Be the first to play.</p></div>';
    }
  } catch (error) {
    console.error('Error loading leaderboard:', error);
    leaderboardList.innerHTML = '<div class="leaderboard-loading"><p>Failed to load leaderboard</p></div>';
  }
}

// Leaderboard tab switching
const leaderboardTabBtns = document.querySelectorAll('[data-leaderboard-filter]');
const leaderboardBoards = document.querySelectorAll('[data-leaderboard-board]');

leaderboardTabBtns.forEach(btn => {
  btn.addEventListener('click', () => {
    const filter = btn.dataset.leaderboardFilter;

    leaderboardTabBtns.forEach(b => b.classList.remove('is-active'));
    btn.classList.add('is-active');

    leaderboardBoards.forEach(board => {
      board.removeAttribute('data-active');
    });
    document.querySelector(`[data-leaderboard-board="${filter}"]`)?.setAttribute('data-active', 'true');

    loadGameLeaderboard(filter);
  });
});

// ===== SOUND EFFECTS INTEGRATION =====

const originalFinishGame = finishGame;
finishGame = async function() {
  if (typeof gameSounds !== 'undefined') {
    gameSounds.playSuccessChime();
  }

  originalFinishGame.call(this);

  setTimeout(async () => {
    if (typeof saveGameScore === 'undefined') {
      console.warn('Firebase not configured');
      return;
    }

    try {
      const gameKey = activeGame;
      const finalScore = score;
      const finalLevel = level;
      const finalStreak = streak;
      const correctAnswers = correctAnswerCount || Math.floor(score / 10);

      await saveGameScore(gameKey, finalScore, finalLevel, finalStreak, correctAnswers);
      loadGameLeaderboard(gameKey);
      showToast(`🎉 Score saved! Check the leaderboards!`);
    } catch (error) {
      console.error('Failed to save game score:', error);
    }
  }, 500);
};

const originalHandleAnswer = handleAnswer;
handleAnswer = function(selectedIndex, correctIndex, button) {
  const isCorrect = selectedIndex === correctIndex;
  
  if (isCorrect) {
    if (typeof gameSounds !== 'undefined') {
      gameSounds.playCorrectSound();
    }
  } else {
    if (typeof gameSounds !== 'undefined') {
      gameSounds.playErrorSound();
    }
  }
  
  originalHandleAnswer.call(this, selectedIndex, correctIndex, button);
};

// Initialize leaderboards and sounds
loadLeaderboards();

document.addEventListener('click', (e) => {
  if (e.target?.classList.contains('option-btn')) {
    if (typeof gameSounds !== 'undefined') {
      gameSounds.playClickSound();
    }
  }
});

// ===== EDUNOVA QUIZ SYSTEM =====

const quizModal = document.querySelector('[data-quiz-modal]');
const quizScreens = Array.from(document.querySelectorAll('[data-quiz-screen]'));
const quizCards = Array.from(document.querySelectorAll('[data-quiz-launch]'));
const quizStartButton = document.querySelector('[data-quiz-start]');
const quizRetryButton = document.querySelector('[data-quiz-retry]');
const quizSubmitLeaderboardButton = document.querySelector('[data-quiz-submit-leaderboard]');
const quizCloseButtons = Array.from(document.querySelectorAll('[data-quiz-close]'));
const quizNextButtons = Array.from(document.querySelectorAll('[data-quiz-next]'));
const quizPlayerNameInput = document.querySelector('[data-quiz-player-name]');
const quizNameErrorEl = document.querySelector('[data-quiz-name-error]');
const quizTitleEl = document.querySelector('[data-quiz-title]');
const quizCopyEl = document.querySelector('[data-quiz-copy]');
const quizTimerEl = document.querySelector('[data-quiz-timer]');
const quizScoreEl = document.querySelector('[data-quiz-score]');
const quizProgressTextEl = document.querySelector('[data-quiz-progress-text]');
const quizXpEl = document.querySelector('[data-quiz-xp]');
const quizStreakEl = document.querySelector('[data-quiz-streak]');
const quizLevelEl = document.querySelector('[data-quiz-level]');
const quizQuestionTagEl = document.querySelector('[data-quiz-question-tag]');
const quizQuestionEl = document.querySelector('[data-quiz-question]');
const quizOptionsEl = document.querySelector('[data-quiz-options]');
const quizFeedbackEl = document.querySelector('[data-quiz-feedback]');
const quizProgressEl = document.querySelector('[data-quiz-progress]');
const quizRankEl = document.querySelector('[data-quiz-rank]');
const quizBadgeEl = document.querySelector('[data-quiz-badge]');
const quizMemeImageEl = document.querySelector('[data-quiz-meme-image]');
const quizMemeTextEl = document.querySelector('[data-quiz-meme-text]');
const quizMemeCaptionEl = document.querySelector('[data-quiz-meme-caption]');
const quizEndTitleEl = document.querySelector('[data-quiz-end-title]');
const quizEndMessageEl = document.querySelector('[data-quiz-end-message]');
const quizEndPlayerEl = document.querySelector('[data-quiz-end-player]');
const quizFinalScoreEl = document.querySelector('[data-quiz-final-score]');
const quizFinalScorelineEl = document.querySelector('[data-quiz-final-scoreline]');
const quizFinalAccuracyEl = document.querySelector('[data-quiz-final-accuracy]');
const quizFinalXpEl = document.querySelector('[data-quiz-final-xp]');
const quizFinalStreakEl = document.querySelector('[data-quiz-final-streak]');
const quizBadgesEl = document.querySelector('[data-quiz-badges]');
const quizLeaderboardEl = document.querySelector('[data-quiz-leaderboard]');
const quizUserRankEl = document.querySelector('[data-quiz-user-rank]');

const quizStorageKey = QUIZ_LEADERBOARD_KEY;
const quizMemeLibrary = [
  { text: 'Emotional damage 😭', image: 'img/b.png', contain: true },
  { text: 'Aree bhai kya kar raha hai tu 😂', image: 'img/a.png', contain: true },
  { text: 'लगता है पढ़ाई कम हुई है 👀', image: 'img/d.png', contain: true },
  { text: 'जब answer guess करते हैं…', image: 'img/w.png', contain: true },
  { text: 'Task failed successfully 💀', image: 'img/emo.png', contain: true },
];

const quizBank = {
  'web-dev': {
    title: 'Web Dev Fundamentals Quiz',
    copy: 'HTML, CSS, JavaScript, and frontend logic with a fast meme twist.',
    difficulty: 'Easy',
    timer: 15,
    questions: [
      { prompt: 'Which HTML element is used for the largest heading?', options: ['<h6>', '<heading>', '<h1>', '<title>'], answer: '<h1>' },
      { prompt: 'Which CSS property controls spacing inside an element?', options: ['margin', 'padding', 'gap', 'border'], answer: 'padding' },
      { prompt: 'Which method turns JSON text into a JavaScript object?', options: ['JSON.parse()', 'JSON.stringify()', 'Object.create()', 'Array.from()'], answer: 'JSON.parse()' },
      { prompt: 'What does DOM stand for?', options: ['Document Object Model', 'Data Object Method', 'Dynamic Output Manager', 'Display Oriented Mode'], answer: 'Document Object Model' },
      { prompt: 'Which keyword declares a block-scoped variable?', options: ['var', 'let', 'this', 'static'], answer: 'let' },
      { prompt: 'Which layout model is one-dimensional?', options: ['Grid', 'Flexbox', 'Table', 'Float'], answer: 'Flexbox' },
      { prompt: 'Which event fires when a user clicks a button?', options: ['hover', 'submit', 'click', 'focus'], answer: 'click' },
      { prompt: 'Which tag is used to link an external stylesheet?', options: ['<style>', '<link>', '<script>', '<meta>'], answer: '<link>' },
    ],
  },
  'data-science': {
    title: 'Data Science Quiz',
    copy: 'Pandas, statistics, and model thinking for learners who like practical clues.',
    difficulty: 'Medium',
    timer: 18,
    questions: [
      { prompt: 'Which library is commonly used for tabular data in Python?', options: ['NumPy', 'Pandas', 'Matplotlib', 'Seaborn'], answer: 'Pandas' },
      { prompt: 'What does mean describe?', options: ['Middle value', 'Average value', 'Most frequent value', 'Range value'], answer: 'Average value' },
      { prompt: 'Which metric measures classification balance between precision and recall?', options: ['R-squared', 'F1 score', 'MAE', 'Variance'], answer: 'F1 score' },
      { prompt: 'Which function shows the first rows of a DataFrame?', options: ['head()', 'tail()', 'info()', 'sample()'], answer: 'head()' },
      { prompt: 'What type of learning uses labeled data?', options: ['Supervised learning', 'Unsupervised learning', 'Reinforcement learning', 'Federated learning'], answer: 'Supervised learning' },
      { prompt: 'Which chart is best for distributions?', options: ['Histogram', 'Pie chart', 'Scatterplot', 'Gantt chart'], answer: 'Histogram' },
      { prompt: 'What does overfitting usually mean?', options: ['Model is too simple', 'Model memorized training data', 'Model has no parameters', 'Model needs more labels'], answer: 'Model memorized training data' },
      { prompt: 'Which data structure is often two-dimensional in Pandas?', options: ['Series', 'DataFrame', 'Tuple', 'Set'], answer: 'DataFrame' },
    ],
  },
  'systems-mashup': {
    title: 'OS & DBMS Challenge',
    copy: 'Memory, scheduling, queries, and concepts that separate guesses from grit.',
    difficulty: 'Hard',
    timer: 20,
    questions: [
      { prompt: 'Which memory is fastest in a computer hierarchy?', options: ['RAM', 'Cache', 'SSD', 'HDD'], answer: 'Cache' },
      { prompt: 'What does SQL stand for?', options: ['Structured Query Language', 'Simple Query List', 'System Query Logic', 'Stored Queue Layer'], answer: 'Structured Query Language' },
      { prompt: 'Which scheduling method can lead to starvation?', options: ['Round Robin', 'FCFS', 'Shortest Job First', 'Time slicing'], answer: 'Shortest Job First' },
      { prompt: 'Which normal form removes partial dependency?', options: ['1NF', '2NF', '3NF', 'BCNF'], answer: '2NF' },
      { prompt: 'What is virtual memory mainly used for?', options: ['CPU speedup', 'Disk compression', 'Running larger programs than RAM', 'Rendering graphics'], answer: 'Running larger programs than RAM' },
      { prompt: 'Which SQL clause filters rows?', options: ['GROUP BY', 'HAVING', 'WHERE', 'ORDER BY'], answer: 'WHERE' },
      { prompt: 'What is a process in OS terms?', options: ['A stored file', 'A running program instance', 'A network packet', 'A memory chip'], answer: 'A running program instance' },
      { prompt: 'Which structure stores table rows and columns?', options: ['Queue', 'Tree', 'Relational table', 'Stack'], answer: 'Relational table' },
    ],
  },
};

function mapBackendQuizToKey(title) {
  const safeTitle = String(title || '').toLowerCase();
  if (safeTitle.includes('web')) {
    return 'web-dev';
  }
  if (safeTitle.includes('data')) {
    return 'data-science';
  }
  if (safeTitle.includes('os') || safeTitle.includes('db') || safeTitle.includes('system')) {
    return 'systems-mashup';
  }
  return null;
}

async function hydrateQuizzesFromApi() {
  if (!window.EdunovaAPI) {
    return;
  }

  try {
    const quizResponse = await window.EdunovaAPI.getQuizzes();
    const quizzes = Array.isArray(quizResponse?.data) ? quizResponse.data : [];

    for (const quiz of quizzes) {
      const key = mapBackendQuizToKey(quiz.title);
      if (!key) {
        continue;
      }

      const questionResponse = await window.EdunovaAPI.getQuestions(quiz.quiz_id);
      const questions = Array.isArray(questionResponse?.data) ? questionResponse.data : [];

      if (questions.length === 0) {
        continue;
      }

      // Keep local correct answers for gameplay but bind backend identifiers for server submission.
      quizBank[key].backendQuizId = Number(quiz.quiz_id);
      quizBank[key].backendQuestionIds = questions.map((question) => Number(question.question_id));
    }
  } catch {
    // Keep local quiz bank fallback if API data is unavailable.
  }
}

let activeQuizKey = null;
let activeQuizRun = null;
let quizQuestionIndex = 0;
let quizStarted = false;
let quizLocked = false;
let quizTimer = null;
let quizTimeLeft = 0;
let quizScore = 0;
let quizXp = 0;
let quizStreak = 0;
let quizBestStreak = 0;
let quizCorrectCount = 0;
let quizWrongCount = 0;
let quizLevel = 1;
let lastMemeIndex = -1;
let quizSubmittedAnswers = [];
let quizPlayerName = 'Learner';
let pendingQuizEntry = null;
let hasSubmittedQuizScore = false;

function shuffleArray(items) {
  const nextItems = [...items];

  for (let index = nextItems.length - 1; index > 0; index -= 1) {
    const swapIndex = Math.floor(Math.random() * (index + 1));
    [nextItems[index], nextItems[swapIndex]] = [nextItems[swapIndex], nextItems[index]];
  }

  return nextItems;
}

function formatQuizTime(totalSeconds) {
  const safeSeconds = Math.max(0, Math.floor(totalSeconds));
  const minutes = Math.floor(safeSeconds / 60);
  const seconds = safeSeconds % 60;
  return `${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;
}

function loadQuizLeaderboards() {
  try {
    return JSON.parse(localStorage.getItem(quizStorageKey) || '{}');
  } catch {
    return {};
  }
}

function saveQuizLeaderboards(store) {
  localStorage.setItem(quizStorageKey, JSON.stringify(store));
}

function getQuizRun(quizKey) {
  const quiz = quizBank[quizKey];
  if (!quiz) {
    return null;
  }

  return {
    ...quiz,
    questions: shuffleArray(
      quiz.questions.map((question, index) => ({
        ...question,
        backendQuestionId: Array.isArray(quiz.backendQuestionIds)
          ? Number(quiz.backendQuestionIds[index] || 0)
          : 0,
        options: shuffleArray(question.options),
      }))
    ),
  };
}

function setQuizScreen(screenName) {
  quizScreens.forEach((screen) => {
    const isActive = screen.dataset.quizScreen === screenName;
    screen.hidden = !isActive;
    screen.classList.toggle('is-active', isActive);
  });
}

function updateQuizHud() {
  if (!activeQuizRun) {
    return;
  }

  const totalQuestions = activeQuizRun.questions.length;
  const currentProgress = Math.min(quizQuestionIndex + 1, totalQuestions);

  quizTimerEl.textContent = formatQuizTime(quizTimeLeft);
  quizScoreEl.textContent = String(quizScore);
  quizProgressTextEl.textContent = `${currentProgress}/${totalQuestions}`;
  quizXpEl.textContent = String(quizXp);
  quizStreakEl.textContent = String(quizStreak);
  quizLevelEl.textContent = String(quizLevel);
  quizProgressEl.style.width = `${(quizQuestionIndex / totalQuestions) * 100}%`;
  if (!hasSubmittedQuizScore) {
    quizRankEl.textContent = '#--';
  }
  quizBadgeEl.textContent = 'None yet';
}

function setQuizFeedback(message, tone = '') {
  quizFeedbackEl.textContent = message;
  quizFeedbackEl.className = `quiz-feedback ${tone}`.trim();
}

function clearQuizTimer() {
  if (quizTimer) {
    window.clearInterval(quizTimer);
    quizTimer = null;
  }
}

function startQuizTimer() {
  clearQuizTimer();
  quizTimeLeft = activeQuizRun?.timer || 0;
  updateQuizHud();

  quizTimer = window.setInterval(() => {
    quizTimeLeft -= 1;
    quizTimerEl.textContent = formatQuizTime(quizTimeLeft);

    if (quizTimeLeft <= 0) {
      clearQuizTimer();
      if (!quizLocked) {
        handleQuizTimeout();
      }
    }
  }, 1000);
}

function renderQuizQuestion() {
  if (!activeQuizRun) {
    return;
  }

  const question = activeQuizRun.questions[quizQuestionIndex];
  quizLocked = false;
  quizOptionsEl.innerHTML = '';
  quizQuestionTagEl.textContent = `Question ${quizQuestionIndex + 1} of ${activeQuizRun.questions.length}`;
  quizQuestionEl.textContent = question.prompt;
  quizStartButton.disabled = quizStarted;
  quizStartButton.textContent = quizStarted ? 'Quiz live' : 'Start Quiz';
  quizNextButtons.forEach((button) => {
    const isMemeNextButton = button.closest('[data-quiz-screen="meme"]');
    button.disabled = !isMemeNextButton;
  });

  question.options.forEach((optionText, optionIndex) => {
    const button = document.createElement('button');
    button.type = 'button';
    button.className = 'quiz-option';
    button.textContent = optionText;
    button.addEventListener('click', () => handleQuizAnswer(optionIndex, button));
    quizOptionsEl.appendChild(button);
  });

  if (quizStarted) {
    startQuizTimer();
    setQuizFeedback('Choose wisely. Wrong answers trigger the meme engine.', '');
  } else {
    clearQuizTimer();
    quizTimeLeft = activeQuizRun.timer;
    quizTimerEl.textContent = formatQuizTime(quizTimeLeft);
    setQuizFeedback('Press Start Quiz to begin the run.', '');
  }

  updateQuizHud();
}

function flashQuizPanel() {
  quizModal?.classList.add('quiz-vibrate');
  quizModal?.querySelector('.quiz-modal__panel')?.classList.add('quiz-panel-shake');
  window.setTimeout(() => {
    quizModal?.classList.remove('quiz-vibrate');
    quizModal?.querySelector('.quiz-modal__panel')?.classList.remove('quiz-panel-shake');
  }, 360);
}

function launchConfetti() {
  if (!quizModal) {
    return;
  }

  const palette = ['#4e8cff', '#8d6bff', '#ff6bb8', '#65e3a0', '#ffd166'];
  const pieces = 26;

  for (let index = 0; index < pieces; index += 1) {
    const confetti = document.createElement('span');
    const angle = (Math.PI * 2 * index) / pieces;
    const radius = 120 + Math.random() * 120;
    const color = palette[index % palette.length];
    confetti.className = 'quiz-confetti';
    confetti.style.background = color;
    confetti.style.left = '50%';
    confetti.style.top = '50%';
    quizModal.appendChild(confetti);

    const x = Math.cos(angle) * radius;
    const y = Math.sin(angle) * radius - 160;

    confetti.animate(
      [
        { transform: 'translate(-50%, -50%) scale(0.8)', opacity: 1 },
        { transform: `translate(calc(-50% + ${x}px), calc(-50% + ${y}px)) rotate(${360 + index * 20}deg) scale(1.1)`, opacity: 1 },
        { transform: `translate(calc(-50% + ${x * 1.2}px), calc(-50% + ${y * 1.2}px)) rotate(${540 + index * 18}deg) scale(0.8)`, opacity: 0 },
      ],
      { duration: 1100 + Math.random() * 250, easing: 'cubic-bezier(0.11, 0.74, 0.2, 1)' }
    );

    window.setTimeout(() => confetti.remove(), 1350);
  }
}

function getRandomMeme() {
  let nextIndex = Math.floor(Math.random() * quizMemeLibrary.length);

  if (quizMemeLibrary.length > 1 && nextIndex === lastMemeIndex) {
    nextIndex = (nextIndex + 1) % quizMemeLibrary.length;
  }

  lastMemeIndex = nextIndex;
  return quizMemeLibrary[nextIndex];
}

function showQuizMeme(messageText) {
  const meme = getRandomMeme();
  quizMemeImageEl.src = meme.image;
  quizMemeImageEl.alt = meme.text;
  quizMemeImageEl.classList.toggle('is-full-fit', Boolean(meme.contain));
  quizMemeTextEl.textContent = meme.text;
  quizMemeCaptionEl.textContent = messageText;

  const memeNextButton = quizModal?.querySelector('.quiz-meme-next');
  if (memeNextButton) {
    memeNextButton.disabled = false;
    memeNextButton.textContent = isQuizComplete() ? 'See Results ➡️' : 'Next Question ➡️';
  }

  setQuizScreen('meme');
}

function isQuizComplete() {
  return activeQuizRun ? quizQuestionIndex >= activeQuizRun.questions.length - 1 : false;
}

function handleQuizAnswer(selectedIndex, button) {
  if (quizLocked || !activeQuizRun) {
    return;
  }

  quizLocked = true;
  clearQuizTimer();

  const question = activeQuizRun.questions[quizQuestionIndex];
  const correctIndex = question.options.indexOf(question.answer);
  const optionButtons = Array.from(quizOptionsEl.querySelectorAll('.quiz-option'));
  const isCorrect = selectedIndex === correctIndex;
  const selectedAnswerText = question.options[selectedIndex];

  if (question.backendQuestionId && selectedAnswerText) {
    quizSubmittedAnswers.push({
      question_id: Number(question.backendQuestionId),
      answer: selectedAnswerText,
    });
  }

  optionButtons.forEach((optionButton) => {
    optionButton.disabled = true;
  });

  if (isCorrect) {
    button.classList.add('correct', 'quiz-option-pop');
    quizScore += Math.max(60, quizTimeLeft * 6);
    quizCorrectCount += 1;
    quizStreak += 1;
    quizBestStreak = Math.max(quizBestStreak, quizStreak);
    quizLevel = 1 + Math.floor(quizCorrectCount / 3);
    quizXp = quizScore + quizCorrectCount * 20 + quizBestStreak * 10;
    setQuizFeedback('Smart ho tum 😎🔥', 'is-success');
    launchConfetti();

    if (typeof navigator !== 'undefined' && navigator.vibrate) {
      navigator.vibrate(25);
    }

    updateQuizHud();
    window.setTimeout(() => {
      if (isQuizComplete()) {
        finishQuiz();
      } else {
        advanceQuizQuestion();
      }
    }, 900);
    return;
  }

  quizStreak = 0;
  quizWrongCount += 1;
  button.classList.add('wrong');
  const correctButton = optionButtons[correctIndex];
  correctButton?.classList.add('correct');
  setQuizFeedback('Wrong answer. Meme therapy loading...', 'is-error');
  flashQuizPanel();

  if (typeof navigator !== 'undefined' && navigator.vibrate) {
    navigator.vibrate([40, 35, 40]);
  }

  updateQuizHud();
  showQuizMeme('Wrong answer. Tap the button when the meme has healed the damage.');
}

function handleQuizTimeout() {
  if (!activeQuizRun || quizLocked) {
    return;
  }

  quizLocked = true;
  quizStreak = 0;
  quizWrongCount += 1;

  const question = activeQuizRun.questions[quizQuestionIndex];
  const optionButtons = Array.from(quizOptionsEl.querySelectorAll('.quiz-option'));
  const correctIndex = question.options.indexOf(question.answer);

  optionButtons[correctIndex]?.classList.add('correct');
  setQuizFeedback('Time up. That one goes straight to meme court.', 'is-error');
  flashQuizPanel();

  if (typeof navigator !== 'undefined' && navigator.vibrate) {
    navigator.vibrate([30, 20, 30]);
  }

  updateQuizHud();
  showQuizMeme('Task failed successfully 💀');
}

function advanceQuizQuestion() {
  if (!activeQuizRun) {
    return;
  }

  if (quizQuestionIndex >= activeQuizRun.questions.length - 1) {
    finishQuiz();
    return;
  }

  quizQuestionIndex += 1;
  quizLocked = false;
  setQuizScreen('play');
  renderQuizQuestion();
}

function getQuizPerformanceMessage(accuracy) {
  if (accuracy >= 90) {
    return 'Genius mode ON 🧠🔥';
  }

  if (accuracy >= 60) {
    return 'Good job 👍';
  }

  if (accuracy < 50) {
    return 'Thoda aur padh le 😂';
  }

  return 'Almost there 😅';
}

function getQuizBadges() {
  const badges = [];

  if (quizCorrectCount === activeQuizRun.questions.length) {
    badges.push('Perfect Run');
  }

  if (quizBestStreak >= 3) {
    badges.push('Streak Runner');
  }

  if (quizCorrectCount > 0 && quizCorrectCount < activeQuizRun.questions.length) {
    badges.push('Meme Survivor');
  }

  if (quizScore >= 500) {
    badges.push('XP Hunter');
  }

  return badges.length > 0 ? badges : ['First Steps'];
}

function renderQuizBadges(badges) {
  quizBadgesEl.innerHTML = badges
    .map((badge) => `<span class="quiz-badge"><i class="ri-award-line"></i>${badge}</span>`)
    .join('');
}

function renderQuizLeaderboard(currentEntry, serverRows = null) {
  if (Array.isArray(serverRows) && serverRows.length > 0) {
    const session = getAuthSession();
    const currentUserId = Number(session?.user_id || 0);

    quizLeaderboardEl.innerHTML = serverRows
      .slice(0, 5)
      .map((entry, index) => {
        const isCurrent = currentUserId > 0 && Number(entry.user_id) === currentUserId;
        const rank = index + 1;
        return `
          <div class="quiz-leaderboard-row rank-${rank} ${isCurrent ? 'is-current' : ''}">
            <strong>${medalByRank(rank)}</strong>
            <span>${entry.name}</span>
            <strong>${entry.points} XP</strong>
            <span>${isCurrent ? 'You' : `User ${entry.user_id}`}</span>
          </div>
        `;
      })
      .join('');

    const rank = serverRows.findIndex((entry) => Number(entry.user_id) === currentUserId) + 1;
    quizRankEl.textContent = rank > 0 ? `#${rank}` : '#--';
    return;
  }

  const store = loadQuizLeaderboards();
  const board = Array.isArray(store[activeQuizKey]) ? store[activeQuizKey] : [];

  const enrichedBoard = [...board];
  if (currentEntry) {
    enrichedBoard.push(currentEntry);
  }

  enrichedBoard.sort((left, right) => right.score - left.score || right.accuracy - left.accuracy || right.xp - left.xp || new Date(right.timestamp).getTime() - new Date(left.timestamp).getTime());

  const trimmed = enrichedBoard.slice(0, 8);
  quizLeaderboardEl.innerHTML = trimmed
    .map((entry, index) => {
      const rank = index + 1;
      return `
      <div class="quiz-leaderboard-row rank-${rank} ${entry.isCurrent ? 'is-current' : ''}">
        <strong>${medalByRank(rank)}</strong>
        <span>${entry.name}</span>
        <strong>${entry.score} XP</strong>
        <span>${entry.accuracy}%</span>
      </div>
    `;
    })
    .join('');

  const currentRank = currentEntry ? trimmed.findIndex((entry) => entry.isCurrent) + 1 : -1;
  quizRankEl.textContent = currentRank > 0 ? `#${currentRank}` : '#--';

  if (quizUserRankEl) {
    quizUserRankEl.textContent = currentRank > 0 ? `Your rank: #${currentRank}` : 'Your rank: #--';
  }

  return currentRank;
}

async function finishQuiz() {
  clearQuizTimer();

  const totalQuestions = activeQuizRun.questions.length;
  let accuracy = Math.round((quizCorrectCount / totalQuestions) * 100);
  const bonus = quizBestStreak * 20 + (quizCorrectCount === totalQuestions ? 100 : 0);
  let finalScore = quizScore + bonus;
  const finalXp = quizXp + bonus;
  const session = getAuthSession();
  const userId = Number(session?.user_id || 0);
  let backendLeaderboard = null;

  if (window.EdunovaAPI && activeQuizRun.backendQuizId && userId > 0 && quizSubmittedAnswers.length > 0) {
    try {
      const submitResponse = await window.EdunovaAPI.submitQuiz(activeQuizRun.backendQuizId, {
        user_id: userId,
        answers: quizSubmittedAnswers,
      });

      const serverScore = Number(submitResponse?.data?.score);
      if (!Number.isNaN(serverScore)) {
        accuracy = serverScore;
        finalScore = Math.max(finalScore, serverScore);
      }

      const leaderboardResponse = await window.EdunovaAPI.getLeaderboard(5);
      backendLeaderboard = Array.isArray(leaderboardResponse?.data) ? leaderboardResponse.data : null;
          loadLiveQuizLeaderboard();
    } catch {
      // Keep local score fallback if backend submit fails.
    }
  }

  const performanceMessage = getQuizPerformanceMessage(accuracy);
  const badges = getQuizBadges();

  pendingQuizEntry = {
    id: `${activeQuizKey}-${Date.now()}`,
    name: quizPlayerName,
    score: finalScore,
    accuracy,
    xp: finalXp,
    streak: quizBestStreak,
    wrong: quizWrongCount,
    total: totalQuestions,
    timestamp: new Date().toISOString(),
    isCurrent: true,
  };

  quizFinalScoreEl.textContent = String(finalScore);
  quizFinalScorelineEl.textContent = `${quizCorrectCount}/${totalQuestions}`;
  quizEndPlayerEl.textContent = `Player: ${quizPlayerName}`;
  quizFinalAccuracyEl.textContent = `${accuracy}%`;
  quizFinalXpEl.textContent = String(finalXp);
  quizFinalStreakEl.textContent = String(quizBestStreak);
  quizEndTitleEl.textContent = performanceMessage;
  quizEndMessageEl.textContent = accuracy >= 60
    ? 'You kept the flow moving. Run it again to climb the leaderboard.'
    : 'Wrong answers still moved you forward. Try again and let the streak cook.';

  renderQuizBadges(badges);
  renderQuizLeaderboard(null, backendLeaderboard);
  hasSubmittedQuizScore = false;
  quizSubmitLeaderboardButton.disabled = false;
  quizUserRankEl.textContent = 'Your rank: submit to see rank';
  setQuizScreen('end');
}

function submitQuizResultToLeaderboard() {
  if (!pendingQuizEntry || hasSubmittedQuizScore) {
    return;
  }

  const store = loadQuizLeaderboards();
  const board = Array.isArray(store[activeQuizKey]) ? store[activeQuizKey] : [];
  board.push(pendingQuizEntry);
  board.sort((left, right) => right.score - left.score || right.accuracy - left.accuracy || right.xp - left.xp || new Date(right.timestamp).getTime() - new Date(left.timestamp).getTime());
  store[activeQuizKey] = board.slice(0, 30).map((entry) => ({ ...entry, isCurrent: false }));
  saveQuizLeaderboards(store);

  hasSubmittedQuizScore = true;
  quizSubmitLeaderboardButton.disabled = true;
  const rankedEntry = { ...pendingQuizEntry, isCurrent: true };
  const rank = renderQuizLeaderboard(rankedEntry, null);
  if (rank > 0) {
    quizUserRankEl.textContent = `Your rank: #${rank}`;
  }
}

function resetQuizRun(quizKey) {
  activeQuizKey = quizKey;
  activeQuizRun = getQuizRun(quizKey);
  quizQuestionIndex = 0;
  quizStarted = false;
  quizLocked = false;
  quizScore = 0;
  quizXp = 0;
  quizStreak = 0;
  quizBestStreak = 0;
  quizCorrectCount = 0;
  quizWrongCount = 0;
  quizLevel = 1;
  lastMemeIndex = -1;
  quizSubmittedAnswers = [];
  pendingQuizEntry = null;
  hasSubmittedQuizScore = false;
  quizTimeLeft = activeQuizRun?.timer || 0;
  quizPlayerName = getSavedPlayerName() || 'Learner';
  if (quizPlayerNameInput) {
    quizPlayerNameInput.value = quizPlayerName;
  }
  if (quizNameErrorEl) {
    quizNameErrorEl.textContent = '';
  }

  quizTitleEl.textContent = activeQuizRun.title;
  quizCopyEl.textContent = activeQuizRun.copy;
  quizStartButton.disabled = false;
  quizStartButton.textContent = 'Start Quiz';
  quizSubmitLeaderboardButton.disabled = true;
  quizNextButtons.forEach((button) => {
    button.disabled = true;
  });

  setQuizScreen('play');
  renderQuizQuestion();
  updateQuizHud();
}

function openQuiz(quizKey) {
  if (!quizBank[quizKey]) {
    return;
  }

  resetQuizRun(quizKey);
  const quizPanel = quizModal?.querySelector('.quiz-modal__panel');
  if (quizPanel) {
    quizPanel.scrollTop = 0;
  }
  quizModal?.classList.add('is-open');
  quizModal?.setAttribute('aria-hidden', 'false');
  document.body.style.overflow = 'hidden';
}

function closeQuiz() {
  clearQuizTimer();
  quizModal?.classList.remove('is-open', 'quiz-vibrate');
  quizModal?.setAttribute('aria-hidden', 'true');
  quizModal?.querySelector('.quiz-modal__panel')?.classList.remove('quiz-panel-shake');
  document.body.style.overflow = '';
}

quizCards.forEach((card) => {
  card.addEventListener('click', (event) => {
    const target = event.target;
    if (target?.closest('[data-quiz-play]')) {
      event.stopPropagation();
    }

    openQuiz(card.dataset.quizLaunch);
  });

  card.addEventListener('keydown', (event) => {
    if (event.key === 'Enter' || event.key === ' ') {
      event.preventDefault();
      openQuiz(card.dataset.quizLaunch);
    }
  });
});

quizStartButton?.addEventListener('click', () => {
  if (!quizStarted) {
    const playerName = (quizPlayerNameInput?.value || '').trim();
    if (!playerName) {
      if (quizNameErrorEl) {
        quizNameErrorEl.textContent = 'Name is required.';
      }
      quizPlayerNameInput?.focus();
      return;
    }

    if (quizNameErrorEl) {
      quizNameErrorEl.textContent = '';
    }
    quizPlayerName = playerName;
    savePlayerName(playerName);
    quizStarted = true;
    quizStartButton.disabled = true;
    quizStartButton.textContent = 'Quiz live';
    startQuizTimer();
    setQuizFeedback('Answer fast. Wrong picks summon the meme popup.', '');
  }
});

quizNextButtons.forEach((button) => {
  button.addEventListener('click', () => {
    if (button.closest('[data-quiz-screen="meme"]')) {
      if (isQuizComplete()) {
        finishQuiz();
        return;
      }

      setQuizScreen('play');
      quizLocked = false;
      quizQuestionIndex += 1;
      renderQuizQuestion();
      if (quizStarted) {
        startQuizTimer();
      }
      return;
    }

    if (quizStarted && !quizLocked) {
      advanceQuizQuestion();
    }
  });
});

quizRetryButton?.addEventListener('click', () => {
  if (activeQuizKey) {
    resetQuizRun(activeQuizKey);
  }
});

quizSubmitLeaderboardButton?.addEventListener('click', submitQuizResultToLeaderboard);

quizCloseButtons.forEach((button) => {
  button.addEventListener('click', closeQuiz);
});

window.addEventListener('keydown', (event) => {
  if (event.key === 'Escape' && quizModal?.classList.contains('is-open')) {
    closeQuiz();
  }
});

const JAMEEL_SYSTEM_PROFILE = {
  name: 'Jameel Jamali',
  role: 'EduNova personal AI mentor',
  tone: 'friendly, smart, slightly witty, motivating',
  style: 'simple English plus Hinglish when helpful',
  responseRules: [
    'Use clear headings and bullet points.',
    'If user is confused, simplify with analogy.',
    'If question is vague, ask one or two clarifying questions.',
    'If user asks for code, provide clean working code with explanation.',
    'If user says byheart kaise kare, provide memory tricks.',
  ],
};

function buildJameelReply(userInput) {
  const text = String(userInput || '').trim();
  const query = text.toLowerCase();
  const words = text.split(/\s+/).filter(Boolean);

  const isShort = query.includes('short answer') || query.includes('jaldi bata');
  const wantsSimple = query.includes('explain simply') || query.includes('samajh nahi aa raha');
  const wantsSteps = query.includes('step by step');
  const wantsCode = query.includes('give code') || query.includes('code');
  const wantsRevision = query.includes('revise this') || query.includes('revise');
  const asksMemory = query.includes('byheart kaise kare');
  const asksProject = query.includes('project banana hai');
  const asksExam = query.includes('exam hai');
  const isVague = words.length < 3;

  if (isVague) {
    return [
      'Got you. Thoda aur context de do so I can guide perfectly:',
      '',
      '- Topic ka naam kya hai?',
      '- Tumhe explanation chahiye, notes chahiye, ya code solution?',
    ].join('\n');
  }

  if (asksMemory) {
    return [
      'Byheart Smart Method',
      '',
      '- Chunking: topic ko 3-5 small blocks mein tod do.',
      '- Active recall: notes band karke khud se repeat karo.',
      '- Spaced revision: 1 day, 3 day, 7 day repeat cycle.',
      '- Mnemonics: hard terms ke short funny keywords banao.',
      '- Teach-back: kisi friend ko samjhao, memory lock ho jayegi.',
      '',
      'Smart tip: Jo cheez likh ke + बोल ke revise hoti hai, woh longest stay karti hai.',
    ].join('\n');
  }

  if (asksProject) {
    return [
      'Project Roadmap',
      '',
      'Idea:',
      '- Student Progress Tracker with quiz analytics and reminders.',
      'Features:',
      '- Auth, course progress, quiz history, leaderboard, reminder notifications.',
      'Tech Stack:',
      '- Frontend: HTML/CSS/JS',
      '- Backend: Node.js + Express',
      '- Data: MySQL or local JSON mock DB',
      'Step by Step:',
      '- Build auth and dashboard UI',
      '- Create APIs for courses and progress',
      '- Add quiz module and score tracking',
      '- Deploy and test with sample users',
      '',
      'Next step: bolo, main iska week-wise execution plan bhi bana doon.',
    ].join('\n');
  }

  if (asksExam) {
    return [
      'Exam Prep Boost',
      '',
      'Important Topics:',
      '- Core definitions, formulas, and high-frequency concepts',
      '- Previous year patterns and practical problem types',
      'Likely Questions:',
      '- Definition + short explanation',
      '- Difference-based questions',
      '- One long applied scenario question',
      'Quick Revision Plan:',
      '- 30 min concept recap',
      '- 30 min question practice',
      '- 15 min mistakes review',
      '',
      'You got this. Focus on high-yield topics first, then polish details.',
    ].join('\n');
  }

  if (wantsCode) {
    return [
      'Code Help (Starter Template)',
      '',
      '```js',
      'function solveTask(input) {',
      '  if (!input) return "Input required";',
      '  return String(input).trim();',
      '}',
      '```',
      '',
      'How this works:',
      '- Validates input first',
      '- Applies core logic',
      '- Returns predictable output',
      '',
      'Send exact problem statement, I will give production-ready code.',
    ].join('\n');
  }

  if (wantsRevision) {
    return [
      'Quick Revision Format',
      '',
      '- Concept in one line',
      '- 3 must-remember points',
      '- 1 common mistake to avoid',
      '- 1 exam-style example',
      '',
      'Paste topic text and I will convert it into rapid revision notes.',
    ].join('\n');
  }

  if (isShort) {
    return 'Short answer: focus on concept -> example -> practice. If you share the exact topic, I will give a direct exam-ready answer.';
  }

  if (wantsSimple) {
    return [
      'Simple Mode On',
      '',
      '- Think of it like learning to ride a cycle: first balance, then speed.',
      '- Same with study: first basic idea, then formula/rules, then questions.',
      '- Start with one solved example, then try one by yourself.',
      '',
      'Ab topic bhejo, main bilkul easy language mein break karke samjhaata hoon.',
    ].join('\n');
  }

  if (wantsSteps) {
    return [
      'Step by Step Plan',
      '',
      '1. Understand the concept in one line.',
      '2. Identify key terms or formulas.',
      '3. Solve one guided example.',
      '4. Try one practice question.',
      '5. Revise mistakes and repeat.',
      '',
      'Share your topic and I will fill these steps with exact content.',
    ].join('\n');
  }

  return [
    `I am ${JAMEEL_SYSTEM_PROFILE.name}, your ${JAMEEL_SYSTEM_PROFILE.role}.`,
    '',
    'How I can help right now:',
    '- Explain concepts in simple terms',
    '- Solve coding or logic doubts',
    '- Build project plans',
    '- Create exam revision strategy',
    '',
    'Reply with: "explain simply", "step by step", "give code", or "short answer".',
  ].join('\n');
}

function initJameelAssistant() {
  const fab = document.querySelector('[data-jameel-fab]');
  const panel = document.querySelector('[data-jameel-panel]');
  const closeBtn = document.querySelector('[data-jameel-close]');
  const messages = document.querySelector('[data-jameel-messages]');
  const form = document.querySelector('[data-jameel-form]');
  const input = document.querySelector('[data-jameel-input]');
  const chips = document.querySelectorAll('[data-jameel-chip]');

  if (!fab || !panel || !messages || !form || !input) {
    return;
  }

  const appendMessage = (role, text, extraClass = '') => {
    const item = document.createElement('article');
    item.className = `jameel-msg ${role}${extraClass ? ` ${extraClass}` : ''}`;
    item.textContent = text;
    messages.appendChild(item);
    messages.scrollTop = messages.scrollHeight;
    return item;
  };

  const setOpen = (open) => {
    panel.classList.toggle('is-open', open);
    panel.setAttribute('aria-hidden', open ? 'false' : 'true');
    if (open) {
      input.focus();
    }
  };

  const handleUserMessage = async (messageText) => {
    const cleaned = String(messageText || '').trim();
    if (!cleaned) return;

    appendMessage('user', cleaned);
    const typingEl = appendMessage('bot', 'Typing...', 'typing');

    try {
      if (window.EdunovaAPI?.askJameel) {
        const response = await window.EdunovaAPI.askJameel({
          message: cleaned,
          context: 'dashboard',
        });
        typingEl.remove();
        appendMessage('bot', response?.data?.reply || buildJameelReply(cleaned));
        return;
      }
    } catch {
      // Fallback to local assistant behavior.
    }

    window.setTimeout(() => {
      typingEl.remove();
      appendMessage('bot', buildJameelReply(cleaned));
    }, 420);
  };

  appendMessage(
    'bot',
    'Hi, I am Jameel Jamali from EduNova.\n\nTell me your topic and preferred mode: explain simply, short answer, step by step, give code, or revise this.'
  );

  fab.addEventListener('click', () => setOpen(!panel.classList.contains('is-open')));
  closeBtn?.addEventListener('click', () => setOpen(false));

  chips.forEach((chip) => {
    chip.addEventListener('click', () => {
      const text = chip.getAttribute('data-jameel-chip') || '';
      input.value = text;
      handleUserMessage(text);
      input.value = '';
      setOpen(true);
    });
  });

  form.addEventListener('submit', (event) => {
    event.preventDefault();
    handleUserMessage(input.value);
    input.value = '';
  });
}

initJameelAssistant();
