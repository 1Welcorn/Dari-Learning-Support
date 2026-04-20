import { BookOpen, Star, ArrowRight, CheckCircle2, Trophy, Sparkles, MessageCircle, Flame } from 'lucide-react';
import type { Unit } from '../../types';
import robot3d from '../../assets/robot-3d.png';
import pan3d from '../../assets/pan-3d.png';

interface DashboardProps {
  onNavigate: (screen: string) => void;
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

  return (
    <div className="screen-home platform-view landing-style">
      {/* BACKGROUND BLOBS */}
      <div className="bg-blob blob-1"></div>
      <div className="bg-blob blob-2"></div>
      <div className="bg-blob blob-3"></div>

      {/* HERO SECTION - PROFILE CARD */}
      <div className="dashboard-top-row">
        <div className="profile-hero-mini">
          <div className="avatar-mini-container">
            <div className="avatar-mini">I</div>
            <div className="level-tag">Nível 1</div>
          </div>
          <div className="profile-mini-text">
            <span className="profile-mini-tag">ESTUDANTE EXPLORADORA</span>
            <h1 className="profile-mini-title">Olá, Ione! 👋</h1>
            <p className="profile-mini-sub">Você já conquistou 50% de nass per unida!</p>
          </div>
        </div>

        <div className="stats-mini-bar">
          <div className="stat-item">
            <div className="stat-icon-bg stars"><Star size={24} fill="#fbbf24" color="#fbbf24" /></div>
            <div className="stat-val-group">
              <span className="stat-label">Estrelas</span>
              <span className="stat-value">{sessionsCount * 10} Estrelas</span>
            </div>
          </div>
          <div className="stat-item">
            <div className="stat-icon-bg streak"><Flame size={24} fill="#f97316" color="#f97316" /></div>
            <div className="stat-val-group">
              <span className="stat-label">Streak</span>
              <span className="stat-value">3 dias!</span>
            </div>
          </div>
        </div>
      </div>

      {/* NEXT UP / MISSION CARD */}
      <div className="mission-card" onClick={() => onNavigate('activities')}>
        <div className="mission-content">
          <span className="mission-tag">CONTINUAR ESTUDOS</span>
          <h2 className="mission-title">
             🚀 SUA MISSÃO ATUAL: {nextUnit?.title || 'Unidade 2'}
          </h2>
          <p className="mission-quote">
            "{nextUnit?.sub?.split('·')[0]?.trim() || 'Prepare-se para o próximo passo!'}"
          </p>
          
          <button className="mission-btn">
            PARTIU! ⚡
          </button>
        </div>

        <div className="mission-visual">
           <img src={robot3d} alt="Robot" className="mission-robot" />
        </div>
      </div>

      {/* CURRICULUM JOURNEY */}
      <div className="journey-section">
        <div className="journey-header">
           <h2 className="journey-title">🚀 SUA JORNADA DE CONQUISTAS</h2>
        </div>

        <div className="journey-trail">
          {units.map((unit, idx) => {
             const questionsDone = unit.questions?.filter((_, i) => answers[`${unit.id}-${i}`]?.is_done).length || 0;
             const totalQuestions = unit.questions?.length || 1;
             const isDone = questionsDone === totalQuestions;
             const isLocked = idx > 0 && !units[idx-1].questions.every((_, i) => answers[`${units[idx-1].id}-${i}`]?.is_done);
             
             return (
              <div 
                key={unit.id} 
                className={`journey-node ${isDone ? 'is-done' : ''} ${isLocked ? 'is-locked' : ''}`}
                onClick={() => !isLocked && onNavigate('activities')}
              >
                <div className="node-connector"></div>
                <div className="journey-card">
                  <div className="node-icon-visual">
                    {isDone ? <CheckCircle2 size={24} color="#10b981" /> : <div className="node-circle"></div>}
                  </div>
                  
                  <div className="journey-node-info">
                    <span className="node-unit-tag">UNID. {idx + 1}</span>
                    <h3 className="node-card-title">{unit.title}</h3>
                    <p className="node-card-sub">{unit.sub?.split('·')[0]}</p>
                    <span className="node-card-stat">{questionsDone}/{totalQuestions} Atividades</span>
                  </div>

                  <div className="journey-node-visual">
                     {idx === 0 && <img src={pan3d} alt="Pan" className="node-3d-img" />}
                     {isLocked && <div className="node-lock">🔒</div>}
                     {isDone && <div className="node-done-check">2/2</div>}
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
