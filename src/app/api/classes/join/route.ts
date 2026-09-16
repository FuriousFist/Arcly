import { err, requireUser } from '@/lib/api'
import { NextResponse } from 'next/server'

export async function POST(req: Request) {
    const auth = await requireUser()
    if (auth.response) return auth.response
    const { supabase, user } = auth

    const { inviteCode } = await req.json()

    if (!inviteCode || typeof inviteCode !== 'string')
        return err('Invite code not valid', 'INVALID_INVITE_CODE', 400)

    const { data: classData } = await supabase
        .from('classes')
        .select('id, name')
        .eq('invite_code', inviteCode)
        .single()

    if (!classData) return err('Class does not exist', 'CLASS_NOT_FOUND', 404)

    const { data: studentInClass } = await supabase
        .from('class_members')
        .select('user_id')
        .eq('class_id', classData.id)
        .eq('user_id', user.id)
        .single()

    if (studentInClass) return err('Student in class', 'ALREADY_A_MEMBER', 409)

    const { error: insertError } = await supabase
        .from('class_members')
        .insert([{ class_id: classData.id, user_id: user.id, role: 'student' }])

    if (insertError) return err('Cannot assign class', 'CANNOT_JOIN_CLASS', 500)

    return NextResponse.json({ class: classData }, { status: 201 })
}
