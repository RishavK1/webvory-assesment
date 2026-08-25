import { useMemo, useState } from 'react'
import { ChartTooltip } from './ChartFrame'

const TAU = Math.PI * 2

function polar(cx, cy, radius, angle) {
  return [cx + radius * Math.cos(angle - Math.PI / 2), cy + radius * Math.sin(angle - Math.PI / 2)]
}

/** SVG path for one ring segment (an annulus wedge). */
function arcPath(cx, cy, outer, inner, start, end) {
  const largeArc = end - start > Math.PI ? 1 : 0
  const [ox1, oy1] = polar(cx, cy, outer, start)
  const [ox2, oy2] = polar(cx, cy, outer, end)
  const [ix2, iy2] = polar(cx, cy, inner, end)
  const [ix1, iy1] = polar(cx, cy, inner, start)
  return [
    `M ${ox1} ${oy1}`,
    `A ${outer} ${outer} 0 ${largeArc} 1 ${ox2} ${oy2}`,
    `L ${ix2} ${iy2}`,
    `A ${inner} ${inner} 0 ${largeArc} 0 ${ix1} ${iy1}`,
    'Z',
  ].join(' ')
}

export function DonutChart({
  segments,
  total,
  heroLabel = 'Total',
  size = 190,
  thickness = 26,
  onSegmentClick,
}) {
  const [hovered, setHovered] = useState(null)

  const cx = size / 2
  const cy = size / 2
  const outer = size / 2 - 2
  const inner = outer - thickness

  // A 2px visual gap, converted to the angle it subtends at this radius.
  const gapAngle = total > 0 ? 2 / outer : 0

  const arcs = useMemo(() => {
    const visible = segments.filter((segment) => segment.value > 0)
    let cursor = 0
    return visible.map((segment) => {
      const sweep = (segment.value / total) * TAU
      const start = cursor
      const end = cursor + sweep
      cursor = end
      // Never let the gap invert a very thin segment.
      const inset = Math.min(gapAngle / 2, sweep / 4)
      return { ...segment, path: arcPath(cx, cy, outer, inner, start + inset, end - inset) }
    })
  }, [segments, total, cx, cy, outer, inner, gapAngle])

  const active = hovered ? segments.find((segment) => segment.key === hovered) : null

  return (
    <div className="relative flex items-center justify-center">
      <svg
        width={size}
        height={size}
        viewBox={`0 0 ${size} ${size}`}
        role="img"
        aria-label={`${heroLabel}: ${total}. ${segments
          .map((s) => `${s.label} ${s.value}`)
          .join(', ')}`}
      >
        {total === 0 && (
          <circle
            cx={cx}
            cy={cy}
            r={(outer + inner) / 2}
            fill="none"
            strokeWidth={thickness}
            className="stroke-zinc-100 dark:stroke-zinc-800"
          />
        )}

        {arcs.map((arc) => (
          <path
            key={arc.key}
            d={arc.path}
            fill={arc.color}
            className="origin-center cursor-pointer transition-opacity duration-150"
            onMouseEnter={() => setHovered(arc.key)}
            onMouseLeave={() => setHovered(null)}
            onClick={() => onSegmentClick?.(arc)}
            style={{ opacity: hovered && hovered !== arc.key ? 0.35 : 1 }}
          >
            <title>{`${arc.label}: ${arc.value}`}</title>
          </path>
        ))}
      </svg>

      {/* Hero figure. Proportional (not tabular) numerals — equal-width digits
          look loose at display sizes. */}
      <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center">
        <span className="text-[28px] font-bold leading-none tracking-tight tabular-nums text-zinc-900 dark:text-zinc-50">
          {active ? active.value : total}
        </span>
        <span className="mt-1 max-w-[80px] text-center text-[11px] leading-tight text-zinc-500 dark:text-zinc-400">
          {active ? active.label : heroLabel}
        </span>
      </div>

      <ChartTooltip visible={false} x={0} y={0} />
    </div>
  )
}
