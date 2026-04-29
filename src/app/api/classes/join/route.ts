import { createClient } from "@/lib/supabase/server"
import { NextResponse } from 'next/server';

export async function POST(req: Request) {

    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return  NextResponse.json({ error: 'Unauthorised' }, { status: 401 })

    const { inviteCode } = await req.json()

    if(!inviteCode || typeof inviteCode != "string") 
        return NextResponse.json({error: "Invite code not valid"}, {status: 400})

    const { data: classData } = await supabase.from('classes')
                                                        .select('id, name')
                                                        .eq('invite_code', inviteCode)
                                                        .single()
    
    if(!classData) return NextResponse.json({error: "Class does not exist"}, {status: 404})

    const { data: studentInClass } = await supabase.from('class_members')
                                                   .select('user_id')
                                                   .eq('class_id', classData.id)
                                                   .eq('user_id', user.id)
                                                   .single()

    if (studentInClass) return NextResponse.json({ error: "Student in class"}, { status: 409})

    const { error: updateError } = await supabase.from('class_members')
                                                 .insert([{
                                                          class_id: classData.id,
                                                          user_id: user.id,
                                                          role: 'student',
                                                        }])
    
    if (updateError) return NextResponse.json({error: "Cannot assign class"}, {status: 500})
    
    return NextResponse.json({ class: classData }, { status: 201 })                                                                                                                                                                                                           
}