import React, { useState, useEffect } from 'react';
import { X, Cookie } from 'lucide-react';
import { Link } from 'react-router-dom';

export default function CookieBanner() {
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    // Check if the user has already accepted cookies
    const consent = localStorage.getItem('frenchwithus_cookie_consent');
    if (!consent) {
      setIsVisible(true);
    }
  }, []);

  const handleAccept = () => {
    localStorage.setItem('frenchwithus_cookie_consent', 'true');
    setIsVisible(false);
  };

  if (!isVisible) return null;

  return (
    <div className="fixed bottom-0 left-0 right-0 z-50 p-4 md:p-6 pb-6 md:pb-8 flex justify-center animate-slide-up bg-gradient-to-t from-black/80 to-transparent pointer-events-none">
      <div className="bg-white dark:bg-[#1a1a1a] border border-gray-200 dark:border-gray-800 shadow-2xl rounded-2xl p-5 md:p-6 w-full max-w-4xl pointer-events-auto flex flex-col md:flex-row items-start md:items-center gap-4 md:gap-8 relative overflow-hidden">
        
        {/* Decorative accent */}
        <div className="absolute top-0 left-0 w-1 h-full bg-primary-DEFAULT dark:bg-primary-dark"></div>

        <div className="flex items-center justify-center bg-gray-100 dark:bg-gray-800 p-3 rounded-full shrink-0">
          <Cookie className="w-6 h-6 text-primary-DEFAULT dark:text-primary-dark" />
        </div>
        
        <div className="flex-1">
          <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-1">
            We value your privacy
          </h3>
          <p className="text-sm text-gray-600 dark:text-gray-400">
            We use cookies to enhance your browsing experience, serve personalized content, and analyze our traffic. By clicking "Accept All", you consent to our use of cookies. Read our <Link to="/privacy-policy" className="text-primary-DEFAULT dark:text-primary-dark hover:underline">Privacy Policy</Link> to learn more.
          </p>
        </div>

        <div className="flex flex-row md:flex-col gap-2 w-full md:w-auto mt-2 md:mt-0 shrink-0">
          <button
            onClick={handleAccept}
            className="flex-1 bg-black text-white dark:bg-white dark:text-black px-6 py-2.5 rounded-xl font-medium hover:bg-gray-800 dark:hover:bg-gray-200 transition-colors whitespace-nowrap"
          >
            Accept All
          </button>
          <button
            onClick={() => setIsVisible(false)}
            className="flex-1 bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-200 px-6 py-2.5 rounded-xl font-medium hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors whitespace-nowrap"
          >
            Decline
          </button>
        </div>

        {/* Close Button Cross */}
        <button 
          onClick={() => setIsVisible(false)}
          className="absolute top-2 right-2 p-2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 transition-colors rounded-full hover:bg-gray-100 dark:hover:bg-gray-800"
          aria-label="Close"
        >
          <X className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
}
