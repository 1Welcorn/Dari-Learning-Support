import React, { useState } from 'react';
import type { Unit } from '../../types';
import { Printer, Save, CheckCircle } from 'lucide-react';
import { COLORS } from '../../constants';

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
  const [embedText, setEmbedText] = useState(unit.embed_urls?.join('\n') || '');
  const [descText, setDescText] = useState(unit.descriptors?.join(', ') || '');
  const [isSaved, setIsSaved] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  // Sincronizar estado local se a prop unit mudar (ex: após fetch)
  React.useEffect(() => {
    setEmbedText(unit.embed_urls?.join('\n') || '');
    setDescText(unit.descriptors?.join(', ') || '');
  }, [unit.embed_urls, unit.descriptors]);

  const handleSave = async () => {
    setIsSaving(true);
    const urls = embedText.split('\n').map(v => v.trim()).filter(Boolean);
    const descs = descText.split(',').map(v => v.trim()).filter(Boolean);
    
    const success = await onSave(unit.id, {
      embed_urls: urls,
      descriptors: descs
    });
    
    setIsSaving(false);
    if (success) {
      setIsSaved(true);
      setTimeout(() => setIsSaved(false), 3000);
    }
  };

  return (
    <div className="admin-unit-card">
      <div className="admin-unit-header">
        <div className="unit-dot" style={{ background: COLORS[unit.color]?.main || 'var(--teal)' }}></div>
        <strong>{unit.title}</strong>
      </div>
      
      <div className="admin-form-group">
        <label>Atividades HTML (Wordwall, etc.) - Uma por linha</label>
        <textarea 
          rows={3}
          placeholder="https://wordwall.net/embed/..."
          value={embedText}
          onChange={(e) => setEmbedText(e.target.value)}
          style={{ 
            width: '100%', 
            padding: '12px', 
            borderRadius: '12px', 
            border: '2px solid var(--border)', 
            background: 'var(--bg)',
            fontSize: '13px',
            resize: 'vertical'
          }}
        />
      </div>

      <div className="admin-form-group">
        <label>Descritores BNCC (D3, D5, D12... separados por vírgula)</label>
        <input 
          type="text" 
          placeholder="D3, D5, D12..."
          value={descText}
          onChange={(e) => setDescText(e.target.value)}
        />
      </div>

      <button 
        className={`confirm-session-btn ${isSaved ? 'success' : ''}`}
        onClick={handleSave}
        style={{ 
          marginTop: '10px', 
          width: '100%',
          background: isSaved ? 'var(--teal)' : COLORS[unit.color]?.main || 'var(--teal)'
        }}
      >
        {isSaving ? (
          <div className="loader-spinner" style={{ width: '18px', height: '18px', borderWeight: '2px' }}></div>
        ) : isSaved ? (
          <><CheckCircle size={18} /> Salvo!</>
        ) : (
          <><Save size={18} /> Salvar Recursos</>
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
            <div className="inst-logo-placeholder">
              <img src="https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcR6A6R4P6P8Qz_QyXzV8p_M_O_eL_R0_V_o_g&s" alt="Logo Escola" className="doc-logo" />
            </div>
            <div className="inst-text">
              <div className="inst-name">COLÉGIO ESTADUAL NOSSA SENHORA DE LOURDES</div>
              <div className="inst-levels">ENSINO FUNDAMENTAL, MÉDIO E PROFISSIONAL</div>
            </div>
            <div className="inst-logo-placeholder">
               <img src="https://logodownload.org/wp-content/uploads/2014/10/parana-logo-8.png" alt="Logo PR" className="doc-logo" />
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
          .plan-table { font-size: 10px !important; border-collapse: collapse !important; width: 100% !important; }
          .plan-table th, .plan-table td { border: 1px solid #000 !important; padding: 6px !important; }
          .print-only-header { display: block !important; }
          body { background: #fff !important; }
        }
      `}</style>
    </div>
  );
};
