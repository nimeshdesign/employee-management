import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  LabelList,
} from 'recharts'
import { useTheme } from '../context/ThemeContext'

// This compares one metric (headcount) across categories (departments) —
// that's a magnitude comparison, not an identity comparison, so every bar
// stays ONE hue. Coloring each department a different color would be the
// classic dataviz mistake here: it'd visually suggest each bar is its own
// "series" when they're really one series measured at five points.
const COLORS = {
  light: { bar: '#2563eb', grid: '#e5e7eb', text: '#6b7280', tooltipBg: '#ffffff', tooltipBorder: '#e5e7eb' },
  dark: { bar: '#60a5fa', grid: '#374151', text: '#9ca3af', tooltipBg: '#1f2937', tooltipBorder: '#374151' },
}

function DepartmentChart({ data }) {
  const { theme } = useTheme()
  const c = COLORS[theme]

  return (
    // ResponsiveContainer measures its parent and re-renders the SVG to
    // fit — necessary because Recharts needs explicit pixel dimensions,
    // which a fluid Tailwind layout doesn't give it directly.
    <ResponsiveContainer width="100%" height={260}>
      <BarChart data={data} margin={{ top: 20, right: 8, left: -16, bottom: 0 }}>
        {/* Hairline, solid, one step off the surface — never dashed. */}
        <CartesianGrid vertical={false} stroke={c.grid} strokeDasharray="0" />
        <XAxis
          dataKey="department"
          tick={{ fill: c.text, fontSize: 12 }}
          axisLine={{ stroke: c.grid }}
          tickLine={false}
        />
        <YAxis tick={{ fill: c.text, fontSize: 12 }} axisLine={false} tickLine={false} allowDecimals={false} />
        <Tooltip
          cursor={{ fill: theme === 'dark' ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.04)' }}
          contentStyle={{
            background: c.tooltipBg,
            border: `1px solid ${c.tooltipBorder}`,
            borderRadius: 8,
            fontSize: 13,
          }}
          labelStyle={{ color: c.text }}
        />
        {/* barSize caps bar thickness (never fill the whole slot); radius
            rounds only the top — square at the baseline, per spec. No
            <Legend /> — a single series doesn't need one, the card title
            ("Employee Distribution") already says what's plotted. */}
        <Bar dataKey="count" fill={c.bar} barSize={32} radius={[4, 4, 0, 0]}>
          <LabelList dataKey="count" position="top" fill={c.text} fontSize={12} />
        </Bar>
      </BarChart>
    </ResponsiveContainer>
  )
}

export default DepartmentChart
