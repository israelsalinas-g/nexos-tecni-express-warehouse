import React from 'react'
import { View, Text, StyleSheet } from 'react-native'
import Svg, { G, Path, Circle } from 'react-native-svg'
import { tokens } from '@/theme/tokens'

interface Slice {
  label: string
  value: number
  color: string
}

interface Props {
  data: Slice[]
  size?: number
}

const COLORS = ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#0ea5e9', '#ec4899']

function polarToCartesian(cx: number, cy: number, r: number, angleDeg: number) {
  const rad = ((angleDeg - 90) * Math.PI) / 180
  return { x: cx + r * Math.cos(rad), y: cy + r * Math.sin(rad) }
}

function describeArc(cx: number, cy: number, r: number, startAngle: number, endAngle: number) {
  const start = polarToCartesian(cx, cy, r, endAngle)
  const end   = polarToCartesian(cx, cy, r, startAngle)
  const large = endAngle - startAngle > 180 ? 1 : 0
  return `M ${cx} ${cy} L ${start.x} ${start.y} A ${r} ${r} 0 ${large} 0 ${end.x} ${end.y} Z`
}

export function PieChart({ data, size = 160 }: Props) {
  const filtered = data.filter(d => d.value > 0)
  if (!filtered.length) return null

  const total = filtered.reduce((s, d) => s + d.value, 0)
  const cx = size / 2
  const cy = size / 2
  const r  = size / 2 - 8

  let currentAngle = 0
  const slices = filtered.map((d, i) => {
    const slice = (d.value / total) * 360
    const path = describeArc(cx, cy, r, currentAngle, currentAngle + slice)
    currentAngle += slice
    return { ...d, path, color: d.color ?? COLORS[i % COLORS.length] }
  })

  return (
    <View style={styles.wrap}>
      <Svg width={size} height={size}>
        {slices.map((s, i) => (
          <Path key={i} d={s.path} fill={s.color} opacity={0.9} />
        ))}
        {/* Center hole */}
        <Circle cx={cx} cy={cy} r={r * 0.45} fill={tokens.colors.bgLight} />
      </Svg>

      {/* Legend */}
      <View style={styles.legend}>
        {slices.map((s, i) => (
          <View key={i} style={styles.legendItem}>
            <View style={[styles.dot, { backgroundColor: s.color }]} />
            <Text style={styles.legendLabel} numberOfLines={1}>
              {s.label}
            </Text>
            <Text style={styles.legendPct}>
              {((s.value / total) * 100).toFixed(1)}%
            </Text>
          </View>
        ))}
      </View>
    </View>
  )
}

const styles = StyleSheet.create({
  wrap: { flexDirection: 'row', alignItems: 'center', gap: tokens.spacing.md },
  legend: { flex: 1, gap: 6 },
  legendItem: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  dot: { width: 8, height: 8, borderRadius: 4, flexShrink: 0 },
  legendLabel: { flex: 1, fontSize: tokens.typography.size.xs, color: tokens.colors.gray800 },
  legendPct: { fontSize: tokens.typography.size.xs, fontWeight: '700', color: tokens.colors.gray600 },
})
