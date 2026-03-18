# HANDOFF — SpellCut Frontend Design

## État actuel
- Next.js 16 + Tailwind + shadcn/ui + Phosphor icons installés
- Page principale fonctionnelle (upload + analyse simulée + résultats)
- Le design est MOCHE — à refaire complètement
- Projet : `/Users/tahina/Downloads/spellcut-app/`
- Dev server : `npm run dev` (port 3002 actuellement)

## Specs design exigées par Tahina

### Style général
- **Linear-inspired** — pas template, pas AI slop, un vrai OUTIL
- **Dark mode only** — fond noir profond
- **Helvetica Neue** — font system stack (déjà set dans layout.tsx)
- **Rounded corners** — border-radius partout
- **Noir et blanc** — avec dégradés subtils

### Contrastes & accessibilité (CRITIQUE)
- **PAS d'opacité faible** — texte blanc 100% ou gris clair (#999 minimum), JAMAIS white/40 ou white/30
- WCAG AA minimum sur tous les textes
- Focus visible sur tous les éléments interactifs
- aria-labels sur les boutons icon-only
- Titre = UNE SEULE couleur (blanc pur), pas de gradient text, pas de multi-couleurs

### Effets visuels
- **Grain/noise texture** en overlay (subtil)
- **Grid en fond** — grille pointillée/dot grid comme Linear
- **Glassmorphism / Liquid glass** — effets verre dépoli sur les cartes, nav, upload zone
- **Dégradés subtils** — pas criards

### Animations (GSAP obligatoire)
- **GSAP** — installer `npm install gsap` et utiliser pour :
  - Entrée hero (fade up staggeré)
  - Entrée des éléments au scroll
  - Transition entre les états (idle → analyzing → done)
  - Progress bar smooth
  - Upload zone hover/drag
- `ease: "power3.out"`, durée 0.6-0.8s
- Respecter `prefers-reduced-motion`

### Contenu & messaging
- **Court et direct** — pas de marketing fluff
- Titre : "Vérifie l'orthographe de ta vidéo" (blanc pur, une couleur)
- **PAS de badge** "Moteur v1" — retiré
- **PAS de "Propulsé par Claude"** — retiré
- Guide step-by-step en focus quand on arrive (3 étapes visuelles)
- Crédit footer : **"Tahina Randrianandraina"**

### Fonctionnalités frontend
- **Lecteur vidéo preview** — quand les résultats sont affichés, montrer un player vidéo avec les erreurs superposées aux bons timecodes. L'utilisateur peut cliquer sur une erreur → le player saute au timecode.
- **Export Premiere Pro / After Effects** — PAS DaVinci Resolve. Format markers compatible Adobe (EDL, CSV markers, ou .prproj markers)
- Boutons export : "Premiere Pro" et "JSON"

### Layout
- Max width 3xl (768px) — outil centré, pas pleine page
- Upload zone élégante avec glassmorphism (pas dashed border basique)
- Résultats : liste d'erreurs avec timecodes, corrections, contexte
- Player vidéo au-dessus de la liste d'erreurs

### Packages à installer
```bash
npm install gsap  # Animations GSAP
```

## Backend (TERMINÉ — ne pas toucher)
Le moteur Python est dans `/Users/tahina/Downloads/spellcut/`
- Pipeline : OCR (PaddleOCR) → dédup → LanguageTool → Claude Vision
- Claude Vision lit les pixels directement = 0 faux positifs
- Outputs : JSON + HTML + FCPXML
- Commande : `spellcut analyze video.mp4 -v --fps 1`
- Clé API : `SPELLCUT_ANTHROPIC_API_KEY` (env var)
- À terme : FastAPI pour exposer le pipeline en API REST

## Résultats prouvés sur vidéo réelle (FT_HOVASSE_INTRO_V1.mp4)
- 62 sec, 1920x960, vidéo finance Finary/Carmignac
- **3 vraies erreurs détectées, 0 faux positifs**
- "fond" → "fonds" (99%) — erreur invisible pour tout spell checker classique
- "premiere" → "première" (99%) — accent manquant
- "EMERGENTS" → "ÉMERGENTS" (100%) — accent sur majuscule
