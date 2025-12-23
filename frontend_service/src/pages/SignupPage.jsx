import { useState } from 'react';
import { Link } from 'react-router-dom';
import { api } from '../api/endpoints';
import { useTheme } from '../context/ThemeContext'; // <--- IMPORT

export default function SignupPage() {
  const { theme } = useTheme(); // <--- GET THEME
  
  const [formData, setFormData] = useState({
    username: '',
    email: '',
    password: '',
    first_name: '',
    last_name: '',
  });
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  const [loading, setLoading] = useState(false);

  // --- DYNAMIC LOGO LOGIC ---
  const logoSrc = theme === 'dark' ? '/logo2.png' : '/logo.png';

  const handleChange = (e) => {
    setFormData((prev) => ({
      ...prev,
      [e.target.name]: e.target.value,
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    const usernameRegex = /^[a-zA-Z0-9]+$/;
    if (!usernameRegex.test(formData.username)) {
      setError('Username allows only Latin letters (a-z) and numbers (0-9). No special characters or spaces.');
      return;
    }

    setLoading(true);

    try {
      await api.auth.signup(formData);
      setSuccess(true);
    } catch (err) {
      console.error(err);
      let errorMessage = 'Registration failed. Please try again.';
      if (err.response?.data?.detail) {
        const detail = err.response.data.detail;
        if (typeof detail === 'string') {
          errorMessage = detail;
        } else if (Array.isArray(detail)) {
          errorMessage = detail.map((e) => `${e.loc[1]}: ${e.msg}`).join(', ');
        }
      }
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  if (success) {
    return (
      <div
        className="min-h-screen flex items-center justify-center bg-bg-main bg-cover bg-center transition-colors duration-300"
        style={{ backgroundImage: 'var(--bg-image)' }}
      >
        {/* dark overlay */}
        <div className="absolute inset-0 bg-black/20" />

        <div className="relative w-full max-w-md rounded-2xl border border-gray-300/20 bg-bg-main/40 backdrop-blur-md p-8 shadow-xl text-center">
          
          {/* Logo in Success Screen */}
          <img 
            src={logoSrc} 
            alt="Logo" 
            className="h-12 mx-auto mb-4 object-contain" 
          />
          
          <div className="mb-4 text-green-500">
            <svg className="w-16 h-16 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"></path>
            </svg>
          </div>
          <h2 className="text-2xl font-bold mb-2 text-text-main">Registration Successful!</h2>
          <p className="text-text-muted mb-6">
            Your account has been created but is currently <strong>inactive</strong>.
            <br />
            It must be enabled by an administrator before you can log in.
          </p>
          <Link
            to="/login"
            className="inline-block rounded-lg bg-primary px-6 py-2.5 text-sm font-semibold text-text-on-primary shadow-md transition hover:bg-primary-hover focus:outline-none focus:ring-2 focus:ring-primary/80"
          >
            Back to Login
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div
      className="min-h-screen relative overflow-hidden bg-bg-main bg-cover bg-center transition-colors duration-300"
      style={{ backgroundImage: 'var(--bg-image)' }}
    >
      {/* dark overlay */}
      <div className="absolute inset-0 bg-black/10" />

      <div className="relative flex items-center justify-center min-h-screen px-4">
        <div className="w-full max-w-md rounded-2xl border border-gray-300/20 bg-bg-main/30 backdrop-blur-md p-8 shadow-xl">
          
          <div className="flex flex-col items-center mb-6">
            <img 
                src={logoSrc} 
                alt="TUCner Mifflin Logo" 
                className="h-16 w-auto mb-1 object-contain"
            />
            <p className="text-med text-text-muted mb-3">PMS Application</p>
            <h2 className="text-2xl font-bold text-text-main">Create Account</h2>
          </div>

          {error && (
            <div className="mb-6 rounded-lg bg-red-500/10 border border-red-500/20 p-4 text-sm text-red-500 text-center font-medium">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold tracking-wide text-text-muted mb-1.5">
                  First Name
                </label>
                <input
                  name="first_name"
                  type="text"
                  required
                  onChange={handleChange}
                  className="w-full rounded-lg border border-gray-300/30 bg-bg-main/40 px-3 py-2.5 text-sm text-text-main placeholder:text-text-muted/60 focus:outline-none focus:ring-2 focus:ring-brand focus:border-brand transition-all"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold tracking-wide text-text-muted mb-1.5">
                  Last Name
                </label>
                <input
                  name="last_name"
                  type="text"
                  required
                  onChange={handleChange}
                  className="w-full rounded-lg border border-gray-300/30 bg-bg-main/40 px-3 py-2.5 text-sm text-text-main placeholder:text-text-muted/60 focus:outline-none focus:ring-2 focus:ring-brand focus:border-brand transition-all"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold tracking-wide text-text-muted mb-1.5">
                Username
              </label>
              <input
                name="username"
                type="text"
                required
                onChange={handleChange}
                className="w-full rounded-lg border border-gray-300/30 bg-bg-main/40 px-3 py-2.5 text-sm text-text-main placeholder:text-text-muted/60 focus:outline-none focus:ring-2 focus:ring-brand focus:border-brand transition-all"
                placeholder="a-z, 0-9 only"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold tracking-wide text-text-muted mb-1.5">
                Email
              </label>
              <input
                name="email"
                type="email"
                required
                onChange={handleChange}
                className="w-full rounded-lg border border-gray-300/30 bg-bg-main/40 px-3 py-2.5 text-sm text-text-main placeholder:text-text-muted/60 focus:outline-none focus:ring-2 focus:ring-brand focus:border-brand transition-all"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold tracking-wide text-text-muted mb-1.5">
                Password
              </label>
              <input
                name="password"
                type="password"
                required
                onChange={handleChange}
                className="w-full rounded-lg border border-gray-300/30 bg-bg-main/40 px-3 py-2.5 text-sm text-text-main placeholder:text-text-muted/60 focus:outline-none focus:ring-2 focus:ring-brand focus:border-brand transition-all"
                placeholder=">3 characters"
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="mt-2 w-full rounded-lg bg-primary px-4 py-2.5 text-sm font-semibold text-text-on-primary tracking-wide shadow-md shadow-primary/30 transition hover:bg-primary-hover disabled:opacity-50 disabled:cursor-not-allowed focus:outline-none focus:ring-2 focus:ring-primary/80"
            >
              {loading ? 'Signing up…' : 'Sign Up'}
            </button>
          </form>

          <div className="mt-6 text-center text-xs text-text-muted">
            Already have an account?{' '}
            <Link
              to="/login"
              className="font-medium text-brand hover:text-primary-hover underline-offset-2 hover:underline"
            >
              Log in
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}