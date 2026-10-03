import { useEffect, useId, useRef, useState, type ReactNode } from 'react'
import { Info, X } from 'lucide-react'

export function PageHeader({ title, kicker, children }: { title: string; kicker?: string; children?: ReactNode }) {
  return (
    <header className="mb-6 flex flex-wrap items-end justify-between gap-3">
      <div>
        {kicker && <p className="kicker mb-1">{kicker}</p>}
        <h1 className="font-display text-3xl font-extrabold md:text-4xl">{title}</h1>
      </div>
      {children}
    </header>
  )
}

export function Field({
  label,
  error,
  hint,
  children,
}: {
  label: string
  error?: string
  hint?: string
  children: (id: string, describedBy?: string) => ReactNode
}) {
  const id = useId()
  const msgId = `${id}-msg`
  return (
    <div>
      <label htmlFor={id} className="label">
        {label}
      </label>
      {children(id, error || hint ? msgId : undefined)}
      {error ? (
        <p id={msgId} className="err" role="alert">
          {error}
        </p>
      ) : hint ? (
        <p id={msgId} className="mt-1 text-xs text-mute">
          {hint}
        </p>
      ) : null}
    </div>
  )
}

export function Tooltip({ text, label = 'More info' }: { text: string; label?: string }) {
  const [open, setOpen] = useState(false)
  const id = useId()
  return (
    <span className="relative inline-flex">
      <button
        type="button"
        aria-label={label}
        aria-describedby={open ? id : undefined}
        className="inline-flex h-6 w-6 items-center justify-center rounded-full text-mute transition-colors hover:text-ink"
        onMouseEnter={() => setOpen(true)}
        onMouseLeave={() => setOpen(false)}
        onFocus={() => setOpen(true)}
        onBlur={() => setOpen(false)}
        onClick={() => setOpen((o) => !o)}
        onKeyDown={(e) => e.key === 'Escape' && setOpen(false)}
      >
        <Info size={15} />
      </button>
      {open && (
        <span
          id={id}
          role="tooltip"
          className="absolute right-0 top-7 z-30 w-64 rounded-lg border border-line bg-surface p-3 text-xs leading-relaxed text-ink shadow-xl"
        >
          {text}
        </span>
      )}
    </span>
  )
}

/** Modal built on the native <dialog>: focus trap and Escape come for free. */
export function Dialog({
  open,
  onClose,
  title,
  children,
}: {
  open: boolean
  onClose: () => void
  title: string
  children: ReactNode
}) {
  const ref = useRef<HTMLDialogElement>(null)
  useEffect(() => {
    const d = ref.current
    if (!d) return
    if (open && !d.open) d.showModal()
    if (!open && d.open) d.close()
  }, [open])
  return (
    <dialog
      ref={ref}
      aria-label={title}
      onClose={onClose}
      onClick={(e) => e.target === ref.current && onClose()}
      className="m-auto w-[min(92vw,34rem)] rounded-card border border-line bg-surface p-0 text-ink backdrop:bg-black/60 backdrop:backdrop-blur-sm"
    >
      {open && (
        <div className="p-5 md:p-6">
          <div className="mb-4 flex items-start justify-between gap-4">
            <h2 className="font-display text-xl font-bold">{title}</h2>
            <button type="button" aria-label="Close dialog" className="btn btn-sm !px-2" onClick={onClose}>
              <X size={16} />
            </button>
          </div>
          {children}
        </div>
      )}
    </dialog>
  )
}

export function Segmented<T extends string>({
  value,
  options,
  onChange,
  label,
}: {
  value: T
  options: { value: T; label: string }[]
  onChange: (v: T) => void
  label: string
}) {
  return (
    <div role="radiogroup" aria-label={label} className="inline-flex rounded-full border border-line p-1">
      {options.map((o) => (
        <button
          key={o.value}
          type="button"
          role="radio"
          aria-checked={value === o.value}
          onClick={() => onChange(o.value)}
          className={`min-h-[40px] rounded-full px-4 text-sm font-semibold transition-colors duration-200 ${
            value === o.value ? 'bg-lime text-onlime' : 'text-mute hover:text-ink'
          }`}
        >
          {o.label}
        </button>
      ))}
    </div>
  )
}
