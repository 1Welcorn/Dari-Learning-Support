import { useState, useEffect } from 'react';
import { supabase } from '../services/supabase';
import type { Unit, Session, Answer, AppSettings } from '../types';

export const useSarehData = () => {
  const [units, setUnits] = useState<Unit[]>([]);
  const [sessions, setSessions] = useState<Session[]>([]);
  const [answers, setAnswers] = useState<Record<string, Answer>>({});
  const [settings, setSettings] = useState<Partial<AppSettings>>({});
  const [loading, setLoading] = useState(true);
  const [syncStatus, setSyncStatus] = useState<'ok' | 'err'>('ok');

  const fetchData = async () => {
    try {
      const [uRes, sRes, aRes, setsRes] = await Promise.all([
        supabase.from('units').select('*').order('sort_order'),
        supabase.from('sessions').select('*').order('session_date', { ascending: false }),
        supabase.from('answers').select('*'),
        supabase.from('settings').select('*')
      ]);

      if (uRes.data) {
        const sanitizedUnits = uRes.data.map(u => ({
          ...u,
          descriptors: typeof u.descriptors === 'string' ? JSON.parse(u.descriptors) : (u.descriptors || []),
          embed_urls: typeof u.embed_urls === 'string' ? JSON.parse(u.embed_urls) : (u.embed_urls || []),
          questions: typeof u.questions === 'string' ? JSON.parse(u.questions) : (u.questions || []),
          external_links: typeof u.external_links === 'string' ? JSON.parse(u.external_links) : (u.external_links || [])
        }));
        setUnits(sanitizedUnits);
      }
      if (sRes.data) setSessions(sRes.data);
      if (aRes.data) {
        const aMap: Record<string, Answer> = {};
        aRes.data.forEach(a => aMap[`${a.unit_id}-${a.question_index}`] = a);
        setAnswers(aMap);
      }
      if (setsRes.data) {
        const sMap: Partial<AppSettings> = {};
        setsRes.data.forEach(s => sMap[s.key as keyof AppSettings] = s.value);
        setSettings(sMap);
      }
      setSyncStatus('ok');
    } catch (err) {
      console.error('Error fetching data:', err);
      setSyncStatus('err');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();

    // Inscrição em tempo real
    const channel = supabase.channel('sareh-realtime')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'units' }, fetchData)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'sessions' }, fetchData)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'answers' }, fetchData)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'settings' }, fetchData)
      .subscribe((status) => {
        setSyncStatus(status === 'SUBSCRIBED' ? 'ok' : 'err');
      });

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  const saveAnswer = async (unitId: string, qIdx: number, val: string) => {
    try {
      const { error } = await supabase.from('answers').upsert({
        unit_id: unitId,
        question_index: qIdx,
        answer_value: val,
        is_done: true
      }, { onConflict: 'unit_id,question_index' });
      
      if (error) {
        console.error('Error saving answer to Supabase:', error);
        setSyncStatus('err');
        return false;
      }
      
      // Atualiza estado local apenas após sucesso
      const answerKey = `${unitId}-${qIdx}`;
      setAnswers(prev => ({
        ...prev,
        [answerKey]: {
          unit_id: unitId,
          question_index: qIdx,
          answer_value: val,
          is_done: true
        }
      }));
      
      setSyncStatus('ok');
      return true;
    } catch (err) {
      console.error('Exception in saveAnswer:', err);
      setSyncStatus('err');
      return false;
    }
  };

  const saveSession = async (unitId: string, note: string) => {
    try {
      const { data, error } = await supabase.from('sessions').insert({
        unit_id: unitId,
        session_date: new Date().toLocaleDateString('pt-BR'),
        note
      }).select().single();
      
      if (error) {
        console.error('Error saving session:', error);
        return false;
      }
      
      if (data) {
        setSessions(prev => [data, ...prev]);
      }
      return true;
    } catch (err) {
      console.error('Exception in saveSession:', err);
      return false;
    }
  };

  const resetUnitAnswers = async (unitId: string) => {
    try {
      const { error } = await supabase.from('answers').delete().eq('unit_id', unitId);
      if (error) {
        console.error('Error resetting unit answers:', error);
        setSyncStatus('err');
      } else {
        setSyncStatus('ok');
        // Atualiza estado local removendo as chaves dessa unidade
        setAnswers(prev => {
          const next = { ...prev };
          Object.keys(next).forEach(key => {
            if (key.startsWith(`${unitId}-`)) {
              delete next[key];
            }
          });
          return next;
        });
      }
    } catch (err) {
      console.error('Exception in resetUnitAnswers:', err);
      setSyncStatus('err');
    }
  };

  const updateSession = async (sessionId: string, note: string) => {
    try {
      const { error } = await supabase.from('sessions').update({ note }).eq('id', sessionId);
      if (error) {
        console.error('Error updating session:', error);
        setSyncStatus('err');
        return false;
      }
      setSyncStatus('ok');
      setSessions(prev => prev.map(s => s.id === sessionId ? { ...s, note } : s));
      return true;
    } catch (err) {
      console.error('Exception in updateSession:', err);
      setSyncStatus('err');
      return false;
    }
  };

  const deleteSession = async (sessionId: string) => {
    try {
      const { error } = await supabase.from('sessions').delete().eq('id', sessionId);
      if (error) {
        console.error('Error deleting session:', error);
        setSyncStatus('err');
        return false;
      }
      setSyncStatus('ok');
      setSessions(prev => prev.filter(s => s.id !== sessionId));
      return true;
    } catch (err) {
      console.error('Exception in deleteSession:', err);
      setSyncStatus('err');
      return false;
    }
  };

  const createUnit = async (title: string) => {
    try {
      const newId = `u${Date.now()}`;
      const newUnit: Unit = {
        id: newId,
        title: title || 'Nova Unidade',
        sub: 'Nova aula · 10 min',
        color: 'teal',
        sort_order: units.length,
        brief: 'Resumo da nova aula...',
        plan_c: 'Conteúdo',
        plan_h: 'Habilidade',
        plan_e: 'Estratégia',
        plan_a: 'Avaliação',
        wa: 'Oi! Nova aula...',
        embed_urls: [],
        descriptors: [],
        questions: [],
        external_links: []
      };

      const { error } = await supabase.from('units').insert(newUnit);
      if (error) {
        console.error('Error creating unit:', error);
        return false;
      }
      
      setUnits(prev => [...prev, newUnit]);
      return true;
    } catch (err) {
      console.error('Exception in createUnit:', err);
      return false;
    }
  };

  const updateUnit = async (id: string, updates: Partial<Unit>) => {
    const { error } = await supabase.from('units').update(updates).eq('id', id);
    if (error) {
      console.error('Error updating unit:', error);
      window.alert('Erro ao salvar no banco de dados: ' + error.message + '\nVerifique se você rodou o SQL de permissões.');
      return false;
    }
    
    // Optimistic update
    setUnits(prev => prev.map(u => u.id === id ? { ...u, ...updates } : u));
    return true;
  };

  return {
    units,
    sessions,
    answers,
    settings,
    loading,
    syncStatus,
    saveAnswer,
    saveSession,
    updateSession,
    deleteSession,
    resetUnitAnswers,
    updateUnit,
    createUnit,
    refresh: fetchData
  };
};
