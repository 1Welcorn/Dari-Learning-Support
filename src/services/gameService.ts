import { supabase } from './supabase';

/**
 * Fetches the vocabulary list for a specific unit.
 * Note: Ensure your 'units' table has a 'vocabulary_list' column (JSONB or Text Array).
 * If not, you can add it via SQL: ALTER TABLE units ADD COLUMN vocabulary_list JSONB DEFAULT '[]'::jsonb;
 */
export const getUnitVocabulary = async (unitId: string): Promise<string[]> => {
  try {
    const { data, error } = await supabase
      .from('units')
      .select('vocabulary_list') 
      .eq('id', unitId)
      .single();

    if (error) {
      console.error('Error fetching unit vocabulary:', error);
      return [];
    }
    
    // Returns e.g., ["Fridge", "Spoon", "Oven"]
    return Array.isArray(data.vocabulary_list) ? data.vocabulary_list : []; 
  } catch (err) {
    console.error('Unexpected error in getUnitVocabulary:', err);
    return [];
  }
};

/**
 * Updates the vocabulary list for a unit (Admin only).
 */
export const updateUnitVocabulary = async (unitId: string, vocabulary: string[]) => {
  const { error } = await supabase
    .from('units')
    .update({ vocabulary_list: vocabulary })
    .eq('id', unitId);

  return { success: !error, error };
};
