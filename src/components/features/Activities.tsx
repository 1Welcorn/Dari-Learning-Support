import React, { useState, useMemo } from 'react';
import type { Unit, Question } from '../../types';
import { COLORS } from '../../constants';
import { ChevronDown, Info, CheckCircle, Save, ExternalLink, Volume2, FileText } from 'lucide-react';
import { speechService } from '../../utils/speech';

interface QuestionBlockProps {
  question: Question;
  index: number;
  unitId: string;
  color: string;
  isDone: boolean;
  savedAnswer: string;
  onSaveAnswer: (val: string) => void;
}

const QuestionBlock: React.FC<QuestionBlockProps> = ({ 
  question, index, color, isDone, savedAnswer, onSaveAnswer 
}) => {
  const [showMediatorGuide, setShowMediatorGuide] = useState(false);
  const [tempAnswer, setTempAnswer] = useState(savedAnswer);
  const currentColors = COLORS[color] || COLORS.teal;

  React.useEffect(() => {
    setTempAnswer(savedAnswer);
  }, [savedAnswer]);

  return (
    <div className={`q-block ${isDone ? 'is-done' : ''}`}>
      <div className="q-header">
         <div className="q-num-pill" style={{ background: currentColors.main }}>{index + 1}</div>
         <div className="q-num-lbl">Atividade {index + 1}</div>
      </div>
      
      <div className="q-text">
        {question.q}
        {/* Only show speech button for English questions */}
        {!/\b(o|a|os|as|um|uma|que|é|significa|mostra|o que|qual|como|onde|quem)\b/i.test(question.q) && (
          <button 
            className="speech-mini-btn" 
            onClick={() => speechService.speak(question.q)}
            title="Ouvir em Inglês"
          >
            <Volume2 size={16} />
          </button>
        )}
      </div>
      
      <div className="q-guidance-row">
        <button 
          className="med-toggle-btn" 
          onClick={() => setShowMediatorGuide(!showMediatorGuide)}
          style={{ color: currentColors.main }}
        >
          <Info size={16} /> {showMediatorGuide ? 'Ocultar Dicas' : 'Ver Dicas da Mediadora'}
        </button>
      </div>

      {showMediatorGuide && (
        <div className="med-guide-expanded" style={{ borderLeftColor: currentColors.main }}>
          <div className="guide-item">
            <strong>O que fazer:</strong>
            <p>{question.mediator}</p>
          </div>
          <div className="guide-item">
            <strong>Dica de ouro:</strong>
            <p>{question.hint}</p>
          </div>
        </div>
      )}

      {question.type === 'mc' ? (
        <div className="opt-grid">
          {question.opts?.map((opt, i) => (
            <button 
              key={i} 
              className={`opt-large-btn ${tempAnswer === opt ? 'selected' : ''}`}
              onClick={() => {
                setTempAnswer(opt);
                onSaveAnswer(opt);
              }}
              style={{ 
                '--opt-color': currentColors.main,
                '--opt-bg': currentColors.light 
              } as React.CSSProperties}
            >
              <div className="opt-indicator">
                {tempAnswer === opt && <CheckCircle size={20} />}
              </div>
              <span className="opt-text">{opt}</span>
              <button 
                className="opt-speech-btn"
                onClick={(e) => {
                  e.stopPropagation();
                  const englishPart = opt.split(/[—·]/)[0].trim();
                  speechService.speak(englishPart);
                }}
              >
                <Volume2 size={14} />
              </button>
            </button>
          ))}
        </div>
      ) : (
        <div className="text-answer-area">
          <textarea 
            className="freetext-large" 
            value={tempAnswer}
            onChange={(e) => setTempAnswer(e.target.value)}
            placeholder="Digite sua resposta aqui..."
          />
          <button 
            className="save-action-btn" 
            onClick={() => onSaveAnswer(tempAnswer)}
            style={{ background: currentColors.main }}
          >
            <Save size={18} /> Salvar Resposta
          </button>
        </div>
      )}

      {!isDone && question.type === 'mc' && (
         <div className="q-footer-actions">
            <button 
              className="confirm-btn"
              onClick={() => onSaveAnswer(tempAnswer)}
              style={{ background: currentColors.main }}
              disabled={!tempAnswer}
            >
              Confirmar Resposta
            </button>
         </div>
      )}
      
      {isDone && (
        <div className="done-badge-float" style={{ color: currentColors.main }}>
           <CheckCircle size={24} />
        </div>
      )}
    </div>
  );
};

interface UnitCardProps {
  unit: Unit;
  answers: Record<string, any>;
  onSaveAnswer: (qIdx: number, val: string) => void;
  onSaveSession: (note: string) => void;
}

