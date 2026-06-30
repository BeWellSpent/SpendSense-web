'use client'

import { useState, useEffect } from 'react'
import { useRouter } from '@/i18n/navigation'
import { useQuery } from '@tanstack/react-query'
import { useTheme } from '@mui/material/styles'
import useMediaQuery from '@mui/material/useMediaQuery'
import { BudgetService } from '@/gen/spendsense/v1/budget_connect'
import { useClient } from '@/hooks/useClient'
import { FullScreenDrawer } from '@/components/ui/FullScreenDrawer'
import { PeoplePanel } from '@/components/budget/PeoplePanel'
import { CategoriesPanel } from '@/components/budget/CategoriesPanel'
import { logger } from '@/lib/logger'
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
import Paper from '@mui/material/Paper'
import IconButton from '@mui/material/IconButton'
import AppBar from '@mui/material/AppBar'
import Toolbar from '@mui/material/Toolbar'
import PeopleIcon from '@mui/icons-material/People'
import CategoryIcon from '@mui/icons-material/Category'
import BarChartIcon from '@mui/icons-material/BarChart'
import SettingsIcon from '@mui/icons-material/Settings'
import LogoutIcon from '@mui/icons-material/Logout'
import ArrowBackIcon from '@mui/icons-material/ArrowBack'
import ChevronLeftIcon from '@mui/icons-material/ChevronLeft'
import ChevronRightIcon from '@mui/icons-material/ChevronRight'
import { ThemeToggle } from '@/components/ui/ThemeToggle'

const SIDEBAR_WIDTH = 240
const SIDEBAR_COLLAPSED_WIDTH = 60
const COLLAPSED_KEY = 'sidebar-collapsed'

interface Props {
  budgetId: string
  children: React.ReactNode
}

