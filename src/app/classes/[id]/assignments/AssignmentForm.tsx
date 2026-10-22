// vault: vault/tickets/v1/v1-2.3-assignment-builder.md

'use client'

import { useEditor, EditorContent } from '@tiptap/react'
import StarterKit from '@tiptap/starter-kit'
import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Button from '@/components/ui/Button'
import Input from '@/components/ui/Input'

type RubricRow = { name: string; description: string; max_marks: number }

export type AssignmentData = {
    id: string
    title: string
    brief: string | null
    due_at: string | null
    rubric_json: RubricRow[] | null
    submission_types: string[]
    status: 'draft' | 'published' | 'closed'
    class_id: string
}

export default function AssignmentForm({ classId, assignment }: { classId: string; assignment?: AssignmentData }) {
    const router = useRouter()
    const isEdit = !!assignment

    const [title, setTitle] = useState(assignment?.title ?? '')
    // datetime-local expects "YYYY-MM-DDTHH:mm" — slice off seconds/tz
    const [dueAt, setDueAt] = useState(assignment?.due_at ? assignment.due_at.slice(0, 16) : '')
    const [submissionTypes, setSubmissionTypes] = useState<string[]>(
        assignment?.submission_types?.length ? assignment.submission_types : ['text'],
    )
    const [rubric, setRubric] = useState<RubricRow[]>(assignment?.rubric_json ?? [])
    const [saving, setSaving] = useState(false)
    const [error, setError] = useState('')

    const editor = useEditor({
        extensions: [StarterKit],
        content: assignment?.brief ?? '',
        editorProps: {
            attributes: {
                class: 'min-h-[160px] p-3 text-sm text-fg focus:outline-none prose prose-invert max-w-none',
            },
        },
    })

    function toggleType(type: string) {
        setSubmissionTypes((prev) => (prev.includes(type) ? prev.filter((t) => t !== type) : [...prev, type]))
    }

    function updateRow(i: number, field: keyof RubricRow, value: string | number) {
        setRubric((prev) => prev.map((row, idx) => (idx === i ? { ...row, [field]: value } : row)))
    }

    async function save(status: 'draft' | 'published') {
        if (!title.trim()) {
            setError('Title is required')
            return
        }
        if (submissionTypes.length === 0) {
            setError('Select at least one submission type')
            return
        }
        setSaving(true)
        setError('')

        const body = {
            class_id: classId,
            title: title.trim(),
            brief: editor?.getHTML() ?? '',
            due_at: dueAt || null,
            rubric_json: rubric.length > 0 ? rubric : null,
            submission_types: submissionTypes,
            status,
        }

        try {
            const res = await fetch(isEdit ? `/api/assignments/${assignment!.id}` : '/api/assignments', {
                method: isEdit ? 'PATCH' : 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(body),
            })
            if (!res.ok) {
                const json = await res.json()
                setError(json.error ?? 'Failed to save assignment')
                return
            }
            router.push(`/classes/${classId}`)
        } catch {
            setError('An unexpected error occurred')
        } finally {
            setSaving(false)
        }
    }

    async function handleDelete() {
        if (!window.confirm('Delete this draft? This cannot be undone.')) return
        setSaving(true)
        try {
            const res = await fetch(`/api/assignments/${assignment!.id}`, { method: 'DELETE' })
            if (!res.ok) {
                const json = await res.json()
                setError(json.error ?? 'Failed to delete assignment')
                return
            }
            router.push(`/classes/${classId}`)
        } catch {
            setError('An unexpected error occurred')
        } finally {
            setSaving(false)
        }
    }

    const toolbarBtn = (label: string, active: boolean, onClick: () => void) => (
        <button
            type="button"
            onClick={onClick}
            className={`px-2 py-1 text-xs rounded font-medium transition-opacity hover:opacity-90 text-fg ${active ? 'bg-accent' : 'bg-border'}`}
        >
            {label}
        </button>
    )

    return (
        <div className="flex min-h-screen bg-bg">
            <main className="flex flex-1 flex-col gap-8 px-8 py-12 max-w-3xl">
                <div className="flex items-center gap-4">
                    <button
                        type="button"
                        onClick={() => router.push(`/classes/${classId}`)}
                        className="text-xs opacity-60 hover:opacity-100 text-fg"
                    >
                        ← Back
                    </button>
                    <h1 className="text-2xl font-semibold text-fg">
                        {isEdit ? 'Edit assignment' : 'New assignment'}
                    </h1>
                </div>

                {/* Title */}
                <div className="flex flex-col gap-2">
                    <label className="text-sm font-medium text-fg">Title *</label>
                    <Input
                        value={title}
                        onChange={(e) => setTitle(e.target.value)}
                        placeholder="Assignment title"
                    />
                </div>

                {/* Brief (rich text) */}
                <div className="flex flex-col gap-2">
                    <label className="text-sm font-medium text-fg">Brief</label>
                    <div className="rounded-lg border border-border bg-surface overflow-hidden">
                        <div className="flex gap-1 p-2 border-b border-border">
                            {toolbarBtn('B', editor?.isActive('bold') ?? false, () =>
                                editor?.chain().focus().toggleBold().run(),
                            )}
                            {toolbarBtn('I', editor?.isActive('italic') ?? false, () =>
                                editor?.chain().focus().toggleItalic().run(),
                            )}
                            {toolbarBtn('H1', editor?.isActive('heading', { level: 1 }) ?? false, () =>
                                editor?.chain().focus().toggleHeading({ level: 1 }).run(),
                            )}
                            {toolbarBtn('H2', editor?.isActive('heading', { level: 2 }) ?? false, () =>
                                editor?.chain().focus().toggleHeading({ level: 2 }).run(),
                            )}
                            {toolbarBtn('• List', editor?.isActive('bulletList') ?? false, () =>
                                editor?.chain().focus().toggleBulletList().run(),
                            )}
                        </div>
                        <EditorContent editor={editor} />
                    </div>
                </div>

                {/* Rubric */}
                <div className="flex flex-col gap-3">
                    <div className="flex items-center justify-between">
                        <label className="text-sm font-medium text-fg">Rubric (optional)</label>
                        <Button
                            variant="secondary"
                            onClick={() => setRubric((prev) => [...prev, { name: '', description: '', max_marks: 0 }])}
                            className="px-3 py-1 text-xs"
                        >
                            + Add criterion
                        </Button>
                    </div>
                    {rubric.length > 0 && (
                        <div className="flex flex-col gap-2">
                            {rubric.map((row, i) => (
                                <div key={i} className="flex gap-2 items-start p-3 rounded-lg border border-border bg-surface">
                                    <div className="flex flex-col gap-1 flex-1">
                                        <Input
                                            placeholder="Criterion name"
                                            value={row.name}
                                            onChange={(e) => updateRow(i, 'name', e.target.value)}
                                        />
                                        <Input
                                            placeholder="Description"
                                            value={row.description}
                                            onChange={(e) => updateRow(i, 'description', e.target.value)}
                                        />
                                    </div>
                                    <div className="flex flex-col gap-1 w-24">
                                        <Input
                                            type="number"
                                            placeholder="Max"
                                            min={0}
                                            value={row.max_marks}
                                            onChange={(e) => updateRow(i, 'max_marks', Number(e.target.value))}
                                        />
                                    </div>
                                    <button
                                        type="button"
                                        onClick={() => setRubric((prev) => prev.filter((_, idx) => idx !== i))}
                                        className="text-sm opacity-50 hover:opacity-100 text-danger mt-2"
                                    >
                                        ✕
                                    </button>
                                </div>
                            ))}
                        </div>
                    )}
                </div>

                {/* Due date */}
                <div className="flex flex-col gap-2">
                    <label className="text-sm font-medium text-fg">Due date (optional)</label>
                    <Input
                        type="datetime-local"
                        value={dueAt}
                        onChange={(e) => setDueAt(e.target.value)}
                        className="w-56"
                    />
                </div>

                {/* Submission types */}
                <div className="flex flex-col gap-2">
                    <label className="text-sm font-medium text-fg">Submission types *</label>
                    <div className="flex gap-4">
                        {(['text', 'file'] as const).map((type) => (
                            <label key={type} className="flex items-center gap-2 text-sm text-fg cursor-pointer">
                                <input
                                    type="checkbox"
                                    checked={submissionTypes.includes(type)}
                                    onChange={() => toggleType(type)}
                                    className="accent-accent"
                                />
                                {type === 'text' ? 'Text response' : 'File upload'}
                            </label>
                        ))}
                    </div>
                </div>

                {error && <p className="text-sm text-danger">{error}</p>}

                {/* Actions */}
                <div className="flex items-center gap-3">
                    <Button variant="secondary" onClick={() => save('draft')} disabled={saving}>
                        {saving ? 'Saving...' : 'Save as draft'}
                    </Button>
                    <Button variant="primary" onClick={() => save('published')} disabled={saving}>
                        Publish
                    </Button>
                    {isEdit && (
                        <Button
                            variant="danger"
                            onClick={handleDelete}
                            disabled={saving}
                            className="ml-auto"
                        >
                            Delete draft
                        </Button>
                    )}
                </div>
            </main>
        </div>
    )
}
