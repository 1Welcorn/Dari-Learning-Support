import { Star, CheckCircle2, Trophy, Sparkles, MessageCircle, Flame, Play } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useStudentJourney } from '../../hooks/useStudentJourney';
import { useDashboardData } from '../../hooks/useDashboardData';

interface DashboardProps {
  onNavigate: (screen: string, unitId?: string) => void;
  completedPct: number;
  sessionsCount: number;
  mediatorName: string;
  mediatorPhone: string;
}

export const Dashboard: React.FC<DashboardProps> = ({
  onNavigate,
  completedPct,
  sessionsCount,
  mediatorName,
  mediatorPhone,
}) => {
  const { user } = useAuth();
  const { stats, loading: statsLoading } = useStudentJourney(user?.id || '');
  const { units, loading: journeyLoading } = useDashboardData(user?.id || '');

  console.log('Dashboard units data:', units);

  // Dynamic values from Supabase stats
  const currentLevel = stats?.level || 1;
  const currentStreak = stats?.streak || 0;
  const totalStars = stats?.stars || (sessionsCount * 10);

  const handleSupportClick = () => {
    const text = `Olá Prof. ${mediatorName}, sou a Ione! Preciso de uma ajuda com as atividades de hoje.`;
    const cleanPhone = mediatorPhone.replace(/\D/g, '');
    window.open(`https://wa.me/${cleanPhone}?text=${encodeURIComponent(text)}`, '_blank');
  };

  const nextUnit = units.find(u => u.unit_status !== 'completed') || units[0];

  if (journeyLoading || statsLoading) return <div className="screen-loading">Carregando sua jornada...</div>;

  return (
    <div className="screen-home platform-view landing-style single-page-mode">
      {/* TOP BAR: PROFILE, STATS & MISSION */}
      <div className="dash-top-bar-v4">
        <div className="dash-profile-group">
          <div className="kid-avatar-wrapper mini">
             <div className="kid-avatar">I</div>
             <div className="kid-level">Lvl {currentLevel}</div>
          </div>
          <div className="kid-text">
            <h1 className="kid-name">Oi, Ione! 🌟</h1>
            <p className="kid-sub">{completedPct}% da aventura!</p>
          </div>
        </div>

        <div className="dash-stats-group">
          <div className="kid-stat-pill orange">
            <Star size={18} fill="currentColor" />
            <span>{totalStars}</span>
          </div>
          <div className="kid-stat-pill blue">
            <Flame size={18} fill="currentColor" />
            <span>{currentStreak} Dias</span>
          </div>
        </div>

        <div className="dash-mission-mini" onClick={() => onNavigate('activities', nextUnit?.unit_id)}>
          <div className="mission-content-mini">
            <span className="mission-tag-mini">MISSÃO ATUAL</span>
            <span className="mission-title-mini">{nextUnit?.unit_title || 'Unidade 1'}</span>
          </div>
          <button className="mission-btn-mini"><Play size={16} fill="currentColor" /></button>
        </div>
      </div>

      {/* CENTER: ADVENTURE TRAIL GRID */}
      <div className="dash-main-area-v4">
        <div className="module-intro-v4">
          <span className="module-tag-v4">JORNADA ATUAL</span>
          <h2 className="module-title-v4">Módulo 1: Primeiros Passos</h2>
          <p className="module-desc-v4">Complete as 12 aulas para ganhar o troféu de bronze!</p>
        </div>

        {units.length > 0 ? (
          <div className="trail-grid-v4">
            {units.map((unit, idx) => {
               const isDone = unit.unit_status === 'completed';
               const isLocked = idx > 0 && units[idx-1].unit_status !== 'completed';
               const colors = ['#FF6B6B', '#4ECDC4', '#FFD93D', '#6C5CE7', '#FF8E3C', '#2ECC71'];
               const color = colors[idx % colors.length];

               return (
                <div 
                  key={unit.unit_id} 
                  className={`trail-card-v4 ${isDone ? 'is-complete' : ''} ${isLocked ? 'is-locked' : ''}`}
                  onClick={() => !isLocked && onNavigate('activities', unit.unit_id)}
                  style={{ '--unit-color': color } as any}
                >
                  <div className="trail-card-icon-v4">
                    {isDone ? <CheckCircle2 size={32} /> : isLocked ? <Trophy size={32} /> : <Sparkles size={32} />}
                  </div>
                  <div className="trail-card-info-v4">
                    <span className="unit-idx-v4">AULA {idx + 1}</span>
                    <h3 className="unit-title-v4">{unit.unit_title}</h3>
                  </div>
                  {isDone && <div className="unit-done-tag">✓</div>}
                </div>
               );
            })}
          </div>
        ) : (
          <div className="no-units-msg">
             <h3>Nenhuma aula encontrada</h3>
             <p>Ainda não há lições no seu caminho. Que tal adicionar uma?</p>
          </div>
        )}
      </div>

      {/* BOTTOM: MEDIATOR */}
      <div className="dash-bottom-bar-v4">
        <div className="mediator-mini-card">
          <div className="med-avatar-mini">{mediatorName.charAt(0)}</div>
          <div className="med-text-mini">
            <strong>Prof. {mediatorName}</strong>
            <span>Sua mediadora</span>
          </div>
          <button className="med-btn-mini" onClick={handleSupportClick}>
            <MessageCircle size={16} /> Chamar no Zap
          </button>
        </div>
      </div>
    </div>
  );
};
