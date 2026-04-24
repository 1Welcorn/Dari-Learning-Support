import React from 'react';
import { motion } from 'framer-motion';
import { 
  Star, CheckCircle2, Trophy, Sparkles, MessageCircle, 
  Flame, Lock, Coins, TrendingUp
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useStudentJourney } from '../../hooks/useStudentJourney';
import { useDashboardData } from '../../hooks/useDashboardData';
import { COLORS } from '../../constants';

interface DashboardProps {
  onNavigate: (screen: string, unitId?: string) => void;
  completedPct: number;
  sessionsCount: number;
  mediatorName: string;
  mediatorPhone: string;
}

const getTrailIcon = (title: string, sub: string, isLocked: boolean, isDone: boolean) => {
  const t = (sub || title || '').toLowerCase();
  let base = '';
  let emoji = '📚';

  // Logic to find the correct PNG base name
  if (t.includes('cozinha')) { base = 'Aula 1 Vocabulário da Cozinha'; emoji = '👨‍🍳'; }
  else if (t.includes('oral') || t.includes('escuta')) { base = 'Aula 2 Compreensão Oral'; emoji = '🎧'; }
  else if (t.includes('apresentação')) { base = 'Aula 3 Apresentação Pessoal'; emoji = '🤝'; }
  else if (t.includes('cotidiano')) { base = 'Aula 4 Inglês no Cotidiano'; emoji = '🤖'; }
  else if (t.includes('digitais')) { base = 'Aula 5 Gêneros Digitais'; emoji = '📱'; }
  else if (t.includes('receita')) { base = 'Aula 6 Receita'; emoji = '📖'; }
  else if (t.includes('cores')) { base = 'Aula 7 Cores e Frutas'; emoji = '🎨'; }
  else if (t.includes('números')) { base = 'Aula 8 Números e Quantidade'; emoji = '🔢'; }

  if (base) {
    const suffix = isLocked
      ? (base === 'Aula 6 Receita' ? '-atividade não iniciada' : '-não iniciada')
      : '';
    return (
      <img
        src={`/unit-icons/${base}${suffix}.png`}
        alt={title}
        className="lesson-img-v5"
        onError={(e) => {
          // Fallback to emoji if image fails to load
          (e.target as any).style.display = 'none';
          (e.target as any).parentElement.innerHTML = `<span style="font-size: 32px">${emoji}</span>`;
        }}
      />
    );
  }

  if (isLocked) return <Lock className="text-slate-400" size={32} />;
  return <span style={{ fontSize: '32px' }}>{emoji}</span>;
};

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

  const currentLevel = stats?.level || 1;
  const currentStreak = stats?.streak || 0;
  const totalStars = stats?.stars || (sessionsCount * 10);

  const handleSupportClick = () => {
    const text = `Olá Prof. ${mediatorName}, sou a Ione! Preciso de uma ajuda com as atividades de hoje.`;
    const cleanPhone = mediatorPhone.replace(/\D/g, '');
    window.open(`https://wa.me/${cleanPhone}?text=${encodeURIComponent(text)}`, '_blank');
  };

  if (journeyLoading || statsLoading) return <div className="screen-loading">Carregando sua jornada...</div>;

  return (
    <div className="dash-v5-container">
      {/* Header de Status do Aluno */}
      <header className="dash-v5-header">
        <div className="dash-v5-profile">
          <div className="dash-v5-avatar">
            {user?.email?.charAt(0).toUpperCase() || 'I'}
          </div>
          <div>
            <h1 style={{ fontSize: '24px', margin: 0 }}>Oi, Ione! 👋</h1>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginTop: '4px' }}>
              <div style={{ width: '120px', height: '6px', background: '#f1f5f9', borderRadius: '3px', overflow: 'hidden' }}>
                <div style={{ width: `${completedPct}%`, height: '100%', background: '#10b981' }} />
              </div>
              <span style={{ fontSize: '10px', fontWeight: 900, color: '#94a3b8', textTransform: 'uppercase' }}>
                {completedPct}% da Jornada
              </span>
            </div>
          </div>
        </div>

        <div className="dash-v5-stats">
          <StatBadge icon={<Flame className="text-orange-500" size={18} fill="#f97316" />} value={`${currentStreak} Dias`} label="Streak" />
          <StatBadge icon={<Star className="text-yellow-500" size={18} fill="#f59e0b" />} value={totalStars.toString()} label="Estrelas" />
          <StatBadge icon={<Trophy className="text-blue-500" size={18} fill="#3b82f6" />} value={`Lvl ${currentLevel}`} label="Rank" />
        </div>
      </header>

      {/* Título do Módulo */}
      <div className="module-intro-v5">
         <span className="module-tag-v5">Jornada</span>
         <h2 className="module-title-v5">Mission: Módulo 1 — Primeiros Passos</h2>
         <p className="module-desc-v5">Complete as 12 aulas para ganhar o troféu de bronze!</p>
      </div>

      {/* Grid de Aulas (Trilha) */}
      <div className="trail-grid-v5">
        {units.map((unit, idx) => {
          const isDone = unit.unit_status === 'completed';
          const isLocked = idx > 0 && units[idx-1].unit_status !== 'completed';
          const isCurrent = !isDone && !isLocked;

          return (
            <motion.div
              key={unit.unit_id}
              whileHover={!isLocked ? { scale: 1.05, y: -5 } : {}}
              className={`lesson-card-v5 ${isLocked ? 'is-locked' : ''} ${isCurrent ? 'is-current' : ''}`}
              onClick={() => !isLocked && onNavigate('activities', unit.unit_id)}
            >
              {isDone && (
                <div className="lesson-check">
                   <CheckCircle2 size={24} fill="#10b981" stroke="white" />
                </div>
              )}
              
              <div className="lesson-icon-v5">
                {getTrailIcon(unit.unit_title, unit.unit_sub, isLocked, isDone)}
              </div>
              
              <span className="lesson-id-tag">Aula {idx + 1}</span>
              <h3 className="lesson-title-v5">{unit.unit_sub || unit.unit_title}</h3>
              
              {!isLocked && (
                <div className="lesson-progress-v5">
                   <div className="lesson-bar-bg">
                      <div className="lesson-bar-fill" style={{ width: isDone ? '100%' : (isCurrent ? '30%' : '0%') }} />
                   </div>
                   <span className="lesson-xp-tag">100 XP</span>
                </div>
              )}
              
              {isCurrent && (
                <button className="lesson-play-btn">
                  COMEÇAR AGORA!
                </button>
              )}
            </motion.div>
          );
        })}
        
        {/* Card Especial de Tesouro */}
        <div className="treasure-card-v5">
           <div style={{ fontSize: '32px', marginBottom: '8px' }}>🎁</div>
           <span style={{ fontSize: '10px', fontWeight: 900, color: '#a16207' }}>PREMIAÇÃO</span>
        </div>
      </div>

      {/* Botão de Suporte Flutuante */}
      <div className="zap-support-v5" onClick={handleSupportClick}>
          <div className="zap-avatar-v5">{mediatorName.charAt(0)}</div>
          <div className="zap-text-v5">
              <p className="zap-name">Prof. {mediatorName}</p>
              <p className="zap-label">Chamar no Zap</p>
          </div>
      </div>
    </div>
  );
};

// Componentes Auxiliares
function StatBadge({ icon, value, label }: { icon: React.ReactNode, value: string, label: string }) {
  return (
    <div className="stat-badge-v5">
      <div className="stat-badge-icon">{icon}</div>
      <div className="stat-badge-info">
        <span className="stat-badge-val">{value}</span>
        <span className="stat-badge-lbl">{label}</span>
      </div>
    </div>
  );
}
