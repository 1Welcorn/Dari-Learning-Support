import React, { useState, useMemo, useRef, useEffect } from 'react';
import type { Unit, Question, ExternalLink } from '../../types';
import { COLORS } from '../../constants';
import {
  Sparkles, Plus, FileText, ChevronDown,
  Trash2, Info, Edit2,
  ChefHat, Headphones, User, Building2, Smartphone, BookOpen, GraduationCap,
  Maximize, ChevronRight, ChevronLeft, ArrowLeft,
  Eye, Lock, Unlock, X, ClipboardList, Bold, Italic, Underline, AlignLeft, AlignCenter, AlignRight, AlignJustify, List, ListOrdered, Type, Eraser, Palette, Maximize2, Clock, Monitor, Smartphone as MobileIcon, Image as ImageIcon, AlertTriangle, Zap
} from 'lucide-react';
import homeButtonImg from '../../assets/home-button.png';
import memoryGameImg from '../../assets/memory_game.png';
import wordGameImg from '../../assets/word_game.png';
import startButtonDari from '../../assets/botão clique aqui em PersaDari (297 x 210 mm).png';
import { HomeButton } from '../ui/HomeButton';
import { QuestionBlock } from './QuestionBlock';
import EmbedPreview from '../ui/EmbedPreview';
import { useAuth } from '../../context/AuthContext';
import { useStudentJourney } from '../../hooks/useStudentJourney';
import WordFallGame from './WordFallGame';

// --- RICH TEXT EDITOR ---
const RichTextEditor: React.FC<{ value: string; onChange: (val: string) => void }> = ({ value, onChange }) => {
  const editorRef = useRef<HTMLDivElement>(null);
  useEffect(() => { if (editorRef.current && editorRef.current.innerHTML !== value) { editorRef.current.innerHTML = value; } }, []);
  const exec = (cmd: string, val?: string) => { document.execCommand(cmd, false, val); if (editorRef.current) { onChange(editorRef.current.innerHTML); } };
  return (
    <div className="rich-editor-container" style={{ display: 'flex', flexDirection: 'column', height: '100%', border: '1px solid #e2e8f0', borderRadius: '16px', overflow: 'hidden' }}>
      <div className="rich-editor-toolbar" style={{ padding: '8px', borderBottom: '1px solid #e2e8f0', display: 'flex', flexWrap: 'wrap', gap: '4px', background: '#fff' }}>
        <button onClick={() => exec('formatBlock', '<h1>')}>H1</button>
        <button onClick={() => exec('formatBlock', '<h2>')}>H2</button>
        <button onClick={() => exec('bold')}><Bold size={14} /></button>
        <button onClick={() => exec('italic')}><Italic size={14} /></button>
        <button onClick={() => exec('justifyLeft')}><AlignLeft size={14} /></button>
        <button onClick={() => exec('justifyCenter')}><AlignCenter size={14} /></button>
        <button onClick={() => exec('justifyRight')}><AlignRight size={14} /></button>
        <button onClick={() => exec('justifyFull')}><AlignJustify size={14} /></button>
        <button onClick={() => exec('insertUnorderedList')}><List size={14} /></button>
        <button onClick={() => exec('foreColor', '#3b82f6')} style={{ color: '#3b82f6' }}><Palette size={14} /></button>
        <button onClick={() => exec('removeFormat')}><Eraser size={14} /></button>
      </div>
      <div ref={editorRef} className="rich-editor-content" contentEditable onInput={(e) => onChange(e.currentTarget.innerHTML)} style={{ flex: 1, padding: '20px', background: 'white', outline: 'none', overflowY: 'auto', fontSize: '15px' }} />
    </div>
  );
};

