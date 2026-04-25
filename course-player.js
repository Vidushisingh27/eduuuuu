const courseIdParam = new URLSearchParams(window.location.search).get('course');
const courseId = Number(courseIdParam || 1);
const course = courseDatabase.courses.find((item) => item.id === courseId) || courseDatabase.courses[0];

const STORAGE_PREFIX = 'edunova-course-player';
const DEFAULT_VIDEO_SRC = 'https://www.w3schools.com/html/mov_bbb.mp4';
const SESSION_KEY = 'edunova-auth-session';

const DEFAULT_LESSON_MEDIA = {
  '3:1': {
    type: 'video',
    source: 'img/os overview (2).mp4',
    label: 'OS Overview',
  },
  '3:2': {
    type: 'video',
    source: 'img/process & thrreads.mp4',
    label: 'Processes & Threads',
  },
  '3:3': {
    type: 'video',
    source: 'img/process scheduling (2).mp4',
    label: 'Process Scheduling',
  },
};

const appRoot = document.querySelector('[data-player-app]');
const courseTitleEl = document.querySelector('[data-course-title]');
const courseInstructorEl = document.querySelector('[data-course-instructor]');
const courseDurationEl = document.querySelector('[data-course-duration]');
const courseProgressEl = document.querySelector('[data-course-progress]');
const courseProgressBarEl = document.querySelector('[data-course-progress-bar]');
const sidebarProgressEl = document.querySelector('[data-sidebar-progress]');
const sidebarProgressBarEl = document.querySelector('[data-sidebar-progress-bar]');
const sidebarResumeEl = document.querySelector('[data-sidebar-resume]');
const lessonTitleEl = document.querySelector('[data-lesson-title]');
const lessonSubtitleEl = document.querySelector('[data-lesson-subtitle]');
const lessonCountEl = document.querySelector('[data-lesson-count]');
const playerStage = document.querySelector('[data-player-stage]');
const moduleListEl = document.querySelector('[data-module-list]');
const volumeSlider = document.querySelector('[data-volume-slider]');
const fullscreenBtn = document.querySelector('[data-fullscreen-btn]');
const markCompleteBtn = document.querySelector('[data-mark-complete]');
const resumeBtn = document.querySelector('[data-resume-current]');
const wishlistBtn = document.querySelector('[data-add-wishlist]');
const overviewDescriptionEl = document.querySelector('[data-course-description]');
const resumeCopyEl = document.querySelector('[data-resume-copy]');
const notesEditor = document.querySelector('[data-notes-editor]');
const saveNotesBtn = document.querySelector('[data-save-notes]');
const clearNotesBtn = document.querySelector('[data-clear-notes]');
const videoUploadInput = document.querySelector('[data-video-upload]');
const youtubeInput = document.querySelector('[data-youtube-input]');
const saveVideoSourceBtn = document.querySelector('[data-save-video-source]');
const resetVideoSourceBtn = document.querySelector('[data-reset-video-source]');
const downloadResourcesBtn = document.querySelector('[data-download-resources]');
const discussionForm = document.querySelector('[data-discussion-form]');
const discussionInput = document.querySelector('[data-discussion-input]');
const discussionList = document.querySelector('[data-discussion-list]');
const tabButtons = document.querySelectorAll('[data-tab-target]');
const tabPanels = document.querySelectorAll('[data-tab-panel]');

const stateKey = `${STORAGE_PREFIX}:state:${course.id}`;
const notesKey = `${STORAGE_PREFIX}:notes:${course.id}`;
const discussionKey = `${STORAGE_PREFIX}:discussion:${course.id}`;

let currentLessonId = null;
let activeModuleId = null;
let playerType = null;
let htmlVideoElement = null;
let youtubePlayer = null;
let youtubeApiPromise = null;
let saveTimeTimer = null;
let currentLessonMedia = null;
let currentLessonTime = 0;
let isLessonCompleted = false;
let currentState = loadPlayerState();
let serverSyncTimer = null;

function getAuthSession() {
  try {
    return JSON.parse(localStorage.getItem(SESSION_KEY) || 'null');
  } catch {
    return null;
  }
}

function navigateWithTransition(url) {
  document.body.classList.add('page-transition-out');
  window.setTimeout(() => {
    window.location.href = url;
  }, 160);
}

