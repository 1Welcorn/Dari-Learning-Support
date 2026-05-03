import React, { useState, useMemo, useRef, useEffect } from 'react';
import type { Unit, Question, ExternalLink } from '../../types';
import { COLORS } from '../../constants';
import { 
  Sparkles, Plus, FileText, ChevronDown, 
  Trash2, Info, Edit2,
  ChefHat, Headphones, User, Building2, Smartphone, BookOpen, GraduationCap,
  Maximize, ChevronRight, ChevronLeft, ArrowLeft,
  Eye, Lock, Unlock, X, ClipboardList
} from 'lucide-react';
import homeButtonImg from '../../assets/home-button.png';
import memoryGameImg from '../../assets/memory_game.png';
import wordGameImg from '../../assets/word_game.png';
import { HomeButton } from '../ui/HomeButton';
import { QuestionBlock } from './QuestionBlock';
import EmbedPreview from '../ui/EmbedPreview';
import { useAuth } from '../../context/AuthContext';
import { useStudentJourney } from '../../hooks/useStudentJourney';
import WordFallGame from './WordFallGame';

type StepType = 'game' | 'brief' | 'embed' | 'question' | 'report' | 'congratulations';

interface BaseStep {
  type: StepType;
}

interface GameStep extends BaseStep {
  type: 'game';
  title?: string;
  mechanic?: string;
  xp?: number;
}

interface BriefStep extends BaseStep {
  type: 'brief';
}

interface EmbedStep extends BaseStep {
  type: 'embed';
  url: string;
  idx: number;
  title?: string;
  width?: string;
  maskIcon?: string;
  maskSize?: number;
}

interface QuestionStep extends BaseStep {
  type: 'question';
  q: Question;
  idx: number;
}

interface ReportStep extends BaseStep {
  type: 'report';
}

interface CongratsStep extends BaseStep {
  type: 'congratulations';
}

type StepContent = GameStep | BriefStep | EmbedStep | QuestionStep | ReportStep | CongratsStep;

