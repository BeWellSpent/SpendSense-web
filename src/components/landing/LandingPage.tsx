'use client'

import { useState, useEffect, useCallback } from 'react'
import Image from 'next/image'
import NextLink from 'next/link'
import Box from '@mui/material/Box'
import AppBar from '@mui/material/AppBar'
import Toolbar from '@mui/material/Toolbar'
import Container from '@mui/material/Container'
import Typography from '@mui/material/Typography'
import Button from '@mui/material/Button'
import IconButton from '@mui/material/IconButton'
import Drawer from '@mui/material/Drawer'
import List from '@mui/material/List'
import ListItemButton from '@mui/material/ListItemButton'
import ListItemText from '@mui/material/ListItemText'
import Divider from '@mui/material/Divider'
import Card from '@mui/material/Card'
import CardContent from '@mui/material/CardContent'
import Chip from '@mui/material/Chip'
import Fade from '@mui/material/Fade'
import Grid from '@mui/material/Grid'
import useMediaQuery from '@mui/material/useMediaQuery'
import { useTheme } from '@mui/material/styles'
import Menu from '@mui/material/Menu'
import MenuItem from '@mui/material/MenuItem'
import MenuIcon from '@mui/icons-material/Menu'
import CloseIcon from '@mui/icons-material/Close'
import ArrowDropDownIcon from '@mui/icons-material/ArrowDropDown'
import AttachMoneyIcon from '@mui/icons-material/AttachMoney'
import GroupIcon from '@mui/icons-material/Group'
import CategoryIcon from '@mui/icons-material/Category'
import ReceiptLongIcon from '@mui/icons-material/ReceiptLong'
import SavingsIcon from '@mui/icons-material/Savings'
import BarChartIcon from '@mui/icons-material/BarChart'
import FamilyRestroomIcon from '@mui/icons-material/FamilyRestroom'
import WorkIcon from '@mui/icons-material/Work'
import EmojiObjectsIcon from '@mui/icons-material/EmojiObjects'
import LanguageIcon from '@mui/icons-material/Language'
import PhoneIphoneIcon from '@mui/icons-material/PhoneIphone'
import AndroidIcon from '@mui/icons-material/Android'
import { useLocale, useTranslations } from 'next-intl'
import { useRouter, usePathname } from 'next/navigation'
import { useThemeMode } from '@/context/ThemeContext'
import { routing } from '@/i18n/routing'

const LOCALE_LABELS: Record<string, string> = { en: 'English', es: 'Español' }

const HERO_SLIDES = [
  { bg: 'linear-gradient(135deg, #0d47a1 0%, #1565c0 60%, #1976d2 100%)' },
  { bg: 'linear-gradient(135deg, #1b5e20 0%, #2e7d32 60%, #388e3c 100%)' },
  { bg: 'linear-gradient(135deg, #37474f 0%, #455a64 60%, #607d8b 100%)' },
]

const SLIDE_INTERVAL_MS = 4500

const NAV_SECTIONS = [
  { key: 'features', id: 'features' },
  { key: 'useCases', id: 'use-cases' },
  { key: 'pricing', id: 'pricing' },
  { key: 'download', id: 'download' },
] as const

