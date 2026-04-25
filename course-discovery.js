/**
 * Edunova Course Discovery System
 * Handles search, filtering, and course detail views
 */

// ===== DOM SELECTORS =====
const searchToggleBtn = document.querySelector('[data-search-toggle]');
const searchContainer = document.querySelector('[data-search-container]');
const searchInput = document.querySelector('[data-search-input]');
const searchSuggestions = document.querySelector('[data-search-suggestions]');
const suggestionsCoursesContainer = document.querySelector('[data-suggestions-courses]');
const suggestionsCategoriesContainer = document.querySelector('[data-suggestions-categories]');
const suggestionsRecentContainer = document.querySelector('[data-suggestions-recent]');

const categoryFilters = document.querySelectorAll('[data-filter]');
const coursesGallery = document.querySelector('[data-courses-gallery]');

const courseModal = document.querySelector('[data-course-modal]');
const courseModalBackdrop = document.querySelector('[data-course-close]');
const courseModalCloseBtn = courseModal?.querySelector('[data-course-close]');

let currentSearchHighlight = -1;
let searchResults = {};

function toBackgroundValue(source, fallback = 'linear-gradient(135deg, #4e8cff, #8d6bff)') {
  if (!source || typeof source !== 'string') {
    return fallback;
  }

  const value = source.trim();
  if (!value) {
    return fallback;
  }

  if (/^(url\(|linear-gradient\(|radial-gradient\(|conic-gradient\(|var\()/i.test(value)) {
    return value.replace(/^url\(\s*(['"]?)(.*?)\1\s*\)$/i, 'url("$2")');
  }

  if (/^(https?:\/\/|\/\/|data:|blob:|\/|img\/)/i.test(value)) {
    return `url("${encodeURI(value)}")`;
  }

  return fallback;
}

function mapApiCourseToLocal(apiCourse) {
  const localCourseMatch = Array.isArray(courseDatabase?.courses)
    ? courseDatabase.courses.find((course) =>
      Number(course.id) === Number(apiCourse.course_id)
      || String(course.title).toLowerCase() === String(apiCourse.title).toLowerCase()
    )
    : null;

  const fallbackThumbnail = toBackgroundValue(localCourseMatch?.thumbnail);
  const apiThumbnail = toBackgroundValue(apiCourse.thumbnail, fallbackThumbnail);

  return {
    id: Number(apiCourse.course_id),
    title: apiCourse.title,
    shortTitle: apiCourse.title,
    category: localCourseMatch?.category || 'General',
    thumbnail: apiThumbnail,
    rating: localCourseMatch?.rating || 4.7,
    students: localCourseMatch?.students || 1000,
    duration: localCourseMatch?.duration || '10h 00m',
    instructor: localCourseMatch?.instructor || 'Edunova Instructor',
    tagline: localCourseMatch?.tagline || apiCourse.description?.slice(0, 80) || 'Learn with Edunova',
    description: apiCourse.description || 'Course description not available.',
    coverImage: toBackgroundValue(apiCourse.thumbnail || localCourseMatch?.coverImage, fallbackThumbnail),
    wishlist: false,
    completed: 0,
    lastLesson: null,
    modules: [
      {
        id: 1,
        title: 'Course Lessons',
        lessons: [],
      },
    ],
  };
}

async function hydrateCoursesFromApi() {
  if (!window.EdunovaAPI) {
    return;
  }

  try {
    const response = await window.EdunovaAPI.getCourses();
    const apiCourses = Array.isArray(response?.data) ? response.data : [];

    if (apiCourses.length > 0) {
      const hydratedCourses = [];

      for (const apiCourse of apiCourses) {
        const hydratedCourse = mapApiCourseToLocal(apiCourse);

        try {
          const lessonsResponse = await window.EdunovaAPI.getLessonsByCourse(apiCourse.course_id);
          const apiLessons = Array.isArray(lessonsResponse?.data) ? lessonsResponse.data : [];

          if (apiLessons.length > 0) {
            hydratedCourse.modules = [
              {
                id: 1,
                title: 'Course Lessons',
                lessons: apiLessons.map((lesson) => ({
                  id: Number(lesson.lesson_id),
                  title: lesson.title,
                  duration: lesson.duration,
                  completed: false,
                })),
              },
            ];
            hydratedCourse.duration = `${Math.max(apiLessons.length, 1) * 2}h 00m`;
          }
        } catch {
          // Keep course summary even if lessons fail.
        }

        hydratedCourses.push(hydratedCourse);
      }

      courseDatabase.courses = hydratedCourses;
    }
  } catch {
    // Keep local course database fallback when API is unavailable
  }
}

function navigateToCoursePlayer(courseId) {
  const targetUrl = `course-player.html?course=${courseId}`;
  document.body.classList.add('page-transition-out');
  window.setTimeout(() => {
    window.location.href = targetUrl;
  }, 160);
}

// ===== SEARCH FUNCTIONALITY =====

function toggleSearch() {
  const isHidden = searchContainer.hidden;
  searchContainer.hidden = !isHidden;
  if (isHidden) {
    searchInput.focus();
  }
}

function renderSearchSuggestions(results) {
  // Clear previous results
  suggestionsCoursesContainer.innerHTML = '';
  suggestionsCategoriesContainer.innerHTML = '';
  suggestionsRecentContainer.innerHTML = '';

  // Render courses
  if (results.courses && results.courses.length > 0) {
    results.courses.forEach((course, index) => {
      const item = document.createElement('div');
      item.className = 'suggestion-item';
      item.role = 'option';
      item.innerHTML = `
        <div class="suggestion-icon" style="background: ${course.thumbnail}; font-size: 0.8rem;">📚</div>
        <div class="suggestion-text">${highlightMatch(course.title, searchInput.value)}</div>
        <div class="suggestion-meta">${course.category}</div>
      `;
      item.addEventListener('click', () => navigateToCoursePlayer(course.id));
      item.addEventListener('mouseenter', () => setSearchHighlight(index));
      suggestionsCoursesContainer.appendChild(item);
    });
  }

  // Render categories
  if (results.categories && results.categories.length > 0) {
    results.categories.forEach((category, index) => {
      const item = document.createElement('div');
      item.className = 'suggestion-item';
      item.role = 'option';
      item.innerHTML = `
        <div class="suggestion-icon"><i class="${category.icon}"></i></div>
        <div class="suggestion-text">${highlightMatch(category.name, searchInput.value)}</div>
        <div class="suggestion-meta">${category.count} courses</div>
      `;
      item.addEventListener('click', () => filterCoursesByCategory(category.name));
      item.addEventListener('mouseenter', () => setSearchHighlight(results.courses.length + index));
      suggestionsCategoriesContainer.appendChild(item);
    });
  }

  // Render recent searches
  if (results.recent && results.recent.length > 0) {
    results.recent.forEach((recent, index) => {
      const item = document.createElement('div');
      item.className = 'suggestion-item';
      item.role = 'option';
      item.innerHTML = `
        <i class="ri-time-line" style="color: #7a8ba4;"></i>
        <div class="suggestion-text">${recent}</div>
      `;
      item.addEventListener('click', () => {
        searchInput.value = recent;
        updateSearchSuggestions();
      });
      item.addEventListener('mouseenter', () => 
        setSearchHighlight(results.courses.length + results.categories.length + index)
      );
      suggestionsRecentContainer.appendChild(item);
    });
  }

  // Show/hide suggestions
  const hasResults = (results.courses?.length > 0) || (results.categories?.length > 0) || (results.recent?.length > 0);
  searchSuggestions.hidden = !hasResults;
  searchSuggestions.setAttribute('aria-hidden', hasResults ? 'false' : 'true');

  currentSearchHighlight = -1;
}

function updateSearchSuggestions() {
  const query = searchInput.value.trim();
  if (window.EdunovaAPI) {
    window.EdunovaAPI.getCourses(query)
      .then((response) => {
        const apiCourses = Array.isArray(response?.data) ? response.data : [];
        const results = {
          courses: apiCourses.map((course) => ({
            id: Number(course.course_id),
            title: course.title,
            category: course.description?.slice(0, 18) || 'Course',
            thumbnail: toBackgroundValue(course.thumbnail),
          })),
          categories: [],
          recent: query ? [] : courseDatabase.recentSearches,
        };
        searchResults = results;
        renderSearchSuggestions(searchResults);
      })
      .catch(() => {
        searchResults = searchCourses(query);
        renderSearchSuggestions(searchResults);
      });
    return;
  }

  searchResults = searchCourses(query);
  renderSearchSuggestions(searchResults);
}

function highlightMatch(text, query) {
  if (!query) return text;
  const regex = new RegExp(`(${query})`, 'gi');
  return text.replace(regex, '<strong style="color: var(--dash-blue);">$1</strong>');
}

function setSearchHighlight(index) {
  currentSearchHighlight = index;
  const items = searchSuggestions.querySelectorAll('.suggestion-item');
  items.forEach((item, i) => {
    item.classList.toggle('is-highlight', i === index);
  });
}

function handleSearchKeydown(event) {
  const items = searchSuggestions.querySelectorAll('.suggestion-item');
  const totalItems = items.length;

  if (event.key === 'ArrowDown') {
    event.preventDefault();
    currentSearchHighlight = (currentSearchHighlight + 1) % totalItems;
    setSearchHighlight(currentSearchHighlight);
  } else if (event.key === 'ArrowUp') {
    event.preventDefault();
    currentSearchHighlight = (currentSearchHighlight - 1 + totalItems) % totalItems;
    setSearchHighlight(currentSearchHighlight);
  } else if (event.key === 'Enter') {
    event.preventDefault();
    if (currentSearchHighlight >= 0) {
      items[currentSearchHighlight].click();
    }
  } else if (event.key === 'Escape') {
    searchContainer.hidden = true;
  }
}

// ===== COURSE DISCOVERY =====

function renderCoursesGallery(courses) {
  if (!courses || courses.length === 0) {
    coursesGallery.innerHTML = '<div class="gallery-placeholder"><p>No courses found</p></div>';
    return;
  }

  coursesGallery.innerHTML = courses.map(course => {
    const thumbnail = toBackgroundValue(course.thumbnail);
    return `
    <div class="course-card" data-course-id="${course.id}" role="button" tabindex="0">
      <div class="course-card__thumbnail" style='--gradient: ${thumbnail}'></div>
      <div class="course-card__content">
        <div class="course-card__category">${course.category}</div>
        <h3 class="course-card__title">${course.title}</h3>
        <p class="course-card__tagline">${course.tagline}</p>
        <div class="course-card__meta">
          <span class="course-card__rating">
            <i class="ri-star-fill"></i> ${course.rating}
          </span>
          <span>${course.students.toLocaleString()} students</span>
          <span>${course.duration}</span>
        </div>
      </div>
      ${course.wishlist ? '<div class="course-card__badge">In Wishlist</div>' : ''}
      <button class="course-card__wishlist" data-wishlist-btn ${course.wishlist ? 'class="is-active"' : ''}>
        <i class="ri-heart-${course.wishlist ? 'fill' : 'line'}"></i>
      </button>
    </div>
  `;
  }).join('');

  // Add event listeners
  const cards = coursesGallery.querySelectorAll('.course-card');
  cards.forEach(card => {
    card.addEventListener('click', (e) => {
      if (!e.target.closest('[data-wishlist-btn]')) {
        const courseId = parseInt(card.dataset.courseId);
        openCourseDetail(courseId);
      }
    });

    // Wishlist button
    const wishlistBtn = card.querySelector('[data-wishlist-btn]');
    wishlistBtn?.addEventListener('click', (e) => {
      e.stopPropagation();
      toggleWishlist(parseInt(card.dataset.courseId), wishlistBtn);
    });
  });
}

function filterCoursesByCategory(categoryName) {
  if (categoryName === 'all') {
    renderCoursesGallery(courseDatabase.courses);
  } else {
    const filtered = getCoursesByCategory(categoryName);
    renderCoursesGallery(filtered);
  }

  // Update active filter button
  categoryFilters.forEach(btn => {
    btn.classList.toggle('is-active', btn.dataset.filter === categoryName);
  });

  // Close search
  searchContainer.hidden = true;
}

function toggleWishlist(courseId, button) {
  const course = getCourseById(courseId);
  if (!course) return;

  if (course.wishlist) {
    removeFromWishlist(courseId);
    button.classList.remove('is-active');
    button.innerHTML = '<i class="ri-heart-line"></i>';
  } else {
    addToWishlist(courseId);
    button.classList.add('is-active');
    button.innerHTML = '<i class="ri-heart-fill"></i>';
  }
}

// ===== COURSE DETAIL MODAL =====

function openCourseDetail(courseId) {
  const course = getCourseById(courseId);
  if (!course) return;

  // Set hero gradient
  courseModal.style.setProperty('--hero-gradient', toBackgroundValue(course.coverImage));

  // Update hero section
  courseModal.querySelector('[data-course-category]').textContent = course.category;
  courseModal.querySelector('[data-course-title]').textContent = course.title;
  courseModal.querySelector('[data-course-instructor]').textContent = `Instructor: ${course.instructor}`;
  courseModal.querySelector('[data-course-rating]').textContent = course.rating;
  courseModal.querySelector('[data-course-students]').textContent = `${course.students.toLocaleString()} students`;
  courseModal.querySelector('[data-course-duration]').textContent = course.duration;

  // Update description
  courseModal.querySelector('[data-course-description]').textContent = course.description;

  // Update wishlist button
  const wishlistBtn = courseModal.querySelector('[data-toggle-wishlist]');
  wishlistBtn.classList.toggle('is-active', course.wishlist);
  wishlistBtn.innerHTML = course.wishlist 
    ? '<i class="ri-heart-fill"></i> In Wishlist'
    : '<i class="ri-heart-line"></i> Add to Wishlist';

  // Update progress section
  const progress = getCourseProgress(courseId);
  const progressSection = courseModal.querySelector('[data-progress-section]');
  if (progress > 0) {
    progressSection.hidden = false;
    courseModal.querySelector('[data-progress-percent]').textContent = progress + '%';
    courseModal.querySelector('[data-course-progress-bar]').style.width = progress + '%';
    courseModal.querySelector('[data-progress-label]').textContent = course.lastLesson || 'Continue learning';
  } else {
    progressSection.hidden = true;
  }

  // Render modules
  if (window.EdunovaAPI) {
    window.EdunovaAPI.getLessonsByCourse(courseId)
      .then((response) => {
        const lessons = Array.isArray(response?.data) ? response.data : [];
        if (lessons.length > 0) {
          course.modules = [
            {
              id: 1,
              title: 'Course Lessons',
              lessons: lessons.map((lesson) => ({
                id: Number(lesson.lesson_id),
                title: lesson.title,
                duration: lesson.duration,
                completed: false,
              })),
            },
          ];
        }
        renderModules(course);
      })
      .catch(() => renderModules(course));
  } else {
    renderModules(course);
  }

  // Open modal
  courseModal.classList.add('is-open');
  courseModal.setAttribute('aria-hidden', 'false');
  document.body.style.overflow = 'hidden';

  // Add event listeners
  courseModalCloseBtn?.addEventListener('click', closeCourseDetail);
  courseModalBackdrop?.addEventListener('click', closeCourseDetail);
  wishlistBtn.addEventListener('click', () => {
    toggleWishlist(courseId, wishlistBtn);
  });

  // Start learning button
  courseModal.querySelector('[data-start-learning]')?.addEventListener('click', () => {
    showToast('🎓 Opening course player...');
    navigateToCoursePlayer(courseId);
  });
}

function closeCourseDetail() {
  courseModal.classList.remove('is-open');
  courseModal.setAttribute('aria-hidden', 'true');
  document.body.style.overflow = '';
}

function renderModules(course) {
  const modulesList = courseModal.querySelector('[data-modules-list]');
  modulesList.innerHTML = course.modules.map((module, moduleIndex) => `
    <div class="module-item" data-module-id="${module.id}">
      <div class="module-header">
        <h4 class="module-title">
          <span style="color: var(--dash-blue); font-weight: 600;">Module ${moduleIndex + 1}</span>: ${module.title}
        </h4>
        <div class="module-toggle"><i class="ri-arrow-down-s-line"></i></div>
      </div>
      <div class="module-lessons">
        ${module.lessons.map(lesson => `
          <div class="lesson-item ${lesson.completed ? 'completed' : ''}" data-lesson-id="${lesson.id}">
            <div class="lesson-checkbox"></div>
            <div class="lesson-info">
              <div class="lesson-name">${lesson.title}</div>
              <div class="lesson-duration">${lesson.duration}</div>
            </div>
          </div>
        `).join('')}
      </div>
    </div>
  `).join('');

  // Add module expand/collapse
  const modules = modulesList.querySelectorAll('.module-item');
  modules.forEach(module => {
    const header = module.querySelector('.module-header');
    header.addEventListener('click', () => {
      module.classList.toggle('is-expanded');
    });

    // Add lesson click handlers
    const lessons = module.querySelectorAll('.lesson-item');
    lessons.forEach(lesson => {
      lesson.addEventListener('click', () => {
        const lessonId = parseInt(lesson.dataset.lessonId);
        const moduleId = parseInt(module.dataset.moduleId);

        markLessonCompleted(course.id, moduleId, lessonId);
        lesson.classList.add('completed');
        showToast('✅ Lesson marked as complete!');
      });
    });
  });

  // Expand first module by default
  if (modules.length > 0) {
    modules[0].classList.add('is-expanded');
  }
}

// ===== INITIALIZATION =====

document.addEventListener('DOMContentLoaded', async () => {
  await hydrateCoursesFromApi();

  // Initial gallery render
  renderCoursesGallery(courseDatabase.courses);

  // Search functionality
  searchToggleBtn?.addEventListener('click', toggleSearch);
  searchInput?.addEventListener('input', updateSearchSuggestions);
  searchInput?.addEventListener('keydown', handleSearchKeydown);

  // Trending cards open the course player page
  document.querySelectorAll('[data-open-course-player]').forEach((card) => {
    const courseId = parseInt(card.dataset.courseId, 10);

    card.addEventListener('click', () => navigateToCoursePlayer(courseId));
    card.addEventListener('keydown', (event) => {
      if (event.key === 'Enter' || event.key === ' ') {
        event.preventDefault();
        navigateToCoursePlayer(courseId);
      }
    });
  });

  // Close search on outside click
  document.addEventListener('click', (e) => {
    if (!e.target.closest('[data-search-wrapper]')) {
      searchContainer.hidden = true;
    }
  });

  // Category filter buttons
  categoryFilters.forEach(btn => {
    btn.addEventListener('click', () => {
      const filter = btn.dataset.filter;
      filterCoursesByCategory(filter);
      btn.classList.add('is-active');
    });
  });

  // Close course modal on escape
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && courseModal.classList.contains('is-open')) {
      closeCourseDetail();
    }
  });
});

// ===== NAVIGATION =====

// Add "Browse all courses" link handler
document.querySelector('[data-browse-all]')?.addEventListener('click', (e) => {
  e.preventDefault();
  filterCoursesByCategory('all');
  document.querySelector('#discover').scrollIntoView({ behavior: 'smooth' });
});
