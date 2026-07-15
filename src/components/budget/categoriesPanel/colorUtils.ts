function hslToHex(h: number, s: number, l: number): string {
  const a = s * Math.min(l, 1 - l)
  const f = (n: number) => {
    const k = (n + h / 30) % 12
    const c = l - a * Math.max(Math.min(k - 3, 9 - k, 1), -1)
    return Math.round(255 * c).toString(16).padStart(2, '0')
  }
  return `#${f(0)}${f(8)}${f(4)}`
}

export function generateDistinctColors(count: number): string[] {
  const startHue = Math.random() * 360
  return Array.from({ length: count }, (_, i) =>
    hslToHex((startHue + i * 137.508) % 360, 0.65, 0.50)
  )
}
