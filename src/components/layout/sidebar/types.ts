export interface NavItem {
  label: string
  icon: React.ReactElement
  action: () => void
  disabled?: boolean
  tooltip?: string
}
