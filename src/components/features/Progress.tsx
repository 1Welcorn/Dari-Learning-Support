import React from 'react';
import type { Unit, Session } from '../../types';
import { COLORS } from '../../constants';
import { FileText, Calendar, CheckCircle2, Clock, RotateCcw, Edit2, Trash2, Save, X } from 'lucide-react';

interface ProgressProps {
  units: Unit[];
  sessions: Session[];
  unitStatus: Record<string, boolean>;
  onResetUnitAnswers: (uId: string) => void;
  onUpdateSession: (sId: string, note: string) => Promise<boolean>;
  onDeleteSession: (sId: string) => Promise<boolean>;
  isAdmin?: boolean;
}

const SessionItem: React.FC<{ 
  session: Session, 
  unitTitle: string, 
  onUpdate: (id: string, note: string) => Promise<boolean>,
  onDelete: (id: string) => Promise<boolean>,
  isAdmin?: boolean
}> = ({ session, unitTitle, onUpdate, onDelete, isAdmin }) => {
  const [isEditing, setIsEditing] = React.useState(false);
  const [tempNote, setTempNote] = React.useState(session.note);

  const handleSave = async () => {
    const success = await onUpdate(session.id, tempNote);
    if (success) setIsEditing(false);
  };

  return (
    <div className="session-log-card">
      <div className="log-header">
        <div className="log-date-pill">{session.session_date}</div>
        <div className="log-unit-tag">{unitTitle}</div>
        <div className="log-actions">
           {isAdmin && !isEditing && (
             <>
               <button className="log-action-btn edit" onClick={() => setIsEditing(true)}>
                 <Edit2 size={14} />
               </button>
               <button className="log-action-btn delete" onClick={() => {
                 if(window.confirm('Excluir este registro permanentemente?')) onDelete(session.id);
               }}>
                 <Trash2 size={14} />
               </button>
             </>
           )}
        </div>
      </div>
      
      {isEditing ? (
        <div className="log-edit-area">
          <textarea 
            className="log-edit-textarea"
            value={tempNote}
            onChange={(e) => setTempNote(e.target.value)}
          />
          <div className="log-edit-btns">
            <button className="log-save-btn" onClick={handleSave}><Save size={14} /> Salvar</button>
            <button className="log-cancel-btn" onClick={() => setIsEditing(false)}><X size={14} /> Cancelar</button>
          </div>
        </div>
      ) : (
        <div className="log-body-text">{session.note}</div>
      )}
    </div>
  );
};

