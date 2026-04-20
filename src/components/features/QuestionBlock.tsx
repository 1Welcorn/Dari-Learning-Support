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
        {question.audioUrl && !isEditing && (
          <div className="q-media-audio">
            <button 
              className="audio-play-btn"
              onClick={() => {
                const audio = new Audio(question.audioUrl);
                audio.play();
              }}
              style={{ background: currentColors.main + '20', color: currentColors.main }}
            >
              <Volume2 size={18} /> Ouvir Pergunta
            </button>
          </div>
        )}

        {isEditing ? (
          <div className="admin-modern-editor">
            <div className="editor-row">
              <input 
                type="text" 
                value={editQ} 
                onChange={(e) => setEditQ(e.target.value)}
                onBlur={(e) => setLastFocusedField({ field: 'title', start: e.target.selectionStart || 0, end: e.target.selectionEnd || 0 })}
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
            <div className="tag-helper-bar" style={{ display: 'flex', gap: '8px', marginBottom: '16px', alignItems: 'center' }}>
              <span style={{ fontSize: '10px', fontWeight: 'bold', color: 'var(--ink4)', textTransform: 'uppercase' }}>Inserir Tags:</span>
              <button className="admin-tag-btn" onClick={() => insertTag('PT')}>[PT] Português</button>
              <button className="admin-tag-btn" onClick={() => insertTag('EN')}>[EN] Inglês</button>
              <div style={{ fontSize: '10px', color: 'var(--ink4)', opacity: 0.7, marginLeft: 'auto' }}>
                Selecione o texto e clique na tag.
              </div>
            </div>

            <div className="editor-tts-controls" style={{ display: 'flex', gap: '20px', margin: '12px 0', padding: '10px', background: 'var(--bg2)', borderRadius: '8px' }}>
              <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer', fontSize: '13px' }}>
                <input 
                  type="checkbox" 
                  checked={editTtsEnabled} 
                  onChange={(e) => setEditTtsEnabled(e.target.checked)} 
                />
                Permitir leitura da Pergunta (TTS)
              </label>
              <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer', fontSize: '13px' }}>
                <input 
                  type="checkbox" 
                  checked={editTtsOptionsEnabled} 
                  onChange={(e) => setEditTtsOptionsEnabled(e.target.checked)} 
                />
                Permitir leitura das Alternativas (TTS)
              </label>
            </div>

            {['mc', 'checkbox'].includes(editType) && (
              <div className="admin-options-editor">
                <label style={{ fontSize: '11px', fontWeight: 'bold', color: 'var(--teal)', marginBottom: '8px', display: 'block' }}>
                  Marque a opção correta:
                </label>
                {editOpts.map((opt, i) => (
                  <div key={i} className={`admin-opt-row ${editCorrect.includes(opt) ? 'is-correct-row' : ''}`}>
                    <button 
                      className={`admin-correct-toggle ${editCorrect.includes(opt) ? 'active' : ''}`}
                      onClick={() => toggleCorrect(opt)}
                      title="Alternar como correta"
                    >
                      {editType === 'mc' ? <Circle size={14} /> : <CheckSquare size={14} />}
                    </button>
                    <input 
                      type="text" 
                      value={opt} 
                      onChange={(e) => updateOption(i, e.target.value)}
                      onBlur={(e) => setLastFocusedField({ field: 'option', index: i, start: e.target.selectionStart || 0, end: e.target.selectionEnd || 0 })}
                      className="admin-opt-input"
                    />
                    {editCorrect.includes(opt) && (
                      <span style={{ fontSize: '10px', color: 'var(--teal)', fontWeight: 'bold', marginRight: '10px' }}>
                        <Check size={12} style={{ verticalAlign: 'middle', marginRight: '2px' }} /> RESPOSTA CORRETA
                      </span>
                    )}
                    <button className="admin-opt-del" onClick={() => removeOption(i)}><Trash2 size={12} /></button>
                  </div>
                ))}
                <button className="admin-add-opt" onClick={addOption}>
                  <Plus size={14} /> Adicionar Opção
                </button>
              </div>
            )}

            <div className="editor-media-uploads" style={{ margin: '16px 0', display: 'flex', gap: '16px', borderTop: '1px solid var(--border)', paddingTop: '16px' }}>
                <div className="media-upload-item" style={{ flex: 1 }}>
                  <label className="media-upload-label" style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer', padding: '8px 12px', background: 'var(--bg2)', borderRadius: '8px', fontSize: '13px', fontWeight: '600' }}>
                    <ImageIcon size={16} /> {editImage ? 'Alterar Imagem' : 'Adicionar Imagem'}
                    <input type="file" accept="image/*" onChange={(e) => handleFileUpload(e, 'image')} hidden />
                  </label>
                  {editImage && (
                    <div className="media-preview-mini" style={{ marginTop: '8px', position: 'relative', width: 'fit-content' }}>
                      <img src={editImage} alt="Preview" style={{ height: '60px', borderRadius: '4px', border: '1px solid var(--border)' }} />
                      <button className="remove-media" onClick={() => setEditImage('')} style={{ position: 'absolute', top: '-6px', right: '-6px', background: '#ef4444', color: 'white', border: 'none', borderRadius: '50%', width: '18px', height: '18px', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' }}>
                        <X size={10} />
                      </button>
                    </div>
                  )}
                </div>

                <div className="media-upload-item" style={{ flex: 1 }}>
                  <label className="media-upload-label" style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer', padding: '8px 12px', background: 'var(--bg2)', borderRadius: '8px', fontSize: '13px', fontWeight: '600' }}>
                    <Music size={16} /> {editAudio ? 'Alterar Áudio' : 'Adicionar Áudio'}
                    <input type="file" accept="audio/*" onChange={(e) => handleFileUpload(e, 'audio')} hidden />
                  </label>
                  {editAudio && (
                    <div className="media-preview-mini" style={{ marginTop: '8px', display: 'flex', alignItems: 'center', gap: '8px', padding: '4px 8px', background: 'var(--bg3)', borderRadius: '4px' }}>
                      <Volume2 size={14} /> <span style={{ fontSize: '11px' }}>Áudio Carregado</span>
                      <button className="remove-media" onClick={() => setEditAudio('')} style={{ background: 'none', border: 'none', color: '#ef4444', cursor: 'pointer' }}><X size={14} /></button>
                    </div>
                  )}
                </div>

                {isUploading && (
                  <div className="upload-status-mini" style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '12px', color: 'var(--teal2)' }}>
                    <Loader2 size={16} className="spin" /> Enviando...
                  </div>
                )}
            </div>

            {['text', 'paragraph'].includes(editType) && (
              <div className="admin-form-group" style={{ marginTop: '12px' }}>
                <label style={{ fontSize: '11px', fontWeight: 'bold', color: 'var(--teal)' }}>Gabarito (Resposta Esperada)</label>
                <input 
                  type="text"
                  className="admin-input-full"
                  value={editCorrect[0] || ''}
                  onChange={(e) => setEditCorrect([e.target.value])}
                  placeholder="Ex: 42, United Kingdom, etc..."
                />
              </div>
            )}

            <div className="editor-row" style={{ marginTop: '16px', display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
              <div className="admin-form-group">
                <label style={{ fontSize: '10px', textTransform: 'uppercase', color: 'var(--ink4)' }}>URL da Imagem</label>
                <div className="admin-input-with-icon">
                  <ImageIcon size={14} />
                  <input 
                    type="text" 
                    className="admin-inline-input"
                    value={editImage}
                    onChange={(e) => setEditImage(e.target.value)}
                    placeholder="https://..."
                  />
                </div>
              </div>
              <div className="admin-form-group">
                <label style={{ fontSize: '10px', textTransform: 'uppercase', color: 'var(--ink4)' }}>URL do Áudio</label>
                <div className="admin-input-with-icon">
                  <Music size={14} />
                  <input 
                    type="text" 
                    className="admin-inline-input"
                    value={editAudio}
                    onChange={(e) => setEditAudio(e.target.value)}
                    placeholder="https://..."
                  />
                </div>
              </div>
            </div>

            <div className="editor-row" style={{ marginTop: '16px', display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
              <div className="admin-form-group">
                <label style={{ fontSize: '10px', textTransform: 'uppercase', color: 'var(--ink4)' }}>Guia da Mediadora</label>
                <textarea 
                   className="admin-input-full"
                   style={{ minHeight: '60px', fontSize: '12px' }}
                   value={editMediator}
                   onChange={(e) => setEditMediator(e.target.value)}
                   placeholder="Instruções para quem aplica..."
                />
              </div>
              <div className="admin-form-group">
                <label style={{ fontSize: '10px', textTransform: 'uppercase', color: 'var(--ink4)' }}>Dica para a Aluna</label>
                <textarea 
                   className="admin-input-full"
                   style={{ minHeight: '60px', fontSize: '12px' }}
                   value={editHint}
                   onChange={(e) => setEditHint(e.target.value)}
                   placeholder="Pequena ajuda se ela travar..."
                />
              </div>
            </div>

            <div className="editor-footer" style={{ marginTop: '16px', display: 'flex', gap: '8px' }}>
              <button className="admin-save-btn" onClick={handleConfirmEdit} style={{ background: currentColors.main, color: '#fff', border: 'none', padding: '10px 20px', borderRadius: '8px', fontWeight: '700' }}>
                <Check size={16} /> Aplicar Mudanças
              </button>
              <button className="admin-cancel-btn" onClick={() => setIsEditing(false)} style={{ background: 'var(--bg)', border: '1px solid var(--border)', padding: '10px 20px', borderRadius: '8px' }}>
                Cancelar
              </button>
            </div>
          </div>
        ) : (
          <>
            <div className="q-text">
              {stripTtsTags(question.q)}
              {(question.ttsEnabled !== false) && (
                <button 
                  className="speech-mini-btn" 
                  onClick={() => {
                    if (question.audioUrl) {
                      const audio = new Audio(question.audioUrl);
                      audio.play();
                    } else {
                      speechService.speak(question.q);
                    }
                  }}
                  title={question.audioUrl ? "Ouvir áudio" : "Ouvir leitura"}
                >
                  {question.audioUrl ? <Music size={16} /> : <Volume2 size={16} />}
                </button>
              )}
            </div>

            {question.imageUrl && (
              <div className="q-image-wrap">
                <img src={question.imageUrl} alt="Conteúdo visual" className="q-image" />
              </div>
            )}

            <div className="q-input-container">
              {question.type === 'text' && (
                <input 
                  type="text"
                  className="modern-text-input"
                  placeholder="Sua resposta..."
                  value={tempAnswer}
                  onChange={(e) => setTempAnswer(e.target.value)}
                  onBlur={(e) => handleSave(e.target.value)}
                  disabled={!onSaveAnswer}
                />
              )}

              {question.type === 'paragraph' && (
                <textarea 
                  className="modern-text-input paragraph"
                  placeholder="Sua resposta longa..."
                  value={tempAnswer}
                  onChange={(e) => setTempAnswer(e.target.value)}
                  onBlur={(e) => handleSave(e.target.value)}
                  disabled={!onSaveAnswer}
                />
              )}

              {question.type === 'mc' && (
                <div className="modern-options-grid">
                  {question.opts?.map((opt, i) => {
                    const isSelected = tempAnswer === opt;
                    const isCorrect = Array.isArray(question.correctAnswer) 
                      ? question.correctAnswer.includes(opt) 
                      : opt === question.correctAnswer;
                    const showResult = !!tempAnswer && !!question.correctAnswer;
                    
                    return (
                      <button 
                        key={i}
                        className={`modern-opt-btn ${isSelected ? 'selected' : ''} ${isSelected && isCorrect ? 'reveal-correct' : ''} ${isSelected && !isCorrect ? 'reveal-wrong' : ''}`}
                        onClick={() => { 
                          setTempAnswer(opt); 
                          handleSave(opt); 
                          if (question.ttsOptionsEnabled) speechService.speak(opt);
                        }}
                        style={{ '--brand': currentColors.main } as any}
                        disabled={!onSaveAnswer}
                      >
                        <div className="opt-circle">{isSelected && <div className="inner" />}</div>
                        <span>{stripTtsTags(opt)}</span>
                        {question.ttsOptionsEnabled && (
                          <button 
                            className="speech-opt-btn"
                            onClick={(e) => {
                              e.stopPropagation();
                              speechService.speak(opt);
                            }}
                            style={{ marginLeft: 'auto', background: 'none', border: 'none', color: 'var(--ink4)', padding: '4px', cursor: 'pointer', display: 'flex', alignItems: 'center' }}
                          >
                            <Volume2 size={14} />
                          </button>
                        )}
                        {showResult && isCorrect && <Check size={14} className="result-icon" />}
                        {showResult && isSelected && !isCorrect && <X size={14} className="result-icon" />}
                      </button>
                    );
                  })}
                </div>
              )}

              {question.type === 'checkbox' && (
                <div className="modern-options-grid">
                  {question.opts?.map((opt, i) => {
                    const isSel = tempAnswer.split(', ').includes(opt);
                    const isCorrect = Array.isArray(question.correctAnswer)
                      ? question.correctAnswer.includes(opt)
                      : opt === question.correctAnswer;
                    
                    return (
                      <button 
                        key={i}
                        className={`modern-opt-btn ${isSel ? 'selected' : ''} ${isSel && isCorrect ? 'reveal-correct' : ''} ${isSel && !isCorrect ? 'reveal-wrong' : ''}`}
                        onClick={() => {
                          toggleCheckbox(opt);
                          if (question.ttsOptionsEnabled) speechService.speak(opt);
                        }}
                        style={{ '--brand': currentColors.main } as any}
                        disabled={!onSaveAnswer}
                      >
                        <div className="opt-square">{isSel && <Check size={12} />}</div>
                        <span>{stripTtsTags(opt)}</span>
                        {question.ttsOptionsEnabled && (
                          <button 
                            className="speech-opt-btn"
                            onClick={(e) => {
                              e.stopPropagation();
                              speechService.speak(opt);
                            }}
                            style={{ marginLeft: 'auto', background: 'none', border: 'none', color: 'var(--ink4)', padding: '4px', cursor: 'pointer', display: 'flex', alignItems: 'center' }}
                          >
                            <Volume2 size={14} />
                          </button>
                        )}
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
                      disabled={!onSaveAnswer}
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

      {!isEditing && (
        <div className="q-footer">
          {isAdmin && (
            <button 
              className={`mediator-hint-btn ${showMediatorGuide ? 'active' : ''}`}
              onClick={() => setShowMediatorGuide(!showMediatorGuide)}
            >
              <Info size={16} /> {showMediatorGuide ? 'Ocultar Guia' : 'Guia da Mediadora'}
            </button>
          )}
          
          {showSuccess && <div className="save-badge"><CheckCircle size={14} /> Salvo!</div>}
        </div>
      )}

      {!isEditing && showMediatorGuide && (
        <div className="mediator-panel" style={{ borderLeftColor: currentColors.main }}>
          {question.mediator && question.mediator !== 'Instrução para a mediadora...' && (
            <>
              <div className="mediator-label">Sugestão de Mediação:</div>
              <p>{question.mediator}</p>
            </>
          )}
          {question.hint && question.hint !== 'Dica para a aluna...' && (
            <>
              <div className="mediator-label">Dica para a Aluna:</div>
              <p className="student-hint">{question.hint}</p>
            </>
          )}
          {(!question.mediator || question.mediator === 'Instrução para a mediadora...') && 
           (!question.hint || question.hint === 'Dica para a aluna...') && (
            <p style={{ fontStyle: 'italic', color: 'var(--ink4)' }}>Nenhuma dica cadastrada para esta questão.</p>
          )}
        </div>
      )}
    </div>
  );
};