// --- UNIVERSAL MEDIA PLAYER (V10) ---
export const VideoPlayerV5: React.FC<{ media: ExternalLink }> = ({ media }) => {
  // Converte URLs do player da Cloudinary para URLs diretas de vídeo (MP4) para ter controle nativo do delay
  let actualUrl = media.url;
  if (actualUrl.includes('player.cloudinary.com/embed')) {
    try {
      const urlObj = new URL(actualUrl);
      const publicId = urlObj.searchParams.get('public_id');
      const cloudName = urlObj.searchParams.get('cloud_name');
      if (publicId && cloudName) {
        actualUrl = `https://res.cloudinary.com/${cloudName}/video/upload/${publicId}.mp4`;
      }
    } catch (e) {
      // Falha silenciosa, usa a URL original
    }
  }

  // Apenas considera iframe se for youtube ou vimeo
  const isIframeEmbed = actualUrl.includes('youtube.com/embed') || actualUrl.includes('vimeo.com');
  const isImage = media.label === 'media' || actualUrl.match(/\.(jpeg|jpg|gif|png|webp|svg)$/i);

  // URL instantânea para evitar sensação de "quebrado"
  const getBaseSrc = (url: string) => {
    try {
      const parsed = new URL(url);
      parsed.searchParams.set('autoplay', '0');
      parsed.searchParams.set('controls', '0');
      parsed.searchParams.set('rel', '0');
      return parsed.toString();
    } catch {
      const sep = url.includes('?') ? '&' : '?';
      return `${url}${sep}autoplay=0&controls=0&rel=0`;
    }
  };

  const [iframeSrc, setIframeSrc] = useState(isIframeEmbed ? getBaseSrc(actualUrl) : actualUrl);
  const videoRef = useRef<HTMLVideoElement>(null);

  // Atualiza instantaneamente se a URL mudar
  useEffect(() => {
    if (isIframeEmbed) {
      setIframeSrc(getBaseSrc(actualUrl));
    }
  }, [actualUrl, isIframeEmbed]);

  useEffect(() => {
    if (isImage || !actualUrl) return;

    // Reseta o estado do vídeo quando o delay muda para poder visualizar o efeito
    if (isIframeEmbed) {
      setIframeSrc(getBaseSrc(actualUrl));
    } else if (videoRef.current) {
      videoRef.current.pause();
      videoRef.current.currentTime = 0;
    }

    const delayTime = media.delay !== undefined ? media.delay * 1000 : 2000;
    const timer = setTimeout(() => {
      if (isIframeEmbed) {
        try {
          const parsed = new URL(actualUrl);
          parsed.searchParams.set('autoplay', '1');
          parsed.searchParams.set('controls', '0');
          parsed.searchParams.set('rel', '0');
          setIframeSrc(parsed.toString());
        } catch {
          const sep = actualUrl.includes('?') ? '&' : '?';
          setIframeSrc(`${actualUrl}${sep}autoplay=1&controls=0&rel=0`);
        }
      } else if (videoRef.current) {
        videoRef.current.play().catch(() => {
          if (videoRef.current) { videoRef.current.muted = true; videoRef.current.play(); }
        });
      }
    }, delayTime);
    return () => clearTimeout(timer);
  }, [actualUrl, media.delay, isImage, isIframeEmbed]);

  const handleVideoClick = () => {
    if (videoRef.current) {
      if (videoRef.current.paused) {
        videoRef.current.play();
      } else {
        videoRef.current.pause();
      }
    }
  };

  const containerStyle: React.CSSProperties = {
    width: media.width || '100%',
    height: media.height ? `${media.height}px` : 'auto',
    borderRadius: media.borderRadius !== undefined ? `${media.borderRadius}px` : '20px',
    overflow: 'hidden',
    background: media.frameColor === 'transparent' ? 'transparent' : (media.frameColor || (isImage ? 'transparent' : '#000')),
    padding: media.framePadding || '0px',
    boxSizing: 'border-box',
    margin: '10px auto',
    boxShadow: isImage ? 'none' : '0 15px 45px rgba(0,0,0,0.2)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative'
  };

  const itemStyle: React.CSSProperties = {
    width: '100%',
    height: '100%',
    objectFit: (media.objectFit as any) || 'cover',
    border: 'none',
    display: 'block',
    cursor: !isImage && !isIframeEmbed ? 'pointer' : 'default',
    borderRadius: media.playerBorderRadius !== undefined ? `${media.playerBorderRadius}px` : (media.borderRadius !== undefined ? `${media.borderRadius}px` : '20px'),
    transform: media.scale !== undefined ? `scale(${media.scale})` : (media.objectFit === 'cover' && isIframeEmbed ? 'scale(1.2)' : 'none')
  };

  return (
    <div style={containerStyle} className="media-renderer-v10">
      {isImage ? (
        <img src={actualUrl} style={itemStyle} alt="Content" />
      ) : isIframeEmbed ? (
        <iframe src={iframeSrc} style={itemStyle} allow="autoplay; fullscreen" />
      ) : (
        <video ref={videoRef} src={actualUrl} onClick={handleVideoClick} style={itemStyle} playsInline preload="auto" />
      )}
    </div>
  );
};

