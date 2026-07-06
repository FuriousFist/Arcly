import { err } from "@/lib/api"
import { createClient } from "@/lib/supabase/server"
import { NextResponse } from "next/server"

export async function GET(req: Request, { params }: { params: { id: string } }) {
    const { id } = await params

    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return err('Unauthorised', 'unauthorised', 401)

    const { data: submissionData, error: submissionError } = await supabase
        .from( 'submissions' )
        .select( '*' )
        .eq('id', id)
        .single()
    if (submissionError) return err('Cannot get submission', 'CANNOT_GET_SUBMISSION', 500)
    if (!submissionData) return err('Submission not found', 'SUBMISSION_NOT_FOUND', 404)

    const isOwner = submissionData?.student_id === user.id

    const isInstructor = submissionData.assignments?.classes?.class_members?.some(
      (m: { user_id: string, role: string }) => m.user_id === user.id && m.role === 'instructor'
    )

    if (!isOwner && !isInstructor) return err('Forbidden', 'FORBIDDEN', 403)

    return NextResponse.json({ data: submissionData}, { status: 200 })
}