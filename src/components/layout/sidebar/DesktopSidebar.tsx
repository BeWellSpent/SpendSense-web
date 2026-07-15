'use client'

import Image from 'next/image'
import { useTranslations } from 'next-intl'
import { useTheme } from '@mui/material/styles'
import { ThemeToggle } from '@/components/ui/ThemeToggle'
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
import IconButton from '@mui/material/IconButton'
import LogoutIcon from '@mui/icons-material/Logout'
import ArrowBackIcon from '@mui/icons-material/ArrowBack'
import ChevronLeftIcon from '@mui/icons-material/ChevronLeft'
import ChevronRightIcon from '@mui/icons-material/ChevronRight'
import type { NavItem } from './types'

const SIDEBAR_WIDTH = 240
const SIDEBAR_COLLAPSED_WIDTH = 60

interface Props {
  collapsed: boolean
  onToggleCollapsed: () => void
  budgetName: string
  iconSrc: string
  navItems: NavItem[]
  onBackToBudgets: () => void
  onLogout: () => void
}

export function DesktopSidebar({ collapsed, onToggleCollapsed, budgetName, iconSrc, navItems, onBackToBudgets, onLogout }: Props) {
  const t = useTranslations('budget.sidebar')
  const theme = useTheme()
  const sidebarWidth = collapsed ? SIDEBAR_COLLAPSED_WIDTH : SIDEBAR_WIDTH

  return (
    <Drawer
      variant="permanent"
      sx={{
        width: sidebarWidth,
        flexShrink: 0,
        transition: theme.transitions.create('width', {
          easing: theme.transitions.easing.sharp,
          duration: theme.transitions.duration.enteringScreen,
        }),
        '& .MuiDrawer-paper': {
          width: sidebarWidth,
          boxSizing: 'border-box',
          overflowX: 'hidden',
          transition: theme.transitions.create('width', {
            easing: theme.transitions.easing.sharp,
            duration: theme.transitions.duration.enteringScreen,
          }),
        },
      }}
    >
      <Box sx={{ display: 'flex', flexDirection: 'column', height: '100%', overflow: 'hidden' }}>
        {/* Brand + collapse toggle */}
        <Box
          sx={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: collapsed ? 'center' : 'space-between',
            px: collapsed ? 0 : 2,
            py: 1.5,
            minHeight: 64,
          }}
        >
          {!collapsed && (
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, overflow: 'hidden' }}>
              <Image src={iconSrc} alt="WellSpent" width={32} height={32} style={{ flexShrink: 0 }} />
              <Typography variant="h6" fontWeight={700} noWrap>{budgetName}</Typography>
            </Box>
          )}
          <Tooltip title={collapsed ? t('expand') : t('collapse')} placement="right">
            <IconButton onClick={onToggleCollapsed} size="small">
              {collapsed ? <ChevronRightIcon /> : <ChevronLeftIcon />}
            </IconButton>
          </Tooltip>
        </Box>

        <Divider />

        {/* Back to budgets */}
        <List disablePadding>
          <ListItem disablePadding>
            <Tooltip title={collapsed ? t('allBudgets') : ''} placement="right">
              <ListItemButton
                onClick={onBackToBudgets}
                sx={{ justifyContent: collapsed ? 'center' : 'flex-start', px: collapsed ? 0 : 2 }}
              >
                <ListItemIcon sx={{ minWidth: collapsed ? 0 : 40, justifyContent: 'center' }}>
                  <ArrowBackIcon />
                </ListItemIcon>
                {!collapsed && <ListItemText primary={t('allBudgets')} />}
              </ListItemButton>
            </Tooltip>
          </ListItem>
        </List>

        <Divider />

        {/* Main nav — budget management + app items */}
        <List disablePadding sx={{ flex: 1 }}>
          {navItems.map((item) => {
            const tooltipTitle = collapsed ? (item.tooltip ?? item.label) : (item.tooltip ?? '')
            return (
              <ListItem key={item.label} disablePadding>
                <Tooltip title={tooltipTitle} placement="right" disableHoverListener={!collapsed && !item.disabled}>
                  <span style={{ width: '100%' }}>
                    <ListItemButton
                      onClick={item.action}
                      disabled={item.disabled}
                      sx={{ justifyContent: collapsed ? 'center' : 'flex-start', px: collapsed ? 0 : 2 }}
                    >
                      <ListItemIcon
                        sx={{
                          minWidth: collapsed ? 0 : 40,
                          justifyContent: 'center',
                          color: item.disabled ? 'text.disabled' : 'inherit',
                        }}
                      >
                        {item.icon}
                      </ListItemIcon>
                      {!collapsed && (
                        <ListItemText
                          primary={item.label}
                          primaryTypographyProps={{ color: item.disabled ? 'text.disabled' : 'inherit' }}
                        />
                      )}
                    </ListItemButton>
                  </span>
                </Tooltip>
              </ListItem>
            )
          })}
        </List>

        <Divider />

        <Box
          sx={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: collapsed ? 'center' : 'space-between',
            px: collapsed ? 0 : 2,
            minHeight: 48,
          }}
        >
          {!collapsed && <Typography variant="body2" color="text.secondary">{t('theme')}</Typography>}
          <ThemeToggle />
        </Box>

        <Divider />

        {/* Logout */}
        <List disablePadding>
          <ListItem disablePadding>
            <Tooltip title={collapsed ? t('logout') : ''} placement="right">
              <ListItemButton
                onClick={onLogout}
                sx={{ justifyContent: collapsed ? 'center' : 'flex-start', px: collapsed ? 0 : 2 }}
              >
                <ListItemIcon sx={{ minWidth: collapsed ? 0 : 40, justifyContent: 'center' }}>
                  <LogoutIcon />
                </ListItemIcon>
                {!collapsed && <ListItemText primary={t('logout')} />}
              </ListItemButton>
            </Tooltip>
          </ListItem>
        </List>
      </Box>
    </Drawer>
  )
}
