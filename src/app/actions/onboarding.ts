"use server"

import { createClient } from "@/lib/supabase/server"

export async function completeOnboarding(displayName: string, role: string) {

    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return { error: 'Unauthorised' }

    if (displayName.trim().length < 2) return { error: 'Display name must be at least 2 characters long' }

    if (role !== 'student' && role !== 'instructor') return { error: 'Invalid role' }

    const { error: updateError } = await supabase
        .from('users')
        .update({ name: displayName.trim(), role: role, onboarding_complete: true })
        .eq('id', user.id)

    if (updateError) return { error: updateError.message }

     return { success: true, role }
}
