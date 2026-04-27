import React from 'react';
import { motion } from 'framer-motion';
import { 
  Star, CheckCircle2, Trophy, Sparkles, MessageCircle, 
  Flame, Lock, Coins, TrendingUp
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useStudentJourney } from '../../hooks/useStudentJourney';
import { COLORS } from '../../constants';
import { LessonCard } from '../ui/LessonCard';
import type { Lesson } from '../../types/index';

interface DashboardProps {
  onNavigate: (screen: string, unitId?: string) => void;
  completedPct: number;
  sessionsCount: number;
  mediatorName: string;
  mediatorPhone: string;
  units: any[];
  answers: Record<string, any>;
  isAdmin?: boolean;
  onUpdateUnit?: (id: string, updates: any) => Promise<{ success: boolean; error?: string }>;
}

export const Dashboard: React.FC<DashboardProps> = ({
  onNavigate,
  completedPct,
  sessionsCount,
  mediatorName,
  mediatorPhone,
  units,
  answers,
  isAdmin,
  onUpdateUnit
}) => {
  const { user } = useAuth();
  const { stats, loading: statsLoading } = useStudentJourney(user?.id || '');

  const currentLevel = stats?.level || 1;
  const currentStreak = stats?.streak || 0;
  const totalStars = stats?.stars || (sessionsCount * 10);

  const handleSupportClick = () => {
    const text = `Olá Prof. ${mediatorName}, sou a Ione! Preciso de uma ajuda com as atividades de hoje.`;
    const cleanPhone = mediatorPhone.replace(/\D/g, '');
    window.open(`https://wa.me/${cleanPhone}?text=${encodeURIComponent(text)}`, '_blank');
  };

  if (statsLoading) return <div className="screen-loading">Carregando sua jornada...</div>;

  return (
    <div className="dash-v5-container">
      {/* Header de Status do Aluno (Design Premium) */}
      <header className="dash-v5-header" style={{ minHeight: '100px', alignItems: 'center', paddingTop: '25px' }}>
        <div className="dash-v5-profile" style={{ display: 'flex', alignItems: 'center', gap: '20px', overflow: 'visible' }}>
          <div>
            <h1 style={{ fontSize: '26px', fontWeight: 900, color: '#1e293b', margin: 0 }}>Oi, Ione! 🌟 <span style={{ fontSize: '10px', color: '#ef4444', verticalAlign: 'middle' }}>v5.6</span></h1>
            <div style={{ display: 'flex', alignItems: 'center', gap: '15px', marginTop: '8px' }}>
              <div style={{ flex: 1, minWidth: '150px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px' }}>
                   <span style={{ fontSize: '11px', fontWeight: 900, color: '#64748b' }}>{completedPct}% da Jornada!</span>
                   <span style={{ fontSize: '11px', fontWeight: 900, color: '#64748b' }}>XP: {stats?.xp || 120}/2000</span>
                </div>
                <div style={{ width: '100%', height: '10px', background: '#f1f5f9', borderRadius: '5px', overflow: 'hidden' }}>
                  <div style={{ width: `${completedPct}%`, height: '100%', background: '#10b981' }} />
                </div>
              </div>
              
              <div className="hexagon-badge-v5">
                 <span style={{ fontSize: '10px', fontWeight: 900 }}>NÍVEL</span>
                 <span style={{ fontSize: '18px', fontWeight: 900 }}>{currentLevel}</span>
              </div>
            </div>
          </div>
        </div>

        <div className="dash-v5-stats" style={{ display: 'flex', gap: '16px' }}>
          <div className="stat-badge-v5 flame">
            <Flame size={24} fill="#ef4444" stroke="none" />
            <div style={{ display: 'flex', flexDirection: 'column' }}>
               <span style={{ fontSize: '14px', fontWeight: 900, color: '#ef4444' }}>{currentStreak} Dias</span>
               <span style={{ fontSize: '9px', fontWeight: 800, color: '#f87171', textTransform: 'uppercase' }}>Chama de Sequência</span>
            </div>
          </div>
          <div className="stat-badge-v5 coins">
            <img src="/coins-3d.png" alt="Coins" style={{ width: '24px' }} onError={(e) => (e.target as any).src = "https://cdn-icons-png.flaticon.com/512/10431/10431966.png"} />
            <div style={{ display: 'flex', flexDirection: 'column' }}>
               <span style={{ fontSize: '14px', fontWeight: 900, color: '#a16207' }}>{totalStars}</span>
               <span style={{ fontSize: '9px', fontWeight: 800, color: '#ca8a04', textTransform: 'uppercase' }}>Coins</span>
            </div>
          </div>
        </div>
      </header>

      {/* Título do Módulo */}
      <div className="module-intro-v5" style={{ textAlign: 'center', marginBottom: '20px' }}>
         <span className="module-tag-v5" style={{ background: '#ccfbf1', color: '#0f766e', padding: '6px 16px', borderRadius: '20px', fontSize: '10px', fontWeight: 900, textTransform: 'uppercase' }}>JORNADA</span>
         <h2 className="module-title-v5" style={{ fontSize: '26px', fontWeight: 900, color: '#1e293b', margin: '8px 0 4px' }}>Mission: Módulo 1 — Primeiros Passos</h2>
         <p className="module-desc-v5" style={{ color: '#64748b', fontWeight: 600, fontSize: '14px' }}>Complete as 12 aulas para ganhar o troféu de bronze!</p>
      </div>

      {/* Grid de Aulas (Trilha com Pontilhado) */}
      <div className="trail-grid-v5">
        {units.map((unit, idx) => {
          const isDone = unit.questions?.every((_: any, i: number) => answers[`${unit.id}-${i}`]?.is_done);
          const isLocked = !isAdmin && (unit.is_locked || (idx > 0 && !units[idx-1].questions?.every((_: any, i: number) => answers[`${units[idx-1].id}-${i}`]?.is_done)));
          
          const t = (unit.sub || unit.title || '').toLowerCase();
          let base = '';
          if (t.includes('cozinha')) base = 'Aula 1 Vocabulário da Cozinha';
          else if (t.includes('oral') || t.includes('escuta')) base = 'Aula 2 Compreensão Oral';
          else if (t.includes('apresentação')) base = 'Aula 3 Apresentação Pessoal';
          else if (t.includes('cotidiano')) base = 'Aula 4 Inglês no Cotidiano';
          else if (t.includes('digitais')) base = 'Aula 5 Gêneros Digitais';
          else if (t.includes('receita')) base = 'Aula 6 Receita';
          else if (t.includes('cores')) base = 'Aula 7 Cores e Frutas';
          else if (t.includes('números')) base = 'Aula 8 Números e Quantidade';

          const lessonData: Lesson = {
            id: unit.id,
            title: unit.sub || unit.title,
            status: isDone ? 'completed' : (isLocked ? 'locked' : 'not_started'),
            iconOutline: base ? `/unit-icons/${base}-não iniciada.png` : '',
            icon3D: base ? `/unit-icons/${base}.png` : '',
            xpValue: 100
          };

          return (
            <LessonCard 
              key={unit.id} 
              lesson={lessonData} 
              idx={idx}
              isAdmin={isAdmin}
              onToggleLock={async () => {
                if (onUpdateUnit) {
                   const res = await onUpdateUnit(unit.id, { is_locked: !unit.is_locked });
                   if (!res.success) alert('Erro ao atualizar bloqueio: ' + res.error);
                }
              }}
              onClick={() => !isLocked && onNavigate('activities', unit.id)}
            />
          );
        })}
        
        {/* Card de Revisão (Final) */}
        <div className="lesson-card-v5" style={{ background: '#fef3c7', borderColor: '#f59e0b' }}>
           <img src="https://cdn-icons-png.flaticon.com/512/10431/10431713.png" alt="Review" style={{ width: '80px', marginBottom: '16px' }} />
           <span className="lesson-id-tag">AULA 12</span>
           <h3 className="lesson-title-v5">Revisão do Módulo 1</h3>
        </div>
      </div>

      {/* Footer com Inventário e Suporte */}
      <footer className="dash-v5-footer">
        <button className="inventory-btn-v5">
           <img src="https://cdn-icons-png.flaticon.com/512/2901/2901197.png" alt="Bag" style={{ width: '32px' }} />
           Inventário
        </button>

        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '8px' }}>
           <span style={{ background: '#fef3c7', color: '#92400e', padding: '4px 16px', borderRadius: '20px', fontSize: '11px', fontWeight: 900 }}>Dica do Mestre</span>
           <div className="zap-support-v5-static" onClick={handleSupportClick} style={{ background: 'white', padding: '10px 24px', borderRadius: '20px', display: 'flex', alignItems: 'center', gap: '15px', border: '1px solid #f1f5f9', boxShadow: '0 4px 12px rgba(0,0,0,0.05)', cursor: 'pointer' }}>
              <div style={{ width: '32px', height: '32px', background: '#f1f5f9', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 900 }}>{mediatorName.charAt(0)}</div>
              <div style={{ display: 'flex', flexDirection: 'column' }}>
                 <span style={{ fontSize: '13px', fontWeight: 800 }}>Prof. {mediatorName}</span>
                 <span style={{ fontSize: '10px', color: '#64748b' }}>Sua mediadora</span>
              </div>
              <button style={{ background: '#10b981', color: 'white', border: 'none', padding: '6px 12px', borderRadius: '12px', fontSize: '11px', fontWeight: 800 }}>Chamar no Zap</button>
           </div>
        </div>
      </footer>
    </div>
  );
};