function ensurePlayerSession() {
  const session = getAuthSession();
  if (!session?.isLoggedIn) {
    navigateWithTransition('index.html');
    return false;
  }

  return true;
}

function getCurrentUserId() {
  const session = getAuthSession();
  return Number(session?.user_id || 0);
}

async function syncCourseFromApi() {
  if (!window.EdunovaAPI) {
    return;
  }

  try {
    const courseResponse = await window.EdunovaAPI.getCourseById(course.id);
    const courseData = courseResponse?.data;

    if (courseData) {
      course.title = courseData.title || course.title;
      course.description = courseData.description || course.description;
      course.thumbnail = courseData.thumbnail || course.thumbnail;
      course.coverImage = courseData.thumbnail || course.coverImage;
    }

    const lessonsResponse = await window.EdunovaAPI.getLessonsByCourse(course.id);
    const lessons = Array.isArray(lessonsResponse?.data) ? lessonsResponse.data : [];

    if (lessons.length > 0) {
      course.modules = [
        {
          id: 1,
          title: 'Course Lessons',
          lessons: lessons.map((lesson) => ({
            id: Number(lesson.lesson_id),
            title: lesson.title,
            duration: lesson.duration || '10m',
            completed: false,
          })),
        },
      ];
    }
  } catch {
    // Keep local course fallback if API fails
  }
}

function scheduleProgressSync(force = false) {
  if (serverSyncTimer && !force) {
    return;
  }

  if (serverSyncTimer && force) {
    window.clearTimeout(serverSyncTimer);
    serverSyncTimer = null;
  }

  serverSyncTimer = window.setTimeout(async () => {
    serverSyncTimer = null;

    const userId = getCurrentUserId();
    if (!window.EdunovaAPI || !userId || !currentLessonId) {
      return;
    }

    try {
      const completedCount = (currentState.completedLessonIds || []).length;
      const totalLessons = getTotalLessons();
      const progressPercentage = totalLessons > 0
        ? Math.round((completedCount / totalLessons) * 100)
        : 0;

      await window.EdunovaAPI.saveProgress({
        user_id: userId,
        course_id: Number(course.id),
        lesson_id: Number(currentLessonId),
        progress_percentage: Number(progressPercentage),
        last_watched_time: Math.max(0, Math.floor(currentLessonTime || 0)),
      });
    } catch {
      // Keep local progress even if server sync fails
    }
  }, force ? 0 : 900);
}

function getAllLessons() {
  return course.modules.flatMap((module) =>
    module.lessons.map((lesson) => ({
      ...lesson,
      moduleId: module.id,
      moduleTitle: module.title,
    }))
  );
}

function getLessonById(lessonId) {
  return getAllLessons().find((lesson) => lesson.id === lessonId) || getAllLessons()[0];
}

function getLessonIndex(lessonId) {
  return getAllLessons().findIndex((lesson) => lesson.id === lessonId);
}

function getTotalLessons() {
  return getAllLessons().length;
}

function getCompletedLessonIds() {
  return new Set(currentState.completedLessonIds || []);
}

function loadPlayerState() {
  try {
    const stored = localStorage.getItem(stateKey);
    if (!stored) {
      return {
        currentLessonId: null,
        currentLessonTime: 0,
        completedLessonIds: [],
        lessonTimes: {},
        lastUpdatedAt: 0,
      };
    }

    const parsed = JSON.parse(stored);
    return {
      currentLessonId: null,
      currentLessonTime: 0,
      completedLessonIds: [],
      lessonTimes: {},
      lastUpdatedAt: 0,
      ...parsed,
    };
  } catch {
    return {
      currentLessonId: null,
      currentLessonTime: 0,
      completedLessonIds: [],
      lessonTimes: {},
      lastUpdatedAt: 0,
    };
  }
}

function savePlayerState() {
  localStorage.setItem(stateKey, JSON.stringify(currentState));
}

