import { err, requireUser } from '@/lib/api'
import { NextResponse } from 'next/server'

export async function GET(_req: Request, { params }: { params: Promise<{ id: string }> }) {
    const { id } = await params
    const auth = await requireUser()
    if (auth.response) return auth.response
    const { supabase, user } = auth

    const { data: submissionData, error: submissionError } = await supabase
        .from('submissions')
        .select('*')
        .eq('id', id)
        .single()
    if (submissionError) return err('Cannot get submission', 'CANNOT_GET_SUBMISSION', 500)
    if (!submissionData) return err('Submission not found', 'SUBMISSION_NOT_FOUND', 404)

    const isOwner = submissionData?.student_id === user.id

    // Bug: isInstructor is always undefined here — fixed in item 4 (requires joining assignments)
    const isInstructor = submissionData.assignments?.classes?.class_members?.some(
        (m: { user_id: string; role: string }) => m.user_id === user.id && m.role === 'instructor'
    )

    if (!isOwner && !isInstructor) return err('Forbidden', 'FORBIDDEN', 403)

    return NextResponse.json({ data: submissionData }, { status: 200 })
}
