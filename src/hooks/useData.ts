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
    const { error } = await supabase.from('answers').upsert({
      unit_id: unitId,
      question_index: qIdx,
      answer_value: val,
      is_done: true
    }, { onConflict: 'unit_id,question_index' });
    if (error) console.error('Error saving answer:', error);
  };

  const saveSession = async (unitId: string, note: string) => {
    const { error } = await supabase.from('sessions').insert({
      unit_id: unitId,
      session_date: new Date().toLocaleDateString('pt-BR'),
      note
    });
    if (error) console.error('Error saving session:', error);
  };

  const updateUnit = async (id: string, updates: Partial<Unit>) => {
    const { error } = await supabase.from('units').update(updates).eq('id', id);
    if (error) {
      console.error('Error updating unit:', error);
      window.alert('Erro ao salvar no banco de dados: ' + error.message + '\nVerifique se você rodou o SQL de permissões.');
      return false;
    }
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
    updateUnit,
    refresh: fetchData
  };
};
