import { useEffect, useState } from 'react';
import { supabase } from '../services/supabase';

export const useDashboardData = (userId: string) => {
  const [units, setUnits] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const getData = async () => {
      if (!userId) return;
      setLoading(true);
      
      // 1. Fetch all units first
      const { data: allUnits, error: unitsError } = await supabase
        .from('units')
        .select('id, title, sub')
        .order('id');

      if (unitsError) {
        console.error('Error fetching units:', unitsError);
        setLoading(false);
        return;
      }

      // 2. Fetch progress for this specific user
      const { data: progressData } = await supabase
        .from('student_progress')
        .select('unit_id, status')
        .eq('profile_id', userId);

      // 3. Merge them
      const merged = (allUnits || []).map(u => {
        const prog = (progressData || []).find(p => p.unit_id === u.id);
        return {
          unit_id: u.id,
          unit_title: u.title,
          unit_sub: u.sub,
          unit_status: prog ? prog.status : 'not_started'
        };
      });

      setUnits(merged);
      setLoading(false);
    };

    getData();
  }, [userId]);

  return { units, loading };
};
