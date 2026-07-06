import { NextResponse } from 'next/server'

  export function err(error: string, code: string, status: number) {
    return NextResponse.json({ error, code }, { status })
}