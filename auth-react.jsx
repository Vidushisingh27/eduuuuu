const ReactRef = window.React;
const ReactDOMRef = window.ReactDOM;

if (!ReactRef || !ReactDOMRef) {
  const rootEl = document.getElementById('root');
  if (rootEl) {
    rootEl.innerHTML =
      '<div style="min-height:100vh;display:grid;place-items:center;padding:24px;color:#e8f5ff;background:#070b1d;font-family:Arial,sans-serif;">Unable to load UI libraries. Check your internet connection and refresh.</div>';
  }
  throw new Error('React or ReactDOM failed to load.');
}

const { useEffect, useMemo, useState } = ReactRef;
const { createRoot } = ReactDOMRef;

const motionNamespace = window.framerMotion || window.Motion || {};
const motion = motionNamespace.motion || {
  div: 'div',
  span: 'span',
  article: 'article',
};
const AnimatePresence = motionNamespace.AnimatePresence || ReactRef.Fragment;

const NAV_ROUTES = ['Dashboard', 'Courses Page', 'Profile Page', 'Admin Panel'];

function Toasts({ toasts }) {
  return (
    <div className="toast-stack">
      <AnimatePresence>
        {toasts.map((toast) => (
          <motion.div
            key={toast.id}
            initial={{ opacity: 0, y: -20, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -12, scale: 0.95 }}
            className="toast-item"
          >
            <p className="text-sm font-semibold">{toast.title}</p>
            <p className="text-xs opacity-80 mt-1">{toast.message}</p>
          </motion.div>
        ))}
      </AnimatePresence>
    </div>
  );
}

function BackgroundFX({ theme }) {
  const particles = useMemo(
    () =>
      Array.from({ length: 36 }, (_, i) => ({
        id: i,
        left: `${Math.random() * 100}%`,
        delay: `${Math.random() * 10}s`,
        duration: `${9 + Math.random() * 8}s`,
      })),
    []
  );

  return (
    <>
      <div className="float-layer">
        <div className="float-item p-3 text-xs md:text-sm left-[9%] top-[18%] w-36">
          <p className="opacity-80">3D BOOK STACK</p>
          <p className="text-[10px] opacity-60 mt-1">Interactive Notes</p>
        </div>
        <div className="float-item p-3 text-xs md:text-sm left-[27%] top-[55%] w-40" style={{ animationDelay: '1.2s' }}>
          <p className="opacity-80">GRAD CAP</p>
          <p className="text-[10px] opacity-60 mt-1">Achievement Track</p>
        </div>
        <div className="float-item p-3 text-xs md:text-sm left-[42%] top-[24%] w-44" style={{ animationDelay: '2.5s' }}>
          <p className="opacity-80">HOLO UI CARD</p>
          <p className="text-[10px] opacity-60 mt-1">Weekly Goal +28%</p>
        </div>
      </div>

      {particles.map((particle) => (
        <span
          key={particle.id}
          className="particle"
          style={{
            left: particle.left,
            ['--delay']: particle.delay,
            ['--d']: particle.duration,
            opacity: theme === 'light' ? 0.22 : 0.34,
          }}
        />
      ))}
    </>
  );
}

function FloatingInput({
  id,
  type,
  label,
  value,
  onChange,
  showToggle,
  onToggle,
  error,
  success,
}) {
  const cls = `field-wrap ${error ? 'error' : ''} ${success ? 'success' : ''}`;

  return (
    <div className="space-y-1">
      <div className={cls}>
        <input
          id={id}
          type={type}
          value={value}
          onChange={(event) => onChange(event.target.value)}
          placeholder=" "
          autoComplete="off"
        />
        <label htmlFor={id}>{label}</label>
        {showToggle && (
          <button
            type="button"
            onClick={onToggle}
            className="password-toggle text-xs"
            aria-label="Toggle password visibility"
          >
            {type === 'password' ? 'SHOW' : 'HIDE'}
          </button>
        )}
      </div>
      <p className={`text-[11px] min-h-4 ${error ? 'text-rose-400' : 'opacity-70'}`}>{error || ' '}</p>
    </div>
  );
}

