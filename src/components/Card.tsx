import type { ReactNode } from 'react'

interface Props {
  title?: string
  subtitle?: string
  action?: ReactNode
  className?: string
  children: ReactNode
}

export default function Card({ title, subtitle, action, className = '', children }: Props) {
  return (
    <section
      className={`rounded-2xl border border-slate-200 bg-white p-5 shadow-sm ${className}`}
    >
      {(title || action) && (
        <header className="mb-4 flex items-center justify-between gap-3">
          <div>
            {title && <h3 className="text-sm font-semibold text-ink-900">{title}</h3>}
            {subtitle && <p className="text-xs text-slate-400">{subtitle}</p>}
          </div>
          {action}
        </header>
      )}
      {children}
    </section>
  )
}
