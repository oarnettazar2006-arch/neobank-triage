import type { Accueil } from './types'

// Données entièrement fictives (démo). Client, IBAN, carte et employeur sont
// inventés ; les enseignes sont celles qu'on lit sur un vrai relevé français.
// Le résumé du mois est la somme exacte des opérations de septembre (testé).
export const accueil: Accueil = {
  client: { prenom: 'Élise', nom: 'Roussel', initiales: 'ÉR' },
  compte: { nom: 'Compte courant', iban_masque: 'FR76 •••• •••• 0427', solde: 231846 },
  carte: {
    nom: 'Carte VAULT',
    derniers_chiffres: '7310',
    titulaire: 'Élise Roussel',
    expiration: '09/29',
    etat: 'active',
  },
  mois: {
    libelle: 'Septembre',
    depenses: 141791,
    revenus: 4500,
    categories: [
      { categorie: 'Logement', montant: 94000 },
      { categorie: 'Transports', montant: 16700 },
      { categorie: 'Courses', montant: 12292 },
    ],
  },
  jours: [
    {
      libelle: 'Aujourd’hui',
      operations: [
        { id: 'op17', libelle: 'Boulangerie du Marché', categorie: 'Courses', montant: -460, heure: '08:12' },
        { id: 'op16', libelle: 'Uber', categorie: 'Transports', montant: -1420, heure: '00:41' },
      ],
    },
    {
      libelle: 'Hier',
      operations: [
        { id: 'op15', libelle: 'Monoprix', categorie: 'Courses', montant: -3285, heure: '19:06' },
        { id: 'op14', libelle: 'Pharmacie Saint-Paul', categorie: 'Santé', montant: -890, heure: '12:30' },
      ],
    },
    {
      libelle: 'Mardi 22 septembre',
      operations: [{ id: 'op13', libelle: 'SNCF Connect', categorie: 'Transports', montant: -6400, detail: 'Paris - Lyon' }],
    },
    {
      libelle: 'Lundi 21 septembre',
      operations: [{ id: 'op12', libelle: 'Spotify', categorie: 'Abonnements', montant: -1112 }],
    },
    {
      libelle: 'Samedi 19 septembre',
      operations: [
        { id: 'op11', libelle: 'Bistrot des Arts', categorie: 'Restaurants', montant: -3850, heure: '21:47' },
        { id: 'op10', libelle: 'Fnac', categorie: 'Loisirs', montant: -2499, heure: '15:02' },
      ],
    },
    {
      libelle: 'Vendredi 18 septembre',
      operations: [
        { id: 'op09', libelle: 'Hugo Roussel', categorie: 'Virements', montant: 4500, detail: 'Remboursement dîner' },
      ],
    },
    {
      libelle: 'Mercredi 16 septembre',
      operations: [{ id: 'op08', libelle: 'Free Mobile', categorie: 'Abonnements', montant: -1999 }],
    },
    {
      libelle: 'Lundi 14 septembre',
      operations: [{ id: 'op07', libelle: 'Picard', categorie: 'Courses', montant: -2735 }],
    },
    {
      libelle: 'Jeudi 10 septembre',
      operations: [{ id: 'op06', libelle: 'Netflix', categorie: 'Abonnements', montant: -1349 }],
    },
    {
      libelle: 'Samedi 5 septembre',
      operations: [{ id: 'op05', libelle: 'Carrefour Market', categorie: 'Courses', montant: -5812 }],
    },
    {
      libelle: 'Jeudi 3 septembre',
      operations: [{ id: 'op04', libelle: 'EDF', categorie: 'Énergie', montant: -7100, detail: 'Prélèvement mensuel' }],
    },
    {
      libelle: 'Mardi 1er septembre',
      operations: [
        { id: 'op03', libelle: 'Navigo', categorie: 'Transports', montant: -8880, detail: 'Forfait mois' },
        { id: 'op02', libelle: 'SCI Les Tilleuls', categorie: 'Logement', montant: -94000, detail: 'Loyer septembre' },
      ],
    },
    {
      libelle: 'Lundi 31 août',
      operations: [
        { id: 'op01', libelle: 'Atelier Lumen SAS', categorie: 'Revenus', montant: 261000, detail: 'Salaire août' },
      ],
    },
  ],
}
