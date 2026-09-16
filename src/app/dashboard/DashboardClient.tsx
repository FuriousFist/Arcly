"use client"

import Link from "next/link"
import { useEffect, useState } from "react"
import Button from "@/components/ui/Button"
import Card from "@/components/ui/Card"
import Input from "@/components/ui/Input"
import FullScreenMessage from "@/components/ui/FullScreenMessage"

type ClassSummary = {
    id: string
    name: string
    student_count: number
    ungraded_count: number
}

type RecentSubmission = {
    id: string
    assignment_id: string
    submitted_at: string
    status: string
    assignment_title: string | null
}

type UpcomingDueDate = {
    id: string
    class_id: string
    due_at: string
    title: string
}

export default function DashboardClient() {

    const [error, setError] = useState('')
    const [classes, setClasses] = useState<ClassSummary[]>([])
    const [recentSubmissions, setRecentSubmissions] = useState<RecentSubmission[]>([])
    const [upcomingDueDates, setUpcomingDueDates] = useState<UpcomingDueDate[]>([])
    const [loading, setLoading] = useState(true)

    const [showCreateForm, setShowCreateForm] = useState(false)
    const [newClassName, setNewClassName] = useState('')
    const [createError, setCreateError] = useState('')
    const [creating, setCreating] = useState(false)

    useEffect(() => {
        async function loadDashboardData() {
            try {
                const [classesRes, dashboardRes] = await Promise.all([
                    fetch('/api/classes'),
                    fetch('/api/dashboard')
                ])

                if (!classesRes.ok) {
                    setError('Failed to load classes')
                    return
                }

                if (!dashboardRes.ok) {
                    setError('Failed to load dashboard data')
                    return
                }

                const classesData = await classesRes.json()
                const dashboardData = await dashboardRes.json()

                const instructorClasses = classesData.data.filter((c: any) => c.role === 'instructor')
                const merged = instructorClasses.map((entry: any) => {
                    const stats = dashboardData.classes.find((c: any) => c.class_id === entry.classes.id)
                    return {
                        id: entry.classes.id,
                        name: entry.classes.name,
                        student_count: stats?.student_count ?? 0,
                        ungraded_count: stats?.ungraded_count ?? 0,
                    }
                })

                setClasses(merged)
                setRecentSubmissions(dashboardData.recentSubmissions)
                setUpcomingDueDates(dashboardData.upcomingDueDates)

            } catch (err) {
                setError('An unexpected error occurred')
            } finally {
                setLoading(false)
            }
        }
        loadDashboardData()
    }, [])

    async function handleCreateClass() {
        if (creating) return

        setCreateError('')

        if (!newClassName.trim()) {
            setCreateError('Class name is required')
            return
        }

        setCreating(true)

        try {
            const res = await fetch('/api/classes', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ name: newClassName.trim() })
            })
            if (!res.ok) {
                setCreateError('Failed to create class')
                return
            }
            const data = await res.json()
            const newClass = {
                id: data.class.id,
                name: data.class.name,
                student_count: 0,
                ungraded_count: 0,
            }
            setClasses((prev) => [...prev, newClass])
            setNewClassName('')
            setShowCreateForm(false)
        } catch (err) {
            setCreateError('An unexpected error occurred')
        } finally {
            setCreating(false)
        }
    }

    function closeCreateForm() {
        setShowCreateForm(false)
        setNewClassName('')
        setCreateError('')
    }

    const createFormOverlay = showCreateForm && (
        <div
            className="fixed inset-0 flex items-center justify-center px-4"
            style={{ backgroundColor: 'rgba(0,0,0,0.6)' }}
        >
            <Card className="flex flex-col gap-4 p-6 w-full max-w-sm">
                <h2 className="text-lg font-medium text-fg">Create a class</h2>
                <Input
                    type="text"
                    value={newClassName}
                    onChange={(e) => setNewClassName(e.target.value)}
                    placeholder="Class name"
                />
                {createError && <p className="text-danger">{createError}</p>}
                <div className="flex gap-3 justify-end">
                    <Button variant="secondary" onClick={closeCreateForm} disabled={creating}>
                        Cancel
                    </Button>
                    <Button onClick={handleCreateClass} disabled={creating}>
                        {creating ? 'Creating...' : 'Create'}
                    </Button>
                </div>
            </Card>
        </div>
    )

    if (loading) {
        return <FullScreenMessage><p>Loading...</p></FullScreenMessage>
    }

    if (error) {
        return <FullScreenMessage><p>{error}</p></FullScreenMessage>
    }

    if (classes.length === 0) {
        return (
            <>
                <FullScreenMessage>
                    <p>You don't have any classes yet.</p>
                    <Button onClick={() => setShowCreateForm(true)} className="px-6 py-3">
                        Create a class
                    </Button>
                </FullScreenMessage>
                {createFormOverlay}
            </>
        )
    }

    return (
        <>
            <div className="flex min-h-screen flex-col gap-8 px-8 py-12 bg-bg">
                <div className="flex items-center justify-between">
                    <h1 className="text-2xl font-semibold text-fg">Your classes</h1>
                    <Button onClick={() => setShowCreateForm(true)} className="px-6 py-3">
                        Create a class
                    </Button>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6">
                    {classes.map((c) => (
                        <Link
                            key={c.id}
                            href={`/classes/${c.id}`}
                            className="flex flex-col gap-3 rounded-lg p-5 transition-opacity hover:opacity-90 bg-surface border border-border"
                        >
                            <h2 className="text-lg font-medium text-fg">{c.name}</h2>
                            <p className="text-sm opacity-60 text-fg">
                                {c.student_count} student{c.student_count === 1 ? '' : 's'}
                            </p>
                            {c.ungraded_count > 0 && (
                                <span className="self-start px-3 py-1 rounded-full text-xs font-medium bg-accent text-fg">
                                    {c.ungraded_count} ungraded
                                </span>
                            )}
                        </Link>
                    ))}
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                    <div className="flex flex-col gap-3">
                        <h2 className="text-lg font-medium text-fg">New submissions</h2>
                        {recentSubmissions.length === 0 ? (
                            <p className="text-sm opacity-60 text-fg">Nothing submitted yet.</p>
                        ) : (
                            <div className="flex flex-col gap-2">
                                {recentSubmissions.map((s) => (
                                    <Card key={s.id} className="flex items-center justify-between p-3">
                                        <span className="text-sm text-fg">
                                            {s.assignment_title ?? 'Untitled assignment'}
                                        </span>
                                        <span className="text-xs opacity-60 text-fg">
                                            {new Date(s.submitted_at).toLocaleDateString()}
                                        </span>
                                    </Card>
                                ))}
                            </div>
                        )}
                    </div>

                    <div className="flex flex-col gap-3">
                        <h2 className="text-lg font-medium text-fg">Due soon</h2>
                        {upcomingDueDates.length === 0 ? (
                            <p className="text-sm opacity-60 text-fg">Nothing due in the next 48 hours.</p>
                        ) : (
                            <div className="flex flex-col gap-2">
                                {upcomingDueDates.map((d) => (
                                    <Card key={d.id} className="flex items-center justify-between p-3">
                                        <div className="flex flex-col">
                                            <span className="text-sm text-fg">{d.title}</span>
                                            <span className="text-xs opacity-60 text-fg">
                                                {classes.find((c) => c.id === d.class_id)?.name}
                                            </span>
                                        </div>
                                        <span className="text-xs opacity-60 text-fg">
                                            {new Date(d.due_at).toLocaleDateString()}
                                        </span>
                                    </Card>
                                ))}
                            </div>
                        )}
                    </div>
                </div>
            </div>
            {createFormOverlay}
        </>
    )
}
