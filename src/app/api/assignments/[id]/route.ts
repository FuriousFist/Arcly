import { err, requireUser, requireClassRole } from '@/lib/api'
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

export async function PATCH(req: Request, { params }: { params: Promise<{ id: string }> }) {
    const { id } = await params
    const auth = await requireUser()
    if (auth.response) return auth.response
    const { supabase, user } = auth

    const { data: assignment } = await supabase.from('assignments').select('class_id, status').eq('id', id).single()
    if (!assignment) return err('Assignment not found', 'ASSIGNMENT_NOT_FOUND', 404)

    const access = await requireClassRole(supabase, assignment.class_id, user.id, 'instructor')
    if (access.response) return access.response

    const body = await req.json()
    const { title, brief, due_at, rubric_json, submission_types, status } = body

    // Only drafts can have their content edited; published can only be closed
    const updates: Record<string, unknown> = {}
    if (assignment.status === 'draft') {
        if (title !== undefined) updates.title = title
        if (brief !== undefined) updates.brief = brief
        if (due_at !== undefined) updates.due_at = due_at
        if (rubric_json !== undefined) updates.rubric_json = rubric_json
        if (submission_types !== undefined) updates.submission_types = submission_types
    }
    if (status === 'published' && assignment.status === 'draft') updates.status = 'published'
    if (status === 'closed' && assignment.status === 'published') updates.status = 'closed'

    if (Object.keys(updates).length === 0) return err('No valid updates', 'NO_UPDATES', 400)

    const { error, data } = await supabase.from('assignments').update(updates).eq('id', id).select().single()
    if (error) return err('Cannot update assignment', 'CANNOT_UPDATE_ASSIGNMENT', 500)

    return NextResponse.json({ data })
}

export async function DELETE(_req: Request, { params }: { params: Promise<{ id: string }> }) {
    const { id } = await params
    const auth = await requireUser()
    if (auth.response) return auth.response
    const { supabase, user } = auth

    const { data: assignment } = await supabase.from('assignments').select('class_id, status').eq('id', id).single()
    if (!assignment) return err('Assignment not found', 'ASSIGNMENT_NOT_FOUND', 404)

    if (assignment.status !== 'draft') return err('Only draft assignments can be deleted', 'NOT_DRAFT', 400)

    const access = await requireClassRole(supabase, assignment.class_id, user.id, 'instructor')
    if (access.response) return access.response

    const { error } = await supabase.from('assignments').delete().eq('id', id)
    if (error) return err('Cannot delete assignment', 'CANNOT_DELETE_ASSIGNMENT', 500)

    return NextResponse.json({ success: true })
}
