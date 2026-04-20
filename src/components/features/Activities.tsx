import React, { useState, useMemo } from 'react';
import type { Unit, Question } from '../../types';
import { COLORS } from '../../constants';
import { ChevronDown, FileText, Edit2, Trash2, X, Check, Plus, CheckCircle, ChefHat, Headphones, User, Building2, Smartphone, BookOpen, GraduationCap } from 'lucide-react';
import { QuestionBlock } from './QuestionBlock';
import { useAuth } from '../../context/AuthContext';
import { useStudentJourney } from '../../hooks/useStudentJourney';

// Local QuestionBlock implementation removed in favor of shared component

interface UnitCardProps {
  unit: Unit;
  answers: Record<string, any>;
  onSaveAnswer: (qIdx: number, val: string) => Promise<boolean>;
  onSaveSession: (note: string) => Promise<boolean>;
  isAdmin?: boolean;
  onUpdateUnit?: (id: string, updates: Partial<Unit>) => Promise<boolean>;
  isExpanded: boolean;
  onToggle: () => void;
}

const getUnitIcon = (title: string) => {
  const t = title.toLowerCase();
  if (t.includes('cozinha') || t.includes('kitchen')) return <ChefHat size={36} strokeWidth={1.5} />;
  if (t.includes('escuta') || t.includes('listening') || t.includes('família')) return <Headphones size={36} strokeWidth={1.5} />;
  if (t.includes('nome') || t.includes('gosto') || t.includes('perfil') || t.includes('intro')) return <User size={36} strokeWidth={1.5} />;
  if (t.includes('redor') || t.includes('city') || t.includes('around') || t.includes('cidade')) return <Building2 size={36} strokeWidth={1.5} />;
  if (t.includes('celular') || t.includes('digital') || t.includes('phone')) return <Smartphone size={36} strokeWidth={1.5} />;
  if (t.includes('receita') || t.includes('book') || t.includes('estudo')) return <BookOpen size={36} strokeWidth={1.5} />;
  return <GraduationCap size={36} strokeWidth={1.5} />;
};