function updatePlayerProgress() {
  const completedCount = (currentState.completedLessonIds || []).length;
  const totalLessons = getTotalLessons();
  const progress = totalLessons ? Math.round((completedCount / totalLessons) * 100) : 0;

  courseProgressEl.textContent = `${progress}%`;
  sidebarProgressEl.textContent = `${progress}%`;
  courseProgressBarEl.style.width = `${progress}%`;
  sidebarProgressBarEl.style.width = `${progress}%`;

  const resumeLesson = getLessonById(currentState.currentLessonId) || getAllLessons()[0];
  const lastTime = currentState.lessonTimes?.[resumeLesson?.id] || currentState.currentLessonTime || 0;
  const resumeCopy = resumeLesson
    ? `Resume ${resumeLesson.title}${lastTime > 0 ? ` from ${formatTime(lastTime)}` : ''}.`
    : 'Resume from the first lesson.';

  sidebarResumeEl.textContent = resumeCopy;
  resumeCopyEl.textContent = resumeCopy;
}

function formatTime(totalSeconds) {
  const safeSeconds = Math.max(0, Math.floor(totalSeconds));
  const minutes = Math.floor(safeSeconds / 60);
  const seconds = safeSeconds % 60;
  return `${minutes}:${String(seconds).padStart(2, '0')}`;
}

function getLessonMediaStorageKey(lessonId) {
  return `${STORAGE_PREFIX}:media:${course.id}:${lessonId}`;
}

function getLessonMedia(lessonId) {
  try {
    const stored = localStorage.getItem(getLessonMediaStorageKey(lessonId));
    if (stored) {
      return JSON.parse(stored);
    }
  } catch {
    // ignore
  }

  const defaultMedia = DEFAULT_LESSON_MEDIA[`${course.id}:${lessonId}`];
  if (defaultMedia) {
    return defaultMedia;
  }

  return {
    type: 'video',
    source: DEFAULT_VIDEO_SRC,
    label: 'Edunova demo lesson',
  };
}

function saveLessonMedia(lessonId, media) {
  localStorage.setItem(getLessonMediaStorageKey(lessonId), JSON.stringify(media));
}

function clearLessonMedia(lessonId) {
  localStorage.removeItem(getLessonMediaStorageKey(lessonId));
}

function extractYouTubeId(url) {
  if (!url) return null;

  const match = url.match(/(?:youtube\.com\/(?:watch\?v=|embed\/|shorts\/)|youtu\.be\/)([a-zA-Z0-9_-]{11})/);
  return match ? match[1] : null;
}

function buildYouTubeEmbedUrl(url) {
  const videoId = extractYouTubeId(url);
  return videoId ? `https://www.youtube.com/embed/${videoId}?rel=0&enablejsapi=1&modestbranding=1` : null;
}

function destroyActivePlayer() {
  if (htmlVideoElement) {
    htmlVideoElement.pause();
    htmlVideoElement.src = '';
    htmlVideoElement.removeAttribute('src');
    htmlVideoElement.load();
    htmlVideoElement = null;
  }

  if (youtubePlayer && typeof youtubePlayer.destroy === 'function') {
    youtubePlayer.destroy();
    youtubePlayer = null;
  }

  playerStage.innerHTML = '';
  playerType = null;
}

function ensureYouTubeApi() {
  if (window.YT?.Player) {
    return Promise.resolve();
  }

  if (youtubeApiPromise) {
    return youtubeApiPromise;
  }

  youtubeApiPromise = new Promise((resolve) => {
    const previousReady = window.onYouTubeIframeAPIReady;

    window.onYouTubeIframeAPIReady = () => {
      if (typeof previousReady === 'function') {
        previousReady();
      }
      resolve();
    };

    const script = document.createElement('script');
    script.src = 'https://www.youtube.com/iframe_api';
    document.head.appendChild(script);
  });

  return youtubeApiPromise;
}

function markLessonComplete(lessonId) {
  const completed = getCompletedLessonIds();
  completed.add(lessonId);
  currentState.completedLessonIds = Array.from(completed);
  savePlayerState();
  renderLessonList();
  updatePlayerProgress();
  showVideoStatus('Completed ✔');
  scheduleProgressSync(true);
}

function showVideoStatus(message) {
  const statusEl = document.querySelector('.video-note');
  if (statusEl) {
    statusEl.textContent = message;
  }
}

function updateCurrentLessonTime(timeValue) {
  currentLessonTime = timeValue;
  currentState.currentLessonTime = timeValue;
  currentState.lessonTimes = currentState.lessonTimes || {};
  currentState.lessonTimes[currentLessonId] = timeValue;
  currentState.lastUpdatedAt = Date.now();
  savePlayerState();
  scheduleProgressSync(false);
}

