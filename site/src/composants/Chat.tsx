import { ChatCircleTextIcon, PaperPlaneRightIcon, XIcon } from '@phosphor-icons/react'
import { useEffect, useRef, useState } from 'react'
import { LONGUEUR_MAX, attendreMessage, envoyerMessage } from '../api'

interface Bulle {
  id: number
  auteur: 'client' | 'vault'
  texte: string
}

const ACCUEIL: Bulle = { id: 0, auteur: 'vault', texte: 'Bonjour. Décrivez votre demande : nos experts la prennent en charge.' }
const ANALYSE = 'Nous analysons votre demande'
const HORS_LIGNE = 'Le service ne répond pas. Réessayez dans un instant.'

/**
 * Bouton du chat, en verre (DESIGN.md 4), et son panneau. Le message part à
 * l'API, qui crée le ticket et lance le tri. Le client ne reçoit que le message
 * fixe écrit par l'API, avec sa référence : jamais le brouillon du bot, réservé
 * au conseiller. Tout texte est rendu comme du texte (DESIGN.md 11).
 */
export function Chat() {
  const [ouvert, setOuvert] = useState(false)
  const [bulles, setBulles] = useState<Bulle[]>([ACCUEIL])
  const [saisie, setSaisie] = useState('')
  const [analyse, setAnalyse] = useState(false)
  const ref = useRef<HTMLDialogElement>(null)
  const fil = useRef<HTMLDivElement>(null)
  const suivant = useRef(1)

  useEffect(() => {
    const d = ref.current
    if (!d) return
    if (ouvert && !d.open) d.showModal()
    if (!ouvert && d.open) d.close()
  }, [ouvert])

  useEffect(() => {
    fil.current?.scrollTo({ top: fil.current.scrollHeight })
  }, [bulles, analyse])

  const ajouter = (auteur: Bulle['auteur'], texte: string) =>
    setBulles((b) => [...b, { id: suivant.current++, auteur, texte }])

  const envoyer = async () => {
    const texte = saisie.trim()
    if (!texte || texte.length > LONGUEUR_MAX || analyse) return
    ajouter('client', texte)
    setSaisie('')
    setAnalyse(true)
    try {
      const ticket = await envoyerMessage(texte)
      ajouter('vault', await attendreMessage(ticket))
    } catch {
      ajouter('vault', HORS_LIGNE)
      setSaisie(texte)
    } finally {
      setAnalyse(false)
    }
  }

  const restant = LONGUEUR_MAX - saisie.length

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
          <div className="flex h-16 shrink-0 items-center justify-between border-b border-line px-5">
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

          <div ref={fil} role="log" aria-live="polite" className="flex-1 space-y-3 overflow-y-auto px-5 py-5">
            {bulles.map((b) => (
              <p
                key={b.id}
                className={`w-fit max-w-[85%] rounded-[18px] px-4 py-2.5 text-corps break-words whitespace-pre-wrap ${
                  b.auteur === 'client' ? 'ml-auto bg-accent text-on-accent' : 'bg-surface-2 text-text'
                }`}
              >
                {b.texte}
              </p>
            ))}
            {analyse && (
              <p role="status" className="w-fit max-w-[85%] rounded-[18px] bg-surface-2 px-4 py-2.5 text-corps text-text-2">
                {ANALYSE}
              </p>
            )}
          </div>

          <form
            className="shrink-0 border-t border-line px-4 pt-3 pb-[calc(12px+env(safe-area-inset-bottom))]"
            onSubmit={(e) => {
              e.preventDefault()
              void envoyer()
            }}
          >
            <div className="flex items-end gap-2">
              <label htmlFor="chat-saisie" className="sr-only">
                Votre message
              </label>
              <textarea
                id="chat-saisie"
                rows={1}
                value={saisie}
                maxLength={LONGUEUR_MAX}
                disabled={analyse}
                placeholder="Écrivez votre message"
                onChange={(e) => setSaisie(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && !e.shiftKey && !e.nativeEvent.isComposing) {
                    e.preventDefault()
                    void envoyer()
                  }
                }}
                className="max-h-32 min-h-11 flex-1 resize-none rounded-[22px] border border-line bg-surface-2 px-4 py-2.5 text-corps text-text placeholder:text-text-2 focus:border-accent focus:outline-none disabled:opacity-60"
              />
              <button
                type="submit"
                aria-label="Envoyer"
                disabled={analyse || !saisie.trim()}
                className="pressable grid size-11 shrink-0 place-items-center rounded-full bg-accent text-on-accent disabled:opacity-40"
              >
                <PaperPlaneRightIcon size={18} weight="fill" aria-hidden="true" />
              </button>
            </div>
            {restant < 200 && (
              <p className="montant mt-1.5 px-2 text-petit text-text-2" aria-live="polite">
                {restant} caractères restants
              </p>
            )}
          </form>
        </div>
      </dialog>
    </>
  )
}
