import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'
import type { User } from '@supabase/supabase-js'

type SupabaseClient = Awaited<ReturnType<typeof createClient>>

export function err(error: string, code: string, status: number) {
    return NextResponse.json({ error, code }, { status })
}

// Returns the server client + authenticated user, or a ready-to-return 401 response.
export async function requireUser(): Promise<
    | { supabase: SupabaseClient; user: User; response?: never }
    | { supabase?: never; user?: never; response: NextResponse }
> {
    const supabase = await createClient()
    const {
        data: { user },
    } = await supabase.auth.getUser()
    if (!user) return { response: err('Unauthorised', 'unauthorised', 401) }
    return { supabase, user }
}

// Looks up class_members for (classId, userId). Returns the role, or a 403 response
// if the user is not a member or does not have `role` (when given).
export async function requireClassRole(
    supabase: SupabaseClient,
    classId: string,
    userId: string,
    role?: 'instructor' | 'student',
): Promise<{ role: string; response?: never } | { role?: never; response: NextResponse }> {
    const { data: membership } = await supabase
        .from('class_members')
        .select('role')
        .eq('class_id', classId)
        .eq('user_id', userId)
        .single()
    if (!membership) return { response: err('Forbidden', 'FORBIDDEN', 403) }
    if (role && membership.role !== role) return { response: err('Forbidden', 'FORBIDDEN', 403) }
    return { role: membership.role }
}
