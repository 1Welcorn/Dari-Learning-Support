import React, { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import { Trophy, RotateCcw, ArrowLeft, Keyboard, Timer, Zap } from 'lucide-react';

// Interface genérica para aceitar qualquer banco de palavras via props
interface Word {
  pt: string;
  en: string;
  icon: string;
}

interface WordFallGameProps {
  unitTitle: string; // Ex: "Cozinha Profissional"
  words: Word[];      // Recebe o banco de palavras dinamicamente
  onGameOver?: (score: number, wordsTyped: number) => void;
  onBack: () => void;
}

interface FallingWord {
  id: number;
  word: Word;
  baseX: number; // Posição horizontal original
  x: number;     // Posição calculada com balanço
  y: number;
  speed: number;
  phase: number; // Fase para o movimento senoidal
  rotation: number; // Rotação para balanço
}

const WordFallGame: React.FC<WordFallGameProps> = ({ unitTitle, words, onGameOver, onBack }) => {
  const [gameState, setGameState] = useState<'start' | 'playing' | 'end'>('start');
  const [score, setScore] = useState(0);
  const [wordsTyped, setWordsTyped] = useState(0);
  const [inputValue, setInputValue] = useState('');
  const [fallingWords, setFallingWords] = useState<FallingWord[]>([]);
  const [combo, setCombo] = useState(0);
  // Aumentado para 90s para dar mais tempo de jogo e aprendizado
  const [timeLeft, setTimeLeft] = useState(90); 
  const [highScore, setHighScore] = useState<number>(() => {
    const saved = localStorage.getItem(`wordfall_high_${unitTitle}`);
    return saved ? parseInt(saved) : 0;
  });
  const [correctWordIds, setCorrectWordIds] = useState<Set<number>>(new Set());
  
  const gameLoopRef = useRef<number | null>(null);
  const lastSpawnRef = useRef<number>(0);
  const inputRef = useRef<HTMLInputElement>(null);
  const canvasRef = useRef<HTMLDivElement>(null);

  // Lógica de Spawn Melhorada e mais Lenta
  const spawnWord = useCallback(() => {
    if (!words || words.length === 0) return;
    
    setFallingWords(prev => {
      if (prev.length >= 5) return prev;

      const randomWord = words[Math.floor(Math.random() * words.length)];
      const speedDifficultyMultiplier = 1 + (score / 4000); 
      const baseSpeed = 0.2 + Math.random() * 0.2; 

      const newWord: FallingWord = {
        id: Math.random(), 
        word: randomWord,
        baseX: 15 + Math.random() * 70, 
        x: 15 + Math.random() * 70,
        y: -100,
        speed: Math.min(baseSpeed * speedDifficultyMultiplier, 1.8),
        phase: Math.random() * Math.PI * 2,
        rotation: 0
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
    lastSpawnRef.current = performance.now() - 5000; // Trigger immediate spawn
    setTimeout(() => inputRef.current?.focus(), 100);
  };

  // Game Loop
  useEffect(() => {
    if (gameState !== 'playing') return;

    const update = (time: number) => {
      const canvasHeight = canvasRef.current?.clientHeight || 600;

      setFallingWords(prev => {
        const next = prev.map(w => {
           if (correctWordIds.has(w.id)) return w;
           
           const currentSpeed = w.y < 80 ? 6 : w.speed;
           const newY = w.y + currentSpeed;
           
           // Movimento mais natural: balanço horizontal e rotação leve
           // Só aplica balanço depois de sair da barra superior
           const sway = newY > 80 ? Math.sin((time / 1000) + w.phase) * 1.5 : 0;
           const rotation = newY > 80 ? Math.cos((time / 1500) + w.phase) * 4 : 0;
           
           return { 
             ...w, 
             y: newY, 
             x: w.baseX + sway,
             rotation: rotation
           };
        });
        
        const missed = next.some(w => w.y > canvasHeight - 120 && !correctWordIds.has(w.id));
        if (missed) {
          setCombo(0);
          return next.filter(w => w.y <= canvasHeight - 120 || correctWordIds.has(w.id));
        }
        return next;
      });

      const spawnInterval = Math.max(5000 - (score * 0.5), 2000);

      if (time - lastSpawnRef.current > spawnInterval) {
        spawnWord();
        lastSpawnRef.current = time;
      }

      gameLoopRef.current = requestAnimationFrame(update);
    };

    gameLoopRef.current = requestAnimationFrame(update);
    return () => {
      if (gameLoopRef.current !== null) cancelAnimationFrame(gameLoopRef.current);
    };
  }, [gameState, spawnWord, score]); // Removido correctWordIds para evitar reinicializações desnecessárias

  // Timer
  useEffect(() => {
    if (gameState !== 'playing') return;
    
    const timer = setInterval(() => {
      setTimeLeft(prev => {
        if (prev <= 1) {
          setGameState('end');
          
          // Verificar recorde ao final
          setHighScore(current => {
             if (score > current) {
                localStorage.setItem(`wordfall_high_${unitTitle}`, score.toString());
                return score;
             }
             return current;
          });

          onGameOver?.(score, wordsTyped);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [gameState, score, wordsTyped, onGameOver, unitTitle]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    setInputValue(val);

    const match = fallingWords.find(
      w => w.word.en.toLowerCase() === val.toLowerCase().trim() && !correctWordIds.has(w.id)
    );
    
    if (match) {
      setScore(prev => prev + (10 * (combo + 1)));
      setWordsTyped(prev => prev + 1);
      setCombo(prev => prev + 1);
      
      // Inicia animação de acerto
      setCorrectWordIds(prev => new Set(prev).add(match.id));
      setInputValue('');

      // Remove da lista após animação
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
      {/* HEADER: Limpo e Informativo */}
      <div className="game-header" style={headerStyle}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '15px' }}>
            <button onClick={onBack} style={backBtnStyle}><ArrowLeft size={18} /></button>
            <h1 style={{ fontSize: '18px', fontWeight: 700, color: '#1e293b', margin: 0 }}>
                {unitTitle}
            </h1>
        </div>
        <div style={statsStyle}>
          <div style={pillStyle}><Timer size={16} /> {timeLeft}s</div>
          <div style={pillStyle}><Trophy size={16} /> {score}</div>
          <div style={{...pillStyle, color: combo > 5 ? '#f59e0b' : '#10b981'}}>
            <Zap size={16} /> x{combo}
          </div>
        </div>
      </div>

      {/* ÁREA DE JOGO (Canvas) */}
      <div ref={canvasRef} className="game-canvas" style={canvasStyle}>
        {gameState === 'start' && (
          <div className="game-overlay" style={overlayStyle}>
            <div style={mascotContainerStyle}>🚀</div>
            <h2 style={{ fontSize: '32px', fontWeight: 900, marginBottom: '10px' }}>Chuva de Palavras</h2>
            <p style={{ color: '#64748b', marginBottom: '30px', maxWidth: '400px' }}>
                Digite as palavras em <strong style={{color: '#10b981'}}>Inglês</strong> que aparecem na tela antes que elas caiam!
            </p>
            <button onClick={startGame} style={startBtnStyle}>COMEÇAR DESAFIO</button>
          </div>
        )}

        {gameState === 'playing' && (
          <>
            {fallingWords.map(w => (
              /* CARD DA PALAVRA: Otimizado para Legibilidade */
              <div 
                key={w.id} 
                className={`word-card-v7 word-entrance ${correctWordIds.has(w.id) ? 'word-pop' : ''}`}
                style={{
                  position: 'absolute',
                  left: `${w.x}%`,
                  top: `${w.y}px`,
                  transform: `translateX(-50%) rotate(${w.rotation}deg)`,
                  background: 'rgba(255, 255, 255, 0.95)',
                  padding: '16px 28px',
                  borderRadius: '22px',
                  boxShadow: '0 8px 20px rgba(0,0,0,0.1)',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '16px',
                  minWidth: '200px',
                  border: correctWordIds.has(w.id) ? '3px solid #10b981' : '1px solid #e2e8f0',
                  backdropFilter: 'blur(4px)',
                  transition: correctWordIds.has(w.id) ? 'none' : 'top 0.1s linear, left 0.1s linear, transform 0.1s linear',
                  zIndex: correctWordIds.has(w.id) ? 100 : 1
                }}
              >
                {/* Ícone 1/3 maior */}
                <span style={{ fontSize: '38px' }}>{w.word.icon}</span>
                
                <div style={{ display: 'flex', flexDirection: 'column', flex: 1 }}>
                  {/* Tradução 1/3 maior */}
                  <span style={{ fontSize: '14px', color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.8px', marginBottom: '2px' }}>
                    {w.word.pt}
                  </span>
                  {/* Inglês 1/3 maior */}
                  <span style={{ fontSize: '27px', fontWeight: 900, color: '#1e293b', lineHeight: '1.2' }}>
                    {w.word.en}
                  </span>
                </div>
              </div>
            ))}

            {/* ÁREA DE INPUT: Fixa na parte inferior segura */}
            <div className="input-container" style={inputAreaStyle}>
               <Keyboard size={24} style={{ color: '#10b981' }} />
               <input 
                 ref={inputRef}
                 type="text" 
                 value={inputValue}
                 onChange={handleInputChange}
                 placeholder="Digite em Inglês..."
                 style={inputStyle}
               />
            </div>
          </>
        )}

        {gameState === 'end' && (
          <div className="game-overlay" style={overlayStyle}>
            <div style={mascotContainerStyle}>{score >= highScore ? '🥳' : '🏆'}</div>
            <h2 style={{ fontSize: '32px', fontWeight: 900 }}>
                {score >= highScore ? 'NOVO RECORDE!' : 'BOM TRABALHO!'}
            </h2>
            
            <div style={{ margin: '25px 0', textAlign: 'center', background: '#f0fdfa', padding: '20px 40px', borderRadius: '25px', border: '2px solid #10b981', boxShadow: '0 10px 20px rgba(16,185,129,0.1)' }}>
               <p style={{ fontSize: '48px', fontWeight: 900, color: '#10b981', margin: 0 }}>{score}</p>
               <p style={{ color: '#64748b', margin: '0 0 10px 0', fontWeight: 600 }}>Pontos nesta rodada</p>
               
               <div style={{ borderTop: '1px solid #ccfbf1', paddingTop: '10px', marginTop: '5px' }}>
                  <p style={{ color: '#0f766e', fontSize: '14px', fontWeight: 700 }}>
                     MELHOR RECORDE: <span style={{ color: '#10b981' }}>{highScore}</span>
                  </p>
               </div>
            </div>

            <p style={{ color: '#64748b', marginBottom: '30px', maxWidth: '350px', fontStyle: 'italic' }}>
                {score >= highScore 
                  ? "Incrível, Ione! Você superou seus limites. Que tal tentar bater esse novo recorde agora?"
                  : "Quase lá! Você está cada vez mais rápida. Pratique mais uma vez para superar seu recorde!"}
            </p>

            <div style={{ display: 'flex', gap: '15px' }}>
                <button onClick={startGame} style={{...startBtnStyle, background: '#14b8a6', boxShadow: '0 8px 0 #0f766e'}}>
                    <RotateCcw size={20} /> TENTAR NOVAMENTE
                </button>
                <button onClick={onBack} style={{ ...startBtnStyle, background: '#64748b', boxShadow: '0 8px 0 #475569' }}>
                    VOLTAR AO CURSO
                </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

// --- ESTILOS INLINE ATUALIZADOS (Limpos e Modernos) ---
const containerStyle: React.CSSProperties = {
  width: '100%', height: '100%', background: '#f8fafc', 
  display: 'flex', flexDirection: 'column', fontFamily: '"Outfit", "Inter", sans-serif', overflow: 'hidden'
};

const headerStyle: React.CSSProperties = {
  padding: '12px 20px', display: 'flex', justifyContent: 'space-between', 
  alignItems: 'center', background: 'white', borderBottom: '1px solid #e2e8f0', zIndex: 20
};

const pillStyle: React.CSSProperties = {
    display: 'flex', alignItems: 'center', gap: '6px', background: '#f1f5f9',
    padding: '6px 14px', borderRadius: '20px', fontWeight: 700, color: '#475569', fontSize: '14px'
};

const backBtnStyle: React.CSSProperties = {
  padding: '10px', borderRadius: '12px', border: 'none', background: '#f1f5f9',
  color: '#64748b', cursor: 'pointer', display: 'flex', alignItems: 'center'
};

const statsStyle: React.CSSProperties = { display: 'flex', gap: '10px' };

const canvasStyle: React.CSSProperties = {
  flex: 1, position: 'relative', background: 'linear-gradient(180deg, #e6fffa 0%, #ffffff 100%)', overflow: 'hidden',
  // Área segura inferior para o input não cobrir as palavras no final
  paddingBottom: '120px' 
};

const overlayStyle: React.CSSProperties = {
  position: 'absolute', inset: 0, background: 'rgba(255,255,255,0.97)',
  display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', zIndex: 30, padding: '40px', textAlign: 'center'
};

const mascotContainerStyle: React.CSSProperties = { fontSize: '80px', marginBottom: '10px' };

const startBtnStyle: React.CSSProperties = {
  padding: '16px 32px', borderRadius: '16px', border: 'none', background: '#10b981',
  color: 'white', fontSize: '16px', fontWeight: 900, cursor: 'pointer', letterSpacing: '0.5px',
  boxShadow: '0 8px 0 #059669', display: 'flex', alignItems: 'center', gap: '10px', transition: 'transform 0.1s'
};

const inputAreaStyle: React.CSSProperties = {
  position: 'absolute', bottom: '30px', left: '50%', transform: 'translateX(-50%)',
  width: '90%', maxWidth: '450px', background: 'white', padding: '15px 25px',
  borderRadius: '40px', border: '3px solid #10b981', display: 'flex', alignItems: 'center',
  gap: '15px', boxShadow: '0 15px 35px rgba(16, 185, 129, 0.2)'
};

const inputStyle: React.CSSProperties = {
  flex: 1, border: 'none', outline: 'none', fontSize: '1.4rem', fontWeight: 700, color: '#1e293b'
};

export default WordFallGame;
