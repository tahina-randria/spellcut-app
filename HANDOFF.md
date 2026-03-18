# HANDOFF — SpellCut Frontend Design

## État actuel
- Next.js 16 + Tailwind + shadcn/ui + Phosphor icons installés
- Page principale fonctionnelle (upload + analyse simulée + résultats)
- Le design est MOCHE — à refaire complètement

## Specs design exigées par Tahina

### Style général
- **Linear-inspired** — pas template, pas AI slop, un vrai OUTIL
- **Dark mode only** — fond noir profond
- **Helvetica Neue** — font system stack (déjà set dans layout.tsx)
- **Rounded corners** — border-radius partout
- **Noir et blanc** — avec dégradés subtils

### Contrastes & accessibilité (PRIORITAIRE)
- **PAS d'opacité faible** — texte blanc 100% ou gris clair, JAMAIS white/40
- WCAG AA minimum sur tous les textes
- Focus visible sur tous les éléments interactifs
- aria-labels sur les boutons icon-only

### Effets visuels
- **Grain/noise texture** en overlay (subtil)
- **Grid en fond** — grille pointillée comme Linear
- **Glassmorphism / Liquid glass** — effets verre dépoli sur les cartes/nav
- **Dégradés subtils** — pas criards

### Animations
- **GSAP** — installer et utiliser pour :
  - Entrée hero (fade up staggeré)
  - Entrée des éléments au scroll
  - Transition entre les états (idle → analyzing → done)
  - Progress bar smooth
- `ease: "power3.out"`, durée 0.6-0.8s
- Respecter `prefers-reduced-motion`

### Contenu & messaging
- **Court et direct** — pas de marketing fluff
- Titre : "Vérifie l'orthographe de ta vidéo" (une couleur, blanc pur)
- **PAS de badge** "Moteur v1" — retiré
- **PAS de "Propulsé par Claude"** — retiré
- Guide step-by-step en focus quand on arrive (3 étapes visuelles)
- Crédit footer : "Tahina Randrianandraina"

### Layout
- Max width 3xl (768px) — outil centré, pas pleine page
- Upload zone élégante (pas dashed border basique)
- Résultats : liste d'erreurs avec timecodes, corrections, contexte

### Packages à installer
```bash
npm install gsap lenis  # Animations
```

## Backend (TERMINÉ — ne pas toucher)
Le moteur Python est dans `/Users/tahina/Downloads/spellcut/`
- Pipeline : OCR (PaddleOCR) → dédup → LanguageTool → Claude Vision
- Claude Vision lit les pixels = 0 faux positifs
- Outputs : JSON + HTML + FCPXML (DaVinci Resolve markers)
- Commande : `spellcut analyze video.mp4 -v --fps 1`
- API key : `SPELLCUT_ANTHROPIC_API_KEY=sk-ant-...`

## Résultats sur vidéo réelle (FT_HOVASSE_INTRO_V1.mp4)
- 3 vraies erreurs détectées, 0 faux positifs
- "fond" → "fonds" (99%)
- "premiere" → "première" (99%)
- "EMERGENTS" → "ÉMERGENTS" (100%)
