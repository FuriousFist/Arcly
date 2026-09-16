import { ReactNode } from 'react'

export default function FullScreenMessage({ children }: { children: ReactNode }) {
    return (
        <div className="flex min-h-screen flex-col items-center justify-center gap-6 text-fg">{children}</div>
    )
}
