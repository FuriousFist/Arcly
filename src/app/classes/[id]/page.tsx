// vault: vault/tickets/v1/v1-2.2-class-management-ui.md

import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import ClassClient from './ClassClient'

export default async function ClassPage({ params }: { params: Promise<{ id: string }> }) {
    const { id } = await params

    const supabase = await createClient()
    const {
        data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
        redirect('/login')
    }

    const { data: userRole } = await supabase.from('users').select('role').eq('id', user.id).single()

    if (userRole?.role !== 'instructor') {
        redirect('/join')
    }

    return <ClassClient classId={id} />
}
