import React, { useEffect, useState, useRef } from 'react';
import { getUnitVocabulary } from '../../services/gameService';
import { Trophy, Heart, Zap, Keyboard, ChevronLeft } from 'lucide-react';

interface WordFallGameProps {
  unitId: string;
  onGameOver: (score: number, wordsFound: number) => void;
  onBack: () => void;
}

interface FallingWord {
  id: number;
  text: string;
  x: number;
  y: number;
  speed: number;
  color: string;
}

const WordFallGame: React.FC<WordFallGameProps> = ({ unitId, onGameOver, onBack }) => {
  const [wordBank, setWordBank] = useState<string[]>([]);
  const [activeWords, setActiveWords] = useState<FallingWord[]>([]);
  const [userInput, setUserInput] = useState("");
  const [score, setScore] = useState(0);
  const [lives, setLives] = useState(3);
  const [isPlaying, setIsPlaying] = useState(false);
  const [wordsFound, setWordsFound] = useState(0);
  
  const gameLoopRef = useRef<number | null>(null);
  const lastSpawnRef = useRef<number>(0);
  const inputRef = useRef<HTMLInputElement>(null);

  // Load the pedagogical list when the unit starts
  useEffect(() => {
    const loadWords = async () => {
      const words = await getUnitVocabulary(unitId);
      // Fallback if no words defined for unit
      const bank = words.length > 0 ? words : ["HELLO", "WORLD", "APPLE", "HOUSE", "WATER"];
      setWordBank(bank);
    };
    loadWords();
  }, [unitId]);

  const spawnWord = () => {
    if (wordBank.length === 0) return;
    
    const randomIndex = Math.floor(Math.random() * wordBank.length);
    const colors = ['#FF6B6B', '#4ECDC4', '#FFD93D', '#6C5CE7', '#FF8E3C'];
    
    const newWord: FallingWord = {
      id: Date.now(),
      text: wordBank[randomIndex],
      x: Math.random() * 70 + 15, // Keep within 15-85% width
      y: -50,
      speed: 1.5 + Math.random() * 1.5,
      color: colors[Math.floor(Math.random() * colors.length)]
    };

    setActiveWords(prev => [...prev, newWord]);
  };

  const updateGame = (time: number) => {
    if (!isPlaying) return;

    // Spawn new word every 2.5 seconds
    if (time - lastSpawnRef.current > 2500) {
      spawnWord();
      lastSpawnRef.current = time;
    }

    setActiveWords(prev => {
      const next: FallingWord[] = [];
      let livesLost = 0;

      for (const word of prev) {
        const newY = word.y + word.speed;
        
        // If word hits bottom
        if (newY > 550) {
          livesLost++;
        } else {
          next.push({ ...word, y: newY });
        }
      }

      if (livesLost > 0) {
        setLives(l => {
          const newLives = l - livesLost;
          if (newLives <= 0) {
             setIsPlaying(false);
             return 0;
          }
          return newLives;
        });
      }

      return next;
    });

    gameLoopRef.current = requestAnimationFrame(updateGame);
  };

  useEffect(() => {
    if (isPlaying) {
      gameLoopRef.current = requestAnimationFrame(updateGame);
      inputRef.current?.focus();
    } else if (lives <= 0) {
      onGameOver(score, wordsFound);
    }
    return () => {
      if (gameLoopRef.current) cancelAnimationFrame(gameLoopRef.current);
    };
  }, [isPlaying]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value.toUpperCase();
    setUserInput(val);

    const matchingWord = activeWords.find(w => w.text.toUpperCase() === val);
    if (matchingWord) {
      // Explosion!
      setActiveWords(prev => prev.filter(w => w.id !== matchingWord.id));
      setScore(s => s + matchingWord.text.length * 10);
      setWordsFound(wf => wf + 1);
      setUserInput("");
    }
  };

  const startGame = () => {
    setScore(0);
    setLives(3);
    setWordsFound(0);
    setActiveWords([]);
    setIsPlaying(true);
    lastSpawnRef.current = performance.now();
  };

  return (
    <div className="word-fall-container">
      {/* HUD */}
      <div className="game-hud">
        <button onClick={onBack} className="game-back-btn">
          <ChevronLeft size={24} />
        </button>
        
        <div className="hud-stats">
          <div className="hud-pill score">
            <Trophy size={20} />
            <span>{score}</span>
          </div>
          <div className="hud-pill lives">
            <Heart size={20} fill={lives < 2 ? '#ef4444' : '#ff6b6b'} color={lives < 2 ? '#ef4444' : '#ff6b6b'} />
            <div className="hearts-row">
              {[...Array(3)].map((_, i) => (
                <div key={i} className={`heart-dot ${i < lives ? 'active' : ''}`}></div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* GAME AREA */}
      <div className="game-canvas">
        {!isPlaying && lives > 0 && (
          <div className="game-overlay">
            <div className="start-card">
               <Zap size={64} className="zap-icon" />
               <h2>WORD FALL</h2>
               <p>Digite as palavras antes que elas caiam!</p>
               <button onClick={startGame} className="start-btn">COMEÇAR JOGO!</button>
            </div>
          </div>
        )}

        {lives <= 0 && (
          <div className="game-overlay">
             <div className="game-over-card">
                <h2>FIM DE JOGO!</h2>
                <p>Você encontrou {wordsFound} palavras.</p>
                <button onClick={startGame} className="restart-btn">TENTAR NOVAMENTE</button>
             </div>
          </div>
        )}

        {/* Falling Words */}
        {activeWords.map(word => (
          <div 
            key={word.id}
            className="falling-word"
            style={{ 
              left: `${word.x}%`, 
              top: `${word.y}px`,
              backgroundColor: word.color,
              boxShadow: `0 8px 0 ${word.color}99`
            }}
          >
            {word.text}
          </div>
        ))}
      </div>

      {/* INPUT AREA */}
      <div className="game-input-area">
        <div className="input-wrapper">
          <Keyboard size={24} className="input-icon" />
          <input 
            ref={inputRef}
            type="text" 
            value={userInput}
            onChange={handleInputChange}
            placeholder="DIGITE AQUI..."
            autoFocus
            disabled={!isPlaying}
          />
        </div>
      </div>

      <style>{`
        .word-fall-container {
          height: 85vh;
          background: linear-gradient(to bottom, #87CEEB, #E1F5EE);
          border-radius: 40px;
          position: relative;
          overflow: hidden;
          display: flex;
          flex-direction: column;
          border: 8px solid white;
          box-shadow: 0 20px 50px rgba(0,0,0,0.1);
        }

        .game-hud {
          padding: 20px 30px;
          display: flex;
          justify-content: space-between;
          align-items: center;
          z-index: 100;
        }
        .game-back-btn {
          background: white;
          border: none;
          width: 48px;
          height: 48px;
          border-radius: 16px;
          display: flex;
          align-items: center;
          justify-content: center;
          color: #64748b;
          box-shadow: 0 4px 0 #e2e8f0;
        }

        .hud-stats { display: flex; gap: 15px; }
        .hud-pill {
          background: white;
          padding: 10px 20px;
          border-radius: 20px;
          display: flex;
          align-items: center;
          gap: 10px;
          font-weight: 900;
          box-shadow: 0 4px 0 #e2e8f0;
        }
        .hud-pill.score { color: #BA7517; }
        .hud-pill.lives { color: #FF6B6B; }

        .heart-dot {
          width: 12px;
          height: 12px;
          background: #e2e8f0;
          border-radius: 50%;
          display: inline-block;
          margin-left: 4px;
        }
        .heart-dot.active { background: #FF6B6B; }

        .game-canvas {
          flex: 1;
          position: relative;
        }

        .falling-word {
          position: absolute;
          padding: 12px 24px;
          background: #6C5CE7;
          color: white;
          border-radius: 20px;
          font-weight: 900;
          font-size: 18px;
          letter-spacing: 0.05em;
          transform: translateX(-50%);
          white-space: nowrap;
          transition: top 0.016s linear;
        }

        .game-input-area {
          padding: 30px;
          background: rgba(255,255,255,0.8);
          backdrop-filter: blur(10px);
        }
        .input-wrapper {
          max-width: 400px;
          margin: 0 auto;
          position: relative;
        }
        .input-icon {
          position: absolute;
          left: 20px;
          top: 50%;
          transform: translateY(-50%);
          color: #94a3b8;
        }
        .input-wrapper input {
          width: 100%;
          padding: 20px 20px 20px 60px;
          border-radius: 25px;
          border: 4px solid white;
          font-size: 24px;
          font-weight: 900;
          text-align: center;
          text-transform: uppercase;
          outline: none;
          box-shadow: 0 10px 25px rgba(0,0,0,0.05);
        }

        .game-overlay {
          position: absolute;
          inset: 0;
          background: rgba(108, 92, 231, 0.1);
          backdrop-filter: blur(5px);
          display: flex;
          align-items: center;
          justify-content: center;
          z-index: 50;
        }
        .start-card, .game-over-card {
          background: white;
          padding: 50px;
          border-radius: 40px;
          text-align: center;
          box-shadow: 0 20px 0 #6C5CE7;
          max-width: 400px;
        }
        .start-card h2, .game-over-card h2 { font-size: 36px; font-weight: 900; margin: 20px 0 10px; }
        .start-card p { color: #64748b; font-weight: 600; margin-bottom: 30px; }
        .start-btn, .restart-btn {
          width: 100%;
          padding: 20px;
          background: #2ECC71;
          color: white;
          border-radius: 20px;
          font-weight: 900;
          font-size: 20px;
          box-shadow: 0 8px 0 #27ae60;
          border: none;
        }
        .start-btn:active { transform: translateY(4px); box-shadow: 0 4px 0 #27ae60; }
        
        .zap-icon { color: #FFD93D; animation: pulse 2s infinite; }
        @keyframes pulse { 0% { transform: scale(1); } 50% { transform: scale(1.1); } 100% { transform: scale(1); } }
      `}</style>
    </div>
  );
};

export default WordFallGame;
