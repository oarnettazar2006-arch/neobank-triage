import { CpuIcon, CodeIcon } from '@phosphor-icons/react'
import type { ReactNode } from 'react'

// Onglet « Pipeline » de la console : ce que fait chaque étape du bot, dans l'ordre du
// « Détail du traitement » d'un ticket. Texte fixe, tiré du code (src/) : aucun appel à l'API.

interface Etape {
  titre: string
  qui: string
  modele: boolean
  entre: string
  sort: string
  details: ReactNode[]
}

const ETAPES: Etape[] = [
  {
    titre: 'Garde d’entrée',
    qui: 'code (src/guard.py)',
    modele: false,
    entre: 'Le texte du client, tel qu’il l’a écrit.',
    sort: 'Le texte nettoyé, les passages retirés et un signal « injection suspectée ».',
    details: [
      'Repère les tentatives d’injection avant tout modèle : fausse balise système ([SYSTEM], ADMIN:), champ du schéma dicté (label=other, severity low), texte caché, consigne adressée à l’assistant, lettres espacées, réponse dictée (« écrivez-moi que… »).',
      'Seul le passage suspect est retiré : le reste du message, qui décrit souvent le vrai problème, part au tri. Le conseiller garde le texte d’origine.',
    ],
  },
  {
    titre: 'Tri',
    qui: 'llama3.1:8b, prompt v7_sous_motif',
    modele: true,
    entre: 'Le texte nettoyé, inséré dans le prompt de tri.',
    sort: 'Catégorie, produit, gravité, sous-motif, réclamation, paiement non autorisé, injection suspectée.',
    details: [
      'La réponse est contrainte par le schéma JSON (src/schema.py) : le modèle ne peut répondre que des valeurs prévues.',
      'Température 0 et graine fixe : le même ticket donne toujours le même tri.',
    ],
  },
  {
    titre: 'Contrôleur',
    qui: 'qwen2.5:7b',
    modele: true,
    entre: 'Le même texte nettoyé.',
    sort: 'Son propre sous-motif, comparé à celui du tri.',
    details: [
      'Un second modèle, d’une autre famille, relit le ticket. La fiche de réponse du sous-motif n’est donnée au rédacteur que si les deux modèles sont d’accord, que le sous-motif est cohérent avec la catégorie, et que « opération non autorisée » va avec un paiement non autorisé.',
      'Sinon, le rédacteur écrit un brouillon générique, sans fiche : un désaccord ne produit jamais une réponse hors sujet.',
    ],
  },
  {
    titre: 'Rédacteur',
    qui: 'llama3.1:8b, prompt reply_v2_fiche (reply_v1 sans fiche)',
    modele: true,
    entre: 'Des faits structurés seulement : motif, situation, échéances, fiche retenue. Jamais le texte du ticket.',
    sort: 'Le brouillon de réponse, pour le conseiller.',
    details: [
      'Comme il ne lit jamais le ticket, une injection cachée dans le message ne peut pas l’atteindre.',
      'Les dates sont vérifiées en code : une échéance absente est ajoutée, une date fausse est remplacée. Un ticket en anglais reçoit un brouillon générique (les fiches sont en français).',
    ],
  },
  {
    titre: 'Garde de sortie',
    qui: 'code (src/output_guard.py)',
    modele: false,
    entre: 'Le brouillon du rédacteur.',
    sort: 'Le brouillon accepté, ou bloqué et remplacé par une réponse type écrite en code.',
    details: [
      'Bloque un montant, une promesse de remboursement ou de garantie, un lien ou une adresse email, un nom ou un numéro venant du ticket (le rédacteur ne l’a pas vu : c’est une fuite ou une invention).',
      'Un brouillon bloqué est signalé au conseiller, jamais envoyé tel quel.',
    ],
  },
  {
    titre: 'Délais',
    qui: 'code (src/deadlines.py)',
    modele: false,
    entre: 'Le tri (réclamation, paiement non autorisé, produit), le canal et la date de réception.',
    sort: 'Les échéances réglementaires, en jours ouvrables hors fériés français.',
    details: [
      'Paiement non autorisé : fin du premier jour ouvrable. Réclamation : accusé de réception sous 10 jours ouvrables (sauf par chat), réponse sous 15 jours ouvrables pour la carte, le virement et le prélèvement, sous 2 mois pour le compte. Autre demande : objectif interne de 2 jours ouvrables.',
      'Une échéance en mois qui tombe un jour férié ou un week-end est avancée au dernier jour ouvrable avant. Aucun modèle ne calcule une date : le rédacteur reçoit celles-ci.',
    ],
  },
]

