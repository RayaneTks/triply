# Triply — Audit UI complet (relance)

**Audité :** 2026-06-15  
**Baseline :** DESIGN.md + PRODUCT.md + impeccable (audit/critique/product) + emil-design-eng  
**Screenshots :** Non capturés (Playwright browsers manquants ; serveur :5173 actif)  
**Mode :** Read-only (aucune modification code)

## Scores 6 piliers

| Pilier | Score | Synthèse |
|--------|-------|----------|
| Copywriting | 3/4 | Voix FR chaleureuse ; jargon marketing landing + termes techniques product |
| Visuals | 3/4 | Identité cyan + carte hero forte ; densité trip detail élevée |
| Color | 2/4 | Drift emerald vs cyan ; hardcodes hex ; gray-on-color |
| Typography | 2/4 | Chillax/Gotham OK ; micro tailles 9–13px dans formulaires denses |
| Spacing | 3/4 | Grille 8px globalement ; arbitrary values intentionnels sur moments |
| Experience Design | 2/4 | Fake delays, scrollbars masqués, modales partiellement a11y |

**Overall : 15/24** — Bonne fondation designer ; dette product + AI tells landing.

## Top 3 fixes

1. Remplacer emerald sélection/succès par tokens brand (`--primary`, `--success-fg`) — cohérence identité  
2. Supprimer `setTimeout` artificiels (TripsListView, ManualCanvasView) — confiance perçue  
3. Modales delete + focus trap + `role="dialog"` partout — WCAG AA

Voir rapport détaillé dans la conversation orchestrateur (format ultra détaillé demandé).
