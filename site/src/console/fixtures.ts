import demo15 from './demo15.lot.json'
import type { Lot } from './types'

/**
 * Réponse réelle de GET /lots/{id} pour data/demo/demo15.csv, triée en local sur Ollama
 * (llama3.1:8b puis qwen2.5:7b) : catégorie 14/15, produit 14/15, gravité 13/15, 11/15 entièrement justes.
 */
export const DEMO15 = demo15 as unknown as Lot
