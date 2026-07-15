'use client'

import Image from 'next/image'
import { useTranslations } from 'next-intl'
import { ThemeToggle } from '@/components/ui/ThemeToggle'
import Box from '@mui/material/Box'
import AppBar from '@mui/material/AppBar'
import Toolbar from '@mui/material/Toolbar'
import IconButton from '@mui/material/IconButton'
import ArrowBackIcon from '@mui/icons-material/ArrowBack'
import MenuIcon from '@mui/icons-material/Menu'

interface Props {
  iconSrc: string
  onBackToBudgets: () => void
  onOpenManage: () => void
}

export function MobileTopBar({ iconSrc, onBackToBudgets, onOpenManage }: Props) {
  const t = useTranslations('budget.sidebar')

  return (
    <AppBar position="static" color="default" elevation={0} sx={{ borderBottom: 1, borderColor: 'divider' }}>
      <Toolbar>
        <IconButton edge="start" onClick={onBackToBudgets} sx={{ mr: 1 }} aria-label="back">
          <ArrowBackIcon />
        </IconButton>
        <Box sx={{ flex: 1, display: 'flex', justifyContent: 'center' }}>
          <Image src={iconSrc} alt="WellSpent" width={32} height={32} />
        </Box>
        <ThemeToggle />
        <IconButton onClick={onOpenManage} aria-label={t('manage')} sx={{ ml: 0.5 }}>
          <MenuIcon />
        </IconButton>
      </Toolbar>
    </AppBar>
  )
}
