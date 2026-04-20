import React, { useState, useMemo } from 'react';
import type { Unit, Question, QuestionType } from '../../types';
import { COLORS } from '../../constants';
import { ChevronDown, Info, CheckCircle, Save, Volume2, FileText, Edit2, Trash2, X, Check, Plus, Circle, CheckSquare } from 'lucide-react';
import { speechService } from '../../utils/speech';

interface QuestionBlockProps {
  question: Question;
  index: number;
  unitId: string;
  color: string;
  isDone: boolean;
  savedAnswer: string;
  onSaveAnswer: (val: string) => Promise<boolean>;
  isAdmin?: boolean;
  onEdit?: (newQ: Question) => void;
  onDelete?: () => void;
  isNew?: boolean;
}

const QuestionBlock: React.FC<QuestionBlockProps> = ({ 
  question, index, color, isDone, savedAnswer, onSaveAnswer, isAdmin, onEdit, onDelete, isNew 
}) => {
  const [showMediatorGuide, setShowMediatorGuide] = useState(false);
  const [tempAnswer, setTempAnswer] = useState(savedAnswer);
  const [isSaving, setIsSaving] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);
  
  const [isEditing, setIsEditing] = useState(isNew || false);
  const [editQ, setEditQ] = useState(question.q);
  const [editType, setEditType] = useState<QuestionType>(question.type);
  const [editOpts, setEditOpts] = useState<string[]>(question.opts || []);
  
  const currentColors = COLORS[color] || COLORS.teal;

  React.useEffect(() => {
    setTempAnswer(savedAnswer);
  }, [savedAnswer]);

  const handleSave = async (val: string) => {
    if (isSaving) return;
    setIsSaving(true);
    const success = await onSaveAnswer(val);
    setIsSaving(false);
    if (success) {
      setShowSuccess(true);
      setTimeout(() => setShowSuccess(false), 3000);
    } else {
      window.alert('Erro ao salvar resposta.');
    }
  };

  const handleConfirmEdit = () => {
    if (onEdit) onEdit({ 
      ...question, 
      q: editQ, 
      type: editType, 
      opts: ['mc', 'checkbox'].includes(editType) ? editOpts : undefined 
    });
    setIsEditing(false);
  };

  const toggleCheckbox = (opt: string) => {
    let current = tempAnswer ? tempAnswer.split(', ') : [];
    if (current.includes(opt)) {
      current = current.filter(o => o !== opt);
    } else {
      current = [...current, opt];
    }
    const newVal = current.join(', ');
    setTempAnswer(newVal);
    handleSave(newVal);
  };

  const addOption = () => {
    setEditOpts([...editOpts, `Opção ${editOpts.length + 1}`]);
  };

  const removeOption = (idx: number) => {
    setEditOpts(editOpts.filter((_, i) => i !== idx));
  };

  const updateOption = (idx: number, val: string) => {
    const next = [...editOpts];
    next[idx] = val;
    setEditOpts(next);
  };

  return (
    <div className={`q-block modern ${isDone ? 'is-done' : ''}`}>
      {isAdmin && (
        <div className="admin-inline-actions">
          <button className="admin-mini-btn" onClick={() => setIsEditing(!isEditing)} title="Editar Questão">
            <Edit2 size={14} />
          </button>
          <button className="admin-mini-btn del" onClick={onDelete} title="Excluir Questão">
            <Trash2 size={14} />
          </button>
        </div>
      )}

      <div className="q-header">
         <div className="q-num-pill" style={{ background: currentColors.main }}>{index + 1}</div>
         <div className="q-type-badge">{
           question.type === 'mc' ? 'Múltipla Escolha' :
           question.type === 'checkbox' ? 'Caixas de Seleção' :
           question.type === 'scale' ? 'Escala' :
           question.type === 'paragraph' ? 'Parágrafo' : 'Resposta Curta'
         }</div>
      </div>
      
      <div className="q-content-area">
        {isEditing ? (
          <div className="admin-modern-editor">
            <div className="editor-row">
              <input 
                type="text" 
                value={editQ} 
                onChange={(e) => setEditQ(e.target.value)}
                placeholder="Título da pergunta"
                className="admin-inline-input title"
              />
              <select 
                value={editType} 
                onChange={(e) => setEditType(e.target.value as QuestionType)}
                className="admin-type-select"
              >
                <option value="text">Resposta curta</option>
                <option value="paragraph">Parágrafo</option>
                <option value="mc">Múltipla escolha</option>
                <option value="checkbox">Caixas de seleção</option>
                <option value="scale">Escala linear</option>
              </select>
            </div>

            {['mc', 'checkbox'].includes(editType) && (
              <div className="admin-options-editor">
                {editOpts.map((opt, i) => (
                  <div key={i} className="admin-opt-row">
                    {editType === 'mc' ? <Circle size={14} /> : <CheckSquare size={14} />}
                    <input 
                      type="text" 
                      value={opt} 
                      onChange={(e) => updateOption(i, e.target.value)}
                      className="admin-opt-input"
                    />
                    <button onClick={() => removeOption(i)} className="admin-opt-del"><X size={12} /></button>
                  </div>
                ))}
                <button className="admin-add-opt-btn" onClick={addOption}>
                  <Plus size={14} /> Adicionar opção
                </button>
              </div>
            )}

            <div className="editor-footer">
              <button className="admin-save-btn" onClick={handleConfirmEdit}><Check size={16} /> Aplicar Mudanças</button>
              <button className="admin-cancel-btn" onClick={() => setIsEditing(false)}>Cancelar</button>
            </div>
          </div>
        ) : (
          <>
            <div className="q-text">
              {question.q}
              {!/\b(o|a|os|as|um|uma|que|é|significa|mostra|o que|qual|como|onde|quem)\b/i.test(question.q) && (
                <button 
                  className="speech-mini-btn" 
                  onClick={() => speechService.speak(question.q)}
                >
                  <Volume2 size={16} />
                </button>
              )}
            </div>

            <div className="q-input-container">
              {question.type === 'text' && (
                <input 
                  type="text"
                  className="modern-text-input"
                  placeholder="Sua resposta..."
                  value={tempAnswer}
                  onChange={(e) => setTempAnswer(e.target.value)}
                  onBlur={(e) => handleSave(e.target.value)}
                />
              )}

              {question.type === 'paragraph' && (
                <textarea 
                  className="modern-text-input paragraph"
                  placeholder="Sua resposta longa..."
                  value={tempAnswer}
                  onChange={(e) => setTempAnswer(e.target.value)}
                  onBlur={(e) => handleSave(e.target.value)}
                />
              )}

              {question.type === 'mc' && (
                <div className="modern-options-grid">
                  {question.opts?.map((opt, i) => (
                    <button 
                      key={i}
                      className={`modern-opt-btn ${tempAnswer === opt ? 'selected' : ''}`}
                      onClick={() => { setTempAnswer(opt); handleSave(opt); }}
                      style={{ '--brand': currentColors.main } as any}
                    >
                      <div className="opt-circle">{tempAnswer === opt && <div className="inner" />}</div>
                      <span>{opt}</span>
                    </button>
                  ))}
                </div>
              )}

              {question.type === 'checkbox' && (
                <div className="modern-options-grid">
                  {question.opts?.map((opt, i) => {
                    const isSel = tempAnswer.split(', ').includes(opt);
                    return (
                      <button 
                        key={i}
                        className={`modern-opt-btn ${isSel ? 'selected' : ''}`}
                        onClick={() => toggleCheckbox(opt)}
                        style={{ '--brand': currentColors.main } as any}
                      >
                        <div className="opt-square">{isSel && <Check size={12} />}</div>
                        <span>{opt}</span>
                      </button>
                    );
                  })}
                </div>
              )}

              {question.type === 'scale' && (
                <div className="modern-scale-container">
                  {[1,2,3,4,5].map(num => (
                    <button 
                      key={num}
                      className={`scale-dot ${tempAnswer === String(num) ? 'selected' : ''}`}
                      onClick={() => { setTempAnswer(String(num)); handleSave(String(num)); }}
                      style={{ '--brand': currentColors.main } as any}
                    >
                      {num}
                    </button>
                  ))}
                </div>
              )}
            </div>
          </>
        )}
      </div>

      <div className="q-footer">
        <button 
          className={`mediator-hint-btn ${showMediatorGuide ? 'active' : ''}`}
          onClick={() => setShowMediatorGuide(!showMediatorGuide)}
        >
          <Info size={16} /> {showMediatorGuide ? 'Ocultar Guia' : 'Guia da Mediadora'}
        </button>
        
        {showSuccess && <div className="save-badge"><CheckCircle size={14} /> Salvo!</div>}
      </div>

      {showMediatorGuide && (
        <div className="mediator-panel" style={{ borderLeftColor: currentColors.main }}>
          <div className="mediator-label">Sugestão de Mediação:</div>
          <p>{question.mediator || 'Incentive a aluna a tentar sozinha primeiro.'}</p>
          <div className="mediator-label">Dica para a Aluna:</div>
          <p className="student-hint">{question.hint || 'Pense na última aula...'}</p>
        </div>
      )}
    </div>
  );
};

