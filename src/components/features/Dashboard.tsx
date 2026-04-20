import { Star, CheckCircle2, Trophy, Sparkles, MessageCircle, Flame, Rocket, Play } from 'lucide-react';
import type { Unit } from '../../types';
import { useAuth } from '../../context/AuthContext';
import { useStudentJourney } from '../../hooks/useStudentJourney';

interface DashboardProps {
  onNavigate: (screen: string, unitId?: string) => void;
  units: Unit[];
  answers: Record<string, any>;
  completedPct: number;
  sessionsCount: number;
  lastSessionDate: string;
  mediatorName: string;
  mediatorPhone: string;
  studentEmail?: string;
}

export const Dashboard: React.FC<DashboardProps> = ({
  onNavigate,
  units,
  answers,
  completedPct,
  sessionsCount,
  mediatorName,
  mediatorPhone,
}) => {
  const { user } = useAuth();
  const { stats, progress, loading: journeyLoading } = useStudentJourney(user?.id || '');

  // Dynamic values from Supabase stats
  const currentXP = stats?.xp || 0;
  const currentLevel = stats?.level || 1;
  const currentStreak = stats?.streak || 0;
  const totalStars = stats?.stars || (sessionsCount * 10); // Fallback to calculation if profile not setup

  const completedUnits = units.filter(unit => {
    const questionsDone = unit.questions?.filter((_, i) => answers[`${unit.id}-${i}`]?.is_done).length || 0;
    return questionsDone === (unit.questions?.length || 1);
  }).length;
  
  const completedPct = Math.round((completedUnits / (units.length || 1)) * 100);

  const handleSupportClick = () => {
    const text = `Olá Prof. ${mediatorName}, sou a Ione! Preciso de uma ajuda com as atividades de hoje.`;
    const cleanPhone = mediatorPhone.replace(/\D/g, '');
    window.open(`https://wa.me/${cleanPhone}?text=${encodeURIComponent(text)}`, '_blank');
  };

  const nextUnit = units.find(unit => {
    const questionsDone = unit.questions?.filter((_, i) => answers[`${unit.id}-${i}`]?.is_done).length || 0;
    const totalQuestions = unit.questions?.length || 0;
    return questionsDone < totalQuestions;
  }) || units[0];

  if (journeyLoading) return <div className="screen-loading">Carregando sua jornada...</div>;

  return (
    <div className="screen-home platform-view landing-style">
      {/* HERO SECTION - PROFILE CARD */}
      <div className="adventure-header">
        <div className="kid-profile">
          <div className="kid-avatar-wrapper">
             <div className="kid-avatar">I</div>
             <div className="kid-level">Lvl {currentLevel}</div>
          </div>
          <div className="kid-text">
            <h1 className="kid-name">Oi, Ione! 🌟</h1>
            <p className="kid-sub">Você já completou {completedPct}% da aventura!</p>
          </div>
        </div>

        <div className="kid-stats">
          <div className="kid-stat-pill orange">
            <Star size={20} fill="currentColor" />
            <span>{totalStars}</span>
          </div>
          <div className="kid-stat-pill blue">
            <Flame size={20} fill="currentColor" />
            <span>{currentStreak} Dias</span>
          </div>
        </div>
      </div>

      {/* FLOATING MISSION CARD */}
      <div className="mission-island-container">
        <div className="mission-island" onClick={() => onNavigate('activities', nextUnit?.id)}>
          <div className="mission-tag-v4">SUA MISSÃO AGORA</div>
          <h2 className="mission-title-v4">{nextUnit?.title || 'Unidade 2'}</h2>
          <p className="mission-subtitle-v4">"{nextUnit?.sub?.split('·')[0]?.trim() || 'Vamos aprender algo novo?'}"</p>
          
          <button className="mission-go-btn">
            COMEÇAR! <Play size={20} fill="currentColor" />
          </button>
          
          <div className="mission-decoration">
            <Rocket size={80} color="rgba(255,255,255,0.2)" />
          </div>
        </div>
      </div>

      {/* ADVENTURE TRAIL */}
      <div className="adventure-trail-section">
        <div className="trail-title-group">
          <h2 className="trail-title">Caminho do Conhecimento</h2>
          <div className="trail-subtitle">Siga os passos para ganhar estrelas!</div>
        </div>

        <div className="adventure-path">
          <div className="path-line-main"></div>
          
          {units.map((unit, idx) => {
             // Find if the student has progress for THIS specific unit from useStudentJourney
             const unitProgress = progress.find(p => p.unit_id === unit.id);
             
             // Questions-based logic (fallback)
             const questionsDone = unit.questions?.filter((_, i) => answers[`${unit.id}-${i}`]?.is_done).length || 0;
             const totalQuestions = unit.questions?.length || 1;
             const isQuestionsDone = questionsDone === totalQuestions;
             
             // User's requested logic: check if status is 'completed'
             const isDone = unitProgress?.status === 'completed' || isQuestionsDone;
             
             // Logic: Unit is unlocked if it's the first one OR the previous one is completed
             const prevUnitProgress = idx > 0 ? progress.find(p => p.unit_id === units[idx-1].id) : null;
             const prevUnitQuestionsDone = idx > 0 ? units[idx-1].questions.every((_, i) => answers[`${units[idx-1].id}-${i}`]?.is_done) : true;
             
             const isUnlocked = idx === 0 || prevUnitProgress?.status === 'completed' || prevUnitQuestionsDone;
             const isLocked = !isUnlocked;
             
             // Vibrant colors for islands
             const colors = ['#FF6B6B', '#4ECDC4', '#FFD93D', '#6C5CE7', '#FF8E3C', '#2ECC71'];
             const color = colors[idx % colors.length];

             return (
              <div 
                key={unit.id} 
                className={`adventure-node ${isDone ? 'is-complete' : ''} ${isLocked ? 'is-locked' : ''} ${idx % 2 === 0 ? 'left' : 'right'}`}
                onClick={() => !isLocked && onNavigate('activities', unit.id)}
              >
                <div className="island-node" style={{ backgroundColor: isLocked ? '#E2E8F0' : color }}>
                   <div className="island-icon">
                      {isDone ? <CheckCircle2 size={32} /> : 
                       isLocked ? <Trophy size={32} /> : 
                       <Sparkles size={32} />}
                   </div>
                   {isDone && <div className="island-badge">✓</div>}
                </div>
                
                <div className="island-info">
                   <div className="island-unit-num">MÓDULO {idx + 1}</div>
                   <h3 className="island-title">{unit.title}</h3>
                   <div className="island-progress">
                      <div className="progress-bar-mini">
                         <div className="progress-fill-mini" style={{ width: `${(questionsDone/totalQuestions)*100}%`, backgroundColor: color }}></div>
                      </div>
                      <span>{questionsDone}/{totalQuestions}</span>
                   </div>
                </div>
              </div>
             );
          })}
        </div>
      </div>

      {/* MEDIATOR SUPPORT CARD */}
      <div className="mediator-support-section">
        <div className="section-header">
          <h2 className="section-title">Acompanhamento</h2>
          <p className="section-subtitle">Sua mediadora está aqui para te ajudar em cada passo.</p>
        </div>

        <div className="mediator-card">
          <div className="med-avatar-container">
            <div className="med-avatar-circle">
               {mediatorName.charAt(0)}
            </div>
            <div className="med-status-dot"></div>
          </div>
          
          <div className="med-details">
            <h3 className="med-name">Prof. {mediatorName}</h3>
            <p className="med-role">Mediadora de Aprendizado</p>
          </div>

          <button className="med-whatsapp-btn" onClick={handleSupportClick}>
            <MessageCircle size={20} />
            <span>Chamar no WhatsApp</span>
          </button>
        </div>
      </div>
    </div>
  );
};
