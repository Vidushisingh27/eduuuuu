/**
 * Edunova Course Database
 * Contains all courses with modules, lessons, and metadata
 */

const courseDatabase = {
  courses: [
    {
      id: 1,
      title: "Full Stack Web Development",
      shortTitle: "Web Development",
      category: "Web Development",
      thumbnail: "url('img/full stack web dev.jpeg')",
      rating: 4.9,
      students: 12500,
      duration: "24h 30m",
      instructor: "Raj Kumar",
      tagline: "Build modern web apps from frontend to backend",
      description: "Master HTML, CSS, JavaScript, React, Node.js, and databases to build complete web applications.",
      coverImage: "url('img/full stack web dev.jpeg')",
      wishlist: false,
      completed: 35,
      lastLesson: "Module 2 - Lesson 4",
      modules: [
        {
          id: 1,
          title: "HTML & CSS Fundamentals",
          lessons: [
            { id: 1, title: "HTML Introduction", duration: "15m", completed: true },
            { id: 2, title: "HTML Structure & Semantics", duration: "22m", completed: true },
            { id: 3, title: "CSS Selectors & Properties", duration: "28m", completed: true },
            { id: 4, title: "CSS Layouts & Flexbox", duration: "35m", completed: false }
          ]
        },
        {
          id: 2,
          title: "JavaScript Basics",
          lessons: [
            { id: 5, title: "Variables & Data Types", duration: "20m", completed: false },
            { id: 6, title: "Functions & Scope", duration: "25m", completed: false },
            { id: 7, title: "DOM Manipulation", duration: "30m", completed: false }
          ]
        },
        {
          id: 3,
          title: "React Framework",
          lessons: [
            { id: 8, title: "React Basics", duration: "35m", completed: false },
            { id: 9, title: "Components & JSX", duration: "40m", completed: false },
            { id: 10, title: "State & Props", duration: "38m", completed: false }
          ]
        }
      ]
    },
    {
      id: 2,
      title: "Data Science Essentials",
      shortTitle: "Data Science",
      category: "Data Science",
      thumbnail: "url('img/Data sci.jpeg')",
      rating: 4.8,
      students: 9800,
      duration: "18h 45m",
      instructor: "Sarah Anderson",
      tagline: "Master Python, stats, and machine learning",
      description: "Learn Python programming, data analysis with Pandas & NumPy, and machine learning fundamentals.",
      coverImage: "url('img/Data sci.jpeg')",
      wishlist: false,
      completed: 20,
      lastLesson: "Module 1 - Lesson 3",
      modules: [
        {
          id: 1,
          title: "Python Fundamentals",
          lessons: [
            { id: 1, title: "Python Setup & Basics", duration: "18m", completed: true },
            { id: 2, title: "Data Types & Variables", duration: "25m", completed: true },
            { id: 3, title: "Control Flow", duration: "30m", completed: false }
          ]
        },
        {
          id: 2,
          title: "Data Analysis",
          lessons: [
            { id: 4, title: "NumPy Basics", duration: "28m", completed: false },
            { id: 5, title: "Pandas DataFrames", duration: "35m", completed: false }
          ]
        }
      ]
    },
    {
      id: 3,
      title: "Operating Systems Deep Dive",
      shortTitle: "Operating Systems",
      category: "Operating Systems",
      thumbnail: "url('img/os.jpeg')",
      rating: 4.7,
      students: 8200,
      duration: "22h 15m",
      instructor: "Dr. Michael Chen",
      tagline: "Understand processes, memory, and file systems",
      description: "Explore OS concepts including processes, threading, memory management, scheduling, and file systems.",
      coverImage: "url('img/Os.jpeg')",
      wishlist: false,
      completed: 18,
      lastLesson: "Module 1 - Lesson 2",
      modules: [
        {
          id: 1,
          title: "Core Concepts",
          lessons: [
            { id: 1, title: "OS Overview", duration: "20m", completed: true },
            { id: 2, title: "Processes & Threads", duration: "32m", completed: false },
            { id: 3, title: "Process Scheduling", duration: "28m", completed: false }
          ]
        },
        {
          id: 2,
          title: "Memory Management",
          lessons: [
            { id: 4, title: "Virtual Memory", duration: "35m", completed: false },
            { id: 5, title: "Page Replacement", duration: "30m", completed: false }
          ]
        }
      ]
    },
    {
      id: 4,
      title: "Database Design & SQL",
      shortTitle: "DBMS",
      category: "Database",
      thumbnail: "url('img/Dbms.jpeg')",
      rating: 4.9,
      students: 11200,
      duration: "20h 30m",
      instructor: "Emily Rodriguez",
      tagline: "Master SQL, normalization, and database design",
      description: "Learn database concepts, SQL queries, normalization, indexing, and database optimization techniques.",
      coverImage: "url('img/Dbms.jpeg')",
      wishlist: true,
      completed: 0,
      lastLesson: null,
      modules: [
        {
          id: 1,
          title: "Database Basics",
          lessons: [
            { id: 1, title: "DBMS Concepts", duration: "22m", completed: false },
            { id: 2, title: "SQL Fundamentals", duration: "28m", completed: false },
            { id: 3, title: "Data Types & Constraints", duration: "25m", completed: false }
          ]
        }
      ]
    },
    {
      id: 5,
      title: "AI & Machine Learning",
      shortTitle: "AI & ML",
      category: "Artificial Intelligence",
      thumbnail: "url('img/aiml.png')",
      rating: 4.6,
      students: 7500,
      duration: "32h 20m",
      instructor: "Alex Martinez",
      tagline: "Build intelligent systems with TensorFlow & PyTorch",
      description: "Deep learning, neural networks, computer vision, and NLP for real-world applications.",
      coverImage: "url('img/aiml.png')",
      wishlist: false,
      completed: 5,
      lastLesson: null,
      modules: [
        {
          id: 1,
          title: "ML Fundamentals",
          lessons: [
            { id: 1, title: "ML Overview", duration: "25m", completed: false },
            { id: 2, title: "Supervised Learning", duration: "35m", completed: false }
          ]
        }
      ]
    },
    {
      id: 6,
      title: "Cloud Computing & DevOps",
      shortTitle: "Cloud & DevOps",
      category: "Cloud",
      thumbnail: "url('img/cloud.png')",
      rating: 4.8,
      students: 6900,
      duration: "19h 45m",
      instructor: "James Wilson",
      tagline: "Deploy applications with Docker, Kubernetes & AWS",
      description: "Learn containerization, orchestration, CI/CD pipelines, and cloud deployment strategies.",
      coverImage: "url('img/cloud.png')",
      wishlist: false,
      completed: 12,
      lastLesson: null,
      modules: [
        {
          id: 1,
          title: "Docker Basics",
          lessons: [
            { id: 1, title: "Container Fundamentals", duration: "28m", completed: false },
            { id: 2, title: "Dockerfile & Images", duration: "32m", completed: false }
          ]
        }
      ]
    }
  ],

  categories: [
    { id: 1, name: "Web Development", icon: "ri-code-line", count: 24 },
    { id: 2, name: "Data Science", icon: "ri-database-2-line", count: 18 },
    { id: 3, name: "Artificial Intelligence", icon: "ri-brain-line", count: 15 },
    { id: 4, name: "Operating Systems", icon: "ri-command-line", count: 12 },
    { id: 5, name: "Database", icon: "ri-database-line", count: 14 },
    { id: 6, name: "Cloud", icon: "ri-cloud-line", count: 11 }
  ],

  trending: [
    { courseId: 1, tag: "Trending 🔥", reason: "5K students enrolled this week" },
    { courseId: 4, tag: "Popular 👑", reason: "Highest rated course" },
    { courseId: 2, tag: "New 🌟", reason: "Just updated with new content" }
  ],

  recentSearches: [
    "Web Development",
    "Python Programming",
    "React Tutorial",
    "Database Design",
    "Cloud Computing"
  ]
};

