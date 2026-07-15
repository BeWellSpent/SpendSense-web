'use client'

import { useState } from 'react'
import { formatMoneyFromNumber } from '@/lib/format'
import Box from '@mui/material/Box'
import Typography from '@mui/material/Typography'
import TextField from '@mui/material/TextField'

interface EditCellProps {
  value: number | undefined
  onSave: (amount: number | null) => void
  currency: string
  locale: string
}

export function EditCell({ value, onSave, currency, locale }: EditCellProps) {
  const [editing, setEditing] = useState(false)
  const [draft, setDraft] = useState('')

  function startEdit() {
    setDraft(value != null ? value.toFixed(2) : '')
    setEditing(true)
  }

  function commit() {
    setEditing(false)
    const n = parseFloat(draft)
    if (!isNaN(n) && n >= 0) {
      onSave(n)
    } else if (draft.trim() === '') {
      onSave(null)
    }
  }

  if (editing) {
    return (
      <TextField
        size="small"
        autoFocus
        value={draft}
        onChange={(e) => setDraft(e.target.value)}
        onBlur={commit}
        onKeyDown={(e) => { if (e.key === 'Enter') commit(); if (e.key === 'Escape') setEditing(false) }}
        inputProps={{ style: { width: 80, padding: '2px 6px', fontSize: 13 } }}
        variant="outlined"
      />
    )
  }

  return (
    <Box
      sx={{ cursor: 'text', minWidth: 80, display: 'inline-block', '&:hover': { textDecoration: 'underline dotted' } }}
      onClick={startEdit}
    >
      {value != null
        ? formatMoneyFromNumber(value, currency, locale)
        : <Typography component="span" variant="body2" color="text.disabled">—</Typography>}
    </Box>
  )
}
