import { err, requireUser, requireClassRole } from '@/lib/api'
import { NextResponse } from 'next/server'

export async function POST(req: Request) {
    const auth = await requireUser()
    if (auth.response) return auth.response
    const { supabase, user } = auth

    const { assignment_id, text_content, file_urls } = await req.json()

    if (!assignment_id || (!text_content && !file_urls)) return err('Missing parameters', 'MISSING_PARAMETERS', 400)

    const { data: assignment, error: assignmentError } = await supabase
        .from('assignments')
        .select('class_id')
        .eq('id', assignment_id)
        .single()

    if (assignmentError) return err('Cannot get assignment', 'CANNOT_GET_ASSIGNMENT', 500)
    if (!assignment) return err('Assignment not found', 'ASSIGNMENT_NOT_FOUND', 404)

    const access = await requireClassRole(supabase, assignment.class_id, user.id, 'student')
    if (access.response) return access.response

    const { data: pastSubmission } = await supabase
        .from('submissions')
        .select('id')
        .eq('assignment_id', assignment_id)
        .eq('student_id', user.id)
        .single()

    if (pastSubmission) return err('Submission already exists', 'SUBMISSION_ALREADY_EXISTS', 409)

    const { error: newSubmissionError, data: newSubmission } = await supabase
        .from('submissions')
        .insert([{ assignment_id, student_id: user.id, text_content, file_urls }])
        .select()
        .single()

    if (newSubmissionError) return err('Cannot create submission', 'CANNOT_CREATE_SUBMISSION', 500)
    return NextResponse.json(newSubmission, { status: 201 })
}
