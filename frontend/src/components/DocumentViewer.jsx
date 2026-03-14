import { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import { createPortal } from 'react-dom';
import { useTranslation } from 'react-i18next';
import { Document, Page, pdfjs } from 'react-pdf';
import { renderAsync } from 'docx-preview';
import 'react-pdf/dist/Page/AnnotationLayer.css';
import 'react-pdf/dist/Page/TextLayer.css';

// Configure PDF.js worker
pdfjs.GlobalWorkerOptions.workerSrc = `https://cdn.jsdelivr.net/npm/pdfjs-dist@${pdfjs.version}/build/pdf.worker.min.mjs`;

const FILE_TYPE_INFO = {
  'application/pdf': { name: 'PDF', icon: '📄', canPreview: true },
  'application/msword': { name: 'Word (.doc)', icon: '📝', canPreview: false }, // .doc not supported
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document': { name: 'Word', icon: '📝', canPreview: true }, // .docx supported!
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

function isDocx(mimeType) {
  return mimeType === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document';
}

// Convert base64 data URI to ArrayBuffer
function base64ToArrayBuffer(dataUri) {
  const base64Data = dataUri.split(',')[1];
  const binaryString = atob(base64Data);
  const bytes = new Uint8Array(binaryString.length);
  for (let i = 0; i < binaryString.length; i++) {
    bytes[i] = binaryString.charCodeAt(i);
  }
  return bytes.buffer;
}

// Word Document Viewer Component using docx-preview
function WordViewer({ url, onLoad, onError }) {
  const containerRef = useRef(null);
  const [rendered, setRendered] = useState(false);

  useEffect(() => {
    if (!url || !containerRef.current) return;

    const renderDocx = async () => {
      try {
        // Clear previous content
        containerRef.current.innerHTML = '';
        
        let arrayBuffer;
        if (url.startsWith('data:')) {
          arrayBuffer = base64ToArrayBuffer(url);
        } else {
          const response = await fetch(url);
          arrayBuffer = await response.arrayBuffer();
        }

        await renderAsync(arrayBuffer, containerRef.current, undefined, {
          className: 'docx-viewer',
          inWrapper: true,
          ignoreWidth: false,
          ignoreHeight: false,
          ignoreFonts: false,
          breakPages: true,
          useBase64URL: true,
          renderHeaders: true,
          renderFooters: true,
          renderFootnotes: true,
          renderEndnotes: true,
        });

        setRendered(true);
        onLoad?.();
      } catch (err) {
        console.error('DOCX render error:', err);
        onError?.(err);
      }
    };

    renderDocx();
  }, [url, onLoad, onError]);

  return (
    <div 
      ref={containerRef} 
      className="docx-container w-full min-h-full bg-white"
      style={{ 
        padding: '20px',
        maxWidth: '100%',
        overflow: 'auto',
      }}
    />
  );
}

export default function DocumentViewer({ url, mimeType, fileName, onClose }) {
  const { t } = useTranslation();
  const [scale, setScale] = useState(1.0);
  const [numPages, setNumPages] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const containerRef = useRef(null);
  const contentRef = useRef(null);

  const fileInfo = getFileTypeInfo(mimeType);
  const canPreview = fileInfo.canPreview && (isImage(mimeType) || isPdf(mimeType) || isDocx(mimeType));

  // Convert base64 data URI to proper format for react-pdf
  const pdfFile = useMemo(() => {
    if (!url || !isPdf(mimeType)) return null;
    
    if (url.startsWith('data:')) {
      try {
        const base64Data = url.split(',')[1];
        const binaryString = atob(base64Data);
        const bytes = new Uint8Array(binaryString.length);
        for (let i = 0; i < binaryString.length; i++) {
          bytes[i] = binaryString.charCodeAt(i);
        }
        return { data: bytes };
      } catch (err) {
        console.error('Failed to process PDF data:', err);
        return url;
      }
    }
    return url;
  }, [url, mimeType]);

  // Handle keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Escape') {
        onClose?.();
      } else if (e.key === '+' || e.key === '=') {
        setScale((s) => Math.min(s + 0.25, 3.0));
      } else if (e.key === '-') {
        setScale((s) => Math.max(s - 0.25, 0.5));
      } else if (e.key === '0') {
        setScale(1.0);
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

  const onDocumentLoadSuccess = useCallback(({ numPages }) => {
    setNumPages(numPages);
    setLoading(false);
    setError(null);
  }, []);

  const onDocumentLoadError = useCallback((err) => {
    console.error('PDF load error:', err);
    setLoading(false);
    setError(t('documentViewer.loadError'));
  }, [t]);

  const onWordLoadSuccess = useCallback(() => {
    setLoading(false);
    setError(null);
  }, []);

  const onWordLoadError = useCallback(() => {
    setLoading(false);
    setError(t('documentViewer.loadError'));
  }, [t]);

  const handleDownload = () => {
    if (!url) return;
    
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
      window.open(url, '_blank');
    }
  };

  const zoomPercent = Math.round(scale * 100);
  const showZoomControls = canPreview && !isDocx(mimeType); // Zoom not applicable for docx

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
                {fileInfo.name}{numPages ? ` • ${numPages} page${numPages > 1 ? 's' : ''}` : ''}
              </p>
            </div>
          </div>
          
          {/* Controls */}
          <div className="flex items-center gap-1 sm:gap-2 shrink-0">
            {showZoomControls && (
              <>
                <button
                  onClick={() => setScale((s) => Math.max(s - 0.25, 0.5))}
                  className="p-2 rounded-lg hover:bg-gray-200 dark:hover:bg-white/10 text-text dark:text-[#f5f5f5] transition"
                  title={t('documentViewer.zoomOut')}
                >
                  <svg className="w-4 h-4 sm:w-5 sm:h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 12H4" />
                  </svg>
                </button>
                <span className="text-xs sm:text-sm font-medium text-text dark:text-[#f5f5f5] min-w-[3rem] text-center">
                  {zoomPercent}%
                </span>
                <button
                  onClick={() => setScale((s) => Math.min(s + 0.25, 3.0))}
                  className="p-2 rounded-lg hover:bg-gray-200 dark:hover:bg-white/10 text-text dark:text-[#f5f5f5] transition"
                  title={t('documentViewer.zoomIn')}
                >
                  <svg className="w-4 h-4 sm:w-5 sm:h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                  </svg>
                </button>
                <button
                  onClick={() => setScale(1.0)}
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
        <div ref={contentRef} className="flex-1 overflow-auto bg-gray-100 dark:bg-[#0a0a0a]">
          {canPreview ? (
            <div className="min-h-full flex flex-col items-center p-2 sm:p-4">
              {isImage(mimeType) ? (
                <img
                  src={url}
                  alt={fileName}
                  className="max-w-full transition-transform duration-200"
                  style={{ 
                    transform: `scale(${scale})`,
                    transformOrigin: 'center center',
                  }}
                  onLoad={() => setLoading(false)}
                  onError={() => {
                    setLoading(false);
                    setError(t('documentViewer.loadError'));
                  }}
                />
              ) : isPdf(mimeType) && pdfFile ? (
                <Document
                  file={pdfFile}
                  onLoadSuccess={onDocumentLoadSuccess}
                  onLoadError={onDocumentLoadError}
                  loading={
                    <div className="flex flex-col items-center gap-3 py-20">
                      <div className="w-10 h-10 border-3 border-pink-primary dark:border-pink-400 border-t-transparent rounded-full animate-spin" />
                      <p className="text-sm text-text/60 dark:text-[#f5f5f5]/60">
                        {t('documentViewer.loading')}
                      </p>
                    </div>
                  }
                  error={
                    <div className="flex flex-col items-center gap-3 text-center p-4 py-20">
                      <div className="w-16 h-16 rounded-full bg-red-100 dark:bg-red-900/30 flex items-center justify-center">
                        <svg className="w-8 h-8 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                        </svg>
                      </div>
                      <p className="text-sm text-red-600 dark:text-red-400">{t('documentViewer.loadError')}</p>
                      <button
                        onClick={handleDownload}
                        className="px-4 py-2 text-sm text-pink-primary dark:text-pink-400 hover:underline"
                      >
                        {t('documentViewer.tryDownload')}
                      </button>
                    </div>
                  }
                  className="pdf-document"
                >
                  {Array.from(new Array(numPages || 0), (_, index) => (
                    <Page
                      key={`page_${index + 1}`}
                      pageNumber={index + 1}
                      scale={scale}
                      className="mb-4 shadow-lg rounded-lg overflow-hidden"
                      renderTextLayer={true}
                      renderAnnotationLayer={true}
                    />
                  ))}
                </Document>
              ) : isDocx(mimeType) ? (
                <div className="w-full max-w-4xl mx-auto bg-white rounded-lg shadow-lg overflow-hidden">
                  <WordViewer 
                    url={url} 
                    onLoad={onWordLoadSuccess}
                    onError={onWordLoadError}
                  />
                </div>
              ) : null}
            </div>
          ) : (
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
          {loading && (isImage(mimeType) || isDocx(mimeType)) && (
            <div className="absolute inset-0 flex items-center justify-center bg-gray-100 dark:bg-[#0a0a0a]">
              <div className="flex flex-col items-center gap-3">
                <div className="w-10 h-10 border-3 border-pink-primary dark:border-pink-400 border-t-transparent rounded-full animate-spin" />
                <p className="text-sm text-text/60 dark:text-[#f5f5f5]/60">
                  {t('documentViewer.loading')}
                </p>
              </div>
            </div>
          )}

          {/* Error state */}
          {error && !isPdf(mimeType) && (
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
          {showZoomControls && (
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
