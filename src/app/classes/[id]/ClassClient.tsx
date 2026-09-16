// vault: vault/tickets/v1/v1-2.2-class-management-ui.md

"use client"

import Link from "next/link"
import { useEffect, useState } from "react"
import Button from "@/components/ui/Button"
import Card from "@/components/ui/Card"
import FullScreenMessage from "@/components/ui/FullScreenMessage"

type Tab = 'assignments' | 'members' | 'ai'

type Member = {
    user_id: string
    role: 'student' | 'instructor'
    joined_at: string
    users: { name: string | null; email: string | null } | null
}

type Assignment = {
    id: string
    title: string
    status: 'draft' | 'published' | 'closed'
    due_at: string | null
    submissions: { count: number }[]
}

type ClassData = {
    id: string
    name: string
    description: string | null
    invite_code: string
    class_members: Member[]
    assignments: Assignment[]
}

const TABS: { key: Tab; label: string }[] = [
    { key: 'assignments', label: 'Assignments' },
    { key: 'members', label: 'Members' },
    { key: 'ai', label: 'AI Assistant' },
]

const STATUS_COLORS: Record<Assignment['status'], string> = {
    draft: '#6b7280',
    published: '#3b82f6',
    closed: '#a855f7',
}

export default function ClassClient({ classId }: { classId: string }) {

    const [loading, setLoading] = useState(true)
    const [error, setError] = useState('')
    const [classData, setClassData] = useState<ClassData | null>(null)

    const [tab, setTab] = useState<Tab>('assignments')
    const [copied, setCopied] = useState(false)
    const [removingId, setRemovingId] = useState<string | null>(null)
    const [removeError, setRemoveError] = useState('')

    useEffect(() => {
        async function loadClass() {
            try {
                const res = await fetch(`/api/classes/${classId}`)
                if (!res.ok) {
                    setError(res.status === 404 ? 'Class not found' : 'Failed to load class')
                    return
                }
                const json = await res.json()
                setClassData(json.data)
            } catch (err) {
                setError('An unexpected error occurred')
            } finally {
                setLoading(false)
            }
        }
        loadClass()
    }, [classId])

    async function handleCopyInviteCode() {
        if (!classData) return
        try {
            await navigator.clipboard.writeText(classData.invite_code)
            setCopied(true)
            setTimeout(() => setCopied(false), 2000)
        } catch (err) {
            // Clipboard can be unavailable (insecure context / permissions) — fail quietly
        }
    }

    async function handleRemoveMember(member: Member) {
        if (removingId) return

        const label = member.users?.name ?? member.users?.email ?? 'this student'
        if (!window.confirm(`Remove ${label} from the class?`)) return

        setRemoveError('')
        setRemovingId(member.user_id)

        try {
            const res = await fetch(`/api/classes/${classId}/members/${member.user_id}`, {
                method: 'DELETE',
            })
            if (!res.ok) {
                setRemoveError('Failed to remove student')
                return
            }
            setClassData((prev) =>
                prev
                    ? { ...prev, class_members: prev.class_members.filter((m) => m.user_id !== member.user_id) }
                    : prev
            )
        } catch (err) {
            setRemoveError('An unexpected error occurred')
        } finally {
            setRemovingId(null)
        }
    }

    if (loading) {
        return <FullScreenMessage><p>Loading...</p></FullScreenMessage>
    }

    if (error || !classData) {
        return (
            <FullScreenMessage>
                <p>{error || 'Class not found'}</p>
                <Link href="/dashboard" className="text-sm underline opacity-60 text-fg">
                    Back to dashboard
                </Link>
            </FullScreenMessage>
        )
    }

    const students = classData.class_members.filter((m) => m.role === 'student')

    const membersPanel = (
        <div className="flex flex-col gap-3">
            <h2 className="text-lg font-medium text-fg">Members</h2>
            {removeError && <p className="text-sm text-danger">{removeError}</p>}
            {students.length === 0 ? (
                <p className="text-sm opacity-60 text-fg">
                    No students have joined yet. Share the invite code to get started.
                </p>
            ) : (
                <div className="flex flex-col gap-2">
                    {students.map((m) => (
                        <Card key={m.user_id} className="flex items-center justify-between p-3">
                            <div className="flex flex-col">
                                <span className="text-sm text-fg">{m.users?.name ?? 'Unnamed student'}</span>
                                <span className="text-xs opacity-60 text-fg">{m.users?.email ?? ''}</span>
                            </div>
                            <div className="flex items-center gap-4">
                                <span className="text-xs opacity-60 text-fg">
                                    Joined {new Date(m.joined_at).toLocaleDateString()}
                                </span>
                                <Button
                                    variant="danger"
                                    onClick={() => handleRemoveMember(m)}
                                    disabled={removingId !== null}
                                    className="px-3 py-1 text-xs"
                                >
                                    {removingId === m.user_id ? 'Removing...' : 'Remove'}
                                </Button>
                            </div>
                        </Card>
                    ))}
                </div>
            )}
        </div>
    )

    const assignmentsPanel = (
        <div className="flex flex-col gap-3">
            <div className="flex items-center justify-between">
                <h2 className="text-lg font-medium text-fg">Assignments</h2>
                <Link
                    href={`/classes/${classId}/assignments/new`}
                    className="px-4 py-2 rounded-lg text-sm font-medium transition-opacity hover:opacity-90 bg-accent text-fg"
                >
                    Create assignment
                </Link>
            </div>
            {classData.assignments.length === 0 ? (
                <p className="text-sm opacity-60 text-fg">No assignments yet.</p>
            ) : (
                <div className="flex flex-col gap-2">
                    {classData.assignments.map((a) => {
                        const submissionCount = a.submissions[0]?.count ?? 0
                        return (
                            <Card key={a.id} className="flex items-center justify-between p-3">
                                <div className="flex flex-col">
                                    <span className="text-sm text-fg">{a.title}</span>
                                    {a.due_at && (
                                        <span className="text-xs opacity-60 text-fg">
                                            Due {new Date(a.due_at).toLocaleDateString()}
                                        </span>
                                    )}
                                </div>
                                <div className="flex items-center gap-4">
                                    <span className="text-xs opacity-60 text-fg">
                                        {submissionCount} submission{submissionCount === 1 ? '' : 's'}
                                    </span>
                                    <span
                                        className="px-3 py-1 rounded-full text-xs font-medium capitalize text-fg"
                                        style={{ backgroundColor: STATUS_COLORS[a.status] }}
                                    >
                                        {a.status}
                                    </span>
                                </div>
                            </Card>
                        )
                    })}
                </div>
            )}
        </div>
    )

    const aiPanel = (
        <div className="flex flex-col gap-3">
            <h2 className="text-lg font-medium text-fg">AI Assistant</h2>
            <p className="text-sm opacity-60 text-fg">Coming soon.</p>
        </div>
    )

    return (
        <div className="flex min-h-screen bg-bg">
            <aside className="flex w-56 shrink-0 flex-col gap-6 px-4 py-8 bg-surface border-r border-border">
                <Link href="/dashboard" className="text-xs opacity-60 hover:opacity-100 text-fg">
                    ← Dashboard
                </Link>
                <nav className="flex flex-col gap-1">
                    {TABS.map((t) => (
                        <button
                            key={t.key}
                            onClick={() => setTab(t.key)}
                            className={`rounded-lg px-3 py-2 text-left text-sm font-medium transition-opacity hover:opacity-90 text-fg ${tab === t.key ? 'bg-border opacity-100' : 'opacity-70'}`}
                        >
                            {t.label}
                        </button>
                    ))}
                </nav>
            </aside>

            <main className="flex flex-1 flex-col gap-8 px-8 py-12">
                <div className="flex items-center justify-between gap-6">
                    <div className="flex flex-col gap-1">
                        <h1 className="text-2xl font-semibold text-fg">{classData.name}</h1>
                        <p className="text-sm opacity-60 text-fg">
                            {students.length} student{students.length === 1 ? '' : 's'}
                        </p>
                    </div>
                    <div className="flex items-center gap-3">
                        <span className="font-mono text-sm text-fg">{classData.invite_code}</span>
                        <Button variant="secondary" onClick={handleCopyInviteCode}>
                            {copied ? 'Copied!' : 'Copy invite code'}
                        </Button>
                    </div>
                </div>

                {tab === 'assignments' && assignmentsPanel}
                {tab === 'members' && membersPanel}
                {tab === 'ai' && aiPanel}
            </main>
        </div>
    )
}
