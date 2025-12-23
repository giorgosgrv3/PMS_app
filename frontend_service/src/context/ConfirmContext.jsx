import { createContext, useContext, useState } from 'react';
import { AlertTriangle, X } from 'lucide-react';

const ConfirmContext = createContext();

export const ConfirmProvider = ({ children }) => {
  const [confirmState, setConfirmState] = useState({
    isOpen: false,
    message: '',
    title: 'Are you sure?',
    onConfirm: null, // The function to run if they click Yes
  });

  // The function you will call from your pages
  const ask = (message, onConfirmCallback, title = "Confirm Action") => {
    setConfirmState({
      isOpen: true,
      message,
      title,
      onConfirm: onConfirmCallback,
    });
  };

  const close = () => {
    setConfirmState(prev => ({ ...prev, isOpen: false }));
  };

  const handleConfirm = () => {
    if (confirmState.onConfirm) {
      confirmState.onConfirm(); // Run the deletion logic
    }
    close();
  };

  return (
    <ConfirmContext.Provider value={{ ask }}>
      {children}

      {/* --- THE MODAL UI --- */}
      {confirmState.isOpen && (
        <div className="fixed inset-0 z-[200] flex items-center justify-center bg-black/50 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-white rounded-lg shadow-2xl w-full max-w-md border border-gray-200 scale-100 animate-in zoom-in-95 duration-200 overflow-hidden">
            
            {/* Header */}
            <div className="flex items-center px-6 py-4 border-b border-gray-100 bg-gray-50">
              <div className="p-2 bg-red-100 rounded-full mr-3">
                <AlertTriangle className="w-5 h-5 text-red-600" />
              </div>
              <h3 className="text-lg font-bold text-gray-800">
                {confirmState.title}
              </h3>
            </div>

            {/* Body */}
            <div className="px-6 py-6">
              <p className="text-gray-600 text-sm leading-relaxed">
                {confirmState.message}
              </p>
            </div>

            {/* Footer / Buttons */}
            <div className="flex justify-end space-x-3 px-6 py-4 bg-gray-50 border-t border-gray-100">
              <button 
                onClick={close}
                className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-100 transition"
              >
                Cancel
              </button>
              <button 
                onClick={handleConfirm}
                className="px-4 py-2 text-sm font-bold text-white bg-red-600 rounded-md hover:bg-red-700 shadow-sm transition transform active:scale-95"
              >
                Confirm
              </button>
            </div>

          </div>
        </div>
      )}
    </ConfirmContext.Provider>
  );
};

export const useConfirm = () => useContext(ConfirmContext);