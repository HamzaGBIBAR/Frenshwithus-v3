import { createContext, useContext, useState, useCallback } from 'react';

const ToastContext = createContext(null);

export function ToastProvider({ children }) {
  const [toast, setToast] = useState(null);

  const showToast = useCallback((message, duration = 5000) => {
    setToast({ message });
    if (duration > 0) {
      setTimeout(() => setToast(null), duration);
    }
  }, []);

  const hideToast = useCallback(() => setToast(null), []);

  return (
    <ToastContext.Provider value={{ showToast, hideToast }}>
      {children}
      {toast && (
        <div
          role="alert"
          className="fixed bottom-6 left-1/2 -translate-x-1/2 z-[100] px-6 py-4 rounded-xl bg-white dark:bg-[#1a1a1a] border-2 border-pink-primary dark:border-pink-400 shadow-lg animate-fade-in text-text dark:text-[#f5f5f5] font-medium text-sm sm:text-base max-w-[90vw]"
        >
          {toast.message}
        </div>
      )}
    </ToastContext.Provider>
  );
}

export const useToast = () => {
  const ctx = useContext(ToastContext);
  return ctx || { showToast: () => {}, hideToast: () => {} };
};
