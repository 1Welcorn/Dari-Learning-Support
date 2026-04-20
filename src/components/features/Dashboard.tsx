import { BookOpen, Star, ArrowRight, CheckCircle2, Trophy, Sparkles, MessageCircle } from 'lucide-react';
import type { Unit } from '../../types';

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
      {/* HERO SECTION - PROFILE CARD */}
      <div className="platform-header profile-hero-layout">
        <div className="profile-main-info">
          <div className="avatar-container">
            <div className="avatar-ring"></div>
            <div className="avatar-circle">I</div>
            <div className="level-badge">Lv.1</div>
          </div>
          <div className="greeting-text">
            <span className="welcome-tag">ESTUDANTE EXPLORADORA</span>
            <h1 className="welcome-title">Olá, Ione! 👋</h1>
            <p className="welcome-subtitle">Você já conquistou <strong>{completedPct}%</strong> da sua jornada!</p>
          </div>
        </div>
        
        <div className="header-stats-mini">
           <div className="mini-stat">
              <Star size={18} className="stat-icon" />
              <span>{sessionsCount} Estrelas</span>
           </div>
           <div className="mini-stat">
              <Trophy size={18} className="stat-icon" />
              <span>Nível 1</span>
           </div>
        </div>
      </div>

      {/* NEXT UP / HERO CARD V2 */}
      <div className="next-up-card-v2" onClick={() => onNavigate('activities')}>
        {/* Decorative Blur Element */}
        <div className="next-up-blur-decor"></div>
        
        <div className="next-up-content-v2">
          <div className="next-up-main-text">
            <span className="next-up-badge">
              Próximo Desafio 🏆
            </span>
            <h2 className="next-up-title-v2">{nextUnit?.title || 'Inglês 2026'}</h2>
            <p className="next-up-quote">
              "{nextUnit?.sub?.split('·')[0]?.trim() || 'Prepare-se para o próximo passo!'}"
            </p>
            
            <button className="next-up-btn-v2">
              PARTIU! 🚀
            </button>
          </div>

          <div className="next-up-icon-wrapper">
            <div className="next-up-emoji-v2">
              {nextUnit?.title?.toLowerCase().includes('cozinha') ? '🍳' : 
               nextUnit?.title?.toLowerCase().includes('escuta') ? '🎧' :
               nextUnit?.title?.toLowerCase().includes('nome') ? '🙋‍♀️' :
               nextUnit?.title?.toLowerCase().includes('redor') ? '🔍' :
               nextUnit?.title?.toLowerCase().includes('celular') ? '📱' :
               nextUnit?.title?.toLowerCase().includes('receita') ? '🍽️' : '🚀'}
            </div>
          </div>
        </div>
      </div>

      {/* GAMIFIED STATS */}
      <div className="gamified-stats">
        <div className="stat-pill">
          <div className="pill-icon trophy"><Trophy size={20} /></div>
          <div className="stat-text">
            <strong>Nível 1</strong>
            <span>Exploradora</span>
          </div>
        </div>
        <div className="stat-pill">
          <div className="pill-icon sessions"><Star size={20} /></div>
          <div className="stat-text">
            <strong>{sessionsCount}</strong>
            <span>Estrelas</span>
          </div>
        </div>
      </div>

      {/* CURRICULUM PATH */}
      <div className="curriculum-section">
        <div className="section-header">
          <h2 className="section-title">Mapa de Aprendizado</h2>
          <p className="section-subtitle">Siga os caminhos para conquistar novas habilidades!</p>
        </div>

        <div className="learning-path-trail">
          {units.map((unit, idx) => {
             const questionsDone = unit.questions?.filter((_, i) => answers[`${unit.id}-${i}`]?.is_done).length || 0;
             const totalQuestions = unit.questions?.length || 1;
             const isDone = questionsDone === totalQuestions;
             const isCurrent = questionsDone > 0 && !isDone;
             
             return (
              <div 
                key={unit.id} 
                className={`path-node ${unit.color} ${isDone ? 'is-done' : ''} ${isCurrent ? 'is-current' : ''}`}
                onClick={() => onNavigate('activities')}
              >
                <div className="node-connector"></div>
                <div className="node-card">
                  <div className="node-visual">
                    <div className="node-icon-bg">
                      {isDone ? <CheckCircle2 size={24} /> : idx === 0 || isCurrent ? <Sparkles size={24} /> : <BookOpen size={24} />}
                    </div>
                    <div className="node-progress-mini">
                       <div className="node-progress-fill" style={{ height: `${(questionsDone/totalQuestions)*100}%` }}></div>
                    </div>
                  </div>
                  
                  <div className="node-info">
                    <div className="node-top-row">
                      <span className="node-step">ETAPA {idx + 1}</span>
                      {isDone && <span className="node-badge done">CONCLUÍDO</span>}
                      {isCurrent && <span className="node-badge current">EM FOCO</span>}
                    </div>
                    <h3 className="node-title">{unit.title}</h3>
                    <p className="node-desc">{unit.sub || 'Explore este módulo'}</p>
                    
                    <div className="node-footer">
                       <span className="node-stat">{questionsDone}/{totalQuestions} Atividades</span>
                       <div className="node-go-btn">
                          {isDone ? 'Revisar' : 'Continuar'} <ArrowRight size={14} />
                       </div>
                    </div>
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
