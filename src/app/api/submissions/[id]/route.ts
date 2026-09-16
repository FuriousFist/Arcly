import { err, requireUser, requireClassRole } from '@/lib/api'
import { NextResponse } from 'next/server'

export async function GET(_req: Request, { params }: { params: Promise<{ id: string }> }) {
    const { id } = await params
    const auth = await requireUser()
    if (auth.response) return auth.response
    const { supabase, user } = auth

    const { data: submissionData, error: submissionError } = await supabase
        .from('submissions')
        .select('*, assignments(class_id)')
        .eq('id', id)
        .single()
    if (submissionError) return err('Cannot get submission', 'CANNOT_GET_SUBMISSION', 500)
    if (!submissionData) return err('Submission not found', 'SUBMISSION_NOT_FOUND', 404)

    const isOwner = submissionData.student_id === user.id

    if (!isOwner) {
        const access = await requireClassRole(
            supabase,
            submissionData.assignments.class_id,
            user.id,
            'instructor',
        )
        if (access.response) return access.response
    }

    const { assignments: _, ...submission } = submissionData
    return NextResponse.json({ data: submission }, { status: 200 })
}
