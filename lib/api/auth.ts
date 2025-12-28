import { NextResponse } from 'next/server';
import { createSupabaseServerClient } from '@/lib/supabase/server';
import type { User } from '@supabase/supabase-js';

/**
 * Récupère l'utilisateur authentifié depuis la session Supabase
 * @returns L'utilisateur authentifié
 * @throws Error si l'utilisateur n'est pas authentifié
 */
export async function getAuthenticatedUser(): Promise<User> {
  const supabase = await createSupabaseServerClient();
  
  const {
    data: { user },
    error,
  } = await supabase.auth.getUser();

  if (error || !user) {
    throw new Error('Unauthorized');
  }

  return user;
}

/**
 * Retourne une réponse 401 Unauthorized
 */
export function unauthorized() {
  return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
}
