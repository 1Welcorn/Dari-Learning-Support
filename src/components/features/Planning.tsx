import React, { useState } from 'react';
import type { Unit, Question } from '../../types';
import { Printer, Save, CheckCircle, Trash2, Plus } from 'lucide-react';
import { COLORS } from '../../constants';
import { QuestionBlock } from './QuestionBlock';

interface PlanningProps {
  units: Unit[];
  isAdmin: boolean;
  settings: any;
  onUpdateUnit: (id: string, updates: Partial<Unit>) => Promise<boolean>;
}

const AdminUnitResourceRow: React.FC<{ 
  unit: Unit, 
  onSave: (id: string, updates: Partial<Unit>) => Promise<boolean> 
}> = ({ unit, onSave }) => {
  const [vocabulary, setVocabulary] = useState<string[]>(unit.vocabulary_list || []);
  const [newWord, setNewWord] = useState('');
  const [isSaved, setIsSaved] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  // Sincronizar estado local se a prop unit mudar
  React.useEffect(() => {
    setEmbedUrls(unit.embed_urls || []);
    setQuestions(unit.questions || []);
    setDescText(unit.descriptors?.join(', ') || '');
    setVocabulary(unit.vocabulary_list || []);
  }, [unit]);

  const handleSave = async () => {
    setIsSaving(true);
    const descs = descText.split(',').map(v => v.trim()).filter(Boolean);
    
    const success = await onSave(unit.id, {
      embed_urls: embedUrls,
      questions: questions,
      descriptors: descs,
      vocabulary_list: vocabulary
    });
    
    setIsSaving(false);
    if (success) {
      setIsSaved(true);
      setTimeout(() => setIsSaved(false), 3000);
    }
  };

  const removeQuestion = (idx: number) => {
    if (window.confirm('Excluir esta pergunta permanentemente?')) {
      setQuestions(prev => prev.filter((_, i) => i !== idx));
    }
  };

  const removeEmbed = (idx: number) => {
    if (window.confirm('Excluir este link interativo?')) {
      setEmbedUrls(prev => prev.filter((_, i) => i !== idx));
    }
  };

  const clearAllEmbeds = () => {
    if (window.confirm('Deseja excluir TODAS as atividades interativas desta unidade?')) {
      setEmbedUrls([]);
    }
  };

  const clearAllQuestions = () => {
    if (window.confirm('Deseja excluir TODAS as perguntas desta unidade?')) {
      setQuestions([]);
    }
  };

  return (
    <div className="admin-unit-card">
      <div className="admin-unit-header">
        <div className="unit-dot" style={{ background: COLORS[unit.color]?.main || 'var(--teal)' }}></div>
        <strong>{unit.title}</strong>
      </div>
      
      {/* --- INTERATIVAS --- */}
      <div className="admin-form-group">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
          <label style={{ margin: 0 }}>Atividades Interativas ({embedUrls.length})</label>
          {embedUrls.length > 0 && (
            <button className="text-danger-btn" onClick={clearAllEmbeds} style={{ fontSize: '11px' }}>
              Limpar Interativas
            </button>
          )}
        </div>
        <div className="admin-items-list">
          {embedUrls.length === 0 ? (
            <div className="empty-mini">Nenhuma atividade interativa.</div>
          ) : (
            embedUrls.map((url, i) => (
              <div key={i} className="admin-item-row">
                <div className="admin-item-text truncate">{url}</div>
                <button className="admin-item-del" title="Excluir link" onClick={() => removeEmbed(i)}>
                  <Trash2 size={16} />
                </button>
              </div>
            ))
          )}
        </div>
        <button className="admin-add-btn" onClick={() => {
          const url = window.prompt('Cole a URL do Wordwall/Embed:');
          if (url) setEmbedUrls([...embedUrls, url]);
        }}>
          <Plus size={14} /> Adicionar Link Interativo
        </button>
      </div>

      {/* --- PERGUNTAS --- */}
      <div className="admin-form-group">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
          <label style={{ margin: 0 }}>Perguntas da Lição ({questions.length})</label>
          {questions.length > 0 && (
            <button className="text-danger-btn" onClick={clearAllQuestions} style={{ fontSize: '11px' }}>
              Limpar Perguntas
            </button>
          )}
        </div>
        <div className="admin-items-list-modern">
          {questions.length === 0 ? (
            <div className="empty-mini">Nenhuma pergunta cadastrada.</div>
          ) : (
            questions.map((q, i) => (
              <QuestionBlock 
                key={i}
                question={q}
                index={i}
                unitId={unit.id}
                color={unit.color}
                isAdmin={true}
                onEdit={(newQ) => {
                  const next = [...questions];
                  next[i] = newQ;
                  setQuestions(next);
                }}
                onDelete={() => removeQuestion(i)}
                isNew={q.q === 'Nova Pergunta'}
              />
            ))
          )}
        </div>
        <button className="admin-add-btn premium" onClick={() => {
          const newQ: Question = { 
            q: 'Nova Pergunta', 
            type: 'mc', 
            opts: ['Opção 1'],
            mediator: 'Instrução para mediadora...', 
            hint: 'Dica para a aluna...' 
          };
          setQuestions([...questions, newQ]);
        }}>
          <Plus size={14} /> Adicionar Pergunta (Estilo Google Forms)
        </button>
      </div>

      <div className="admin-form-group">
        <label>Descritores BNCC (separados por vírgula)</label>
        <input 
          type="text" 
          placeholder="D3, D5, D12..."
          value={descText}
          onChange={(e) => setDescText(e.target.value)}
          className="admin-input-full"
        />
      </div>

      {/* --- VOCABULARY MANAGER --- */}
      <div className="admin-form-group">
        <label>Vocabulário do Módulo (Para Word Fall / Games)</label>
        <div className="vocab-builder-row">
          <input 
            type="text" 
            placeholder="Ex: Refrigerator"
            value={newWord}
            onChange={(e) => setNewWord(e.target.value)}
            className="admin-input-full"
            style={{ flex: 1, marginBottom: 0 }}
            onKeyPress={(e) => {
               if (e.key === 'Enter') {
                 setVocabulary([...vocabulary, newWord]);
                 setNewWord('');
               }
            }}
          />
          <button 
            className="admin-add-btn" 
            style={{ width: 'auto', padding: '10px 20px' }}
            onClick={() => {
               if (newWord.trim()) {
                 setVocabulary([...vocabulary, newWord.trim()]);
                 setNewWord('');
               }
            }}
          >
            <Plus size={14} /> Add
          </button>
        </div>
        
        <div className="vocab-tags-cloud">
          {vocabulary.length === 0 ? (
            <div className="empty-mini">Nenhuma palavra cadastrada.</div>
          ) : (
            vocabulary.map((word, i) => (
              <span key={i} className="vocab-tag">
                {word}
                <button className="vocab-tag-del" onClick={() => setVocabulary(vocabulary.filter((_, idx) => idx !== i))}>×</button>
              </span>
            ))
          )}
        </div>
      </div>

      <button 
        className={`confirm-session-btn premium ${isSaved ? 'success' : ''}`}
        onClick={handleSave}
        disabled={isSaving}
        style={{ 
          marginTop: '15px', 
          width: '100%',
          background: isSaved ? 'var(--teal)' : COLORS[unit.color]?.main || 'var(--teal)'
        }}
      >
        {isSaving ? (
          <div className="loader-spinner" style={{ width: '18px', height: '18px' }}></div>
        ) : isSaved ? (
          <><CheckCircle size={18} /> Alterações Salvas no Banco!</>
        ) : (
          <><Save size={18} /> Salvar Alterações na Unidade</>
        )}
      </button>
    </div>
  );
};


