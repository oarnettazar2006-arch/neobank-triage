import {
  ArrowsClockwiseIcon,
  ArrowsLeftRightIcon,
  BriefcaseIcon,
  FirstAidKitIcon,
  ForkKnifeIcon,
  HouseIcon,
  LightningIcon,
  ShoppingCartIcon,
  TicketIcon,
  TrainIcon,
} from '@phosphor-icons/react'
import type { Categorie } from '../donnees/types'

/** Une icône Phosphor par catégorie (DESIGN.md 5.4). */
export const ICONE_CATEGORIE: Record<Categorie, typeof HouseIcon> = {
  Courses: ShoppingCartIcon,
  Transports: TrainIcon,
  Santé: FirstAidKitIcon,
  Abonnements: ArrowsClockwiseIcon,
  Restaurants: ForkKnifeIcon,
  Loisirs: TicketIcon,
  Virements: ArrowsLeftRightIcon,
  Énergie: LightningIcon,
  Logement: HouseIcon,
  Revenus: BriefcaseIcon,
}
