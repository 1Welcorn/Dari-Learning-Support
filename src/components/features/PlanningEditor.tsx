import React, { useState, useEffect } from 'react';
import { supabase } from '../../services/supabase';
import { Save, Plus, Trash2, BookOpen, Target, Lightbulb, ChevronLeft, Eye, X, Globe, Lock, Unlock } from 'lucide-react';
import { UnitCard } from './Activities';
import { COLORS } from '../../constants';
import { useSarehData } from '../../hooks/useData';

interface EmbedActivity {
  url: string;
  title: string;
  width: string;
  maskIcon?: string;
}

interface PlanningEditorProps {
  unitId: string;
  onBack: () => void;
  updateUnit: (id: string, updates: any) => Promise<{ success: boolean; error?: string }>;
}

const normalizeEmbedUrl = (rawUrl: string): string => {
  const trimmed = rawUrl.trim();
  if (!trimmed) return '';

  const withProtocol = /^https?:\/\//i.test(trimmed) ? trimmed : `https://${trimmed}`;

  try {
    const url = new URL(withProtocol);

    if (url.hostname.includes('drive.google.com')) {
      url.pathname = url.pathname.replace(/\/view$/, '/preview');
      return url.toString();
    }

    if (url.hostname.includes('youtube.com') && url.pathname === '/watch') {
      const videoId = url.searchParams.get('v');
      if (videoId) return `https://www.youtube.com/embed/${videoId}`;
    }

    if (url.hostname.includes('youtu.be')) {
      const videoId = url.pathname.replace('/', '');
      if (videoId) return `https://www.youtube.com/embed/${videoId}`;
    }

    return url.toString();
  } catch {
    return trimmed;
  }
};

