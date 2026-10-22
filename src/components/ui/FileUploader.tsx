// vault: vault/tickets/v1/v1-2.4-file-upload-handling.md

'use client'

import { useRef, useState } from 'react'
import Button from './Button'

const ALLOWED_ACCEPT = '.pdf,.docx,.xlsx,.png,.jpg,.jpeg,.webp,.txt'
const ALLOWED_TYPES = new Set([
    'application/pdf',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    'image/png',
    'image/jpeg',
    'image/webp',
    'text/plain',
])
const MAX_SIZE = 20 * 1024 * 1024
const MAX_FILES = 5

type FileEntry = {
    id: string
    file: File
    progress: number
    status: 'pending' | 'uploading' | 'done' | 'error'
    storagePath?: string
    error?: string
}

export default function FileUploader({
    assignmentId,
    onChange,
    disabled = false,
}: {
    assignmentId: string
    onChange: (paths: string[]) => void
    disabled?: boolean
}) {
    const [entries, setEntries] = useState<FileEntry[]>([])
    const inputRef = useRef<HTMLInputElement>(null)

    function patch(id: string, update: Partial<FileEntry>, currentEntries: FileEntry[]): FileEntry[] {
        return currentEntries.map((e) => (e.id === id ? { ...e, ...update } : e))
    }

    function notifyDone(next: FileEntry[]) {
        onChange(next.filter((e) => e.status === 'done' && e.storagePath).map((e) => e.storagePath!))
    }

    async function uploadEntry(entry: FileEntry) {
        setEntries((prev) => {
            const next = patch(entry.id, { status: 'uploading', progress: 0 }, prev)
            return next
        })

        let signedUrl: string
        let storagePath: string
        try {
            const res = await fetch('/api/uploads/signed-url', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    assignment_id: assignmentId,
                    filename: entry.file.name,
                    content_type: entry.file.type,
                }),
            })
            if (!res.ok) {
                const json = await res.json().catch(() => ({}))
                setEntries((prev) => {
                    const next = patch(entry.id, { status: 'error', error: json.error ?? 'Upload failed' }, prev)
                    notifyDone(next)
                    return next
                })
                return
            }
            const json = await res.json()
            signedUrl = json.signedUrl
            storagePath = json.path
        } catch {
            setEntries((prev) => {
                const next = patch(entry.id, { status: 'error', error: 'Network error' }, prev)
                notifyDone(next)
                return next
            })
            return
        }

        await new Promise<void>((resolve) => {
            const xhr = new XMLHttpRequest()
            xhr.upload.addEventListener('progress', (e) => {
                if (e.lengthComputable) {
                    const pct = Math.round((e.loaded / e.total) * 100)
                    setEntries((prev) => patch(entry.id, { progress: pct }, prev))
                }
            })
            xhr.addEventListener('load', () => {
                if (xhr.status >= 200 && xhr.status < 300) {
                    setEntries((prev) => {
                        const next = patch(entry.id, { status: 'done', storagePath, progress: 100 }, prev)
                        notifyDone(next)
                        return next
                    })
                } else {
                    setEntries((prev) => {
                        const next = patch(entry.id, { status: 'error', error: `Upload failed (${xhr.status})` }, prev)
                        notifyDone(next)
                        return next
                    })
                }
                resolve()
            })
            xhr.addEventListener('error', () => {
                setEntries((prev) => {
                    const next = patch(entry.id, { status: 'error', error: 'Upload failed' }, prev)
                    notifyDone(next)
                    return next
                })
                resolve()
            })
            xhr.open('PUT', signedUrl)
            xhr.setRequestHeader('Content-Type', entry.file.type)
            xhr.send(entry.file)
        })
    }

    function handleFiles(files: FileList | null) {
        if (!files) return
        const incoming = Array.from(files)
        const validNew: FileEntry[] = []
        const pickErrors: string[] = []

        for (const file of incoming) {
            if (entries.length + validNew.length >= MAX_FILES) {
                pickErrors.push(`Max ${MAX_FILES} files`)
                break
            }
            if (file.size > MAX_SIZE) {
                pickErrors.push(`${file.name}: exceeds 20 MB`)
                continue
            }
            if (!ALLOWED_TYPES.has(file.type)) {
                pickErrors.push(`${file.name}: unsupported file type`)
                continue
            }
            validNew.push({ id: crypto.randomUUID(), file, progress: 0, status: 'pending' })
        }

        if (pickErrors.length > 0) {
            // surface as one ephemeral error entry without a file (used as a banner)
            const errId = crypto.randomUUID()
            setEntries((prev) => [
                ...prev,
                ...validNew,
                { id: errId, file: new File([], ''), progress: 0, status: 'error', error: pickErrors.join('; ') },
            ])
        } else {
            setEntries((prev) => [...prev, ...validNew])
        }

        validNew.forEach(uploadEntry)
        if (inputRef.current) inputRef.current.value = ''
    }

    function remove(id: string) {
        setEntries((prev) => {
            const next = prev.filter((e) => e.id !== id)
            notifyDone(next)
            return next
        })
    }

    const realEntries = entries.filter((e) => e.file.name !== '')
    const errorBanners = entries.filter((e) => e.file.name === '' && e.status === 'error')

    return (
        <div className="flex flex-col gap-3">
            <div className="flex items-center gap-3 flex-wrap">
                <Button
                    variant="secondary"
                    onClick={() => inputRef.current?.click()}
                    disabled={disabled || realEntries.length >= MAX_FILES}
                    className="px-3 py-2 text-sm"
                >
                    Choose files
                </Button>
                <span className="text-xs opacity-60 text-fg">
                    PDF, Word, images, spreadsheets · 20 MB max · up to {MAX_FILES} files
                </span>
                <input
                    ref={inputRef}
                    type="file"
                    accept={ALLOWED_ACCEPT}
                    multiple
                    className="hidden"
                    onChange={(e) => handleFiles(e.target.files)}
                />
            </div>

            {errorBanners.map((e) => (
                <div key={e.id} className="flex items-center justify-between p-2 rounded-lg bg-surface border border-danger">
                    <span className="text-xs text-danger">{e.error}</span>
                    <button
                        type="button"
                        onClick={() => remove(e.id)}
                        className="text-xs opacity-60 hover:opacity-100 text-fg ml-2"
                    >
                        ✕
                    </button>
                </div>
            ))}

            {realEntries.length > 0 && (
                <div className="flex flex-col gap-2">
                    {realEntries.map((e) => (
                        <div
                            key={e.id}
                            className="flex items-center gap-3 p-3 rounded-lg border border-border bg-surface"
                        >
                            <div className="flex flex-col flex-1 gap-1 min-w-0">
                                <div className="flex items-center gap-2 flex-wrap">
                                    <span className="text-sm text-fg truncate">{e.file.name}</span>
                                    <span className="text-xs opacity-60 text-fg shrink-0">
                                        {(e.file.size / 1024 / 1024).toFixed(1)} MB
                                    </span>
                                    {e.status === 'done' && (
                                        <span className="text-xs text-accent shrink-0">Uploaded</span>
                                    )}
                                    {e.status === 'error' && (
                                        <span className="text-xs text-danger shrink-0">{e.error}</span>
                                    )}
                                    {e.status === 'uploading' && (
                                        <span className="text-xs opacity-60 text-fg shrink-0">
                                            {e.progress}%
                                        </span>
                                    )}
                                </div>
                                {e.status === 'uploading' && (
                                    <div className="h-1 w-full rounded-full bg-border overflow-hidden">
                                        <div
                                            className="h-full bg-accent transition-all duration-200 rounded-full"
                                            style={{ width: `${e.progress}%` }}
                                        />
                                    </div>
                                )}
                            </div>
                            <button
                                type="button"
                                onClick={() => remove(e.id)}
                                disabled={e.status === 'uploading'}
                                className="text-sm opacity-50 hover:opacity-100 text-danger shrink-0 disabled:cursor-not-allowed"
                            >
                                ✕
                            </button>
                        </div>
                    ))}
                </div>
            )}
        </div>
    )
}
