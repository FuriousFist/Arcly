import { HTMLAttributes } from 'react'

interface CardProps extends HTMLAttributes<HTMLDivElement> {}

export default function Card({ className = '', ...props }: CardProps) {
    return (
        <div
            {...props}
            className={`rounded-lg bg-surface border border-border ${className}`}
        />
    )
}
