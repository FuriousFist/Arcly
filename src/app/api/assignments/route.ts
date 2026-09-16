import { err, requireUser, requireClassRole } from '@/lib/api'
import { NextResponse } from 'next/server'

export async function POST(req: Request) {
    const auth = await requireUser()
    if (auth.response) return auth.response
    const { supabase, user } = auth

    const { class_id, title, brief, due_at, rubric_json, submission_types } = await req.json()

    if (!class_id || !title) return err('Missing parameters', 'MISSING_PARAMETERS', 400)

    const access = await requireClassRole(supabase, class_id, user.id, 'instructor')
    if (access.response) return access.response

    const { error: assignmentError, data: newAssignment } = await supabase
        .from('assignments')
        .insert([{ class_id, title, brief, due_at, rubric_json, submission_types }])
        .select()
        .single()

    if (assignmentError) return err('Cannot create assignment', 'CANNOT_CREATE_ASSIGNMENT', 500)
    return NextResponse.json(newAssignment, { status: 201 })
}
