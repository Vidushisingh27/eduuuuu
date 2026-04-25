// Cache key auth page elements once to avoid repeated DOM queries.
const authCard = document.querySelector('.auth-card');
const modeButtons = document.querySelectorAll('.toggle-btn');
const switchButtons = document.querySelectorAll('[data-switch-to]');
const passwordToggles = document.querySelectorAll('.password-toggle');
const forms = document.querySelectorAll('.auth-form');
const SESSION_KEY = 'edunova-auth-session';
const LOCAL_USERS_KEY = 'edunova-local-users';

// Basic email format check used by client-side validation.
const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

// Adds a short fade/scale transition before navigation.
function navigateWithTransition(url) {
  document.body.classList.add('page-transition-out');
  document.body.style.transition = 'opacity 0.2s ease, transform 0.2s ease';
  document.body.style.opacity = '0';
  document.body.style.transform = 'scale(0.99)';

  window.setTimeout(() => {
    window.location.href = url;
  }, 200);
}

// Reads the auth session payload from localStorage.
function loadSession() {
  try {
    return JSON.parse(localStorage.getItem(SESSION_KEY) || 'null');
  } catch {
    return null;
  }
}

function loadLocalUsers() {
  try {
    return JSON.parse(localStorage.getItem(LOCAL_USERS_KEY) || '[]');
  } catch {
    return [];
  }
}

function saveLocalUsers(users) {
  localStorage.setItem(LOCAL_USERS_KEY, JSON.stringify(users));
}

function findLocalUserByEmail(email) {
  const normalizedEmail = String(email || '').trim().toLowerCase();
  return loadLocalUsers().find((user) => user.email === normalizedEmail) || null;
}

function saveLocalUser(user) {
  const normalizedEmail = String(user.email || '').trim().toLowerCase();
  const users = loadLocalUsers();
  const nextUser = {
    user_id: user.user_id || Date.now(),
    name: user.name || 'Learner',
    email: normalizedEmail,
    password: String(user.password || ''),
  };

  const nextUsers = users.filter((existingUser) => existingUser.email !== normalizedEmail);
  nextUsers.push(nextUser);
  saveLocalUsers(nextUsers);

  return nextUser;
}

function isNetworkFailure(error) {
  const message = String(error?.message || '').toLowerCase();
  return message.includes('failed to fetch') || message.includes('networkerror') || message.includes('fetch failed');
}

// Persists authenticated user details for session restore.
function saveSession(payload) {
  localStorage.setItem(
    SESSION_KEY,
    JSON.stringify({
      isLoggedIn: true,
      user_id: payload.user_id || null,
      name: payload.name || 'Learner',
      email: payload.email || '',
      token: payload.token || null,
      rememberMe: Boolean(payload.rememberMe),
      loginAt: new Date().toISOString(),
    })
  );
}

// Writes a top-level validation/API error to the first hint area in a form.
function setFormError(form, message) {
  const firstHint = form.querySelector('.field-hint');
  if (firstHint) {
    firstHint.textContent = message;
  }
}

// Switches the card UI between login and signup modes.
function setMode(mode) {
  if (!authCard) {
    return;
  }

  authCard.classList.toggle('mode-signup', mode === 'signup');
  modeButtons.forEach((button) => {
    button.classList.toggle('active', button.dataset.mode === mode);
  });
}

// Primary mode toggle controls.
modeButtons.forEach((button) => {
  button.addEventListener('click', () => setMode(button.dataset.mode));
});

// Secondary inline links that jump between panes.
switchButtons.forEach((button) => {
  button.addEventListener('click', () => setMode(button.dataset.switchTo));
});

// Show/hide password controls for both forms.
passwordToggles.forEach((button) => {
  button.addEventListener('click', () => {
    const input = button.parentElement?.querySelector('input');
    const icon = button.querySelector('i');

    if (!input || !icon) {
      return;
    }

    const isHidden = input.type === 'password';
    input.type = isHidden ? 'text' : 'password';
    icon.className = isHidden ? 'ri-eye-off-line' : 'ri-eye-line';
    button.setAttribute('aria-label', isHidden ? 'Hide password' : 'Show password');
  });
});

// Validates one field and updates its visual state and hint text.
function validateField(input) {
  const group = input.closest('.field-group');
  const hint = group?.querySelector('.field-hint');
  let message = '';
  let valid = true;

  if (input.hasAttribute('required') && !input.value.trim()) {
    message = 'This field is required.';
    valid = false;
  } else if (input.type === 'email' && input.value.trim() && !emailPattern.test(input.value.trim())) {
    message = 'Enter a valid email address.';
    valid = false;
  } else if (input.name === 'loginPassword' && input.value.trim().length < 6) {
    message = 'Password must be at least 6 characters.';
    valid = false;
  } else if (input.name === 'signupPassword' && input.value.trim().length < 8) {
    message = 'Password must be at least 8 characters.';
    valid = false;
  } else if (input.name === 'confirmPassword') {
    const password = input.closest('form')?.querySelector('[name="signupPassword"]');
    if (password && input.value.trim() !== password.value.trim()) {
      message = 'Passwords do not match.';
      valid = false;
    }
  }

  group?.classList.toggle('valid', valid && input.value.trim().length > 0);
  group?.classList.toggle('invalid', !valid);
  if (hint) {
    hint.textContent = message;
  }

  return valid;
}