/**
 * Search function for courses
 */
function searchCourses(query) {
  const q = query.toLowerCase();
  
  if (!q) return {
    courses: [],
    categories: [],
    recent: courseDatabase.recentSearches
  };

  const matchedCourses = courseDatabase.courses.filter(course =>
    course.title.toLowerCase().includes(q) ||
    course.shortTitle.toLowerCase().includes(q) ||
    course.category.toLowerCase().includes(q) ||
    course.description.toLowerCase().includes(q)
  );

  const matchedCategories = courseDatabase.categories.filter(cat =>
    cat.name.toLowerCase().includes(q)
  );

  return {
    courses: matchedCourses.slice(0, 5),
    categories: matchedCategories.slice(0, 3),
    recent: []
  };
}

/**
 * Get course by ID
 */
function getCourseById(courseId) {
  return courseDatabase.courses.find(c => c.id === courseId);
}

/**
 * Get courses by category
 */
function getCoursesByCategory(categoryName) {
  return courseDatabase.courses.filter(c => 
    c.category.toLowerCase() === categoryName.toLowerCase()
  );
}

/**
 * Get trending courses
 */
function getTrendingCourses() {
  return courseDatabase.trending.map(t => {
    const course = getCourseById(t.courseId);
    return { ...course, trendingTag: t.tag, trendingReason: t.reason };
  });
}

/**
 * Get wishlist courses
 */
function getWishlistCourses() {
  return courseDatabase.courses.filter(c => c.wishlist);
}

/**
 * Add course to wishlist
 */
function addToWishlist(courseId) {
  const course = getCourseById(courseId);
  if (course) {
    course.wishlist = true;
    return true;
  }
  return false;
}

/**
 * Remove course from wishlist
 */
function removeFromWishlist(courseId) {
  const course = getCourseById(courseId);
  if (course) {
    course.wishlist = false;
    return true;
  }
  return false;
}

/**
 * Mark lesson as completed
 */
function markLessonCompleted(courseId, moduleId, lessonId) {
  const course = getCourseById(courseId);
  if (!course) return false;
  
  const module = course.modules.find(m => m.id === moduleId);
  if (!module) return false;
  
  const lesson = module.lessons.find(l => l.id === lessonId);
  if (lesson) {
    lesson.completed = true;
    // Update course progress
    const totalLessons = course.modules.reduce((sum, m) => sum + m.lessons.length, 0);
    const completedLessons = course.modules.reduce((sum, m) => 
      sum + m.lessons.filter(l => l.completed).length, 0
    );
    course.completed = Math.round((completedLessons / totalLessons) * 100);
    return true;
  }
  return false;
}

/**
 * Get course progress percentage
 */
function getCourseProgress(courseId) {
  const course = getCourseById(courseId);
  if (!course) return 0;
  
  const totalLessons = course.modules.reduce((sum, m) => sum + m.lessons.length, 0);
  const completedLessons = course.modules.reduce((sum, m) => 
    sum + m.lessons.filter(l => l.completed).length, 0
  );
  
  return Math.round((completedLessons / totalLessons) * 100);
}

// Export for use in other scripts
if (typeof module !== 'undefined' && module.exports) {
  module.exports = {
    courseDatabase,
    searchCourses,
    getCourseById,
    getCoursesByCategory,
    getTrendingCourses,
    getWishlistCourses,
    addToWishlist,
    removeFromWishlist,
    markLessonCompleted,
    getCourseProgress
  };
}
