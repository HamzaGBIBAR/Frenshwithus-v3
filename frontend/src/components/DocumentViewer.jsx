import { useState, useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import { useTranslation } from 'react-i18next';

/**
 * DocumentViewer - Modal popup to view documents (PDF, images, Word, Excel, PowerPoint)
 * 
 * Features:
 * - PDF: Native browser rendering with zoom and scroll
 * - Images: Full-screen preview with zoom controls
 * - Office docs: Download fallback (browser can't render directly)
 * - Responsive design for mobile and desktop
 * - Keyboard navigation (Escape to close, +/- for zoom)
 */

const FILE_TYPE_INFO = {
  'application/pdf': { name: 'PDF', icon: '📄', canPreview: true },
  'application/msword': { name: 'Word', icon: '📝', canPreview: false },
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document': { name: 'Word', icon: '📝', canPreview: false },
  'application/vnd.ms-powerpoint': { name: 'PowerPoint', icon: '📊', canPreview: false },
  'application/vnd.openxmlformats-officedocument.presentationml.presentation': { name: 'PowerPoint', icon: '📊', canPreview: false },
  'application/vnd.ms-excel': { name: 'Excel', icon: '📈', canPreview: false },
  'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet': { name: 'Excel', icon: '📈', canPreview: false },
  'image/jpeg': { name: 'Image', icon: '🖼️', canPreview: true },
  'image/jpg': { name: 'Image', icon: '🖼️', canPreview: true },
  'image/png': { name: 'Image', icon: '🖼️', canPreview: true },
  'image/webp': { name: 'Image', icon: '🖼️', canPreview: true },
  'image/gif': { name: 'Image', icon: '🖼️', canPreview: true },
};

function getFileTypeInfo(mimeType) {
  return FILE_TYPE_INFO[mimeType] || { name: 'Document', icon: '📁', canPreview: false };
}

function isImage(mimeType) {
  return mimeType?.startsWith('image/');
}

function isPdf(mimeType) {
  return mimeType === 'application/pdf';
}

export default function DocumentViewer({ url, mimeType, fileName, onClose }) {
  const { t } = useTranslation();
  const [zoom, setZoom] = useState(100);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [blobUrl, setBlobUrl] = useState(null);
  const containerRef = useRef(null);

  const fileInfo = getFileTypeInfo(mimeType);
  const canPreview = fileInfo.canPreview && (isImage(mimeType) || isPdf(mimeType));

  // Convert base64 data URI to Blob URL for better browser compatibility (especially PDFs)
  useEffect(() => {
    if (!url) return;
    
    let objectUrl = null;
    
    // If it's a base64 data URI, convert to blob URL
    if (url.startsWith('data:')) {
      try {
        const [header, base64Data] = url.split(',');
        const mimeMatch = header.match(/data:([^;]+)/);
        const mime = mimeMatch ? mimeMatch[1] : mimeType || 'application/octet-stream';
        
        const byteCharacters = atob(base64Data);
        const byteNumbers = new Array(byteCharacters.length);
        for (let i = 0; i < byteCharacters.length; i++) {
          byteNumbers[i] = byteCharacters.charCodeAt(i);
        }
        const byteArray = new Uint8Array(byteNumbers);
        const blob = new Blob([byteArray], { type: mime });
        objectUrl = URL.createObjectURL(blob);
        setBlobUrl(objectUrl);
      } catch (err) {
        console.error('Failed to convert base64 to blob:', err);
        setError(t('documentViewer.loadError'));
        setLoading(false);
      }
    } else {
      // Regular URL, use as-is
      setBlobUrl(url);
    }

    // For PDFs, set a timeout to hide loading spinner (onLoad doesn't always fire)
    let loadingTimeout;
    if (isPdf(mimeType)) {
      loadingTimeout = setTimeout(() => {
        setLoading(false);
      }, 2000);
    }

    // Cleanup blob URL on unmount
    return () => {
      if (objectUrl) {
        URL.revokeObjectURL(objectUrl);
      }
      if (loadingTimeout) {
        clearTimeout(loadingTimeout);
      }
    };
  }, [url, mimeType, t]);

  // Handle keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Escape') {
        onClose?.();
      } else if (e.key === '+' || e.key === '=') {
        setZoom((z) => Math.min(z + 25, 300));
      } else if (e.key === '-') {
        setZoom((z) => Math.max(z - 25, 25));
      } else if (e.key === '0') {
        setZoom(100);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [onClose]);

  // Prevent body scroll when modal is open
  useEffect(() => {
    const originalOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = originalOverflow;
    };
  }, []);

  const handleDownload = () => {
    if (!url) return;
    
    // For Base64 data URIs, create a blob and download
    if (url.startsWith('data:')) {
      try {
        const [header, base64Data] = url.split(',');
        const mimeMatch = header.match(/data:([^;]+)/);
        const mime = mimeMatch ? mimeMatch[1] : 'application/octet-stream';
        
        const byteCharacters = atob(base64Data);
        const byteNumbers = new Array(byteCharacters.length);
        for (let i = 0; i < byteCharacters.length; i++) {
          byteNumbers[i] = byteCharacters.charCodeAt(i);
        }
        const byteArray = new Uint8Array(byteNumbers);
        const blob = new Blob([byteArray], { type: mime });
        
        const downloadUrl = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = downloadUrl;
        a.download = fileName || 'document';
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(downloadUrl);
      } catch (err) {
        console.error('Download error:', err);
      }
    } else {
      // Regular URL
      window.open(url, '_blank');
    }
  };

  const content = (
    <div
      className="fixed inset-0 z-[100] flex items-center justify-center bg-black/80 backdrop-blur-sm animate-fade-in"
      onClick={(e) => e.target === e.currentTarget && onClose?.()}
    >
      <div 
        ref={containerRef}
        className="relative w-full h-full max-w-6xl max-h-[95vh] mx-2 sm:mx-4 my-2 sm:my-4 flex flex-col bg-white dark:bg-[#1a1a1a] rounded-xl sm:rounded-2xl shadow-2xl overflow-hidden animate-modal-in"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-3 sm:px-5 py-3 sm:py-4 border-b border-gray-200 dark:border-white/10 bg-gray-50 dark:bg-[#111] shrink-0">
          <div className="flex items-center gap-2 sm:gap-3 min-w-0 flex-1">
            <span className="text-xl sm:text-2xl shrink-0">{fileInfo.icon}</span>
            <div className="min-w-0 flex-1">
              <h3 className="font-semibold text-sm sm:text-base text-text dark:text-[#f5f5f5] truncate">
                {fileName || t('documentViewer.document')}
              </h3>
              <p className="text-xs text-text/60 dark:text-[#f5f5f5]/60">
                {fileInfo.name}
              </p>
            </div>
          </div>
          
          {/* Controls */}
          <div className="flex items-center gap-1 sm:gap-2 shrink-0">
            {canPreview && (
              <>
                <button
                  onClick={() => setZoom((z) => Math.max(z - 25, 25))}
                  className="p-2 rounded-lg hover:bg-gray-200 dark:hover:bg-white/10 text-text dark:text-[#f5f5f5] transition"
                  title={t('documentViewer.zoomOut')}
                >
                  <svg className="w-4 h-4 sm:w-5 sm:h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 12H4" />
                  </svg>
                </button>
                <span className="text-xs sm:text-sm font-medium text-text dark:text-[#f5f5f5] min-w-[3rem] text-center">
                  {zoom}%
                </span>
                <button
                  onClick={() => setZoom((z) => Math.min(z + 25, 300))}
                  className="p-2 rounded-lg hover:bg-gray-200 dark:hover:bg-white/10 text-text dark:text-[#f5f5f5] transition"
                  title={t('documentViewer.zoomIn')}
                >
                  <svg className="w-4 h-4 sm:w-5 sm:h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                  </svg>
                </button>
                <button
                  onClick={() => setZoom(100)}
                  className="p-2 rounded-lg hover:bg-gray-200 dark:hover:bg-white/10 text-text dark:text-[#f5f5f5] transition text-xs font-medium"
                  title={t('documentViewer.resetZoom')}
                >
                  1:1
                </button>
                <div className="w-px h-6 bg-gray-300 dark:bg-white/20 mx-1 hidden sm:block" />
              </>
            )}
            <button
              onClick={handleDownload}
              className="p-2 rounded-lg hover:bg-pink-soft/50 dark:hover:bg-pink-400/20 text-pink-primary dark:text-pink-400 transition"
              title={t('documentViewer.download')}
            >
              <svg className="w-4 h-4 sm:w-5 sm:h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
              </svg>
            </button>
            <button
              onClick={onClose}
              className="p-2 rounded-lg hover:bg-red-100 dark:hover:bg-red-900/30 text-red-600 dark:text-red-400 transition"
              title={t('documentViewer.close')}
            >
              <svg className="w-4 h-4 sm:w-5 sm:h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-auto bg-gray-100 dark:bg-[#0a0a0a]">
          {canPreview && blobUrl ? (
            <div 
              className="min-h-full flex items-center justify-center p-2 sm:p-4"
              style={{ 
                minHeight: '100%',
              }}
            >
              {isImage(mimeType) ? (
                <img
                  src={blobUrl}
                  alt={fileName}
                  className="max-w-full transition-transform duration-200"
                  style={{ 
                    transform: `scale(${zoom / 100})`,
                    transformOrigin: 'center center',
                  }}
                  onLoad={() => setLoading(false)}
                  onError={() => {
                    setLoading(false);
                    setError(t('documentViewer.loadError'));
                  }}
                />
              ) : isPdf(mimeType) ? (
                <object
                  data={blobUrl}
                  type="application/pdf"
                  className="w-full h-full bg-white"
                  style={{ 
                    minHeight: 'calc(95vh - 80px)',
                    transform: `scale(${zoom / 100})`,
                    transformOrigin: 'top center',
                    width: `${10000 / zoom}%`,
                  }}
                  onLoad={() => setLoading(false)}
                >
                  <iframe
                    src={blobUrl}
                    title={fileName}
                    className="w-full h-full border-0 bg-white"
                    style={{ 
                      minHeight: 'calc(95vh - 80px)',
                    }}
                    onLoad={() => setLoading(false)}
                    onError={() => {
                      setLoading(false);
                      setError(t('documentViewer.loadError'));
                    }}
                  />
                </object>
              ) : null}
            </div>
          ) : (
            // Non-previewable files (Word, Excel, PowerPoint)
            <div className="flex flex-col items-center justify-center h-full min-h-[300px] p-6 text-center">
              <div className="w-20 h-20 sm:w-24 sm:h-24 rounded-2xl bg-pink-soft/30 dark:bg-pink-400/20 flex items-center justify-center mb-4 sm:mb-6">
                <span className="text-4xl sm:text-5xl">{fileInfo.icon}</span>
              </div>
              <h3 className="text-lg sm:text-xl font-semibold text-text dark:text-[#f5f5f5] mb-2">
                {fileName || t('documentViewer.document')}
              </h3>
              <p className="text-sm text-text/60 dark:text-[#f5f5f5]/60 mb-6 max-w-sm">
                {t('documentViewer.noPreview', { type: fileInfo.name })}
              </p>
              <button
                onClick={handleDownload}
                className="px-6 py-3 bg-pink-primary dark:bg-pink-400 text-white rounded-xl hover:bg-pink-dark dark:hover:bg-pink-500 transition font-medium flex items-center gap-2"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                </svg>
                {t('documentViewer.downloadFile')}
              </button>
            </div>
          )}

          {/* Loading state */}
          {(loading && canPreview) || (canPreview && !blobUrl) ? (
            <div className="absolute inset-0 flex items-center justify-center bg-gray-100 dark:bg-[#0a0a0a]">
              <div className="flex flex-col items-center gap-3">
                <div className="w-10 h-10 border-3 border-pink-primary dark:border-pink-400 border-t-transparent rounded-full animate-spin" />
                <p className="text-sm text-text/60 dark:text-[#f5f5f5]/60">
                  {t('documentViewer.loading')}
                </p>
              </div>
            </div>
          ) : null}

          {/* Error state */}
          {error && (
            <div className="absolute inset-0 flex items-center justify-center bg-gray-100 dark:bg-[#0a0a0a]">
              <div className="flex flex-col items-center gap-3 text-center p-4">
                <div className="w-16 h-16 rounded-full bg-red-100 dark:bg-red-900/30 flex items-center justify-center">
                  <svg className="w-8 h-8 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                  </svg>
                </div>
                <p className="text-sm text-red-600 dark:text-red-400">{error}</p>
                <button
                  onClick={handleDownload}
                  className="px-4 py-2 text-sm text-pink-primary dark:text-pink-400 hover:underline"
                >
                  {t('documentViewer.tryDownload')}
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Footer with keyboard shortcuts hint */}
        <div className="hidden sm:flex items-center justify-center px-4 py-2 border-t border-gray-200 dark:border-white/10 bg-gray-50 dark:bg-[#111] text-xs text-text/50 dark:text-[#f5f5f5]/50 gap-4">
          <span><kbd className="px-1.5 py-0.5 rounded bg-gray-200 dark:bg-white/10 font-mono">Esc</kbd> {t('documentViewer.toClose')}</span>
          {canPreview && (
            <>
              <span><kbd className="px-1.5 py-0.5 rounded bg-gray-200 dark:bg-white/10 font-mono">+</kbd>/<kbd className="px-1.5 py-0.5 rounded bg-gray-200 dark:bg-white/10 font-mono">-</kbd> {t('documentViewer.toZoom')}</span>
              <span><kbd className="px-1.5 py-0.5 rounded bg-gray-200 dark:bg-white/10 font-mono">0</kbd> {t('documentViewer.toReset')}</span>
            </>
          )}
        </div>
      </div>
    </div>
  );

  return createPortal(content, document.body);
}

// Utility hook to easily use the DocumentViewer
export function useDocumentViewer() {
  const [viewerState, setViewerState] = useState(null);

  const openDocument = (url, mimeType, fileName) => {
    setViewerState({ url, mimeType, fileName });
  };

  const closeDocument = () => {
    setViewerState(null);
  };

  const ViewerComponent = viewerState ? (
    <DocumentViewer
      url={viewerState.url}
      mimeType={viewerState.mimeType}
      fileName={viewerState.fileName}
      onClose={closeDocument}
    />
  ) : null;

  return { openDocument, closeDocument, ViewerComponent };
}
