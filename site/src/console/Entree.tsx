import { FileCsvIcon, UploadSimpleIcon, WarningCircleIcon } from '@phosphor-icons/react'
import { useRef, useState, type DragEvent } from 'react'
import { LONGUEUR_MAX } from '../api'
import { apercuLot, creerLot, csvUneLigne, ErreurApi } from './api'
import { CHAMP } from './libelles'
import { duree } from './retenir'
import type { Apercu } from './types'

const NOM_TICKET = 'Ticket écrit'

function Erreur({ message }: { message: string }) {
  return (
    <p role="alert" className="mt-3 flex items-start gap-2 text-petit text-text">
      <WarningCircleIcon size={16} className="mt-px shrink-0 text-danger" aria-hidden="true" />
      <span>{message}</span>
    </p>
  )
}

const message = (e: unknown, quoi: 'Fichier' | 'Ticket') =>
  e instanceof ErreurApi ? `${quoi} refusé : ${e.message}.` : 'Le service ne répond pas. Réessayez dans un instant.'

/**
 * Deux entrées visibles côte à côte : déposer un CSV, ou écrire un ticket.
 * Le ticket écrit devient un CSV d'une ligne : il suit exactement le même chemin.
 */
export function Entree({ onLance }: { onLance: (id: string, source: { nom: string; contenu: string }) => void }) {
  const [fichier, setFichier] = useState<{ nom: string; contenu: string } | null>(null)
  const [apercu, setApercu] = useState<Apercu | null>(null)
  const [erreurCsv, setErreurCsv] = useState<string | null>(null)
  const [survol, setSurvol] = useState(false)
  const [texte, setTexte] = useState('')
  const [erreurTicket, setErreurTicket] = useState<string | null>(null)
  const [envoi, setEnvoi] = useState<'csv' | 'ticket' | null>(null)
  const champ = useRef<HTMLInputElement>(null)

  async function choisir(f: File | undefined) {
    if (!f) return
    setApercu(null)
    setErreurCsv(null)
    const contenu = await f.text()
    setFichier({ nom: f.name, contenu })
    try {
      setApercu(await apercuLot(f.name, contenu))
    } catch (e) {
      setErreurCsv(message(e, 'Fichier'))
    }
  }

  async function lancer(nom: string, contenu: string, source: 'csv' | 'ticket') {
    setEnvoi(source)
    const setErreur = source === 'csv' ? setErreurCsv : setErreurTicket
    setErreur(null)
    try {
      const lot = await creerLot(nom, contenu)
      onLance(lot.id, { nom, contenu })
      if (source === 'csv') {
        setFichier(null)
        setApercu(null)
      } else setTexte('')
    } catch (e) {
      setErreur(message(e, source === 'csv' ? 'Fichier' : 'Ticket'))
    } finally {
      setEnvoi(null)
    }
  }

  const deposer = (e: DragEvent) => {
    e.preventDefault()
    setSurvol(false)
    void choisir(e.dataTransfer.files[0])
  }

  return (
    <section aria-labelledby="titre-entree" className="grid grid-cols-[minmax(0,1fr)] gap-4 lg:grid-cols-2">
      <h2 id="titre-entree" className="sr-only">
        Nouveau tri
      </h2>

      <div className="bloc flex flex-col p-5">
        <h3 className="text-corps font-semibold text-text">Déposer un CSV</h3>
        <p className="mt-0.5 text-petit text-text-2">
          Colonne <code className="font-medium text-text">ticket</code> obligatoire. Colonnes{' '}
          <code className="font-medium text-text">categorie</code>, <code className="font-medium text-text">produit</code>,{' '}
          <code className="font-medium text-text">severite</code> facultatives : avec elles, la console calcule la
          justesse du bot.
        </p>
        <div
          onDragOver={(e) => {
            e.preventDefault()
            setSurvol(true)
          }}
          onDragLeave={() => setSurvol(false)}
          onDrop={deposer}
          className={`mt-4 flex flex-1 flex-col items-center justify-center gap-2 rounded-[12px] border border-dashed px-4 py-6 text-center ${
            survol ? 'border-accent bg-[rgb(var(--accent-rgb)/0.06)]' : 'border-line bg-surface-2'
          }`}
        >
          <UploadSimpleIcon size={20} className="text-text-2" aria-hidden="true" />
          <p className="text-petit text-text-2">Glissez le fichier ici, ou</p>
          <button
            type="button"
            onClick={() => champ.current?.click()}
            className="pressable h-8 rounded-full border border-line bg-surface px-4 text-petit font-medium text-text hover:bg-surface-2"
          >
            Choisir un fichier
          </button>
          <input
            ref={champ}
            type="file"
            accept=".csv,text/csv"
            className="sr-only"
            aria-label="Fichier CSV de tickets"
            tabIndex={-1}
            onChange={(e) => {
              void choisir(e.target.files?.[0])
              e.target.value = ''
            }}
          />
        </div>
        {erreurCsv && <Erreur message={erreurCsv} />}
        {apercu && fichier && (
          <div className="mt-4 flex flex-wrap items-center gap-x-4 gap-y-3">
            <p className="flex min-w-0 flex-1 items-start gap-2 text-petit text-text">
              <FileCsvIcon size={18} className="shrink-0 text-accent" aria-hidden="true" />
              <span className="min-w-0">
                <span className="block truncate font-medium">{apercu.nom}</span>
                <span className="block text-text-2">
                  {apercu.tickets} tickets ·{' '}
                  {apercu.bonnes_reponses.length
                    ? `bonnes réponses : ${apercu.bonnes_reponses.map((c) => CHAMP[c].toLowerCase()).join(', ')}`
                    : 'sans bonnes réponses'}{' '}
                  · durée estimée {duree(apercu.estimation_s)}
                </span>
              </span>
            </p>
            <button
              type="button"
              disabled={envoi !== null}
              onClick={() => void lancer(fichier.nom, fichier.contenu, 'csv')}
              className="pressable h-8 rounded-full bg-accent px-4 text-petit font-medium text-on-accent disabled:opacity-60"
            >
              {envoi === 'csv' ? 'Lancement…' : 'Lancer le tri'}
            </button>
          </div>
        )}
      </div>

      <form
        className="bloc flex flex-col p-5"
        onSubmit={(e) => {
          e.preventDefault()
          if (texte.trim()) void lancer(NOM_TICKET, csvUneLigne(texte), 'ticket')
        }}
      >
        <h3 className="text-corps font-semibold text-text">
          <label htmlFor="ticket-ecrit">Écrire un ticket</label>
        </h3>
        <p className="mt-0.5 text-petit text-text-2">
          Le ticket devient un CSV d’une ligne et suit le même chemin qu’un fichier. De 6 à 40 s, selon que les
          modèles sont déjà chargés.
        </p>
        <textarea
          id="ticket-ecrit"
          value={texte}
          maxLength={LONGUEUR_MAX}
          onChange={(e) => setTexte(e.target.value)}
          rows={5}
          placeholder="Bonjour, un prélèvement de 49 € que je ne reconnais pas est passé hier sur mon compte…"
          className="mt-4 w-full flex-1 resize-y rounded-[12px] border border-line bg-surface px-3 py-2 text-corps text-text placeholder:text-text-2 focus:border-accent focus:outline-none"
        />
        {erreurTicket && <Erreur message={erreurTicket} />}
        <div className="mt-3 flex items-center justify-between gap-3">
          <span className="montant text-petit text-text-2">
            {texte.length} / {LONGUEUR_MAX}
          </span>
          <button
            type="submit"
            disabled={!texte.trim() || envoi !== null}
            className="pressable h-8 rounded-full border border-accent px-4 text-petit font-medium text-accent disabled:border-line disabled:text-text-2"
          >
            {envoi === 'ticket' ? 'Lancement…' : 'Trier ce ticket'}
          </button>
        </div>
      </form>
    </section>
  )
}
