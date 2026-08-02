"use client"

import { useEffect, useState } from "react"

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

                if(!classesRes.ok) {
                    setError('Failed to load classes')
                    return
                }

                if(!dashboardRes.ok) {
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
            <div
                className="flex flex-col gap-4 rounded-lg p-6 w-full max-w-sm"
                style={{ backgroundColor: '#1a1a24', border: '1px solid #2a2a3a' }}
            >
                <h2 className="text-lg font-medium" style={{ color: '#f4f3f1' }}>
                    Create a class
                </h2>
                <input
                    type="text"
                    value={newClassName}
                    onChange={(e) => setNewClassName(e.target.value)}
                    placeholder="Class name"
                    className="rounded-lg px-4 py-2 text-sm w-full"
                    style={{ backgroundColor: '#0c0c10', color: '#f4f3f1', border: '1px solid #2a2a3a' }}
                />
                {createError && <p style={{ color: '#f87171' }}>{createError}</p>}
                <div className="flex gap-3 justify-end">
                    <button
                        onClick={closeCreateForm}
                        disabled={creating}
                        className="px-4 py-2 rounded-lg text-sm font-medium disabled:opacity-50"
                        style={{ backgroundColor: '#2a2a3a', color: '#f4f3f1' }}
                    >
                        Cancel
                    </button>
                    <button
                        onClick={handleCreateClass}
                        disabled={creating}
                        className="px-4 py-2 rounded-lg text-sm font-medium transition-opacity hover:opacity-90 disabled:opacity-50"
                        style={{ backgroundColor: '#3b82f6', color: '#f4f3f1' }}
                    >
                        {creating ? 'Creating...' : 'Create'}
                    </button>
                </div>
            </div>
        </div>
    )

    if (loading) {
        return (
            <div
                className="flex min-h-screen flex-col items-center justify-center gap-10"
                style={{ backgroundColor: '#0c0c10' }}
            >
                <p style={{ color: '#f4f3f1' }}>Loading...</p>
            </div>
        )
    }

    if (error) {
        return (
            <div
                className="flex min-h-screen flex-col items-center justify-center gap-10"
                style={{ backgroundColor: '#0c0c10' }}
            >
                <p style={{ color: '#f4f3f1' }}>{error}</p>
            </div>
        )
    }

    if (classes.length === 0) {
        return (
            <>
                <div
                    className="flex min-h-screen flex-col items-center justify-center gap-6"
                    style={{ backgroundColor: '#0c0c10' }}
                >
                    <p style={{ color: '#f4f3f1' }}>You don't have any classes yet.</p>
                    <button
                        onClick={() => setShowCreateForm(true)}
                        className="px-6 py-3 rounded-lg text-sm font-medium transition-opacity hover:opacity-90"
                        style={{ backgroundColor: '#3b82f6', color: '#f4f3f1' }}
                    >
                        Create a class
                    </button>
                </div>
                {createFormOverlay}
            </>
        )
    }

    return (
        <>
            <div
                className="flex min-h-screen flex-col gap-8 px-8 py-12"
                style={{ backgroundColor: '#0c0c10' }}
            >
                <div className="flex items-center justify-between">
                    <h1 className="text-2xl font-semibold" style={{ color: '#f4f3f1' }}>
                        Your classes
                    </h1>
                    <button
                        onClick={() => setShowCreateForm(true)}
                        className="px-6 py-3 rounded-lg text-sm font-medium transition-opacity hover:opacity-90"
                        style={{ backgroundColor: '#3b82f6', color: '#f4f3f1' }}
                    >
                        Create a class
                    </button>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6">
                    {classes.map((c) => (
                        <div
                            key={c.id}
                            className="flex flex-col gap-3 rounded-lg p-5"
                            style={{ backgroundColor: '#1a1a24', border: '1px solid #2a2a3a' }}
                        >
                            <h2 className="text-lg font-medium" style={{ color: '#f4f3f1' }}>
                                {c.name}
                            </h2>
                            <p className="text-sm opacity-60" style={{ color: '#f4f3f1' }}>
                                {c.student_count} student{c.student_count === 1 ? '' : 's'}
                            </p>
                            {c.ungraded_count > 0 && (
                                <span
                                    className="self-start px-3 py-1 rounded-full text-xs font-medium"
                                    style={{ backgroundColor: '#3b82f6', color: '#f4f3f1' }}
                                >
                                    {c.ungraded_count} ungraded
                                </span>
                            )}
                        </div>
                    ))}
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                    <div className="flex flex-col gap-3">
                        <h2 className="text-lg font-medium" style={{ color: '#f4f3f1' }}>
                            New submissions
                        </h2>
                        {recentSubmissions.length === 0 ? (
                            <p className="text-sm opacity-60" style={{ color: '#f4f3f1' }}>
                                Nothing submitted yet.
                            </p>
                        ) : (
                            <div className="flex flex-col gap-2">
                                {recentSubmissions.map((s) => (
                                    <div
                                        key={s.id}
                                        className="flex items-center justify-between rounded-lg p-3"
                                        style={{ backgroundColor: '#1a1a24', border: '1px solid #2a2a3a' }}
                                    >
                                        <span className="text-sm" style={{ color: '#f4f3f1' }}>
                                            {s.assignment_title ?? 'Untitled assignment'}
                                        </span>
                                        <span className="text-xs opacity-60" style={{ color: '#f4f3f1' }}>
                                            {new Date(s.submitted_at).toLocaleDateString()}
                                        </span>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>

                    <div className="flex flex-col gap-3">
                        <h2 className="text-lg font-medium" style={{ color: '#f4f3f1' }}>
                            Due soon
                        </h2>
                        {upcomingDueDates.length === 0 ? (
                            <p className="text-sm opacity-60" style={{ color: '#f4f3f1' }}>
                                Nothing due in the next 48 hours.
                            </p>
                        ) : (
                            <div className="flex flex-col gap-2">
                                {upcomingDueDates.map((d) => (
                                    <div
                                        key={d.id}
                                        className="flex items-center justify-between rounded-lg p-3"
                                        style={{ backgroundColor: '#1a1a24', border: '1px solid #2a2a3a' }}
                                    >
                                        <div className="flex flex-col">
                                            <span className="text-sm" style={{ color: '#f4f3f1' }}>
                                                {d.title}
                                            </span>
                                            <span className="text-xs opacity-60" style={{ color: '#f4f3f1' }}>
                                                {classes.find((c) => c.id === d.class_id)?.name}
                                            </span>
                                        </div>
                                        <span className="text-xs opacity-60" style={{ color: '#f4f3f1' }}>
                                            {new Date(d.due_at).toLocaleDateString()}
                                        </span>
                                    </div>
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