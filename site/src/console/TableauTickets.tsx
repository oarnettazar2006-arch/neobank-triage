import { CaretDownIcon, CaretRightIcon, DownloadSimpleIcon, ShieldWarningIcon, WarningCircleIcon } from '@phosphor-icons/react'
import { useState } from 'react'
import { urlExport } from './api'
import { CHAMP, COLONNES, libelle, PREDIT } from './libelles'
import { champsFaux } from './retenir'
import type { Colonne, Ligne } from './types'

type Filtre = 'tous' | 'reclamations' | 'suspects' | 'erreurs'

const FILTRES: { cle: Filtre; libelle: string; garde: (l: Ligne) => boolean }[] = [
  { cle: 'tous', libelle: 'Tous', garde: () => true },
  { cle: 'reclamations', libelle: 'Réclamations', garde: (l) => l.prediction?.reclamation === 'oui' },
  { cle: 'suspects', libelle: 'Suspects', garde: (l) => l.prediction?.injection_suspectee === 'oui' },
  { cle: 'erreurs', libelle: 'Erreurs du bot', garde: (l) => champsFaux(l).length > 0 },
]

function Badge({ ton, children }: { ton: 'danger' | 'accent'; children: string }) {
  const fond = ton === 'danger' ? 'bg-[rgb(var(--danger-rgb)/0.12)]' : 'bg-[rgb(var(--accent-rgb)/0.12)]'
  return <span className={`inline-block rounded-full px-2 py-0.5 text-[0.75rem] leading-4 font-medium text-text ${fond}`}>{children}</span>
}

function Valeur({ l, col }: { l: Ligne; col: Colonne }) {
  const p = l.prediction
  if (!p) return <span className="text-text-2">en attente</span>
  const code = p[PREDIT[col]]
  const attendu = l.attendu[col]
  const texte = libelle(col, code)
  return (
    <span className="flex flex-col items-start">
      {col === 'severite' && code === 'high' ? <Badge ton="danger">{texte}</Badge> : <span className="text-text">{texte}</span>}
      {attendu !== undefined && attendu !== code && (
        <span className="flex items-center gap-1 text-[0.75rem] leading-4 whitespace-nowrap text-text-2">
          <WarningCircleIcon size={12} weight="fill" className="shrink-0 text-danger" aria-label="Erreur" />
          attendu {libelle(col, attendu)}
        </span>
      )}
    </span>
  )
}