function playLesson(lessonId, preserveTime = false) {
  const lesson = getLessonById(lessonId);
  if (!lesson) return;

  const lessonIndex = getLessonIndex(lessonId);
  const media = getLessonMedia(lessonId);

  currentLessonId = lessonId;
  activeModuleId = lesson.moduleId;
  currentLessonMedia = media;
  isLessonCompleted = getCompletedLessonIds().has(lessonId);

  currentState.currentLessonId = lessonId;
  currentState.currentLessonTime = preserveTime ? currentState.currentLessonTime : (currentState.lessonTimes?.[lessonId] || 0);
  currentState.lastUpdatedAt = Date.now();
  savePlayerState();

  lessonTitleEl.textContent = lesson.title;
  lessonSubtitleEl.textContent = `${lesson.moduleTitle} • ${lesson.duration}`;
  lessonCountEl.textContent = `${lessonIndex + 1} / ${getTotalLessons()}`;

  renderPlayer(media, preserveTime ? currentState.lessonTimes?.[lessonId] || 0 : currentState.currentLessonTime || 0);
  renderLessonList();
  updatePlayerProgress();

  if (youtubePlayer && media.type === 'youtube' && currentLessonTime > 0) {
    youtubePlayer.seekTo(currentLessonTime, true);
  }

  window.scrollTo({ top: 0, behavior: 'smooth' });
}

function renderPlayer(media, resumeTime = 0) {
  destroyActivePlayer();
  showVideoStatus(isLessonCompleted ? 'Completed lesson ready to replay.' : 'Watching will update your progress automatically.');

  if (media.type === 'youtube') {
    playerType = 'youtube';
    const wrapper = document.createElement('div');
    wrapper.id = 'youtube-player';
    wrapper.style.width = '100%';
    wrapper.style.height = '100%';
    playerStage.appendChild(wrapper);

    ensureYouTubeApi().then(() => {
      youtubePlayer = new window.YT.Player('youtube-player', {
        videoId: extractYouTubeId(media.source),
        playerVars: {
          rel: 0,
          modestbranding: 1,
          playsinline: 1,
          start: Math.floor(resumeTime || 0),
        },
        events: {
          onReady: (event) => {
            if (resumeTime > 0) {
              event.target.seekTo(resumeTime, true);
            }
          },
          onStateChange: (event) => {
            if (event.data === window.YT.PlayerState.PLAYING) {
              startTimeSaver();
            }
            if (event.data === window.YT.PlayerState.PAUSED) {
              stopTimeSaver();
              updateCurrentLessonTime(event.target.getCurrentTime());
            }
            if (event.data === window.YT.PlayerState.ENDED) {
              stopTimeSaver();
              updateCurrentLessonTime(0);
              markLessonComplete(currentLessonId);
            }
          },
        },
      });
    });
    return;
  }

  playerType = 'video';
  const video = document.createElement('video');
  video.controls = true;
  video.playsInline = true;
  video.preload = 'metadata';
  video.src = media.source || DEFAULT_VIDEO_SRC;
  playerStage.appendChild(video);
  htmlVideoElement = video;

  video.volume = Number(volumeSlider.value || 1);

  video.addEventListener('loadedmetadata', () => {
    if (resumeTime > 0) {
      try {
        video.currentTime = resumeTime;
      } catch {
        // ignore seek failures
      }
    }
  });

  video.addEventListener('play', () => startTimeSaver());
  video.addEventListener('pause', () => {
    stopTimeSaver();
    updateCurrentLessonTime(video.currentTime || 0);
  });
  video.addEventListener('timeupdate', () => {
    updateCurrentLessonTime(video.currentTime || 0);
  });
  video.addEventListener('ended', () => {
    stopTimeSaver();
    updateCurrentLessonTime(0);
    markLessonComplete(currentLessonId);
  });
}

function startTimeSaver() {
  stopTimeSaver();
  saveTimeTimer = window.setInterval(() => {
    if (playerType === 'video' && htmlVideoElement) {
      updateCurrentLessonTime(htmlVideoElement.currentTime || 0);
    }
    if (playerType === 'youtube' && youtubePlayer?.getCurrentTime) {
      updateCurrentLessonTime(youtubePlayer.getCurrentTime() || 0);
    }
  }, 5000);
}

