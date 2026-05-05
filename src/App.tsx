import React, { useState, useMemo, useEffect, useRef } from 'react';
// Build trigger: TS_ERRORS_FIXED_V2
import type { Unit } from './types';
import { useAuth } from './context/AuthContext';
import { BookOpen, BarChart2, ClipboardList, MessageCircle, Lock, Unlock } from 'lucide-react';
import homeButton from './assets/home-button.png';
import classButton from './assets/class-button.png';
import helpButton from './assets/help-button.png';
import plansButton from './assets/plans-button.png';
import { LoginScreen } from './components/features/LoginScreen';
import { Dashboard } from './components/features/Dashboard';
import tulipIcon from './assets/imagem do projeto.png';
import { Activities } from './components/features/Activities';
import { Progress } from './components/features/Progress';
import { Planning } from './components/features/Planning';
import PlanningEditor from './components/features/PlanningEditor';
import { WhatsAppAssistant } from './components/features/WhatsAppAssistant';
import { useDariData } from './hooks/useData';
import { useStudentJourney } from './hooks/useStudentJourney';
import { speechService } from './utils/speech';
import { DEFAULT_UNITS } from './constants';
import { supabase } from './services/supabase';

export const App: React.FC = () => {
  useEffect(() => {
    speechService.preload();
  }, []);

  const { role, user, logout } = useAuth();
  const [activeTab, setActiveTab] = useState<'adventure' | 'activities' | 'planning' | 'chat' | 'settings' | 'whatsapp'>('adventure');
  const [activeUnit, setActiveUnit] = useState<Unit | null>(null);
  const [isPreviewMode, setIsPreviewMode] = useState(false);
  const [celebration, setCelebration] = useState<{ xp: number, stars: number } | null>(null);
  const [editingUnitId, setEditingUnitId] = useState<string | null>(null);
  const {
    units, sessions, answers, settings, loading, syncStatus,
    saveAnswer, saveSession, updateSession, deleteSession, resetUnitAnswers, updateUnit, createUnit, refresh
  } = useDariData();

  const hasSynced = useRef(false);
  // Sync units to Supabase (Add missing or Update existing with new titles/icons)
  useEffect(() => {
    const syncUnits = async () => {
      if (role === 'admin' && units && units.length > 0 && !hasSynced.current) {
        hasSynced.current = true;
        console.log("Checking unit synchronization...");
        let needsRefresh = false;

        try {
          for (const defaultUnit of DEFAULT_UNITS) {
            const existing = units.find(u => u.id === defaultUnit.id);
            
            // Se não existe ou se campos principais mudaram
            if (!existing || existing.title !== defaultUnit.title || existing.sub !== defaultUnit.sub || existing.sort_order !== defaultUnit.sort_order || existing.title_dari !== defaultUnit.title_dari || (defaultUnit.mystery_icon && existing.mystery_icon !== defaultUnit.mystery_icon)) {
              console.log(`Force syncing unit: ${defaultUnit.title}`);
              
              const unitToSync = {
                id: defaultUnit.id,
                title: defaultUnit.title,
                title_dari: defaultUnit.title_dari,
                sub: defaultUnit.sub,
                color: defaultUnit.color,
                sort_order: defaultUnit.sort_order,
                brief: defaultUnit.brief,
                plan_c: defaultUnit.plan_c,
                plan_h: defaultUnit.plan_h,
                plan_e: defaultUnit.plan_e,
                plan_a: defaultUnit.plan_a,
                wa: defaultUnit.wa,
                mystery_icon: defaultUnit.mystery_icon || (existing?.mystery_icon || null),
                mystery_icon_size: defaultUnit.mystery_icon_size || (existing?.mystery_icon_size || 120),
                questions: defaultUnit.questions,
                external_links: defaultUnit.external_links
              };

              const { error } = await supabase.from('units').upsert(unitToSync);
              
              if (error) {
                console.error(`Error syncing unit ${defaultUnit.id}:`, error.message);
              } else {
                needsRefresh = true;
              }
            }
          }

          if (needsRefresh) {
            console.log("Units updated, refreshing...");
            refresh?.();
          }
        } catch (err) {
          console.error("Critical error during unit synchronization:", err);
        }
      }
    };
    syncUnits();
  }, [units, role, refresh]);

  // Student Journey Hook for rewards
  const { addStudentRewards } = useStudentJourney(user?.id || '');

  const handleGameOver = async (finalScore: number, wordsFound: number) => {
    const xpGained = wordsFound * 5;
    const starsEarned = Math.floor(finalScore / 100);

    const { success } = await addStudentRewards(xpGained, starsEarned);

    if (success) {
      setCelebration({ xp: xpGained, stars: starsEarned });
    }
  };

  const sortedUnits = useMemo(() => {
    if (!units) return [];
    return [...units].sort((a, b) => (a.sort_order || 0) - (b.sort_order || 0));
  }, [units]);

  const completedPct = useMemo(() => {
    try {
      if (!sortedUnits || sortedUnits.length === 0) return 0;
      const completedUnits = sortedUnits.filter(u => {
        if (!u || !u.questions) return false;
        return u.questions.every((_: any, i: number) => answers[`${u.id}-${i}`]?.is_done);
      }).length;
      return Math.round((completedUnits / sortedUnits.length) * 100);
    } catch (e) {
      console.error("Error calculating progress:", e);
      return 0;
    }
  }, [sortedUnits, answers]);

  const unitStatus = useMemo(() => {
    const status: Record<string, boolean> = {};
    if (!sortedUnits) return status;
    sortedUnits.forEach(u => {
      status[u.id] = u.questions.every((_: any, i: number) => answers[`${u.id}-${i}`]?.is_done);
    });
    return status;
  }, [sortedUnits, answers]);

  console.log("App Rendering: Version - Mystery Icon Controls Added");
  console.log("App State:", { role, loading, unitsCount: units?.length, settingsAvailable: !!settings });

  if (loading) {
    return (
      <div id="loader">
        <img src={tulipIcon} alt="Logo" style={{ width: '220px', height: 'auto', marginBottom: '30px' }} />
        <div className="loader-spinner"></div>
        <div className="loader-msg">Carregando o sistema...</div>
      </div>
    );
  }

  if (!role) {
    console.log("No role detected, showing LoginScreen");
    return <LoginScreen settings={settings} />;
  }

  if (!units || units.length === 0) {
    return (
      <div style={{ padding: '40px 20px', textAlign: 'center', background: 'var(--bg)', minHeight: '100vh' }}>
        <img src={tulipIcon} alt="Logo" style={{ width: '200px', height: 'auto', marginBottom: '30px' }} />
        <h3 style={{ color: 'var(--ink2)', marginBottom: '10px' }}>Nenhuma Aula Encontrada</h3>
        <p style={{ color: 'var(--ink4)', maxWidth: '400px', margin: '0 auto 24px' }}>
          As unidades de ensino não foram carregadas. Isso geralmente acontece se as permissões (RLS) no Supabase não foram atualizadas para o seu e-mail.
        </p>
        <div style={{ display: 'flex', gap: '10px', justifyContent: 'center' }}>
          <button className="primary-btn" onClick={() => window.location.reload()} style={{ padding: '10px 20px' }}>Tentar Novamente</button>
          {role === 'admin' && <button className="secondary-btn" onClick={() => setActiveTab('planning')} style={{ padding: '10px 20px' }}>Ir para Planejamento</button>}
        </div>
      </div>
    );
  }

  return (
    <div id="app">

      <div className="topbar">
        <div>
          <div className="topbar-logo">Projeto Pontes da Esperança · 2026</div>
          <div className="topbar-name" style={{ direction: 'rtl', textAlign: 'left' }}>
            {user?.user_metadata?.full_name || 'دانش‌آmuz (Estudante)'}
          </div>
        </div>
        <div style={{ textAlign: 'right' }}>
          <span style={{ fontSize: '11px', color: 'var(--ink4)' }}>
            {role === 'student' ? (user?.user_metadata?.full_name || 'Estudante') : (settings?.med_name || 'Professor(a)')}
          </span>
        </div>
      </div>

      {/* Admin View Toggle (Floating Pill) */}
      {role === 'admin' && (
        <div
          className="admin-view-toggle-pill"
          style={{
            position: 'fixed',
            bottom: '20px',
            left: '20px',
            zIndex: 9999,
            display: 'flex',
            alignItems: 'center',
            gap: '12px',
            padding: '6px 6px 6px 16px',
            background: isPreviewMode ? '#1e293b' : 'white',
            borderRadius: '30px',
            boxShadow: '0 10px 25px rgba(0,0,0,0.1)',
            border: '1px solid rgba(0,0,0,0.05)',
            transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
            backdropFilter: 'blur(10px)'
          }}
        >
          <div style={{ display: 'flex', flexDirection: 'column' }}>
            <span style={{
              fontSize: '9px',
              fontWeight: 900,
              color: isPreviewMode ? '#94a3b8' : '#64748b',
              textTransform: 'uppercase',
              letterSpacing: '0.5px'
            }}>
              Modo de Visualização
            </span>
            <span style={{
              fontSize: '13px',
              fontWeight: 800,
              color: isPreviewMode ? 'white' : '#1e293b'
            }}>
              {isPreviewMode ? 'Estudante' : 'Administrador'}
            </span>
          </div>

          <button
            onClick={() => {
              setIsPreviewMode(!isPreviewMode);
              if (!isPreviewMode) setActiveTab('adventure');
            }}
            style={{
              background: isPreviewMode ? '#fbbf24' : '#0ea5e9',
              color: 'white',
              border: 'none',
              padding: '8px 16px',
              borderRadius: '20px',
              cursor: 'pointer',
              fontWeight: 900,
              fontSize: '11px',
              boxShadow: '0 4px 12px rgba(0,0,0,0.1)',
              transition: 'all 0.2s',
              display: 'flex',
              alignItems: 'center',
              gap: '6px'
            }}
          >
            {isPreviewMode ? (
              <><span>🔓</span> SAIR DO PREVIEW</>
            ) : (
              <><span>👁️</span> VER COMO ALUNO</>
            )}
          </button>
        </div>
      )}
      <aside className="sidebar-kids" style={{ background: 'rgba(216, 180, 216, 0.1)', backdropFilter: 'var(--glass)', borderRight: '1px solid var(--border)' }}>
        <div style={{ textAlign: 'center', marginBottom: '48px', padding: '24px 0' }}>
          <img src={tulipIcon} alt="Projeto Logo" style={{ width: '200px', height: 'auto', marginBottom: '15px' }} />
        </div>

        <button 
          className={`nav-link-kids adventure ${activeTab === 'adventure' ? 'active' : ''}`}
          onClick={() => { setActiveTab('adventure'); setActiveUnit(null); }}
        >
          <div className="icon-wrapper" style={{ background: 'var(--lavender)' }}>✨</div>
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-start' }}>
            <span style={{ direction: 'rtl', fontSize: '22px', fontWeight: 900, lineHeight: 1 }}>صنف‌های من</span>
            <span style={{ fontSize: '14px', fontWeight: 700, opacity: 0.9, marginTop: '4px' }}>Minhas Aulas</span>
          </div>
        </button>

        {!isPreviewMode && role === 'admin' && (
          <button 
            className={`nav-link-kids planning ${activeTab === 'planning' ? 'active' : ''}`}
            onClick={() => setActiveTab('planning')}
          >
            <div className="icon-wrapper" style={{ background: 'var(--sage)' }}>🌿</div>
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-start' }}>
              <span style={{ fontSize: '18px', fontWeight: 900 }}>Planejamento</span>
            </div>
          </button>
        )}

        <button 
          className={`nav-link-kids whatsapp ${activeTab === 'whatsapp' ? 'active' : ''}`}
          onClick={() => { setActiveTab('whatsapp'); setActiveUnit(null); }}
        >
          <div className="icon-wrapper" style={{ background: 'var(--sky-blue)' }}>☁️</div>
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-start' }}>
            <span style={{ direction: 'rtl', fontSize: '22px', fontWeight: 900, lineHeight: 1 }}>کمک</span>
            <span style={{ fontSize: '14px', fontWeight: 700, opacity: 0.9, marginTop: '4px' }}>Ajuda (Help)</span>
          </div>
        </button>

        <div style={{ marginTop: 'auto', padding: '10px' }}>
           <button 
             className="nav-link-kids logout-btn-v5"
             onClick={logout}
           >
             <div className="icon-wrapper" style={{ background: '#FF4D4D' }}>🚪</div>
             <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-start' }}>
               <span style={{ direction: 'rtl', fontSize: '18px', fontWeight: 900, lineHeight: 1 }}>خروج</span>
               <span style={{ fontSize: '12px', fontWeight: 700, opacity: 0.9, marginTop: '4px' }}>Sair (Logout)</span>
             </div>
           </button>
        </div>
      </aside>

      <div className="main-content-wrapper">
        <main className="screen active">
          {activeTab === 'adventure' && !activeUnit && (
            <Dashboard
              onNavigate={(screen, unitId) => {
                const unit = sortedUnits.find(u => u.id === unitId);
                if (unit) setActiveUnit(unit);
              }}
              completedPct={completedPct}
              sessionsCount={sessions.length}
              mediatorName={settings?.med_name || 'English classes'}
              mediatorPhone={settings?.med_phone || '5543999567378'}
              units={sortedUnits}
              answers={answers}
              isAdmin={role === 'admin' && !isPreviewMode}
              onUpdateUnit={updateUnit}
            />
          )}

          {activeTab === 'adventure' && activeUnit && (
            <Activities
              units={sortedUnits}
              answers={answers}
              onSaveAnswer={saveAnswer}
              onSaveSession={saveSession}
              isAdmin={role === 'admin' && !isPreviewMode}
              isMediator={role === 'mediator'}
              onUpdateUnit={updateUnit}
              onCreateUnit={createUnit}
              onGameOver={handleGameOver}
              initialExpandedId={activeUnit.id}
              onGoHome={() => setActiveUnit(null)}
              onToggle={() => setActiveUnit(null)}
            />
          )}
          {activeTab === 'planning' && role === 'admin' && (
            <div>
              {!editingUnitId ? (
                <>
                  <div className="back-row">
                    <button className="back-btn" onClick={() => setActiveTab('adventure')}>←</button>
                    <h2 className="screen-title" style={{ margin: 0 }}>Planejamento</h2>
                  </div>
                  <Planning
                    units={units}
                    sessions={sessions}
                    isAdmin={role === 'admin'}
                    settings={settings}
                    onUpdateUnit={(id, updates) => updateUnit(id, updates)}
                    onEditDetails={(id) => setEditingUnitId(id)}
                    onSaveSession={saveSession}
                    onResetProgress={resetUnitAnswers}
                  />
                </>
              ) : (
                <PlanningEditor
                  unitId={editingUnitId}
                  onBack={() => setEditingUnitId(null)}
                  updateUnit={updateUnit}
                  units={units}
                />
              )}
            </div>
          )}

          {activeTab === 'activities' && (
            <Activities
              units={sortedUnits}
              answers={answers}
              onSaveAnswer={saveAnswer}
              onSaveSession={saveSession}
              isAdmin={role === 'admin' && !isPreviewMode}
              isMediator={role === 'mediator'}
              onUpdateUnit={updateUnit}
              onCreateUnit={createUnit}
              onGameOver={handleGameOver}
              onGoHome={() => setActiveTab('adventure')}
              onToggle={() => setActiveTab('adventure')}
            />
          )}
          {activeTab === 'whatsapp' && (
            <div>
              <div className="back-row">
                <button className="back-btn" onClick={() => setActiveTab('adventure')}>←</button>
                <h2 className="screen-title" style={{ margin: 0 }}>WhatsApp assistant</h2>
              </div>
              <WhatsAppAssistant
                units={units}
                mediatorPhone={settings?.med_phone || '5543999567378'}
              />
            </div>
          )}
          {activeTab === 'settings' && (
            <div>
              <div className="back-row">
                <button className="back-btn" onClick={() => setActiveTab('adventure')}>←</button>
                <h2 className="screen-title" style={{ margin: 0 }}>Configurações</h2>
              </div>
              <div className="settings-section">
                <div className="settings-row">
                  <div className="settings-row-label">E-mail logado</div>
                  <div className="settings-row-sub">{role === 'admin' ? 'Administrador' : 'Mediador'}</div>
                </div>
              </div>
              <button className="logout-btn" onClick={logout}>Sair / Trocar perfil</button>
            </div>
          )}
        </main>
      </div>

      {celebration && (
        <div className="celebration-overlay">
          <div className="celebration-card">
            <span className="cel-trophy">🏆</span>
            <h2 className="cel-title">INCRÍVEL!</h2>
            <p className="cel-sub">Você completou o desafio com sucesso!</p>

            <div className="cel-rewards">
              <div className="cel-reward-item">
                <span className="cel-reward-val">+{celebration.xp}</span>
                <span className="cel-reward-lbl">XP</span>
              </div>
              <div className="cel-reward-item">
                <span className="cel-reward-val">+{celebration.stars}</span>
                <span className="cel-reward-lbl">Estrelas</span>
              </div>
            </div>

            <button className="cel-btn" onClick={() => setCelebration(null)}>
              CONTINUAR JORNADA
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default App;
