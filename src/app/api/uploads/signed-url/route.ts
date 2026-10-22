// vault: vault/tickets/v1/v1-2.4-file-upload-handling.md

import { err, requireUser, requireClassRole } from '@/lib/api'
import { createServiceClient } from '@/lib/supabase/service'
import { NextResponse } from 'next/server'

const ALLOWED_TYPES = new Set([
    'application/pdf',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    'image/png',
    'image/jpeg',
    'image/webp',
    'text/plain',
])

function sanitize(name: string) {
    return name.replace(/[^a-zA-Z0-9._-]/g, '_').slice(0, 100)
}

// POST: generate a signed upload URL for a submission file
export async function POST(req: Request) {
    const auth = await requireUser()
    if (auth.response) return auth.response
    const { supabase, user } = auth

    const { assignment_id, filename, content_type } = await req.json()
    if (!assignment_id || !filename || !content_type)
        return err('Missing parameters', 'MISSING_PARAMETERS', 400)

    if (!ALLOWED_TYPES.has(content_type))
        return err('File type not allowed', 'INVALID_FILE_TYPE', 400)

    const { data: assignment } = await supabase
        .from('assignments')
        .select('class_id, status')
        .eq('id', assignment_id)
        .single()

    if (!assignment) return err('Assignment not found', 'ASSIGNMENT_NOT_FOUND', 404)
    if (assignment.status !== 'published')
        return err('Assignment is not accepting submissions', 'ASSIGNMENT_NOT_PUBLISHED', 400)

    const access = await requireClassRole(supabase, assignment.class_id, user.id)
    if (access.response) return access.response

    const path = `${assignment.class_id}/${assignment_id}/${user.id}/${Date.now()}-${sanitize(filename)}`

    const { data, error } = await createServiceClient()
        .storage.from('assignment-uploads')
        .createSignedUploadUrl(path)

    if (error) return err('Cannot create upload URL', 'STORAGE_ERROR', 500)

    return NextResponse.json({ signedUrl: data.signedUrl, path })
}

// GET ?path=: generate a signed download URL (instructor / AI access only)
export async function GET(req: Request) {
    const auth = await requireUser()
    if (auth.response) return auth.response
    const { supabase, user } = auth

    const { searchParams } = new URL(req.url)
    const path = searchParams.get('path')
    if (!path) return err('Missing path', 'MISSING_PATH', 400)

    // Path structure: {classId}/{assignmentId}/{userId}/{filename}
    const classId = path.split('/')[0]
    if (!classId) return err('Invalid path', 'INVALID_PATH', 400)

    const access = await requireClassRole(supabase, classId, user.id, 'instructor')
    if (access.response) return access.response

    const { data, error } = await createServiceClient()
        .storage.from('assignment-uploads')
        .createSignedUrl(path, 3600)

    if (error) return err('Cannot create download URL', 'STORAGE_ERROR', 500)

    return NextResponse.json({ signedUrl: data.signedUrl })
}