interface UnitCardProps {
  unit: Unit;
  answers: Record<string, any>;
  onSaveAnswer: (qIdx: number, val: string) => Promise<boolean>;
  onSaveSession: (note: string) => Promise<boolean>;
  isAdmin?: boolean;
  onUpdateUnit?: (id: string, updates: Partial<Unit>) => Promise<boolean>;
}

const UnitCard: React.FC<UnitCardProps> = ({ unit, answers, onSaveAnswer, onSaveSession, isAdmin, onUpdateUnit }) => {
  const [isExpanded, setIsExpanded] = useState(false);
  const [note, setNote] = useState('');
  const [isSavingSession, setIsSavingSession] = useState(false);
  const [sessionSuccess, setSessionSuccess] = useState(false);
  
  const [editingEmbedIdx, setEditingEmbedIdx] = useState<number | null>(null);
  const [tempEmbedUrl, setTempEmbedUrl] = useState('');

  const currentColors = COLORS[unit.color] || COLORS.teal;

  const handleUpdateUnitContent = async (updates: Partial<Unit>) => {
    if (onUpdateUnit) {
      await onUpdateUnit(unit.id, updates);
    }
  };

  const deleteQuestion = (idx: number) => {
    if (window.confirm('Excluir esta pergunta permanentemente?')) {
      const newQs = [...unit.questions];
      newQs.splice(idx, 1);
      handleUpdateUnitContent({ questions: newQs });
    }
  };

  const editQuestion = (idx: number, newQ: Question) => {
    const newQs = [...unit.questions];
    newQs[idx] = newQ;
    handleUpdateUnitContent({ questions: newQs });
  };

  const deleteEmbed = (idx: number) => {
    if (window.confirm('Excluir este link interativo?')) {
      const newUrls = [...unit.embed_urls];
      newUrls.splice(idx, 1);
      handleUpdateUnitContent({ embed_urls: newUrls });
    }
  };

  const saveEmbedEdit = (idx: number) => {
    const newUrls = [...unit.embed_urls];
    newUrls[idx] = tempEmbedUrl;
    handleUpdateUnitContent({ embed_urls: newUrls });
    setEditingEmbedIdx(null);
  };

  const handleSaveSession = async () => {
    if (!note.trim() || isSavingSession) return;
    setIsSavingSession(true);
    const success = await onSaveSession(note);
    setIsSavingSession(false);
    if (success) {
      setSessionSuccess(true);
      setNote('');
      setTimeout(() => {
        setSessionSuccess(false);
        setIsExpanded(false);
      }, 2000);
    } else {
      window.alert('Erro ao salvar relatório. Verifique se você rodou o SQL de permissões para a Geocélia.');
    }
  };

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
                    {isAdmin && (
                      <div className="admin-inline-actions on-embed">
                        <button className="admin-mini-btn" onClick={() => { setEditingEmbedIdx(idx); setTempEmbedUrl(url); }}>
                          <Edit2 size={14} />
                        </button>
                        <button className="admin-mini-btn del" onClick={() => deleteEmbed(idx)}>
                          <Trash2 size={14} />
                        </button>
                      </div>
                    )}
                    <div className="embed-label" style={{ color: currentColors.main }}>
                      {editingEmbedIdx === idx ? (
                        <div className="admin-inline-edit-box">
                          <input 
                            type="text" 
                            value={tempEmbedUrl} 
                            onChange={(e) => setTempEmbedUrl(e.target.value)}
                            className="admin-inline-input"
                          />
                          <button className="admin-save-small" onClick={() => saveEmbedEdit(idx)}><Check size={14} /></button>
                          <button className="admin-cancel-small" onClick={() => setEditingEmbedIdx(null)}><X size={14} /></button>
                        </div>
                      ) : (
                        `Interativa ${idx + 1}`
                      )}
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



          {unit.questions.map((q, i) => {
            const embedCount = Array.isArray(unit.embed_urls) ? unit.embed_urls.filter(u => u.trim()).length : 0;
            return (
              <QuestionBlock 
                key={i}
                question={q}
                index={embedCount + i}
                unitId={unit.id}
                color={unit.color}
                isDone={!!answers[`${unit.id}-${i}`]?.is_done}
                savedAnswer={answers[`${unit.id}-${i}`]?.answer_value || ''}
                onSaveAnswer={(val) => onSaveAnswer(i, val)}
                isAdmin={isAdmin}
                onEdit={(newQ) => editQuestion(i, newQ)}
                onDelete={() => deleteQuestion(i)}
                isNew={q.q === 'Nova Pergunta'}
              />
            );
          })}

          {isAdmin && (
            <div style={{ padding: '0 20px 24px' }}>
              <button 
                className="admin-add-btn premium" 
                onClick={() => {
                  const newQs = [...unit.questions, { 
                    q: 'Nova Pergunta', 
                    type: 'mc', 
                    opts: ['Opção 1'],
                    mediator: 'Instrução para a mediadora...', 
                    hint: 'Dica para a aluna...' 
                  }];
                  handleUpdateUnitContent({ questions: newQs });
                }}
                style={{ width: '100%', justifyContent: 'center', padding: '14px', borderStyle: 'dashed' }}
              >
                <Plus size={18} /> Adicionar Pergunta (Estilo Google Forms)
              </button>
            </div>
          )}

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
            <div className="reporting-actions">
              <button 
                className={`save-session-btn ${sessionSuccess ? 'success' : ''}`}
                onClick={handleSaveSession}
                disabled={!note.trim() || isSavingSession}
                style={{ background: sessionSuccess ? 'var(--teal2)' : currentColors.main }}
              >
                {isSavingSession ? (
                  <div className="loader-spinner" style={{ width: '18px', height: '18px' }}></div>
                ) : sessionSuccess ? (
                  <><CheckCircle size={18} /> Relatório Salvo!</>
                ) : (
                  <><CheckCircle size={18} /> Finalizar e Salvar Relatório</>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export const Activities: React.FC<{ 
  units: Unit[]; 
  answers: Record<string, any>; 
  onSaveAnswer: (uId: string, qIdx: number, val: string) => Promise<boolean>; 
  onSaveSession: (uId: string, note: string) => Promise<boolean>;
  isAdmin?: boolean;
  onUpdateUnit?: (uId: string, updates: Partial<Unit>) => Promise<boolean>;
  onCreateUnit?: (title: string) => Promise<boolean>;
}> = ({ units, answers, onSaveAnswer, onSaveSession, isAdmin, onUpdateUnit, onCreateUnit }) => {
  
  const handleCreateUnit = async () => {
    const title = window.prompt('Qual o título da nova unidade?');
    if (title && onCreateUnit) {
      await onCreateUnit(title);
    }
  };

  return (
    <div className="screen">
      {units.map((unit) => (
        <UnitCard 
          key={unit.id} 
          unit={unit} 
          answers={answers}
          onSaveAnswer={(qIdx, val) => onSaveAnswer(unit.id, qIdx, val)}
          onSaveSession={(note) => onSaveSession(unit.id, note)}
          isAdmin={isAdmin}
          onUpdateUnit={onUpdateUnit}
        />
      ))}

      {isAdmin && (
        <div style={{ padding: '0 16px 40px' }}>
          <button 
            className="admin-add-btn premium" 
            onClick={handleCreateUnit}
            style={{ width: '100%', padding: '18px' }}
          >
            <Plus size={20} /> Criar Nova Unidade / Aula
          </button>
        </div>
      )}
    </div>
  );
};