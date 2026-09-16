import { err, requireUser, requireClassRole } from '@/lib/api'
import { NextResponse } from 'next/server'

export async function DELETE(_req: Request, { params }: { params: Promise<{ id: string; userId: string }> }) {
    const { id, userId } = await params
    const auth = await requireUser()
    if (auth.response) return auth.response
    const { supabase, user } = auth

    const access = await requireClassRole(supabase, id, user.id, 'instructor')
    if (access.response) return access.response

    if (userId === user.id) {
        return err('Cannot remove yourself from the class', 'CANNOT_REMOVE_SELF', 403)
    }

    const { error: deleteError } = await supabase
        .from('class_members')
        .delete()
        .eq('class_id', id)
        .eq('user_id', userId)

    if (deleteError) return err('Cannot remove member', 'CANNOT_REMOVE_MEMBER', 500)
    return NextResponse.json({ success: true })
}
