import type { AutomatonDefinition } from '../types/automata';
import { supabase } from './supabaseClient';

interface SavedAutomataRow {
  definition: AutomatonDefinition;
}

function requireSupabase() {
  if (!supabase) {
    throw new Error('Supabase is not configured. Add the project URL and publishable key.');
  }
  return supabase;
}

export async function listCloudAutomata(userId: string): Promise<AutomatonDefinition[]> {
  const client = requireSupabase();
  const { data, error } = await client
    .from('saved_automata')
    .select('definition')
    .eq('user_id', userId)
    .order('updated_at', { ascending: false });

  if (error) throw error;
  return (data as SavedAutomataRow[]).map(row => row.definition);
}

export async function saveCloudAutomaton(
  userId: string,
  machine: AutomatonDefinition
): Promise<void> {
  const client = requireSupabase();
  const updatedAt = new Date().toISOString();
  const definition = { ...machine, updatedAt };
  const { error } = await client.from('saved_automata').upsert(
    {
      user_id: userId,
      machine_id: machine.id,
      name: machine.name,
      machine_type: machine.type,
      definition,
      updated_at: updatedAt,
    },
    { onConflict: 'user_id,machine_id' }
  );

  if (error) throw error;
}

export async function deleteCloudAutomaton(userId: string, machineId: string): Promise<void> {
  const client = requireSupabase();
  const { error } = await client
    .from('saved_automata')
    .delete()
    .eq('user_id', userId)
    .eq('machine_id', machineId);

  if (error) throw error;
}
