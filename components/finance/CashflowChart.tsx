import { View, Text, StyleSheet, ScrollView } from 'react-native'
import Svg, { Rect, Line, Text as SvgText } from 'react-native-svg'
import { tokens } from '@/theme/tokens'
import { WeeklyBar } from '@/services/balance.service'

interface Props {
  data: WeeklyBar[]
  height?: number
}

const CHART_H    = 140
const BAR_W      = 14
const BAR_GAP    = 6
const GROUP_GAP  = 20
const COLOR_IN   = '#10b981'
const COLOR_EXP  = '#ef4444'

export function CashflowChart({ data, height = CHART_H }: Props) {
  if (!data.length) {
    return (
      <View style={[styles.empty, { height }]}>
        <Text style={styles.emptyText}>Sin datos para el período</Text>
      </View>
    )
  }

  const maxVal = Math.max(...data.flatMap(d => [d.income, d.expenses]), 1)
  const groupW  = BAR_W * 2 + BAR_GAP + GROUP_GAP
  const totalW  = data.length * groupW + GROUP_GAP
  const svgW    = Math.max(totalW, 300)
  const chartH  = height
  const barArea = chartH - 30  // reserve 30px for labels

  return (
    <View style={styles.container}>
      <ScrollView horizontal showsHorizontalScrollIndicator={false}>
        <Svg width={svgW} height={chartH + 4}>
          {/* Grid line at top */}
          <Line x1={0} y1={4} x2={svgW} y2={4} stroke="#e5e7eb" strokeWidth={1} />
          <Line x1={0} y1={barArea / 2 + 4} x2={svgW} y2={barArea / 2 + 4} stroke="#e5e7eb" strokeWidth={0.5} strokeDasharray="4,4" />

          {data.map((d, i) => {
            const x = GROUP_GAP / 2 + i * groupW
            const incomeH  = d.income   > 0 ? Math.max(4, (d.income   / maxVal) * barArea) : 0
            const expenseH = d.expenses > 0 ? Math.max(4, (d.expenses / maxVal) * barArea) : 0

            return (
              <React.Fragment key={d.week}>
                {/* Income bar */}
                <Rect
                  x={x}
                  y={barArea - incomeH + 4}
                  width={BAR_W}
                  height={incomeH}
                  rx={3}
                  fill={COLOR_IN}
                  opacity={0.85}
                />
                {/* Expense bar */}
                <Rect
                  x={x + BAR_W + BAR_GAP}
                  y={barArea - expenseH + 4}
                  width={BAR_W}
                  height={expenseH}
                  rx={3}
                  fill={COLOR_EXP}
                  opacity={0.75}
                />
                {/* Week label */}
                <SvgText
                  x={x + BAR_W + BAR_GAP / 2}
                  y={chartH}
                  fontSize={9}
                  fill="#9ca3af"
                  textAnchor="middle"
                >
                  {d.week}
                </SvgText>
              </React.Fragment>
            )
          })}
        </Svg>
      </ScrollView>

      {/* Legend */}
      <View style={styles.legend}>
        <View style={styles.legendItem}>
          <View style={[styles.legendDot, { backgroundColor: COLOR_IN }]} />
          <Text style={styles.legendText}>Ingresos</Text>
        </View>
        <View style={styles.legendItem}>
          <View style={[styles.legendDot, { backgroundColor: COLOR_EXP }]} />
          <Text style={styles.legendText}>Gastos</Text>
        </View>
      </View>
    </View>
  )
}

// React import needed for React.Fragment in SVG rendering
import React from 'react'

const styles = StyleSheet.create({
  container: { paddingVertical: tokens.spacing.sm },
  empty: { justifyContent: 'center', alignItems: 'center' },
  emptyText: { color: tokens.colors.gray400, fontSize: tokens.typography.size.sm },
  legend: {
    flexDirection: 'row', gap: tokens.spacing.md,
    justifyContent: 'center', marginTop: 6,
  },
  legendItem: { flexDirection: 'row', alignItems: 'center', gap: 5 },
  legendDot: { width: 8, height: 8, borderRadius: 4 },
  legendText: { fontSize: tokens.typography.size.xs, color: tokens.colors.gray600 },
})
