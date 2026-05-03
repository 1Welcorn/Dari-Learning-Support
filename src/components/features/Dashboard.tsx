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
    <div className="dash-v5-container" style={{ background: 'var(--bg)', minHeight: '100vh' }}>
      {/* Header de Status do Aluno (Whimsical Design) */}
      <header className="dash-v5-header" style={{ 
        background: 'rgba(154, 216, 114, 0.15)', /* Light Green from palette */
        backdropFilter: 'var(--glass)',
        borderBottom: '1px solid rgba(70, 132, 50, 0.1)', /* Dark Green border */
        padding: '32px 24px',
        borderRadius: '0 0 var(--r-lg) var(--r-lg)',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center'
      }}>
        <div className="dash-v5-profile">
          <h1 style={{ fontSize: '28px', fontWeight: 900, color: 'var(--ink1)', margin: 0, direction: 'rtl', fontFamily: 'Fraunces, serif' }}>
            English classes سلام! ✨
          </h1>
          <div style={{ display: 'flex', alignItems: 'center', gap: '15px', marginTop: '12px' }}>
            <div style={{ flex: 1, minWidth: '200px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '6px' }}>
                 <span style={{ fontSize: '11px', fontWeight: 800, color: 'var(--ink3)' }}>{completedPct}% تکمیل شد (Concluído)</span>
              </div>
              <div style={{ width: '100%', height: '8px', background: 'rgba(255,255,255,0.5)', borderRadius: '4px', overflow: 'hidden' }}>
                <div style={{ width: `${completedPct}%`, height: '100%', background: '#468432', borderRadius: '4px' }} />
              </div>
            </div>
          </div>
        </div>

        <div className="dash-v5-stats" style={{ display: 'flex', gap: '12px' }}>
          <div className="stat-badge-v5" style={{ background: 'rgba(255, 160, 46, 0.2)', padding: '10px 16px', borderRadius: '20px', display: 'flex', alignItems: 'center', gap: '10px' }}>
            <Flame size={20} fill="#FFA02E" stroke="none" />
            <span style={{ fontSize: '15px', fontWeight: 900, color: '#FFA02E' }}>{currentStreak}</span>
          </div>
          <div className="stat-badge-v5" style={{ background: 'rgba(255, 239, 145, 0.3)', padding: '10px 16px', borderRadius: '20px', display: 'flex', alignItems: 'center', gap: '10px' }}>
            <Star size={20} fill="#FFD700" stroke="none" />
            <span style={{ fontSize: '15px', fontWeight: 900, color: '#468432' }}>{totalStars}</span>
          </div>
        </div>
      </header>

      <div style={{ padding: '32px 24px' }}>
        {/* Título do Módulo */}
        <div className="module-intro-v5" style={{ textAlign: 'center', marginBottom: '40px' }}>
           <span style={{ background: 'rgba(70, 132, 50, 0.1)', color: '#468432', padding: '6px 18px', borderRadius: '20px', fontSize: '11px', fontWeight: 900, textTransform: 'uppercase', letterSpacing: '1px' }}>سفر یادگیری (Jornada)</span>
           <h2 style={{ fontSize: '32px', fontWeight: 900, color: 'var(--ink1)', margin: '12px 0 8px', direction: 'rtl', fontFamily: 'Fraunces, serif' }}>
              ماژول ۱: مکالمه پایه 🚀
           </h2>
           <p style={{ color: 'var(--ink3)', fontWeight: 500, fontSize: '15px' }}>
              Complete as atividades para ganhar estrelas!
           </p>
        </div>

        {/* Grid de Aulas */}
        <div className="trail-grid-v5" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '24px' }}>
          {units.map((unit, idx) => {
            const hasQuestions = unit.questions && unit.questions.length > 0;
            const isDone = hasQuestions && unit.questions.every((_: any, i: number) => answers[`${unit.id}-${i}`]?.is_done);
            const isLocked = !isAdmin && (unit.is_locked || (idx > 0 && (!units[idx-1].questions || units[idx-1].questions.length === 0 || !units[idx-1].questions.every((_: any, i: number) => answers[`${units[idx-1].id}-${i}`]?.is_done))));
            
            const t = (unit.sub || unit.title || '').toLowerCase();
            let base = '';
            if (unit.id === 'u1') base = 'aula-1';
            else if (unit.id === 'u2') base = 'aula-2';
            else if (unit.id === 'u3') base = 'aula-3';
            else if (unit.id === 'u4') base = 'aula-4';
            else if (unit.id === 'u5') base = 'aula-5';
            else if (unit.id === 'u6') base = 'aula-6';
            else {
              // Fallback por palavra caso o ID mude
              const t = (unit.sub || unit.title || '').toLowerCase();
              if (t.includes('cozinha')) base = 'aula-1';
              else if (t.includes('família')) base = 'aula-2';
              else if (t.includes('cores')) base = 'aula-3';
              else if (t.includes('números')) base = 'aula-4';
              else if (t.includes('sentimentos')) base = 'aula-5';
              else if (t.includes('rotina')) base = 'aula-6';
            }

            let titleDari = '';
            if (t.includes('cozinha')) titleDari = 'لغات آشپزخانه';
            else if (t.includes('oral') || t.includes('escuta')) titleDari = 'درک شنوایی';
            else if (t.includes('apresentação')) titleDari = 'معرفی خود';
            else if (t.includes('cotidiano')) titleDari = 'انگلیسی در زندگی روزمره';
            else if (t.includes('digitais')) titleDari = 'موضوعات دیجیتال';
            else if (t.includes('receita')) titleDari = 'طرز تهیه غذا';
            else if (t.includes('cores')) titleDari = 'رنگ‌ها و میوه‌ها';
            else if (t.includes('números')) titleDari = 'اعداد و مقدار';
            else if (t.includes('família')) titleDari = 'خانواده من';
            else if (t.includes('corpo')) titleDari = 'اعضای بدن';

            const lessonData: Lesson = {
              id: unit.id,
              title: unit.sub || unit.title,
              status: isDone ? 'completed' : (isLocked ? 'locked' : 'not_started'),
              iconOutline: base ? `/unit-icons/${base}-off.png` : '',
              icon3D: base ? `/unit-icons/${base}.png` : '',
              xpValue: 100,
              titleDari: unit.title_dari || titleDari
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
        </div>

        {/* Footer de Suporte */}
        <footer style={{ marginTop: '60px', display: 'flex', justifyContent: 'center' }}>
          <div 
            onClick={handleSupportClick} 
            style={{ 
              background: 'white', 
              padding: '16px 32px', 
              borderRadius: 'var(--r-md)', 
              display: 'flex', 
              alignItems: 'center', 
              gap: '20px', 
              border: '1px solid var(--border)', 
              boxShadow: 'var(--shadow-soft)', 
              cursor: 'pointer' 
            }}
          >
            <div style={{ width: '44px', height: '44px', background: 'var(--lavender)', color: 'white', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 900, fontSize: '18px' }}>
              {mediatorName.charAt(0)}
            </div>
            <div style={{ direction: 'rtl', textAlign: 'right' }}>
               <div style={{ fontSize: '15px', fontWeight: 900, color: 'var(--ink1)' }}>استاد {mediatorName}</div>
               <div style={{ fontSize: '11px', color: 'var(--ink3)', fontWeight: 600 }}>معلم شما (Seu Mediador)</div>
            </div>
            <div style={{ background: '#25D366', color: 'white', padding: '8px 16px', borderRadius: '12px', fontSize: '12px', fontWeight: 900 }}>تماس 💬</div>
          </div>
        </footer>
      </div>
    </div>
  );
};
