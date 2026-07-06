import { err } from "@/lib/api"
import { createClient } from "@/lib/supabase/server"
import { NextResponse } from "next/server"

export async function POST(req: Request) {
    
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return err('Unauthorised', 'unauthorised', 401)
    
    const { assignment_id, text_content, file_urls } = await req.json()

    if (!assignment_id || (!text_content && !file_urls)) return err('Missing parameters', 'MISSING_PARAMETERS', 400)

    const { data: assignment , error: submissionError } = await supabase
        .from('assignments')
        .select( 'class_id' )
        .eq('id', assignment_id)
        .single()

    if (submissionError) return err('Cannot get assignment', 'CANNOT_GET_ASSIGNMENT', 500)
    if (!assignment) return err('Assignment not found', 'ASSIGNMENT_NOT_FOUND', 404)

    const { data: membership } = await supabase
      .from('class_members') 
      .select('role')
      .eq('class_id', assignment.class_id)
      .eq('user_id', user.id)
      .single()
    
    if (!membership || membership?.role !== 'student') return err('Forbidden', 'FORBIDDEN', 403)

    const { data: pastSubmission } = await supabase
        .from('submissions')
        .select('id')
        .eq('assignment_id', assignment_id)
        .eq('student_id', user.id)
        .single()

    if (pastSubmission) return err('Submission already exists', 'SUBMISSION_ALREADY_EXISTS', 409)

    const { error: newSubmissionError, data: newSubmission } = await supabase
      .from('submissions')
      .insert([{
        assignment_id: assignment_id,
        student_id: user.id,
        text_content,
        file_urls
      }])
      .select()
      .single()

    if (newSubmissionError) return err('Cannot create submission', 'CANNOT_CREATE_SUBMISSION', 500)
        
    return NextResponse.json(newSubmission, { status: 201 })
}