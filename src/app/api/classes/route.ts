import { createClient } from "@/lib/supabase/server"
import { err } from "@/lib/api"
import { NextResponse } from "next/server"
import { generateUniqueInviteCode } from "@/lib/invite-code"

export async function GET(req: Request) {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return err('Unauthorised', 'unauthorised', 401)

    const { data: classes  } = await supabase
        .from( 'class_members' )
        .select( 'role, classes(*)' )
        .eq('user_id', user.id)
        
    return NextResponse.json({ data: classes }, { status: 200 })
}

export async function POST(req: Request) {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return err('Unauthorised', 'unauthorised', 401)

    const { data: userData } = await supabase
        .from('users')
        .select('role')
        .eq('id', user.id)
        .single()

    if(userData?.role !== "instructor") return err('Forbidden', 'FORBIDDEN', 403)
    
    const { name } = await req.json() 
    if (!name) return err('Missing name', 'MISSING_NAME', 400)
    
    const inviteCode = await generateUniqueInviteCode(supabase)
    const classId = crypto.randomUUID()

    const { error: classError } = await supabase
        .from('classes')
        .insert([{
            id: classId,
            name,
            invite_code: inviteCode,
            instructor_id: user.id
        }])

    if (classError) return err('Cannot create class', 'CANNOT_CREATE_CLASS', 500)

    const { error: memberError } = await supabase
        .from('class_members')
        .insert([{
            class_id: classId,
            user_id: user.id,
            role: 'instructor'
        }])

    if (memberError) return err('Cannot assign class', 'CANNOT_ASSIGN_CLASS', 500)

    return NextResponse.json({ class: { id: classId, name, invite_code: inviteCode } }, { status: 201 })
}
