import { Link, Outlet, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import { Moon, Sun } from 'lucide-react';
import NotificationDropdown from './NotificationDropdown';
import { ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';

const NavLink = ({ to, children }) => {
  const location = useLocation();
  const isActive = location.pathname === to;
  return (
    <Link 
      to={to} 
      className={`relative group px-3 py-2 text-sm font-medium transition-colors duration-300
        ${isActive ? 'text-brand' : 'text-text-on-primary hover:text-brand'}
      `}
    >
      {children}
      <span className={`absolute left-0 bottom-0 h-0.5 bg-brand transition-all duration-300 ease-out
        ${isActive ? 'w-full' : 'w-0 group-hover:w-full'}
      `} />
    </Link>
  );
};

export default function Layout() {
  const { user, logout, isAdmin } = useAuth();
  const { theme, setTheme } = useTheme();
  
  const toggleTheme = () => {
    setTheme(theme === 'dark' ? 'default' : 'dark');
  };

  const isDark = theme === 'dark';

  return (
    <div 
      className="min-h-screen bg-bg-main transition-colors duration-300 font-sans text-text-main bg-cover bg-center bg-no-repeat bg-fixed"
      style={{ backgroundImage: 'var(--bg-image)' }}
    >
      
      <ToastContainer 
        position="top-right"
        autoClose={3000}
        theme={isDark ? 'dark' : 'colored'}
      />

      <nav className="bg-primary/90 backdrop-blur-md text-text-on-primary shadow-lg transition-colors duration-300 sticky top-0 z-50 border-b border-white/10">
        <div className="max-w-7xl mx-auto px-4">
          <div className="flex justify-between items-center h-16">
            
            {/* Left Side */}
            <div className="flex items-center space-x-8">
              <Link to="/" className="flex-shrink-0 flex items-center group select-none">
                {/* --- PERMANENT WHITE LOGO (logo2.png) --- */}
                <img 
                  src="/logo2.png" 
                  alt="TUCner Mifflin" 
                  className="h-10 w-auto object-contain transition-transform group-hover:scale-105 pointer-events-none filter drop-shadow-sm"
                  onError={(e) => {
                    e.target.style.display = 'none';
                    e.target.nextSibling.style.display = 'block';
                  }}
                />
                <span className="text-xl font-bold text-brand tracking-wide hidden ml-2">
                  TUCner Mifflin
                </span>
              </Link>

              <div className="hidden md:flex space-x-2">
                {!isAdmin && (
                  <>
                    <NavLink to="/">Dashboard</NavLink>
                    <NavLink to="/teams">My Teams</NavLink>
                    <NavLink to="/my-tasks">My Tasks</NavLink>
                  </>
                )}
                {isAdmin && (
                  <>
                    <NavLink to="/admin/users">Manage Users</NavLink>
                    <NavLink to="/admin/teams">Manage Teams</NavLink>
                  </>
                )}
              </div>
            </div>

            {/* Right Side */}
            <div className="flex items-center space-x-6">
              <NotificationDropdown />
              
              {/* --- THEME SWITCH --- */}
              <button
                onClick={toggleTheme}
                className={`relative inline-flex h-7 w-14 items-center rounded-full transition-colors duration-300 focus:outline-none shadow-inner border border-white/10
                  ${isDark ? 'bg-slate-700' : 'bg-orange-200'}
                `}
                title="Toggle Theme"
              >
                <span className="sr-only">Toggle Dark Mode</span>
                <span
                  className={`inline-block h-5 w-5 transform rounded-full bg-white shadow-md ring-0 transition duration-300 ease-in-out flex items-center justify-center
                    ${isDark ? 'translate-x-8' : 'translate-x-1'}
                  `}
                >
                  {isDark ? (
                    <Moon className="h-3 w-3 text-slate-800" />
                  ) : (
                    <Sun className="h-3 w-3 text-orange-600" />
                  )}
                </span>
              </button>

              <div className="flex items-center space-x-4 border-l border-white/20 pl-6">
                <Link 
                    to="/profile" 
                    className="flex items-center space-x-2 hover:bg-white/10 px-3 py-2 rounded-md transition border border-transparent hover:border-white/5"
                >
                    <div className="text-sm font-medium text-text-on-primary">
                    {user?.username}
                    </div>
                    <span className={`text-xs px-2 py-0.5 rounded capitalize border shadow-sm
                        ${isAdmin ? 'bg-red-900/80 text-red-100 border-red-500' : 'bg-blue-900/80 text-blue-100 border-blue-500'}`}>
                        {user?.role?.replace('_', ' ')}
                    </span>
                </Link>

                <button 
                    onClick={logout}
                    className="bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-md text-sm font-bold transition shadow-md hover:shadow-lg transform hover:-translate-y-0.5"
                >
                    Logout
                </button>
              </div>

            </div>
          </div>
        </div>
      </nav>

      <main className="max-w-7xl mx-auto py-8 sm:px-6 lg:px-8 animate-in fade-in duration-500">
        <Outlet />
      </main>
    </div>
  );
}