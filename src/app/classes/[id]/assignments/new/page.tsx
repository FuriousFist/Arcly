// vault: vault/tickets/v1/v1-2.3-assignment-builder.md

import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import AssignmentForm from '../AssignmentForm'

export default async function NewAssignmentPage({ params }: { params: Promise<{ id: string }> }) {
    const { id } = await params

    const supabase = await createClient()
    const {
        data: { user },
    } = await supabase.auth.getUser()

    if (!user) redirect('/login')

    const { data: userRole } = await supabase.from('users').select('role').eq('id', user.id).single()
    if (userRole?.role !== 'instructor') redirect('/join')

    return <AssignmentForm classId={id} />
}
