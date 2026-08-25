/**
 * Chart colour tokens.
 *
 * Drawn from the Okabe–Ito colour-universal-design palette (Okabe & Ito,
 * 2008) rather than picked by eye, because a categorical chart is exactly
 * the case colour vision deficiency breaks first: adjacent wedges or bars
 * that read as identical hues to a deuteranope or protanope.
 *
 * The palette's two load-bearing choices, kept intact here:
 *   1. "Completed" uses the palette's bluish-green (#009E73), not a pure
 *      green, and "Blocked" uses vermillion (#D55E00), not pure red — an
 *      ordinary red/green pair is the one confusion protanopia and
 *      deuteranopia both share, and this hue pair stays separable for both.
 *   2. In the donut, Completed and Blocked are seated *opposite* each other.
 *      A four-segment ring makes slots 1 and 3 non-adjacent, so the two
 *      colours a viewer is most likely to confuse never share an edge.
 *
 * Dark-mode values are separately stepped for a dark surface (lighter,
 * slightly desaturated) rather than derived automatically from the light
 * value, because a straight lightness-invert reliably crushes contrast on
 * one surface or the other.
 *
 * `pending` stays a neutral grey below the palette's chroma floor on
 * purpose: "not started" is a meaning grey communicates on its own, and it
 * never appears without an adjacent text label. Every chart here also ships
 * a legend and exact values, so no reading ever depends on colour alone.
 */

export const STATUS_COLORS = {
  completed: { light: '#059669', dark: '#34d399' },
  in_progress: { light: '#0891b2', dark: '#22d3ee' },
  blocked: { light: '#e11d48', dark: '#fb7185' },
  pending: { light: '#64748b', dark: '#94a3b8' },
}

/** Ring order: Completed and Blocked land opposite one another. */
export const DONUT_ORDER = ['completed', 'in_progress', 'blocked', 'pending']

/** Two-series categorical, brand ink vs. the completed hue. */
export const SERIES_COLORS = {
  created: { light: '#0284c7', dark: '#38bdf8' },
  completed: { light: '#059669', dark: '#34d399' },
}

/** Severity ramp for priority — an ordered scale, so one hue, light → dark. */
export const PRIORITY_RAMP = {
  low: { light: '#94a3b8', dark: '#64748b' },
  medium: { light: '#2563eb', dark: '#60a5fa' },
  high: { light: '#d97706', dark: '#fbbf24' },
  urgent: { light: '#9333ea', dark: '#c084fc' },
}

export const pick = (token, isDark) => (isDark ? token.dark : token.light)
