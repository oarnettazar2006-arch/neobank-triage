import type { Mediateur, TicketSuivi } from './contrat'

// Données de maquette, entièrement fictives. Les dates, positions, progressions et
// jours ouvrés restants ont été calculés avec `src/deadlines.py` (réclamation par
// email), à la date du jour indiquée pour chaque ticket. Le ticket en échéance
// dépassée n'a volontairement pas de `envoye_le` : il montre le repli
// « Accusé de réception au plus tard le … ».

const mediateur: Mediateur = {
  nom: 'Médiateur de VAULT (coordonnées de maquette)',
  adresse: '1 rue de l’Exemple, 75000 Paris',
  site: 'mediateur.vault.example',
}

export const maquettes: Record<string, TicketSuivi> = {
  // Carte, reçue aujourd'hui (jeudi 24 septembre 2026).
  'VLT-2026-004188': {
    reference: 'VLT-2026-004188',
    cas: 'reclamation',
    statut: 'recue',
    recu_le: { iso: '2026-09-24', texte: 'jeudi 24 septembre 2026', court: '24 sept.' },
    echeances: [
      { kind: 'accuse_reception', iso: '2026-10-08', texte: 'jeudi 8 octobre 2026', court: '8 oct.', atteinte: false, position: 0.667, envoye_le: null },
      { kind: 'reponse', iso: '2026-10-15', texte: 'jeudi 15 octobre 2026', court: '15 oct.', atteinte: false, position: 1, envoye_le: null },
    ],
    progression: 0,
    jours_ouvres_restants: 15,
    delai: 'normal',
    reponse_envoyee_le: null,
    mediateur: null,
  },
  // Compte (délai de 2 mois), vu le mardi 1er décembre 2026.
  'VLT-2026-004127': {
    reference: 'VLT-2026-004127',
    cas: 'reclamation',
    statut: 'en_cours',
    recu_le: { iso: '2026-11-02', texte: 'lundi 2 novembre 2026', court: '2 nov.' },
    echeances: [
      { kind: 'accuse_reception', iso: '2026-11-17', texte: 'mardi 17 novembre 2026', court: '17 nov.', atteinte: true, position: 0.244, envoye_le: { iso: '2026-11-09', texte: 'lundi 9 novembre 2026', court: '9 nov.' } },
      { kind: 'reponse', iso: '2026-12-31', texte: 'jeudi 31 décembre 2026', court: '31 déc.', atteinte: false, position: 1, envoye_le: null },
    ],
    progression: 0.488,
    jours_ouvres_restants: 21,
    delai: 'normal',
    reponse_envoyee_le: null,
    mediateur: null,
  },
  // Carte, vue le mardi 22 septembre 2026 : 2 jours ouvrés restants.
  'VLT-2026-004093': {
    reference: 'VLT-2026-004093',
    cas: 'reclamation',
    statut: 'en_cours',
    recu_le: { iso: '2026-09-03', texte: 'jeudi 3 septembre 2026', court: '3 sept.' },
    echeances: [
      { kind: 'accuse_reception', iso: '2026-09-17', texte: 'jeudi 17 septembre 2026', court: '17 sept.', atteinte: true, position: 0.667, envoye_le: { iso: '2026-09-10', texte: 'jeudi 10 septembre 2026', court: '10 sept.' } },
      { kind: 'reponse', iso: '2026-09-24', texte: 'jeudi 24 septembre 2026', court: '24 sept.', atteinte: false, position: 1, envoye_le: null },
    ],
    progression: 0.867,
    jours_ouvres_restants: 2,
    delai: 'proche',
    reponse_envoyee_le: null,
    mediateur: null,
  },
  // Virement, vu le jeudi 24 septembre 2026 : échéance du 22 septembre dépassée.
  'VLT-2026-004061': {
    reference: 'VLT-2026-004061',
    cas: 'reclamation',
    statut: 'en_cours',
    recu_le: { iso: '2026-09-01', texte: 'mardi 1er septembre 2026', court: '1er sept.' },
    echeances: [
      { kind: 'accuse_reception', iso: '2026-09-15', texte: 'mardi 15 septembre 2026', court: '15 sept.', atteinte: true, position: 0.667, envoye_le: null },
      { kind: 'reponse', iso: '2026-09-22', texte: 'mardi 22 septembre 2026', court: '22 sept.', atteinte: false, position: 1, envoye_le: null },
    ],
    progression: 1,
    jours_ouvres_restants: 0,
    delai: 'depasse',
    reponse_envoyee_le: null,
    mediateur,
  },
  // Carte, réponse envoyée le mardi 8 septembre 2026, avant l'échéance.
  'VLT-2026-004012': {
    reference: 'VLT-2026-004012',
    cas: 'reclamation',
    statut: 'reponse_envoyee',
    recu_le: { iso: '2026-08-20', texte: 'jeudi 20 août 2026', court: '20 août' },
    echeances: [
      { kind: 'accuse_reception', iso: '2026-09-03', texte: 'jeudi 3 septembre 2026', court: '3 sept.', atteinte: true, position: 0.667, envoye_le: { iso: '2026-08-25', texte: 'mardi 25 août 2026', court: '25 août' } },
      { kind: 'reponse', iso: '2026-09-10', texte: 'jeudi 10 septembre 2026', court: '10 sept.', atteinte: true, position: 1, envoye_le: null },
    ],
    progression: 0.867,
    jours_ouvres_restants: 0,
    delai: 'normal',
    reponse_envoyee_le: { iso: '2026-09-08', texte: 'mardi 8 septembre 2026', court: '8 sept.' },
    mediateur: null,
  },
}