/** Tableau dense (DESIGN.md 5.2) : une ligne par ticket, remplie au fil du tri. */
export function TableauTickets({ lotId, lignes, termine, avecBonnes }: { lotId: string; lignes: Ligne[]; termine: boolean; avecBonnes: boolean }) {
  const [filtre, setFiltre] = useState<Filtre>('tous')
  const [ouvert, setOuvert] = useState<number | null>(null)
  const filtres = FILTRES.filter((f) => f.cle !== 'erreurs' || avecBonnes)
  const garde = FILTRES.find((f) => f.cle === filtre)?.garde ?? (() => true)
  const visibles = lignes.filter(garde)

  return (
    <section aria-labelledby="titre-tickets" className="bloc overflow-hidden">
      <div className="flex flex-wrap items-center justify-between gap-3 px-5 pt-5 pb-3">
        <h2 id="titre-tickets" className="text-section font-semibold tracking-[-0.01em] text-text">
          Tickets
        </h2>
        <div className="flex flex-wrap items-center gap-2">
          <div role="group" aria-label="Filtrer les tickets" className="flex flex-wrap gap-1">
            {filtres.map((f) => {
              const actif = f.cle === filtre
              return (
                <button
                  key={f.cle}
                  type="button"
                  aria-pressed={actif}
                  onClick={() => setFiltre(f.cle)}
                  className={`pressable h-8 rounded-full px-3 text-petit font-medium ${
                    actif ? 'bg-[rgb(var(--accent-rgb)/0.1)] text-accent' : 'survol text-text-2'
                  }`}
                >
                  {f.libelle} <span className="montant">{lignes.filter(f.garde).length}</span>
                </button>
              )
            })}
          </div>
          {termine ? (
            <a
              href={urlExport(lotId)}
              download
              className="pressable flex h-8 items-center gap-1.5 rounded-full border border-line px-3 text-petit font-medium text-text hover:bg-surface-2"
            >
              <DownloadSimpleIcon size={16} aria-hidden="true" />
              Exporter le CSV
            </a>
          ) : (
            <span className="text-petit text-text-2">Export à la fin du tri</span>
          )}
        </div>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full min-w-[880px] border-collapse text-petit">
          <thead>
            <tr className="border-y border-line text-left text-[0.75rem] text-text-2">
              <th scope="col" className="h-8 w-[88px] pl-5 font-medium">
                N°
              </th>
              <th scope="col" className="font-medium">
                Ticket
              </th>
              {COLONNES.map((c) => (
                <th key={c} scope="col" className="w-[128px] font-medium">
                  {CHAMP[c]}
                </th>
              ))}
              <th scope="col" className="w-[88px] font-medium">
                Réclamation
              </th>
              <th scope="col" className="w-[72px] font-medium">
                Échéance
              </th>
              <th scope="col" className="w-[92px] pr-5 font-medium">
                Contrôle
              </th>
            </tr>
          </thead>
          <tbody>
            {visibles.map((l) => {
              const p = l.prediction
              const suspect = p?.injection_suspectee === 'oui'
              const deplie = ouvert === l.n
              return (
                <tr
                  key={l.n}
                  className={`border-b border-line align-top ${suspect ? 'bg-[rgb(var(--danger-rgb)/0.08)]' : ''}`}
                >
                  <td className="py-2.5 pl-5">
                    <span className="flex items-center gap-1.5 font-medium text-text">
                      {suspect && <ShieldWarningIcon size={16} className="text-danger" aria-label="Ticket suspect" />}
                      <span className="montant truncate">{l.id}</span>
                    </span>
                  </td>
                  <td className="py-1.5 pr-4">
                    <button
                      type="button"
                      aria-expanded={deplie}
                      onClick={() => setOuvert(deplie ? null : l.n)}
                      className="flex w-full min-w-0 items-start gap-1 rounded-[6px] py-1 text-left text-text hover:bg-surface-2"
                    >
                      {deplie ? (
                        <CaretDownIcon size={14} className="mt-0.5 shrink-0 text-text-2" aria-hidden="true" />
                      ) : (
                        <CaretRightIcon size={14} className="mt-0.5 shrink-0 text-text-2" aria-hidden="true" />
                      )}
                      <span className={deplie ? 'whitespace-pre-wrap' : 'line-clamp-1'}>{l.ticket}</span>
                    </button>
                    {deplie && p?.sous_motif && (
                      <p className="mt-1 pl-5 text-[0.75rem] text-text-2">Sous-motif : {p.sous_motif.replace(/_/g, ' ')}</p>
                    )}
                  </td>
                  {COLONNES.map((c) => (
                    <td key={c} className="py-2.5 pr-3">
                      <Valeur l={l} col={c} />
                    </td>
                  ))}
                  <td className="py-2.5">
                    {p ? p.reclamation === 'oui' ? <Badge ton="accent">Oui</Badge> : <span className="text-text-2">Non</span> : null}
                  </td>
                  <td className="py-2.5">
                    <span className="montant text-text" title={p?.echeance_texte ?? undefined}>
                      {p?.echeance_court ?? ''}
                    </span>
                  </td>
                  <td className="py-2.5 pr-5 text-text-2">
                    {p?.controle ? p.controle.charAt(0).toUpperCase() + p.controle.slice(1) : ''}
                  </td>
                </tr>
              )
            })}
          </tbody>
        </table>
        {!visibles.length && <p className="px-5 py-8 text-center text-petit text-text-2">Aucun ticket dans cette file.</p>}
      </div>
    </section>
  )
}
