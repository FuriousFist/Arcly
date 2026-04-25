"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { completeOnboarding } from "@/app/actions/onboarding"

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
        <div
            className="flex min-h-screen flex-col items-center justify-center gap-10"
            style={{ backgroundColor: '#0c0c10' }}        
        >
            <div className="flex flex-col gap-2">
                <label style={{ color: '#f4f3f1' }}>Display Name</label>
                <input
                    type="text"
                    value={displayName}
                    onChange={(e) => setDisplayName(e.target.value)}
                    className="rounded-lg px-4 py-2 text-sm w-full"
                    placeholder="Enter your name"
                    style={{ backgroundColor: '#1a1a24', color: '#f4f3f1', border: '1px solid #2a2a3a' }}
                />
            </div>

            <div className="flex gap-4">
                <button
                    onClick={() => setRole('instructor')}
                    style={{
                        backgroundColor: role === 'instructor' ? '#3b82f6' : '#1a1a24',
                        color: '#f4f3f1',
                        border: '1px solid #2a2a3a'
                    }}
                    className="px-6 py-2 rounded-lg text-sm font-medium"
                >
                    Instructor
                </button>
                <button
                    onClick={() => setRole('student')}
                    style={{
                        backgroundColor: role === 'student' ? '#3b82f6' : '#1a1a24',
                        color: '#f4f3f1',
                        border: '1px solid #2a2a3a'
                    }}
                    className="px-6 py-2 rounded-lg text-sm font-medium"
                >
                    Student
                </button>
            </div>

            
            {error && <p style={{ color: 'red' }}>{error}</p>}

            <button
                onClick={handleSubmit}
                className="px-6 py-3 rounded-lg text-sm font-medium transition-opacity hover:opacity-90"
                style={{ backgroundColor: '#3b82f6', color: '#f4f3f1' }}                                                                                                                                                                                                           
            >
                Continue
            </button>
            
        
        </div>
    )
}
