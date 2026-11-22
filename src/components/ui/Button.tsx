import { forwardRef, type ButtonHTMLAttributes, type ReactNode } from 'react'
import { Link, type LinkProps } from 'react-router'
import { Loader2 } from 'lucide-react'
import { cn } from '@/utils/cn'

export type ButtonVariant = 'primary' | 'secondary' | 'outline' | 'ghost' | 'gold' | 'danger' | 'light'
export type ButtonSize = 'sm' | 'md' | 'lg' | 'icon'

const base =
  'inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-[9px] border border-transparent font-bold transition-all duration-200 hover:-translate-y-px disabled:pointer-events-none disabled:opacity-50 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent'

const variants: Record<ButtonVariant, string> = {
  primary: 'bg-forest text-white shadow-[0_5px_12px_rgb(18_60_53/0.14)] hover:bg-forest-700',
  secondary: 'border-stone-line bg-white text-forest hover:border-[#b6c9c5]',
  outline: 'border-stone-line bg-white text-forest hover:border-[#b6c9c5]',
  ghost: 'text-forest hover:bg-beige',
  gold: 'bg-gold text-forest-800 hover:bg-gold-light',
  danger: 'bg-danger text-white hover:bg-[#9e3f3f]',
  light: 'bg-white text-forest hover:bg-beige',
}

const sizes: Record<ButtonSize, string> = {
  sm: 'h-9 px-3.5 text-[13px]',
  md: 'h-[43px] px-5 text-[13px]',
  lg: 'h-12 px-6 text-sm',
  icon: 'size-10',
}

// eslint-disable-next-line react-refresh/only-export-components
export const buttonClass = (variant: ButtonVariant = 'primary', size: ButtonSize = 'md', className?: string) =>
  cn(base, variants[variant], sizes[size], className)

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant
  size?: ButtonSize
  loading?: boolean
  icon?: ReactNode
}

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(function Button(
  { variant = 'primary', size = 'md', loading, icon, className, children, disabled, type = 'button', ...rest },
  ref,
) {
  return (
    <button ref={ref} type={type} className={buttonClass(variant, size, className)} disabled={disabled || loading} aria-busy={loading || undefined} {...rest}>
      {loading ? <Loader2 className="size-4 animate-spin" aria-hidden /> : icon}
      {children}
    </button>
  )
})

interface ButtonLinkProps extends LinkProps {
  variant?: ButtonVariant
  size?: ButtonSize
  icon?: ReactNode
}

export function ButtonLink({ variant = 'primary', size = 'md', icon, className, children, ...rest }: ButtonLinkProps) {
  return (
    <Link className={buttonClass(variant, size, typeof className === 'string' ? className : undefined)} {...rest}>
      {icon}
      {children}
    </Link>
  )
}
