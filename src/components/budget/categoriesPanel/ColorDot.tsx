import Box from '@mui/material/Box'

export function ColorDot({ color }: { color: string }) {
  return (
    <Box
      sx={{
        width: 12,
        height: 12,
        borderRadius: '50%',
        bgcolor: color || 'text.disabled',
        border: '1px solid',
        borderColor: color ? 'transparent' : 'divider',
        flexShrink: 0,
        mr: 1,
      }}
    />
  )
}
