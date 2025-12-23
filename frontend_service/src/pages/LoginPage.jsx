import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext'; // <--- IMPORT
import { api } from '../api/endpoints';
import { Eye, EyeOff } from 'lucide-react';

export default function LoginPage() {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');

  const { login } = useAuth();
  const { theme } = useTheme(); // <--- GET THEME
  const navigate = useNavigate();

  // --- DYNAMIC LOGO LOGIC ---
  const logoSrc = theme === 'dark' ? '/logo2.png' : '/logo.png';

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    try {
      const { data } = await api.auth.login({ username, password });
      if (data.access_token) {
        login(data.access_token);
        navigate('/');
      } else {
        setError('Login failed: No token received');
      }
    } catch (err) {
      console.error(err);
      setError('Invalid username or password');
    }
  };

  return (
    <div
      className="min-h-screen relative overflow-hidden bg-bg-main bg-cover bg-center transition-colors duration-300"
      style={{ backgroundImage: 'var(--bg-image)' }}
    >
      {/* dark overlay */}
      <div className="absolute inset-0 bg-black/10" />

      <div className="relative flex items-center justify-center min-h-screen px-4">
        <div className="w-full max-w-md rounded-2xl border border-gray-300/20 bg-bg-main/30 backdrop-blur-md p-8 shadow-xl">
          
          {/* HEADER */}
          <div className="flex flex-col items-center mb-8">
            <img 
              src={logoSrc} 
              alt="TUCner Mifflin" 
              className="h-14 w-auto mb-1 object-contain" 
            />
            <p className="text-med text-text-muted mb-3">PMS Application</p>
            <h2 className="text-2xl font-bold text-text-main">Sign in</h2>

          </div>

          {error && (
            <div className="mb-6 rounded-lg bg-red-500/10 border border-red-500/20 p-4 text-sm text-red-500 text-center font-medium">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-5">
            <div>
              <label className="block text-xs font-bold tracking-wide text-text-muted mb-1.5">
                Username
              </label>
              <input
                type="text"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                className="w-full rounded-lg border border-gray-300/30 bg-bg-main/40 px-3 py-2.5 text-sm text-text-main placeholder:text-text-muted/70 focus:outline-none focus:ring-2 focus:ring-brand focus:border-brand transition-all"
                placeholder="Enter your username"
                required
              />
            </div>

            <div>
              <label className="block text-xs font-bold tracking-wide text-text-muted mb-1.5">
                Password
              </label>
              <div className="relative">
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full rounded-lg border border-gray-300/30 bg-bg-main/40 px-3 py-2.5 text-sm text-text-main placeholder:text-text-muted/70 focus:outline-none focus:ring-2 focus:ring-brand focus:border-brand transition-all pr-10"
                  placeholder="Enter your password"
                  required
                />
                <button
                  type="button"
                  className="absolute inset-y-0 right-0 flex items-center px-3 text-text-muted hover:text-text-main focus:outline-none"
                  onClick={() => setShowPassword(!showPassword)}
                >
                  {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                </button>
              </div>
            </div>

            <button
              type="submit"
              className="mt-2 w-full rounded-lg bg-primary px-4 py-2.5 text-sm font-semibold text-text-on-primary tracking-wide shadow-md shadow-primary/30 transition hover:bg-primary-hover focus:outline-none focus:ring-2 focus:ring-primary/80"
            >
              Log In
            </button>
          </form>

          <div className="mt-6 font-medium text-center text-xs text-text-muted">
            Don't have an account?{' '}
            <Link
              to="/signup"
              className="font-bold text-brand hover:text-primary-hover underline-offset-2 hover:underline"
            >
              Sign up
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}