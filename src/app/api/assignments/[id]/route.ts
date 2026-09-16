import { err, requireUser } from '@/lib/api'
import { NextResponse } from 'next/server'

export async function GET(_req: Request, { params }: { params: Promise<{ id: string }> }) {
    const { id } = await params
    const auth = await requireUser()
    if (auth.response) return auth.response
    const { supabase, user } = auth

    const { data: assignmentData, error: assignmentError } = await supabase
        .from('assignments')
        .select('*')
        .eq('id', id)
        .single()

    if (assignmentError) return err('Cannot get assignment', 'CANNOT_GET_ASSIGNMENT', 500)
    if (!assignmentData) return err('Assignment not found', 'ASSIGNMENT_NOT_FOUND', 404)

    const { data: membership } = await supabase
        .from('class_members')
        .select('role')
        .eq('class_id', assignmentData.class_id)
        .eq('user_id', user.id)
        .single()

    if (!membership) return err('Assignment not found', 'ASSIGNMENT_NOT_FOUND', 404)

    return NextResponse.json({ data: assignmentData })
}
