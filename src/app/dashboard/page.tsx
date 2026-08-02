// vault: vault/tickets/v1/v1-2.1-instructor-dashboard.md

import { createClient } from "@/lib/supabase/server"
import { redirect } from "next/navigation"
import DashboardClient from "./DashboardClient"

export default async function DashboardPage() {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    
    if (!user) {
        redirect('/login')
    }

    const { data: userRole } = await supabase
        .from('users')
        .select('role')
        .eq('id', user.id)
        .single()

    if (userRole?.role !== "instructor") {
        redirect('/join')
    }

    return <DashboardClient />

}