import { err, requireUser, requireClassRole } from '@/lib/api'
import { NextResponse } from 'next/server'

export async function GET(_req: Request, { params }: { params: Promise<{ id: string }> }) {
    const { id } = await params
    const auth = await requireUser()
    if (auth.response) return auth.response
    const { supabase, user } = auth

    const { data: classData, error: classError } = await supabase
        .from('classes')
        .select('*, class_members(*, users(name, email)), assignments(*, submissions(count))')
        .eq('id', id)
        .single()

    if (classError) return err('Cannot get class', 'CANNOT_GET_CLASS', 500)
    if (!classData) return err('Class not found', 'CLASS_NOT_FOUND', 404)

    const access = await requireClassRole(supabase, id, user.id, 'instructor')
    if (access.response) return access.response

    return NextResponse.json({ data: classData })
}

export async function DELETE(_req: Request, { params }: { params: Promise<{ id: string }> }) {
    const { id } = await params
    const auth = await requireUser()
    if (auth.response) return auth.response
    const { supabase, user } = auth

    const access = await requireClassRole(supabase, id, user.id, 'instructor')
    if (access.response) return access.response

    const { error: deleteError } = await supabase.from('classes').delete().eq('id', id)

    if (deleteError) return err('Cannot delete class', 'CANNOT_DELETE_CLASS', 500)
    return NextResponse.json({ success: true })
}
