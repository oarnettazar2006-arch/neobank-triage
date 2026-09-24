import { ChatCircleTextIcon, XIcon } from '@phosphor-icons/react'
import { useEffect, useRef, useState } from 'react'

/**
 * Bouton du chat, en verre (DESIGN.md 4), et son panneau. Le chat viendra
 * plus tard : le panneau est vide pour l'instant.
 */
export function Chat() {
  const [ouvert, setOuvert] = useState(false)
  const ref = useRef<HTMLDialogElement>(null)

  useEffect(() => {
    const d = ref.current
    if (!d) return
    if (ouvert && !d.open) d.showModal()
    if (!ouvert && d.open) d.close()
  }, [ouvert])

  return (
    <>
      <button
        type="button"
        aria-label="Ouvrir l’assistance"
        aria-haspopup="dialog"
        onClick={() => setOuvert(true)}
        className="verre pressable fixed right-4 bottom-[calc(76px+env(safe-area-inset-bottom))] z-30 grid size-12 place-items-center rounded-full border border-[var(--verre-bord)] text-text shadow-[var(--ombre-flottante)] lg:right-8 lg:bottom-8 lg:size-14"
      >
        <ChatCircleTextIcon size={22} aria-hidden="true" />
      </button>
      <dialog
        ref={ref}
        aria-labelledby="chat-titre"
        onClose={() => setOuvert(false)}
        onClick={(e) => {
          if (e.target === e.currentTarget) setOuvert(false)
        }}
        className="panneau-chat bg-surface text-text"
      >
        <div className="flex h-full flex-col">
          <div className="flex h-16 items-center justify-between border-b border-line px-5">
            <h2 id="chat-titre" className="text-[1.0625rem] font-semibold">
              Assistance
            </h2>
            <button
              type="button"
              aria-label="Fermer"
              onClick={() => setOuvert(false)}
              className="pressable survol grid size-10 place-items-center rounded-full text-text-2"
            >
              <XIcon size={20} aria-hidden="true" />
            </button>
          </div>
          <p className="grid flex-1 place-items-center text-petit text-text-2">Bientôt disponible.</p>
        </div>
      </dialog>
    </>
  )
}