export const Progress: React.FC<ProgressProps> = ({ 
  units, sessions, unitStatus, onResetUnitAnswers, onUpdateSession, onDeleteSession, isAdmin 
}) => {
  const completedCount = Object.values(unitStatus).filter(Boolean).length;
  const totalCount = units.length;
  const totalPct = totalCount > 0 ? Math.round((completedCount / totalCount) * 100) : 0;

  const exportReport = () => {
    let report = `RELATÓRIO PEDAGÓGICO DARI - ATENDIMENTO DOMICILIAR\n`;
    report += `====================================================\n`;
    report += `Estudante: Ione Jordão Ribeiro\n`;
    report += `Professor: Willians Antoniazzi\n`;
    report += `Data de Emissão: ${new Date().toLocaleDateString('pt-BR')}\n`;
    report += `Total de Módulos Concluídos: ${completedCount} / ${totalCount} (${totalPct}%)\n`;
    report += `Total de Encontros Realizados: ${sessions.length}\n`;
    report += `====================================================\n\n`;

    report += `JORNADA DE APRENDIZAGEM POR UNIDADE:\n`;
    report += `----------------------------------------------------\n`;
    units.forEach(u => {
      const isDone = unitStatus[u.id];
      // Find completion date from sessions
      const unitSessions = sessions.filter(s => s.unit_id === u.id);
      const completionDate = isDone && unitSessions.length > 0 
        ? unitSessions[0].session_date // Assuming sessions are sorted desc
        : 'Pendente';
      
      const descriptorsText = Array.isArray(u.descriptors) && u.descriptors.length > 0
        ? u.descriptors.join(', ')
        : 'N/A';

      report += `[${isDone ? 'X' : ' '}] ${u.title}\n`;
      report += `    Status: ${isDone ? 'Concluída' : 'Em andamento'}\n`;
      report += `    Conclusão: ${completionDate}\n`;
      report += `    Descritores BNCC: ${descriptorsText}\n`;
      report += `    ------------------------------------------------\n`;
    });

    report += `\nDIÁRIO DE OBSERVAÇÕES PEDAGÓGICAS:\n`;
    report += `----------------------------------------------------\n`;
    sessions.forEach(s => {
      const unit = units.find(u => u.id === s.unit_id);
      report += `DATA: ${s.session_date} | UNIDADE: ${unit?.title || 'Atendimento Geral'}\n`;
      report += `OBSERVAÇÃO: ${s.note}\n`;
      report += `----------------------------------------------------\n`;
    });

    const element = document.createElement("a");
    const file = new Blob([report], { type: 'text/plain' });
    element.href = URL.createObjectURL(file);
    element.download = `Relatorio_Pedagogico_Aione_${new Date().toISOString().split('T')[0]}.txt`;
    element.click();
  };

  return (
    <div className="screen progress-view">
      <div className="progress-overview-card">
         <div className="overview-header">
            <h2 className="overview-title">Seu Progresso Total</h2>
            <div className="overview-pct">{totalPct}%</div>
         </div>
         <div className="overview-bar-bg">
            <div className="overview-bar-fill" style={{ width: `${totalPct}%` }}></div>
         </div>
         <div className="overview-stats">
            <div className="ov-stat">
               <strong>{completedCount}</strong>
               <span>Módulos Concluídos</span>
            </div>
            <div className="ov-stat">
               <strong>{sessions.length}</strong>
               <span>Encontros Realizados</span>
            </div>
         </div>
      </div>

      <button className="export-btn-premium" onClick={exportReport}>
        <FileText size={20} /> Exportar Relatório Oficial
      </button>

      <h3 className="section-title-small">Jornada por Unidade</h3>
      <div id="progress-units" className="progress-list">
        {units.map(unit => {
          const isDone = unitStatus[unit.id];
          const unitTheme = COLORS[unit.color] || COLORS.emerald || { main: '#10b981', light: '#ecfdf5', dark: '#064e3b' };
          return (
            <div key={unit.id} className="progress-row-card">
              <div 
                className="prog-row-icon" 
                style={{ background: isDone ? unitTheme.main : 'var(--bg)', color: isDone ? '#fff' : 'var(--ink4)' }}
              >
                {isDone ? <CheckCircle2 size={24} /> : <Clock size={24} />}
              </div>
              <div className="prog-row-content">
                <div className="prog-row-name">{unit.title}</div>
                <div className="prog-row-meta">{isDone ? 'Missão Cumprida!' : 'Exploração em andamento'}</div>
              </div>
              <div className="prog-row-status" style={{ display: 'flex', flexDirection: 'column', gap: '8px', alignItems: 'flex-end' }}>
                 {isDone ? <span className="badge-done">FEITO</span> : <span className="badge-todo">PENDENTE</span>}
                 {isAdmin && (
                   <button 
                     className="reset-mini-btn"
                     title="Limpar respostas (progresso) desta unidade"
                     onClick={(e) => {
                       e.stopPropagation();
                       if(window.confirm(`Deseja realmente limpar as respostas (progresso) da "${unit.title}"? Isso não apagará o conteúdo da aula.`)) {
                         onResetUnitAnswers(unit.id);
                       }
                     }}
                   >
                     <RotateCcw size={14} />
                   </button>
                 )}
              </div>
            </div>
          );
        })}
      </div>

      <h3 className="section-title-small">Diário de Descobertas</h3>
      <div id="session-log" className="log-list">
        {sessions.length === 0 ? (
          <div className="empty-state-card">
            <Calendar size={48} opacity={0.2} />
            <p>Seu diário ainda está em branco. Vamos começar?</p>
          </div>
        ) : (
          sessions.map((session) => (
            <SessionItem 
              key={session.id} 
              session={session} 
              unitTitle={units.find(u => u.id === session.unit_id)?.title || 'Atendimento Geral'}
              onUpdate={onUpdateSession}
              onDelete={onDeleteSession}
              isAdmin={isAdmin}
            />
          ))
        )}
      </div>
    </div>
  );
};
