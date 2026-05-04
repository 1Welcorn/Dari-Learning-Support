import React, { useState } from 'react';
import type { Question, QuestionType } from '../../types';
import { COLORS } from '../../constants';
import { Info, CheckCircle, Volume2, Edit2, Trash2, Check, Circle, Music, Plus } from 'lucide-react';
import { speechService } from '../../utils/speech';
import { VideoPlayerV5, DelayedIframe } from './Activities';
// import { supabase } from '../../services/supabase';

interface QuestionBlockProps {
  question: Question;
  index: number;
  unitId: string;
  color: string;
  isDone?: boolean;
  savedAnswer?: string;
  onSaveAnswer?: (val: string) => Promise<boolean>;
  isAdmin?: boolean;
  onEdit?: (newQ: Question) => void;
  onDelete?: () => void;
  isNew?: boolean;
}

export const QuestionBlock: React.FC<QuestionBlockProps> = ({ 
  question, index, color, isDone, savedAnswer, onSaveAnswer, isAdmin, onEdit, onDelete, isNew 
}) => {
  const [showMediatorGuide, setShowMediatorGuide] = useState(false);
  const [tempAnswer, setTempAnswer] = useState(savedAnswer || '');
  const [isSaving, setIsSaving] = useState(false);
  
  const stripTtsTags = (text: string) => text.replace(/\[\/?(PT|EN)\]/gi, '');
  const [showSuccess, setShowSuccess] = useState(false);
  // const [isUploading, setIsUploading] = useState(false);
  
  const [isEditing, setIsEditing] = useState(isNew || false);
  const [editQ, setEditQ] = useState(question.q);
  const [editType, _setEditType] = useState<QuestionType>(question.type);
  const [editOpts, setEditOpts] = useState<string[]>(question.opts || []);
  const [_editMediator, _setEditMediator] = useState(question.mediator || '');
  const [_editHint, _setEditHint] = useState(question.hint || '');
  const [editCorrect, setEditCorrect] = useState<string[]>(
    Array.isArray(question.correctAnswer) ? question.correctAnswer : 
    (question.correctAnswer && typeof question.correctAnswer === 'string' ? [question.correctAnswer] : [])
  );
  const [editOpenCorrect, setEditOpenCorrect] = useState(() =>
    typeof question.correctAnswer === 'string'
      ? question.correctAnswer
      : Array.isArray(question.correctAnswer)
        ? question.correctAnswer.join('\n')
        : ''
  );
  const [editImage, _setEditImage] = useState(question.imageUrl || '');
  const [editAudio, _setEditAudio] = useState(question.audioUrl || '');
  const [editTtsEnabled, _setEditTtsEnabled] = useState(question.ttsEnabled ?? true);
  const [editTtsOptionsEnabled, _setEditTtsOptionsEnabled] = useState(question.ttsOptionsEnabled ?? false);
  const [editAutoPlayOnce, setEditAutoPlayOnce] = useState(question.autoPlayOnce ?? false);
  const [editDelay, setEditDelay] = useState(question.delay ?? 0);
  const [_lastFocusedField, _setLastFocusedField] = useState<{ field: string, index?: number, start: number, end: number } | null>(null);
  
  const currentColors = COLORS[color] || COLORS.emerald || { main: '#10b981', light: '#ecfdf5', dark: '#064e3b' };
  
  /*
  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>, type: 'image' | 'audio') => {
    ...
  };
  */

  React.useEffect(() => {
    if (savedAnswer !== undefined) setTempAnswer(savedAnswer);
  }, [savedAnswer]);

  React.useEffect(() => {
    if (!isEditing) return;
    setEditOpenCorrect(
      typeof question.correctAnswer === 'string'
        ? question.correctAnswer
        : Array.isArray(question.correctAnswer)
          ? question.correctAnswer.join('\n')
          : ''
    );
  }, [isEditing, question.correctAnswer]);

  const handleSave = async (val: string) => {
    if (!onSaveAnswer || isSaving) return;
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
    const openTypes: QuestionType[] = ['text', 'paragraph'];
    const correctForType =
      openTypes.includes(editType)
        ? (editOpenCorrect.trim() ? editOpenCorrect.trim() : undefined)
        : editCorrect.length
          ? editCorrect
          : undefined;
    if (onEdit) onEdit({ 
      ...question, 
      q: editQ, 
      type: editType, 
      opts: ['mc', 'checkbox'].includes(editType) ? editOpts : undefined,
      mediator: _editMediator,
      hint: _editHint,
      correctAnswer: correctForType as Question['correctAnswer'],
      imageUrl: editImage,
      audioUrl: editAudio,
      ttsEnabled: editTtsEnabled,
      ttsOptionsEnabled: editTtsOptionsEnabled,
      autoPlayOnce: editAutoPlayOnce,
      delay: editDelay
    });
    setIsEditing(false);
  };
  const toggleCorrect = (opt: string) => {
    if (editCorrect.includes(opt)) {
      setEditCorrect(editCorrect.filter(o => o !== opt));
    } else {
      setEditCorrect([...editCorrect, opt]);
    }
  };

  const addOption = () => {
    setEditOpts([...editOpts, `Opção ${editOpts.length + 1}`]);
  };

  const removeOption = (idx: number) => {
    setEditOpts(editOpts.filter((_, i) => i !== idx));
  };

  const updateOption = (idx: number, val: string) => {
    const oldVal = editOpts[idx];
    const next = [...editOpts];
    next[idx] = val;
    setEditOpts(next);
    if (editCorrect.includes(oldVal)) {
      setEditCorrect(editCorrect.map(c => c === oldVal ? val : c));
    }
  };

  /*
  const insertTag = (type: 'PT' | 'EN') => {
    ...
  };
  */

  return (
    <div className={`q-block-v4 ${isDone ? 'is-done' : ''}`} style={{ '--unit-color': currentColors.main, '--unit-bg': currentColors.light } as any}>
      {isAdmin && (
        <div className="admin-actions-v4">
          <button className="admin-btn-v4" onClick={() => setIsEditing(!isEditing)} title="Editar">
            <Edit2 size={14} />
          </button>
          <button className="admin-btn-v4 del" onClick={onDelete} title="Excluir">
            <Trash2 size={14} />
          </button>
        </div>
      )}

      <div className="q-badge-v4" style={{ background: currentColors.accent }}>
        QUESTÃO {index + 1}
      </div>

      <div className="q-body-v4">
        {isEditing ? (
          <div className="admin-modern-editor">
            {/* Editor remains functional but within new styling context */}
            <div className="editor-row">
              <input 
                type="text" 
                value={editQ} 
                onChange={(e) => setEditQ(e.target.value)}
                placeholder="Título da pergunta"
                className="admin-inline-input title"
              />
            </div>
            {(editType === 'text' || editType === 'paragraph') && (
              <div className="editor-row" style={{ marginTop: 12 }}>
                <label style={{ display: 'block', fontSize: 12, fontWeight: 800, color: '#64748b', marginBottom: 6 }}>
                  Resposta correta / esperada (referência para correção — a aluna não vê)
                </label>
                <textarea
                  className="admin-inline-input"
                  rows={editType === 'paragraph' ? 4 : 2}
                  value={editOpenCorrect}
                  onChange={(e) => setEditOpenCorrect(e.target.value)}
                  placeholder="Ex: spoon, colher (aceite várias linhas como respostas aceitáveis)"
                  style={{ minHeight: editType === 'paragraph' ? 100 : 56 }}
                />
              </div>
            )}
            {(['mc', 'checkbox'] as QuestionType[]).includes(editType) && (
              <div className="editor-row" style={{ marginTop: 12 }}>
                <label style={{ display: 'block', fontSize: 12, fontWeight: 800, color: '#64748b', marginBottom: 6 }}>
                  Opções e resposta(s) correta(s)
                </label>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                  {editOpts.map((opt, i) => (
                    <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                      {editType === 'mc' ? (
                        <input
                          type="radio"
                          name={`mc-correct-${index}`}
                          checked={editCorrect.includes(opt)}
                          onChange={() => setEditCorrect([opt])}
                        />
                      ) : (
                        <input
                          type="checkbox"
                          checked={editCorrect.includes(opt)}
                          onChange={() => toggleCorrect(opt)}
                        />
                      )}
                      <input
                        type="text"
                        value={opt}
                        onChange={(e) => updateOption(i, e.target.value)}
                        className="admin-inline-input"
                        style={{ flex: 1 }}
                      />
                      <button className="admin-cancel-btn" onClick={() => removeOption(i)} style={{ whiteSpace: 'nowrap' }}>
                        Remover
                      </button>
                    </div>
                  ))}
                  <div>
                    <button className="admin-add-btn" onClick={addOption} style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}>
                      <Plus size={14} /> Adicionar opção
                    </button>
                  </div>
                </div>
              </div>
            )}
            <div className="editor-footer" style={{ marginTop: '16px', display: 'flex', gap: '8px' }}>
              <button className="admin-save-btn" onClick={handleConfirmEdit} style={{ background: currentColors.main, color: '#fff' }}>
                <Check size={16} /> Aplicar Mudanças
              </button>
              <button className="admin-cancel-btn" onClick={() => setIsEditing(false)}>
                Cancelar
              </button>
            </div>
          </div>
        ) : (
          <>
            <h2 className="q-text-v4">
              {stripTtsTags(question.q)}
              {(question.ttsEnabled !== false) && (
                <button 
                  className="speech-btn-v4" 
                  onClick={() => {
                    if (question.audioUrl) {
                      const audio = new Audio(question.audioUrl);
                      audio.play();
                    } else {
                      speechService.speak(question.q);
                    }
                  }}
                  style={{ color: currentColors.main }}
                >
                  {question.audioUrl ? <Music size={20} /> : <Volume2 size={20} />}
                </button>
              )}
            </h2>

            {question.imageUrl && (
              <div className="q-image-v4">
                {(() => {
                  const url = question.imageUrl.toLowerCase();
                  const isVideo = url.endsWith('.mp4') || url.endsWith('.webm') || url.includes('player.cloudinary.com');
                  if (isVideo) {
                    return <VideoPlayerV5 media={{ label: 'video', url: question.imageUrl, autoPlayOnce: question.autoPlayOnce, delay: question.delay }} />;
                  }
                  return <img src={question.imageUrl} alt="Visual" />;
                })()}
              </div>
            )}

            <div className="q-interaction-v4">
              {question.type === 'mc' && (
                <div className="q-options-grid-v4">
                  {question.opts?.map((opt, i) => {
                    const isSelected = tempAnswer === opt;
                    
                    
                    return (
                      <button 
                        key={i}
                        className={`q-opt-btn-v4 ${isSelected ? 'selected' : ''}`}
                        onClick={() => { 
                          setTempAnswer(opt); 
                          handleSave(opt); 
                          if (question.ttsOptionsEnabled) speechService.speak(opt);
                        }}
                        disabled={!onSaveAnswer}
                      >
                        <div className="opt-indicator-v4">
                          {isSelected ? <CheckCircle size={20} /> : <Circle size={20} />}
                        </div>
                        <span className="opt-label-v4">{stripTtsTags(opt)}</span>
                      </button>
                    );
                  })}
                </div>
              )}

              {question.type === 'text' && (
                <div className="q-input-wrap-v4">
                  <input 
                    type="text"
                    className="q-input-v4"
                    placeholder="Escreva sua resposta aqui..."
                    value={tempAnswer}
                    onChange={(e) => setTempAnswer(e.target.value)}
                    onBlur={(e) => handleSave(e.target.value)}
                    disabled={!onSaveAnswer}
                  />
                </div>
              )}

              {question.type === 'paragraph' && (
                <div className="q-input-wrap-v4">
                  <textarea 
                    className="q-input-v4 paragraph"
                    placeholder="Escreva sua resposta longa..."
                    value={tempAnswer}
                    onChange={(e) => setTempAnswer(e.target.value)}
                    onBlur={(e) => handleSave(e.target.value)}
                    disabled={!onSaveAnswer}
                  />
                </div>
              )}
            </div>
          </>
        )}
      </div>

      {!isEditing && (
        <div className="q-footer-v4">
          {isAdmin && (
            <button 
              className={`q-mediator-btn-v4 ${showMediatorGuide ? 'active' : ''}`}
              onClick={() => setShowMediatorGuide(!showMediatorGuide)}
            >
              <Info size={16} /> {showMediatorGuide ? 'Ocultar Dicas' : 'Dicas da Mediadora'}
            </button>
          )}
          {showSuccess && <div className="q-save-status-v4"><Check size={14} /> Resposta enviada!</div>}
        </div>
      )}

      {!isEditing && showMediatorGuide && (
        <div className="q-mediator-panel-v4">
          {isAdmin && (question.type === 'text' || question.type === 'paragraph') && question.correctAnswer && (
            <p className="admin-correct-ref-v4">
              <strong>✓ Resposta de referência:</strong>{' '}
              {typeof question.correctAnswer === 'string'
                ? question.correctAnswer
                : (question.correctAnswer as string[]).join(' · ')}
            </p>
          )}
          {question.mediator && <p><strong>💡 Mediação:</strong> {question.mediator}</p>}
          {question.hint && <p className="hint"><strong>✨ Dica Aluna:</strong> {question.hint}</p>}
        </div>
      )}
    </div>
  );
};
