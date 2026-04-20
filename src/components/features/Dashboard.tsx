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
            <img 
              src="https://api.dicebear.com/7.x/avataaars/svg?seed=Ione" 
              alt="Avatar" 
              className="avatar-mini-img"
            />
            <div className="level-tag">LVL 1</div>
          </div>
          <div className="profile-mini-text">
            <h1 className="profile-mini-title">Olá, Ione! 👋</h1>
            <p className="profile-mini-sub">Você já conquistou {completedPct}% da sua jornada!</p>
          </div>
        </div>

        <div className="stats-mini-bar">
          <div className="stat-pill-v2">
            <Star className="text-yellow-400 fill-yellow-400" size={20} />
            <span className="font-black text-slate-700">{sessionsCount * 10} Estrelas</span>
          </div>
          <div className="stat-pill-v2">
            <Flame className="text-orange-500" size={20} />
            <span className="font-black text-slate-700">3 dias!</span>
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
                <div className="journey-card-v3">
                  <div className="node-icon-bg-v3" style={{ background: isDone ? '#dcfce7' : '#f1f5f9' }}>
                    {isDone ? <ChefHat size={32} color="#10b981" /> : <Trophy size={32} color="#94a3b8" />}
                  </div>
                  
                  <div className="journey-node-info">
                    <p className="node-status-tag">{isDone ? 'ETAPA ' + (idx + 1) + ' • CONCLUÍDO' : 'ETAPA ' + (idx + 1) + ' • BLOQUEADO'}</p>
                    <h3 className="node-card-title-v3">{unit.title}</h3>
                    <p className="node-card-stat-v3">{questionsDone}/{totalQuestions} Atividades</p>
                  </div>

                  <div className="journey-node-visual">
                     {idx === 0 && <img src={pan3d} alt="Pan" className="node-3d-img-multiply" />}
                     {!isDone && !isLocked && <div className="node-lock-v3">🔓</div>}
                     {isDone && <div className="node-done-check-v3">COMPLETO</div>}
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
