import { useEffect, useState } from 'react';
import { supabase } from '../services/supabase';

export const useStudentJourney = (userId: string) => {
  const [stats, setStats] = useState<any>(null);
  const [progress, setProgress] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchJourneyData = async () => {
    if (!userId) return;
    setLoading(true);
    
    try {
      // 1. Fetch Profile (XP, Level, Streak)
      const { data: profileData, error: profileError } = await supabase
        .from('profiles')
        .select('id, xp, level, streak, stars') // Request specific columns instead of *
        .eq('id', userId)
        .maybeSingle();

      if (profileError) {
        console.warn('Profile sync skipped (likely schema mismatch):', profileError.message);
      }

      // 2. Fetch Unit Progress
      const { data: progressData, error: progressError } = await supabase
        .from('student_progress')
        .select('unit_id, status, score')
        .eq('profile_id', userId);

      if (progressError) {
        console.warn('Progress sync skipped:', progressError.message);
      }

      setStats(profileData || { xp: 0, level: 1, streak: 0, stars: 0 });
      setProgress(progressData || []);
    } catch (err) {
      console.error('Journey data fallback activated');
      setStats({ xp: 0, level: 1, streak: 0, stars: 0 });
    } finally {
      setLoading(false);
    }
  };

  const completeLesson = async (unitId: string, earnedXp: number) => {
    if (!userId) return false;
    
    try {
      // 1. Update XP
      const { data: profile } = await supabase
        .from('profiles')
        .select('xp')
        .eq('id', userId)
        .single();

      const { error: xpError } = await supabase
        .from('profiles')
        .update({ xp: (profile?.xp || 0) + earnedXp })
        .eq('id', userId);

      if (xpError) throw xpError;

      // 2. Mark Unit as Completed
      const { error: progError } = await supabase
        .from('student_progress')
        .upsert({ 
          profile_id: userId, 
          unit_id: unitId, 
          status: 'completed',
          completed_at: new Date().toISOString() 
        }, { onConflict: 'profile_id,unit_id' });

      if (progError) throw progError;

      // Refresh data locally
      await fetchJourneyData();
      return true;
    } catch (err) {
      console.error('Error in completeLesson:', err);
      return false;
    }
  };

  const addStudentRewards = async (xpGained: number, starsEarned: number) => {
    if (!userId) return { success: false };
    
    try {
      const { data, error } = await supabase.rpc('add_student_rewards', {
        xp_to_add: xpGained,
        stars_to_add: starsEarned
      });

      if (error) throw error;
      
      await fetchJourneyData();
      return { success: true, data };
    } catch (err) {
      console.error('Error adding student rewards:', err);
      return { success: false, error: err };
    }
  };

  useEffect(() => {
    if (userId) fetchJourneyData();
  }, [userId]);

  return { stats, progress, loading, completeLesson, addStudentRewards, refresh: fetchJourneyData };
};
