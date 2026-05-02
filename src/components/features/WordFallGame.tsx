import React from 'react';
import { ArrowLeft } from 'lucide-react';

interface WordFallGameProps {
  onBack: () => void;
  // Outras props são ignoradas agora que usamos o iframe
  unitTitle?: string;
  words?: any[];
  onGameOver?: any;
}

const WordFallGame: React.FC<WordFallGameProps> = ({ onBack }) => {
  return (
    <div style={{ 
      width: '100%', 
      height: '100vh', 
      display: 'flex', 
      flexDirection: 'column', 
      background: '#f8fafc',
      overflow: 'hidden'
    }}>
      {/* Header para permitir voltar */}
      <div style={{ 
        height: '60px', 
        padding: '0 20px', 
        display: 'flex', 
        alignItems: 'center', 
        background: 'white', 
        borderBottom: '1px solid #e2e8f0',
        zIndex: 100
      }}>
        <button 
          onClick={onBack}
          style={{ 
            display: 'flex', 
            alignItems: 'center', 
            gap: '8px', 
            border: 'none', 
            background: '#f1f5f9', 
            padding: '8px 16px', 
            borderRadius: '10px', 
            cursor: 'pointer',
            fontWeight: 600,
            color: '#475569'
          }}
        >
          <ArrowLeft size={18} />
          Voltar ao Painel
        </button>
        <div style={{ marginLeft: '20px', fontWeight: 800, color: '#1e293b' }}>
          WordFall Game (Versão Online)
        </div>
      </div>

      {/* Iframe com o jogo externo */}
      <div style={{ flex: 1, position: 'relative' }}>
        <iframe 
          src="https://wordfall-orpin.vercel.app/" 
          title="WordFall Game"
          style={{
            width: '100%',
            height: '100%',
            border: 'none'
          }}
          allow="autoplay; speech-synthesis"
        />
      </div>
    </div>
  );
};

export default WordFallGame;
