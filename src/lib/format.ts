import type { Kpi } from '../types'

const currency = new Intl.NumberFormat('en-US', {
  style: 'currency',
  currency: 'USD',
  maximumFractionDigits: 0,
})

const number = new Intl.NumberFormat('en-US')

export function formatValue(value: number, format: Kpi['format']): string {
  switch (format) {
    case 'currency':
      return currency.format(value)
    case 'percent':
      return `${number.format(Math.round(value))}%`
    case 'minutes':
      return `${value.toFixed(1)} d`
    case 'number':
    default:
      return number.format(Math.round(value))
  }
}

export function formatCompact(value: number, format: Kpi['format']): string {
  if (format === 'currency') {
    if (value >= 1_000_000) return `$${(value / 1_000_000).toFixed(1)}M`
    if (value >= 1_000) return `$${(value / 1_000).toFixed(0)}k`
    return currency.format(value)
  }
  if (format === 'percent') return `${Math.round(value)}%`
  if (value >= 1_000) return `${(value / 1_000).toFixed(1)}k`
  return number.format(Math.round(value))
}
