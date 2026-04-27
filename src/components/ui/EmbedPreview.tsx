import React, { useRef, useState, useImperativeHandle, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { Play, Sparkles, X } from 'lucide-react';

export type EmbedPreviewHandle = {
  open: () => void;
  close: () => void;
};

const EmbedPreview = React.forwardRef<EmbedPreviewHandle, { url: string; title?: string; thumbnailUrl?: string; maskIcon?: string; maskSize?: number }>((props, ref) => {
  const { url, title, thumbnailUrl, maskIcon, maskSize } = props;
  const [open, setOpen] = useState(false);
  const modalRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    if (open) {
      document.documentElement.style.overflow = 'hidden';
      document.body.style.overflow = 'hidden';
    } else {
      document.documentElement.style.overflow = '';
      document.body.style.overflow = '';
    }
    return () => {
      document.documentElement.style.overflow = '';
      document.body.style.overflow = '';
    };
  }, [open]);

  const openFullscreen = () => {
    setOpen(true);
    setTimeout(() => {
      const el = modalRef.current;
      if (el && el.requestFullscreen) {
        el.requestFullscreen().catch(() => {
          console.log('Fullscreen request blocked or failed, using portal modal.');
        });
      }
    }, 150);
  };

  const closeFullscreen = async () => {
    setOpen(false);
    if (document.fullscreenElement) {
      try { await document.exitFullscreen(); } catch {}
    }
  };

  useImperativeHandle(ref, () => ({ open: openFullscreen, close: closeFullscreen }));

  const modalContent = open && (
    <div className="embed-modal" ref={modalRef}>
      <button className="embed-modal-close-mini" onClick={closeFullscreen}>
         <X size={32} />
      </button>
      <iframe
        src={url}
        title={title || 'Atividade interativa'}
        allow="fullscreen; autoplay; clipboard-read; clipboard-write"
        allowFullScreen
        className="game-iframe-v6"
      />
    </div>
  );

  return (
    <>
      <div className="embed-preview" role="button" onClick={openFullscreen}>
        <div className="embed-preview-inner">
          {thumbnailUrl ? (
            <img src={thumbnailUrl} alt={title || 'Preview'} className="embed-thumbnail" />
          ) : (
            <div className="embed-placeholder-solid">
              <div className="solid-play-circle">
                {maskIcon ? (
                  <img 
                    src={maskIcon} 
                    alt="Mask" 
                    style={{ 
                      width: maskSize ? `${maskSize}px` : '70%', 
                      height: maskSize ? `${maskSize}px` : '70%', 
                      objectFit: 'contain' 
                    }} 
                  />
                ) : (
                  <Play size={64} fill="currentColor" />
                )}
              </div>
            </div>
          )}
        </div>
      </div>

      {open && createPortal(modalContent, document.body)}
    </>
  );
});

export default EmbedPreview;
