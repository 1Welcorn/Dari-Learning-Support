import React, { useState, useEffect } from 'react';
import { supabase } from '../../services/supabase';
import { Save, Plus, Trash2, BookOpen, Target, Lightbulb, ChevronLeft } from 'lucide-react';

interface PlanningEditorProps {
  unitId: string;
  onBack: () => void;
}

const PlanningEditor: React.FC<PlanningEditorProps> = ({ unitId, onBack }) => {
  const [loading, setLoading] = useState(true);
  const [unitData, setUnitData] = useState<any>(null);
  const [newWord, setNewWord] = useState("");

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
        <button onClick={handleSave} className="save-plano-btn">
          <Save size={20} /> SALVAR PLANO
        </button>
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
          <section className="editor-section-card h-full">
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

      <style>{`
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

        @media (max-width: 992px) {
          .editor-grid { grid-template-columns: 1fr; }
        }
      `}</style>
    </div>
  );
};

export default PlanningEditor;
