'use client'

import Image from 'next/image'
import { useTranslations } from 'next-intl'
import Box from '@mui/material/Box'
import Drawer from '@mui/material/Drawer'
import List from '@mui/material/List'
import ListItem from '@mui/material/ListItem'
import ListItemButton from '@mui/material/ListItemButton'
import ListItemIcon from '@mui/material/ListItemIcon'
import ListItemText from '@mui/material/ListItemText'
import Divider from '@mui/material/Divider'
import Typography from '@mui/material/Typography'
import Tooltip from '@mui/material/Tooltip'
import LogoutIcon from '@mui/icons-material/Logout'
import type { NavItem } from './types'

interface Props {
  open: boolean
  onClose: () => void
  budgetName: string
  iconSrc: string
  managementItems: NavItem[]
  appItems: NavItem[]
  onOpenPanel: (action: () => void) => void
  onLogout: () => void
}

export function MobileManageDrawer({ open, onClose, budgetName, iconSrc, managementItems, appItems, onOpenPanel, onLogout }: Props) {
  const t = useTranslations('budget.sidebar')

  return (
    <Drawer anchor="right" open={open} onClose={onClose} sx={{ display: { md: 'none' } }}>
      <Box sx={{ width: 260, pt: 1 }}>
        <Box sx={{ px: 2, py: 1.5, display: 'flex', alignItems: 'center', gap: 1 }}>
          <Image src={iconSrc} alt="WellSpent" width={24} height={24} style={{ flexShrink: 0 }} />
          <Typography variant="h6" fontWeight={700} noWrap>{budgetName}</Typography>
        </Box>
        <Divider />
        <List>
          {managementItems.map((item) => (
            <ListItem key={item.label} disablePadding>
              <ListItemButton onClick={() => onOpenPanel(item.action)}>
                <ListItemIcon>{item.icon}</ListItemIcon>
                <ListItemText primary={item.label} />
              </ListItemButton>
            </ListItem>
          ))}
        </List>
        <Divider />
        <List>
          {appItems.map((item) => (
            <ListItem key={item.label} disablePadding>
              <Tooltip title={item.tooltip ?? ''} disableHoverListener={!item.disabled}>
                <span style={{ width: '100%' }}>
                  <ListItemButton
                    onClick={() => { onClose(); item.action() }}
                    disabled={item.disabled}
                  >
                    <ListItemIcon sx={{ color: item.disabled ? 'text.disabled' : 'inherit' }}>
                      {item.icon}
                    </ListItemIcon>
                    <ListItemText
                      primary={item.label}
                      primaryTypographyProps={{ color: item.disabled ? 'text.disabled' : 'inherit' }}
                    />
                  </ListItemButton>
                </span>
              </Tooltip>
            </ListItem>
          ))}
        </List>
        <Divider />
        <List>
          <ListItem disablePadding>
            <ListItemButton onClick={() => { onClose(); onLogout() }}>
              <ListItemIcon><LogoutIcon /></ListItemIcon>
              <ListItemText primary={t('logout')} />
            </ListItemButton>
          </ListItem>
        </List>
      </Box>
    </Drawer>
  )
}
