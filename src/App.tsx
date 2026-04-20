import React, { useState, useMemo, useEffect } from 'react';
import { useAuth } from './context/AuthContext';
import { Home, Library, BarChart3, ClipboardList, MessageCircle } from 'lucide-react';
import { LoginScreen } from './components/features/LoginScreen';
import { Dashboard } from './components/features/Dashboard';
import { Activities } from './components/features/Activities';
import { Progress } from './components/features/Progress';
import { Planning } from './components/features/Planning';
import { WhatsAppAssistant } from './components/features/WhatsAppAssistant';
import { useSarehData } from './hooks/useData';
import { speechService } from './utils/speech';

export const App: React.FC = () => {
  useEffect(() => {
    speechService.preload();
  }, []);

  const { role, logout } = useAuth();
  const [activeTab, setActiveTab] = useState('home');
  const { 
    units, sessions, answers, settings, loading, syncStatus, 
    saveAnswer, saveSession, updateSession, deleteSession, resetUnitAnswers, updateUnit 
  } = useSarehData();

  const completedPct = useMemo(() => {
    try {
      if (!units || units.length === 0) return 0;
      const completedUnits = units.filter(u => {
        if (!u || !u.questions) return false;
        return u.questions.every((_, i) => answers[`${u.id}-${i}`]?.is_done);
      }).length;
      return Math.round((completedUnits / units.length) * 100);
    } catch (e) {
      console.error("Error calculating progress:", e);
      return 0;
    }
  }, [units, answers]);

  const unitStatus = useMemo(() => {
    const status: Record<string, boolean> = {};
    if (!units) return status;
    units.forEach(u => {
      status[u.id] = u.questions.every((_, i) => answers[`${u.id}-${i}`]?.is_done);
    });
    return status;
  }, [units, answers]);

  console.log("App State:", { role, loading, unitsCount: units?.length, settingsAvailable: !!settings });

  if (loading) {
    return (
      <div id="loader">
        <div className="loader-logo">SAREH · 2026</div>
        <div className="loader-spinner"></div>
        <div className="loader-msg">Conectando ao banco de dados...</div>
      </div>
    );
  }

  if (!role) {
    console.log("No role detected, showing LoginScreen");
    return <LoginScreen settings={settings} />;
  }

  if (!units) {
    return (
      <div style={{ padding: '20px', textAlign: 'center' }}>
        <h3>Erro de Carregamento</h3>
        <p>As unidades não foram encontradas. Verifique se rodou o SQL no Supabase.</p>
        <button onClick={() => window.location.reload()}>Recarregar</button>
      </div>
    );
  }
  
  return (
    <div id="app">
      {role === 'admin' && <div className="admin-mode-light" title="Modo Administrador Ativo"></div>}
      <div className="topbar">
        <div>
          <div className="topbar-logo">SAREH · Domiciliar</div>
          <div className="topbar-name">Ione Jordão Ribeiro</div>
        </div>
        <div style={{ textAlign: 'right' }}>
          <span className={`role-badge ${role}`}>{role === 'admin' ? 'Admin' : 'Mediadora'}</span>
          <span className={`sync-dot ${syncStatus}`}></span><br />
          <span style={{ fontSize: '11px', color: 'var(--ink4)' }}>{settings?.med_name || 'Prof. Willians'}</span>
        </div>
      </div>

      <nav className="bottom-nav" style={{ gridTemplateColumns: role === 'admin' ? 'repeat(5, 1fr)' : 'repeat(4, 1fr)' }}>
        <div className="sidebar-profile">
          <div className="side-avatar">I</div>
          <div className="side-profile-info">
             <div className="side-name">Ione Ribeiro</div>
             <div className="side-role">Estudante</div>
          </div>
        </div>

        <button className={`nav-btn ${activeTab === 'home' ? 'active' : ''}`} onClick={() => setActiveTab('home')}>
          <Home size={24} className="nav-icon" />
          Início
        </button>
        <button className={`nav-btn ${activeTab === 'activities' ? 'active' : ''}`} onClick={() => setActiveTab('activities')}>
          <Library size={24} className="nav-icon" />
          Aulas
        </button>
        <button className={`nav-btn ${activeTab === 'progress' ? 'active' : ''}`} onClick={() => setActiveTab('progress')}>
          <BarChart3 size={24} className="nav-icon" />
          Relat.
        </button>
        {role === 'admin' && (
          <button className={`nav-btn ${activeTab === 'planning' ? 'active' : ''}`} onClick={() => setActiveTab('planning')}>
            <ClipboardList size={24} className="nav-icon" />
            Plano
          </button>
        )}
        <button className={`nav-btn ${activeTab === 'whatsapp' ? 'active' : ''}`} onClick={() => setActiveTab('whatsapp')}>
          <MessageCircle size={24} className="nav-icon" />
          Zap
        </button>
      </nav>

      <div className="main-content-wrapper">
        <main className="screen active">
          {activeTab === 'home' && (
             <Dashboard 
                onNavigate={setActiveTab}
                units={units}
                answers={answers}
                completedPct={completedPct}
                sessionsCount={sessions.length}
                lastSessionDate={sessions[0]?.session_date || ''}
                mediatorName={settings?.med_name || 'Geocélia'}
                mediatorPhone={settings?.med_phone || '554391637162'}
                studentEmail={settings?.student_email}
             />
          )}
          {activeTab === 'activities' && (
             <div>
               <div className="back-row">
                  <button className="back-btn" onClick={() => setActiveTab('home')}>←</button>
                  <h2 className="screen-title" style={{ margin: 0 }}>Aulas</h2>
               </div>
               <Activities 
                 units={units} 
                 answers={answers} 
                 onSaveAnswer={saveAnswer} 
                 onSaveSession={saveSession} 
               />
             </div>
          )}
           {activeTab === 'progress' && (
             <div>
               <div className="back-row">
                  <button className="back-btn" onClick={() => setActiveTab('home')}>←</button>
                  <h2 className="screen-title" style={{ margin: 0 }}>Progresso</h2>
               </div>
               <Progress 
                 units={units} 
                 sessions={sessions} 
                 unitStatus={unitStatus} 
                 onResetUnitAnswers={resetUnitAnswers} 
                 onUpdateSession={updateSession}
                 onDeleteSession={deleteSession}
               />
             </div>
          )}
           {activeTab === 'planning' && role === 'admin' && (
             <div>
               <div className="back-row">
                  <button className="back-btn" onClick={() => setActiveTab('home')}>←</button>
                  <h2 className="screen-title" style={{ margin: 0 }}>Planejamento</h2>
               </div>
               <Planning units={units} isAdmin={role === 'admin'} settings={settings} onUpdateUnit={(id, updates) => updateUnit(id, updates)} />
             </div>
          )}
           {activeTab === 'whatsapp' && (
             <div>
               <div className="back-row">
                  <button className="back-btn" onClick={() => setActiveTab('home')}>←</button>
                  <h2 className="screen-title" style={{ margin: 0 }}>WhatsApp assistant</h2>
               </div>
               <WhatsAppAssistant 
                 units={units} 
                 mediatorPhone={settings?.med_phone || '554391637162'}
               />
             </div>
          )}
           {activeTab === 'settings' && (
             <div>
               <div className="back-row">
                  <button className="back-btn" onClick={() => setActiveTab('home')}>←</button>
                  <h2 className="screen-title" style={{ margin: 0 }}>Configurações</h2>
               </div>
               <div className="settings-section">
                  <div className="settings-row">
                    <div className="settings-row-label">E-mail logado</div>
                    <div className="settings-row-sub">{role === 'admin' ? 'Administrador' : 'Mediadora'}</div>
                  </div>
               </div>
               <button className="logout-btn" onClick={logout}>Sair / Trocar perfil</button>
             </div>
          )}
        </main>
      </div>
    </div>
  );
};

export default App;