const PRINCIPES: { titre: string; texte: string }[] = [
  { titre: 'Tout en local', texte: 'Les modèles tournent dans Ollama sur la machine : aucun ticket ne sort.' },
  {
    titre: 'Un modèle à la fois',
    texte: 'Sur un lot, tous les tris, puis tous les contrôles, puis tous les brouillons : un seul modèle chargé en mémoire.',
  },
  {
    titre: 'Le conseiller décide',
    texte: 'Le brouillon attend sa validation (onglet Brouillons). Le client ne le voit jamais : il reçoit un message fixe avec sa référence.',
  },
]

function Ligne({ libelle, children }: { libelle: string; children: ReactNode }) {
  return (
    <div className="grid gap-1 sm:grid-cols-[64px_minmax(0,1fr)] sm:gap-3">
      <p className="text-[0.6875rem] font-semibold tracking-[0.06em] text-text-2 uppercase sm:pt-0.5">{libelle}</p>
      <p className="text-petit text-text">{children}</p>
    </div>
  )
}

/** Les six étapes d'un ticket, puis les principes du pipeline. */
export function ExplicationPipeline() {
  return (
    <div className="space-y-8">
      <div className="max-w-[72ch] space-y-1">
        <h2 className="text-section font-semibold tracking-[-0.01em] text-text">Comment le bot traite un ticket</h2>
        <p className="text-petit text-text-2">
          Six étapes, toujours dans cet ordre. Trois sont du code, trois appellent un modèle. Pour les voir sur un vrai
          ticket : écrire un ticket dans « Tri d’un lot », puis ouvrir « Détail du traitement ».
        </p>
      </div>

      <ol aria-label="Étapes du pipeline" className="space-y-3">
        {ETAPES.map((e, i) => (
          <li key={e.titre} className="bloc p-5">
            <div className="mb-3 flex flex-wrap items-center gap-x-3 gap-y-1">
              <span className="montant flex size-7 items-center justify-center rounded-full bg-[rgb(var(--accent-rgb)/0.12)] text-petit font-semibold text-accent">
                {i + 1}
              </span>
              <h3 className="text-corps font-semibold text-text">{e.titre}</h3>
              <span className="flex items-center gap-1.5 rounded-full bg-surface-2 px-2 py-0.5 text-[0.75rem] leading-4 text-text-2">
                {e.modele ? <CpuIcon size={14} aria-hidden="true" /> : <CodeIcon size={14} aria-hidden="true" />}
                {e.qui}
              </span>
            </div>
            <div className="space-y-2">
              <Ligne libelle="Entre">{e.entre}</Ligne>
              <Ligne libelle="Sort">{e.sort}</Ligne>
            </div>
            <ul className="mt-3 max-w-[80ch] list-disc space-y-1 border-t border-line pt-3 pl-5 text-petit text-text-2">
              {e.details.map((d, k) => (
                <li key={k}>{d}</li>
              ))}
            </ul>
          </li>
        ))}
      </ol>

      <section aria-labelledby="titre-principes" className="space-y-3">
        <h2 id="titre-principes" className="text-section font-semibold tracking-[-0.01em] text-text">
          Principes
        </h2>
        <div className="grid gap-3 md:grid-cols-3">
          {PRINCIPES.map((p) => (
            <div key={p.titre} className="bloc p-5">
              <h3 className="text-corps font-semibold text-text">{p.titre}</h3>
              <p className="mt-1 text-petit text-text-2">{p.texte}</p>
            </div>
          ))}
        </div>
      </section>
    </div>
  )
}