function stopTimeSaver() {
  if (saveTimeTimer) {
    window.clearInterval(saveTimeTimer);
    saveTimeTimer = null;
  }
}

function renderLessonList() {
  const completed = getCompletedLessonIds();

  moduleListEl.innerHTML = course.modules
    .map((module, moduleIndex) => {
      const lessons = module.lessons
        .map((lesson) => {
          const isActive = lesson.id === currentLessonId;
          const isComplete = completed.has(lesson.id);
          return `
            <button class="lesson-btn ${isActive ? 'is-active' : ''} ${isComplete ? 'is-complete' : ''}" type="button" data-lesson-id="${lesson.id}">
              <span class="lesson-status"><i class="ri-${isComplete ? 'check-double-fill' : isActive ? 'play-fill' : 'play-line'}"></i></span>
              <span class="lesson-title-wrap">
                <strong>${lesson.title}</strong>
                <span>${module.title}</span>
              </span>
              <span class="lesson-duration">${lesson.duration}${isComplete ? ' • Completed ✔' : ''}</span>
            </button>
          `;
        })
        .join('');

      return `
        <div class="module-item ${module.id === activeModuleId ? 'is-open' : ''}" data-module-id="${module.id}">
          <button class="module-header" type="button">
            <h4>Module ${moduleIndex + 1}: ${module.title}</h4>
            <i class="ri-arrow-down-s-line"></i>
          </button>
          <div class="module-lessons">${lessons}</div>
        </div>
      `;
    })
    .join('');

  moduleListEl.querySelectorAll('.module-header').forEach((header) => {
    header.addEventListener('click', () => {
      header.parentElement.classList.toggle('is-open');
    });
  });

  moduleListEl.querySelectorAll('.lesson-btn').forEach((button) => {
    button.addEventListener('click', () => {
      const lessonId = Number(button.dataset.lessonId);
      const currentTime = playerType === 'video' ? htmlVideoElement?.currentTime || 0 : youtubePlayer?.getCurrentTime?.() || 0;
      updateCurrentLessonTime(currentTime);
      playLesson(lessonId, true);
    });
  });
}

function toggleTab(tabKey) {
  tabButtons.forEach((button) => button.classList.toggle('is-active', button.dataset.tabTarget === tabKey));
  tabPanels.forEach((panel) => panel.classList.toggle('is-active', panel.dataset.tabPanel === tabKey));
}

function updateCourseHeader() {
  courseTitleEl.textContent = course.title;
  courseInstructorEl.textContent = course.instructor;
  courseDurationEl.textContent = course.duration;
  overviewDescriptionEl.textContent = course.description;

  wishlistBtn.innerHTML = course.wishlist ? '<i class="ri-heart-fill"></i> Wishlist' : '<i class="ri-heart-line"></i> Wishlist';
}

function loadNotes() {
  notesEditor.value = localStorage.getItem(notesKey) || '';
}

function saveNotes() {
  localStorage.setItem(notesKey, notesEditor.value);
  showVideoStatus('Notes saved.');
}

function clearNotes() {
  notesEditor.value = '';
  localStorage.removeItem(notesKey);
}

function loadDiscussion() {
  const discussion = JSON.parse(localStorage.getItem(discussionKey) || '[]');
  discussionList.innerHTML = discussion
    .map((entry) => `
      <article class="discussion-item">
        <div class="discussion-item__meta">
          <strong>${entry.author}</strong>
          <span>${entry.time}</span>
        </div>
        <p>${entry.text}</p>
      </article>
    `)
    .join('') || '<div class="discussion-item"><p>No comments yet. Start the discussion.</p></div>';
}

function addDiscussionComment(text) {
  const discussion = JSON.parse(localStorage.getItem(discussionKey) || '[]');
  discussion.unshift({
    author: 'Student',
    time: new Date().toLocaleString(),
    text,
  });
  localStorage.setItem(discussionKey, JSON.stringify(discussion.slice(0, 20)));
  loadDiscussion();
}

