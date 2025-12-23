import { createContext, useContext, useState, useEffect } from 'react';
import { X, CheckCircle, AlertCircle, Info } from 'lucide-react';

const FlashContext = createContext();

export const FlashProvider = ({ children }) => {
  const [notification, setNotification] = useState(null); // { message, type }

  // The function you will call from your pages
  const flash = (message, type = 'success') => {
    setNotification({ message, type });
    
    // Auto-hide after 3 seconds
    setTimeout(() => {
      setNotification(null);
    }, 3000);
  };

  return (
    <FlashContext.Provider value={{ flash }}>
      {children}
      
      {/* --- THE POP-UP UI --- */}
      {notification && (
        <div className="fixed top-24 left-1/2 transform -translate-x-1/2 z-[100] animate-in fade-in slide-in-from-top-5 duration-300">
          <div className={`flex items-center px-6 py-4 rounded-lg shadow-2xl border-l-4 min-w-[300px] max-w-md
            ${notification.type === 'success' ? 'bg-white border-green-500 text-gray-800' : ''}
            ${notification.type === 'error' ? 'bg-white border-red-500 text-gray-800' : ''}
            ${notification.type === 'info' ? 'bg-white border-blue-500 text-gray-800' : ''}
          `}>
            {/* Icon based on type */}
            <div className="mr-3">
                {notification.type === 'success' && <CheckCircle className="w-6 h-6 text-green-500" />}
                {notification.type === 'error' && <AlertCircle className="w-6 h-6 text-red-500" />}
                {notification.type === 'info' && <Info className="w-6 h-6 text-blue-500" />}
            </div>

            <div className="flex-1 font-medium text-sm">
                {notification.message}
            </div>

            <button 
                onClick={() => setNotification(null)} 
                className="ml-4 text-gray-400 hover:text-gray-600"
            >
                <X className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}
    </FlashContext.Provider>
  );
};

export const useFlash = () => useContext(FlashContext);