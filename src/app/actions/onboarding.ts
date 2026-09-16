'use server'

import { requireUser } from '@/lib/api'

export async function completeOnboarding(displayName: string, role: string) {
    const auth = await requireUser()
    if (auth.response) return { error: 'Unauthorised' }
    const { supabase, user } = auth

    if (displayName.trim().length < 2) return { error: 'Display name must be at least 2 characters long' }

    if (role !== 'student' && role !== 'instructor') return { error: 'Invalid role' }

    const { error: updateError } = await supabase
        .from('users')
        .update({ name: displayName.trim(), role: role, onboarding_complete: true })
        .eq('id', user.id)

    if (updateError) return { error: updateError.message }

    return { success: true, role }
}
