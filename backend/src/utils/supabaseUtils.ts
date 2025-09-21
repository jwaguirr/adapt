import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv'
import { resolve } from 'path';

// Load environment variables from the root .env file
dotenv.config({ path: resolve(__dirname, '../../../.env') });


const supabaseUrl = process.env.SUPABASE_URL;
const supabaseAnonKey = process.env.SUPABASE_ANON_KEY;

// Ensure Supabase environment variables are set
if (!supabaseUrl || !supabaseAnonKey) {
  console.warn('Supabase environment variables (SUPABASE_URL, SUPABASE_ANON_KEY) are not set. Supabase logging will be disabled.');
}

// Initialize the Supabase client, or null if variables are missing
const supabase = supabaseUrl && supabaseAnonKey ? createClient(supabaseUrl, supabaseAnonKey) : null;

/**
 * Sends the details of a found saying to a Supabase table.
 * If Supabase is not configured, it will log a warning and do nothing.
 * * @param finalTranscript The full transcript in which the saying was found.
 * @param foundSaying The specific saying that was identified.
 * @param location The geographical location where the event occurred.
 */
export async function sendSayingToSupabase(
  finalTranscript: string,
  foundSaying: string,
  location: string
): Promise<void> {
  // Do nothing if the Supabase client wasn't initialized
  if (!supabase) {
    return;
  }

  try {
    console.log("Inside try")
    const { data, error } = await supabase
      .from('Encounter') // This is your table name
      .insert([
        {
          context: finalTranscript,
          term_id: foundSaying,
          location: location,
          // The 'created_at' timestamp is handled automatically by Supabase
        },
      ])
      .select(); // .select() is good practice to get the inserted data back

    if (error) {
      throw error;
    }

    console.log('Successfully sent saying to Supabase:', data);
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'An unknown error occurred';
    console.error('Error sending data to Supabase:', errorMessage);
  }
}

export async function pullMapFromSupabase(): Promise<Record<string, { term_id: number; translation: string }>> {
  if (!supabase) {
    console.warn('Supabase not configured. Returning empty map.');
    return {};
  }

  try {
    // Select the three columns from your table
    const { data, error } = await supabase
      .from('Term')
      .select('id, term, translation_spanish');

    if (error) {
      throw error;
    }

    // Transform the array of objects into a single key-value map object
    if (data) {
      const termMap = data.reduce((map, record) => {
        // Ensure all required fields are present to avoid null keys/values
        if (record.term && record.term && record.translation_spanish) {
          map[record.term] = { 
            term_id: record.id,
            translation: record.translation_spanish 
          };
        }
        return map;
      }, {} as Record<string, { term_id: number; translation: string }>);
      
      console.log(`Successfully pulled ${Object.keys(termMap).length} terms from Supabase.`);
      return termMap;
    }
    
    return {};

  } catch (error) {
    console.error('Error pulling map from Supabase. Full error object:', error);
    // Return an empty object as a safe fallback
    return {};
  }
}
