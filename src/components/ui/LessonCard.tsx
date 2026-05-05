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
          border: isCurrent ? '3px solid #FF8DA1' : '3px solid white',
          borderRadius: '21px',
          padding: '16px 14px',
          minHeight: '220px',
          boxShadow: isCurrent ? '0 6px 0px #E56A81' : '0 5px 0px rgba(0,0,0,0.05)',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          gap: '8px'
        }}
      >
        {isCompleted && (
          <div className="lesson-ribbon-v5" style={{ background: 'var(--sage)', color: 'white', fontSize: '8px' }}>
            تکمیل شد!
          </div>
        )}

        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', position: 'relative' }}>
          <div className="lesson-icon-v5" style={{ filter: isLocked ? 'grayscale(1) opacity(0.3)' : 'none' }}>
            {hasIcon ? (
              <img 
                src={displayIcon} 
                alt={lesson.title}
                className={isCompleted ? 'animate-pop' : ''}
                style={{ 
                  width: '108px', 
                  height: '108px', 
                  objectFit: 'contain' 
                }}
                onError={(e) => {
                   (e.target as any).style.display = 'none';
                   (e.target as any).parentElement.innerHTML = '<span style="font-size: 24px">📚</span>';
                }}
              />
            ) : (
              <span style={{ fontSize: '32px' }}>
                {lesson.status === 'completed' ? '🌟' : (isLocked ? '🔒' : '📖')}
              </span>
            )}
          </div>
          
          <span className="lesson-id-tag" style={{ 
            background: 'var(--color-sky-shadow)', 
            color: 'white', 
            padding: '4px 12px', 
            borderRadius: '12px', 
            fontSize: '10px', 
            fontWeight: 900, 
            boxShadow: '0 4px 10px rgba(216, 180, 216, 0.4)',
            whiteSpace: 'nowrap'
          }}>
            {lesson.sub || `AULA ${idx + 1}`}
          </span>
        </div>
        
        <div className="lesson-info-v5" style={{ textAlign: 'center', width: '100%' }}>

            <h3 className="lesson-title-v5" style={{ 
            fontSize: '14px', 
            color: 'var(--ink1)', 
            fontWeight: 900, 
            margin: '0',
            fontFamily: 'Fraunces, serif'
          }}>
            {lesson.title}
          </h3>
          {lesson.titleDari && (
            <div style={{ 
              direction: 'rtl', 
              fontSize: '18px', 
              fontWeight: 900, 
              color: 'var(--ink1)',
              lineHeight: 1.1,
              fontFamily: 'Outfit, sans-serif',
              marginTop: '0px'
            }}>
              {lesson.titleDari}
            </div>
          )}
        </div>
        
        {!isLocked && (
          <div className="lesson-footer-v5" style={{ marginTop: '-3px', width: '100%' }}>
             <div className="lesson-bar-v5" style={{ 
               height: '6px', 
               background: 'rgba(0,0,0,0.05)', 
               borderRadius: '3px',
               position: 'relative',
               overflow: 'hidden'
             }}>
                <div className="lesson-bar-fill-v5" style={{ 
                  height: '100%', 
                  borderRadius: '3px', 
                  background: 'linear-gradient(90deg, #468432, #9AD872)', 
                  width: isCompleted ? '100%' : (isCurrent ? '20%' : '0%')
                }} />
             </div>
          </div>
        )}
        
        {isCurrent && (
          <button className="nav-link-kids whatsapp active" style={{ 
            width: '100%', 
            marginTop: '4px', 
            padding: '8px',
            display: 'flex', 
            flexDirection: 'column', 
            alignItems: 'center',
            cursor: 'pointer',
            minHeight: 'auto',
            borderWidth: '2px'
          }}>
            <span style={{ fontSize: '12px', fontWeight: 900, lineHeight: 1 }}>حالا شروع کنید!</span>
            <span style={{ fontSize: '8px', fontWeight: 700, opacity: 0.9 }}>(Começar Agora!)</span>
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
