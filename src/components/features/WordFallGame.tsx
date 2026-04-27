import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Trophy, RotateCcw, ArrowLeft, Keyboard, Timer, Zap } from 'lucide-react';

interface Word {
  pt: string;
  en: string;
  icon: string;
}

interface WordFallGameProps {
  unitTitle: string;
  words: Word[];
  onGameOver?: (score: number, wordsTyped: number) => void;
  onBack: () => void;
}

interface FallingWord {
  id: number;
  word: Word;
  baseX: number;
  x: number;
  y: number;
  speed: number;
  phase: number;
  rotation: number;
  entryDelay: number; // Para aceleração gradual no início
}

const WordFallGame: React.FC<WordFallGameProps> = ({ unitTitle, words, onGameOver, onBack }) => {
  const [gameState, setGameState] = useState<'start' | 'playing' | 'end'>('start');
  const [score, setScore] = useState(0);
  const [wordsTyped, setWordsTyped] = useState(0);
  const [inputValue, setInputValue] = useState('');
  const [fallingWords, setFallingWords] = useState<FallingWord[]>([]);
  const [combo, setCombo] = useState(0);
  const [timeLeft, setTimeLeft] = useState(90);
  const [highScore, setHighScore] = useState<number>(() => {
    const saved = localStorage.getItem(`wordfall_high_${unitTitle}`);
    return saved ? parseInt(saved) : 0;
  });
  const [correctWordIds, setCorrectWordIds] = useState<Set<number>>(new Set());

  const gameLoopRef = useRef<number | null>(null);
  const lastTimeRef = useRef<number>(0);
  const lastSpawnRef = useRef<number>(0);
  const inputRef = useRef<HTMLInputElement>(null);
  const canvasRef = useRef<HTMLDivElement>(null);

  const spawnWord = useCallback(() => {
    if (!words || words.length === 0) return;

    setFallingWords(prev => {
      if (prev.length >= 5) return prev; 

      const randomWord = words[Math.floor(Math.random() * words.length)];
      
      // Dificuldade progressiva baseada no score
      const difficultyFactor = 1 + (score / 3000);
      const baseSpeed = 0.4 + Math.random() * 0.4;

      const newWord: FallingWord = {
        id: Math.random(),
        word: randomWord,
        baseX: 15 + Math.random() * 70, // Evita as bordas extremas
        x: 0,
        y: 80, // COMEÇA EXATAMENTE ABAIXO DO HEADER (80px)
        speed: Math.min(baseSpeed * difficultyFactor, 2.5),
        phase: Math.random() * Math.PI * 2,
        rotation: 0,
        entryDelay: 0 
      };
      return [...prev, newWord];
    });
  }, [words, score]);

  const startGame = () => {
    setGameState('playing');
    setScore(0);
    setWordsTyped(0);
    setFallingWords([]);
    setCorrectWordIds(new Set());
    setCombo(0);
    setTimeLeft(90);
    lastSpawnRef.current = performance.now();
    setTimeout(() => inputRef.current?.focus(), 100);
  };

  useEffect(() => {
    if (gameState !== 'playing') return;

    const update = (time: number) => {
      if (!lastTimeRef.current) lastTimeRef.current = time;
      const deltaTime = (time - lastTimeRef.current) / 16.67;
      lastTimeRef.current = time;

      const canvasHeight = canvasRef.current?.clientHeight || 600;

      setFallingWords(prev => {
        const next = prev.map(w => {
          if (correctWordIds.has(w.id)) return w;

          // EFEITO ORGÂNICO:
          // 1. Aceleração gradual: começa lento e atinge a velocidade total após descer um pouco
          const acceleration = Math.min((w.y - 80) / 100, 1); 
          const currentSpeed = (w.speed * 0.5) + (w.speed * 0.5 * acceleration);
          
          const newY = w.y + (currentSpeed * deltaTime);
          
          // 2. Balanço senoidal suave (Sway)
          const sway = Math.sin((time / 1000) + w.phase) * 2;
          
          // 3. Rotação pendular baseada no balanço
          const rotation = Math.cos((time / 1200) + w.phase) * 4;

          return {
            ...w,
            y: newY,
            x: w.baseX + sway,
            rotation: rotation
          };
        });

        // Remove se passar do limite inferior (Game Over/Loss Combo)
        const hitBottom = next.some(w => w.y > canvasHeight - 140 && !correctWordIds.has(w.id));
        if (hitBottom) {
          setCombo(0);
          return next.filter(w => w.y <= canvasHeight - 140 || correctWordIds.has(w.id));
        }
        return next;
      });

      // Intervalo de spawn orgânico
      const spawnInterval = Math.max(4500 - (score * 0.4), 2200);
      if (time - lastSpawnRef.current > spawnInterval) {
        spawnWord();
        lastSpawnRef.current = time;
      }

      gameLoopRef.current = requestAnimationFrame(update);
    };

    gameLoopRef.current = requestAnimationFrame(update);
    return () => {
      if (gameLoopRef.current) cancelAnimationFrame(gameLoopRef.current);
      lastTimeRef.current = 0;
    };
  }, [gameState, spawnWord, score, correctWordIds]);

  // Timer e Finalização
  useEffect(() => {
    if (gameState !== 'playing') return;
    const timer = setInterval(() => {
      setTimeLeft(prev => {
        if (prev <= 1) {
          setGameState('end');
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
    return () => clearInterval(timer);
  }, [gameState]);

  // Recorde
  useEffect(() => {
    if (gameState === 'end') {
      if (score > highScore) {
        setHighScore(score);
        localStorage.setItem(`wordfall_high_${unitTitle}`, score.toString());
      }
      onGameOver?.(score, wordsTyped);
    }
  }, [gameState, score, highScore, unitTitle, onGameOver, wordsTyped]);

  const speak = (text: string) => {
    if (!window.speechSynthesis) return;
    window.speechSynthesis.cancel(); // Para qualquer fala anterior
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.lang = 'en-US';
    utterance.rate = 0.9; // Um pouco mais lento para clareza
    window.speechSynthesis.speak(utterance);
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    setInputValue(val);

    const match = fallingWords.find(
      w => w.word.en.toLowerCase().trim() === val.toLowerCase().trim() && !correctWordIds.has(w.id)
    );

    if (match) {
      setScore(prev => prev + (10 * (combo + 1)));
      setWordsTyped(prev => prev + 1);
      setCombo(prev => prev + 1);
      setCorrectWordIds(prev => new Set(prev).add(match.id));
      setInputValue('');
      
      // Falar a palavra em inglês
      speak(match.word.en);

      // Remove com um pequeno atraso para a animação de "pop"
      setTimeout(() => {
        setFallingWords(prev => prev.filter(w => w.id !== match.id));
        setCorrectWordIds(prev => {
          const next = new Set(prev);
          next.delete(match.id);
          return next;
        });
      }, 300);
    }
  };

  return (
    <div className="wordfall-container" style={containerStyle}>
      <div ref={canvasRef} className="game-canvas" style={canvasStyle}>
        
        {/* HEADER: Z-INDEX alto para ficar sempre por cima */}
        <div className="game-header" style={headerStyle}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '15px' }}>
            <button onClick={onBack} style={backBtnStyle}><ArrowLeft size={18} /></button>
            <h1 style={{ fontSize: '18px', fontWeight: 700, color: '#1e293b', margin: 0 }}>{unitTitle}</h1>
          </div>
          <div style={statsStyle}>
            <div style={pillStyle}><Timer size={16} /> {timeLeft}s</div>
            <div style={pillStyle}><Trophy size={16} /> {score}</div>
            <div style={{...pillStyle, color: combo > 5 ? '#f59e0b' : '#10b981'}}>
              <Zap size={16} /> x{combo}
            </div>
          </div>
        </div>

        {gameState === 'start' && (
          <div style={overlayStyle}>
            <div style={{fontSize: '60px', marginBottom: '20px'}}>🌊</div>
            <h2 style={{ fontSize: '28px', fontWeight: 900 }}>Chuva de Palavras</h2>
            <p style={{ color: '#64748b', marginBottom: '30px' }}>As palavras vão escorregar pela tela.<br/>Não deixe elas caírem!</p>
            <button onClick={startGame} style={startBtnStyle}>COMEÇAR</button>
          </div>
        )}

        {gameState === 'playing' && (
          <>
            {fallingWords.map(w => (
              <div 
                key={w.id} 
                style={{
                  position: 'absolute',
                  left: `${w.x}%`,
                  top: `${w.y}px`,
                  transform: `translateX(-50%) rotate(${w.rotation}deg) scale(${correctWordIds.has(w.id) ? 1.2 : 1})`,
                  background: 'white',
                  padding: '14px 24px',
                  borderRadius: '20px',
                  boxShadow: '0 10px 25px rgba(0,0,0,0.08)',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '12px',
                  minWidth: '180px',
                  border: '1px solid #e2e8f0',
                  borderColor: correctWordIds.has(w.id) ? '#10b981' : '#e2e8f0',
                  opacity: correctWordIds.has(w.id) ? 0 : 1,
                  transition: correctWordIds.has(w.id) ? 'all 0.3s ease-out' : 'transform 0.1s linear, top 0.1s linear',
                  zIndex: correctWordIds.has(w.id) ? 10 : 1,
                  pointerEvents: 'none'
                }}
              >
                <span style={{ fontSize: '32px' }}>{w.word.icon || '🏷️'}</span>
                <div style={{ display: 'flex', flexDirection: 'column' }}>
                  <span style={{ fontSize: '11px', color: '#94a3b8', fontWeight: 700, textTransform: 'uppercase' }}>{w.word.pt}</span>
                  <span style={{ fontSize: '20px', fontWeight: 800, color: '#1e293b' }}>{w.word.en}</span>
                </div>
              </div>
            ))}

            <div style={inputAreaStyle}>
               <Keyboard size={20} style={{ color: '#10b981' }} />
               <input 
                 ref={inputRef}
                 type="text" 
                 value={inputValue}
                 onChange={handleInputChange}
                 placeholder="Digite em Inglês..."
                 style={inputStyle}
                 autoComplete="off"
                 spellCheck="false"
               />
            </div>
          </>
        )}

        {gameState === 'end' && (
          <div style={overlayStyle}>
            <h2 style={{ fontSize: '32px', fontWeight: 900 }}>{score >= highScore ? 'NOVO RECORDE!' : 'FIM DE JOGO'}</h2>
            <div style={scoreBoxStyle}>
               <p style={{ fontSize: '48px', fontWeight: 900, color: '#10b981', margin: 0 }}>{score}</p>
               <p style={{ color: '#64748b', fontSize: '14px' }}>Pontos</p>
            </div>
            <div style={{ display: 'flex', gap: '15px' }}>
                <button onClick={startGame} style={startBtnStyle}>NOVO JOGO</button>
                <button onClick={onBack} style={{ ...startBtnStyle, background: '#64748b', boxShadow: '0 6px 0 #475569' }}>SAIR</button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

// --- Estilos Inline ---
const containerStyle: React.CSSProperties = { width: '100%', height: '100%', background: '#f8fafc', overflow: 'hidden', position: 'relative' };
const headerStyle: React.CSSProperties = { 
    height: '70px', padding: '0 20px', display: 'flex', justifyContent: 'space-between', 
    alignItems: 'center', background: 'white', borderBottom: '1px solid #e2e8f0', 
    position: 'absolute', top: 0, left: 0, right: 0, zIndex: 100 
};
const pillStyle: React.CSSProperties = { display: 'flex', alignItems: 'center', gap: '6px', background: '#f1f5f9', padding: '6px 12px', borderRadius: '12px', fontWeight: 700, fontSize: '14px', color: '#475569' };
const statsStyle: React.CSSProperties = { display: 'flex', gap: '8px' };
const canvasStyle: React.CSSProperties = { position: 'relative', width: '100%', height: '100%', background: 'linear-gradient(to bottom, #f0f9ff, #ffffff)' };
const overlayStyle: React.CSSProperties = { position: 'absolute', inset: 0, background: 'rgba(255,255,255,0.95)', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', zIndex: 200, textAlign: 'center' };
const startBtnStyle: React.CSSProperties = { padding: '16px 32px', borderRadius: '16px', border: 'none', background: '#10b981', color: 'white', fontWeight: 800, cursor: 'pointer', boxShadow: '0 6px 0 #059669' };
const inputAreaStyle: React.CSSProperties = { position: 'absolute', bottom: '40px', left: '50%', transform: 'translateX(-50%)', width: '90%', maxWidth: '400px', background: 'white', padding: '12px 20px', borderRadius: '30px', border: '3px solid #10b981', display: 'flex', alignItems: 'center', gap: '10px', boxShadow: '0 10px 25px rgba(0,0,0,0.1)', zIndex: 100 };
const inputStyle: React.CSSProperties = { flex: 1, border: 'none', outline: 'none', fontSize: '1.2rem', fontWeight: 700, color: '#1e293b' };
const scoreBoxStyle: React.CSSProperties = { margin: '20px 0', padding: '20px 40px', borderRadius: '20px', border: '2px solid #10b981', background: '#f0fdf4' };
const backBtnStyle: React.CSSProperties = { border: 'none', background: '#f1f5f9', padding: '8px', borderRadius: '10px', cursor: 'pointer', color: '#64748b' };

export default WordFallGame;
