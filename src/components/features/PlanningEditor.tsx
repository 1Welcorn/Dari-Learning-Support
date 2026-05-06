import React, { useState, useEffect, useRef, useMemo } from 'react';
import { supabase } from '../../services/supabase';
import { Save, Plus, Trash2, BookOpen, Target, Lightbulb, ChevronLeft, Eye, X, Globe, Lock, Unlock, Bold, Italic, Palette, Eraser, AlignLeft, AlignCenter, AlignRight, AlignJustify, List, Type, Monitor, Image as ImageIcon, Zap, AlertTriangle, Smartphone, Clock, Check, Sparkles, ChefHat, Headphones, User, Building2, GraduationCap, ClipboardList } from 'lucide-react';
import { UnitCard, VideoPlayerV5 } from './Activities';
import { COLORS } from '../../constants';

// --- RICH TEXT EDITOR ---
const RichTextEditor: React.FC<{ value: string; onChange: (val: string) => void; height?: string; placeholder?: string }> = ({ value, onChange, height = '350px', placeholder }) => {
  const editorRef = useRef<HTMLDivElement>(null);
  
  useEffect(() => { 
    if (editorRef.current && editorRef.current.innerHTML !== value) { 
      editorRef.current.innerHTML = value || ''; 
    } 
  }, [value]);

  const exec = (cmd: string, val?: string) => { 
    document.execCommand(cmd, false, val); 
    if (editorRef.current) { 
      onChange(editorRef.current.innerHTML); 
    } 
  };

  const btnStyle = { 
    padding: '6px 10px', 
    borderRadius: '8px', 
    border: '1px solid #e2e8f0', 
    background: 'white', 
    cursor: 'pointer',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    fontSize: '12px',
    fontWeight: 900,
    color: '#64748b',
    transition: 'all 0.2s'
  };

  return (
    <div className="rich-editor-container" style={{ display: 'flex', flexDirection: 'column', height: height, border: '1px solid #e2e8f0', borderRadius: '24px', overflow: 'hidden', background: '#fff', boxShadow: '0 4px 12px rgba(0,0,0,0.03)' }}>
      <div className="rich-editor-toolbar" style={{ padding: '8px', borderBottom: '1px solid #e2e8f0', display: 'flex', flexWrap: 'wrap', gap: '6px', background: '#f8fafc' }}>
        <button onClick={() => exec('formatBlock', '<h1>')} style={btnStyle}>H1</button>
        <button onClick={() => exec('formatBlock', '<h2>')} style={btnStyle}>H2</button>
        <button onClick={() => exec('bold')} style={btnStyle} title="Negrito"><Bold size={14} /></button>
        <button onClick={() => exec('italic')} style={btnStyle} title="Itálico"><Italic size={14} /></button>
        <div style={{ width: '1px', background: '#e2e8f0', margin: '0 4px' }} />
        <button onClick={() => exec('justifyLeft')} style={btnStyle} title="Alinhar à Esquerda"><AlignLeft size={14} /></button>
        <button onClick={() => exec('justifyCenter')} style={btnStyle} title="Centralizar"><AlignCenter size={14} /></button>
        <button onClick={() => exec('justifyRight')} style={btnStyle} title="Alinhar à Direita"><AlignRight size={14} /></button>
        <button onClick={() => exec('justifyFull')} style={btnStyle} title="Justificar"><AlignJustify size={14} /></button>
        <div style={{ width: '1px', background: '#e2e8f0', margin: '0 4px' }} />
        <button onClick={() => exec('insertUnorderedList')} style={btnStyle} title="Lista"><List size={14} /></button>
        <button onClick={() => exec('foreColor', '#3b82f6')} style={{ ...btnStyle, color: '#3b82f6' }} title="Cor Azul"><Palette size={14} /></button>
        <button onClick={() => exec('removeFormat')} style={{ ...btnStyle, color: '#ef4444' }} title="Limpar Formatação"><Eraser size={14} /></button>
      </div>
      <div 
        ref={editorRef} 
        className="rich-editor-content" 
        contentEditable 
        onInput={(e) => onChange(e.currentTarget.innerHTML)} 
        style={{ 
          flex: 1, 
          padding: '20px', 
          background: 'white', 
          outline: 'none', 
          overflowY: 'auto', 
          fontSize: '15px', 
          lineHeight: '1.6',
          color: '#1e293b'
        }} 
      />
    </div>
  );
};

const INTERNAL_ASSETS = [
  { name: 'Projeto Logo', path: 'src/assets/imagem do projeto.png' },
  { name: 'Tulip Icon', path: 'src/assets/tulip icon.png' },
  { name: 'Robot 3D', path: 'src/assets/robot-3d.png' },
  { name: 'Pan 3D', path: 'src/assets/pan-3d.png' },
  { name: 'Help Button', path: 'src/assets/help-button.png' },
  { name: 'Memory Game', path: 'src/assets/memory_game.png' },
  { name: 'Word Game', path: 'src/assets/word_game.png' }
];

