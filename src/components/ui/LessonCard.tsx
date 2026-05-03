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
  const getIcon3D = () => {
    if (lesson.icon3D && !lesson.icon3D.includes('placeholder')) return lesson.icon3D;
    
    // Fallback mapping for all 12 units
    const mapping: Record<string, string> = {
      'u1': '/unit-icons/aula-1.png',
      'u2': '/unit-icons/aula-2.png',
      'u3': '/unit-icons/aula-3.png',
      'u4': '/unit-icons/aula-4.png',
      'u5': '/unit-icons/aula-5.png',
      'u6': '/unit-icons/aula-6.png',
      'u7': '/unit-icons/Aula 7 Cores e Frutas.png',
      'u8': '/unit-icons/Aula 8 Números e Quantidade.png',
      'u9': '/unit-icons/Minha Família.png',
      'u10': '/unit-icons/Partes do Corpo.png',
      'u11': '/unit-icons/Animais e Sons.png',
      'u12': '/unit-icons/aula-1.png',
    };
    
    return mapping[lesson.id] || `/unit-icons/aula-1.png`;
  };

  const getIconOutline = () => {
    if (lesson.iconOutline && !lesson.iconOutline.includes('placeholder')) return lesson.iconOutline;
    
    const mapping: Record<string, string> = {
      'u1': '/unit-icons/aula-1-off.png',
      'u2': '/unit-icons/aula-2-off.png',
      'u3': '/unit-icons/aula-3-off.png',
      'u4': '/unit-icons/aula-4-off.png',
      'u5': '/unit-icons/aula-5-off.png',
      'u6': '/unit-icons/aula-6-off.png',
      'u7': '/unit-icons/Aula 7 Cores e Frutas-não iniciada.png',
      'u8': '/unit-icons/Aula 8 Números e Quantidade-não iniciada.png',
      'u9': '/unit-icons/Minha Família-não iniciada.png',
      'u10': '/unit-icons/Partes do Corpo-não iniciada.png',
      'u11': '/unit-icons/Animais e Sons-não iniciada.png',
      'u12': '/unit-icons/aula-1-off.png',
    };
    
    return mapping[lesson.id] || `/unit-icons/aula-1-off.png`;
  };

  const displayIcon = (isCompleted || isCurrent) ? getIcon3D() : getIconOutline();
  const hasIcon = !!displayIcon;

  return (
    <div style={{ position: 'relative' }}>
      <motion.div
        whileHover={!isLocked ? { scale: 1.05, y: -5 } : {}}
        className={`lesson-card-v5 ${isLocked ? 'is-locked' : ''} ${isCurrent ? 'is-current' : ''}`}
        onClick={onClick}
        style={{
          background: isLocked ? 'rgba(0,0,0,0.02)' : (isCurrent ? 'linear-gradient(135deg, #fff 0%, #FFF9FA 100%)' : 'white'),
          backdropFilter: 'blur(10px)',
          border: isCurrent ? '2px solid #FF8DA1' : '1px solid rgba(0,0,0,0.05)',
          borderRadius: '32px',
          padding: '24px 20px',
          boxShadow: isCurrent ? '0 20px 40px -10px rgba(255, 141, 161, 0.25)' : '0 10px 30px -10px rgba(0,0,0,0.05)',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          gap: '12px'
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
        
        <div className="lesson-icon-v5" style={{ filter: isLocked ? 'grayscale(1) opacity(0.3)' : 'none' }}>
          {hasIcon ? (
            <img 
              src={displayIcon} 
              alt={lesson.title}
              className={isCompleted ? 'animate-pop' : ''}
              style={{ 
                width: idx === 6 ? '115px' : '144px', 
                height: idx === 6 ? '115px' : '144px', 
                objectFit: 'contain' 
              }}
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
        
        <div className="lesson-info-v5" style={{ textAlign: 'center', flex: 1 }}>
          <span className="lesson-id-tag" style={{ 
            background: 'rgba(162, 210, 255, 0.2)', 
            color: '#0369a1', 
            padding: '6px 16px', 
            borderRadius: '12px', 
            fontSize: '11px', 
            fontWeight: 900, 
            marginBottom: '12px', 
            display: 'inline-block',
            textTransform: 'uppercase',
            letterSpacing: '1px'
          }}>
            {lesson.sub || `AULA ${idx + 1}`}
          </span>
          <h3 className="lesson-title-v5" style={{ 
            fontSize: '18px', 
            color: 'var(--ink1)', 
            fontWeight: 900, 
            margin: '0 0 4px',
            fontFamily: 'Fraunces, serif'
          }}>
            {lesson.title}
          </h3>
          {lesson.titleDari && (
            <div style={{ 
              direction: 'rtl', 
              fontSize: '22px', 
              fontWeight: 900, 
              color: 'var(--ink1)',
              lineHeight: 1,
              fontFamily: 'Outfit, sans-serif',
              marginBottom: '4px'
            }}>
              {lesson.titleDari}
            </div>
          )}
        </div>
        
        {!isLocked && (
          <div className="lesson-footer-v5" style={{ marginTop: '8px', width: '100%' }}>
             <div className="lesson-bar-v5" style={{ 
               height: '10px', 
               background: 'rgba(0,0,0,0.05)', 
               borderRadius: '5px',
               position: 'relative',
               overflow: 'hidden',
               border: '1px solid rgba(0,0,0,0.02)'
             }}>
                <div className="lesson-bar-fill-v5" style={{ 
                  height: '100%', 
                  borderRadius: '5px', 
                  background: 'linear-gradient(90deg, #468432, #9AD872)', 
                  width: isCompleted ? '100%' : (isCurrent ? '20%' : '0%'),
                  boxShadow: 'inset 0 2px 4px rgba(255,255,255,0.3)'
                }} />
             </div>
             <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '4px' }}>
                <span className="lesson-xp-v5" style={{ fontSize: '11px', fontWeight: 900, color: '#468432' }}>{lesson.xpValue}XP</span>
             </div>
          </div>
        )}
        
        {isCurrent && (
          <button className="nav-link-kids whatsapp active" style={{ 
            width: '100%', 
            marginTop: '12px', 
            padding: '12px',
            display: 'flex', 
            flexDirection: 'column', 
            alignItems: 'center',
            cursor: 'pointer',
            minHeight: 'auto',
            borderWidth: '3px'
          }}>
            <span style={{ fontSize: '16px', fontWeight: 900, lineHeight: 1 }}>حالا شروع کنید!</span>
            <span style={{ fontSize: '10px', fontWeight: 700, opacity: 0.9, marginTop: '2px' }}>(Começar Agora!)</span>
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
