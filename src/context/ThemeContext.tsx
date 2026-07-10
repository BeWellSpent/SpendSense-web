'use client'

import { useColorScheme } from '@mui/material/styles'

type ThemeMode = 'light' | 'dark' | 'system'

// Thin wrapper over MUI's useColorScheme so the rest of the app keeps the same API.
export function useThemeMode() {
  const { mode, setMode, colorScheme } = useColorScheme()
  // colorScheme is the resolved light/dark value; undefined on the server and on first render.
  // Fall back to 'light' so server and client agree before the browser reads the stored preference.
  const effective: 'light' | 'dark' = (colorScheme as 'light' | 'dark' | undefined) ?? 'light'
  return {
    mode: (mode ?? 'system') as ThemeMode,
    setMode: (m: ThemeMode) => setMode(m),
    effective,
  }
}
