import { err } from "@/lib/api"
import { createClient } from "@/lib/supabase/server"
import { NextResponse } from "next/server"

export async function GET(req: Request, { params }: { params: { id: string } }) {
    const { id } = await params

    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return err('Unauthorised', 'unauthorised', 401)

    const { data: classData, error: classError } = await supabase
        .from('classes')
        .select( '*, class_members(*), assignments(*)' )
        .eq('id', id)
        .single()

    if (classError) return err('Cannot get class', 'CANNOT_GET_CLASS', 500)
    if (!classData) return err('Class not found', 'CLASS_NOT_FOUND', 404)

    return NextResponse.json({ data : classData })
}