function AuthCard({ onLoginSuccess, onSignupDone, addToast }) {
  const [mode, setMode] = useState('login');
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [remember, setRemember] = useState(true);
  const [form, setForm] = useState({
    loginEmail: '',
    loginPassword: '',
    signupName: '',
    signupEmail: '',
    signupPassword: '',
    confirmPassword: '',
  });
  const [errors, setErrors] = useState({});

  const validate = () => {
    const next = {};

    if (mode === 'login') {
      if (!form.loginEmail.trim()) {
        next.loginEmail = 'Email or username is required.';
      }
      if (form.loginPassword.trim().length < 6) {
        next.loginPassword = 'Password must have at least 6 characters.';
      }
    }

    if (mode === 'signup') {
      if (form.signupName.trim().length < 2) {
        next.signupName = 'Enter your full name.';
      }
      if (!/^\S+@\S+\.\S+$/.test(form.signupEmail.trim())) {
        next.signupEmail = 'Enter a valid email address.';
      }
      if (form.signupPassword.trim().length < 8) {
        next.signupPassword = 'Use at least 8 characters.';
      }
      if (form.confirmPassword !== form.signupPassword) {
        next.confirmPassword = 'Passwords do not match.';
      }
    }

    setErrors(next);
    return Object.keys(next).length === 0;
  };

  const setValue = (key, value) => {
    setForm((prev) => ({ ...prev, [key]: value }));
    setErrors((prev) => ({ ...prev, [key]: '' }));
  };

  const saveSessionPayload = (payload) => {
    const session = {
      isLoggedIn: true,
      user_id: payload.user_id || null,
      name: payload.name || 'Learner',
      email: payload.email || '',
      token: payload.token || null,
      rememberMe: payload.rememberMe || false,
      loginAt: new Date().toISOString(),
    };

    try {
      if (window.EdunovaAPI?.saveSession) {
        window.EdunovaAPI.saveSession(session);
      } else {
        localStorage.setItem('edunova-auth-session', JSON.stringify(session));
      }
    } catch {
      // Ignore storage failures and continue.
    }
  };

  const handleSubmit = async (event) => {
    event.preventDefault();

    if (!validate()) {
      addToast('Validation Error', 'Please fix highlighted fields before continuing.');
      return;
    }

    setLoading(true);

    const loginEmail = form.loginEmail.trim();
    const loginPassword = form.loginPassword.trim();
    const signupName = form.signupName.trim();
    const signupEmail = form.signupEmail.trim();
    const signupPassword = form.signupPassword.trim();
    const displayName = loginEmail.includes('@') ? loginEmail.split('@')[0] : loginEmail || 'Learner';

    try {
      if (mode === 'login') {
        if (window.EdunovaAPI) {
          const response = await window.EdunovaAPI.login({
            email: loginEmail,
            password: loginPassword,
          });

          const user = response?.data?.user || {};
          const token = response?.data?.token || null;
          const payload = {
            user_id: user.user_id || null,
            name: user.name || displayName,
            email: user.email || loginEmail,
            token,
            rememberMe: remember,
          };

          saveSessionPayload(payload);
          addToast('Login Successful', 'Opening dashboard...');
          onLoginSuccess({ name: payload.name });
          return;
        }

        const localUsers = JSON.parse(localStorage.getItem('edunova-local-users') || '[]');
        const localUser = localUsers.find((user) => user.email === loginEmail.toLowerCase());

        if (!localUser || localUser.password !== loginPassword) {
          throw new Error('Invalid login credentials. Please check your email and password.');
        }

        saveSessionPayload({
          user_id: localUser.user_id,
          name: localUser.name,
          email: localUser.email,
          rememberMe: remember,
        });

        addToast('Login Successful', 'Opening dashboard...');
        onLoginSuccess({ name: localUser.name });
        return;
      }

      if (window.EdunovaAPI) {
        await window.EdunovaAPI.register({
          name: signupName,
          email: signupEmail,
          password: signupPassword,
        });

        addToast('Account Created', 'Please sign in with your new account.');
        setMode('login');
        setForm((prev) => ({
          ...prev,
          loginEmail: signupEmail,
          loginPassword: '',
          signupPassword: '',
          confirmPassword: '',
        }));
        return;
      }

      const savedUsers = JSON.parse(localStorage.getItem('edunova-local-users') || '[]');
      const existing = savedUsers.find((user) => user.email === signupEmail.toLowerCase());

      if (existing) {
        throw new Error('An account already exists for this email.');
      }

      const newUser = {
        user_id: Date.now(),
        name: signupName,
        email: signupEmail.toLowerCase(),
        password: signupPassword,
      };

      localStorage.setItem('edunova-local-users', JSON.stringify([...savedUsers, newUser]));
      addToast('Account Created', 'You are all set. Please sign in.');
      setMode('login');
      setForm((prev) => ({
        ...prev,
        loginEmail: signupEmail,
        loginPassword: '',
        signupPassword: '',
        confirmPassword: '',
      }));
    } catch (error) {
      const message = error?.message || 'Unable to complete authentication.';
      addToast('Authentication Error', message);
      setErrors((prev) => ({
        ...prev,
        ...(mode === 'login'
          ? { loginEmail: message, loginPassword: message }
          : { signupEmail: message }),
      }));
    } finally {
      setLoading(false);
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.92, y: 28 }}
      animate={{ opacity: 1, scale: 1, y: 0 }}
      transition={{ duration: 0.65, ease: 'easeOut' }}
      className="glass rounded-3xl p-6 md:p-8 w-full max-w-md"
    >
      <div className="relative rounded-2xl p-1 neon-pill grid grid-cols-2 mb-6">
        <motion.span
          layout
          transition={{ type: 'spring', stiffness: 360, damping: 30 }}
          className="absolute top-1 bottom-1 w-[calc(50%-4px)] rounded-xl bg-gradient-to-r from-cyan-500/60 to-violet-500/60"
          style={{ left: mode === 'login' ? '4px' : 'calc(50% + 0px)' }}
        />
        <button
          type="button"
          className="relative z-10 py-2 text-sm font-semibold"
          onClick={() => setMode('login')}
        >
          Sign In
        </button>
        <button
          type="button"
          className="relative z-10 py-2 text-sm font-semibold"
          onClick={() => setMode('signup')}
        >
          Signup
        </button>
      </div>

      <form onSubmit={handleSubmit} className="space-y-3">
        <AnimatePresence mode="wait">
          {mode === 'signup' && (
            <motion.div
              key="signup-name"
              initial={{ opacity: 0, y: -8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -6 }}
            >
              <FloatingInput
                id="signup-name"
                type="text"
                label="Full Name"
                value={form.signupName}
                onChange={(value) => setValue('signupName', value)}
                error={errors.signupName}
                success={mode === 'signup' && form.signupName.length > 1 && !errors.signupName}
              />
            </motion.div>
          )}
        </AnimatePresence>

        {mode === 'login' ? (
          <FloatingInput
            id="login-email"
            type="text"
            label="Email or Username"
            value={form.loginEmail}
            onChange={(value) => setValue('loginEmail', value)}
            error={errors.loginEmail}
            success={form.loginEmail.length > 2 && !errors.loginEmail}
          />
        ) : (
          <FloatingInput
            id="signup-email"
            type="email"
            label="Email"
            value={form.signupEmail}
            onChange={(value) => setValue('signupEmail', value)}
            error={errors.signupEmail}
            success={/^\S+@\S+\.\S+$/.test(form.signupEmail) && !errors.signupEmail}
          />
        )}

        {mode === 'login' ? (
          <FloatingInput
            id="login-password"
            type={showPassword ? 'text' : 'password'}
            label="Password"
            value={form.loginPassword}
            onChange={(value) => setValue('loginPassword', value)}
            showToggle
            onToggle={() => setShowPassword((prev) => !prev)}
            error={errors.loginPassword}
            success={form.loginPassword.length >= 6 && !errors.loginPassword}
          />
        ) : (
          <>
            <FloatingInput
              id="signup-password"
              type={showPassword ? 'text' : 'password'}
              label="Password"
              value={form.signupPassword}
              onChange={(value) => setValue('signupPassword', value)}
              showToggle
              onToggle={() => setShowPassword((prev) => !prev)}
              error={errors.signupPassword}
              success={form.signupPassword.length >= 8 && !errors.signupPassword}
            />
            <FloatingInput
              id="confirm-password"
              type={showConfirmPassword ? 'text' : 'password'}
              label="Confirm Password"
              value={form.confirmPassword}
              onChange={(value) => setValue('confirmPassword', value)}
              showToggle
              onToggle={() => setShowConfirmPassword((prev) => !prev)}
              error={errors.confirmPassword}
              success={
                form.confirmPassword.length > 0 &&
                form.confirmPassword === form.signupPassword &&
                !errors.confirmPassword
              }
            />
          </>
        )}

        <div className="flex items-center justify-between text-xs text-slate-300/90">
          <label className="inline-flex items-center gap-2 cursor-pointer">
            <input
              type="checkbox"
              checked={remember}
              onChange={() => setRemember((prev) => !prev)}
              className="accent-cyan-500"
            />
            Remember me
          </label>
          <button
            type="button"
            className="hover:text-cyan-300 transition-colors"
            onClick={() => addToast('Password Reset', 'Password reset flow can be wired to backend endpoint.')}
          >
            Forgot password?
          </button>
        </div>

        <button
          type="submit"
          className="submit-btn w-full rounded-xl bg-gradient-to-r from-cyan-500 via-blue-500 to-violet-500 py-3 font-semibold tracking-wide hover:shadow-glow transition-all"
        >
          <span className="inline-flex items-center justify-center gap-2">
            {loading ? <span className="spinner" /> : null}
            {loading ? 'Please wait...' : mode === 'login' ? 'Sign In' : 'Create Account'}
          </span>
        </button>
      </form>

      <div className="relative my-5">
        <div className="h-px bg-slate-300/20" />
        <span className="absolute inset-0 text-center text-[11px] text-slate-300/80 -top-2">or continue with</span>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <button
          type="button"
          className="rounded-xl border border-slate-200/20 bg-slate-900/30 py-2.5 text-sm font-semibold hover:border-cyan-300/60 hover:-translate-y-[1px] transition-all"
          onClick={() => addToast('Google Login', 'Google OAuth callback placeholder added.')}
        >
          Google
        </button>
        <button
          type="button"
          className="rounded-xl border border-slate-200/20 bg-slate-900/30 py-2.5 text-sm font-semibold hover:border-cyan-300/60 hover:-translate-y-[1px] transition-all"
          onClick={() => addToast('Apple Login', 'Apple OAuth callback placeholder added.')}
        >
          Apple
        </button>
      </div>
    </motion.div>
  );
}

