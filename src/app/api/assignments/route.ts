import { err } from "@/lib/api"
import { createClient } from "@/lib/supabase/server"
import { NextResponse } from "next/server"

export async function POST(req: Request) {
    
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return err('Unauthorised', 'unauthorised', 401)

    const { class_id, title, brief, due_at, rubric_json, submission_types } = await req.json()

    if (!class_id || !title) return err('Missing parameters', 'MISSING_PARAMETERS', 400)

    const { data: membership } = await supabase
      .from('class_members') 
      .select('role')
      .eq('class_id', class_id)
      .eq('user_id', user.id)
      .single()
    
    if (!membership || membership?.role !== 'instructor') return err('Forbidden', 'FORBIDDEN', 403)

    const { error: assignmentError, data: newAssignment } = await supabase
      .from('assignments')
      .insert([{
        class_id,
        title,
        brief,
        due_at,
        rubric_json,
        submission_types
      }])
      .select()
      .single()

    if (assignmentError) return err('Cannot create assignment', 'CANNOT_CREATE_ASSIGNMENT', 500)

    return NextResponse.json(newAssignment, { status: 201 })
}
    
    
