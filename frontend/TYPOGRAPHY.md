# FrenchWithUs Typography System

## Font Choices

### Primary Pairing (Latin: French, English)

| Role | Font | Weights | Why |
|------|------|--------|-----|
| **Headings** | Nunito | 600, 700, 800 | Rounded, friendly, widely used in education. Soft curves feel approachable. |
| **Body** | Nunito Sans | 400, 500, 600 | Slightly less rounded than Nunito—better for long reading. Harmonizes with Nunito. |

### Script-Specific Fallbacks

| Script | Font | Weights | Why |
|--------|------|--------|-----|
| **Arabic** | Noto Sans Arabic | 400, 500, 600, 700 | Designed for Arabic, excellent readability, natural spacing. Matches Noto family harmony. |
| **Chinese** | Noto Sans SC | 400, 500, 700 | Simplified Chinese. Clean, modern, optimized for screen. |

### Fallback Chain

```
Latin:     Nunito / Nunito Sans → system-ui → -apple-system → sans-serif
Arabic:    Noto Sans Arabic → Nunito Sans → system-ui → sans-serif  
Chinese:   Noto Sans SC → Nunito Sans → system-ui → sans-serif
```

---

## Typography Hierarchy

| Element | Font | Weight | Size (mobile) | Size (desktop) | Line height | Use |
|---------|------|--------|--------------|----------------|-------------|-----|
| **H1** | Nunito | 700 | 2rem (32px) | 3rem (48px) | 1.2 | Hero, page titles |
| **H2** | Nunito | 700 | 1.5rem (24px) | 2rem (32px) | 1.3 | Section titles |
| **H3** | Nunito | 600 | 1.25rem (20px) | 1.5rem (24px) | 1.35 | Card titles, subsections |
| **Body** | Nunito Sans | 400 | 0.875rem (14px) | 1rem (16px) | 1.6 | Paragraphs |
| **Body large** | Nunito Sans | 400 | 1rem (16px) | 1.125rem (18px) | 1.6 | Hero subtitle, lead text |
| **Small** | Nunito Sans | 400 | 0.75rem (12px) | 0.875rem (14px) | 1.5 | Captions, labels |
| **Button** | Nunito Sans | 600 | 0.875rem (14px) | 0.875rem (14px) | 1.2 | CTA, buttons |
| **Caption** | Nunito Sans | 500 | 0.75rem (12px) | 0.8125rem (13px) | 1.4 | Tags, badges |

---

## Arabic-Specific Adjustments

- **Letter-spacing**: Slightly increased for readability (`letter-spacing: 0.02em` on body)
- **Line-height**: 1.7–1.8 for Arabic body text (more than Latin)
- **Font-size**: Slightly larger base (1.05em) for comfortable reading

---

## Performance & Loading

1. **Preconnect** to fonts.googleapis.com and fonts.gstatic.com (already in place)
2. **font-display: swap** to avoid FOIT (Flash of Invisible Text)
3. **Subset loading**: Only load weights you use (400, 500, 600, 700)
4. **Unicode-range**: Let the browser load only needed glyphs when possible

---

## Best Practices

1. **Consistency**: Use the same hierarchy across all 4 languages
2. **Contrast**: Ensure 4.5:1 minimum for body text (WCAG AA)
3. **Line length**: 45–75 characters per line for optimal readability
4. **Spacing**: Use consistent vertical rhythm (multiples of 4px or 8px)
5. **RTL**: Test Arabic layout; `dir="rtl"` and logical properties (`margin-inline`, `padding-inline`) handle layout
6. **Reduced motion**: Respect `prefers-reduced-motion` for any text animations