function saveCurrentLessonVideoSource(media) {
  saveLessonMedia(currentLessonId, media);
  currentLessonMedia = media;
  playLesson(currentLessonId, true);
  showVideoStatus('Video source saved for this lesson.');
}

function downloadResources() {
  const blob = new Blob([
    `Edunova resources for ${course.title}\n\nCurrent lesson: ${lessonTitleEl.textContent}\nInstructor: ${course.instructor}`,
  ], { type: 'text/plain' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = `${course.shortTitle || course.title}-resources.txt`;
  link.click();
  URL.revokeObjectURL(url);
}

function wireControls() {
  tabButtons.forEach((button) => {
    button.addEventListener('click', () => toggleTab(button.dataset.tabTarget));
  });

  volumeSlider?.addEventListener('input', () => {
    const value = Number(volumeSlider.value);
    if (htmlVideoElement) {
      htmlVideoElement.volume = value;
    }
    if (youtubePlayer?.setVolume) {
      youtubePlayer.setVolume(value * 100);
    }
  });

  fullscreenBtn?.addEventListener('click', () => {
    const requestElement = playerStage.querySelector('video') || playerStage.querySelector('iframe') || playerStage;
    if (requestElement.requestFullscreen) {
      requestElement.requestFullscreen();
    }
  });

  markCompleteBtn?.addEventListener('click', () => {
    markLessonComplete(currentLessonId);
  });

  resumeBtn?.addEventListener('click', () => {
    playLesson(currentLessonId || currentState.currentLessonId || getAllLessons()[0].id, true);
  });

  wishlistBtn?.addEventListener('click', () => {
    course.wishlist = !course.wishlist;
    updateCourseHeader();
    showVideoStatus(course.wishlist ? 'Added to wishlist.' : 'Removed from wishlist.');
  });

  saveNotesBtn?.addEventListener('click', saveNotes);
  clearNotesBtn?.addEventListener('click', clearNotes);

  saveVideoSourceBtn?.addEventListener('click', async () => {
    if (!currentLessonId) return;

    const youtubeUrl = youtubeInput.value.trim();
    if (youtubeUrl) {
      const embedUrl = buildYouTubeEmbedUrl(youtubeUrl);
      if (!embedUrl) {
        showVideoStatus('Please paste a valid YouTube URL.');
        return;
      }
      saveCurrentLessonVideoSource({ type: 'youtube', source: embedUrl, label: 'YouTube video' });
      return;
    }

    const file = videoUploadInput.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = () => {
        saveCurrentLessonVideoSource({ type: 'video', source: String(reader.result), label: file.name });
      };
      reader.readAsDataURL(file);
      return;
    }

    showVideoStatus('Choose an MP4 file or paste a YouTube link first.');
  });

  resetVideoSourceBtn?.addEventListener('click', () => {
    if (!currentLessonId) return;
    clearLessonMedia(currentLessonId);
    youtubeInput.value = '';
    videoUploadInput.value = '';
    playLesson(currentLessonId, true);
    showVideoStatus('Lesson video reset to default preview.');
  });

  downloadResourcesBtn?.addEventListener('click', downloadResources);

  discussionForm?.addEventListener('submit', (event) => {
    event.preventDefault();
    const text = discussionInput.value.trim();
    if (!text) return;
    addDiscussionComment(text);
    discussionInput.value = '';
  });

  document.addEventListener('keydown', (event) => {
    if (event.key === 'Escape') {
      navigateWithTransition('dashboard.html');
    }
  });
}

async function initCoursePlayer() {
  if (!ensurePlayerSession()) {
    return;
  }

  if (!course) {
    courseTitleEl.textContent = 'Course not found';
    playerStage.innerHTML = '<div class="player-placeholder"><i class="ri-error-warning-line"></i><p>The requested course could not be loaded.</p></div>';
    return;
  }

  const backButton = document.querySelector('.player-back');
  backButton?.addEventListener('click', (event) => {
    event.preventDefault();
    navigateWithTransition('dashboard.html');
  });

  await syncCourseFromApi();

  updateCourseHeader();
  loadNotes();
  loadDiscussion();
  wireControls();
  renderLessonList();
  updatePlayerProgress();

  const initialLessonId = currentState.currentLessonId || getAllLessons()[0].id;
  playLesson(initialLessonId);
}

initCoursePlayer();