const AssetPicker: React.FC<{ onSelect: (path: string) => void; onClose: () => void }> = ({ onSelect, onClose }) => (
  <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', zIndex: 1000, display: 'flex', alignItems: 'center', justifyCenter: 'center', padding: '20px' }}>
    <div style={{ background: 'white', borderRadius: '30px', padding: '30px', maxWidth: '600px', width: '100%', maxHeight: '80vh', overflowY: 'auto' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '20px' }}>
        <h3 style={{ margin: 0, fontWeight: 900 }}>Galeria do Repositório</h3>
        <button onClick={onClose} style={{ background: 'none', border: 'none' }}><X /></button>
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(120px, 1fr))', gap: '15px' }}>
        {INTERNAL_ASSETS.map(asset => (
          <button key={asset.path} onClick={() => onSelect(`/${asset.path}`)} style={{ background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: '15px', padding: '10px', display: 'flex', flexDirection: 'column', gap: '8px', alignItems: 'center' }}>
            <img src={`/${asset.path}`} style={{ width: '60px', height: '60px', objectFit: 'contain' }} alt={asset.name} />
            <span style={{ fontSize: '10px', fontWeight: 900, textAlign: 'center' }}>{asset.name}</span>
          </button>
        ))}
      </div>
    </div>
  </div>
);
 
 const StylingControls: React.FC<{ 
   item: any; 
   onChange: (updates: any) => void;
   label?: string;
 }> = ({ item, onChange, label = "CONFIGURAÇÕES DE APARÊNCIA" }) => (
   <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
     <label style={{ fontSize: '11px', fontWeight: 900, color: '#64748b', letterSpacing: '1px' }}>{label}</label>
     <div style={{ background: '#f8fafc', padding: '15px', borderRadius: '20px', border: '1px solid #e2e8f0' }}>
       <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
         
         <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '10px', fontWeight: 900 }}><span>LARGURA: {item.width || '100%'}</span></div>
         <input type="range" min="30" max="100" value={parseInt((item.width || '100%').replace(/[^0-9]/g, ''))} style={{ width: '100%' }} onChange={(e) => onChange({ width: `${e.target.value}%` })} />
         
         <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '10px', fontWeight: 900 }}><span>ALTURA: {item.height || 600}px</span></div>
         <input type="range" min="300" max="1200" step="10" value={item.height || 600} style={{ width: '100%' }} onChange={(e) => onChange({ height: parseInt(e.target.value) })} />
 
         <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '10px', fontWeight: 900 }}><span>CANTOS DO FRAME: {item.borderRadius !== undefined ? item.borderRadius : 40}px</span></div>
         <input type="range" min="0" max="100" step="1" value={item.borderRadius !== undefined ? item.borderRadius : 40} style={{ width: '100%' }} onChange={(e) => onChange({ borderRadius: parseInt(e.target.value) })} />
 
         <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '10px', fontWeight: 900 }}><span>CANTOS DO PLAYER: {item.playerBorderRadius !== undefined ? item.playerBorderRadius : (item.borderRadius !== undefined ? item.borderRadius : 40)}px</span></div>
         <input type="range" min="0" max="100" step="1" value={item.playerBorderRadius !== undefined ? item.playerBorderRadius : (item.borderRadius !== undefined ? item.borderRadius : 40)} style={{ width: '100%' }} onChange={(e) => onChange({ playerBorderRadius: parseInt(e.target.value) })} />
 
         <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '10px', fontWeight: 900 }}><span>ZOOM DA IMAGEM/VÍDEO: {item.scale || 1}x</span></div>
         <input type="range" min="0.5" max="3" step="0.1" value={item.scale || 1} style={{ width: '100%' }} onChange={(e) => onChange({ scale: parseFloat(e.target.value) })} />
 
         <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '10px', fontWeight: 900 }}><span>ESPESSURA DO FRAME: {item.framePadding || '0px'}</span></div>
         <input type="range" min="0" max="60" step="1" value={parseInt(item.framePadding || '0')} style={{ width: '100%' }} onChange={(e) => onChange({ framePadding: `${e.target.value}px` })} />
 
         <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '10px', fontWeight: 900 }}><span>COR DO FRAME:</span></div>
         <select value={item.frameColor || ''} style={{ fontSize: '11px', width: '100%', padding: '8px', borderRadius: '10px', border: '1px solid #e2e8f0' }} onChange={(e) => onChange({ frameColor: e.target.value })}>
           <option value="">Padrão (Branco)</option>
           <option value="transparent">Transparente</option>
           <option value="white">Branco Puro</option>
           <option value="#f8fafc">Cinza Azulado</option>
           <option value="#fef3c7">Bege Pastel</option>
           <option value="#3b82f6">Azul Vibrante</option>
           <option value="#10b981">Verde Dari</option>
           <option value="#000000">Preto Profundo</option>
         </select>
       </div>
     </div>
   </div>
 );
 
 const MiniActivityPreview: React.FC<{ item: any; unitColor: string }> = ({ item, unitColor }) => (
   <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', alignItems: 'center', width: '100%' }}>
     <span style={{ fontSize: '10px', fontWeight: 900, color: '#94a3b8' }}>LIVE SIMULATOR (VISTA DO ALUNO)</span>
     <div style={{ 
       width: '100%', 
       background: '#f1f5f9', 
       borderRadius: '25px', 
       padding: '20px', 
       display: 'flex', 
       justifyContent: 'center', 
       minHeight: '250px',
       overflow: 'hidden',
       border: '1px solid #e2e8f0'
     }}>
       <div style={{ 
         width: item.width || '100%', 
         maxWidth: '100%',
         background: item.frameColor || 'white', 
         borderRadius: `${item.borderRadius !== undefined ? item.borderRadius / 2 : 20}px`,
         padding: `${parseInt(item.framePadding || '0') / 2}px 15px 15px`,
         boxShadow: item.frameColor === 'transparent' ? 'none' : '0 10px 30px rgba(0,0,0,0.05)',
         display: 'flex',
         gap: '10px',
         minHeight: item.height ? `${item.height / 2.5}px` : '180px',
         height: 'fit-content'
       }}>
         <div style={{ flex: 1 }}>
           <div style={{ fontSize: '8px', color: unitColor, fontWeight: 900 }}>ATIVIDADE</div>
           <div style={{ fontSize: '10px', fontWeight: 900, marginTop: '2px' }} dangerouslySetInnerHTML={{ __html: item.title || 'Título' }} />
           <div style={{ fontSize: '8px', color: '#64748b', marginTop: '4px' }}>Instruções pedagógicas aparecem aqui...</div>
         </div>
         <div style={{ 
           width: '100px', 
           height: '80px', 
           background: '#f8fafc', 
           borderRadius: `${item.playerBorderRadius !== undefined ? item.playerBorderRadius / 2 : 15}px`,
           border: '1px solid rgba(0,0,0,0.05)',
           display: 'flex',
           alignItems: 'center',
           justifyContent: 'center',
           overflow: 'hidden',
           transform: `scale(${item.scale || 1})`
         }}>
           <div style={{ width: '40px', height: '40px', borderRadius: '50%', background: '#fff', border: '2px solid #e2e8f0' }} />
         </div>
       </div>
     </div>
   </div>
 );
 
 const MiniQuestionPreview: React.FC<{ item: any; unitColor: string }> = ({ item, unitColor }) => (
   <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', alignItems: 'center', width: '100%' }}>
     <span style={{ fontSize: '10px', fontWeight: 900, color: '#94a3b8' }}>LIVE SIMULATOR (VISTA DO ALUNO)</span>
     <div style={{ 
       width: '100%', 
       background: '#f1f5f9', 
       borderRadius: '25px', 
       padding: '20px', 
       display: 'flex', 
       justifyContent: 'center', 
       minHeight: '200px',
       overflow: 'hidden',
       border: '1px solid #e2e8f0'
     }}>
       <div style={{ 
         width: item.width || '100%', 
         maxWidth: '100%',
         background: item.frameColor || 'white', 
         borderRadius: `${item.borderRadius !== undefined ? item.borderRadius / 2 : 20}px`,
         padding: `${parseInt(item.framePadding || '0') / 2}px 20px 20px`,
         boxShadow: item.frameColor === 'transparent' ? 'none' : '0 10px 30px rgba(0,0,0,0.05)',
         display: 'flex',
         flexDirection: 'column',
         gap: '10px',
         minHeight: item.height ? `${item.height / 2.5}px` : '150px',
         height: 'fit-content'
       }}>
         <div style={{ fontSize: '8px', color: '#7c3aed', fontWeight: 900 }}>QUESTÃO 1</div>
         <div style={{ fontSize: '10px', fontWeight: 900 }} dangerouslySetInnerHTML={{ __html: item.q || 'Pergunta?' }} />
         <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
            {(item.options || ['Opção 1']).map((o: any, idx: number) => (
              <div key={idx} style={{ padding: '6px', borderRadius: '8px', border: '1px solid #e2e8f0', fontSize: '8px' }}>{o}</div>
            ))}
         </div>
       </div>
     </div>
   </div>
 );