export function BudgetSidebar({ budgetId, children }: Props) {
  const router = useRouter()
  const theme = useTheme()
  const isMobile = useMediaQuery(theme.breakpoints.down('md'))
  const client = useClient(BudgetService)
  const [peopleOpen, setPeopleOpen] = useState(false)
  const [categoriesOpen, setCategoriesOpen] = useState(false)
  const [collapsed, setCollapsed] = useState(false)

  useEffect(() => {
    setCollapsed(localStorage.getItem(COLLAPSED_KEY) === 'true')
  }, [])

  function toggleCollapsed() {
    setCollapsed((prev) => {
      localStorage.setItem(COLLAPSED_KEY, String(!prev))
      return !prev
    })
  }

  const { data } = useQuery({
    queryKey: ['budget-profile', budgetId],
    queryFn: () => client.getBudgetProfile({ id: budgetId }),
  })
  const budgetName = data?.profile?.name ?? '…'

  async function handleLogout() {
    try {
      await fetch('/api/auth/logout', { method: 'POST' })
      logger.info('auth.logout')
    } finally {
      router.push('/login')
    }
  }

  const navItems = [
    {
      label: 'Categories',
      icon: <CategoryIcon />,
      action: () => setCategoriesOpen(true),
      disabled: false,
    },
    {
      label: 'People',
      icon: <PeopleIcon />,
      action: () => setPeopleOpen(true),
      disabled: false,
    },
    {
      label: 'Reports',
      icon: <BarChartIcon />,
      action: () => {},
      disabled: true,
      tooltip: 'Coming soon',
    },
    {
      label: 'Settings',
      icon: <SettingsIcon />,
      action: () => router.push('/settings'),
      disabled: false,
    },
  ]

  const sidebarWidth = collapsed ? SIDEBAR_COLLAPSED_WIDTH : SIDEBAR_WIDTH

  const sidebarContent = (
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
          <Box sx={{ overflow: 'hidden' }}>
            <Typography variant="overline" color="text.secondary" display="block" noWrap>
              SpendSense
            </Typography>
            <Typography variant="h6" fontWeight={700} noWrap>{budgetName}</Typography>
          </Box>
        )}
        <Tooltip title={collapsed ? 'Expand sidebar' : 'Collapse sidebar'} placement="right">
          <IconButton onClick={toggleCollapsed} size="small">
            {collapsed ? <ChevronRightIcon /> : <ChevronLeftIcon />}
          </IconButton>
        </Tooltip>
      </Box>

      <Divider />

      {/* Back to budgets */}
      <List disablePadding>
        <ListItem disablePadding>
          <Tooltip title={collapsed ? 'All Budgets' : ''} placement="right">
            <ListItemButton
              onClick={() => router.push('/budgets')}
              sx={{ justifyContent: collapsed ? 'center' : 'flex-start', px: collapsed ? 0 : 2 }}
            >
              <ListItemIcon sx={{ minWidth: collapsed ? 0 : 40, justifyContent: 'center' }}>
                <ArrowBackIcon />
              </ListItemIcon>
              {!collapsed && <ListItemText primary="All Budgets" />}
            </ListItemButton>
          </Tooltip>
        </ListItem>
      </List>

      <Divider />

      {/* Main nav */}
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
        {!collapsed && <Typography variant="body2" color="text.secondary">Theme</Typography>}
        <ThemeToggle />
      </Box>

      <Divider />

      {/* Logout */}
      <List disablePadding>
        <ListItem disablePadding>
          <Tooltip title={collapsed ? 'Logout' : ''} placement="right">
            <ListItemButton
              onClick={handleLogout}
              sx={{ justifyContent: collapsed ? 'center' : 'flex-start', px: collapsed ? 0 : 2 }}
            >
              <ListItemIcon sx={{ minWidth: collapsed ? 0 : 40, justifyContent: 'center' }}>
                <LogoutIcon />
              </ListItemIcon>
              {!collapsed && <ListItemText primary="Logout" />}
            </ListItemButton>
          </Tooltip>
        </ListItem>
      </List>
    </Box>
  )

  return (
    <Box sx={{ display: 'flex', minHeight: '100vh' }}>
      {/* Desktop permanent sidebar */}
      {!isMobile && (
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
          {sidebarContent}
        </Drawer>
      )}

      {/* Main content */}
      <Box sx={{ flexGrow: 1, display: 'flex', flexDirection: 'column', minWidth: 0 }}>
        {/* Mobile top bar */}
        {isMobile && (
          <AppBar position="static" color="default" elevation={0} sx={{ borderBottom: 1, borderColor: 'divider' }}>
            <Toolbar>
              <IconButton edge="start" onClick={() => router.push('/budgets')} sx={{ mr: 1 }} aria-label="back">
                <ArrowBackIcon />
              </IconButton>
              <Typography variant="h6" fontWeight={700} noWrap sx={{ flex: 1 }}>{budgetName}</Typography>
              <ThemeToggle />
            </Toolbar>
          </AppBar>
        )}

        <Box sx={{ flex: 1, pb: isMobile ? 7 : 0 }}>
          {children}
        </Box>

        {/* Mobile bottom bar */}
        {isMobile && (
          <Paper
            elevation={3}
            sx={{
              position: 'fixed',
              bottom: 0,
              left: 0,
              right: 0,
              display: 'flex',
              justifyContent: 'space-around',
              alignItems: 'center',
              py: 0.5,
              borderTop: 1,
              borderColor: 'divider',
              zIndex: theme.zIndex.appBar,
            }}
          >
            {navItems.map((item) => (
              <Tooltip key={item.label} title={item.disabled ? (item.tooltip ?? '') : ''} placement="top">
                <span>
                  <IconButton
                    onClick={item.action}
                    disabled={item.disabled}
                    size="small"
                    sx={{ flexDirection: 'column', borderRadius: 2, px: 2 }}
                  >
                    {item.icon}
                    <Typography variant="caption" display="block" sx={{ mt: 0.25 }}>{item.label}</Typography>
                  </IconButton>
                </span>
              </Tooltip>
            ))}
            <IconButton onClick={handleLogout} size="small" sx={{ flexDirection: 'column', borderRadius: 2, px: 2 }}>
              <LogoutIcon />
              <Typography variant="caption" display="block" sx={{ mt: 0.25 }}>Logout</Typography>
            </IconButton>
          </Paper>
        )}
      </Box>

      <FullScreenDrawer open={categoriesOpen} onClose={() => setCategoriesOpen(false)} title="Categories">
        <CategoriesPanel />
      </FullScreenDrawer>

      <FullScreenDrawer open={peopleOpen} onClose={() => setPeopleOpen(false)} title="People">
        <PeoplePanel budgetProfileId={budgetId} />
      </FullScreenDrawer>
    </Box>
  )
}
