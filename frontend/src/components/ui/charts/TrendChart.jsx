import { useMemo, useRef, useState } from 'react'
import { ChartTooltip } from './ChartFrame'

function smoothPath(points) {
  if (points.length === 0) return ''
  if (points.length < 3) return points.map((p, i) => `${i ? 'L' : 'M'} ${p.x} ${p.y}`).join(' ')

  let d = `M ${points[0].x} ${points[0].y}`
  for (let i = 0; i < points.length - 1; i += 1) {
    const p0 = points[i - 1] ?? points[i]
    const p1 = points[i]
    const p2 = points[i + 1]
    const p3 = points[i + 2] ?? p2
    const c1x = p1.x + (p2.x - p0.x) / 6
    const c1y = p1.y + (p2.y - p0.y) / 6
    const c2x = p2.x - (p3.x - p1.x) / 6
    const c2y = p2.y - (p3.y - p1.y) / 6
    d += ` C ${c1x} ${c1y}, ${c2x} ${c2y}, ${p2.x} ${p2.y}`
  }
  return d
}

export function TrendChart({ data, series, height = 190, formatX, formatTooltipX }) {
  const wrapRef = useRef(null)
  const [hoverIndex, setHoverIndex] = useState(null)

  const padding = { top: 12, right: 8, bottom: 24, left: 26 }
  const width = 560
  const plotW = width - padding.left - padding.right
  const plotH = height - padding.top - padding.bottom

  const maxValue = useMemo(() => {
    const values = data.flatMap((row) => series.map((s) => row[s.key] ?? 0))
    // Always leave headroom so the peak never touches the frame.
    return Math.max(4, Math.ceil(Math.max(0, ...values) * 1.25))
  }, [data, series])

  const xAt = (index) => padding.left + (data.length <= 1 ? plotW / 2 : (index / (data.length - 1)) * plotW)
  const yAt = (value) => padding.top + plotH - (value / maxValue) * plotH

  const ticks = useMemo(() => {
    const count = 3
    return Array.from({ length: count + 1 }, (_, i) => Math.round((maxValue / count) * i))
  }, [maxValue])

  function handleMove(event) {
    const rect = wrapRef.current.getBoundingClientRect()
    const ratio = (event.clientX - rect.left) / rect.width
    const svgX = ratio * width
    const index = Math.round(((svgX - padding.left) / plotW) * (data.length - 1))
    setHoverIndex(Math.max(0, Math.min(data.length - 1, index)))
  }

  const hovered = hoverIndex !== null ? data[hoverIndex] : null

  return (
    <div ref={wrapRef} className="relative w-full">
      <svg
        viewBox={`0 0 ${width} ${height}`}
        className="w-full"
        preserveAspectRatio="none"
        role="img"
        aria-label={`${series.map((s) => s.label).join(' and ')} per day`}
        onMouseMove={handleMove}
        onMouseLeave={() => setHoverIndex(null)}
      >
        {/* Recessive solid hairlines — never dashed, which reads as a threshold. */}
        {ticks.map((tick) => (
          <g key={tick}>
            <line
              x1={padding.left}
              x2={width - padding.right}
              y1={yAt(tick)}
              y2={yAt(tick)}
              className="stroke-zinc-200 dark:stroke-white/8"
              strokeWidth={1}
            />
            <text
              x={padding.left - 6}
              y={yAt(tick) + 3}
              textAnchor="end"
              className="fill-slate-400 text-[9px] tabular-nums"
            >
              {tick}
            </text>
          </g>
        ))}

        {series.map((s) => {
          const points = data.map((row, index) => ({ x: xAt(index), y: yAt(row[s.key] ?? 0) }))
          const line = smoothPath(points)
          const area = `${line} L ${xAt(data.length - 1)} ${yAt(0)} L ${xAt(0)} ${yAt(0)} Z`
          return (
            <g key={s.key}>
              {s.fill && <path d={area} fill={s.color} opacity={0.09} />}
              <path
                d={line}
                fill="none"
                stroke={s.color}
                strokeWidth={2}
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </g>
          )
        })}

        {hovered && (
          <g>
            <line
              x1={xAt(hoverIndex)}
              x2={xAt(hoverIndex)}
              y1={padding.top}
              y2={padding.top + plotH}
              className="stroke-zinc-300 dark:stroke-zinc-600"
              strokeWidth={1}
            />
            {series.map((s) => (
              <circle
                key={s.key}
                cx={xAt(hoverIndex)}
                cy={yAt(hovered[s.key] ?? 0)}
                r={4}
                fill={s.color}
                // 2px surface ring rather than a border, so overlapping
                // markers stay separable.
                className="stroke-white dark:stroke-[#12131a]"
                strokeWidth={2}
              />
            ))}
          </g>
        )}

        {data.map((row, index) =>
          index % Math.ceil(data.length / 6) === 0 ? (
            <text
              key={row.date}
              x={xAt(index)}
              y={height - 6}
              textAnchor="middle"
              className="fill-slate-400 text-[9px]"
            >
              {formatX(row.date)}
            </text>
          ) : null,
        )}
      </svg>

      <ChartTooltip
        visible={Boolean(hovered)}
        x={hovered ? (xAt(hoverIndex) / width) * (wrapRef.current?.clientWidth ?? width) : 0}
        y={40}
      >
        {hovered && (
          <div className="space-y-0.5">
            <p className="text-[11px] font-semibold text-zinc-900 dark:text-zinc-100">
              {formatTooltipX(hovered.date)}
            </p>
            {series.map((s) => (
              <p key={s.key} className="flex items-center gap-1.5 text-[11px]">
                <span
                  className="h-1.5 w-1.5 rounded-[1px]"
                  style={{ background: s.color }}
                  aria-hidden="true"
                />
                <span className="text-zinc-500 dark:text-zinc-400">{s.label}</span>
                <span className="font-medium tabular-nums text-zinc-900 dark:text-zinc-200">
                  {hovered[s.key] ?? 0}
                </span>
              </p>
            ))}
          </div>
        )}
      </ChartTooltip>
    </div>
  )
}