interface PlanningEditorProps {
  unitId: string;
  onBack: () => void;
  updateUnit: (id: string, updates: any) => Promise<{ success: boolean; error?: string }>;
  units: any[];
}

const normalizeEmbedUrl = (rawUrl: string): string => {
  let trimmed = rawUrl.trim();
  if (!trimmed) return '';
  
  // Se for código de iframe completo, extrai apenas o SRC
  if (trimmed.startsWith('<iframe')) {
    const srcMatch = trimmed.match(/src=["'](.*?)["']/);
    if (srcMatch && srcMatch[1]) trimmed = srcMatch[1];
  }

  const withProtocol = /^https?:\/\//i.test(trimmed) ? trimmed : `https://${trimmed}`;
  
  try {
    const url = new URL(withProtocol);
    
    // WORDWALL: Converte /resource/ para /embed/resource/
    if (url.hostname.includes('wordwall.net')) {
      if (url.pathname.includes('/resource/') && !url.pathname.includes('/embed/')) {
        url.pathname = url.pathname.replace('/resource/', '/embed/resource/');
      }
      return url.toString();
    }

    // YOUTUBE
    if (url.hostname.includes('youtube.com') && url.pathname === '/watch') {
      const videoId = url.searchParams.get('v');
      if (videoId) return `https://www.youtube.com/embed/${videoId}`;
    }
    if (url.hostname.includes('youtu.be')) {
      const videoId = url.pathname.replace('/', '');
      if (videoId) return `https://www.youtube.com/embed/${videoId}`;
    }

    // CANVA: Tenta converter links de visualização para embed
    if (url.hostname.includes('canva.com') && url.pathname.includes('/view')) {
      url.pathname = url.pathname.replace('/view', '/view?embed');
      return url.toString();
    }

    // GOOGLE DRIVE
    if (url.hostname.includes('drive.google.com')) {
      url.pathname = url.pathname.replace(/\/view$/, '/preview');
      return url.toString();
    }

    return url.toString();
  } catch {
    return trimmed;
  }
};

const PlanningEditor: React.FC<PlanningEditorProps> = ({ unitId, onBack, updateUnit, units }) => {
  const [loading, setLoading] = useState(false);
  const unitDataFromProps = useMemo(() => units.find(u => u.id === unitId), [units, unitId]);
  
  const [unitData, setUnitData] = useState<any>(null);
  const [newWord, setNewWord] = useState("");
  const [descText, setDescText] = useState("");
  const [tempEmbed, setTempEmbed] = useState("");
  const [isSavingEmbed, setIsSavingEmbed] = useState(false);
  const [isDirty, setIsDirty] = useState(false);
  const [autoSavePulse, setAutoSavePulse] = useState(false);
  const [showAssetPicker, setShowAssetPicker] = useState<{ active: boolean; callback: (path: string) => void }>({ active: false, callback: () => {} });
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [activeUploadCallback, setActiveUploadCallback] = useState<(url: string) => void>(() => () => {});

  const triggerUpload = (callback: (url: string) => void) => {
    setActiveUploadCallback(() => callback);
    fileInputRef.current?.click();
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    
    setLoading(true);
    try {
      const fileExt = file.name.split('.').pop();
      const fileName = `${Date.now()}-${Math.random().toString(36).substring(7)}.${fileExt}`;
      const filePath = `uploads/${fileName}`;

      const { data, error } = await supabase.storage
        .from('media')
        .upload(filePath, file);

      if (error) throw error;

      const { data: { publicUrl } } = supabase.storage
        .from('media')
        .getPublicUrl(filePath);

      activeUploadCallback(publicUrl);
      setIsDirty(true);
    } catch (err: any) {
      console.error('Upload error:', err);
      if (err.message === 'Bucket not found') {
        alert('Erro no upload: O "bucket" chamado "media" não foi encontrado no seu Supabase.\n\nPara corrigir:\n1. Vá ao painel do Supabase -> Storage\n2. Crie um novo bucket chamado: media\n3. Marque como "Public bucket"');
      } else {
        alert('Erro no upload: ' + (err.message || 'Erro desconhecido'));
      }
    } finally {
      setLoading(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  // Sincroniza o estado local quando os dados globais mudam
  useEffect(() => {
    if (unitDataFromProps) {
      if (!unitData || !isDirty) {
        setUnitData(JSON.parse(JSON.stringify(unitDataFromProps)));
        setDescText(unitDataFromProps.descriptors?.join(', ') || '');
      }
    }
  }, [unitDataFromProps, isDirty]);

  const handleSave = async (overrideData?: any) => {
    const dataToSave = overrideData || unitData;
    if (!dataToSave) return;
    try {
      const descs = descText.split(',').map((v: string) => v.trim()).filter(Boolean);
      // Remove ID from updates to avoid Supabase conflicts
      const { id, ...updatesOnly } = dataToSave;
      const finalUpdates = JSON.parse(JSON.stringify({ ...updatesOnly, descriptors: descs }));
      
      const result = await updateUnit(unitId, finalUpdates);
      if (result.success) {
        setIsDirty(false);
        setAutoSavePulse(true);
        setTimeout(() => setAutoSavePulse(false), 2000);
      } else {
         alert('Erro ao salvar: ' + result.error);
      }
    } catch (err: any) { alert('Erro crítico ao salvar: ' + err.message); }
  };

  const addWord = () => {
    if (!newWord.trim()) return;
    const parts = newWord.split('/').map(p => p.trim());
    const wordObj = { en: parts[0], pt: parts[1] || parts[0], dari: parts[2] || undefined, icon: '🏷️' };
    const nextData = { ...unitData, vocabulary_list: [...(unitData.vocabulary_list || []), wordObj] };
    setUnitData(nextData);
    setNewWord("");
    setIsDirty(true);
  };

  const saveEmbedLink = async () => {
    if (!tempEmbed.trim() || isSavingEmbed) return;
    setIsSavingEmbed(true);
    const normalized = normalizeEmbedUrl(tempEmbed);
    const nextEmbeds = [...(unitData.embed_urls || []), { url: normalized, title: `Atividade`, width: '100%' }];
    const nextData = { ...unitData, embed_urls: nextEmbeds };
    
    // Atualiza localmente e tenta salvar no banco imediatamente
    setUnitData(nextData);
    setTempEmbed("");
    setIsSavingEmbed(false);
    setIsDirty(true);
    
    // Auto-save para evitar perda de links
    handleSave(nextData);
  };

  if (loading) return <div className="screen-loading"><div className="loader-spinner"></div><p>Carregando...</p></div>;
  if (!unitData) return <div className="screen-error"><h2>Sincronizando...</h2></div>;

  return (
    <div className="planning-editor-view" style={{ background: '#f8fafc', minHeight: '100vh', paddingBottom: '150px' }}>
      
      {/* HEADER FIXO */}
      <header className="editor-header" style={{ background: 'white', padding: '15px 30px', borderBottom: '1px solid #e2e8f0', display: 'flex', justifyContent: 'space-between', alignItems: 'center', position: 'sticky', top: 0, zIndex: 100, boxShadow: '0 4px 12px rgba(0,0,0,0.05)' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '20px' }}>
          <button onClick={onBack} style={{ background: '#f1f5f9', border: 'none', padding: '10px', borderRadius: '14px' }}><ChevronLeft size={24} /></button>
          <div>
            <h1 style={{ fontSize: '18px', fontWeight: 900, margin: 0 }}>Gerenciador Maestro Full</h1>
            <p style={{ fontSize: '12px', color: '#64748b', margin: 0 }}>Aula: {unitData.title}</p>
          </div>
        </div>
        <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
          {autoSavePulse && <span style={{ color: '#10b981', fontSize: '11px', fontWeight: 900, animation: 'pulse 1s infinite' }}>SALVO COM SUCESSO ✓</span>}
          <button onClick={() => handleSave()} style={{ background: isDirty ? '#f59e0b' : '#10b981', color: 'white', border: 'none', padding: '12px 30px', borderRadius: '14px', fontWeight: 900, display: 'flex', alignItems: 'center', gap: '10px', boxShadow: '0 10px 20px rgba(0,0,0,0.1)' }}>
            <Save size={18} /> {isDirty ? 'GRAVAR TUDO AGORA' : 'SISTEMA EM DIA'}
          </button>
        </div>
      </header>

      <div style={{ display: 'flex', flexDirection: 'column', gap: '30px', padding: '30px', maxWidth: '1400px', margin: '0 auto' }}>
        
        {/* SECTION 0: IDENTIFICAÇÃO DA AULA */}
        <section style={{ background: 'white', borderRadius: '30px', padding: '30px', boxShadow: '0 10px 40px rgba(0,0,0,0.05)' }}>
           <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '20px' }}>
              <div style={{ background: '#6366f1', color: 'white', padding: '10px', borderRadius: '14px' }}><Type size={24} /></div>
              <h3 style={{ margin: 0, fontWeight: 900 }}>Dados Gerais da Unidade</h3>
           </div>
           <div style={{ display: 'grid', gridTemplateColumns: '1fr 1.2fr', gap: '30px' }}>
              <div>
                <label style={{ fontSize: '11px', fontWeight: 900, color: '#64748b', display: 'block', marginBottom: '8px' }}>TÍTULO DA AULA (PRINCIPAL)</label>
                <RichTextEditor height="120px" value={unitData.title || ''} onChange={(val) => { setUnitData({...unitData, title: val}); setIsDirty(true); }} />
              </div>
              <div>
                <label style={{ fontSize: '11px', fontWeight: 900, color: '#64748b', display: 'block', marginBottom: '8px' }}>SUBTÍTULO / DESCRIÇÃO RÁPIDA</label>
                <RichTextEditor height="120px" value={unitData.sub || ''} onChange={(val) => { setUnitData({...unitData, sub: val}); setIsDirty(true); }} />
              </div>
           </div>
        </section>

        {/* SECTION 1: MAESTRO INTRO & MEDIA */}
        <section style={{ background: 'white', borderRadius: '30px', padding: '30px', boxShadow: '0 10px 40px rgba(0,0,0,0.05)' }}>
           <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '20px' }}>
              <div style={{ background: '#3b82f6', color: 'white', padding: '10px', borderRadius: '14px' }}><BookOpen size={24} /></div>
              <h3 style={{ margin: 0, fontWeight: 900 }}>1. Guia de Estudo & Mídias Maestro</h3>
           </div>
           <div style={{ display: 'grid', gridTemplateColumns: '1fr 340px 1fr', gap: '25px' }}>
              <div>
                 <label style={{ fontSize: '11px', fontWeight: 900, color: '#64748b' }}>TEXTO DE INTRODUÇÃO</label>
                 <RichTextEditor value={unitData.brief || ""} onChange={(val) => { setUnitData({...unitData, brief: val}); setIsDirty(true); }} />
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', maxHeight: '500px', overflowY: 'auto', paddingRight: '10px' }}>
                 <label style={{ fontSize: '11px', fontWeight: 900, color: '#64748b' }}>CONFIGURAÇÕES DE MÍDIA</label>
                 <button onClick={() => { setUnitData({...unitData, external_links: [...(unitData.external_links || []), { label: 'video', url: '', width: '600px', height: 300, objectFit: 'cover' }]}); setIsDirty(true); }} style={{ background: '#3b82f6', color: 'white', border: 'none', padding: '12px', borderRadius: '12px', fontWeight: 900 }}>+ ADICIONAR MÍDIA</button>
                 
                  {(unitData.external_links || []).map((link: any, i: number) => (
                    <div key={i} style={{ background: '#f8fafc', padding: '15px', borderRadius: '20px', border: '1px solid #e2e8f0' }}>
                       <div style={{ display: 'flex', gap: '8px', marginBottom: '10px' }}>
                          <input type="text" value={link.url} placeholder="URL do Vídeo/Imagem..." style={{ flex: 1, padding: '10px', borderRadius: '10px' }} onChange={(e) => { const nl = [...unitData.external_links]; nl[i].url = e.target.value; setUnitData({...unitData, external_links: nl}); setIsDirty(true); }} />
                          <button onClick={() => triggerUpload((url) => { const nl = [...unitData.external_links]; nl[i].url = url; setUnitData({...unitData, external_links: nl}); })} style={{ background: '#fff', border: '1px solid #e2e8f0', borderRadius: '10px', padding: '8px' }} title="Upload Local"><ImageIcon size={16} /></button>
                          <button onClick={() => setShowAssetPicker({ active: true, callback: (path) => { const nl = [...unitData.external_links]; nl[i].url = path; setUnitData({...unitData, external_links: nl}); setIsDirty(true); setShowAssetPicker({ active: false, callback: () => {} }); } })} style={{ background: '#fff', border: '1px solid #e2e8f0', borderRadius: '10px', padding: '8px' }} title="Galeria do App"><Globe size={16} /></button>
                       </div>
                       
                       <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '10px', fontWeight: 900 }}><span>LARGURA: {link.width || '600px'}</span></div>
                          <input type="range" min="200" max="1200" step="10" value={parseInt(String(link.width || '600').replace(/[^0-9]/g, '')) > 100 ? parseInt(String(link.width || '600').replace(/[^0-9]/g, '')) : 600} style={{ width: '100%' }} onChange={(e) => { const nl = [...unitData.external_links]; nl[i].width = `${e.target.value}px`; setUnitData({...unitData, external_links: nl}); setIsDirty(true); }} />
                          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '10px', fontWeight: 900 }}><span>ALTURA: {link.height || 300}px</span></div>
                          <input type="range" min="50" max="600" value={link.height || 300} style={{ width: '100%' }} onChange={(e) => { const nl = [...unitData.external_links]; nl[i].height = parseInt(e.target.value); setUnitData({...unitData, external_links: nl}); setIsDirty(true); }} />
                          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '10px', fontWeight: 900 }}><span>CANTOS DO FRAME: {link.borderRadius !== undefined ? link.borderRadius : 20}px</span></div>
                          <input type="range" min="0" max="100" step="1" value={link.borderRadius !== undefined ? link.borderRadius : 20} style={{ width: '100%' }} onChange={(e) => { const nl = [...unitData.external_links]; nl[i].borderRadius = parseInt(e.target.value); setUnitData({...unitData, external_links: nl}); setIsDirty(true); }} />
                          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '10px', fontWeight: 900 }}><span>CANTOS DO PLAYER: {link.playerBorderRadius !== undefined ? link.playerBorderRadius : (link.borderRadius !== undefined ? link.borderRadius : 20)}px</span></div>
                          <input type="range" min="0" max="100" step="1" value={link.playerBorderRadius !== undefined ? link.playerBorderRadius : (link.borderRadius !== undefined ? link.borderRadius : 20)} style={{ width: '100%' }} onChange={(e) => { const nl = [...unitData.external_links]; nl[i].playerBorderRadius = parseInt(e.target.value); setUnitData({...unitData, external_links: nl}); setIsDirty(true); }} />
                          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '10px', fontWeight: 900 }}><span>ZOOM DA IMAGEM/VÍDEO: {link.scale || 1}x</span></div>
                          <input type="range" min="0.5" max="3" step="0.1" value={link.scale || 1} style={{ width: '100%' }} onChange={(e) => { const nl = [...unitData.external_links]; nl[i].scale = parseFloat(e.target.value); setUnitData({...unitData, external_links: nl}); setIsDirty(true); }} />
                          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '10px', fontWeight: 900 }}><span>ESPESSURA DO FRAME: {link.framePadding || '0px'}</span></div>
                          <input type="range" min="0" max="50" step="1" value={parseInt(link.framePadding || '0')} style={{ width: '100%' }} onChange={(e) => { const nl = [...unitData.external_links]; nl[i].framePadding = `${e.target.value}px`; setUnitData({...unitData, external_links: nl}); setIsDirty(true); }} />
                          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '10px', fontWeight: 900 }}><span>COR DO FRAME:</span></div>
                          <select value={link.frameColor || ''} style={{ fontSize: '10px', width: '100%', padding: '5px', borderRadius: '5px', marginBottom: '5px' }} onChange={(e) => { const nl = [...unitData.external_links]; nl[i].frameColor = e.target.value; setUnitData({...unitData, external_links: nl}); setIsDirty(true); }}>
                             <option value="">Padrão (Preto/Transp.)</option>
                             <option value="transparent">Transparente (Vazio)</option>
                             <option value="white">Branco</option>
                             <option value="#fef3c7">Bege</option>
                             <option value="#000000">Preto</option>
                             <option value="#fbbf24">Amarelo</option>
                             <option value="#3b82f6">Azul</option>
                           </select>
                           <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '10px', fontWeight: 900 }}><span>DELAY DE INÍCIO: {link.delay || 0}s</span></div>
                           <input type="range" min="0" max="15" step="0.5" value={link.delay || 0} style={{ width: '100%' }} onChange={(e) => { const nl = [...unitData.external_links]; nl[i].delay = parseFloat(e.target.value); setUnitData({...unitData, external_links: nl}); setIsDirty(true); }} />
                          <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', marginTop: '5px' }}>                             <label style={{ fontSize: '10px', fontWeight: 900, display: 'flex', alignItems: 'center', gap: '4px', cursor: 'pointer', color: '#3b82f6' }}>
                                <input type="checkbox" checked={!!link.autoPlayOnce} onChange={(e) => { const nl = [...unitData.external_links]; nl[i].autoPlayOnce = e.target.checked; setUnitData({...unitData, external_links: nl}); setIsDirty(true); }} /> AUTO-PLAY
                             </label>
                             <select value={link.objectFit || 'cover'} style={{ fontSize: '10px' }} onChange={(e) => { const nl = [...unitData.external_links]; nl[i].objectFit = e.target.value; setUnitData({...unitData, external_links: nl}); setIsDirty(true); }}>
                                <option value="cover">Zoom</option>
                                <option value="contain">Encaixar</option>
                             </select>
                          </div>
                       </div>
                       <button onClick={() => { const nl = unitData.external_links.filter((_: any, idx: number) => idx !== i); setUnitData({...unitData, external_links: nl}); setIsDirty(true); }} style={{ width: '100%', marginTop: '10px', color: '#ef4444', background: '#fee2e2', border: 'none', borderRadius: '8px', padding: '5px', fontSize: '10px', fontWeight: 900 }}>REMOVER</button>
                    </div>
                 ))}
              </div>
              <div style={{ background: '#f1f5f9', borderRadius: '24px', padding: '15px', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                 <span style={{ fontSize: '10px', fontWeight: 900, marginBottom: '10px' }}>LIVE SIMULATOR</span>
                 <div style={{ background: 'white', padding: '20px', borderRadius: '25px', display: 'flex', gap: '15px', width: '100%', maxWidth: '100%' }}>
                    <div style={{ flex: 1, fontSize: '12px', overflow: 'hidden' }} dangerouslySetInnerHTML={{ __html: unitData.brief }} />
                    <div style={{ flex: 1 }}>{unitData.external_links?.map((m: any, i: number) => <VideoPlayerV5 key={i} media={m} />)}</div>
                 </div>
              </div>
           </div>
        </section>

        {/* SECTION 2: ATIVIDADES INTERATIVAS (WORDWALL / CANVA) */}
        <section style={{ background: 'white', borderRadius: '30px', padding: '30px', boxShadow: '0 10px 40px rgba(0,0,0,0.05)' }}>
           <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '20px' }}>
              <div style={{ background: '#10b981', color: 'white', padding: '10px', borderRadius: '14px' }}><Globe size={24} /></div>
              <h3 style={{ margin: 0, fontWeight: 900 }}>2. Atividades Interativas (Wordwall, Canva, etc.)</h3>
           </div>
           <div style={{ display: 'flex', gap: '12px', marginBottom: '20px', background: '#f8fafc', padding: '20px', borderRadius: '20px', border: '2px dashed #cbd5e1' }}>
              <div style={{ flex: 1 }}>
                 <label style={{ fontSize: '10px', fontWeight: 900, color: '#64748b', marginBottom: '5px', display: 'block' }}>COLE O LINK DA ATIVIDADE AQUI</label>
                 <input type="text" placeholder="Ex: https://wordwall.net/resource/..." value={tempEmbed} onChange={(e) => setTempEmbed(e.target.value)} style={{ width: '100%', padding: '15px', borderRadius: '15px', border: '1px solid #cbd5e1' }} />
              </div>
              <button onClick={saveEmbedLink} disabled={isSavingEmbed} style={{ alignSelf: 'flex-end', background: '#10b981', color: 'white', border: 'none', padding: '15px 30px', borderRadius: '15px', fontWeight: 900, display: 'flex', alignItems: 'center', gap: '10px' }}>
                 {isSavingEmbed ? 'Adicionando...' : <><Plus size={20} /> ADICIONAR E GRAVAR LINK</>}
              </button>
           </div>
           
           <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: '25px' }}>
               {unitData.embed_urls?.map((item: any, i: number) => (
                 <div key={i} style={{ 
                   background: 'white', 
                   padding: '0', 
                   borderRadius: '35px', 
                   border: '1px solid #e2e8f0', 
                   boxShadow: '0 20px 50px rgba(0,0,0,0.04)',
                   overflow: 'hidden',
                   display: 'flex',
                   flexDirection: 'column'
                 }}>
                   {/* CARD HEADER */}
                   <div style={{ background: '#f8fafc', padding: '20px 30px', borderBottom: '1px solid #f1f5f9', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                        <div style={{ background: '#10b981', color: 'white', padding: '8px', borderRadius: '12px' }}><Globe size={18} /></div>
                        <RichTextEditor 
                           height="100px"
                           value={item.title || ''} 
                           onChange={(val) => { const nl = [...unitData.embed_urls]; nl[i].title = val; setUnitData({...unitData, embed_urls: nl}); setIsDirty(true); }} 
                           placeholder="Título da Atividade..." 
                         />
                      </div>
                      <button 
                        onClick={() => { if(window.confirm('Excluir esta atividade permanentemente?')) { const nl = unitData.embed_urls.filter((_: any, idx: number) => idx !== i); setUnitData({...unitData, embed_urls: nl}); setIsDirty(true); } }}
                        style={{ background: '#fee2e2', color: '#ef4444', border: 'none', padding: '10px 20px', borderRadius: '12px', fontWeight: 900, fontSize: '12px', display: 'flex', alignItems: 'center', gap: '8px' }}
                      >
                        <Trash2 size={16} /> EXCLUIR
                      </button>
                   </div>

                   <div style={{ padding: '30px', display: 'grid', gridTemplateColumns: '1.2fr 0.8fr 1.2fr', gap: '30px' }}>
                      {/* LEFT COLUMN: CONTENT & INSTRUCTIONS */}
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                        <div>
                          <label style={{ fontSize: '11px', fontWeight: 900, color: '#94a3b8', display: 'block', marginBottom: '8px', letterSpacing: '1px' }}>LINK DA ATIVIDADE (URL)</label>
                          <input 
                            type="text" 
                            value={item.url} 
                            onChange={(e) => { const nl = [...unitData.embed_urls]; nl[i].url = e.target.value; setUnitData({...unitData, embed_urls: nl}); setIsDirty(true); }}
                            style={{ width: '100%', padding: '12px 15px', borderRadius: '15px', border: '1.5px solid #e2e8f0', fontSize: '13px', background: '#f1f5f9' }} 
                          />
                        </div>

                        <div>
                          <label style={{ fontSize: '11px', fontWeight: 900, color: '#94a3b8', display: 'block', marginBottom: '8px', letterSpacing: '1px' }}>INSTRUÇÕES PEDAGÓGICAS</label>
                          <RichTextEditor 
                            value={item.brief || ''} 
                            onChange={(val) => { const nl = [...unitData.embed_urls]; nl[i].brief = val; setUnitData({...unitData, embed_urls: nl}); setIsDirty(true); }} 
                            height="250px"
                            placeholder="Dicas para o aluno..." 
                          />
                          <div>
                           <label style={{ fontSize: '11px', fontWeight: 900, color: '#94a3b8', display: 'block', marginBottom: '8px', letterSpacing: '1px' }}>CONFIGURAÇÃO DE MISTÉRIO</label>
                           <div style={{ background: '#f8fafc', padding: '15px', borderRadius: '20px', border: '1px solid #e2e8f0', display: 'flex', flexDirection: 'column', gap: '15px' }}>
                             <div>
                               <label style={{ fontSize: '10px', fontWeight: 900, color: '#64748b', display: 'block', marginBottom: '4px' }}>IMAGEM DA MÁSCARA (URL)</label>
                               <div style={{ display: 'flex', gap: '8px' }}>
                                 <input type="text" value={item.mystery_icon || ''} onChange={(e) => { const nl = [...unitData.embed_urls]; nl[i].mystery_icon = e.target.value; setUnitData({...unitData, embed_urls: nl}); setIsDirty(true); }} placeholder="Link ou escolha na galeria..." style={{ flex: 1, padding: '10px', borderRadius: '10px', border: '1.5px solid #e2e8f0', fontSize: '12px' }} />
                                 <button onClick={() => triggerUpload((url) => { const nl = [...unitData.embed_urls]; nl[i].mystery_icon = url; setUnitData({...unitData, embed_urls: nl}); })} style={{ background: '#fff', border: '1px solid #e2e8f0', borderRadius: '10px', padding: '8px' }} title="Upload Local"><ImageIcon size={16} /></button>
                                 <button onClick={() => setShowAssetPicker({ active: true, callback: (path) => { const nl = [...unitData.embed_urls]; nl[i].mystery_icon = path; setUnitData({...unitData, embed_urls: nl}); setIsDirty(true); setShowAssetPicker({ active: false, callback: () => {} }); } })} style={{ background: '#fff', border: '1px solid #e2e8f0', borderRadius: '10px', padding: '8px' }} title="Galeria"><Globe size={16} /></button>
                               </div>
                             </div>
                             
                             <div>
                               <label style={{ fontSize: '10px', fontWeight: 900, color: '#64748b', display: 'block', marginBottom: '4px' }}>TAMANHO DO ÍCONE: {item.mystery_icon_size || 120}px</label>
                               <input type="range" min="40" max="300" value={item.mystery_icon_size || 120} onChange={(e) => { const nl = [...unitData.embed_urls]; nl[i].mystery_icon_size = parseInt(e.target.value); setUnitData({...unitData, embed_urls: nl}); setIsDirty(true); }} style={{ width: '100%' }} />
                             </div>
                           </div>
                         </div>
                        </div>
                      </div>

                      <StylingControls 
                         item={item} 
                         onChange={(updates) => {
                           const nl = [...unitData.embed_urls];
                           nl[i] = { ...nl[i], ...updates };
                           setUnitData({ ...unitData, embed_urls: nl });
                           setIsDirty(true);
                         }} 
                       />
                       
                       <MiniActivityPreview item={item} unitColor={COLORS[unitData.color]?.main || '#10b981'} />
                   </div>
                 </div>
               ))}
            </div>
        </section>

        {/* SECTION 3: QUESTÕES INTERATIVAS */}
        <section style={{ background: 'white', borderRadius: '30px', padding: '30px', boxShadow: '0 10px 40px rgba(0,0,0,0.05)' }}>
           <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '20px' }}>
              <div style={{ background: '#8b5cf6', color: 'white', padding: '10px', borderRadius: '14px' }}><Zap size={24} /></div>
              <h3 style={{ margin: 0, fontWeight: 900 }}>3. Questões Interativas (Estilo Forms)</h3>
           </div>
           <button onClick={() => { setUnitData({...unitData, questions: [...(unitData.questions || []), { title: 'Nova Pergunta', type: 'choice', options: ['Opção 1'], correct: 'Opção 1' }]}); setIsDirty(true); }} style={{ background: '#8b5cf6', color: 'white', border: 'none', padding: '12px 25px', borderRadius: '15px', fontWeight: 900, marginBottom: '20px' }}>+ CRIAR NOVA QUESTÃO</button>
           <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
               {unitData.questions?.map((q: any, i: number) => (
                 <div key={i} style={{ background: '#f8fafc', padding: '25px', borderRadius: '25px', border: '1px solid #e2e8f0' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '15px' }}>
                       <div style={{ flex: 1 }}>
                          <RichTextEditor height="150px" value={q.q} onChange={(val) => { const nq = [...unitData.questions]; nq[i].q = val; setUnitData({...unitData, questions: nq}); setIsDirty(true); }} />
                       </div>
                       <button onClick={() => { const nq = unitData.questions.filter((_: any, idx: number) => idx !== i); setUnitData({...unitData, questions: nq}); setIsDirty(true); }} style={{ background: 'none', border: 'none', alignSelf: 'flex-start' }}><Trash2 color="#ef4444" /></button>
                    </div>
                    
                    <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 0.8fr 1.2fr', gap: '30px', marginTop: '20px' }}>
                       <div style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
                          <label style={{ fontSize: '11px', fontWeight: 900, color: '#94a3b8' }}>OPÇÕES DE RESPOSTA</label>
                          {q.options?.map((opt: string, oIdx: number) => (
                            <div key={oIdx} style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
                               <input type="radio" checked={q.correct === opt} onChange={() => { const nq = [...unitData.questions]; nq[i].correct = opt; setUnitData({...unitData, questions: nq}); setIsDirty(true); }} />
                               <input value={opt} onChange={(e) => { const nq = [...unitData.questions]; nq[i].options[oIdx] = e.target.value; setUnitData({...unitData, questions: nq}); setIsDirty(true); }} style={{ flex: 1, padding: '10px', borderRadius: '10px', border: '1px solid #e2e8f0' }} />
                               <button onClick={() => { const nq = [...unitData.questions]; nq[i].options = nq[i].options.filter((_: any, idx: number) => idx !== oIdx); setUnitData({...unitData, questions: nq}); setIsDirty(true); }} style={{ background: 'none', border: 'none', color: '#ef4444' }}><X size={16} /></button>
                            </div>
                          ))}
                          <button onClick={() => { const nq = [...unitData.questions]; nq[i].options = [...(nq[i].options || []), 'Nova Opção']; setUnitData({...unitData, questions: nq}); setIsDirty(true); }} style={{ color: '#8b5cf6', fontWeight: 800, fontSize: '13px', textAlign: 'left', marginTop: '10px', background: 'none', border: 'none' }}>+ ADICIONAR OPÇÃO</button>
                       </div>
                       
                       <StylingControls 
                          item={q} 
                          onChange={(updates) => {
                            const nq = [...unitData.questions];
                            nq[i] = { ...nq[i], ...updates };
                            setUnitData({ ...unitData, questions: nq });
                            setIsDirty(true);
                          }} 
                        />

                       <MiniQuestionPreview item={q} unitColor={COLORS[unitData.color]?.main || '#10b981'} />
                    </div>
                 </div>
               ))}
           </div>
        </section>

        {/* SECTION 4: BNCC & TEMA */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '30px' }}>
           <section style={{ background: 'white', borderRadius: '30px', padding: '30px', boxShadow: '0 10px 40px rgba(0,0,0,0.05)' }}>
              <h3 style={{ margin: 0, fontWeight: 900, marginBottom: '15px', display: 'flex', alignItems: 'center', gap: '10px' }}><Target color="#f59e0b" /> Descritores BNCC</h3>
              <input value={descText} onChange={(e) => { setDescText(e.target.value); setIsDirty(true); }} placeholder="D3, D5, EF06LI01..." style={{ width: '100%', padding: '15px', borderRadius: '15px', border: '1px solid #cbd5e1' }} />
           </section>
           <section style={{ background: 'white', borderRadius: '30px', padding: '30px', boxShadow: '0 10px 40px rgba(0,0,0,0.05)' }}>
              <h3 style={{ margin: 0, fontWeight: 900, marginBottom: '15px', display: 'flex', alignItems: 'center', gap: '10px' }}><Palette color="#ec4899" /> Tema da Unidade</h3>
              <div style={{ display: 'flex', gap: '15px' }}>
                 {['gamer', 'creative', 'pop', 'natural'].map(t => (
                    <button key={t} onClick={() => { setUnitData({...unitData, color: t}); setIsDirty(true); }} style={{ 
                       width: '45px', height: '45px', borderRadius: '50%', background: COLORS[t]?.main, 
                       border: unitData.color === t ? '5px solid #1e293b' : 'none',
                       boxShadow: unitData.color === t ? '0 0 15px rgba(0,0,0,0.2)' : 'none',
                       transition: 'all 0.2s'
                    }} />
                 ))}
              </div>
           </section>
        </div>

        {/* SECTION 4.5: VISUAL & GAMIFICAÇÃO */}
        <section style={{ background: 'white', borderRadius: '30px', padding: '30px', boxShadow: '0 10px 40px rgba(0,0,0,0.05)' }}>
           <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '20px' }}>
              <div style={{ background: '#f59e0b', color: 'white', padding: '10px', borderRadius: '14px' }}><Sparkles size={24} /></div>
              <h3 style={{ margin: 0, fontWeight: 900 }}>4. Visual & Gamificação (Ícones e Skins)</h3>
           </div>
           <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '30px' }}>
              <div>
                 <label style={{ fontSize: '11px', fontWeight: 900, color: '#64748b', display: 'block', marginBottom: '10px' }}>ÍCONE 3D DA AULA</label>
                 <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: '10px' }}>
                    {[
                      { id: 'chef', icon: <ChefHat /> },
                      { id: 'headphones', icon: <Headphones /> },
                      { id: 'user', icon: <User /> },
                      { id: 'building', icon: <Building2 /> },
                      { id: 'book', icon: <BookOpen /> },
                      { id: 'mobile', icon: <Smartphone /> },
                      { id: 'school', icon: <GraduationCap /> },
                      { id: 'clipboard', icon: <ClipboardList /> },
                      { id: 'image', icon: <ImageIcon /> },
                      { id: 'zap', icon: <Zap /> }
                    ].map(item => (
                      <button 
                        key={item.id} 
                        onClick={() => { setUnitData({...unitData, icon: item.id}); setIsDirty(true); }}
                        style={{ 
                          padding: '15px', borderRadius: '16px', background: unitData.icon === item.id ? 'var(--unit-color, #3b82f6)' : '#f8fafc',
                          color: unitData.icon === item.id ? 'white' : '#64748b', border: '1px solid #e2e8f0'
                        }}
                      >
                        {/* @ts-ignore */}
                        {React.cloneElement(item.icon as React.ReactElement, { size: 24 })}
                      </button>
                    ))}
                 </div>
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
                 <label style={{ fontSize: '11px', fontWeight: 900, color: '#64748b' }}>ÍCONE MISTERIOSO (MÁSCARA)</label>
                 <input 
                   type="text" 
                   value={unitData.mystery_icon || ""} 
                   onChange={(e) => { setUnitData({...unitData, mystery_icon: e.target.value}); setIsDirty(true); }}
                   placeholder="Link da imagem (Ex: Interrogação, Baú...)"
                   style={{ width: '100%', padding: '15px', borderRadius: '15px', border: '1px solid #cbd5e1' }}
                 />
                 
                 <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                   <label style={{ fontSize: '11px', fontWeight: 900, color: '#64748b', whiteSpace: 'nowrap' }}>TAMANHO: {unitData.mystery_icon_size || 120}px</label>
                   <input 
                     type="range" 
                     min="40" 
                     max="300" 
                     value={unitData.mystery_icon_size || 120} 
                     onChange={(e) => { setUnitData({...unitData, mystery_icon_size: parseInt(e.target.value)}); setIsDirty(true); }}
                     style={{ flex: 1 }}
                   />
                 </div>

                 <div style={{ background: '#f1f5f9', padding: '15px', borderRadius: '20px', textAlign: 'center', display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '120px' }}>
                    {unitData.mystery_icon ? (
                      <img 
                        src={unitData.mystery_icon} 
                        alt="Mystery" 
                        style={{ 
                          width: `${unitData.mystery_icon_size || 120}px`, 
                          height: `${unitData.mystery_icon_size || 120}px`, 
                          objectFit: 'contain' 
                        }} 
                      />
                    ) : (
                      <span style={{ fontSize: '11px', color: '#94a3b8' }}>Sem máscara ativa (usará padrão)</span>
                    )}
                 </div>
              </div>
           </div>
        </section>

        {/* SECTION 5: BANCO DE PALAVRAS (WORD FALL) */}
        <section style={{ background: 'white', borderRadius: '30px', padding: '30px', boxShadow: '0 10px 40px rgba(0,0,0,0.05)' }}>
           <h3 style={{ margin: 0, fontWeight: 900, marginBottom: '15px', display: 'flex', alignItems: 'center', gap: '10px' }}><Zap color="#10b981" /> Banco de Palavras (Jogo WordFall)</h3>
           <div style={{ display: 'flex', gap: '10px' }}>
              <input value={newWord} onChange={(e) => setNewWord(e.target.value)} onKeyDown={(e) => e.key === 'Enter' && addWord()} placeholder="Ex: Fridge / Geladeira" style={{ flex: 1, padding: '15px', borderRadius: '15px', border: '1px solid #cbd5e1' }} />
              <button onClick={addWord} style={{ background: '#10b981', color: 'white', border: 'none', padding: '0 25px', borderRadius: '15px', fontWeight: 900 }}>ADICIONAR À LISTA</button>
           </div>
           <div style={{ display: 'flex', flexWrap: 'wrap', gap: '10px', marginTop: '20px' }}>
              {unitData.vocabulary_list?.map((w: any, i: number) => (
                <span key={i} style={{ background: '#f1f5f9', padding: '10px 18px', borderRadius: '15px', fontWeight: 800, display: 'flex', alignItems: 'center', gap: '10px', border: '1px solid #e2e8f0' }}>
                   <span style={{ fontSize: '14px' }}>{typeof w === 'object' ? w.en : w}</span>
                   <button onClick={() => { const nv = unitData.vocabulary_list.filter((_: any, idx: number) => idx !== i); setUnitData({...unitData, vocabulary_list: nv}); setIsDirty(true); }} style={{ background: 'none', border: 'none', color: '#ef4444', padding: 0 }}><Trash2 size={14} /></button>
                </span>
              ))}
           </div>
        </section>

      </div>

      {showAssetPicker.active && <AssetPicker onSelect={showAssetPicker.callback} onClose={() => setShowAssetPicker({ active: false, callback: () => {} })} />}
      <input type="file" ref={fileInputRef} onChange={handleFileChange} style={{ display: 'none' }} accept="image/*" />
      
      <style>{`
        @keyframes pulse {
          0% { opacity: 0.6; transform: scale(1); }
          50% { opacity: 1; transform: scale(1.05); }
          100% { opacity: 0.6; transform: scale(1); }
        }
      `}</style>
    </div>
  );
};

export default PlanningEditor;