const normalizeEmbedUrl = (rawUrl: string): string => {
  const trimmed = rawUrl.trim();
  if (!trimmed) return '';

  const withProtocol = /^https?:\/\//i.test(trimmed) ? trimmed : `https://${trimmed}`;

  try {
    const url = new URL(withProtocol);

    if (url.hostname.includes('drive.google.com')) {
      url.pathname = url.pathname.replace(/\/view$/, '/preview');
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

    return url.toString();
  } catch {
    return trimmed;
  }
};

const VideoPlayerV5: React.FC<{ media: ExternalLink }> = ({ media }) => {
  const videoRef = React.useRef<HTMLVideoElement>(null);
  const [playCount, setPlayCount] = React.useState(0);
  const targetRepeats = media.repeatCount || 0;

  React.useEffect(() => {
    // Reset play count when URL changes
    setPlayCount(0);
  }, [media.url]);

  React.useEffect(() => {
    if (videoRef.current) {
       videoRef.current.pause();
       videoRef.current.currentTime = 0;
    }

    const timer = setTimeout(() => {
      if (videoRef.current) {
        videoRef.current.play().catch(e => {
          console.log('Autoplay blocked unmuted, trying muted:', e);
          if (videoRef.current) {
            videoRef.current.muted = true;
            videoRef.current.play();
          }
        });
      }
    }, (media.delay || 0) * 1000);

    return () => clearTimeout(timer);
  }, [media.url, media.delay]);

  const handleEnded = () => {
    if (media.loop) return; // Native loop handles it
    
    if (targetRepeats > 0 && playCount < targetRepeats - 1) {
      setPlayCount(prev => prev + 1);
      if (videoRef.current) {
        videoRef.current.currentTime = 0;
        videoRef.current.play();
      }
    }
  };

  return (
    <video 
       ref={videoRef}
       src={media.url} 
       muted={false} 
       loop={media.loop && !media.repeatCount} 
       playsInline
       onEnded={handleEnded}
       style={{ width: media.width || '100%', maxWidth: '100%', borderRadius: '16px', display: 'block', margin: '0 auto' }}
    />
  );
};

// --- STEP NAVIGATION COMPONENT (ONE CARD AT A TIME) ---
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
  const [note, setNote] = useState('');
  const [isSavingSession, setIsSavingSession] = useState(false);
  const [sessionSuccess, setSessionSuccess] = useState(false);
  const [isEditingBrief, setIsEditingBrief] = useState(false);
  const [showBriefViewer, setShowBriefViewer] = useState(false);
  const [tempBrief, setTempBrief] = useState(unit.brief || '');
  const [tempLinks, setTempLinks] = useState<any[]>([]);
  const [stepReward, setStepReward] = useState(false);
  const [/*hintPos*/, /*setHintPos*/] = useState<null>(null);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [saveStatus, setSaveStatus] = useState<'idle' | 'saving' | 'success' | 'error'>('idle');
  const [saveError, setSaveError] = useState('');
  const [showGlobalReport, setShowGlobalReport] = useState(false);
  const previewRef = React.useRef<any>(null);

  const totalQuestions = unit.questions.length;
  const questionsAnswered = useMemo(() => {
    return unit.questions.filter((_, i) => answers[`${unit.id}-${i}`]?.is_done).length;
  }, [unit, answers]);

  const isCompleted = questionsAnswered === totalQuestions && totalQuestions > 0;

  useEffect(() => {
    if (!isAdmin) {
      setIsEditingBrief(false);
    }
  }, [isAdmin]);

  // Helper to insert tags into the textarea
  const insertTag = (startTag: string, endTag: string) => {
    const textarea = document.getElementById('brief-editor-textarea') as HTMLTextAreaElement;
    if (!textarea) return;

    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;
    const text = textarea.value;
    const before = text.substring(0, start);
    const after = text.substring(end, text.length);
    const selected = text.substring(start, end);

    const newText = before + startTag + selected + endTag + after;
    setTempBrief(newText);
    
    // Reset focus and selection
    setTimeout(() => {
      textarea.focus();
      textarea.setSelectionRange(start + startTag.length, end + startTag.length);
    }, 10);
  };

  useEffect(() => {
    if (isEditingBrief) {
       setTempBrief(unit.brief || '');
       setTempLinks(unit.external_links || []);
    }
  }, [isEditingBrief, unit]);

  

  useEffect(() => {
    const onFsChange = () => setIsFullscreen(!!document.fullscreenElement);
    document.addEventListener('fullscreenchange', onFsChange);
    return () => document.removeEventListener('fullscreenchange', onFsChange);
  }, []);

  // Group all content into steps - Linear journey
  const steps: StepContent[] = [];
  
  // 1. Briefing / Study Guide
  if (unit.brief || (unit.external_links && unit.external_links.length > 0)) {
    steps.push({ type: 'brief' });
  }
  
  // 2. WordFall Game
  steps.push({ 
    type: 'game',
    title: 'WordFall Game',
    mechanic: 'Capture as palavras corretas!',
    xp: 250
  });
  
  // 3. Interactive Activities (Embeds)
  const embedItems = (unit.embed_urls || []).map((itemOrUrl, i): EmbedStep => {
    const item = typeof itemOrUrl === 'string' ? { url: itemOrUrl, title: `Atividade ${i+1}`, width: '100%' } : itemOrUrl;
    return {
      type: 'embed',
      url: normalizeEmbedUrl(item.url),
      title: item.title,
      width: item.width,
      maskIcon: item.maskIcon,
      maskSize: (item as any).maskSize,
      idx: i
    };
  }).filter(e => e.url.trim());
  
  steps.push(...embedItems);
  
  // 4. Questions
  unit.questions.forEach((q, i) => {
    steps.push({ type: 'question', q, idx: i });
  });
  
  // 5. Final Step (Report for Admin/Mediator, Congrats for Student)
  if (isAdmin || isMediator) {
    steps.push({ type: 'report' });
  } else {
    steps.push({ type: 'congratulations' });
  }

  const current = steps[activeStep] as StepContent;
  const isLast = activeStep === steps.length - 1;
  const isFirst = activeStep === 0;

  const missionByStepType: Record<StepType, string> = {
    game: 'Missao: Ganhe estrelas no desafio de palavras.',
    brief: 'Missao: Leia o guia e descubra o foco da aula.',
    embed: 'Missao: Complete a atividade interativa com atencao.',
    question: 'Missao: Responda com calma e mostre o que aprendeu.',
    report: 'Missao final: Conte como foi a aula de hoje.',
    congratulations: 'Missão completa!'
  };

  const mascotByStepType: Record<StepType, string> = {
    game: 'Vamos jogar!',
    brief: 'Vamos aprender!',
    embed: 'Hora da atividade!',
    question: 'Voce consegue!',
    report: 'Mandou bem!',
    congratulations: 'Parabéns!'
  };

  useEffect(() => {
    if (!stepReward) return;
    const timer = window.setTimeout(() => setStepReward(false), 1300);
    return () => window.clearTimeout(timer);
  }, [stepReward]);

  const handleNext = () => {
    if (!isLast) {
      setStepReward(true);
      setActiveStep(activeStep + 1);
    }
  };
  const handleBack = () => { if (!isFirst) setActiveStep(activeStep - 1); };

  const handleSaveSession = async () => {
    if (!note.trim() || isSavingSession) return;
    setIsSavingSession(true);
    const success = await onSaveSession(note);
    setIsSavingSession(false);
    
    if (success) {
      await completeLesson(unit.id, 50);
      setSessionSuccess(true);
      setNote('');
      setTimeout(() => {
        setSessionSuccess(false);
        onToggle?.();
      }, 2000);
    }
  };


    if (!current) return <div className="activities-v5-wrapper">Carregando etapa...</div>;

    return (
    <div className={`activities-v5-wrapper step-type-${current.type}`}>
      {/* 1. TOP PROFILE BAR */}
      <div className="profile-header-image-style" style={{ margin: '4px auto 0' }}>
        <div className="avatar-and-name">
          <div className="user-text-v7">
             <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <h2 style={{ fontSize: '22px', margin: 0, fontWeight: 900 }}>خوش آمدید (Oi)! ☀️</h2>
             </div>
             <div className="xp-bar-mini">
                <div className="xp-fill-mini" style={{ width: '15%' }}></div>
             </div>
             <small style={{ fontSize: '12px', fontWeight: 800, color: '#94a3b8', direction: 'rtl' }}>پیشرفت <span style={{fontSize: '10px'}}>(0% da Jornada)</span> | XP: 34/2000</small>
          </div>
          <div className="level-hexagon">
             <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', lineHeight: '1.1', marginBottom: '2px' }}>
               <span style={{ fontSize: '11px', fontWeight: 900, direction: 'rtl', textTransform: 'none' }}>سطح</span>
               <span style={{ fontSize: '8px', fontWeight: 800 }}>(NÍVEL)</span>
             </div>
             <span style={{ fontSize: '18px' }}>1</span>
          </div>
        </div>

        <div className="header-nav-mini">
          {(isAdmin || isMediator) && (
            <button 
              className={`header-nav-btn-v7 ${showGlobalReport ? 'active' : ''}`}
              onClick={() => setShowGlobalReport(!showGlobalReport)}
              title="Registrar Relatório do Mediador"
              style={{
                marginRight: '8px',
                background: showGlobalReport ? '#f0fdfa' : 'white',
                color: showGlobalReport ? '#10b981' : '#64748b',
                borderColor: showGlobalReport ? '#10b981' : '#e2e8f0'
              }}
            >
              <ClipboardList size={18} />
            </button>
          )}

          <div className="stats-v7">
            <div className="stats-pill-red">🔥 0 Dias</div>
            <div className="stats-pill-yellow">💰 2</div>
          </div>
          <div className="header-divider-v7"></div>
          <button className="header-nav-btn-v7 prev" onClick={(e) => { e.stopPropagation(); handleBack(); }} disabled={activeStep === 0}>
            <ChevronLeft size={20} />
          </button>
          <button className="header-nav-btn-v7 next" onClick={(e) => { e.stopPropagation(); handleNext(); }}>
            {activeStep === steps.length - 1 ? <Sparkles size={20} /> : <ChevronRight size={20} />}
          </button>
          <div className="header-divider-v7"></div>
          <button className="exit-btn-v7" onClick={onToggle}>
            <X size={20} />
          </button>
        </div>
      </div>

      {showGlobalReport && (isAdmin || isMediator) && (
        <div className="global-report-overlay-v7" style={{ 
          background: 'white', 
          margin: '0 20px 20px', 
          borderRadius: '20px', 
          padding: '20px',
          border: '2px solid #10b981',
          boxShadow: '0 10px 25px rgba(16, 185, 129, 0.1)'
        }}>
           <h4 style={{ margin: '0 0 12px', fontSize: '14px', color: '#1e293b', fontWeight: 900, display: 'flex', alignItems: 'center', gap: '8px' }}>
              <ClipboardList size={18} /> Relatório do Professor Mediador
           </h4>
           <textarea 
              value={note}
              onChange={(e) => setNote(e.target.value)}
              placeholder="Descreva o que for relevante sobre o desempenho da Ione nesta aula..."
              style={{
                width: '100%',
                height: '100px',
                padding: '15px',
                borderRadius: '15px',
                border: '1px solid #e2e8f0',
                fontSize: '14px',
                fontFamily: 'inherit',
                resize: 'none',
                marginBottom: '12px',
                background: '#f8fafc'
              }}
           />
           <div style={{ display: 'flex', gap: '10px' }}>
              <button 
                onClick={handleSaveSession}
                disabled={!note.trim() || isSavingSession}
                style={{
                   flex: 1,
                   padding: '12px',
                   borderRadius: '12px',
                   background: '#10b981',
                   color: 'white',
                   border: 'none',
                   fontWeight: 800,
                   cursor: 'pointer',
                   opacity: (!note.trim() || isSavingSession) ? 0.5 : 1
                }}
              >
                 {isSavingSession ? 'Salvando...' : 'SALVAR RELATÓRIO ✓'}
              </button>
              <button 
                onClick={() => setShowGlobalReport(false)}
                style={{
                   padding: '12px 20px',
                   borderRadius: '12px',
                   background: '#f1f5f9',
                   color: '#64748b',
                   border: 'none',
                   fontWeight: 800,
                   cursor: 'pointer'
                }}
              >
                 FECHAR
              </button>
           </div>
           {sessionSuccess && (
              <p style={{ color: '#10b981', fontSize: '12px', fontWeight: 800, marginTop: '10px', textAlign: 'center' }}>
                 ✓ Relatório salvo com sucesso!
              </p>
           )}
        </div>
      )}

      {/* 3. CONTENT AREA */}
      <div className="activities-v5-main">
        {current.type === 'game' && (
          <div className="mission-horizontal-v7">
             {/* LEFT SIDE: PREMIUM INTRO */}
             <div className="mission-intro-section-v7">
                <span className="mission-tag-v7" style={{ 
                   background: isCompleted ? '#dcfce7' : '#f1f5f9', 
                   color: isCompleted ? '#16a34a' : '#475569' 
                }}>
                   {isCompleted ? 'ماموریت انجام شد (MISSÃO COMPLETA)' : 'ماموریت در حال انجام (MISSÃO EM ANDAMENTO)'}
                </span>
                {unit.title.includes('—') ? (
                   <>
                      <div className="unit-label-badge-v7">
                         {unit.title.split('—')[0].trim()}
                      </div>
                      <h1 className="mission-subtitle-v7 main-theme">{unit.title.split('—')[1].trim()}</h1>
                   </>
                ) : (
                   <h1 className="mission-title-v7 side">{unit.title}</h1>
                )}
                <p className="mission-sub-v7 side" style={{ direction: 'rtl' }}>
                   محتوای این درس را تمرین کنید و سرعت خود را بسنجید!<br/>
                   <span style={{fontSize: '12px', opacity: 0.8}}>(Pratique o conteúdo desta unidade e teste sua velocidade para ganhar bônus!)</span>
                </p>
                                 {unit.brief && (
                    <div className="unit-brief-display-v7" style={{ 
                      marginTop: '15px', 
                      padding: '12px 18px', 
                      background: '#fff9eb', 
                      borderRadius: '16px', 
                      borderLeft: '4px solid #f59e0b',
                      fontSize: '15px',
                      color: '#475569',
                      lineHeight: '1.5',
                      fontWeight: 500,
                      whiteSpace: 'pre-wrap'
                    }}>
                       {unit.brief}
                    </div>
                 )}
                 <div className="mission-perks-v7">
                   <div className="perk-item-v7">✨ +{current.xp || 200} XP (امتیاز اضافی)</div>
                   <div className="perk-item-v7">🏆 Troféu (جام پایان)</div>
                </div>
             </div>

             {/* RIGHT SIDE: START BUTTON */}
             <div className="game-launcher-mission">
                <div className="mission-center-v7">
                   <img src={wordGameImg} alt="Word Game Skin" className="word-game-icon-3d" />
                </div>
                <div className="mission-footer-v7" style={{ marginTop: 0 }}>
                   <h1 className="mission-footer-title" style={{ direction: 'rtl' }}>{current.title || 'چالش درس (Desafio)'}</h1>
                   <p className="mission-mechanic">Mecânica: {current.mechanic || 'Atividade Interativa'}</p>
                   <button className="play-btn-v7-mission" onClick={onStartGame} style={{ background: currentColors.accent, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '2px' }}>
                      <span style={{ fontWeight: 900, fontSize: '15px' }}>شروع ماموریت</span>
                      <span style={{ fontSize: '10px' }}>(Começar Missão!)</span>
                   </button>
                </div>
             </div>
          </div>
        )}

        {current.type === 'brief' && (
          <div className="mission-horizontal-v7 brief-step">
             <div className="mission-intro-section-v7">
                <span className="mission-tag-v7" style={{ 
                   background: isCompleted ? '#dcfce7' : '#fef3c7', 
                   color: isCompleted ? '#16a34a' : '#92400e' 
                }}>
                   {isCompleted ? 'ماموریت انجام شد (MISSÃO COMPLETA)' : 'راهنمای مطالعه (GUIA DE ESTUDO)'}
                </span>
                <div className="unit-label-badge-v7">{unit.title.split('—')[0].trim()}</div>
                <h1 className="mission-subtitle-v7 main-theme">{unit.title.split('—')[1].trim()}</h1>
                <p className="mission-sub-v7 side" style={{ direction: 'rtl' }}>
                   محتوای تئوری را برای آماده شدن برای چالش‌های عملی مطالعه کنید.<br/>
                   <span style={{fontSize: '12px', opacity: 0.8}}>(Mergulhe no conteúdo teórico para se preparar para os desafios práticos.)</span>
                </p>
                <div className="mission-perks-v7">
                   <div className="perk-item-v7">📖 Leitura (مطالعه دقیق)</div>
                   <div className="perk-item-v7">💡 Dicas (نکات مهم)</div>
                </div>
             </div>
             
             <div className="game-launcher-mission">
                <div className="mission-center-v7">
                   {(() => {
                      const mainMedia = unit.external_links?.find(l => l.label === 'media' || l.label === 'video_file' || l.label === 'video' || l.label === 'HTML');
                      if (!mainMedia) return null;
                      const isCloudinary = mainMedia.url.includes('player.cloudinary.com');
                      const isVideo = mainMedia.label === 'video_file' || mainMedia.url.toLowerCase().endsWith('.mp4') || isCloudinary;

                      return (
                         <div style={{ width: '100%', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                            {isVideo ? (
                              isCloudinary ? (
                                (() => {
                                  try {
                                    const urlObj = new URL(mainMedia.url);
                                    const cloudName = urlObj.searchParams.get('cloud_name');
                                    const publicId = urlObj.searchParams.get('public_id');
                                    if (cloudName && publicId) {
                                      const directUrl = `https://res.cloudinary.com/${cloudName}/video/upload/${publicId}.mp4`;
                                      return <VideoPlayerV5 media={{ ...mainMedia, url: directUrl }} />;
                                    }
                                  } catch (e) {
                                    console.error("Erro ao converter URL do Cloudinary", e);
                                  }
                                  return (
                                    <div style={{ width: mainMedia.width || '100%', borderRadius: '16px', overflow: 'hidden', background: '#000', margin: '0 auto' }}>
                                      <iframe src={mainMedia.url} style={{ width: '100%', height: '240px', border: 'none' }} allow="autoplay; fullscreen" />
                                    </div>
                                  );
                                })()
                              ) : (
                                <VideoPlayerV5 media={mainMedia} />
                              )
                            ) : (
                              <img src={mainMedia.url} alt="Media" className="word-game-icon-3d" style={{ width: mainMedia.width || 'auto', maxWidth: '100%' }} />
                            )}
                            
                            {mainMedia.showSubtitles && mainMedia.caption && (
                              <p style={{ 
                                marginTop: '12px', 
                                fontSize: '18px', 
                                fontWeight: 600, 
                                color: '#1e293b', 
                                textAlign: 'center',
                                background: 'rgba(255,255,255,0.8)',
                                padding: '8px 20px',
                                borderRadius: '12px',
                                boxShadow: '0 4px 12px rgba(0,0,0,0.05)',
                                maxWidth: '90%'
                              }}>
                                {mainMedia.caption}
                              </p>
                            )}
                         </div>
                       );
                   })()}
                </div>
                <div className="mission-footer-v7">
                   <button className="play-btn-v7-mission" onClick={() => {
                       if (isAdmin) setIsEditingBrief(!isEditingBrief);
                       else handleNext();
                   }} style={{ background: '#f59e0b', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '2px' }}>
                      <span style={{ fontWeight: 900, fontSize: '15px' }}>{isAdmin ? 'Editar Conteúdo' : 'بیا شروع کنیم؟'}</span>
                      <span style={{ fontSize: '10px' }}>{isAdmin ? '' : 'Vamos começar?'}</span>
                   </button>
                </div>
             </div>
          </div>
        )}

        {current.type === 'embed' && (
          <div className={`mission-horizontal-v7 embed-step ${((current as EmbedStep).title?.toLowerCase().includes('video') || (current as EmbedStep).title?.toLowerCase().includes('aula')) ? 'is-video' : 'is-activity'}`}>
             <div className="mission-intro-section-v7">
                <span className="mission-tag-v7" style={{ 
                   background: isCompleted ? '#dcfce7' : ((current as EmbedStep).title?.toLowerCase().includes('video') || (current as EmbedStep).title?.toLowerCase().includes('aula')) ? '#e0f2fe' : '#fef3c7', 
                   color: isCompleted ? '#16a34a' : ((current as EmbedStep).title?.toLowerCase().includes('video') || (current as EmbedStep).title?.toLowerCase().includes('aula')) ? '#0369a1' : '#92400e' 
                }}>
                   {isCompleted ? 'MISSÃO COMPLETA' : ((current as EmbedStep).title?.toLowerCase().includes('video') || (current as EmbedStep).title?.toLowerCase().includes('aula')) ? 'VÍDEO AULA' : 'ATIVIDADE INTERATIVA'}
                </span>
                <div className="unit-label-badge-v7">{unit.title.split('—')[0].trim()}</div>
                <h1 className="mission-subtitle-v7 main-theme">{unit.title.split('—')[1].trim()}</h1>
                <p className="mission-sub-v7 side">
                   {((current as EmbedStep).title?.toLowerCase().includes('video') || (current as EmbedStep).title?.toLowerCase().includes('aula')) 
                     ? 'Assista ao vídeo interativo para reforçar seu aprendizado.' 
                     : 'Divirta-se praticando com este desafio interativo!'}
                </p>
             </div>

             <div className="game-launcher-mission embed-card-v7">
                <div className="mission-center-v7" style={{ cursor: 'pointer' }} onClick={() => previewRef.current?.open()}>
                   <div style={{ display: 'none' }}>
                     <EmbedPreview
                       key={(current as EmbedStep).url}
                       ref={previewRef}
                       url={(current as EmbedStep).url}
                       title={(current as EmbedStep).title || `Atividade ${(current as EmbedStep).idx + 1}`}
                       thumbnailUrl={unit.embed_preview_images?.[(current as EmbedStep).idx]}
                       maskIcon={(current as EmbedStep).maskIcon}
                       maskSize={(current as EmbedStep).maskSize}
                     />
                   </div>
                   <img src={memoryGameImg} alt="Interactive Activity Skin" className="word-game-icon-3d" />
                </div>
                <div className="mission-footer-v7" style={{ marginTop: 0 }}>
                   <h1 className="mission-footer-title">{(current as EmbedStep).title || 'Atividade'}</h1>
                   <p className="mission-mechanic">Mecânica: Atividade Interativa</p>
                   <button className="play-btn-v7-mission" onClick={() => previewRef.current?.open()} style={{ background: currentColors.accent }}>
                      Começar Missão!
                   </button>
                </div>
             </div>
          </div>
        )}

        {current.type === 'question' && (
          <div className="mission-horizontal-v7 question-step">
             <div className="mission-intro-section-v7 question-info" style={{ width: '100%' }}>
                <span className="mission-tag-v7" style={{ background: '#dcfce7', color: '#15803d' }}>DESAFIO PRÁTICO</span>
                <div className="question-wrapper-horizontal">
                   <QuestionBlock 
                     question={(current as QuestionStep).q}
                     index={(current as QuestionStep).idx}
                     unitId={unit.id}
                     color={unit.color}
                     isDone={!!answers[`${unit.id}-${(current as QuestionStep).idx}`]?.is_done}
                     savedAnswer={answers[`${unit.id}-${(current as QuestionStep).idx}`]?.answer_value || ''}
                     onSaveAnswer={(val) => onSaveAnswer((current as QuestionStep).idx, val)}
                     isAdmin={isAdmin}
                     onEdit={(newQ) => editQuestion((current as QuestionStep).idx, newQ)}
                     onDelete={() => deleteQuestion((current as QuestionStep).idx)}
                     isNew={(current as QuestionStep).q.q === 'Nova Pergunta'}
                   />
                </div>
             </div>
          </div>
        )}

        {current.type === 'report' && (
          <div className="mission-horizontal-v7 report-step">
             <div className="mission-intro-section-v7 report-info" style={{ width: '100%' }}>
                <span className="mission-tag-v7" style={{ background: '#f1f5f9', color: '#475569' }}>RELATÓRIO FINAL</span>
                <h1 className="mission-title-v7 side">Como foi hoje?</h1>
                <textarea 
                   className="report-textarea-v7"
                   value={note}
                   onChange={(e) => setNote(e.target.value)}
                   placeholder="Ex: A aluna demonstrou facilidade..."
                />
                <button 
                   className={`finish-btn-v7 ${sessionSuccess ? 'success' : ''}`}
                   onClick={handleSaveSession}
                   disabled={!note.trim() || isSavingSession}
                   style={{ background: sessionSuccess ? '#10b981' : currentColors.main }}
                 >
                   {isSavingSession ? 'Salvando...' : sessionSuccess ? 'Concluído! 🎉' : 'Finalizar e Salvar'}
                </button>
             </div>
          </div>
        )}

        {current.type === 'congratulations' && (
          <div className="mission-horizontal-v7 report-step">
             <div className="mission-intro-section-v7 report-info" style={{ width: '100%', alignItems: 'center', textAlign: 'center' }}>
                <span className="mission-tag-v7" style={{ background: '#dcfce7', color: '#16a34a' }}>
                   ماموریت انجام شد (MISSÃO COMPLETA)
                </span>
                <div style={{ fontSize: '70px', margin: '20px 0' }}>🏆</div>
                <h1 className="mission-title-v7 side" style={{ direction: 'rtl', margin: '0 0 10px 0' }}>
                   آفرین! شما این درس را تمام کردید.
                </h1>
                <p style={{ color: '#64748b', fontSize: '16px', marginBottom: '30px' }}>
                   (Parabéns! Você concluiu esta lição.)
                </p>
                <button 
                   className="finish-btn-v7 success"
                   onClick={async () => {
                      await completeLesson(unit.id, 50);
                      onToggle?.();
                   }}
                   style={{ background: '#10b981', padding: '16px 32px', borderRadius: '16px', color: 'white', fontWeight: 900, fontSize: '16px', border: 'none', cursor: 'pointer', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '4px' }}
                 >
                   <span>پایان و بازگشت</span>
                   <span style={{fontSize: '11px'}}>(Finalizar e Voltar)</span>
                </button>
             </div>
          </div>
        )}

        {isEditingBrief && (
           <div className="brief-editor-v5-modern premium-overlay">
             <div className="editor-container-v7">
                <div className="editor-header-v7">
                   <h2>Editor do Guia de Estudo</h2>
                   <p>Personalize o texto e gerencie as mídias desta unidade.</p>
                </div>

                <div className="editor-toolbar-v5">
                   <button onClick={() => insertTag('<b>', '</b>')} title="Negrito"><b>B</b></button>
                   <button onClick={() => insertTag('<i>', '</i>')} title="Itálico"><i>I</i></button>
                   <button onClick={() => insertTag('<h3 style="font-family: serif">', '</h3>')} title="Título">H</button>
                   <button onClick={() => insertTag('<p style="font-size: 1.2rem">', '</p>')} title="Texto Grande">T+</button>
                   <button onClick={() => insertTag('<ul><li>', '</li></ul>')} title="Lista">• Lista</button>
                   <button onClick={() => setTempBrief(tempBrief + '<br/>')} title="Pular Linha">↵</button>
                </div>

                <textarea 
                  value={tempBrief}
                  onChange={(e) => setTempBrief(e.target.value)}
                  className="brief-textarea-v5-modern"
                  placeholder="Escreva o guia aqui (suporta HTML)..."
                  autoFocus
                  id="brief-editor-textarea"
                />

                {/* Media Manager */}
                <div className="media-manager-v5">
                   <h4>Gerenciar Mídias (Imagens, GIFs, Vídeos, HTML)</h4>
                   <div className="media-edit-list">
                      {tempLinks.map((link, idx) => (
                         <div key={idx} className="media-edit-row">
                            <div className="media-preview-mini">
                               {link.label === 'HTML' ? '<div>' : link.url.includes('youtube.com') ? '📺' : '🖼️'}
                            </div>
                            <div className="media-edit-controls">
                               <input 
                                  value={link.url} 
                                  onChange={(e) => {
                                     const newLinks = [...tempLinks];
                                     newLinks[idx].url = e.target.value;
                                     setTempLinks(newLinks);
                                  }}
                                  placeholder="URL da mídia ou código HTML"
                                  className="media-url-input"
                               />
                               <div className="media-row-tools">
                                  <select 
                                     value={link.label}
                                     onChange={(e) => {
                                        const newLinks = [...tempLinks];
                                        newLinks[idx].label = e.target.value;
                                        setTempLinks(newLinks);
                                     }}
                                  >
                                     <option value="media">Imagem / GIF</option>
                                     <option value="HTML">Código HTML</option>
                                     <option value="video">YouTube</option>
                                     <option value="video_file">Vídeo (MP4)</option>
                                  </select>
                                  
                                  <div className="width-control-v5">
                                     <span>Largura:</span>
                                     <input 
                                        type="range" min="10" max="100" step="5"
                                        value={link.width?.replace('%', '') || '100'}
                                        onChange={(e) => {
                                           const newLinks = [...tempLinks];
                                           newLinks[idx].width = e.target.value + '%';
                                           setTempLinks(newLinks);
                                        }}
                                     />
                                     <span className="width-val">{link.width || '100%'}</span>
                                  </div>

                                  <div className="media-playback-tools-v5">
                                     <label className="playback-check">
                                        <input 
                                           type="checkbox" 
                                           checked={link.loop || false} 
                                           onChange={(e) => {
                                              const newLinks = [...tempLinks];
                                              newLinks[idx].loop = e.target.checked;
                                              setTempLinks(newLinks);
                                           }}
                                        />
                                        <span>Loop</span>
                                     </label>
                                      <label className="playback-check">
                                         <input 
                                            type="checkbox" 
                                            checked={link.showSubtitles || false} 
                                            onChange={(e) => {
                                               const newLinks = [...tempLinks];
                                               newLinks[idx].showSubtitles = e.target.checked;
                                               setTempLinks(newLinks);
                                            }}
                                         />
                                         <span>Legenda</span>
                                      </label>
                                     <button className="del-media-btn" onClick={() => setTempLinks(tempLinks.filter((_, i) => i !== idx))}>
                                        <Trash2 size={14} />
                                     </button>
                                  </div>
                                  {link.showSubtitles && (
                                     <div style={{ marginTop: '10px' }}>
                                        <input 
                                           type="text"
                                           value={link.caption || ''}
                                           onChange={(e) => {
                                              const newLinks = [...tempLinks];
                                              newLinks[idx].caption = e.target.value;
                                              setTempLinks(newLinks);
                                           }}
                                           placeholder="Escreva a legenda aqui..."
                                           style={{ 
                                              width: '100%', 
                                              padding: '8px 12px', 
                                              borderRadius: '10px', 
                                              border: '1px solid #e2e8f0',
                                              fontSize: '13px'
                                           }}
                                        />
                                     </div>
                                  )}
                               </div>
                            </div>
                         </div>
                      ))}
                   </div>
                   <button className="add-media-btn" onClick={() => setTempLinks([...tempLinks, { label: 'media', url: '' }])}>
                      <Plus size={14} /> Adicionar Nova Mídia
                   </button>
                </div>

                <div className="editor-actions-v5">
                   <button className="cancel-btn-v5" onClick={() => setIsEditingBrief(false)}>Cancelar</button>
                   <button 
                     className={`save-btn-v5 ${saveStatus}`}
                     disabled={saveStatus === 'saving'}
                     onClick={async () => {
                        setSaveStatus('saving');
                        const result = await handleUpdateUnitContent({ brief: tempBrief, external_links: tempLinks });
                        if (result.success) {
                           setSaveStatus('success');
                           setTimeout(() => {
                              setSaveStatus('idle');
                              setIsEditingBrief(false);
                           }, 1000);
                        } else {
                           setSaveStatus('error');
                        }
                     }}
                   >
                      {saveStatus === 'saving' ? 'Salvando...' : saveStatus === 'success' ? '✅ Salvo!' : 'Salvar Alterações'}
                   </button>
                </div>
             </div>
           </div>
        )}

        {showBriefViewer && !isAdmin && (
           <div className="brief-editor-v5-modern premium-overlay" style={{ background: 'rgba(255,255,255,0.95)', zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
             <div className="editor-container-v7" style={{ width: '90%', maxWidth: '800px', maxHeight: '85vh', overflowY: 'auto', background: 'white', borderRadius: '24px', padding: '40px', boxShadow: '0 20px 40px rgba(0,0,0,0.1)' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '2px solid #f1f5f9', paddingBottom: '20px', marginBottom: '30px' }}>
                   <h2 style={{ fontSize: '24px', fontWeight: 900, color: '#1e293b', margin: 0 }}>
                     Guia de Estudo
                   </h2>
                   <button onClick={() => setShowBriefViewer(false)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#64748b' }}>
                      <X size={24} />
                   </button>
                </div>
                <div 
                   className="brief-content-viewer" 
                   dangerouslySetInnerHTML={{ __html: unit.brief || '<p style="text-align:center; color:#94a3b8">Sem conteúdo.</p>' }} 
                   style={{ fontSize: '18px', lineHeight: '1.6', color: '#334155' }}
                />
                <button onClick={() => setShowBriefViewer(false)} style={{ marginTop: '40px', width: '100%', padding: '16px', borderRadius: '16px', background: '#10b981', color: 'white', border: 'none', cursor: 'pointer', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                   <span style={{ fontWeight: 900, fontSize: '16px' }}>بستن راهنما</span>
                   <span style={{ fontSize: '11px' }}>(FECHAR GUIA)</span>
                </button>
             </div>
           </div>
         )}

        {!unit.hide_nav && (
          <div className="step-counter-v7">
             {activeStep + 1} / {steps.length}
          </div>
        )}
      </div>

      {stepReward && (
        <div className="reward-popup-v5">
           ⭐ +10 XP
        </div>
      )}
    </div>
  );
};


interface UnitCardProps {
  unit: Unit;
  answers: Record<string, any>;
  onSaveAnswer: (qIdx: number, val: string) => Promise<boolean>;
  onSaveSession: (note: string) => Promise<boolean>;
  isAdmin?: boolean;
  isMediator?: boolean;
  onUpdateUnit?: (id: string, updates: Partial<Unit>) => Promise<{ success: boolean; error?: string }>;
  isExpanded: boolean;
  onToggle: () => void;
  onStartGame?: () => void;
  onGoHome?: () => void;
  isLocked?: boolean;
  isFirstUnit?: boolean;
  id?: string;
}

const getUnitIcon = (title: string, isLocked: boolean = false) => {
  const t = title.toLowerCase();
  
  let baseFilename = '';
  if (t.includes('cozinha') || t.includes('palavras da cozinha')) baseFilename = 'Aula 1 Vocabulário da Cozinha';
  else if (t.includes('compreensão oral') || t.includes('escuta')) baseFilename = 'Aula 2 Compreensão Oral';
  else if (t.includes('apresentação pessoal') || t.includes('nome')) baseFilename = 'Aula 3 Apresentação Pessoal';
  else if (t.includes('cotidiano') || t.includes('inglês no cotidiano')) baseFilename = 'Aula 4 Inglês no Cotidiano';
  else if (t.includes('digitais') || t.includes('gêneros')) baseFilename = 'Aula 5 Gêneros Digitais';
  else if (t.includes('receita')) baseFilename = 'Aula 6 Receita';
  else if (t.includes('cores') || t.includes('frutas')) baseFilename = 'Aula 7 Cores e Frutas';
  else if (t.includes('números') || t.includes('quantidade')) baseFilename = 'Aula 8 Números e Quantidade';

  if (baseFilename) {
    let lockedSuffix = '-não iniciada';
    if (baseFilename === 'Aula 6 Receita') {
       lockedSuffix = '-atividade não iniciada';
    }
    const imagePath = `/unit-icons/${baseFilename}${isLocked ? lockedSuffix : ''}.png`;
    return (
      <img 
        src={imagePath} 
        alt={title} 
        style={{ width: '100%', height: '100%', objectFit: 'contain', borderRadius: '12px' }} 
      />
    );
  }

  // Fallbacks
  if (t.includes('cozinha') || t.includes('kitchen')) return <ChefHat size={36} strokeWidth={1.5} />;
  if (t.includes('escuta') || t.includes('listening') || t.includes('família')) return <Headphones size={36} strokeWidth={1.5} />;
  if (t.includes('nome') || t.includes('gosto') || t.includes('perfil') || t.includes('intro')) return <User size={36} strokeWidth={1.5} />;
  if (t.includes('redor') || t.includes('city') || t.includes('around') || t.includes('cidade')) return <Building2 size={36} strokeWidth={1.5} />;
  if (t.includes('celular') || t.includes('digital') || t.includes('phone')) return <Smartphone size={36} strokeWidth={1.5} />;
  if (t.includes('receita') || t.includes('book') || t.includes('estudo')) return <BookOpen size={36} strokeWidth={1.5} />;
  return <GraduationCap size={36} strokeWidth={1.5} />;
};

export const UnitCard: React.FC<UnitCardProps> = ({ 
  unit, answers, onSaveAnswer, onSaveSession, isAdmin, isMediator, onUpdateUnit, isExpanded, onToggle, onStartGame, onGoHome, isLocked, isFirstUnit, id
}) => {
  // const [note, setNote] = useState('');
  // const [sessionSuccess, setSessionSuccess] = useState(false);
  
  // These are for future admin features or partially implemented ones
  // const [editingEmbedIdx, setEditingEmbedIdx] = useState<number | null>(null);
  // const [tempEmbedUrl, setTempEmbedUrl] = useState('');
  // const [showBrief, setShowBrief] = useState(false);
  // const [isEditingBrief, setIsEditingBrief] = useState(false);
  // const [tempBrief, setTempBrief] = useState(unit.brief || '');

  const currentColors = COLORS[unit.color] || COLORS.emerald || { main: '#10b981', light: '#ecfdf5', dark: '#064e3b' };

  const handleUpdateUnitContent = async (updates: Partial<Unit>) => {
    if (onUpdateUnit) {
      try {
        const result = await onUpdateUnit(unit.id, updates);
        return result;
      } catch (err: any) {
        console.error('Error updating unit:', err);
        return { success: false, error: err.message };
      }
    }
    return { success: false, error: 'Função de atualização não definida.' };
  };

  const deleteQuestion = (idx: number) => {
    if (window.confirm('Excluir esta pergunta permanentemente?')) {
      const newQs = [...unit.questions];
      newQs.splice(idx, 1);
      handleUpdateUnitContent({ questions: newQs });
    }
  };

  const editQuestion = (idx: number, newQ: Question) => {
    const newQs = [...unit.questions];
    newQs[idx] = newQ;
    handleUpdateUnitContent({ questions: newQs });
  };

  /*
  const deleteEmbed = (idx: number) => {
    if (window.confirm('Excluir este link interativo?')) {
    const newUrls = [...(unit.embed_urls || [])];
    newUrls.splice(idx, 1);
      handleUpdateUnitContent({ embed_urls: newUrls });
    }
  };

  const saveEmbedEdit = (idx: number) => {
    const newUrls = [...(unit.embed_urls || [])];
    newUrls[idx] = tempEmbedUrl;
    handleUpdateUnitContent({ embed_urls: newUrls });
    setEditingEmbedIdx(null);
  };
  */

  const { user } = useAuth();
  const { completeLesson } = useStudentJourney(user?.id || '');

  /*
  const handleSaveSession = async () => {
    ...
  };
  */

  const questionsDone = useMemo(() => {
    return unit.questions.filter((_, i) => answers[`${unit.id}-${i}`]?.is_done).length;
  }, [unit, answers]);

  const isComplete = questionsDone === unit.questions.length;

  return (
    <div id={id} 
      className={`lesson-card-v7 ${isExpanded ? 'expanded' : ''} ${isLocked ? 'lock-overlay-v7' : ''} ${!isLocked && !isComplete ? 'active' : ''}`}
      onClick={() => !isLocked && !isExpanded && onToggle()}
    >
      {!isExpanded && (
        <>
          <span className="lesson-icon-v7">
            {getUnitIcon(unit.title, isLocked)}
          </span>
          <div className="lesson-title-v7">{unit.title}</div>
          
          {!isLocked && !isComplete && (
            <button className="btn-start-v7">Começar Agora!</button>
          )}

          {isComplete && (
            <div className="unit-status-badge-v7" style={{ color: '#10b981', fontWeight: 900, fontSize: '12px' }}>
              CONCLUÍDO ✓
            </div>
          )}

          {isLocked && (
             <Lock size={20} style={{ opacity: 0.5 }} />
          )}
        </>
      )}


        {isExpanded && (
        <div className="unit-body-v4">
          <StepNavigation 
            unit={unit} 
            answers={answers} 
            onSaveAnswer={onSaveAnswer}
            isAdmin={isAdmin}
            isMediator={isMediator}
            editQuestion={editQuestion}
            deleteQuestion={deleteQuestion}
            currentColors={currentColors}
            onStartGame={onStartGame}
            handleUpdateUnitContent={handleUpdateUnitContent}
            onSaveSession={onSaveSession}
            onToggle={onToggle}
            completeLesson={completeLesson}
            isFirstUnit={isFirstUnit}
            onGoHome={onGoHome}
          />
        </div>
      )}
    </div>
  );
};

// Local helper for skill badges mapping
export const getSkillBadge = (tag: string) => {
  const map: Record<string, string> = {
    'D2': 'Vocabulário 🍎',
    'D3': 'Gramática ✍️',
    'D5': 'Escuta 🎧',
    'D10': 'Conversa 🗣️'
  };
  return map[tag] || tag;
};

export const Activities: React.FC<{ 
  units: Unit[]; 
  answers: Record<string, any>; 
  onSaveAnswer: (uId: string, qIdx: number, val: string) => Promise<boolean>; 
  onSaveSession: (uId: string, note: string) => Promise<boolean>;
  isAdmin?: boolean;
  isMediator?: boolean;
  onUpdateUnit?: (uId: string, updates: Partial<Unit>) => Promise<{ success: boolean; error?: string }>;
  onCreateUnit?: (title: string) => Promise<boolean>;
  onGameOver?: (score: number, words: number) => void;
  initialExpandedId?: string | null;
  onGoHome?: () => void;
  onToggle?: () => void;
}> = ({ units, answers, onSaveAnswer, onSaveSession, isAdmin, isMediator, onUpdateUnit, onCreateUnit, onGameOver, initialExpandedId, onGoHome, onToggle }) => {
  const [expandedUnitId, setExpandedUnitId] = useState<string | null>(initialExpandedId ?? null);
  const [activeGameUnitId, setActiveGameUnitId] = useState<string | null>(null);

  React.useEffect(() => {
    setExpandedUnitId(initialExpandedId ?? null);
  }, [initialExpandedId]);

  const isFirstRender = React.useRef(true);
  
  // Always start at the exact top position when the page loads
  React.useEffect(() => {
    window.scrollTo({ top: 0, behavior: 'instant' });
  }, []);


  React.useEffect(() => {
    if (expandedUnitId) {
      document.body.classList.add('immersive-mode');
    } else {
      document.body.classList.remove('immersive-mode');
    }
    return () => document.body.classList.remove('immersive-mode');
  }, [expandedUnitId]);

  React.useEffect(() => {
    if (expandedUnitId) {
      console.log('Centering unit:', expandedUnitId);
      const behavior = isFirstRender.current ? 'instant' : 'smooth';
      const timer = setTimeout(() => {
        const element = document.getElementById(`unit-${expandedUnitId}`);
        if (element) {
          element.scrollIntoView({ behavior, block: 'start' });
        }
        isFirstRender.current = false;
      }, isFirstRender.current ? 10 : 100);
      return () => clearTimeout(timer);
    } else {
      isFirstRender.current = false;
    }
  }, [expandedUnitId]);

  
  const handleCreateUnit = async () => {
    const title = window.prompt('Qual o título da nova unidade?');
    if (title && onCreateUnit) {
      await onCreateUnit(title);
    }
  };

  const sortedUnits = useMemo(() => {
    if (!units || !Array.isArray(units)) return [];
    return [...units].sort((a, b) => {
      const numA = parseInt(a.title.match(/\d+/)?.[0] || '999');
      const numB = parseInt(b.title.match(/\d+/)?.[0] || '999');
      
      if (numA !== numB) return numA - numB;
      
      // Fallback to sort_order if numbers are same or missing
      if (a.sort_order !== undefined && b.sort_order !== undefined) {
        return a.sort_order - b.sort_order;
      }
      return 0;
    });
  }, [units]);

  return (
    <div className={`screen activities-screen ${expandedUnitId ? 'has-expanded' : ''}`}>
      {!expandedUnitId ? (
        <div className="dashboard-v7-wrapper">
          <div className="profile-header-image-style">
            <div className="avatar-and-name">
              <div className="avatar-v7">
                 <img src="https://media.giphy.com/media/v1.Y2lkPTc5MGI3NjExOHpueGtxZ2txZ2txZ2txZ2txZ2txZ2txZ2txZ2txZ2txZ2txZ2txJmVwPXYxX2ludGVybmFs_giF_by_id&ct=s/3o7TKMGfN9qN3Z4Jq0/giphy.gif" alt="avatar" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
              </div>
              <div className="user-text-v7">
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                   <h2 style={{ fontSize: '22px', margin: 0, fontWeight: 900 }}>خوش آمدید (Oi)!</h2>
                   <span style={{ fontSize: '24px' }}>☀️</span>
                </div>
                <div className="xp-bar-mini">
                   <div className="xp-fill-mini" style={{ width: '15%' }}></div>
                </div>
                <small style={{ direction: 'rtl' }}>پیشرفت <span style={{fontSize: '9px'}}>(0% da Jornada)</span> | XP: 34/2000</small>
              </div>
              <div className="level-hexagon">
                 <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', lineHeight: '1.1', marginBottom: '2px' }}>
                   <span style={{ fontSize: '11px', fontWeight: 900, direction: 'rtl', textTransform: 'none' }}>سطح</span>
                   <span style={{ fontSize: '8px', fontWeight: 800 }}>(NÍVEL)</span>
                 </div>
                 <span style={{ fontSize: '18px' }}>1</span>
              </div>
            </div>
            <div className="stats-v7">
              <div className="stats-pill-red">🔥 0 Dias <small style={{ fontSize: '8px', display: 'block', opacity: 0.7 }}>شعله (CHAMA)</small></div>
              <div className="stats-pill-yellow">💰 2 <small style={{ fontSize: '8px', display: 'block', opacity: 0.7 }}>سکه (COINS)</small></div>
            </div>
          </div>

          <div className="mission-banner-v7">
            <span className="jornada-badge-v7" style={{background: '#dbeafe', color: '#1e40af'}}>سفر یادگیری (JORNADA)</span>
            <h1 style={{ direction: 'rtl', textAlign: 'right' }}>ماژول ۱ — اولین قدم‌ها <br/><span style={{fontSize: '14px', color: '#64748b'}}>(Módulo 1 — Primeiros Passos)</span></h1>
            <p style={{ direction: 'rtl', textAlign: 'right' }}>
               برای دریافت جام برنز، تمام {sortedUnits.length} درس را کامل کنید!<br/>
               <span style={{fontSize: '12px'}}>(Complete as {sortedUnits.length} aulas para ganhar o troféu de bronze!)</span>
            </p>
          </div>

          <div className="lessons-grid-v7">
            {sortedUnits.map((unit, index) => {
              const isFirst = index === 0;
              const prevUnit = index > 0 ? sortedUnits[index - 1] : null;
              const prevComplete = prevUnit ? prevUnit.questions.every((_, i) => answers[`${prevUnit.id}-${i}`]?.is_done) : true;
              const isLocked = !isAdmin && (unit.is_locked || (!isFirst && !prevComplete));

              return (
                <UnitCard 
                  key={unit.id} 
                  id={`unit-${unit.id}`}
                  unit={unit} 
                  answers={answers}
                  onSaveAnswer={(qIdx, val) => onSaveAnswer(unit.id, qIdx, val)}
                  onSaveSession={(note) => onSaveSession(unit.id, note)}
                  isAdmin={isAdmin}
                  isMediator={isMediator}
                  onUpdateUnit={onUpdateUnit}
                  isExpanded={expandedUnitId === unit.id}
                  onToggle={() => setExpandedUnitId(expandedUnitId === unit.id ? null : unit.id)}
                  onStartGame={() => setActiveGameUnitId(unit.id)}
                  onGoHome={onGoHome || (() => {})}
                  isLocked={isLocked}
                  isFirstUnit={isFirst}
                />
              );
            })}
          </div>
        </div>
      ) : (
        <div className="unit-grid-container expanded-view">
          {sortedUnits.filter(u => u.id === expandedUnitId).map((unit) => (
            <UnitCard 
              key={unit.id} 
              id={`unit-${unit.id}`}
              unit={unit} 
              answers={answers}
              onSaveAnswer={(qIdx, val) => onSaveAnswer(unit.id, qIdx, val)}
              onSaveSession={(note) => onSaveSession(unit.id, note)}
              isAdmin={isAdmin}
              isMediator={isMediator}
              onUpdateUnit={onUpdateUnit}
              isExpanded={true}
              onToggle={() => setExpandedUnitId(null)}
              onStartGame={() => setActiveGameUnitId(unit.id)}
              onGoHome={onGoHome || (() => {})}
              isLocked={false}
              isFirstUnit={false}
            />
          ))}
        </div>
      )}

      {activeGameUnitId && (
        <div className="game-screen-overlay">
          {(() => {
            const unit = sortedUnits.find(u => u.id === activeGameUnitId);
            const fallbackWords = [
              { pt: 'Colher', en: 'Spoon', icon: '🥄' },
              { pt: 'Garfo', en: 'Fork', icon: '🍴' },
              { pt: 'Faca', en: 'Knife', icon: '🔪' },
              { pt: 'Prato', en: 'Plate', icon: '🍽️' },
              { pt: 'Copo', en: 'Glass', icon: '🥛' },
              { pt: 'Panela', en: 'Pot', icon: '🍲' },
              { pt: 'Geladeira', en: 'Fridge', icon: '🧊' },
              { pt: 'Fogão', en: 'Stove', icon: '🔥' },
              { pt: 'Forno', en: 'Oven', icon: '⏲️' },
              { pt: 'Pia', en: 'Sink', icon: '🚰' }
            ];
            
            const rawWords = unit?.vocabulary_list && unit.vocabulary_list.length > 0 ? unit.vocabulary_list : fallbackWords;
            const sanitizedWords = rawWords.map((w: any) => {
              if (typeof w === 'string') return { en: w, pt: w, icon: '🏷️' };
              return w;
            });
            
            return (
              <WordFallGame 
                unitTitle={unit?.title || 'Desafio de Digitação'}
                words={sanitizedWords} 
                onGameOver={(s: number, w: number) => {
                  if (onGameOver) onGameOver(s, w);
                }}
                onBack={() => setActiveGameUnitId(null)}
              />
            );
          })()}
        </div>
      )}

      {isAdmin && (
        <div style={{ padding: '0 16px 40px' }}>
          <button 
            className="admin-add-btn premium" 
            onClick={handleCreateUnit}
            style={{ width: '100%', padding: '18px' }}
          >
            <Plus size={20} /> Criar Nova Unidade / Aula
          </button>
        </div>
      )}
    </div>
  );
};