const UnitCard: React.FC<UnitCardProps> = ({ unit, answers, onSaveAnswer, onSaveSession, isAdmin, onUpdateUnit, isExpanded, onToggle }) => {
  const [note, setNote] = useState('');
  const [isSavingSession, setIsSavingSession] = useState(false);
  const [sessionSuccess, setSessionSuccess] = useState(false);
  
  const [editingEmbedIdx, setEditingEmbedIdx] = useState<number | null>(null);
  const [tempEmbedUrl, setTempEmbedUrl] = useState('');
  const [showBrief, setShowBrief] = useState(false);
  const [isEditingBrief, setIsEditingBrief] = useState(false);
  const [tempBrief, setTempBrief] = useState(unit.brief || '');

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
    const newUrls = [...(unit.embed_urls || [])];
    newUrls.splice(idx, 1);
      handleUpdateUnitContent({ embed_urls: newUrls });
    }
  };

  const saveEmbedEdit = (idx: number) => {
    const newUrls = [...(unit.embed_urls || [])];
    newUrls[idx] = tempEmbedUrl;
    handleUpdateUnitContent({ embed_urls: newUrls });
    setEditingEmbedIdx(null);
  };

  const { user } = useAuth();
  const { completeLesson } = useStudentJourney(user?.id || '');

  const handleSaveSession = async () => {
    if (!note.trim() || isSavingSession) return;
    setIsSavingSession(true);
    const success = await onSaveSession(note);
    setIsSavingSession(false);
    
    if (success) {
      // Reward XP and mark as completed in student_progress
      await completeLesson(unit.id, 50);
      
      setSessionSuccess(true);
      setNote('');
      setTimeout(() => {
        setSessionSuccess(false);
        onToggle();
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
    <div className={`adventure-card ${isExpanded ? 'expanded' : ''}`} style={{ borderBottomColor: currentColors.main }}>
      <div className="unit-hdr-v4" onClick={onToggle}>
        <div className="unit-icon-island" style={{ background: currentColors.light, color: currentColors.main }}>
          {getUnitIcon(unit.title)}
        </div>

        <div className="unit-content-v4">
          <div className="unit-header-top-v4">
            <p className="unit-status-text" style={{ color: currentColors.main }}>
              {isComplete ? 'MODULO CONCLUÍDO ✓' : 'MÓDULO EM PROGRESSO'}
            </p>
            <h3 className="unit-title-v4">
              {unit.title}
            </h3>
          </div>

          <div className="unit-info-v4">
            <p className="unit-meta-v4">{unit.sub?.split('·')[0]}</p>
            
            <div className="unit-tags-row-v4">
              {Array.isArray(unit.descriptors) && unit.descriptors.map(tag => (
                <span key={tag} className="skill-badge-v4" style={{ background: currentColors.light, color: currentColors.dark }}>
                  {getSkillBadge(tag)}
                </span>
              ))}
            </div>

            <div className="unit-footer-v4">
              <div className="unit-progress-bar-v4">
                <div className="unit-progress-fill-v4" style={{ width: `${(questionsDone/unit.questions.length)*100}%`, background: currentColors.main }}></div>
              </div>
              <span className="unit-progress-text-v4">{questionsDone}/{unit.questions.length}</span>
            </div>
          </div>
        </div>
        
        <div className="unit-chevron-v4">
           <ChevronDown size={24} className={`chev-v4 ${isExpanded ? 'open' : ''}`} />
        </div>
      </div>

      {isExpanded && (
        <div className="unit-body">
          {unit.brief && (
            <div className="mediator-brief-container">
              <button 
                className={`mediator-hint-btn ${showBrief ? 'active' : ''}`}
                onClick={() => setShowBrief(!showBrief)}
                style={{ marginBottom: showBrief ? '12px' : '0' }}
              >
                <FileText size={16} /> {showBrief ? 'Ocultar Guia da Mediadora' : 'Ver Guia da Mediadora'}
              </button>
              
              {showBrief && (
                <div className="mediator-brief">
                  <div className="brief-label" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    Guia Geral da Mediadora
                    {isAdmin && !isEditingBrief && (
                      <button className="admin-mini-btn" onClick={() => { setIsEditingBrief(true); setTempBrief(unit.brief || ''); }}>
                        <Edit2 size={12} />
                      </button>
                    )}
                  </div>
                  {isEditingBrief ? (
                    <div className="admin-inline-edit-box" style={{ display: 'flex', gap: '12px', marginTop: '8px', alignItems: 'flex-start' }}>
                      <textarea 
                        className="admin-inline-input" 
                        style={{ minHeight: '80px', flex: 1 }}
                        value={tempBrief}
                        onChange={(e) => setTempBrief(e.target.value)}
                      />
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                        <button className="admin-save-tiny" onClick={() => { handleUpdateUnitContent({ brief: tempBrief }); setIsEditingBrief(false); }} title="Salvar">
                          <Check size={18} />
                        </button>
                        <button className="admin-cancel-tiny" onClick={() => setIsEditingBrief(false)} title="Cancelar">
                          <X size={18} />
                        </button>
                      </div>
                    </div>
                  ) : (
                    unit.brief
                  )}
                </div>
              )}
            </div>
          )}

          {Array.isArray(unit.embed_urls) && unit.embed_urls.filter(u => u.trim()).length > 0 && (
            <div className="embed-container-wrapper">
              <div className="brief-label">Atividades Interativas</div>
              <div className="embed-scroll-grid">
                {unit.embed_urls.filter(u => u.trim()).map((url, idx) => (
                  <div key={idx} className="embed-block">
                    <div className="embed-label" style={{ color: currentColors.main, display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px', paddingTop: '4px' }}>
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
                      
                      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: '8px' }}>
                        <label className="embed-check-label" style={{ fontSize: '11px', color: 'var(--ink4)', display: 'flex', alignItems: 'center', gap: '4px', cursor: 'pointer' }}>
                          <span title="Este campo é para uso da Mediadora/Professor">Concluída? (Mediadora)</span>
                          <input 
                            type="checkbox" 
                            checked={!!answers[`${unit.id}-${1000 + idx}`]?.is_done}
                            onChange={(e) => onSaveAnswer(1000 + idx, e.target.checked ? 'COMPLETA' : '')}
                            style={{ width: '16px', height: '16px', accentColor: currentColors.main }}
                          />
                        </label>

                        {isAdmin && (
                          <div style={{ display: 'flex', gap: '6px' }}>
                            <button className="admin-mini-btn" style={{ padding: '4px', height: '24px', width: '24px' }} onClick={() => { setEditingEmbedIdx(idx); setTempEmbedUrl(url); }}>
                              <Edit2 size={12} />
                            </button>
                            <button className="admin-mini-btn del" style={{ padding: '4px', height: '24px', width: '24px' }} onClick={() => deleteEmbed(idx)}>
                              <Trash2 size={12} />
                            </button>
                          </div>
                        )}
                      </div>
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
            if (!isAdmin && (q.q === 'Nova Pergunta' || !q.q.trim())) return null;
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
                  const newQ: Question = { 
                    q: 'Nova Pergunta', 
                    type: 'mc', 
                    opts: ['Opção 1'],
                    mediator: '', 
                    hint: '' 
                  };
                  const newQs = [...unit.questions, newQ];
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

// Local helper for skill badges mapping
const getSkillBadge = (tag: string) => {
  const map: Record<string, string> = {
    'D2': 'Vocabulário 🍎',
    'D3': 'Gramática ✍️',
    'D5': 'Escuta 🎧',
    'D10': 'Conversa 🗣️'
  };
  return map[tag] || tag;
};

export const Activities: React.FC<{ 
  units: Unit[]; 
  answers: Record<string, any>; 
  onSaveAnswer: (uId: string, qIdx: number, val: string) => Promise<boolean>; 
  onSaveSession: (uId: string, note: string) => Promise<boolean>;
  isAdmin?: boolean;
  onUpdateUnit?: (uId: string, updates: Partial<Unit>) => Promise<boolean>;
  onCreateUnit?: (title: string) => Promise<boolean>;
  onGameOver?: (score: number, words: number) => void;
}> = ({ units, answers, onSaveAnswer, onSaveSession, isAdmin, onUpdateUnit, onCreateUnit, onGameOver }) => {
  const [expandedUnitId, setExpandedUnitId] = useState<string | null>(null);
  
  const handleCreateUnit = async () => {
    const title = window.prompt('Qual o título da nova unidade?');
    if (title && onCreateUnit) {
      await onCreateUnit(title);
    }
  };

  return (
    <div className="screen activities-screen">
      <div className="unit-grid-container">
        {units.map((unit) => (
          <UnitCard 
            key={unit.id} 
            unit={unit} 
            answers={answers}
            onSaveAnswer={(qIdx, val) => onSaveAnswer(unit.id, qIdx, val)}
            onSaveSession={(note) => onSaveSession(unit.id, note)}
            isAdmin={isAdmin}
            onUpdateUnit={onUpdateUnit}
            isExpanded={expandedUnitId === unit.id}
            onToggle={() => setExpandedUnitId(expandedUnitId === unit.id ? null : unit.id)}
          />
        ))}
      </div>

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