import React from 'react';
import type { Unit } from '../../types';
import { Printer } from 'lucide-react';
import { COLORS } from '../../constants';

interface PlanningProps {
  units: Unit[];
  isAdmin: boolean;
  settings: any;
  onUpdateUnit: (id: string, field: string, val: any) => void;
}

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
                  onBlur={(e) => onUpdateUnit(unit.id, 'plan_c', e.currentTarget.innerText)}
                  suppressContentEditableWarning
                >
                  {unit.plan_c}
                </td>
                <td 
                  contentEditable={isAdmin}
                  onBlur={(e) => onUpdateUnit(unit.id, 'plan_h', e.currentTarget.innerText)}
                  suppressContentEditableWarning
                >
                  {unit.plan_h}
                </td>
                <td 
                  contentEditable={isAdmin}
                  onBlur={(e) => onUpdateUnit(unit.id, 'plan_e', e.currentTarget.innerText)}
                  suppressContentEditableWarning
                >
                  {unit.plan_e}
                </td>
                <td 
                  contentEditable={isAdmin}
                  onBlur={(e) => onUpdateUnit(unit.id, 'plan_a', e.currentTarget.innerText)}
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
              <div key={unit.id} className="admin-unit-card">
                <div className="admin-unit-header">
                  <div className="unit-dot" style={{ background: COLORS[unit.color]?.main || 'var(--teal)' }}></div>
                  <strong>{unit.title}</strong>
                </div>
                
                <div className="admin-form-group">
                  <label>URLs de Atividades HTML (Uma por linha)</label>
                  <textarea 
                    rows={3}
                    placeholder="https://wordwall.net/embed/..."
                    defaultValue={unit.embed_urls?.join('\n') || ''}
                    onBlur={(e) => {
                      const urls = e.target.value.split('\n').map(v => v.trim()).filter(Boolean);
                      onUpdateUnit(unit.id, 'embed_urls', urls);
                    }}
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
                  <label>Descritores (separados por vírgula)</label>
                  <input 
                    type="text" 
                    placeholder="D3, D5, D12..."
                    defaultValue={unit.descriptors?.join(', ') || ''}
                    onBlur={(e) => {
                      const vals = e.target.value.split(',').map(v => v.trim()).filter(Boolean);
                      onUpdateUnit(unit.id, 'descriptors', vals);
                    }}
                  />
                </div>
              </div>
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
