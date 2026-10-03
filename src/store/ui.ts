import { create } from 'zustand'

export interface Toast {
  id: number
  message: string
  action?: { label: string; run: () => void }
}

export type CelebrationKind = 'small' | 'big'

interface UI {
  toasts: Toast[]
  celebration: { id: number; kind: CelebrationKind; title?: string; sub?: string } | null
  toast: (message: string, action?: Toast['action']) => void
  dismissToast: (id: number) => void
  celebrate: (kind: CelebrationKind, title?: string, sub?: string) => void
  clearCelebration: () => void
}

let n = 0

export const useUI = create<UI>((set, get) => ({
  toasts: [],
  celebration: null,
  toast: (message, action) => {
    const id = ++n
    set((s) => ({ toasts: [...s.toasts, { id, message, action }] }))
    setTimeout(() => get().dismissToast(id), action ? 6000 : 3500)
  },
  dismissToast: (id) => set((s) => ({ toasts: s.toasts.filter((t) => t.id !== id) })),
  celebrate: (kind, title, sub) => set({ celebration: { id: ++n, kind, title, sub } }),
  clearCelebration: () => set({ celebration: null }),
}))
