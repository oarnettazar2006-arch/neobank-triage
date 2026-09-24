"""Extrait la goutte du logo de la planche, en PNG transparent 2x (sans or).

    python docs/design/logo/extraire_goutte.py   # depuis la racine du dépôt

Dépendances : numpy, scipy, Pillow (outil de design, pas un outil du bot).
Sorties : site/public/marque/vault-goutte@2x.png (panneau sombre, 128 px de haut)
          site/public/marque/vault-goutte-clair@2x.png (panneau clair, 64 px de haut)
"""
from pathlib import Path

import numpy as np
from PIL import Image
from scipy import ndimage as ndi

RACINE = Path(__file__).resolve().parents[3]
PLANCHE = RACINE / "docs/design/logo/vault-logo-planche.jpg"
SORTIE = RACINE / "site/public/marque"


def fond_estime(im, marge, degre2):
    """Fond du recadrage : surface ajustée sur une bande de `marge` px au bord."""
    h, w, _ = im.shape
    yy, xx = np.mgrid[0:h, 0:w]
    bord = np.zeros((h, w), bool)
    bord[:marge] = bord[-marge:] = True
    bord[:, :marge] = bord[:, -marge:] = True
    termes = [np.ones(h * w), xx.ravel(), yy.ravel()]
    if degre2:
        termes += [xx.ravel() ** 2, yy.ravel() ** 2, (xx * yy).ravel()]
    A = np.stack(termes, 1)
    fond = np.zeros_like(im)
    for c in range(3):
        coef, *_ = np.linalg.lstsq(A[bord.ravel()], im[..., c].ravel()[bord.ravel()], rcond=None)
        fond[..., c] = (A @ coef).reshape(h, w)
    return fond


def silhouette(alpha, seuil, fermeture, dilatation, flou):
    """Plus grande composante, trous bouchés, léger élargissement, bord adouci."""
    masque = alpha > seuil
    lab, n = ndi.label(masque)
    tailles = ndi.sum(masque, lab, range(1, n + 1))
    masque = ndi.binary_fill_holes(ndi.binary_closing(lab == (np.argmax(tailles) + 1), iterations=fermeture))
    masque = ndi.binary_dilation(masque, iterations=dilatation)
    return masque, ndi.gaussian_filter(masque.astype(float), flou)


def sans_or(img):
    """Les tons chauds (rouge > bleu) deviennent nacre : pas d'or (DESIGN.md 1.1)."""
    a = np.asarray(img).astype(float)
    rgb, al = a[..., :3], a[..., 3:]
    lum = rgb @ [0.2126, 0.7152, 0.0722]
    chaud = ((rgb[..., 0] - rgb[..., 2]) / 60).clip(0, 1)[..., None]
    nacre = np.stack([lum * 0.96, lum * 0.99, lum], -1).clip(0, 255)
    return Image.fromarray(np.dstack([rgb * (1 - chaud) + nacre * chaud, al]).astype(np.uint8), "RGBA")


def rgba(couleur, alpha):
    out = Image.fromarray(np.dstack([couleur, alpha * 255]).astype(np.uint8), "RGBA")
    return out.crop(out.getbbox())


def goutte_sombre(src):
    im = np.asarray(src.crop((80, 205, 380, 525))).astype(float)
    fond = fond_estime(im, 12, degre2=True)
    # alpha additif : la part de lumière ajoutée au fond sombre
    alpha = np.max((im - fond) / np.maximum(255 - fond, 1), axis=2).clip(0, 1)
    masque, doux = silhouette(alpha, 0.06, 6, 2, 1.2)
    alpha = np.maximum(alpha, 0.10 * masque) * doux
    couleur = np.where(alpha[..., None] > 1e-3, fond + (im - fond) / np.maximum(alpha[..., None], 1e-3), 255)
    out = rgba(couleur.clip(0, 255), alpha)
    return sans_or(out.resize((round(out.width * 128 / out.height), 128), Image.LANCZOS))


def goutte_claire(src):
    im = np.asarray(src.crop((548, 625, 652, 740))).astype(float)
    fond = fond_estime(im, 6, degre2=False)
    d = im - fond
    # alpha soustractif (plus sombre que le givre) ou additif (reflets)
    alpha = np.max(np.where(d < 0, -d / np.maximum(fond, 1), d / np.maximum(255 - fond, 1)), axis=2).clip(0, 1)
    masque, doux = silhouette(alpha, 0.05, 3, 1, 0.8)
    alpha = np.maximum(alpha * 1.6, 0.12 * masque).clip(0, 1) * doux
    couleur = np.where(alpha[..., None] > 1e-3, fond + d / np.maximum(alpha[..., None], 1e-3), 0)
    out = rgba(couleur.clip(0, 255), alpha)
    return sans_or(out.resize((round(out.width * 64 / out.height), 64), Image.LANCZOS))


if __name__ == "__main__":
    src = Image.open(PLANCHE).convert("RGB")
    SORTIE.mkdir(parents=True, exist_ok=True)
    goutte_sombre(src).save(SORTIE / "vault-goutte@2x.png", optimize=True)
    goutte_claire(src).save(SORTIE / "vault-goutte-clair@2x.png", optimize=True)
    print("écrit :", *sorted(p.name for p in SORTIE.glob("*.png")))