function AuthenticatedArea({ user, route, onRoute, onLogout, theme, setTheme }) {
  return (
    <div className="w-full">
      <header className="fixed top-0 left-0 right-0 z-30 border-b border-slate-300/15 bg-slate-900/40 backdrop-blur-md">
        <div className="max-w-6xl mx-auto px-4 py-3 flex items-center justify-between">
          <div className="brand-font text-sm md:text-base tracking-[0.2em]">EDUNOVA</div>
          <nav className="flex items-center gap-2 md:gap-3 text-xs md:text-sm">
            {NAV_ROUTES.map((item) => (
              <button
                key={item}
                onClick={() => onRoute(item)}
                className={`px-3 py-1.5 rounded-full transition-all ${
                  item === route ? 'bg-cyan-500/30 border border-cyan-300/60' : 'hover:bg-slate-200/10 border border-transparent'
                }`}
              >
                {item}
              </button>
            ))}
          </nav>
          <div className="flex items-center gap-2">
            <button
              className="px-3 py-1.5 rounded-full text-xs border border-slate-200/20"
              onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
            >
              {theme === 'dark' ? 'Light' : 'Dark'}
            </button>
            <button
              className="px-3 py-1.5 rounded-full text-xs border border-slate-200/20 hover:border-rose-300/60"
              onClick={onLogout}
            >
              Logout
            </button>
          </div>
        </div>
      </header>

      <main className="pt-24 px-4 pb-10">
        <div className="max-w-6xl mx-auto glass rounded-3xl p-6 md:p-8">
          <p className="text-xs uppercase tracking-[0.25em] text-cyan-300">Authenticated Session</p>
          <h2 className="brand-font text-2xl md:text-3xl mt-2">Welcome back, {user}</h2>
          <p className="text-sm opacity-80 mt-2">
            Route placeholder: <span className="font-semibold text-cyan-200">{route}</span>
          </p>

          <div className="mt-6 grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4">
            {NAV_ROUTES.map((item, index) => (
              <motion.article
                key={item}
                initial={{ opacity: 0, y: 16 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.08 }}
                className="rounded-2xl border border-slate-200/20 bg-slate-950/35 p-4"
              >
                <p className="text-[11px] uppercase tracking-[0.2em] text-slate-300/80">Module</p>
                <h3 className="font-semibold mt-2">{item}</h3>
                <p className="text-xs opacity-70 mt-2">Placeholder content for protected route integration.</p>
              </motion.article>
            ))}
          </div>

          <div className="mt-7 flex flex-wrap gap-3">
            <a
              href="dashboard.html"
              className="rounded-xl bg-gradient-to-r from-cyan-500 to-violet-500 px-5 py-2.5 font-semibold text-sm hover:shadow-glow transition-all"
            >
              Open Main Dashboard
            </a>
            <button className="rounded-xl border border-slate-200/20 px-5 py-2.5 text-sm">Sync Routes</button>
          </div>
        </div>
      </main>
    </div>
  );
}