// --- STEP NAVIGATION ---
const StepNavigation: React.FC<{
  unit: Unit;
  answers: Record<string, any>;
  onSaveAnswer: (qIdx: number, val: string) => Promise<boolean>;
  isAdmin?: boolean;
  isMediator?: boolean;
  editQuestion: (idx: number, newQ: Question) => void;
  deleteQuestion: (idx: number) => void;
  currentColors: any;
  onStartGame?: () => void;
  handleUpdateUnitContent: (updates: Partial<Unit>) => Promise<{ success: boolean; error?: string }>;
  onSaveSession: (note: string) => Promise<boolean>;
  onToggle?: () => void;
  completeLesson: (uId: string, xp: number) => Promise<any>;
  isFirstUnit?: boolean;
  onGoHome?: () => void;
}> = ({ unit, answers, onSaveAnswer, isAdmin, isMediator, editQuestion, deleteQuestion, currentColors, onStartGame, handleUpdateUnitContent, onSaveSession, onToggle, completeLesson, isFirstUnit, onGoHome }) => {
  const [activeStep, setActiveStep] = useState(0);
  const [isEditingBrief, setIsEditingBrief] = useState(false);
  const [tempBrief, setTempBrief] = useState(unit.brief || '');
  const [tempLinks, setTempLinks] = useState<any[]>([]);
  const [saveStatus, setSaveStatus] = useState<'idle' | 'saving' | 'success' | 'error'>('idle');

  useEffect(() => { if (isEditingBrief) { setTempBrief(unit.brief || ''); setTempLinks(unit.external_links || []); } }, [isEditingBrief, unit]);

  const steps: StepContent[] = [];
  // 1. Welcome Page (Guia de Estudo)
  if (unit.brief || (unit.external_links && unit.external_links.length > 0)) steps.push({ type: 'brief' });

  // 3. Atividades Interativas (Wordwall/Canva)
  (unit.embed_urls || []).forEach((e: any, i: number) => steps.push({
    type: 'embed',
    url: normalizeEmbedUrl(typeof e === 'string' ? e : e.url),
    title: typeof e === 'string' ? '' : e.title,
    brief: typeof e === 'string' ? '' : e.brief,
    mystery_icon: typeof e === 'string' ? undefined : e.mystery_icon,
    mystery_icon_size: typeof e === 'string' ? undefined : e.mystery_icon_size,
    idx: i
  }));

  // 4. Perguntas (Tipo Google Forms)
  unit.questions.forEach((q, i) => steps.push({ type: 'question', q, idx: i }));

  // 5. Finalização
  steps.push({ type: isAdmin || isMediator ? 'report' : 'congratulations' });

  const current = steps[activeStep];
  const handleNext = () => { if (activeStep < steps.length - 1) setActiveStep(activeStep + 1); };
  const handleBack = () => { if (activeStep > 0) setActiveStep(activeStep - 1); };

  if (!current) return null;

  return (
    <div className={`activities-v5-wrapper step-type-${current.type}`}>
      <div className="profile-header-image-style" style={{ margin: '4px auto 0' }}>
        <div className="avatar-and-name">
          <h2 style={{ fontSize: '20px', margin: 0, fontWeight: 900 }}>Projeto Pontes da Esperança ☀️</h2>
        </div>
        <div className="header-nav-mini">
          <button className="header-nav-btn-v7 prev" onClick={handleBack} disabled={activeStep === 0}><ChevronLeft size={20} /></button>
          <button className="header-nav-btn-v7 next next-step-glow" onClick={handleNext} disabled={activeStep === steps.length - 1} style={{ animation: activeStep < steps.length - 1 ? 'glowPulse 2s ease-in-out infinite' : 'none' }}><ChevronRight size={20} /></button>
          <button className="exit-btn-v7" onClick={onToggle}><X size={20} /></button>
        </div>
      </div>

      <div className="activities-v5-main" style={{ display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center', padding: '20px', gap: '20px', overflow: 'visible' }}>
        {current.type === 'embed' && (
          <img 
            src={startButtonDari} 
            alt="Clique aqui para começar" 
            className="dari-start-arrow"
            style={{ 
              width: '200px', 
              position: 'absolute',
              top: '100px',
              left: '720px',
              transform: 'rotate(45deg)',
              zIndex: 9999999,
              cursor: 'default', 
              animation: 'bounceArrow 1.5s ease-in-out infinite',
              filter: 'drop-shadow(0 12px 30px rgba(16, 185, 129, 0.4))',
              pointerEvents: 'none'
            }} 
          />
        )}
        {current.type === 'brief' && (
          <div className="mission-intro-card-v7 dynamic-wrap-v7">
            <div className="mission-content-v7">
              <span className="mission-tag-v7">GUIA DE ESTUDO</span>
              <h1 className="mission-subtitle-v7 main-theme">{unit.title}</h1>
              <div dangerouslySetInnerHTML={{ __html: unit.brief || '' }} style={{ fontSize: '16px', lineHeight: '1.6' }} />
              {isAdmin && <button className="play-btn-v7-mission" onClick={() => setIsEditingBrief(true)} style={{ background: '#f59e0b', marginTop: '20px' }}>Editar Conteúdo</button>}
            </div>
            <div className="mission-media-v7">
              {unit.external_links?.map((media, i) => <VideoPlayerV5 key={i} media={media} />)}
            </div>
          </div>
        )}

        {current.type === 'embed' && (
          <div className="mission-intro-card-v7 dynamic-wrap-v7" style={{ overflow: 'visible' }}>
            <div className="mission-content-v7">
              <span className="mission-tag-v7" style={{ background: '#dbeafe', color: '#1d4ed8' }}>ATIVIDADE INTERATIVA</span>
              <h1 className="mission-subtitle-v7 main-theme" dangerouslySetInnerHTML={{ __html: current.title || 'Atividade' }} />
              {current.brief && <div dangerouslySetInnerHTML={{ __html: current.brief }} style={{ fontSize: '16px', lineHeight: '1.6' }} />}
            </div>
            <div className="mission-media-v7" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
              <EmbedPreview
                url={current.url || ''}
                title={current.title}
                maskIcon={current.mystery_icon || unit.mystery_icon}
                maskSize={current.mystery_icon_size || unit.mystery_icon_size || 280}
              />
            </div>
          </div>
        )}

        {current.type === 'game' && (
          <div className="mission-intro-card-v7 dynamic-wrap-v7" style={{ minHeight: '300px', textAlign: 'center', flexDirection: 'column' }}>
            <h2 style={{ fontWeight: 900, marginBottom: '20px' }}>Hora do Desafio WordFall! 🎮</h2>
            <button className="play-btn-v7-mission" onClick={onStartGame} style={{ background: '#10b981', padding: '20px 60px', fontSize: '20px' }}>JOGAR AGORA</button>
          </div>
        )}

        {current.type === 'question' && (
          <div className="mission-intro-card-v7 dynamic-wrap-v7" style={{ flexDirection: 'column', alignItems: 'stretch' }}>
            <div style={{ marginBottom: '10px' }}>
              <span className="mission-tag-v7" style={{ background: '#f3e8ff', color: '#7c3aed' }}>QUESTÃO {(current.idx as number) + 1}</span>
            </div>
            <QuestionBlock question={current.q as any} index={current.idx as any} unitId={unit.id} onSaveAnswer={(val) => onSaveAnswer(current.idx as any, val)} isAdmin={isAdmin} color={currentColors?.main || '#10b981'} />
          </div>
        )}

      </div>

      {isEditingBrief && (
        <div className="brief-editor-overlay-v7" style={{ position: 'fixed', top: 0, left: 0, width: '100vw', height: '100vh', background: '#f8fafc', zIndex: 9999, display: 'flex', flexDirection: 'column' }}>
          <header style={{ padding: '15px 30px', background: 'white', borderBottom: '1px solid #e2e8f0', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <Zap size={24} color="#f59e0b" fill="#f59e0b" />
              <h2 style={{ margin: 0, fontWeight: 900 }}>Editor Maestro Ultra-Rápido ⚡</h2>
            </div>
            <div style={{ display: 'flex', gap: '10px' }}>
              <button onClick={async () => {
                setSaveStatus('saving');
                const { success } = await handleUpdateUnitContent({ brief: tempBrief, external_links: tempLinks.map(l => ({ ...l })) });
                if (success) { setSaveStatus('success'); setTimeout(() => { setSaveStatus('idle'); setIsEditingBrief(false); }, 800); }
              }} style={{ background: '#10b981', color: 'white', padding: '10px 25px', borderRadius: '12px', border: 'none', fontWeight: 900, cursor: 'pointer' }}>
                {saveStatus === 'saving' ? 'Salvando...' : saveStatus === 'success' ? 'Salvo ✓' : 'Salvar Alterações'}
              </button>
              <button onClick={() => setIsEditingBrief(false)} style={{ background: '#f1f5f9', padding: '10px', borderRadius: '12px', border: 'none' }}><X size={20} /></button>
            </div>
          </header>

          <div style={{ flex: 1, display: 'grid', gridTemplateColumns: '1fr 340px 1fr', gap: '20px', padding: '20px', overflow: 'hidden' }}>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
              <h4 style={{ margin: 0, color: '#64748b', fontSize: '11px', fontWeight: 900 }}>1. CONTEÚDO</h4>
              <RichTextEditor value={tempBrief} onChange={setTempBrief} />
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', overflowY: 'auto', paddingRight: '10px' }}>
              <h4 style={{ margin: 0, color: '#64748b', fontSize: '11px', fontWeight: 900 }}>2. DIMENSÕES DO VÍDEO</h4>
              {tempLinks.map((link, lIdx) => (
                <div key={lIdx} style={{ background: 'white', padding: '15px', borderRadius: '16px', border: '2px solid #f59e0b', marginBottom: '15px', boxShadow: '0 4px 15px rgba(0,0,0,0.05)' }}>
                  <input type="text" value={link.url} placeholder="Link do vídeo..." style={{ width: '100%', padding: '10px', marginBottom: '12px', borderRadius: '10px', border: '1px solid #cbd5e1' }} onChange={(e) => { const nl = [...tempLinks]; nl[lIdx].url = e.target.value; setTempLinks(nl); }} />

                  <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
                    <div className="control-group">
                      <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '11px', fontWeight: 900, color: '#64748b', marginBottom: '4px' }}><span>LARGURA DO PLAYER: {link.width || '600px'}</span></div>
                      <input type="range" min="200" max="1200" step="10" value={parseInt(String(link.width || '600').replace(/[^0-9]/g, '')) > 100 ? parseInt(String(link.width || '600').replace(/[^0-9]/g, '')) : 600} style={{ width: '100%', accentColor: '#f59e0b' }} onChange={(e) => { const nl = [...tempLinks]; nl[lIdx].width = `${e.target.value}px`; setTempLinks(nl); }} />
                    </div>
                    <div className="control-group">
                      <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '11px', fontWeight: 900, color: '#64748b', marginBottom: '4px' }}><span>ALTURA DO PLAYER: {link.height || 300}px</span></div>
                      <input type="range" min="50" max="1000" step="5" value={link.height || 300} style={{ width: '100%', accentColor: '#f59e0b' }} onChange={(e) => { const nl = [...tempLinks]; nl[lIdx].height = parseInt(e.target.value); setTempLinks(nl); }} />
                    </div>
                    <div className="control-group">
                      <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '11px', fontWeight: 900, color: '#64748b', marginBottom: '4px' }}><span>CANTOS DO FRAME: {link.borderRadius !== undefined ? link.borderRadius : 20}px</span></div>
                      <input type="range" min="0" max="100" step="1" value={link.borderRadius !== undefined ? link.borderRadius : 20} style={{ width: '100%', accentColor: '#f59e0b' }} onChange={(e) => { const nl = [...tempLinks]; nl[lIdx].borderRadius = parseInt(e.target.value); setTempLinks(nl); }} />
                    </div>
                    <div className="control-group">
                      <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '11px', fontWeight: 900, color: '#64748b', marginBottom: '4px' }}><span>CANTOS DO PLAYER: {link.playerBorderRadius !== undefined ? link.playerBorderRadius : (link.borderRadius !== undefined ? link.borderRadius : 20)}px</span></div>
                      <input type="range" min="0" max="100" step="1" value={link.playerBorderRadius !== undefined ? link.playerBorderRadius : (link.borderRadius !== undefined ? link.borderRadius : 20)} style={{ width: '100%', accentColor: '#f59e0b' }} onChange={(e) => { const nl = [...tempLinks]; nl[lIdx].playerBorderRadius = parseInt(e.target.value); setTempLinks(nl); }} />
                    </div>                          <div className="control-group">
                      <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '11px', fontWeight: 900, color: '#64748b', marginBottom: '4px' }}><span>ZOOM DA IMAGEM/VÍDEO: {link.scale || 1}x</span></div>
                      <input type="range" min="0.5" max="3" step="0.1" value={link.scale || 1} style={{ width: '100%', accentColor: '#f59e0b' }} onChange={(e) => { const nl = [...tempLinks]; nl[lIdx].scale = parseFloat(e.target.value); setTempLinks(nl); }} />
                    </div>
                    <div className="control-group">
                      <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '11px', fontWeight: 900, color: '#64748b', marginBottom: '4px' }}><span>ESPESSURA DO FRAME: {link.framePadding || '0px'}</span></div>
                      <input type="range" min="0" max="50" step="1" value={parseInt(link.framePadding || '0')} style={{ width: '100%', accentColor: '#f59e0b' }} onChange={(e) => { const nl = [...tempLinks]; nl[lIdx].framePadding = `${e.target.value}px`; setTempLinks(nl); }} />
                    </div>
                    <div className="control-group">
                      <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '11px', fontWeight: 900, color: '#64748b', marginBottom: '4px' }}><span>COR DO FRAME:</span></div>
                      <select value={link.frameColor || ''} style={{ width: '100%', padding: '8px', borderRadius: '8px', fontSize: '12px' }} onChange={(e) => { const nl = [...tempLinks]; nl[lIdx].frameColor = e.target.value; setTempLinks(nl); }}>
                        <option value="">Padrão (Preto/Transp.)</option>
                        <option value="transparent">Transparente (Vazio)</option>
                        <option value="white">Branco</option>
                        <option value="#fef3c7">Bege</option>
                        <option value="#000000">Preto</option>
                        <option value="#fbbf24">Amarelo</option>
                        <option value="#3b82f6">Azul</option>
                      </select>
                    </div>
                    <div className="control-group">
                      <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '11px', fontWeight: 900, color: '#64748b', marginBottom: '4px' }}><span>DELAY DE INÍCIO: {link.delay || 0}s</span></div>
                      <input type="range" min="0" max="15" step="0.5" value={link.delay || 0} style={{ width: '100%', accentColor: '#10b981' }} onChange={(e) => { const nl = [...tempLinks]; nl[lIdx].delay = parseFloat(e.target.value); setTempLinks(nl); }} />
                    </div>

                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
                      <div style={{ display: 'flex', flexDirection: 'column' }}>
                        <label style={{ fontSize: '9px', fontWeight: 900, color: '#94a3b8' }}>ENCAIXE (OBJ-FIT)</label>
                        <select value={link.objectFit || 'cover'} style={{ fontSize: '12px', padding: '8px', borderRadius: '8px' }} onChange={(e) => { const nl = [...tempLinks]; nl[lIdx].objectFit = e.target.value; setTempLinks(nl); }}>
                          <option value="cover">Preencher (Sem Barras)</option>
                          <option value="contain">Encaixar (Com Barras)</option>
                        </select>
                      </div>
                      <div style={{ display: 'flex', flexDirection: 'column' }}>
                        <label style={{ fontSize: '9px', fontWeight: 900, color: '#94a3b8' }}>TIPO</label>
                        <select value={link.label} style={{ fontSize: '12px', padding: '8px', borderRadius: '8px' }} onChange={(e) => { const nl = [...tempLinks]; nl[lIdx].label = e.target.value; setTempLinks(nl); }}>
                          <option value="video">🎥 Vídeo</option>
                          <option value="media">🖼️ Imagem</option>
                        </select>
                      </div>
                    </div>                       </div>
                  <button onClick={() => setTempLinks(tempLinks.filter((_, i) => i !== lIdx))} style={{ width: '100%', marginTop: '15px', background: '#fee2e2', color: '#ef4444', border: 'none', padding: '10px', borderRadius: '12px', fontWeight: 900 }}>REMOVER</button>
                </div>
              ))}
              <button onClick={() => setTempLinks([...tempLinks, { label: 'video', url: '', width: '100%', height: 350, objectFit: 'cover' }])} style={{ background: '#f59e0b', color: 'white', border: 'none', padding: '12px', borderRadius: '12px', fontWeight: 900, fontSize: '11px' }}>+ ADICIONAR NOVO VÍDEO</button>
            </div>

            {/* SIMULADOR DINÂMICO */}
            <div style={{ display: 'flex', flexDirection: 'column', background: '#f1f5f9', borderRadius: '24px', overflow: 'hidden', justifyContent: 'center', alignItems: 'center' }}>
              <div style={{ padding: '10px', background: '#e2e8f0', textAlign: 'center', fontSize: '10px', fontWeight: 900, width: '100%' }}>SIMULADOR DE RESULTADO</div>
              <div style={{ flex: 1, display: 'flex', justifyContent: 'center', alignItems: 'center', padding: '20px', width: '100%', overflowY: 'auto' }}>
                <div className="dynamic-wrap-v7" style={{ background: 'white', padding: '30px', borderRadius: '30px', boxShadow: '0 10px 40px rgba(0,0,0,0.05)', display: 'flex', gap: '20px', alignItems: 'center', width: 'auto', maxWidth: '95%' }}>
                  <div style={{ flex: '1 1 auto', minWidth: '200px' }}>
                    <div dangerouslySetInnerHTML={{ __html: tempBrief }} style={{ fontSize: '14px', lineHeight: '1.5' }} />
                  </div>
                  <div style={{ flex: '0 0 auto', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                    {tempLinks.map((media, i) => <VideoPlayerV5 key={i} media={media} />)}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      <style>{`
        .activities-v5-wrapper, .activities-v5-main { overflow: visible !important; position: relative !important; }
        .dynamic-wrap-v7 {
          display: flex !important;
          flex-direction: row !important;
          align-items: center !important;
          gap: 60px !important;
          background: white !important;
          padding: 40px 60px !important;
          border-radius: 50px !important;
          overflow: visible !important;
          box-shadow: 0 40px 100px rgba(0,0,0,0.07) !important;
          width: 100% !important;
          max-width: 1500px !important;
          min-height: 850px !important;
          height: auto !important;
          transition: all 0.3s ease !important;
          margin: 0 auto !important;
        }
        .mission-content-v7 { flex: 1 1 auto !important; min-width: 300px !important; }
        .mission-media-v7 { flex: 3 1 auto !important; display: flex !important; flex-direction: column !important; align-items: center !important; width: 100%; }

        /* Estilização do Frame do Ícone Misterioso */
        .embed-preview {
          width: 100% !important;
          max-width: 700px !important;
          min-height: 500px !important;
          background: #f8fafc !important;
          border-radius: 40px !important;
          display: flex !important;
          align-items: center !important;
          justify-content: center !important;
          border: 4px dashed #e2e8f0 !important;
          cursor: pointer !important;
          transition: all 0.4s cubic-bezier(0.175, 0.885, 0.32, 1.275) !important;
        }
        .embed-preview:hover {
          border-color: #10b981 !important;
          background: #ecfdf5 !important;
          transform: scale(1.03) !important;
        }
        .solid-play-circle {
          width: 350px !important;
          height: 350px !important;
          background: white !important;
          border-radius: 50% !important;
          display: flex !important;
          align-items: center !important;
          justify-content: center !important;
          box-shadow: 0 25px 60px rgba(0,0,0,0.12) !important;
          border: 12px solid #fff !important;
          transition: all 0.4s ease !important;
        }
        .embed-preview:hover .solid-play-circle {
          transform: rotate(5deg) scale(1.05) !important;
          box-shadow: 0 35px 80px rgba(16, 185, 129, 0.2) !important;
        }

        .media-renderer-v10 iframe {          transition: transform 0.3s ease !important;
        }

        @media (max-width: 800px) {
          .dynamic-wrap-v7 { flex-direction: column !important; padding: 25px !important; text-align: center !important; }
          .mission-content-v7 { min-width: 0 !important; }
        }

        @keyframes glowPulse {
          0%, 100% { box-shadow: 0 0 20px rgba(16, 185, 129, 0.4), 0 0 60px rgba(16, 185, 129, 0.15); transform: scale(1); }
          50% { box-shadow: 0 0 30px rgba(16, 185, 129, 0.6), 0 0 80px rgba(16, 185, 129, 0.25); transform: scale(1.03); }
        }
        .next-step-glow:hover {
          transform: scale(1.06) !important;
          box-shadow: 0 0 40px rgba(16, 185, 129, 0.7), 0 0 100px rgba(16, 185, 129, 0.3) !important;
        }

        @keyframes bounceArrow {
          0%, 100% { transform: rotate(45deg) translateX(0); }
          50% { transform: rotate(45deg) translateX(12px); }
        }
        .dari-start-arrow:hover {
          transform: scale(1.08) !important;
          filter: drop-shadow(0 6px 20px rgba(16, 185, 129, 0.5)) brightness(1.1) !important;
        }
      `}</style>
    </div>
  );
};