export const Planning: React.FC<PlanningProps> = ({ units, isAdmin, settings, onUpdateUnit }) => {
  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="screen">
      <div className="plan-header-card no-print">
        <strong>Gerador de Plano Oficial</strong><br />
        Configure o PTD e exporte no formato padrão da escola.
      </div>

      <div className="plan-table-wrap">
        {/* --- OFFICIAL HEADER (MATCHES IMAGE) --- */}
        <div className="official-document-header">
          <div className="header-top-row">
            <div className="inst-text">
              <div className="inst-name">COLÉGIO ESTADUAL NOSSA SENHORA DE LOURDES</div>
              <div className="inst-levels">ENSINO FUNDAMENTAL, MÉDIO E PROFISSIONAL</div>
            </div>
          </div>
          
          <h2 className="doc-title">PLANO DE TRABALHO DOCENTE - SAREH/Domiciliar</h2>
          
          <table className="meta-table">
            <tbody>
              <tr>
                <td colSpan={3}><strong>Estudante:</strong> Ione Jordão Ribeiro</td>
              </tr>
              <tr>
                <td colSpan={2}><strong>Áreas do Conhecimento:</strong> Língua Inglesa</td>
                <td><strong>Ano:</strong> 2026</td>
              </tr>
              <tr>
                <td colSpan={2}><strong>Professor(a):</strong> WILLIANS ANTONIAZZI</td>
                <td><strong>2º e 3º trimestres</strong></td>
              </tr>
              <tr>
                <td colSpan={3}><strong>Instituição de matrícula:</strong> Colégio Estadual Nossa Senhora de Lourdes</td>
              </tr>
              <tr>
                <td><strong>Data início atendimento:</strong> {settings?.start_date || '05/02/2026'}</td>
                <td><strong>Tempo Atestado Médico:</strong> {settings?.medical_period || '05/02/2026 a 19/12/2026'}</td>
                <td><strong>CID:</strong> {settings?.cid_code || 'G71.2 / J96.1'}</td>
              </tr>
            </tbody>
          </table>
        </div>

        <table className="plan-table official">
          <thead>
            <tr>
              <th><u>Conteúdos</u></th>
              <th><u>Habilidades/Objetivos de aprendizagem</u></th>
              <th><u>Encaminhamentos metodológicos e recursos didáticos</u></th>
              <th><u>Critérios/instrumentos de avaliação</u></th>
            </tr>
          </thead>
          <tbody>
            {units.map((unit) => (
              <tr key={unit.id}>
                <td 
                  contentEditable={isAdmin}
                  onBlur={(e) => onUpdateUnit(unit.id, { plan_c: e.currentTarget.innerText })}
                  suppressContentEditableWarning
                >
                  {unit.plan_c}
                </td>
                <td 
                  contentEditable={isAdmin}
                  onBlur={(e) => onUpdateUnit(unit.id, { plan_h: e.currentTarget.innerText })}
                  suppressContentEditableWarning
                >
                  {unit.plan_h}
                </td>
                <td 
                  contentEditable={isAdmin}
                  onBlur={(e) => onUpdateUnit(unit.id, { plan_e: e.currentTarget.innerText })}
                  suppressContentEditableWarning
                >
                  {unit.plan_e}
                </td>
                <td 
                  contentEditable={isAdmin}
                  onBlur={(e) => onUpdateUnit(unit.id, { plan_a: e.currentTarget.innerText })}
                  suppressContentEditableWarning
                >
                  {unit.plan_a}
                </td>
              </tr>
            ))}
          </tbody>
        </table>

        {/* --- OFFICIAL FOOTER --- */}
        <div className="official-document-footer">
          <div className="signature-row">
            <div className="sig-block">
              <div className="sig-line"></div>
              <div className="sig-label">Ass. professor:</div>
            </div>
            <div className="sig-block">
              <div className="sig-line"></div>
              <div className="sig-label">Nome e assinatura Equipe Pedagógica</div>
            </div>
          </div>
        </div>
      </div>

      {isAdmin && (
        <div className="no-print" style={{ marginTop: '60px' }}>
          <h3 className="section-title-small" style={{ textAlign: 'left', marginBottom: '8px' }}>Gerenciamento de Recursos Digitais</h3>
          <p style={{ fontSize: '13px', color: 'var(--ink3)', marginBottom: '24px' }}>
            Adicione jogos do Wordwall, vídeos ou descritores pedagógicos para cada aula.
          </p>
          
          <div className="admin-units-grid">
            {units.map(unit => (
              <AdminUnitResourceRow 
                key={unit.id} 
                unit={unit} 
                onSave={onUpdateUnit} 
              />
            ))}
          </div>
        </div>
      )}

      <div className="no-print" style={{ marginTop: '20px', display: 'flex', gap: '10px', paddingBottom: '40px' }}>
        <button className="export-btn" onClick={handlePrint}>
          <Printer size={18} /> Imprimir / Gerar PDF do Plano
        </button>
      </div>

      <style>{`
        @media print {
          .no-print, nav, .topbar { display: none !important; }
          .screen { padding: 0 !important; margin: 0 !important; }
          .plan-table-wrap { width: 100% !important; margin: 0 !important; overflow: visible !important; }
          .plan-table { font-size: 11px !important; border-collapse: collapse !important; width: 100% !important; border: 1px solid #000 !important; }
          .plan-table th, .plan-table td { border: 1px solid #000 !important; padding: 12px 8px !important; vertical-align: top !important; line-height: 1.4 !important; }
          .official-document-header { margin-bottom: 20px !important; }
          .meta-table td { padding: 8px !important; border: 1px solid #000 !important; }
          body { background: #fff !important; color: #000 !important; }
        }
        .plan-table.official td {
          min-height: 100px;
          white-space: pre-wrap;
        }
      `}</style>
    </div>
  );
};
