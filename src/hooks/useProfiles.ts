import { useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { User, VehicleCustomize } from '@/types';

// Convert DB row to User object
function rowToUser(row: any): User {
  return {
    id: row.id,
    pseudo: row.pseudo,
    password: row.password,
    level: row.level,
    points: row.points,
    fuel: row.fuel,
    vehicleOwned: row.vehicle_owned,
    vehicleType: row.vehicle_type,
    vehicleModel: row.vehicle_model,
    answeredQuestions: row.answered_questions || {},
    ownedItems: row.owned_items || [],
    customize: row.customize as VehicleCustomize || {
      paintColor: '#ffffff',
      paintFinish: 'glossy',
      wheelType: 'standard',
      hasBullbar: false,
      hasSpoiler: false,
      hasRunningBoard: false,
      hasVisor: false,
      hasBeacons: false,
      hasLightBar: false,
      hasXenon: false,
      hasTuningBumper: false,
      hasNeonKit: false,
      hasWideBodyKit: false,
      hasHood: false,
      hasExhaust: false,
      cabinStripe: null,
      cabinSticker: null,
      trailerColor: '#ffffff',
      trailerLogo: null
    },
    completedChapters: row.completed_chapters || [],
    vehicleImageUrl: row.vehicle_image_url,
  };
}

// Convert User object to DB row for upsert
function userToRow(user: User) {
  return {
    id: user.id,
    pseudo: user.pseudo,
    password: user.password || '',
    level: user.level,
    points: user.points,
    fuel: user.fuel,
    vehicle_owned: user.vehicleOwned,
    vehicle_type: user.vehicleType,
    vehicle_model: user.vehicleModel,
    answered_questions: user.answeredQuestions,
    owned_items: user.ownedItems,
    customize: user.customize as any,
    completed_chapters: user.completedChapters,
    vehicle_image_url: user.vehicleImageUrl || null,
    updated_at: new Date().toISOString(),
  };
}

export function useProfiles() {
  const fetchAllUsers = useCallback(async (): Promise<User[]> => {
    const { data, error } = await (supabase as any)
      .from('profiles')
      .select('*')
      .order('points', { ascending: false });
    if (error) {
      console.error('Error fetching profiles:', error);
      return [];
    }
    return (data || []).map(rowToUser);
  }, []);

  const fetchUserByPseudo = useCallback(async (pseudo: string): Promise<User | null> => {
    const { data, error } = await (supabase as any)
      .from('profiles')
      .select('*')
      .eq('pseudo', pseudo)
      .maybeSingle();
    if (error) {
      console.error('Error fetching profile:', error);
      return null;
    }
    return data ? rowToUser(data) : null;
  }, []);

  const upsertUser = useCallback(async (user: User): Promise<boolean> => {
    const row = userToRow(user);
    const { error } = await (supabase as any)
      .from('profiles')
      .upsert(row, { onConflict: 'id' });
    if (error) {
      console.error('Error upserting profile:', error);
      return false;
    }
    return true;
  }, []);

  const deleteUser = useCallback(async (userId: string): Promise<boolean> => {
    const { error } = await (supabase as any)
      .from('profiles')
      .delete()
      .eq('id', userId);
    if (error) {
      console.error('Error deleting profile:', error);
      return false;
    }
    return true;
  }, []);

  return { fetchAllUsers, fetchUserByPseudo, upsertUser, deleteUser };
}