// --- HELPERS ---
const normalizeEmbedUrl = (rawUrl: string): string => {
  let trimmed = rawUrl.trim();
  if (!trimmed) return '';
  if (trimmed.startsWith('<iframe')) {
    const srcMatch = trimmed.match(/src=["'](.*?)["']/);
    if (srcMatch && srcMatch[1]) trimmed = srcMatch[1];
  }
  const withProtocol = /^https?:\/\//i.test(trimmed) ? trimmed : `https://${trimmed}`;
  try {
    const url = new URL(withProtocol);
    if (url.hostname.includes('wordwall.net')) {
      if (url.pathname.includes('/resource/') && !url.pathname.includes('/embed/')) {
        url.pathname = url.pathname.replace('/resource/', '/embed/resource/');
      }
      return url.toString();
    }
    if (url.hostname.includes('youtube.com') && url.pathname === '/watch') {
      const videoId = url.searchParams.get('v');
      if (videoId) return `https://www.youtube.com/embed/${videoId}`;
    }
    if (url.hostname.includes('youtu.be')) {
      const videoId = url.pathname.replace('/', '');
      if (videoId) return `https://www.youtube.com/embed/${videoId}`;
    }
    if (url.hostname.includes('canva.com') && url.pathname.includes('/view')) {
      url.pathname = url.pathname.replace('/view', '/view?embed');
      return url.toString();
    }
    if (url.hostname.includes('drive.google.com')) {
      url.pathname = url.pathname.replace(/\/view$/, '/preview');
      return url.toString();
    }
    return url.toString();
  } catch {
    return trimmed;
  }
};
type StepType = 'brief' | 'game' | 'embed' | 'question' | 'report' | 'congratulations';
type StepContent = { type: StepType; title?: string; mechanic?: string; xp?: number; url?: string; idx?: number; q?: any; brief?: string; mystery_icon?: string; mystery_icon_size?: number };
export const Activities: React.FC<any> = ({ units, ...props }) => {
  const [activeUnitId] = useState<string | null>(props.initialExpandedId || null);
  const activeUnit = useMemo(() => units.find((u: any) => u.id === activeUnitId), [units, activeUnitId]);
  if (!activeUnit) return <div style={{ padding: '60px', textAlign: 'center' }}>Selecione uma aula no mapa.</div>;
  return <StepNavigation unit={activeUnit} {...props} handleUpdateUnitContent={async (u: any) => { const success = await props.onUpdateUnit(activeUnit.id, u); return { success }; }} completeLesson={async () => ({})} />;
};
export const UnitCard: React.FC<any> = (props) => <StepNavigation {...props} handleUpdateUnitContent={async () => ({ success: true })} completeLesson={async () => ({})} editQuestion={() => { }} deleteQuestion={() => { }} />;
export default Activities;
