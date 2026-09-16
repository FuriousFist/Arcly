import { InputHTMLAttributes } from 'react'

interface InputProps extends InputHTMLAttributes<HTMLInputElement> {}

export default function Input({ className = '', ...props }: InputProps) {
    return (
        <input
            {...props}
            className={`rounded-lg px-4 py-2 text-sm w-full bg-bg text-fg border border-border ${className}`}
        />
    )
}
