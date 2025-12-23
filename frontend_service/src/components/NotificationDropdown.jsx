import { useState, useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
import { api } from '../api/endpoints';
import { Bell, Check, Info, UserPlus, MessageSquare, CheckCircle, Trash2 } from 'lucide-react'; // Added Trash2 icon

export default function NotificationDropdown() {
  const [notifications, setNotifications] = useState([]);
  const [isOpen, setIsOpen] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);
  const dropdownRef = useRef(null);

  // --- 1. FETCH NOTIFICATIONS ---
  const fetchNotifications = async () => {
    try {
      const { data } = await api.tasks.getNotifications(); 
      setNotifications(data);
      setUnreadCount(data.filter(n => !n.is_read).length);
    } catch (err) {
      console.error("Failed to fetch notifications", err);
    }
  };

  // --- 2. POLLING (Fake Real-Time) ---
  useEffect(() => {
    fetchNotifications(); 
    const interval = setInterval(fetchNotifications, 30000);
    return () => clearInterval(interval);
  }, []);

  // --- 3. CLICK OUTSIDE TO CLOSE ---
  useEffect(() => {
    function handleClickOutside(event) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [dropdownRef]);

  // --- 4. MARK AS READ HANDLER ---
  const handleMarkRead = async (noteId) => {
    try {
      await api.tasks.markNotificationRead(noteId);
      setNotifications(prev => prev.map(n => 
        n.id === noteId ? { ...n, is_read: true } : n
      ));
      setUnreadCount(prev => Math.max(0, prev - 1));
      setIsOpen(false);
    } catch (err) {
      console.error("Failed to mark read");
    }
  };

  // --- 5. NEW: CLEAR ALL HANDLER ---
  const handleClearAll = async () => {
    try {
      await api.tasks.clearNotifications(); // Call the API we made
      setNotifications([]); // Clear local list instantly
      setUnreadCount(0);
    } catch (err) {
      console.error("Failed to clear notifications", err);
    }
  };

  const getIcon = (type) => {
    switch (type) {
      case 'TASK_ASSIGNED': return <Info className="w-4 h-4 text-blue-500" />;
      case 'TASK_STATUS_CHANGED': return <CheckCircle className="w-4 h-4 text-green-500" />;
      case 'NEW_COMMENT': return <MessageSquare className="w-4 h-4 text-purple-500" />;
      case 'TEAM_ADD': return <UserPlus className="w-4 h-4 text-orange-500" />;
      default: return <Bell className="w-4 h-4 text-gray-500" />;
    }
  };

  return (
    <div className="relative" ref={dropdownRef}>
      
      <button 
        onClick={() => setIsOpen(!isOpen)}
        className="relative p-2 rounded-full hover:bg-white/10 transition text-text-on-primary"
      >
        <Bell className="w-5 h-5" />
        {unreadCount > 0 && (
          <span className="absolute top-1 right-1 h-2.5 w-2.5 bg-red-500 rounded-full border-2 border-primary animate-pulse"></span>
        )}
      </button>

      {isOpen && (
        <div className="absolute right-0 mt-2 w-80 bg-white rounded-lg shadow-xl overflow-hidden z-50 border border-gray-200 animate-in fade-in slide-in-from-top-2 duration-200">
          
          {/* HEADER */}
          <div className="p-3 border-b border-gray-100 bg-gray-50 flex justify-between items-center">
            <div className="flex items-center gap-2">
                <h3 className="text-sm font-bold text-gray-700">Notifications</h3>
                <span className="text-xs text-gray-500">({unreadCount} unread)</span>
            </div>

            {/* NEW CLEAR ALL BUTTON */}
            {notifications.length > 0 && (
                <button 
                    onClick={handleClearAll}
                    className="text-[10px] flex items-center text-red-500 hover:text-red-700 hover:bg-red-50 px-2 py-1 rounded transition"
                >
                    <Trash2 className="w-3 h-3 mr-1" /> Clear all
                </button>
            )}
          </div>

          {/* LIST */}
          <div className="max-h-80 overflow-y-auto">
            {notifications.length > 0 ? (
              notifications.map(note => (
                <Link 
                  key={note.id}
                  to={note.link}
                  onClick={() => handleMarkRead(note.id)}
                  className={`block p-3 hover:bg-gray-50 border-b border-gray-50 transition-colors
                    ${!note.is_read ? 'bg-blue-50/50' : 'bg-white'}
                  `}
                >
                  <div className="flex items-start gap-3">
                    <div className="mt-1 flex-shrink-0">
                        {getIcon(note.type)}
                    </div>
                    <div>
                        <p className={`text-sm ${!note.is_read ? 'font-bold text-gray-900' : 'text-gray-600'}`}>
                            {note.title}
                        </p>
                        <p className="text-xs text-gray-500 mt-0.5 line-clamp-2">
                            {note.message}
                        </p>
                        <p className="text-[10px] text-gray-400 mt-1">
                            {new Date(note.created_at).toLocaleString()}
                        </p>
                    </div>
                  </div>
                </Link>
              ))
            ) : (
              <div className="p-8 text-center text-gray-400 text-sm">
                No notifications yet.
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}