const UnitCard: React.FC<UnitCardProps> = ({ unit, answers, onSaveAnswer, onSaveSession }) => {
  const [isExpanded, setIsExpanded] = useState(false);
  const [note, setNote] = useState('');
  const currentColors = COLORS[unit.color] || COLORS.teal;

  const questionsDone = useMemo(() => {
    return unit.questions.filter((_, i) => answers[`${unit.id}-${i}`]?.is_done).length;
  }, [unit, answers]);

  const isComplete = questionsDone === unit.questions.length;

  return (
    <div className="unit-card">
      <div className="unit-hdr" onClick={() => setIsExpanded(!isExpanded)}>
        <div className="unit-dot" style={{ background: currentColors.main }}></div>
        <div className="unit-info">
          <div className="unit-title-row">
            <div className="unit-title-text">{unit.title}</div>
            {Array.isArray(unit.descriptors) && unit.descriptors.length > 0 && (
              <div className="descriptor-pills">
                {unit.descriptors.map(d => (
                  <span key={d} className="desc-pill" style={{ borderColor: currentColors.main, color: currentColors.main }}>
                    {d}
                  </span>
                ))}
              </div>
            )}
          </div>
          <div className="unit-sub-text">{unit.sub}</div>
        </div>
        <div className="unit-status" style={{ background: isComplete ? 'var(--teal-light)' : 'var(--bg)', color: isComplete ? 'var(--teal2)' : 'var(--ink4)' }}>
          {questionsDone}/{unit.questions.length}
        </div>
        <ChevronDown size={18} className={`chev ${isExpanded ? 'open' : ''}`} />
      </div>

      {isExpanded && (
        <div className="unit-body">
          {unit.brief && (
            <div className="mediator-brief">
              <div className="brief-label">Guia Geral da Mediadora</div>
              {unit.brief}
            </div>
          )}

          {Array.isArray(unit.embed_urls) && unit.embed_urls.filter(u => u.trim()).length > 0 && (
            <div className="embed-container-wrapper">
              <div className="brief-label">Atividades Interativas</div>
              <div className="embed-scroll-grid">
                {unit.embed_urls.filter(u => u.trim()).map((url, idx) => (
                  <div key={idx} className="embed-block">
                    <div className="embed-label" style={{ color: currentColors.main }}>
                      Interativa {idx + 1}
                    </div>
                    <div className="iframe-responsive">
                      <iframe 
                        src={url} 
                        title={`${unit.title} - Atividade ${idx + 1}`}
                        allowFullScreen 
                      />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}



          {unit.questions.map((q, i) => (
            <QuestionBlock 
              key={i}
              question={q}
              index={i}
              unitId={unit.id}
              color={unit.color}
              isDone={!!answers[`${unit.id}-${i}`]?.is_done}
              savedAnswer={answers[`${unit.id}-${i}`]?.answer_value || ''}
              onSaveAnswer={(val) => onSaveAnswer(i, val)}
            />
          ))}

          <div className="session-reporting-card">
            <div className="reporting-header">
              <FileText size={20} style={{ color: currentColors.main }} />
              <div className="reporting-title">Relatório de Atendimento</div>
            </div>
            <p className="reporting-subtitle">
              Descreva as observações pedagógicas, sucessos e desafios desta sessão.
            </p>
            <textarea 
              className="reporting-textarea" 
              value={note}
              onChange={(e) => setNote(e.target.value)}
              placeholder="Ex: Ione demonstrou facilidade com o vocabulário de cozinha, mas precisou de ajuda na pronúncia de 'spoon'..."
            />
            <button 
              className="confirm-session-btn" 
              disabled={!note.trim()}
              onClick={() => { 
                onSaveSession(note); 
                setNote(''); 
                setIsExpanded(false);
              }}
              style={{ background: currentColors.main }}
            >
              <CheckCircle size={18} /> Finalizar e Salvar Relatório
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export const Activities: React.FC<{ units: Unit[]; answers: Record<string, any>; onSaveAnswer: (uId: string, qIdx: number, val: string) => void; onSaveSession: (uId: string, note: string) => void }> = ({ units, answers, onSaveAnswer, onSaveSession }) => {
  return (
    <div className="screen">
      {units.map((unit) => (
        <UnitCard 
          key={unit.id} 
          unit={unit} 
          answers={answers}
          onSaveAnswer={(qIdx, val) => onSaveAnswer(unit.id, qIdx, val)}
          onSaveSession={(note) => onSaveSession(unit.id, note)}
        />
      ))}
    </div>
  );
};