import React from 'react';

class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error) {
    // Update state so the next render will show the fallback UI.
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    // You can also log the error to an error reporting service here (e.g. Sentry)
    console.error("ErrorBoundary caught an error:", error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      // You can render any custom fallback UI
      return (
        <div className="min-h-[50vh] flex flex-col items-center justify-center p-8 text-center">
          <div className="bg-red-50 dark:bg-red-900/10 text-red-500 rounded-xl p-8 max-w-lg border border-red-200 dark:border-red-800">
            <h2 className="text-2xl font-bold mb-4">Oops, something went wrong.</h2>
            <p className="text-red-400 mb-6">
              We encountered an unexpected error while rendering this page.
            </p>
            <button
              onClick={() => window.location.reload()}
              className="px-6 py-2 bg-red-500 hover:bg-red-600 text-white rounded-lg transition-colors"
            >
              Refresh Page
            </button>
          </div>
        </div>
      );
    }

    return this.props.children; 
  }
}

export default ErrorBoundary;