function App() {
  const [theme, setTheme] = useState('dark');
  const [toasts, setToasts] = useState([]);
  const [authenticated, setAuthenticated] = useState(false);
  const [userName, setUserName] = useState('Learner');
  const [route, setRoute] = useState('Dashboard');
  const [onboarding, setOnboarding] = useState(false);

  useEffect(() => {
    document.body.classList.toggle('theme-light', theme === 'light');
  }, [theme]);

  useEffect(() => {
    const timer = window.setInterval(() => {
      setToasts((prev) => prev.filter((toast) => Date.now() - toast.id < 3200));
    }, 500);
    return () => window.clearInterval(timer);
  }, []);

  useEffect(() => {
    const listener = (event) => {
      const x = event.clientX / window.innerWidth;
      const y = event.clientY / window.innerHeight;
      document.documentElement.style.setProperty('--mx', x.toFixed(3));
      document.documentElement.style.setProperty('--my', y.toFixed(3));
    };

    window.addEventListener('mousemove', listener);
    return () => window.removeEventListener('mousemove', listener);
  }, []);

  const addToast = (title, message) => {
    setToasts((prev) => [...prev, { id: Date.now() + Math.random(), title, message }]);
  };

  const handleSignupDone = () => {
    setOnboarding(true);
    window.setTimeout(() => {
      setOnboarding(false);
      addToast('Onboarding Complete', 'Your learning profile was initialized.');
    }, 2300);
  };

  const handleLoginSuccess = ({ name }) => {
    setUserName(name || 'Learner');
    setAuthenticated(true);
    setRoute('Dashboard');

    window.location.href = 'dashboard.html';
  };

  const handleLogout = () => {
    setAuthenticated(false);
    setRoute('Dashboard');
    addToast('Logged Out', 'You have returned to the auth experience.');
  };

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.97 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.6 }}
      className="auth-shell"
    >
      <BackgroundFX theme={theme} />
      <Toasts toasts={toasts} />

      <AnimatePresence>
        {onboarding && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 bg-slate-950/75 backdrop-blur-sm flex items-center justify-center px-4"
          >
            <motion.div
              initial={{ y: 16, scale: 0.92 }}
              animate={{ y: 0, scale: 1 }}
              className="glass rounded-3xl px-8 py-9 text-center w-full max-w-lg"
            >
              <p className="text-xs tracking-[0.28em] text-cyan-300 uppercase">Welcome to EduNova</p>
              <h2 className="brand-font text-2xl md:text-3xl mt-3">Preparing Your Learning Universe</h2>
              <p className="text-sm opacity-80 mt-2">Course map, goals, and profile preferences are being configured.</p>
              <div className="mt-6 mx-auto spinner" />
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {authenticated ? (
        <AuthenticatedArea
          user={userName}
          route={route}
          onRoute={setRoute}
          onLogout={handleLogout}
          theme={theme}
          setTheme={setTheme}
        />
      ) : (
        <section className="split-layout min-h-screen grid grid-cols-[1.1fr_0.9fr]">
          <div className="hero-zone p-6 sm:p-8 md:p-10 lg:p-14 relative flex items-center">
            <div className="max-w-xl">
              <span className="inline-flex items-center gap-2 rounded-full border border-cyan-300/40 bg-cyan-500/10 px-3 py-1 text-[11px] uppercase tracking-[0.2em]">
                Premium Learning Portal
              </span>
              <h1 className="brand-font text-4xl sm:text-5xl md:text-6xl mt-5 leading-tight">
                EDU<span className="text-cyan-300">NOVA</span>
              </h1>
              <p className="text-lg sm:text-xl md:text-2xl mt-4 font-medium">Learn Smarter. Grow Faster.</p>
              <p className="text-sm sm:text-base opacity-80 mt-3 max-w-lg">
                Streamlined education management with cinematic visuals, modular workflows, and a futuristic learner-first experience.
              </p>

              <div className="mt-7 grid grid-cols-2 gap-3 max-w-md text-xs">
                <div className="glass rounded-xl p-3">
                  <p className="text-cyan-200 font-semibold">+340%</p>
                  <p className="opacity-75 mt-1">Course engagement</p>
                </div>
                <div className="glass rounded-xl p-3">
                  <p className="text-cyan-200 font-semibold">24/7</p>
                  <p className="opacity-75 mt-1">Adaptive access</p>
                </div>
              </div>
            </div>

            <button
              className="absolute top-5 right-5 px-3 py-1.5 rounded-full text-xs border border-slate-200/20 bg-slate-900/30 hover:border-cyan-300/70"
              onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
            >
              {theme === 'dark' ? 'Light Mode' : 'Dark Mode'}
            </button>
          </div>

          <div className="p-6 sm:p-8 md:p-10 lg:p-14 flex items-center justify-center">
            <AuthCard onLoginSuccess={handleLoginSuccess} onSignupDone={handleSignupDone} addToast={addToast} />
          </div>
        </section>
      )}
    </motion.div>
  );
}

createRoot(document.getElementById('root')).render(<App />);
