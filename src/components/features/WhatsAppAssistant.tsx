import React, { useState } from 'react';
import type { Unit } from '../../types';
import { Copy, Check, ExternalLink } from 'lucide-react';

interface WhatsAppAssistantProps {
  units: Unit[];
  mediatorPhone: string;
}

export const WhatsAppAssistant: React.FC<WhatsAppAssistantProps> = ({ units, mediatorPhone }) => {
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [editedMsgs, setEditedMsgs] = useState<Record<string, string>>(() => {
    const initial: Record<string, string> = {};
    units.forEach(u => { initial[u.id] = u.wa || ''; });
    return initial;
  });

  const handleCopy = (id: string) => {
    const text = editedMsgs[id];
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const handleOpenWhatsApp = (id: string) => {
    const text = editedMsgs[id];
    const cleanPhone = mediatorPhone.replace(/\D/g, '');
    const url = `https://wa.me/${cleanPhone}?text=${encodeURIComponent(text)}`;
    window.open(url, '_blank');
  };

  const handleMsgChange = (id: string, val: string) => {
    setEditedMsgs(prev => ({ ...prev, [id]: val }));
  };

  return (
    <div className="screen">
      <p style={{ fontSize: '13px', color: 'var(--ink3)', marginBottom: '16px', lineHeight: '1.6' }}>
        Edite, copie e envie as instruções pré-formatadas para o mediador antes de cada sessão.
      </p>

      {units.map((unit) => (
        <div key={unit.id} className="wa-card">
          <div className="wa-unit-name">{unit.title}</div>
          <div className="wa-msg-editor-wrapper">
             <textarea 
                className="wa-msg-textarea"
                value={editedMsgs[unit.id]}
                onChange={(e) => handleMsgChange(unit.id, e.target.value)}
                placeholder="Digite a mensagem para o WhatsApp..."
             />
          </div>
          <div className="wa-actions">
            <button 
              className={`copy-wa-btn ${copiedId === unit.id ? 'ok' : ''}`}
              onClick={() => handleCopy(unit.id)}
            >
              {copiedId === unit.id ? <><Check size={14} /> Copiado!</> : <><Copy size={14} /> Copiar Texto</>}
            </button>
            <button 
              className="copy-wa-btn zap-btn" 
              onClick={() => handleOpenWhatsApp(unit.id)}
            >
              <ExternalLink size={14} /> Abrir no Zap
            </button>
          </div>
        </div>
      ))}
    </div>
  );
};
