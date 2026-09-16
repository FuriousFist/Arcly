import { ButtonHTMLAttributes } from 'react'

type Variant = 'primary' | 'secondary' | 'danger'

const VARIANT_CLASSES: Record<Variant, string> = {
    primary: 'bg-accent text-fg',
    secondary: 'bg-border text-fg',
    danger: 'bg-border text-danger',
}

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
    variant?: Variant
}

export default function Button({ variant = 'primary', className = '', ...props }: ButtonProps) {
    return (
        <button
            {...props}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-opacity hover:opacity-90 disabled:opacity-50 ${VARIANT_CLASSES[variant]} ${className}`}
        />
    )
}
