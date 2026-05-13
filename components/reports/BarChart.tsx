import React from 'react'
import { View, Text, StyleSheet, ScrollView, Dimensions } from 'react-native'
import Svg, { Rect, Line, Text as SvgText, G } from 'react-native-svg'
import { tokens } from '@/theme/tokens'

interface BarItem {
  label: string
  value: number
  color?: string
}

interface Props {
  data: BarItem[]
  height?: number
  barColor?: string
  formatValue?: (v: number) => string
}

const DEFAULT_H = 160
const BAR_W = 28
const GROUP_GAP = 12

export function BarChart({ data, height = DEFAULT_H, barColor = tokens.colors.primary, formatValue }: Props) {
  if (!data.length) return null

  const maxVal = Math.max(...data.map(d => d.value), 1)
  const barArea = height - 36  // reserve for x-labels

  const fmtV = formatValue ?? ((v: number) => {
    if (v >= 1000) return `L.${(v / 1000).toFixed(1)}k`
    return `L.${v.toFixed(0)}`
  })

  const totalW = data.length * (BAR_W + GROUP_GAP) + GROUP_GAP

  return (
    <ScrollView horizontal showsHorizontalScrollIndicator={false}>
      <Svg width={totalW} height={height + 4}>
        {/* Base line */}
        <Line x1={0} y1={barArea + 4} x2={totalW} y2={barArea + 4} stroke={tokens.colors.gray100} strokeWidth={1} />

        {data.map((d, i) => {
          const x = GROUP_GAP + i * (BAR_W + GROUP_GAP)
          const bh = d.value > 0 ? Math.max(4, (d.value / maxVal) * barArea) : 0
          const color = d.color ?? barColor

          return (
            <G key={i}>
              <Rect
                x={x}
                y={barArea - bh + 4}
                width={BAR_W}
                height={bh}
                rx={4}
                fill={color}
                opacity={0.88}
              />
              {/* Value label above bar */}
              {bh > 12 && (
                <SvgText
                  x={x + BAR_W / 2}
                  y={barArea - bh}
                  fontSize={8}
                  fill={tokens.colors.gray600}
                  textAnchor="middle"
                >
                  {fmtV(d.value)}
                </SvgText>
              )}
              {/* X label */}
              <SvgText
                x={x + BAR_W / 2}
                y={height + 2}
                fontSize={9}
                fill={tokens.colors.gray400}
                textAnchor="middle"
              >
                {d.label}
              </SvgText>
            </G>
          )
        })}
      </Svg>
    </ScrollView>
  )
}
