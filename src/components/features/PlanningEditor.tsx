import React, { useState, useEffect } from 'react';
import { supabase } from '../../services/supabase';
import { Save, Plus, Trash2, BookOpen, Target, Lightbulb, ChevronLeft, Eye, X } from 'lucide-react';
import { UnitCard } from './Activities';

interface PlanningEditorProps {
  unitId: string;
  onBack: () => void;
}

const PlanningEditor: React.FC<PlanningEditorProps> = ({ unitId, onBack }) => {
  const [loading, setLoading] = useState(true);
  const [unitData, setUnitData] = useState<any>(null);
  const [newWord, setNewWord] = useState("");
  const [tempEmbed, setTempEmbed] = useState("");
  const [isPreviewing, setIsPreviewing] = useState(false);

  useEffect(() => {
    fetchUnit();
  }, [unitId]);

  const fetchUnit = async () => {
    const { data } = await supabase.from('units').select('*').eq('id', unitId).single();
    if (data) setUnitData(data);
    setLoading(false);
  };

  const handleSave = async () => {
    const { error } = await supabase.from('units').update(unitData).eq('id', unitId);
    if (!error) {
      alert("Planejamento atualizado! 🚀");
    } else {
      console.error('Error updating unit:', error);
      alert('Erro ao salvar: ' + error.message);
    }
  };

  const addWord = () => {
    if (!newWord.trim()) return;
    const updatedVocab = [...(unitData.vocabulary_list || []), newWord.trim()];
    setUnitData({ ...unitData, vocabulary_list: updatedVocab });
    setNewWord("");
  };

  if (loading) return (
    <div className="screen-loading">
      <div className="loader-spinner"></div>
      <p>Carregando plano...</p>
    </div>
  );

  return (
    <div className="planning-editor-view">
      <header className="editor-header no-print">
        <div className="header-left">
          <button onClick={onBack} className="back-btn-v4">
            <ChevronLeft size={24} />
          </button>
          <div>
            <h1 className="editor-title">Gestão Pedagógica</h1>
            <p className="editor-subtitle">Configurando: {unitData.title}</p>
          </div>
        </div>
        <div className="header-right">
          <button onClick={() => setIsPreviewing(true)} className="preview-plano-btn">
            <Eye size={20} /> PREVIEW
          </button>
          <button onClick={handleSave} className="save-plano-btn">
            <Save size={20} /> SALVAR PLANO
          </button>
        </div>
      </header>

      <div className="editor-grid">
        {/* Core Info Section */}
        <div className="editor-main-col">
          <section className="editor-section-card">
            <h3 className="section-title-v4">
              <Target className="text-blue" size={20} /> Objetivos de Aprendizagem
            </h3>
            <textarea 
              className="editor-textarea"
              rows={4}
              value={unitData.learning_objectives || ""}
              onChange={(e) => setUnitData({...unitData, learning_objectives: e.target.value})}
              placeholder="Ex: Identificar cores e formas..."
            />
          </section>

          <section className="editor-section-card">
            <h3 className="section-title-v4">
              <Lightbulb className="text-orange" size={20} /> Encaminhamento Metodológico
            </h3>
            <textarea 
              className="editor-textarea"
              rows={4}
              value={unitData.methodology || ""}
              onChange={(e) => setUnitData({...unitData, methodology: e.target.value})}
              placeholder="Ex: Uso de flashcards e objetos reais..."
            />
          </section>
        </div>

        {/* Vocabulary Manager Section */}
        <div className="editor-side-col">
          <section className="editor-section-card">
            <h3 className="section-title-v4">
              <Plus className="text-pink" size={20} /> Atividades Externas (Canva, HTML, Jogos)
            </h3>
            <p className="field-help">Cole aqui os links de incorporação (embed) para aparecerem como janelas interativas.</p>
            
            <div className="vocab-input-group">
              <input 
                type="text" 
                className="vocab-input-v4"
                placeholder="Link da atividade (https://...)"
                value={tempEmbed}
                onChange={(e) => setTempEmbed(e.target.value)}
              />
              <button 
                onClick={() => {
                  if (!tempEmbed.trim()) return;
                  const currentUrls = Array.isArray(unitData.embed_urls) ? unitData.embed_urls : [];
                  setUnitData({ ...unitData, embed_urls: [...currentUrls, tempEmbed.trim()] });
                  setTempEmbed("");
                }} 
                className="vocab-add-btn-v4"
              >
                <Plus size={24} />
              </button>
            </div>

            <div className="embed-list-editor">
              {(unitData.embed_urls || []).map((url: string, i: number) => (
                <div key={i} className="embed-item-mini">
                  <div className="embed-url-text" title={url}>{url}</div>
                  <button 
                    onClick={() => {
                      const filtered = unitData.embed_urls.filter((_: any, index: number) => index !== i);
                      setUnitData({ ...unitData, embed_urls: filtered });
                    }}
                    className="embed-remove-btn"
                  >
                    <X size={14} />
                  </button>
                </div>
              ))}
            </div>
          </section>

          <section className="editor-section-card">
            <h3 className="section-title-v4">
              <BookOpen className="text-emerald" size={20} /> Banco de Palavras (Word Fall)
            </h3>
            
            <div className="vocab-input-group">
              <input 
                type="text" 
                className="vocab-input-v4"
                placeholder="Nova palavra..."
                value={newWord}
                onChange={(e) => setNewWord(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && addWord()}
              />
              <button onClick={addWord} className="vocab-add-btn-v4">
                <Plus size={24} />
              </button>
            </div>

            <div className="vocab-list-v4">
              {unitData.vocabulary_list?.length === 0 && (
                <div className="empty-mini">Nenhuma palavra cadastrada para este jogo.</div>
              )}
              {unitData.vocabulary_list?.map((word: string, i: number) => (
                <span key={i} className="vocab-tag-v4 group">
                  {word}
                  <button 
                    onClick={() => {
                      const filtered = unitData.vocabulary_list.filter((_: any, index: number) => index !== i);
                      setUnitData({ ...unitData, vocabulary_list: filtered });
                    }}
                    className="vocab-tag-remove"
                  >
                    <Trash2 size={14} />
                  </button>
                </span>
              ))}
            </div>
          </section>
        </div>
      </div>

      <div className="editor-full-row" style={{ marginTop: '32px' }}>
        <section className="editor-section-card">
          <h3 className="section-title-v4">
            <Plus className="text-purple" size={20} /> Questões Interativas (Estilo Google Forms)
          </h3>
          
          <div className="questions-editor-list">
            {(unitData.questions || []).map((q: any, idx: number) => (
              <div key={idx} className="question-edit-item">
                <div className="q-edit-header">
                  <span className="q-number">Questão {idx + 1}</span>
                  <button 
                    onClick={() => {
                      const newQs = [...unitData.questions];
                      newQs.splice(idx, 1);
                      setUnitData({ ...unitData, questions: newQs });
                    }}
                    className="q-delete-btn"
                  >
                    <Trash2 size={18} />
                  </button>
                </div>
                
                <div className="q-edit-body">
                  <div className="q-field">
                    <label>Pergunta</label>
                    <input 
                      type="text" 
                      value={q.q} 
                      onChange={(e) => {
                        const newQs = [...unitData.questions];
                        newQs[idx].q = e.target.value;
                        setUnitData({ ...unitData, questions: newQs });
                      }}
                      placeholder="Ex: Qual a tradução de Spoon?"
                    />
                  </div>

                  <div className="q-field-row">
                    <div className="q-field">
                      <label>Tipo</label>
                      <select 
                        value={q.type}
                        onChange={(e) => {
                          const newQs = [...unitData.questions];
                          newQs[idx].type = e.target.value;
                          setUnitData({ ...unitData, questions: newQs });
                        }}
                      >
                        <option value="mc">Múltipla Escolha</option>
                        <option value="text">Resposta Aberta</option>
                        <option value="instruction">Somente Instrução</option>
                      </select>
                    </div>

                    <div className="q-field">
                      <label>Dica TTS (Áudio)</label>
                      <input 
                        type="text" 
                        value={q.hint || ""} 
                        onChange={(e) => {
                          const newQs = [...unitData.questions];
                          newQs[idx].hint = e.target.value;
                          setUnitData({ ...unitData, questions: newQs });
                        }}
                        placeholder="Ex: [PT]Pense na cozinha...[/PT]"
                      />
                    </div>
                  </div>

                  {q.type === 'mc' && (
                    <div className="q-field">
                      <label>Opções (separadas por vírgula)</label>
                      <input 
                        type="text" 
                        value={Array.isArray(q.opts) ? q.opts.join(', ') : ""} 
                        onChange={(e) => {
                          const newQs = [...unitData.questions];
                          newQs[idx].opts = e.target.value.split(',').map(s => s.trim());
                          setUnitData({ ...unitData, questions: newQs });
                        }}
                        placeholder="Opção 1, Opção 2, Opção 3"
                      />
                    </div>
                  )}

                  <div className="q-field">
                    <label>Guia da Mediadora (Observação)</label>
                    <textarea 
                      rows={2}
                      value={q.mediator || ""}
                      onChange={(e) => {
                        const newQs = [...unitData.questions];
                        newQs[idx].mediator = e.target.value;
                        setUnitData({ ...unitData, questions: newQs });
                      }}
                      placeholder="Ex: Peça para ela apontar para o objeto real."
                    />
                  </div>
                </div>
              </div>
            ))}
            
            <button 
              className="add-question-full-btn"
              onClick={() => {
                const newQ = { q: '', type: 'mc', opts: [''], mediator: '', hint: '' };
                const newQs = [...(unitData.questions || []), newQ];
                setUnitData({ ...unitData, questions: newQs });
              }}
            >
              <Plus size={20} /> ADICIONAR NOVA QUESTÃO
            </button>
          </div>
        </section>
      </div>

      {isPreviewing && (
        <div className="preview-overlay">
          <div className="preview-modal">
            <header className="preview-header">
              <h3>Preview do Estudante</h3>
              <button onClick={() => setIsPreviewing(false)} className="close-preview-btn">
                <X size={24} />
              </button>
            </header>
            <div className="preview-content">
              <UnitCard 
                unit={unitData}
                answers={{}}
                onSaveAnswer={async () => true}
                onSaveSession={async () => true}
                isExpanded={true}
                onToggle={() => {}}
                isAdmin={false}
              />
            </div>
          </div>
        </div>
      )}

      <style>{`
        .header-right { display: flex; gap: 12px; }
        .preview-plano-btn {
          background: white;
          color: #475569;
          border: 1px solid #e2e8f0;
          padding: 16px 24px;
          border-radius: 20px;
          font-weight: 900;
          display: flex;
          align-items: center;
          gap: 12px;
        }

        .preview-overlay {
          position: fixed;
          inset: 0;
          background: rgba(0,0,0,0.5);
          backdrop-filter: blur(4px);
          z-index: 3000;
          display: flex;
          align-items: center;
          justify-content: center;
          padding: 40px;
        }
        .preview-modal {
          background: #f8fafc;
          width: 100%;
          max-width: 1000px;
          max-height: 90vh;
          border-radius: 32px;
          overflow: hidden;
          display: flex;
          flex-direction: column;
          box-shadow: 0 40px 80px -20px rgba(0,0,0,0.3);
        }
        .preview-header {
          padding: 24px 32px;
          background: white;
          border-bottom: 1px solid #e2e8f0;
          display: flex;
          justify-content: space-between;
          align-items: center;
        }
        .preview-header h3 { margin: 0; font-weight: 900; color: #1e293b; }
        .close-preview-btn { background: none; border: none; color: #94a3b8; cursor: pointer; }
        .preview-content {
          padding: 32px;
          overflow-y: auto;
          flex: 1;
        }
        .planning-editor-view {
          padding: 32px;
          background: #FDFBF7;
          min-height: 100vh;
        }
        .editor-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 40px;
        }
        .header-left {
          display: flex;
          align-items: center;
          gap: 20px;
        }
        .back-btn-v4 {
          background: white;
          border: 1px solid #e2e8f0;
          width: 48px;
          height: 48px;
          border-radius: 16px;
          display: flex;
          align-items: center;
          justify-content: center;
          color: #64748b;
          cursor: pointer;
        }
        .editor-title { font-size: 28px; font-weight: 900; color: #1e293b; margin: 0; }
        .editor-subtitle { color: #64748b; font-weight: 600; margin-top: 4px; }
        
        .save-plano-btn {
          background: #059669;
          color: white;
          padding: 16px 32px;
          border-radius: 20px;
          font-weight: 900;
          display: flex;
          align-items: center;
          gap: 12px;
          box-shadow: 0 10px 20px rgba(5, 150, 105, 0.2);
          border: none;
        }

        .editor-grid {
          display: grid;
          grid-template-columns: 1fr 400px;
          gap: 32px;
        }
        
        .editor-section-card {
          background: white;
          padding: 32px;
          border-radius: 32px;
          border: 1px solid #f1f5f9;
          box-shadow: 0 4px 6px -1px rgba(0,0,0,0.02);
          margin-bottom: 24px;
        }

        .section-title-v4 {
          font-size: 12px;
          font-weight: 900;
          text-transform: uppercase;
          letter-spacing: 0.1em;
          color: #64748b;
          margin-bottom: 24px;
          display: flex;
          align-items: center;
          gap: 10px;
        }

        .editor-textarea {
          width: 100%;
          border: none;
          background: #f8fafc;
          border-radius: 24px;
          padding: 24px;
          font-size: 16px;
          color: #334155;
          line-height: 1.6;
          outline: none;
          resize: none;
        }

        .vocab-input-group {
          display: flex;
          gap: 12px;
          margin-bottom: 24px;
        }
        .vocab-input-v4 {
          flex: 1;
          background: #f8fafc;
          border: none;
          border-radius: 16px;
          padding: 16px 20px;
          font-size: 15px;
          outline: none;
        }
        .vocab-add-btn-v4 {
          background: #ecfdf5;
          color: #059669;
          border: none;
          width: 54px;
          height: 54px;
          border-radius: 16px;
          display: flex;
          align-items: center;
          justify-content: center;
        }

        .vocab-list-v4 {
          display: flex;
          flex-wrap: wrap;
          gap: 10px;
        }
        .vocab-tag-v4 {
          background: white;
          border: 1px solid #f1f5f9;
          padding: 8px 16px;
          border-radius: 99px;
          font-size: 14px;
          font-weight: 800;
          color: #475569;
          display: flex;
          align-items: center;
          gap: 10px;
        }
        .vocab-tag-remove {
          border: none;
          background: none;
          color: #cbd5e1;
          cursor: pointer;
        }
        .vocab-tag-remove:hover { color: #ef4444; }

        .questions-editor-list {
          display: flex;
          flex-direction: column;
          gap: 20px;
        }

        .question-edit-item {
          background: #f8fafc;
          border-radius: 24px;
          padding: 24px;
          border: 1px solid #e2e8f0;
        }

        .q-edit-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 20px;
        }

        .q-number {
          font-weight: 900;
          color: #6366f1;
          font-size: 14px;
        }

        .q-delete-btn {
          background: #fee2e2;
          color: #ef4444;
          border: none;
          padding: 8px;
          border-radius: 12px;
          cursor: pointer;
        }

        .q-edit-body {
          display: flex;
          flex-direction: column;
          gap: 16px;
        }

        .q-field {
          display: flex;
          flex-direction: column;
          gap: 8px;
        }

        .q-field label {
          font-size: 12px;
          font-weight: 800;
          color: #94a3b8;
          text-transform: uppercase;
        }

        .q-field input, .q-field select, .q-field textarea {
          background: white;
          border: 1px solid #e2e8f0;
          border-radius: 14px;
          padding: 12px 16px;
          font-size: 14px;
          color: #1e293b;
          outline: none;
        }

        .q-field-row {
          display: grid;
          grid-template-columns: 200px 1fr;
          gap: 16px;
        }

        .add-question-full-btn {
          background: white;
          border: 2px dashed #e2e8f0;
          color: #64748b;
          padding: 20px;
          border-radius: 24px;
          font-weight: 800;
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 12px;
          cursor: pointer;
          transition: all 0.2s;
        }

        .add-question-full-btn:hover {
          border-color: #6366f1;
          color: #6366f1;
          background: #f5f3ff;
        }

        .embed-list-editor {
          display: flex;
          flex-direction: column;
          gap: 10px;
          margin-top: 16px;
        }

        .embed-item-mini {
          background: #f8fafc;
          padding: 12px 16px;
          border-radius: 12px;
          display: flex;
          justify-content: space-between;
          align-items: center;
          gap: 10px;
          border: 1px solid #e2e8f0;
        }

        .embed-url-text {
          font-size: 12px;
          color: #64748b;
          white-space: nowrap;
          overflow: hidden;
          text-overflow: ellipsis;
          flex: 1;
        }

        .embed-remove-btn {
          background: none;
          border: none;
          color: #94a3b8;
          cursor: pointer;
        }

        .embed-remove-btn:hover { color: #ef4444; }

        .field-help {
          font-size: 12px;
          color: #94a3b8;
          margin-bottom: 12px;
          font-weight: 500;
        }
      `}</style>
    </div>
  );
};

export default PlanningEditor;
