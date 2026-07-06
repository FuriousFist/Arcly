import { err } from "@/lib/api"
import { createClient } from "@/lib/supabase/server"
import { NextResponse } from "next/server"

export async function GET(req: Request, { params }: { params: { id: string } }) {
    const { id } = await params

    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return err('Unauthorised', 'unauthorised', 401)

    const { data: assignmentData, error: assignmentError } = await supabase
        .from('assignments')
        .select( '*, classes(class_members(user_id))' )
        .eq('id', id)
        .single()

    if (assignmentError) return err('Cannot get assignment', 'CANNOT_GET_ASSIGNMENT', 500)
    if (!assignmentData) return err('Assignment not found', 'ASSIGNMENT_NOT_FOUND', 404)

    const isMember = assignmentData.classes?.class_members?.some(
      (m: { user_id: string }) => m.user_id === user.id
    )
    if (!isMember) return err('Assignment not found', 'ASSIGNMENT_NOT_FOUND', 404)
    
    const { classes: _, ...assignment } = assignmentData
    return NextResponse.json({ data: assignment })
}