const PlanningEditor: React.FC<PlanningEditorProps> = ({ unitId, onBack, updateUnit }) => {
  // const { updateUnit } = useSarehData(); - Removido para evitar conflito de canais realtime
  const [loading, setLoading] = useState(true);
  const [unitData, setUnitData] = useState<any>(null);
  const [newWord, setNewWord] = useState("");
  const [descText, setDescText] = useState("");
  const [tempEmbed, setTempEmbed] = useState("");
  const [isSavingEmbed, setIsSavingEmbed] = useState(false);
  const [embedSaved, setEmbedSaved] = useState(false);
  const [isPreviewing, setIsPreviewing] = useState(false);
  const [isDirty, setIsDirty] = useState(false);

  useEffect(() => {
    fetchUnit();
  }, [unitId]);

  const fetchUnit = async () => {
    const { data } = await supabase.from('units').select('*').eq('id', unitId).single();
    if (data) {
      // Garantir que campos JSON sejam arrays/objetos mesmo que venham como string
      const sanitized = {
        ...data,
        descriptors: typeof data.descriptors === 'string' ? JSON.parse(data.descriptors) : (data.descriptors || []),
        embed_urls: typeof data.embed_urls === 'string' ? JSON.parse(data.embed_urls) : (data.embed_urls || []),
        questions: typeof data.questions === 'string' ? JSON.parse(data.questions) : (data.questions || []),
        external_links: typeof data.external_links === 'string' ? JSON.parse(data.external_links) : (data.external_links || []),
        game_words: typeof data.game_words === 'string' ? JSON.parse(data.game_words) : (data.game_words || []),
      };
      setUnitData(sanitized);
      setDescText(sanitized.descriptors?.join(', ') || '');
    }
    setLoading(false);
  };

  const handleSave = async () => {
    try {
      const descs = descText.split(',').map((v: string) => v.trim()).filter(Boolean);
      
      // Definir explicitamente apenas as colunas que existem no banco de dados
      const updates = { 
        title: unitData.title,
        sub: unitData.sub,
        brief: unitData.brief,
        learning_objectives: unitData.learning_objectives,
        methodology: unitData.methodology,
        color: unitData.color,
        is_locked: unitData.is_locked,
        descriptors: descs,
        questions: unitData.questions || [],
        game_words: unitData.game_words || [],
        embed_urls: unitData.embed_urls || [],
        external_links: unitData.external_links || [],
        plan_c: unitData.plan_c,
        plan_h: unitData.plan_h,
        plan_e: unitData.plan_e,
        plan_a: unitData.plan_a
      };
      
      console.log('PlanningEditor: Saving changes...', updates);
      const result = await updateUnit(unitId, updates);
      
      if (result.success) {
        setIsDirty(false);
        // Recarregar os dados do banco para garantir sincronia total
        await fetchUnit();
        alert("Planejamento atualizado com sucesso! 🚀");
      } else {
        alert('Erro ao salvar: ' + result.error);
      }
    } catch (err: any) {
      console.error('Exception in handleSave:', err);
      alert('Erro inesperado: ' + err.message);
    }
  };

  const addWord = () => {
    if (!newWord.trim()) return;
    const updatedVocab = [...(unitData.game_words || []), newWord.trim()];
    setUnitData({ ...unitData, game_words: updatedVocab });
    setNewWord("");
    setIsDirty(true);
  };

  const saveEmbedLink = async () => {
    if (!tempEmbed.trim() || isSavingEmbed) return;
    setIsSavingEmbed(true);
    setEmbedSaved(false);
    const current = Array.isArray(unitData.embed_urls) ? unitData.embed_urls : [];
    const newEmbed: EmbedActivity = { url: normalizeEmbedUrl(tempEmbed), title: `Nova Atividade`, width: '100%' };
    const nextEmbeds = [...current, newEmbed];
    
    setUnitData({ ...unitData, embed_urls: nextEmbeds });
    setIsSavingEmbed(false);
    setTempEmbed("");
    setEmbedSaved(true);
    setIsDirty(true);
  };

  const removeEmbed = (idx: number) => {
    const current = [...(unitData.embed_urls || [])];
    current.splice(idx, 1);
    setUnitData({ ...unitData, embed_urls: current });
    setIsDirty(true);
  };

  if (loading) return (
    <div className="screen-loading">
      <div className="loader-spinner"></div>
      <p>Carregando plano...</p>
    </div>
  );

  if (!unitData) return (
    <div className="screen-error">
      <h2>Erro ao carregar unidade</h2>
      <p>Não foi possível encontrar os dados para a unidade ID: {unitId}</p>
      <button onClick={onBack} className="primary-btn">Voltar</button>
    </div>
  );

  return (
    <div className="planning-editor-view">
      <header className="editor-header no-print">
        <div className="header-left">
          <button onClick={onBack} className="back-btn-v4">
            <ChevronLeft size={24} />
          </button>
          <div>
            <h1 className="editor-title">Gestão Pedagógica</h1>
            <p className="editor-subtitle">Configurando: {unitData.title}</p>
          </div>
        </div>
        <div className="header-right">
          <button 
            className={`admin-lock-btn-editor ${unitData.is_locked ? 'locked' : ''}`}
            onClick={() => setUnitData({ ...unitData, is_locked: !unitData.is_locked })}
            style={{
              padding: '10px 18px',
              borderRadius: '14px',
              border: 'none',
              background: unitData.is_locked ? '#fee2e2' : '#f1f5f9',
              color: unitData.is_locked ? '#ef4444' : '#64748b',
              fontWeight: 900,
              fontSize: '13px',
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              cursor: 'pointer'
            }}
          >
            {unitData.is_locked ? <Lock size={18} /> : <Unlock size={18} />}
            {unitData.is_locked ? 'BLOQUEADO' : 'LIBERADO'}
          </button>
          <button onClick={() => setIsPreviewing(true)} className="preview-plano-btn">
            <Eye size={20} /> PREVIEW
          </button>
          <button onClick={handleSave} className="save-plano-btn">
            <Save size={20} /> SALVAR PLANO
          </button>
          <button 
            onClick={async () => {
              if (confirm('Deseja realmente apagar TODAS as atividades e o banco de palavras desta aula? Esta ação não pode ser desfeita.')) {
                setUnitData({ 
                  ...unitData, 
                  embed_urls: [], 
                  game_words: [],
                  external_links: (unitData.external_links || []).filter((l: any) => l.label !== 'media' && l.label !== 'HTML')
                });
                setIsDirty(true);
                alert('Tudo limpo! Agora você pode começar as novas atividades do zero. 🚀');
              }
            }}
            className="clear-all-btn"
            style={{
              padding: '10px 14px',
              borderRadius: '16px',
              border: '1px solid #fee2e2',
              background: 'white',
              color: '#ef4444',
              fontWeight: 800,
              fontSize: '11px',
              cursor: 'pointer',
              marginLeft: '8px'
            }}
          >
            RECOMEÇAR DO ZERO
          </button>
        </div>
      </header>

      <div className="editor-grid">
        {/* Core Info Section */}
        <div className="editor-main-col">
          <section className="editor-section-card study-guide-editor">
            <div className="section-header-v4">
              <h3 className="section-title-v4">
                <BookOpen className="text-blue" size={20} /> Guia de Estudo (Estudante & Mediadora)
              </h3>
              <div className="smart-badge-v4">Smart Renderer Ativo ✨</div>
            </div>
            
            <div className="editor-field-wrapper">
              <label className="field-label-v4">Texto de Introdução</label>
              <p className="field-help">Este texto aparece na primeira etapa da aula. O sistema ajusta o tamanho da fonte automaticamente se houver mídias abaixo.</p>
              <textarea 
                className="editor-textarea-premium"
                rows={6}
                value={unitData.brief || ""}
                onChange={(e) => setUnitData({...unitData, brief: e.target.value})}
                placeholder="Ex: Hoje falaremos dos objetos e ações que acontecem na cozinha..."
                style={{ 
                  fontSize: unitData.external_links?.some((l: any) => l.label === 'media' || l.label === 'HTML') ? '16px' : '18px',
                  fontWeight: unitData.external_links?.some((l: any) => l.label === 'media' || l.label === 'HTML') ? 500 : 700
                }}
              />
            </div>

            <div className="media-management-v4" style={{ marginTop: '32px', padding: '24px', background: '#f8fafc', borderRadius: '24px', border: '1px solid #edf2f7' }}>
              <h4 style={{ fontSize: '15px', fontWeight: 900, marginBottom: '8px', color: '#1e293b' }}>
                Conteúdo Multimídia Abaixo do Texto
              </h4>
              <p className="field-help" style={{ marginBottom: '20px' }}>
                Insira imagens (URL), vídeos (YouTube) ou código HTML. Eles aparecerão em sequência após o texto.
              </p>
              
              <div className="media-input-bar">
                <input 
                  type="text" 
                  className="editor-input-v4"
                  placeholder="Cole aqui o link (JPG, PNG, YouTube) ou código <HTML>..."
                  id="new-brief-media"
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      const btn = document.getElementById('add-media-btn');
                      btn?.click();
                    }
                  }}
                />
                <button
                  id="add-media-btn"
                  onClick={() => {
                    const input = document.getElementById('new-brief-media') as HTMLInputElement;
                    const val = input.value.trim();
                    if (!val) return;
                    
                    const isHtml = val.startsWith('<');
                    const newMedia = { label: isHtml ? 'HTML' : 'media', url: val };
                    const nextLinks = [...(unitData.external_links || []), newMedia];
                    setUnitData({ ...unitData, external_links: nextLinks });
                    input.value = '';
                  }}
                  className="media-add-btn-v4"
                >
                  <Plus size={20} /> ADICIONAR
                </button>
              </div>

              <div className="media-list-stack" style={{ marginTop: '24px', display: 'flex', flexDirection: 'column', gap: '12px' }}>
                {(unitData.external_links || []).filter((l: any) => l.label === 'media' || l.label === 'HTML').length === 0 && (
                  <div className="empty-media-placeholder">
                    <span>Nenhuma mídia adicionada. O texto ficará em destaque máximo.</span>
                  </div>
                )}
                
                {unitData.external_links?.filter((l: any) => l.label === 'media' || l.label === 'HTML').map((media: any, i: number) => (
                  <div key={i} className="media-item-card-v4">
                    <div className="media-preview-mini">
                      {media.label === 'HTML' ? '<b>HTML</b>' : (media.url.includes('youtube') ? '🎥' : '🖼️')}
                    </div>
                    <div className="media-info-mini">
                      <span className="media-type-tag" style={{ background: media.label === 'HTML' ? '#f59e0b' : '#3b82f6' }}>{media.label}</span>
                      <span className="media-url-mini">{media.url}</span>
                    </div>
                    <button 
                      className="media-delete-btn" 
                      title="Remover mídia"
                      onClick={() => {
                        // Encontrar o índice real no array original
                        const filtered = unitData.external_links.filter((item: any) => item.label === 'media' || item.label === 'HTML');
                        const targetItem = filtered[i];
                        const next = unitData.external_links.filter((l: any) => l !== targetItem);
                        setUnitData({ ...unitData, external_links: next });
                      }}
                    >
                      <Trash2 size={16} />
                    </button>
                  </div>
                ))}
              </div>
            </div>
          </section>

          <section className="editor-section-card">
            <h3 className="section-title-v4">
              <Target className="text-orange" size={20} /> Objetivos de Aprendizagem
            </h3>
            <textarea 
              className="editor-textarea"
              rows={4}
              value={unitData.learning_objectives || ""}
              onChange={(e) => setUnitData({...unitData, learning_objectives: e.target.value})}
              placeholder="Ex: Identificar cores e formas..."
            />
          </section>

          <section className="editor-section-card">
            <h3 className="section-title-v4">
              <Lightbulb className="text-purple" size={20} /> Encaminhamento Metodológico
            </h3>
            <textarea 
              className="editor-textarea"
              rows={4}
              value={unitData.methodology || ""}
              onChange={(e) => setUnitData({...unitData, methodology: e.target.value})}
              placeholder="Ex: Uso de flashcards e objetos reais..."
            />
          </section>
          <section className="editor-section-card">
            <h3 className="section-title-v4">
              <Globe className="text-teal" size={20} /> Atividades Interativas (Embed)
            </h3>
            <p className="field-help">Cole aqui links do Wordwall, Canva ou Apps em HTML para que apareçam dentro da aula.</p>
            <div className="embed-input-group">
              <input 
                type="text" 
                className="editor-input-v4"
                placeholder="Cole o link da atividade aqui..."
                value={tempEmbed}
                onChange={(e) => {
                  setTempEmbed(e.target.value);
                  setEmbedSaved(false);
                }}
                onKeyDown={(e) => e.key === 'Enter' && saveEmbedLink()}
              />
              <button
                onClick={saveEmbedLink}
                className={`embed-add-btn-v4 ${embedSaved ? 'saved' : ''}`}
                disabled={!tempEmbed.trim() || isSavingEmbed}
              >
                <Plus size={20} /> {isSavingEmbed ? 'Salvando...' : embedSaved ? 'Salvo' : 'Salvar'}
              </button>
            </div>
            <div className="embed-list-editor-v5">
              {(!unitData.embed_urls || unitData.embed_urls.length === 0) && (
                <div className="empty-mini">Nenhuma atividade interativa adicionada.</div>
              )}
              {unitData.embed_urls?.map((itemOrUrl: string | EmbedActivity, i: number) => {
                const item: EmbedActivity = typeof itemOrUrl === 'string' ? { url: itemOrUrl, title: `Atividade ${i+1}`, width: '100%' } : itemOrUrl;
                
                return (
                  <div key={i} className="admin-embed-edit-card-v5">
                    <div className="admin-embed-main-row">
                      <input 
                        className="admin-embed-title-input"
                        value={item.title || ''} 
                        placeholder="Título da atividade"
                        onChange={(e) => {
                          const next = [...unitData.embed_urls];
                          next[i] = { ...item, title: e.target.value };
                          setUnitData({ ...unitData, embed_urls: next });
                        }}
                      />
                      <button className="admin-item-del" title="Excluir" onClick={() => removeEmbed(i)}>
                        <Trash2 size={14} />
                      </button>
                    </div>
                    
                    <input 
                      className="admin-embed-url-input"
                      value={item.url} 
                      placeholder="URL do Wordwall / Embed"
                      onChange={(e) => {
                        const next = [...unitData.embed_urls];
                        next[i] = { ...item, url: e.target.value };
                        setUnitData({ ...unitData, embed_urls: next });
                      }}
                    />
                    

                    
                    <div className="admin-embed-width-row">
                      <span>Largura do Card:</span>
                      <input 
                        type="range" min="30" max="100" step="5"
                        value={parseInt(item.width?.replace('%', '') || '100')}
                        onChange={(e) => {
                          const next = [...unitData.embed_urls];
                          next[i] = { ...item, width: e.target.value + '%' };
                          setUnitData({ ...unitData, embed_urls: next });
                        }}
                      />
                      <span className="width-label">{item.width || '100%'}</span>
                    </div>

                    <div className="admin-embed-mask-row" style={{ marginTop: '12px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer', fontSize: '13px', fontWeight: 700, color: '#475569' }}>
                        <input 
                          type="checkbox" 
                          checked={!!item.maskIcon} 
                          onChange={(e) => {
                            const next = [...unitData.embed_urls];
                            next[i] = { ...item, maskIcon: e.target.checked ? '/src/assets/memory_game.png' : undefined };
                            setUnitData({ ...unitData, embed_urls: next });
                            setIsDirty(true);
                          }}
                        />
                        <span>Usar Ícone de Mistério (Esconder conteúdo)</span>
                      </label>
                      {item.maskIcon && <img src={item.maskIcon} alt="Icon" style={{ width: '24px', height: '24px', objectFit: 'contain' }} />}
                    </div>
                  </div>
                );
              })}
            </div>
          </section>

          <section className="editor-section-card">
            <h3 className="section-title-v4">
              <Plus className="text-orange" size={20} /> Descritores BNCC
            </h3>
            <p className="field-help">Adicione os códigos das habilidades da BNCC separados por vírgula (ex: D3, D5, EF06LI01).</p>
            <input 
              type="text" 
              className="editor-input-v4"
              placeholder="Ex: D3, D5, EF06LI01..."
              value={descText}
              onChange={(e) => setDescText(e.target.value)}
            />
          </section>
          <section className="editor-section-card">
            <h3 className="section-title-v4">
              <Eye className="text-purple" size={20} /> Identidade Visual Pedagógica
            </h3>
            <p className="field-help">Selecione o tema visual com base no público-alvo da lição.</p>
            
            <div className="theme-grid-v4">
              {[
                { id: 'gamer', label: 'Turbo Gamer', target: 'High School / Adolescentes', desc: 'Estética moderna e digital' },
                { id: 'creative', label: 'Energia Criativa', target: 'Middle School / Versátil', desc: 'Equilíbrio e foco organizacional' },
                { id: 'pop', label: 'Pop Art', target: '6º e 7º anos / Crianças', desc: 'Cores saturadas e lúdicas' }
              ].map(theme => (
                <button
                  key={theme.id}
                  className={`theme-card-v4 ${unitData.color === theme.id ? 'active' : ''}`}
                  onClick={() => setUnitData({ ...unitData, color: theme.id })}
                >
                  <div className="theme-swatch-v4" style={{ 
                    background: `linear-gradient(135deg, ${COLORS[theme.id].main} 0%, ${COLORS[theme.id].dark} 100%)`,
                    borderBottom: `4px solid ${COLORS[theme.id].accent}`
                  }}>
                    <div className="accent-dot-v4" style={{ background: COLORS[theme.id].accent }}></div>
                  </div>
                  <div className="theme-info-v4">
                    <span className="theme-label-v4">{theme.label}</span>
                    <span className="theme-target-v4">{theme.target}</span>
                  </div>
                </button>
              ))}
            </div>

            <div className="color-selector-mini-v4">
              <p className="field-help">Ou selecione uma cor clássica:</p>
              <div className="mini-circles-row">
                {['emerald', 'sapphire', 'terracotta', 'amethyst', 'crimson'].map(key => (
                  <button
                    key={key}
                    className={`mini-color-btn ${unitData.color === key ? 'active' : ''}`}
                    style={{ background: COLORS[key].main }}
                    onClick={() => setUnitData({ ...unitData, color: key })}
                  />
                ))}
              </div>
            </div>
          </section>
        </div>

        {/* Vocabulary Manager Section */}
        <div className="editor-side-col">
          <section className="editor-section-card">
            <h3 className="section-title-v4">
              <BookOpen className="text-emerald" size={20} /> Banco de Palavras (Word Fall)
            </h3>
            
            <div className="vocab-input-group">
              <input 
                type="text" 
                className="vocab-input-v4"
                placeholder="Nova palavra..."
                value={newWord}
                onChange={(e) => setNewWord(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && addWord()}
              />
              <button onClick={addWord} className="vocab-add-btn-v4">
                <Plus size={24} />
              </button>
            </div>

            <div className="vocab-list-v4">
              {unitData.game_words?.length === 0 && (
                <div className="empty-mini">Nenhuma palavra cadastrada para este jogo.</div>
              )}
              {unitData.game_words?.map((word: string, i: number) => (
                <span key={i} className="vocab-tag-v4 group">
                  {word}
                  <button 
                    onClick={() => {
                      const filtered = unitData.game_words.filter((_: any, index: number) => index !== i);
                      setUnitData({ ...unitData, game_words: filtered });
                    }}
                    className="vocab-tag-remove"
                  >
                    <Trash2 size={14} />
                  </button>
                </span>
              ))}
            </div>
          </section>
        </div>
      </div>

      <div className="editor-full-row" style={{ marginTop: '32px' }}>
        <section className="editor-section-card">
          <h3 className="section-title-v4">
            <Plus className="text-purple" size={20} /> Questões Interativas (Estilo Google Forms)
          </h3>
          
          <div className="questions-editor-list">
            {(unitData.questions || []).map((q: any, idx: number) => (
              <div key={idx} className="question-edit-item">
                <div className="q-edit-header">
                  <span className="q-number">Questão {idx + 1}</span>
                  <button 
                    onClick={() => {
                      const newQs = unitData.questions.filter((_: any, i: number) => i !== idx);
                      setUnitData({ ...unitData, questions: newQs });
                      setIsDirty(true);
                    }}
                    className="q-delete-btn"
                  >
                    <Trash2 size={18} />
                  </button>
                </div>
                
                <div className="q-edit-body">
                  <div className="q-field">
                    <label>Pergunta</label>
                    <input 
                      type="text" 
                      value={q.q} 
                      onChange={(e) => {
                        const newQs = [...unitData.questions];
                        newQs[idx].q = e.target.value;
                        setUnitData({ ...unitData, questions: newQs });
                        setIsDirty(true);
                      }}
                      placeholder="Ex: Qual a tradução de Spoon?"
                    />
                  </div>

                  <div className="q-field-row">
                    <div className="q-field">
                      <label>Tipo</label>
                      <select 
                        value={q.type}
                        onChange={(e) => {
                          const newQs = [...unitData.questions];
                          newQs[idx].type = e.target.value;
                          setUnitData({ ...unitData, questions: newQs });
                          setIsDirty(true);
                        }}
                      >
                        <option value="mc">Múltipla Escolha</option>
                        <option value="text">Resposta Aberta (curta)</option>
                        <option value="paragraph">Resposta Aberta (longa)</option>
                        <option value="instruction">Somente Instrução</option>
                      </select>
                    </div>

                    <div className="q-field">
                      <label>Dica TTS (Áudio)</label>
                      <input 
                        type="text" 
                        value={q.hint || ""} 
                        onChange={(e) => {
                          const newQs = [...unitData.questions];
                          newQs[idx].hint = e.target.value;
                          setUnitData({ ...unitData, questions: newQs });
                          setIsDirty(true);
                        }}
                        placeholder="Ex: [PT]Pense na cozinha...[/PT]"
                      />
                    </div>
                  </div>

                  {q.type === 'mc' && (
                    <div className="q-field">
                      <label>Opções (separadas por vírgula)</label>
                      <input 
                        type="text" 
                        value={Array.isArray(q.opts) ? q.opts.join(', ') : ""} 
                        onChange={(e) => {
                          const newQs = [...unitData.questions];
                          newQs[idx].opts = e.target.value.split(',').map(s => s.trim());
                          setUnitData({ ...unitData, questions: newQs });
                          setIsDirty(true);
                        }}
                        placeholder="Opção 1, Opção 2, Opção 3"
                      />
                    </div>
                  )}

                  {(q.type === 'text' || q.type === 'paragraph') && (
                    <div className="q-field">
                      <label>Resposta correta / esperada (referência — não aparece para a aluna)</label>
                      <textarea
                        rows={q.type === 'paragraph' ? 4 : 2}
                        value={
                          typeof q.correctAnswer === 'string'
                            ? q.correctAnswer
                            : Array.isArray(q.correctAnswer)
                              ? q.correctAnswer.join('\n')
                              : ''
                        }
                        onChange={(e) => {
                          const newQs = [...unitData.questions];
                          const raw = e.target.value;
                          newQs[idx].correctAnswer = raw === '' ? undefined : raw;
                          setUnitData({ ...unitData, questions: newQs });
                          setIsDirty(true);
                        }}
                        placeholder="Uma resposta por linha se quiser aceitar várias formas (ex.: spoon / colher)"
                      />
                    </div>
                  )}

                  <div className="q-field">
                    <label>Guia da Mediadora (Observação)</label>
                    <textarea 
                      rows={2}
                      value={q.mediator || ""}
                      onChange={(e) => {
                        const newQs = [...unitData.questions];
                        newQs[idx].mediator = e.target.value;
                        setUnitData({ ...unitData, questions: newQs });
                        setIsDirty(true);
                      }}
                      placeholder="Ex: Peça para ela apontar para o objeto real."
                    />
                  </div>
                </div>
              </div>
            ))}
            
            <button 
              className="add-question-full-btn"
              onClick={() => {
                const newQ = { q: '', type: 'mc', opts: [''], mediator: '', hint: '' };
                const newQs = [...(unitData.questions || []), newQ];
                setUnitData({ ...unitData, questions: newQs });
                setIsDirty(true);
              }}
            >
              <Plus size={20} /> ADICIONAR NOVA QUESTÃO
            </button>
          </div>
        </section>
      </div>

      {isPreviewing && (
        <div className="preview-overlay">
          <div className="preview-modal">
            <header className="preview-header">
              <h3>Preview do Estudante</h3>
              <button onClick={() => setIsPreviewing(false)} className="close-preview-btn">
                <X size={24} />
              </button>
            </header>
            <div className="preview-content">
              <UnitCard 
                unit={unitData}
                answers={{}}
                onSaveAnswer={async () => true}
                onSaveSession={async () => true}
                isExpanded={true}
                onToggle={() => {}}
                isAdmin={false}
              />
            </div>
          </div>
        </div>
      )}

      <style>{`
        .header-right { display: flex; gap: 12px; }
        .preview-plano-btn {
          background: white;
          color: #475569;
          border: 1px solid #e2e8f0;
          padding: 16px 24px;
          border-radius: 20px;
          font-weight: 900;
          display: flex;
          align-items: center;
          gap: 12px;
        }

        .preview-overlay {
          position: fixed;
          inset: 0;
          background: rgba(0,0,0,0.5);
          backdrop-filter: blur(4px);
          z-index: 3000;
          display: flex;
          align-items: center;
          justify-content: center;
          padding: 40px;
        }
        .preview-modal {
          background: #f8fafc;
          width: 100%;
          max-width: 1400px;
          max-height: 90vh;
          border-radius: 32px;
          overflow: hidden;
          display: flex;
          flex-direction: column;
          box-shadow: 0 40px 80px -20px rgba(0,0,0,0.3);
        }
        .preview-header {
          padding: 24px 32px;
          background: white;
          border-bottom: 1px solid #e2e8f0;
          display: flex;
          justify-content: space-between;
          align-items: center;
        }
        .preview-header h3 { margin: 0; font-weight: 900; color: #1e293b; }
        .close-preview-btn { background: none; border: none; color: #94a3b8; cursor: pointer; }
        .preview-content {
          padding: 32px;
          overflow-y: auto;
          flex: 1;
        }
        .planning-editor-view {
          padding: 32px;
          background: #FDFBF7;
          min-height: 100vh;
          max-width: 1400px;
          margin: 0 auto;
        }
        .editor-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 40px;
        }
        .header-left {
          display: flex;
          align-items: center;
          gap: 20px;
        }
        .back-btn-v4 {
          background: white;
          border: 1px solid #e2e8f0;
          width: 48px;
          height: 48px;
          border-radius: 16px;
          display: flex;
          align-items: center;
          justify-content: center;
          color: #64748b;
          cursor: pointer;
        }
        .editor-title { font-size: 28px; font-weight: 900; color: #1e293b; margin: 0; }
        .editor-subtitle { color: #64748b; font-weight: 600; margin-top: 4px; }
        
        .save-plano-btn {
          background: #059669;
          color: white;
          padding: 16px 32px;
          border-radius: 20px;
          font-weight: 900;
          display: flex;
          align-items: center;
          gap: 12px;
          box-shadow: 0 10px 20px rgba(5, 150, 105, 0.2);
          border: none;
        }

        .editor-grid {
          display: grid;
          grid-template-columns: 1fr 400px;
          gap: 32px;
        }
        
        .editor-section-card {
          background: white;
          padding: 32px;
          border-radius: 32px;
          border: 1px solid #f1f5f9;
          box-shadow: 0 4px 6px -1px rgba(0,0,0,0.02);
          margin-bottom: 24px;
        }

        .section-title-v4 {
          font-size: 12px;
          font-weight: 900;
          text-transform: uppercase;
          letter-spacing: 0.1em;
          color: #64748b;
          margin-bottom: 24px;
          display: flex;
          align-items: center;
          gap: 10px;
        }

        .editor-textarea {
          width: 100%;
          border: none;
          background: #f8fafc;
          border-radius: 24px;
          padding: 24px;
          font-size: 16px;
          color: #334155;
          line-height: 1.6;
          outline: none;
          resize: none;
        }

        .vocab-input-group {
          display: flex;
          gap: 12px;
          margin-bottom: 24px;
        }
        .vocab-input-v4 {
          flex: 1;
          background: #f8fafc;
          border: none;
          border-radius: 16px;
          padding: 16px 20px;
          font-size: 15px;
          outline: none;
        }
        .vocab-add-btn-v4 {
          background: #ecfdf5;
          color: #059669;
          border: none;
          width: 54px;
          height: 54px;
          border-radius: 16px;
          display: flex;
          align-items: center;
          justify-content: center;
        }

        .vocab-list-v4 {
          display: flex;
          flex-wrap: wrap;
          gap: 10px;
        }
        .vocab-tag-v4 {
          background: white;
          border: 1px solid #f1f5f9;
          padding: 8px 16px;
          border-radius: 99px;
          font-size: 14px;
          font-weight: 800;
          color: #475569;
          display: flex;
          align-items: center;
          gap: 10px;
        }
        .vocab-tag-remove {
          border: none;
          background: none;
          color: #cbd5e1;
          cursor: pointer;
        }
        .vocab-tag-remove:hover { color: #ef4444; }

        .questions-editor-list {
          display: flex;
          flex-direction: column;
          gap: 20px;
        }

        .question-edit-item {
          background: #f8fafc;
          border-radius: 24px;
          padding: 24px;
          border: 1px solid #e2e8f0;
        }

        .q-edit-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 20px;
        }

        .q-number {
          font-weight: 900;
          color: #6366f1;
          font-size: 14px;
        }

        .q-delete-btn {
          background: #fee2e2;
          color: #ef4444;
          border: none;
          padding: 8px;
          border-radius: 12px;
          cursor: pointer;
        }

        .q-edit-body {
          display: flex;
          flex-direction: column;
          gap: 16px;
        }

        .q-field {
          display: flex;
          flex-direction: column;
          gap: 8px;
        }

        .q-field label {
          font-size: 12px;
          font-weight: 800;
          color: #94a3b8;
          text-transform: uppercase;
        }

        .q-field input, .q-field select, .q-field textarea {
          background: white;
          border: 1px solid #e2e8f0;
          border-radius: 14px;
          padding: 12px 16px;
          font-size: 14px;
          color: #1e293b;
          outline: none;
        }

        .q-field-row {
          display: grid;
          grid-template-columns: 200px 1fr;
          gap: 16px;
        }

        .add-question-full-btn {
          background: white;
          border: 2px dashed #e2e8f0;
          color: #64748b;
          padding: 20px;
          border-radius: 24px;
          font-weight: 800;
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 12px;
          cursor: pointer;
          transition: all 0.2s;
        }

        .add-question-full-btn:hover {
          border-color: #6366f1;
          color: #6366f1;
          background: #f5f3ff;
        }

        .embed-list-editor {
          display: flex;
          flex-direction: column;
          gap: 10px;
          margin-top: 16px;
        }

        .embed-item-mini {
          background: #f8fafc;
          padding: 12px 16px;
          border-radius: 12px;
          display: flex;
          justify-content: space-between;
          align-items: center;
          gap: 10px;
          border: 1px solid #e2e8f0;
        }

        .embed-url-text {
          font-size: 12px;
          color: #64748b;
          white-space: nowrap;
          overflow: hidden;
          text-overflow: ellipsis;
          flex: 1;
        }

        .embed-remove-btn {
          background: none;
          border: none;
          color: #94a3b8;
          cursor: pointer;
        }

        .embed-remove-btn:hover { color: #ef4444; }

        .field-help {
          font-size: 12px;
          color: #94a3b8;
          margin-bottom: 12px;
          font-weight: 500;
        }

        .theme-grid-v4 {
          display: grid;
          grid-template-columns: repeat(auto-fill, minmax(160px, 1fr));
          gap: 16px;
          margin-bottom: 24px;
        }

        .theme-card-v4 {
          background: white;
          border: 2px solid #e2e8f0;
          border-radius: 20px;
          padding: 8px;
          cursor: pointer;
          transition: all 0.2s;
          display: flex;
          flex-direction: column;
          gap: 8px;
          text-align: left;
        }

        .theme-card-v4:hover {
          border-color: #cbd5e1;
          transform: translateY(-2px);
        }

        .theme-card-v4.active {
          border-color: #0d9488;
          background: #f0fdfa;
          box-shadow: 0 10px 20px rgba(13, 148, 136, 0.1);
        }

        .theme-swatch-v4 {
          height: 60px;
          border-radius: 14px;
          position: relative;
          overflow: hidden;
          display: flex;
          align-items: flex-end;
          padding: 8px;
        }

        .accent-dot-v4 {
          width: 16px;
          height: 16px;
          border-radius: 50%;
          border: 2px solid white;
        }

        .theme-info-v4 {
          padding: 4px;
          display: flex;
          flex-direction: column;
        }

        .theme-label-v4 {
          font-weight: 800;
          font-size: 13px;
          color: #1e293b;
        }

        .theme-target-v4 {
          font-size: 10px;
          color: #64748b;
          font-weight: 600;
        }

        .color-selector-mini-v4 {
          padding-top: 16px;
          border-top: 1px dashed #e2e8f0;
        }

        .mini-circles-row {
          display: flex;
          gap: 10px;
          margin-top: 8px;
        }

        .section-header-v4 {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 24px;
        }

        .smart-badge-v4 {
          background: #f0fdfa;
          color: #0d9488;
          font-size: 11px;
          font-weight: 900;
          padding: 6px 12px;
          border-radius: 99px;
          border: 1px solid #ccfbf1;
        }

        .editor-textarea-premium {
          width: 100%;
          border: 2px solid #f1f5f9;
          background: #fff;
          border-radius: 24px;
          padding: 24px;
          font-size: 16px;
          color: #1e293b;
          line-height: 1.6;
          outline: none;
          resize: vertical;
          transition: all 0.3s ease;
          box-shadow: inset 0 2px 4px rgba(0,0,0,0.02);
        }

        .editor-textarea-premium:focus {
          border-color: #5b7cff;
          box-shadow: 0 0 0 4px rgba(91, 124, 255, 0.1);
        }

        .media-input-bar {
          display: flex;
          gap: 12px;
        }

        .media-add-btn-v4 {
          background: #1e293b;
          color: white;
          border: none;
          padding: 0 24px;
          border-radius: 16px;
          font-weight: 800;
          display: flex;
          align-items: center;
          gap: 10px;
          cursor: pointer;
        }

        .media-item-card-v4 {
          background: white;
          border: 1px solid #e2e8f0;
          padding: 12px;
          border-radius: 16px;
          display: flex;
          align-items: center;
          gap: 16px;
          transition: all 0.2s;
        }

        .media-item-card-v4:hover {
          border-color: #cbd5e1;
          box-shadow: 0 4px 12px rgba(0,0,0,0.03);
        }

        .media-preview-mini {
          width: 44px;
          height: 44px;
          background: #f1f5f9;
          border-radius: 10px;
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 20px;
        }

        .media-info-mini {
          flex: 1;
          display: flex;
          flex-direction: column;
          gap: 4px;
          overflow: hidden;
        }

        .media-type-tag {
          font-size: 9px;
          text-transform: uppercase;
          font-weight: 900;
          color: white;
          padding: 2px 8px;
          border-radius: 4px;
          width: fit-content;
        }

        .media-url-mini {
          font-size: 13px;
          color: #64748b;
          white-space: nowrap;
          overflow: hidden;
          text-overflow: ellipsis;
        }

        .media-delete-btn {
          background: #fff1f2;
          color: #e11d48;
          border: none;
          padding: 10px;
          border-radius: 10px;
          cursor: pointer;
          transition: all 0.2s;
        }

        .media-delete-btn:hover {
          background: #ffe4e6;
        }

        .empty-media-placeholder {
          padding: 32px;
          border: 2px dashed #e2e8f0;
          border-radius: 16px;
          text-align: center;
          color: #94a3b8;
          font-size: 14px;
          font-weight: 600;
        }

        .mini-color-btn:hover {
          transform: scale(1.2);
        }

        .mini-color-btn.active {
          box-shadow: 0 0 0 2px #0d9488;
        }

        .embed-input-group {
          display: flex;
          gap: 12px;
          margin-bottom: 16px;
        }

        .editor-input-v4 {
          flex: 1;
          background: #f8fafc;
          border: 2px solid #e2e8f0;
          border-radius: 14px;
          padding: 12px 16px;
          font-size: 14px;
          color: #1e293b;
          outline: none;
          transition: all 0.2s;
        }

        .editor-input-v4:focus {
          border-color: #0d9488;
          background: white;
        }

        .embed-add-btn-v4 {
          padding: 0 20px;
          background: #0d9488;
          color: white;
          border: none;
          border-radius: 14px;
          font-weight: 700;
          font-size: 14px;
          display: flex;
          align-items: center;
          gap: 8px;
          cursor: pointer;
        }

        .embed-add-btn-v4:disabled {
          opacity: 0.7;
          cursor: not-allowed;
        }

        .embed-add-btn-v4.saved {
          background: #059669;
        }

        .embed-list-v4 {
          display: flex;
          flex-direction: column;
          gap: 10px;
        }

        .admin-embed-edit-card-v5 {
          background: #f8fafc;
          border: 1px solid #e2e8f0;
          border-radius: 12px;
          padding: 16px;
          margin-bottom: 12px;
          display: flex;
          flex-direction: column;
          gap: 12px;
        }

        .admin-embed-main-row {
          display: flex;
          justify-content: space-between;
          align-items: center;
          gap: 10px;
        }

        .admin-embed-title-input {
          flex: 1;
          padding: 8px 12px;
          border: 1.5px solid #cbd5e1;
          border-radius: 8px;
          font-size: 14px;
          font-weight: 700;
          outline: none;
        }

        .admin-embed-url-input {
          width: 100%;
          padding: 8px 12px;
          border: 1.5px solid #cbd5e1;
          border-radius: 8px;
          font-size: 13px;
          color: #64748b;
          outline: none;
        }

        .admin-embed-width-row {
          display: flex;
          align-items: center;
          gap: 12px;
          font-size: 12px;
          font-weight: 600;
          color: #64748b;
        }

        .admin-embed-width-row input[type="range"] {
          flex: 1;
        }

        .width-label {
          min-width: 40px;
          text-align: right;
          font-weight: 800;
          color: #1e293b;
        }

        .admin-item-del {
          background: #fee2e2;
          border: none;
          color: #ef4444;
          width: 32px;
          height: 32px;
          border-radius: 8px;
          display: flex;
          align-items: center;
          justify-content: center;
          cursor: pointer;
          transition: all 0.2s;
        }

        .admin-item-del:hover {
          background: #ef4444;
          color: white;
        }
        .link-list-v4 {
          display: flex;
          flex-direction: column;
          gap: 12px;
        }

        .link-editor-item-v4 {
          display: flex;
          gap: 8px;
          align-items: center;
        }

        .link-label-input {
          width: 120px;
          background: #f1f5f9;
          border: 1px solid #e2e8f0;
          border-radius: 8px;
          padding: 8px;
          font-size: 12px;
          font-weight: 700;
          color: #1e293b;
        }

        .link-url-input {
          flex: 1;
          background: #f1f5f9;
          border: 1px solid #e2e8f0;
          border-radius: 8px;
          padding: 8px;
          font-size: 12px;
          color: #64748b;
        }

        .add-link-btn-v4 {
          background: white;
          border: 1.5px dashed #cbd5e1;
          color: #64748b;
          padding: 10px;
          border-radius: 10px;
          font-size: 12px;
          font-weight: 700;
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 6px;
          cursor: pointer;
          transition: all 0.2s;
        }

        .add-link-btn-v4:hover {
          border-color: #f97316;
          color: #f97316;
          background: #fff7ed;
        }
      `}</style>
    </div>
  );
};

export default PlanningEditor;
