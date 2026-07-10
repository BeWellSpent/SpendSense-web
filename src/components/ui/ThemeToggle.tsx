'use client'

import { useState, useEffect } from 'react'
import IconButton from '@mui/material/IconButton'
import Tooltip from '@mui/material/Tooltip'
import LightModeIcon from '@mui/icons-material/LightMode'
import DarkModeIcon from '@mui/icons-material/DarkMode'
import BrightnessAutoIcon from '@mui/icons-material/BrightnessAuto'
import { useThemeMode } from '@/context/ThemeContext'

type Mode = 'light' | 'dark' | 'system'

const CYCLE: Record<Mode, Mode> = { light: 'dark', dark: 'system', system: 'light' }
const LABEL: Record<Mode, string> = {
  light: 'Switch to dark',
  dark: 'Switch to system',
  system: 'Switch to light',
}

export function ThemeToggle() {
  const [mounted, setMounted] = useState(false)
  const { mode, setMode } = useThemeMode()

  useEffect(() => setMounted(true), [])

  // Before mount, mode is undefined — render a stable placeholder that matches SSR.
  if (!mounted) {
    return (
      <IconButton size="small" aria-label="Theme">
        <BrightnessAutoIcon fontSize="small" />
      </IconButton>
    )
  }

  const Icon = mode === 'light' ? LightModeIcon : mode === 'dark' ? DarkModeIcon : BrightnessAutoIcon
  return (
    <Tooltip title={LABEL[mode]}>
      <IconButton size="small" aria-label={LABEL[mode]} onClick={() => setMode(CYCLE[mode])}>
        <Icon fontSize="small" />
      </IconButton>
    </Tooltip>
  )
}
