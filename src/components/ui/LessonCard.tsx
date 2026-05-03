import React from 'react';
import type { Lesson } from '../../types/index';
import { motion } from 'framer-motion';
import { CheckCircle2, Lock, Unlock } from 'lucide-react';

interface LessonCardProps {
  lesson: Lesson;
  onClick?: () => void;
  idx: number;
}

export const LessonCard: React.FC<LessonCardProps & { isAdmin?: boolean, onToggleLock?: () => void }> = ({ lesson, onClick, idx, isAdmin, onToggleLock }) => {
  const isLocked = lesson.status === 'locked';
  const isCurrent = lesson.status === 'not_started';
  const isCompleted = lesson.status === 'completed';

  // Define qual imagem usar baseado no status: 3D para Concluído ou Atual, Outline apenas para Bloqueado
  const displayIcon = (isCompleted || isCurrent) ? lesson.icon3D : lesson.iconOutline;
  const hasIcon = !!displayIcon;

  return (
    <div style={{ position: 'relative' }}>
      <motion.div
        whileHover={!isLocked ? { scale: 1.05, y: -5 } : {}}
        className={`lesson-card-v5 ${isLocked ? 'is-locked' : ''} ${isCurrent ? 'is-current' : ''}`}
        onClick={onClick}
        style={{
          background: isLocked ? 'rgba(0,0,0,0.05)' : 'var(--card)',
          backdropFilter: 'var(--glass)',
          border: '1px solid var(--border)',
          borderRadius: 'var(--r-md)',
          padding: '16px',
          boxShadow: isCurrent ? '0 15px 35px rgba(216, 180, 216, 0.2)' : 'var(--shadow-soft)',
          overflow: 'hidden'
        }}
      >
        {isCompleted && (
          <div className="lesson-ribbon-v5" style={{ background: 'var(--sage)', color: 'white' }}>
            <span style={{ fontSize: '10px', display: 'block', lineHeight: 1 }}>تکمیل شد!</span>
            <span style={{ fontSize: '9px', opacity: 0.9 }}>(CONCLUÍDO!)</span>
          </div>
        )}

        {isCompleted && (
          <div className="lesson-check-badge-v5" style={{ background: 'white', border: '2px solid var(--sage)' }}>
             <CheckCircle2 size={20} fill="var(--sage)" stroke="white" />
          </div>
        )}
        
        <div className="lesson-icon-v5" style={{ marginBottom: '16px', filter: isLocked ? 'grayscale(1) opacity(0.3)' : 'none' }}>
          {hasIcon ? (
            <img 
              src={displayIcon} 
              alt={lesson.title}
              className={isCompleted ? 'animate-pop' : ''}
              style={{ width: '144px', height: '144px', objectFit: 'contain' }}
              onError={(e) => {
                 (e.target as any).style.display = 'none';
                 (e.target as any).parentElement.innerHTML = '<span style="font-size: 32px">📚</span>';
              }}
            />
          ) : (
            <span style={{ fontSize: '48px' }}>
              {lesson.status === 'completed' ? '🌟' : (isLocked ? '🔒' : '📖')}
            </span>
          )}
        </div>
        
        <div className="lesson-info-v5" style={{ textAlign: 'center' }}>
          <span className="lesson-id-tag" style={{ background: 'var(--sky-blue)', color: 'white', padding: '4px 12px', borderRadius: '20px', fontSize: '10px', fontWeight: 900, marginBottom: '8px', display: 'inline-block' }}>AULA {idx + 1}</span>
          {lesson.titleDari && (
            <div style={{ 
              direction: 'rtl', 
              fontSize: '18px', 
              fontWeight: 900, 
              color: 'var(--ink1)',
              marginBottom: '4px',
              lineHeight: 1.2,
              fontFamily: 'Outfit, sans-serif'
            }}>
              {lesson.titleDari}
            </div>
          )}
          <h3 className="lesson-title-v5" style={{ fontSize: lesson.titleDari ? '13px' : '16px', color: 'var(--ink2)', fontWeight: 700, margin: 0 }}>
            {lesson.title}
          </h3>
        </div>
        
        {!isLocked && (
          <div className="lesson-footer-v5" style={{ marginTop: '16px' }}>
             <div className="lesson-bar-v5" style={{ height: '6px', background: 'rgba(0,0,0,0.05)', borderRadius: '3px' }}>
                <div className="lesson-bar-fill-v5" style={{ height: '100%', borderRadius: '3px', background: 'var(--sage)', width: isCompleted ? '100%' : (isCurrent ? '20%' : '0%') }} />
             </div>
             <span className="lesson-xp-v5" style={{ fontSize: '10px', fontWeight: 900, color: 'var(--sage)', marginTop: '4px', display: 'block' }}>{lesson.xpValue}XP</span>
          </div>
        )}
        
        {isCurrent && (
          <button className="lesson-play-btn-v5" style={{ width: '100%', marginTop: '12px', background: 'var(--lavender)', color: 'white', border: 'none', borderRadius: '16px', padding: '10px', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
            <span style={{ fontSize: '14px', fontWeight: 900 }}>حالا شروع کنید!</span>
            <span style={{ fontSize: '10px', fontWeight: 700, opacity: 0.9 }}>(Começar Agora!)</span>
          </button>
        )}
      </motion.div>

      {isAdmin && (
        <button 
          onClick={(e) => {
            e.stopPropagation();
            onToggleLock?.();
          }}
          style={{
            position: 'absolute',
            top: '-10px',
            right: '-10px',
            width: '32px',
            height: '32px',
            borderRadius: '50%',
            background: isLocked ? 'var(--rose)' : 'var(--sage)',
            color: 'white',
            border: '3px solid white',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            cursor: 'pointer',
            boxShadow: '0 4px 10px rgba(0,0,0,0.1)',
            zIndex: 10
          }}
          title={isLocked ? "Desbloquear Unidade" : "Bloquear Unidade"}
        >
          {isLocked ? <Lock size={14} /> : <Unlock size={14} />}
        </button>
      )}
    </div>
  );
};
