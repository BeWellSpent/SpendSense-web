import Container from '@mui/material/Container'
import { ProfileSettings } from '@/components/user/ProfileSettings'

export default function SettingsPage() {
  return (
    <Container maxWidth="md" sx={{ py: 4 }}>
      <ProfileSettings />
    </Container>
  )
}
