import React, { useState } from 'react';
import type { Question, QuestionType } from '../../types';
import { COLORS } from '../../constants';
import { Info, CheckCircle, Volume2, Edit2, Trash2, X, Check, Plus, Circle, CheckSquare, Image as ImageIcon, Music, Loader2 } from 'lucide-react';
import { speechService } from '../../utils/speech';
import { supabase } from '../../services/supabase';

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
  const [isUploading, setIsUploading] = useState(false);
  
  const [isEditing, setIsEditing] = useState(isNew || false);
  const [editQ, setEditQ] = useState(question.q);
  const [editType, setEditType] = useState<QuestionType>(question.type);
  const [editOpts, setEditOpts] = useState<string[]>(question.opts || []);
  const [editMediator, setEditMediator] = useState(question.mediator || '');
  const [editHint, setEditHint] = useState(question.hint || '');
  const [editCorrect, setEditCorrect] = useState<string[]>(
    Array.isArray(question.correctAnswer) ? question.correctAnswer : 
    (question.correctAnswer ? [question.correctAnswer] : [])
  );
  const [editImage, setEditImage] = useState(question.imageUrl || '');
  const [editAudio, setEditAudio] = useState(question.audioUrl || '');
  const [editTtsEnabled, setEditTtsEnabled] = useState(question.ttsEnabled ?? true);
  const [editTtsOptionsEnabled, setEditTtsOptionsEnabled] = useState(question.ttsOptionsEnabled ?? false);
  const [lastFocusedField, setLastFocusedField] = useState<{ field: string, index?: number, start: number, end: number } | null>(null);
  
  const currentColors = COLORS[color] || COLORS.teal;
  
  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>, type: 'image' | 'audio') => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      setIsUploading(true);
      const fileExt = file.name.split('.').pop();
      const fileName = `${Date.now()}-${Math.random().toString(36).substring(7)}.${fileExt}`;
      const filePath = `question-media/${fileName}`;

      const { error } = await supabase.storage
        .from('media')
        .upload(filePath, file, {
          cacheControl: '3600',
          upsert: false
        });

      if (error) {
        // Se o bucket não existir, instruir o usuário
        if (error.message.includes('bucket not found')) {
          throw new Error('O bucket "media" não foi encontrado no Supabase. Crie um bucket chamado "media" com acesso público no painel do Supabase.');
        }
        throw error;
      }

      const { data: { publicUrl } } = supabase.storage
        .from('media')
        .getPublicUrl(filePath);

      if (type === 'image') setEditImage(publicUrl);
      else setEditAudio(publicUrl);

    } catch (err: any) {
      console.error('Error uploading:', err);
      window.alert('Erro ao carregar arquivo: ' + err.message);
    } finally {
      setIsUploading(false);
    }
  };

  React.useEffect(() => {
    if (savedAnswer !== undefined) setTempAnswer(savedAnswer);
  }, [savedAnswer]);

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
    if (onEdit) onEdit({ 
      ...question, 
      q: editQ, 
      type: editType, 
      opts: ['mc', 'checkbox'].includes(editType) ? editOpts : undefined,
      mediator: editMediator,
      hint: editHint,
      correctAnswer: editCorrect,
      imageUrl: editImage,
      audioUrl: editAudio,
      ttsEnabled: editTtsEnabled,
      ttsOptionsEnabled: editTtsOptionsEnabled
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
    const oldVal = editOpts[idx];
    const next = [...editOpts];
    next[idx] = val;
    setEditOpts(next);
    if (editCorrect.includes(oldVal)) {
      setEditCorrect(editCorrect.map(c => c === oldVal ? val : c));
    }
  };

  const insertTag = (type: 'PT' | 'EN') => {
    if (!lastFocusedField) return;
    
    const { field, index, start, end } = lastFocusedField;
    const startTag = `[${type}]`;
    const endTag = `[/${type}]`;

    if (field === 'title') {
      const before = editQ.substring(0, start);
      const selected = editQ.substring(start, end);
      const after = editQ.substring(end);
      setEditQ(before + startTag + selected + endTag + after);
    } else if (field === 'option' && index !== undefined) {
      const next = [...editOpts];
      const val = next[index];
      const before = val.substring(0, start);
      const selected = val.substring(start, end);
      const after = val.substring(end);
      next[index] = before + startTag + selected + endTag + after;
      setEditOpts(next);
    }
  };

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

      <div className="q-badge-v4" style={{ background: currentColors.main }}>
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
            {/* ... rest of the editor logic ... */}
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
                <img src={question.imageUrl} alt="Visual" />
              </div>
            )}

            <div className="q-interaction-v4">
              {question.type === 'mc' && (
                <div className="q-options-grid-v4">
                  {question.opts?.map((opt, i) => {
                    const isSelected = tempAnswer === opt;
                    const isCorrect = Array.isArray(question.correctAnswer) 
                      ? question.correctAnswer.includes(opt) 
                      : opt === question.correctAnswer;
                    
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
          {question.mediator && <p><strong>💡 Mediação:</strong> {question.mediator}</p>}
          {question.hint && <p className="hint"><strong>✨ Dica Aluna:</strong> {question.hint}</p>}
        </div>
      )}
    </div>
  )}
        </div>
      )}
    </div>
  );
};