// Attach validation and submit handling to both login/signup forms.
forms.forEach((form) => {
  const inputs = form.querySelectorAll('input');

  // Live validate while typing and when leaving each input.
  inputs.forEach((input) => {
    input.addEventListener('input', () => validateField(input));
    input.addEventListener('blur', () => validateField(input));
  });

  // Handle auth submit via API and then store session locally.
  form.addEventListener('submit', async (event) => {
    event.preventDefault();

    // Block submit if any field is invalid.
    const allValid = Array.from(inputs).every((input) => validateField(input));
    if (!allValid) {
      authCard?.classList.add('switching');
      window.setTimeout(() => authCard?.classList.remove('switching'), 220);
      return;
    }

    authCard?.classList.add('switching');
    form.querySelector('.submit-btn')?.classList.add('pulse');

    // Determine active pane values and shape a unified payload.
    const pane = form.closest('[data-pane]')?.dataset.pane || 'login';
    const fullName = form.querySelector('[name="fullName"]')?.value.trim();
    const signupEmail = form.querySelector('[name="signupEmail"]')?.value.trim();
    const loginId = form.querySelector('[name="loginId"]')?.value.trim();
    const rememberMe = form.querySelector('[name="rememberMe"]')?.checked || false;

    const name = pane === 'signup' ? fullName : 'Aarav B.';
    const email = pane === 'signup' ? signupEmail : loginId;

    try {
      let apiResponse;
      let fallbackUser = null;

      // Call the matching backend endpoint for signup/login.
      if (window.EdunovaAPI) {
        apiResponse = pane === 'signup'
          ? await window.EdunovaAPI.register({
              name,
              email,
              password: form.querySelector('[name="signupPassword"]')?.value || '',
            })
          : await window.EdunovaAPI.login({
              email,
              password: form.querySelector('[name="loginPassword"]')?.value || '',
            });
      }

      // Normalize API output before writing to session.
      const userFromApi = apiResponse?.data?.user;
      const tokenFromApi = apiResponse?.data?.token;

      const payload = {
        user_id: userFromApi?.user_id || null,
        name: userFromApi?.name || name,
        email: userFromApi?.email || email,
        token: tokenFromApi || null,
        rememberMe,
      };

      if (!userFromApi && !tokenFromApi && pane === 'signup') {
        fallbackUser = saveLocalUser({
          name,
          email,
          password: form.querySelector('[name="signupPassword"]')?.value || '',
        });
      }

      if (!userFromApi && !tokenFromApi && pane === 'login') {
        const localUser = findLocalUserByEmail(email);
        const loginPassword = form.querySelector('[name="loginPassword"]')?.value || '';

        if (!localUser || localUser.password !== loginPassword) {
          throw new Error('Backend is unavailable and no matching local account was found. Sign up first or start the backend.');
        }

        fallbackUser = localUser;
      }

      // Save session in both local helpers for compatibility.
      saveSession({
        ...payload,
        user_id: payload.user_id || fallbackUser?.user_id || null,
        name: payload.name || fallbackUser?.name || name,
        email: payload.email || fallbackUser?.email || email,
        token: payload.token || `local-token-${Date.now()}`,
      });

      if (window.EdunovaAPI) {
        window.EdunovaAPI.saveSession({
          isLoggedIn: true,
          ...payload,
          user_id: payload.user_id || fallbackUser?.user_id || null,
          name: payload.name || fallbackUser?.name || name,
          email: payload.email || fallbackUser?.email || email,
          token: payload.token || `local-token-${Date.now()}`,
          loginAt: new Date().toISOString(),
        });
      }

      // Route authenticated users to the dashboard.
      window.setTimeout(() => {
        authCard?.classList.remove('switching');
        navigateWithTransition('dashboard.html');
      }, 280);
    } catch (error) {
      if (isNetworkFailure(error)) {
        authCard?.classList.remove('switching');

        try {
          const localPassword = pane === 'signup'
            ? form.querySelector('[name="signupPassword"]')?.value || ''
            : form.querySelector('[name="loginPassword"]')?.value || '';

          if (pane === 'signup') {
            const fallbackUser = saveLocalUser({ name, email, password: localPassword });
            saveSession({
              isLoggedIn: true,
              user_id: fallbackUser.user_id,
              name: fallbackUser.name,
              email: fallbackUser.email,
              token: `local-token-${Date.now()}`,
              rememberMe,
            });
            navigateWithTransition('dashboard.html');
            return;
          }

          const localUser = findLocalUserByEmail(email);
          if (localUser && localUser.password === localPassword) {
            saveSession({
              isLoggedIn: true,
              user_id: localUser.user_id,
              name: localUser.name,
              email: localUser.email,
              token: `local-token-${Date.now()}`,
              rememberMe,
            });
            navigateWithTransition('dashboard.html');
            return;
          }

          setFormError(form, 'Backend is unavailable. Sign up once online, or start the backend server and try again.');
          return;
        } catch {
          setFormError(form, 'Backend is unavailable. Start the server and try again.');
          return;
        }
      }

      // Keep user on page and show auth error in form hints.
      authCard?.classList.remove('switching');
      setFormError(form, error.message || 'Authentication failed. Please try again.');
    }
  });
});

// Auto-redirect already authenticated users away from auth page.
const session = loadSession();
if (session?.isLoggedIn) {
  navigateWithTransition('dashboard.html');
}

// Default initial pane.
setMode('login');
