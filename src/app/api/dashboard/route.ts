/*
Routing function for the instructor dashboard. retrieves classes, student counts, submission counts
recent sumbissions and upcoming due dates for the instructor's classes.
*/

// vault: vault/tickets/v1/v1-2.1-instructor-dashboard.md

import { createClient } from "@/lib/supabase/server"
import { err } from "@/lib/api"
import { NextResponse } from "next/server"

export async function GET(req: Request) {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return err('Unauthorised', 'unauthorised', 401)

    // Get the classes where the user is an instructor
    const { data: classes  } = await supabase
        .from( 'class_members' )
        .select( 'class_id' )
        .eq('user_id', user.id)
        .eq('role', 'instructor')

    if (!classes || classes.length === 0) {
        return NextResponse.json({ classes: [], recentSubmissions: [], upcomingDueDates: [] })
    }

    const classIds = classes.map(c => c.class_id)

    // Get the student counts for each class
    const { data: studentCount } = await supabase
        .from('class_members')
        .select('class_id')
        .eq('role', 'student')
        .in('class_id', classIds)

    const studentCountMap = new Map<string, number>()

    studentCount?.forEach(({ class_id }) => { //map the student counts to their respective class ids
        studentCountMap.set(class_id, (studentCountMap.get(class_id) ?? 0) + 1)
    })

    // Get the submission counts for each class
    const { data: assignments } = await supabase
        .from('assignments')
        .select('id, class_id, title')
        .in('class_id', classIds)

    const assignmentIds = new Map(assignments?.map(a => [a.id, a.class_id]))
    const assignmentTitles = new Map(assignments?.map(a => [a.id, a.title]))
    const submissionCountMap = new Map<string, number>()

    if (assignmentIds.size > 0 ) {
        const { data: submissions } = await supabase
            .from('submissions')
            .select('assignment_id, status')
            .in('assignment_id', Array.from(assignmentIds.keys()))
            .eq('status', 'submitted')

        submissions?.forEach(({ assignment_id }) => {
            const classId = assignmentIds.get(assignment_id)
            if (classId) {
                submissionCountMap.set(classId, (submissionCountMap.get(classId) ?? 0) + 1)
            }
        })
    }

    // getting the 10 most recent submissions for the instructor's classes
    const recentSubmissions = assignmentIds.size > 0
        ? ((await supabase
            .from('submissions')
            .select('id, assignment_id, submitted_at, status')
            .in('assignment_id', Array.from(assignmentIds.keys()))
            .order('submitted_at', { ascending: false })
            .limit(10)
          ).data ?? []).map((submission) => ({
              ...submission,
              assignment_title: assignmentTitles.get(submission.assignment_id) ?? null,
          }))
        : []

    // getting the 10 upcoming due dates for the instructor's classes
    const in48h = new Date(Date.now() + 48 * 60 * 60 * 1000).toISOString()

    const upcomingDueDates = assignmentIds.size > 0
        ? (await supabase
            .from('assignments')
            .select('id, class_id, due_at, title')
            .in('class_id', classIds)
            .eq('status', 'published')
            .gte('due_at', new Date().toISOString()).lte('due_at', in48h)
            .order('due_at', { ascending: true })
            .limit(10)
          ).data ?? []
        : []

    // structure returned in the reponse: class_id, student_count, ungraded_count
    // for display on main dashboard page.
    const classesReturn = classIds.map( id => ({
        class_id: id,
        student_count: studentCountMap.get(id) ?? 0,
        ungraded_count: submissionCountMap.get(id) ?? 0
    }))

    return NextResponse.json({ classes: classesReturn, recentSubmissions, upcomingDueDates })
}
