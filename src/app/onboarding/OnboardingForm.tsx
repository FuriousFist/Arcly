'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { completeOnboarding } from '@/app/actions/onboarding'
import Button from '@/components/ui/Button'
import Input from '@/components/ui/Input'

export default function OnboardingForm() {
    const [displayName, setDisplayName] = useState('')
    const [role, setRole] = useState('')
    const [error, setError] = useState('')

    const router = useRouter()

    async function handleSubmit() {
        const result = await completeOnboarding(displayName, role)
        if (result.error) {
            setError(result.error)
            return
        }

        if (result.role === 'instructor') {
            router.push('/dashboard')
        } else {
            router.push('/join')
        }
    }

    return (
        <div className="flex min-h-screen flex-col items-center justify-center gap-10 bg-bg">
            <div className="flex flex-col gap-2">
                <label className="text-fg">Display Name</label>
                <Input
                    type="text"
                    value={displayName}
                    onChange={(e) => setDisplayName(e.target.value)}
                    placeholder="Enter your name"
                />
            </div>

            <div className="flex gap-4">
                <Button
                    onClick={() => setRole('instructor')}
                    variant={role === 'instructor' ? 'primary' : 'secondary'}
                >
                    Instructor
                </Button>
                <Button
                    onClick={() => setRole('student')}
                    variant={role === 'student' ? 'primary' : 'secondary'}
                >
                    Student
                </Button>
            </div>

            {error && <p className="text-danger">{error}</p>}

            <Button onClick={handleSubmit} className="px-6 py-3">
                Continue
            </Button>
        </div>
    )
}