export function LandingPage() {
  const t = useTranslations('landing')
  const locale = useLocale()
  const theme = useTheme()
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'))
  const { effective } = useThemeMode()

  const router = useRouter()
  const pathname = usePathname()

  const [mounted, setMounted] = useState(false)
  const [drawerOpen, setDrawerOpen] = useState(false)
  const [langAnchor, setLangAnchor] = useState<null | HTMLElement>(null)
  const [activeSlide, setActiveSlide] = useState(0)
  const [slideVisible, setSlideVisible] = useState(true)

  // Before mount, effective is 'light' (matches SSR). After mount, follows user preference.
  const isDark = mounted && effective === 'dark'
  const logoSrc = isDark ? '/web-header-dark.png' : '/web-header-light.png'
  const iconSrc = isDark ? '/app-icon-dark.png' : '/app-icon-light.png'

  useEffect(() => setMounted(true), [])

  const advanceSlide = useCallback(() => {
    setSlideVisible(false)
    setTimeout(() => {
      setActiveSlide((s) => (s + 1) % HERO_SLIDES.length)
      setSlideVisible(true)
    }, 300)
  }, [])

  useEffect(() => {
    const timer = setInterval(advanceSlide, SLIDE_INTERVAL_MS)
    return () => clearInterval(timer)
  }, [advanceSlide])

  function scrollToSection(id: string) {
    document.getElementById(id)?.scrollIntoView({ behavior: 'smooth' })
    setDrawerOpen(false)
  }

  function switchLocale(newLocale: string) {
    setLangAnchor(null)
    const newPath = pathname.startsWith(`/${locale}`)
      ? `/${newLocale}${pathname.slice(`/${locale}`.length)}`
      : `/${newLocale}`
    router.push(newPath)
  }

  const sectionSx = {
    scrollMarginTop: '64px',
    py: { xs: 8, sm: 10 },
  }

  return (
    <Box sx={{ minHeight: '100dvh', display: 'flex', flexDirection: 'column' }}>
      {/* ─── Navigation ─── */}
      <AppBar
        position="sticky"
        elevation={1}
        sx={{ bgcolor: 'background.paper', color: 'text.primary' }}
      >
        <Toolbar sx={{ px: { xs: 2, sm: 3 } }}>
          {/* Logo */}
          <Box
            component={NextLink}
            href={`/${locale}`}
            sx={{ display: 'flex', alignItems: 'center', textDecoration: 'none', flexShrink: 0 }}
          >
            {isMobile ? (
              <Image src={iconSrc} alt="WellSpent" width={36} height={36} style={{ objectFit: 'contain' }} />
            ) : (
              <Image src={logoSrc} alt="WellSpent" width={160} height={36} style={{ objectFit: 'contain', objectPosition: 'left' }} />
            )}
          </Box>

          {/* Desktop: centered nav links */}
          {!isMobile && (
            <Box sx={{ display: 'flex', gap: 0.5, mx: 'auto' }}>
              {NAV_SECTIONS.map(({ key, id }) => (
                <Button
                  key={key}
                  onClick={() => scrollToSection(id)}
                  sx={{ color: 'text.primary', fontWeight: 500, textTransform: 'none', fontSize: '0.95rem' }}
                >
                  {t(`nav.${key}`)}
                </Button>
              ))}
            </Box>
          )}

          {/* Language switcher + auth buttons (both breakpoints) */}
          <Box sx={{ display: 'flex', gap: 1, ml: isMobile ? 'auto' : 0, alignItems: 'center' }}>
            {/* Language switcher */}
            <Button
              onClick={(e) => setLangAnchor(e.currentTarget)}
              size="small"
              endIcon={<ArrowDropDownIcon />}
              startIcon={<LanguageIcon fontSize="small" />}
              sx={{ textTransform: 'uppercase', fontWeight: 600, color: 'text.secondary', minWidth: 0, px: 1 }}
            >
              {locale}
            </Button>
            <Menu
              anchorEl={langAnchor}
              open={Boolean(langAnchor)}
              onClose={() => setLangAnchor(null)}
              anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
              transformOrigin={{ vertical: 'top', horizontal: 'right' }}
            >
              {routing.locales.map((l) => (
                <MenuItem
                  key={l}
                  selected={l === locale}
                  onClick={() => switchLocale(l)}
                  sx={{ minWidth: 120 }}
                >
                  {LOCALE_LABELS[l] ?? l.toUpperCase()}
                </MenuItem>
              ))}
            </Menu>

            <Button
              component={NextLink}
              href={`/${locale}/login`}
              variant="text"
              sx={{ textTransform: 'none', fontWeight: 500, color: 'text.primary', whiteSpace: 'nowrap' }}
            >
              {t('nav.signIn')}
            </Button>
            <Button
              component={NextLink}
              href={`/${locale}/register`}
              variant="contained"
              size={isMobile ? 'small' : 'medium'}
              sx={{ textTransform: 'none', fontWeight: 600, whiteSpace: 'nowrap' }}
            >
              {t('nav.getStarted')}
            </Button>
            {isMobile && (
              <IconButton
                onClick={() => setDrawerOpen(true)}
                aria-label={t('nav.menu')}
                size="small"
                sx={{ ml: 0.5 }}
              >
                <MenuIcon />
              </IconButton>
            )}
          </Box>
        </Toolbar>
      </AppBar>

      {/* ─── Mobile drawer ─── */}
      <Drawer
        anchor="right"
        open={drawerOpen}
        onClose={() => setDrawerOpen(false)}
        PaperProps={{ sx: { width: 260 } }}
      >
        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', px: 2, py: 1.5 }}>
          <Image src={iconSrc} alt="WellSpent" width={32} height={32} style={{ objectFit: 'contain' }} />
          <IconButton onClick={() => setDrawerOpen(false)} size="small">
            <CloseIcon />
          </IconButton>
        </Box>
        <Divider />
        <List>
          {NAV_SECTIONS.map(({ key, id }) => (
            <ListItemButton key={key} onClick={() => scrollToSection(id)}>
              <ListItemText primary={t(`nav.${key}`)} />
            </ListItemButton>
          ))}
        </List>
      </Drawer>

      {/* ─── Hero carousel ─── */}
      <Box
        sx={{
          position: 'relative',
          height: { xs: '70dvh', sm: '80dvh' },
          minHeight: 400,
          overflow: 'hidden',
          background: HERO_SLIDES[activeSlide].bg,
          transition: 'background 0.6s ease',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        {/* Subtle pattern overlay */}
        <Box
          sx={{
            position: 'absolute',
            inset: 0,
            opacity: 0.05,
            backgroundImage: 'radial-gradient(circle, #fff 1px, transparent 1px)',
            backgroundSize: '30px 30px',
          }}
        />

        <Container maxWidth="md" sx={{ position: 'relative', zIndex: 1, textAlign: 'center', px: { xs: 3, sm: 4 } }}>
          <Fade in={slideVisible} timeout={300}>
            <Box>
              <Typography
                variant={isMobile ? 'h3' : 'h2'}
                component="h1"
                fontWeight={800}
                color="white"
                gutterBottom
                sx={{ textShadow: '0 2px 12px rgba(0,0,0,0.3)', lineHeight: 1.15 }}
              >
                {t(`hero.slide${activeSlide + 1}Title`)}
              </Typography>
              <Typography
                variant={isMobile ? 'body1' : 'h6'}
                color="rgba(255,255,255,0.88)"
                sx={{ mb: 4, maxWidth: 560, mx: 'auto', fontWeight: 400 }}
              >
                {t(`hero.slide${activeSlide + 1}Sub`)}
              </Typography>
              <Box sx={{ display: 'flex', gap: 2, justifyContent: 'center', flexWrap: 'wrap' }}>
                <Button
                  component={NextLink}
                  href={`/${locale}/register`}
                  variant="contained"
                  size="large"
                  sx={{
                    bgcolor: 'white',
                    color: 'primary.main',
                    fontWeight: 700,
                    textTransform: 'none',
                    px: 4,
                    '&:hover': { bgcolor: 'grey.100' },
                  }}
                >
                  {t('hero.cta')}
                </Button>
                <Button
                  variant="outlined"
                  size="large"
                  onClick={() => scrollToSection('features')}
                  sx={{
                    color: 'white',
                    borderColor: 'rgba(255,255,255,0.6)',
                    fontWeight: 600,
                    textTransform: 'none',
                    px: 3,
                    '&:hover': { borderColor: 'white', bgcolor: 'rgba(255,255,255,0.1)' },
                  }}
                >
                  {t('hero.learnMore')}
                </Button>
              </Box>
            </Box>
          </Fade>
        </Container>

        {/* Slide dots */}
        <Box sx={{ position: 'absolute', bottom: 24, left: 0, right: 0, display: 'flex', justifyContent: 'center', gap: 1 }}>
          {HERO_SLIDES.map((_, i) => (
            <Box
              key={i}
              onClick={() => { setActiveSlide(i); setSlideVisible(true) }}
              sx={{
                width: i === activeSlide ? 20 : 8,
                height: 8,
                borderRadius: 4,
                bgcolor: i === activeSlide ? 'white' : 'rgba(255,255,255,0.45)',
                cursor: 'pointer',
                transition: 'all 0.3s ease',
              }}
            />
          ))}
        </Box>
      </Box>

      {/* ─── What is WellSpent? ─── */}
      <Box sx={{ ...sectionSx, bgcolor: 'background.paper' }}>
        <Container maxWidth="md" sx={{ textAlign: 'center' }}>
          <Typography variant="h4" fontWeight={700} gutterBottom color="primary">
            {t('whatIs.title')}
          </Typography>
          <Typography variant="h6" color="text.secondary" sx={{ maxWidth: 680, mx: 'auto', lineHeight: 1.7, fontWeight: 400 }}>
            {t('whatIs.body')}
          </Typography>
        </Container>
      </Box>

      {/* ─── Features ─── */}
      <Box id="features" sx={{ ...sectionSx, bgcolor: 'background.default' }}>
        <Container maxWidth="lg">
          <Box sx={{ textAlign: 'center', mb: 6 }}>
            <Typography variant="h4" fontWeight={700} gutterBottom>
              {t('features.title')}
            </Typography>
            <Typography variant="subtitle1" color="text.secondary">
              {t('features.subtitle')}
            </Typography>
          </Box>
          <Grid container spacing={3}>
            {(
              [
                { icon: <AttachMoneyIcon fontSize="large" />, titleKey: 'features.item1Title', descKey: 'features.item1Desc' },
                { icon: <GroupIcon fontSize="large" />, titleKey: 'features.item2Title', descKey: 'features.item2Desc' },
                { icon: <ReceiptLongIcon fontSize="large" />, titleKey: 'features.item3Title', descKey: 'features.item3Desc' },
                { icon: <SavingsIcon fontSize="large" />, titleKey: 'features.item4Title', descKey: 'features.item4Desc' },
                { icon: <CategoryIcon fontSize="large" />, titleKey: 'features.item5Title', descKey: 'features.item5Desc' },
                { icon: <BarChartIcon fontSize="large" />, titleKey: 'features.item6Title', descKey: 'features.item6Desc' },
              ] as const
            ).map(({ icon, titleKey, descKey }) => (
              <Grid item xs={12} sm={6} md={4} key={titleKey}>
                <Card
                  elevation={0}
                  sx={{
                    height: '100%',
                    p: 1,
                    border: '1px solid',
                    borderColor: 'divider',
                    borderRadius: 2,
                    transition: 'box-shadow 0.2s, transform 0.2s',
                    '&:hover': { boxShadow: 4, transform: 'translateY(-2px)' },
                  }}
                >
                  <CardContent>
                    <Box sx={{ color: 'primary.main', mb: 1.5 }}>{icon}</Box>
                    <Typography variant="h6" fontWeight={600} gutterBottom>
                      {t(titleKey)}
                    </Typography>
                    <Typography variant="body2" color="text.secondary" sx={{ lineHeight: 1.6 }}>
                      {t(descKey)}
                    </Typography>
                  </CardContent>
                </Card>
              </Grid>
            ))}
          </Grid>
        </Container>
      </Box>

      {/* ─── Use Cases ─── */}
      <Box id="use-cases" sx={{ ...sectionSx, bgcolor: 'background.paper' }}>
        <Container maxWidth="lg">
          <Box sx={{ textAlign: 'center', mb: 6 }}>
            <Typography variant="h4" fontWeight={700} gutterBottom>
              {t('useCases.title')}
            </Typography>
            <Typography variant="subtitle1" color="text.secondary">
              {t('useCases.subtitle')}
            </Typography>
          </Box>
          <Grid container spacing={4}>
            {(
              [
                { icon: <FamilyRestroomIcon sx={{ fontSize: 48 }} />, titleKey: 'useCases.item1Title', descKey: 'useCases.item1Desc' },
                { icon: <WorkIcon sx={{ fontSize: 48 }} />, titleKey: 'useCases.item2Title', descKey: 'useCases.item2Desc' },
                { icon: <EmojiObjectsIcon sx={{ fontSize: 48 }} />, titleKey: 'useCases.item3Title', descKey: 'useCases.item3Desc' },
              ] as const
            ).map(({ icon, titleKey, descKey }) => (
              <Grid item xs={12} md={4} key={titleKey}>
                <Box sx={{ textAlign: 'center', px: { sm: 2 } }}>
                  <Box sx={{ color: 'secondary.main', mb: 2 }}>{icon}</Box>
                  <Typography variant="h6" fontWeight={600} gutterBottom>
                    {t(titleKey)}
                  </Typography>
                  <Typography variant="body1" color="text.secondary" sx={{ lineHeight: 1.7 }}>
                    {t(descKey)}
                  </Typography>
                </Box>
              </Grid>
            ))}
          </Grid>
        </Container>
      </Box>

      {/* ─── Pricing ─── */}
      <Box
        id="pricing"
        sx={{
          ...sectionSx,
          bgcolor: 'primary.main',
        }}
      >
        <Container maxWidth="sm" sx={{ textAlign: 'center' }}>
          <Typography variant="h4" fontWeight={700} gutterBottom color="white">
            {t('pricing.title')}
          </Typography>
          <Typography variant="subtitle1" color="rgba(255,255,255,0.85)" sx={{ mb: 4 }}>
            {t('pricing.subtitle')}
          </Typography>
          <Card
            elevation={0}
            sx={{ p: 4, borderRadius: 3, border: '2px solid rgba(255,255,255,0.2)', bgcolor: 'rgba(255,255,255,0.1)' }}
          >
            <Typography variant="h3" fontWeight={800} color="white" gutterBottom>
              {t('pricing.freeTitle')}
            </Typography>
            <Typography variant="body1" color="rgba(255,255,255,0.88)" sx={{ mb: 3, lineHeight: 1.7 }}>
              {t('pricing.freeDesc')}
            </Typography>
            <Button
              component={NextLink}
              href={`/${locale}/register`}
              variant="contained"
              size="large"
              sx={{
                bgcolor: 'white',
                color: 'primary.main',
                fontWeight: 700,
                textTransform: 'none',
                px: 5,
                '&:hover': { bgcolor: 'grey.100' },
              }}
            >
              {t('pricing.cta')}
            </Button>
          </Card>
        </Container>
      </Box>

      {/* ─── Download ─── */}
      <Box id="download" sx={{ ...sectionSx, bgcolor: 'background.default' }}>
        <Container maxWidth="md">
          <Box sx={{ textAlign: 'center', mb: 6 }}>
            <Typography variant="h4" fontWeight={700} gutterBottom>
              {t('download.title')}
            </Typography>
            <Typography variant="subtitle1" color="text.secondary">
              {t('download.subtitle')}
            </Typography>
          </Box>
          <Grid container spacing={3} justifyContent="center">
            {/* Web */}
            <Grid item xs={12} sm={4}>
              <Card
                elevation={0}
                sx={{ textAlign: 'center', p: 2, border: '2px solid', borderColor: 'primary.main', borderRadius: 2, height: '100%' }}
              >
                <CardContent>
                  <LanguageIcon sx={{ fontSize: 56, color: 'primary.main', mb: 1 }} />
                  <Typography variant="h6" fontWeight={700} gutterBottom>
                    {t('download.webTitle')}
                  </Typography>
                  <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
                    {t('download.webDesc')}
                  </Typography>
                  <Button
                    component={NextLink}
                    href={`/${locale}/login`}
                    variant="contained"
                    fullWidth
                    sx={{ textTransform: 'none', fontWeight: 600 }}
                  >
                    {t('download.webCta')}
                  </Button>
                </CardContent>
              </Card>
            </Grid>
            {/* iOS */}
            <Grid item xs={12} sm={4}>
              <Card
                elevation={0}
                sx={{ textAlign: 'center', p: 2, border: '1px solid', borderColor: 'divider', borderRadius: 2, height: '100%', opacity: 0.75 }}
              >
                <CardContent>
                  <PhoneIphoneIcon sx={{ fontSize: 56, color: 'text.disabled', mb: 1 }} />
                  <Typography variant="h6" fontWeight={700} gutterBottom>
                    {t('download.iosTitle')}
                  </Typography>
                  <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                    {t('download.iosDesc')}
                  </Typography>
                  <Chip label={t('download.comingSoon')} size="small" variant="outlined" />
                </CardContent>
              </Card>
            </Grid>
            {/* Android */}
            <Grid item xs={12} sm={4}>
              <Card
                elevation={0}
                sx={{ textAlign: 'center', p: 2, border: '1px solid', borderColor: 'divider', borderRadius: 2, height: '100%', opacity: 0.75 }}
              >
                <CardContent>
                  <AndroidIcon sx={{ fontSize: 56, color: 'text.disabled', mb: 1 }} />
                  <Typography variant="h6" fontWeight={700} gutterBottom>
                    {t('download.androidTitle')}
                  </Typography>
                  <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                    {t('download.androidDesc')}
                  </Typography>
                  <Chip label={t('download.comingSoon')} size="small" variant="outlined" />
                </CardContent>
              </Card>
            </Grid>
          </Grid>
        </Container>
      </Box>

      {/* ─── About ─── */}
      <Box sx={{ ...sectionSx, bgcolor: 'background.paper' }}>
        <Container maxWidth="sm" sx={{ textAlign: 'center' }}>
          <Typography variant="h4" fontWeight={700} gutterBottom>
            {t('about.title')}
          </Typography>
          <Typography variant="body1" color="text.secondary" sx={{ lineHeight: 1.8, fontSize: '1.1rem' }}>
            {t('about.body')}
          </Typography>
        </Container>
      </Box>

      {/* ─── Footer ─── */}
      <Box
        component="footer"
        sx={{
          mt: 'auto',
          py: 5,
          px: 3,
          bgcolor: '#111827',
          color: 'rgba(255,255,255,0.7)',
          textAlign: 'center',
        }}
      >
        <Box sx={{ mb: 2 }}>
          <Image src="/web-header-dark.png" alt="WellSpent" width={140} height={31} style={{ objectFit: 'contain' }} />
        </Box>
        <Typography variant="body2" sx={{ mb: 1, color: 'rgba(255,255,255,0.5)', fontStyle: 'italic' }}>
          {t('footer.tagline')}
        </Typography>
        <Typography variant="caption" sx={{ color: 'rgba(255,255,255,0.4)' }}>
          {t('footer.rights', { year: new Date().getFullYear() })}
        </Typography>
      </Box>
    </Box>
  )
}
