// vault: vault/tickets/v1/v1-2.3-assignment-builder.md

import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import AssignmentForm from '../../AssignmentForm'

export default async function EditAssignmentPage({
    params,
}: {
    params: Promise<{ id: string; assignmentId: string }>
}) {
    const { id, assignmentId } = await params

    const supabase = await createClient()
    const {
        data: { user },
    } = await supabase.auth.getUser()

    if (!user) redirect('/login')

    const { data: userRole } = await supabase.from('users').select('role').eq('id', user.id).single()
    if (userRole?.role !== 'instructor') redirect('/join')

    const { data: assignment } = await supabase.from('assignments').select('*').eq('id', assignmentId).single()

    if (!assignment || assignment.class_id !== id) redirect(`/classes/${id}`)
    if (assignment.status !== 'draft') redirect(`/classes/${id}`)

    return <AssignmentForm classId={id} assignment={assignment} />
}
