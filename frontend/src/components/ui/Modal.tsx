import type { ReactNode } from 'react'

interface ModalProps {
  title: string
  subtitle?: string
  onClose: () => void
  children: ReactNode
}

export function Modal({ title, subtitle, onClose, children }: ModalProps) {
  return (
    <div className="fixed inset-0 bg-black/30 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-md">
        <div className="px-6 py-4 border-b border-gray-100 flex items-start justify-between">
          <div>
            <h3 className="font-semibold text-gray-900">{title}</h3>
            {subtitle && <p className="text-xs text-gray-400 mt-0.5">{subtitle}</p>}
          </div>
          <button onClick={onClose} className="text-gray-300 hover:text-gray-500 text-lg leading-none mt-0.5">×</button>
        </div>
        {children}
      </div>
    </div>
  )
}

export function ModalBody({ children }: { children: ReactNode }) {
  return <div className="px-6 py-5 space-y-4">{children}</div>
}

export function ModalFooter({ children }: { children: ReactNode }) {
  return <div className="px-6 pb-5 flex gap-3">{children}</div>
}
