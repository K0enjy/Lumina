'use client'

import { useState, useTransition } from 'react'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import {
  createCaldavAccount,
  updateCaldavAccount,
  deleteCaldavAccount,
  toggleCalendarEnabled,
  triggerSync,
} from '@/lib/actions/calendar'
import type { CalendarWithAccount } from '@/lib/actions/calendar'
import type { caldavAccounts } from '@/db/schema'

type CaldavAccount = typeof caldavAccounts.$inferSelect

type Props = {
  accounts: CaldavAccount[]
  calendars: CalendarWithAccount[]
}

type AccountFormData = {
  serverUrl: string
  username: string
  password: string
  displayName: string
}

const emptyForm: AccountFormData = {
  serverUrl: '',
  username: '',
  password: '',
  displayName: '',
}

function formatSyncTime(timestamp: number | null): string {
  if (!timestamp) return 'Never'
  const date = new Date(timestamp)
  return date.toLocaleString()
}

export function CalendarSettingsClient({ accounts, calendars }: Props) {
  const [isPending, startTransition] = useTransition()
  const [formData, setFormData] = useState<AccountFormData>(emptyForm)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [editData, setEditData] = useState<AccountFormData>(emptyForm)
  const [showAddForm, setShowAddForm] = useState(false)
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null)
  const [syncingAccountId, setSyncingAccountId] = useState<string | null>(null)

  const showMessage = (type: 'success' | 'error', text: string) => {
    setMessage({ type, text })
    setTimeout(() => setMessage(null), 4000)
  }

  const handleAddAccount = (e: React.FormEvent) => {
    e.preventDefault()
    startTransition(async () => {
      const result = await createCaldavAccount(formData)
      if (result.success) {
        setFormData(emptyForm)
        setShowAddForm(false)
        showMessage('success', 'Account added successfully')
      } else {
        showMessage('error', result.error)
      }
    })
  }

  const handleUpdateAccount = (id: string) => {
    startTransition(async () => {
      const updates: Partial<AccountFormData> = {}
      if (editData.serverUrl) updates.serverUrl = editData.serverUrl
      if (editData.username) updates.username = editData.username
      if (editData.password) updates.password = editData.password
      if (editData.displayName) updates.displayName = editData.displayName

      const result = await updateCaldavAccount(id, updates)
      if (result.success) {
        setEditingId(null)
        setEditData(emptyForm)
        showMessage('success', 'Account updated successfully')
      } else {
        showMessage('error', result.error)
      }
    })
  }

  const handleDeleteAccount = (id: string, name: string) => {
    if (!confirm(`Delete account "${name}" and all its calendars?`)) return
    startTransition(async () => {
      const result = await deleteCaldavAccount(id)
      if (result.success) {
        showMessage('success', 'Account deleted')
      } else {
        showMessage('error', result.error)
      }
    })
  }

  const handleToggleCalendar = (calendarId: string) => {
    startTransition(async () => {
      const result = await toggleCalendarEnabled(calendarId)
      if (!result.success) {
        showMessage('error', result.error)
      }
    })
  }

  const handleSync = (accountId: string) => {
    setSyncingAccountId(accountId)
    startTransition(async () => {
      const result = await triggerSync(accountId)
      setSyncingAccountId(null)
      if (result.success) {
        showMessage('success', `Synced ${result.data.synced} events`)
      } else {
        showMessage('error', result.error)
      }
    })
  }

  const startEditing = (account: CaldavAccount) => {
    setEditingId(account.id)
    setEditData({
      serverUrl: account.serverUrl,
      username: account.username,
      password: '',
      displayName: account.displayName,
    })
  }

  const getAccountCalendars = (accountId: string) =>
    calendars.filter((c) => c.accountId === accountId)

  return (
    <div className="space-y-6">
      {/* Status message */}
      {message && (
        <div
          className={`rounded-lg px-4 py-3 text-sm font-medium ${
            message.type === 'success'
              ? 'bg-green-500/10 text-green-600 border border-green-500/20'
              : 'bg-[var(--error)]/10 text-[var(--error)] border border-[var(--error)]/20'
          }`}
        >
          {message.text}
        </div>
      )}

      {/* Accounts list */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-semibold text-[var(--text)]">CalDAV Accounts</h2>
          <Button
            variant="primary"
            size="sm"
            onClick={() => setShowAddForm(!showAddForm)}
          >
            {showAddForm ? 'Cancel' : 'Add Account'}
          </Button>
        </div>

        {/* Add account form */}
        {showAddForm && (
          <form
            onSubmit={handleAddAccount}
            className="rounded-lg border border-[var(--border)] bg-[var(--surface)] p-4 space-y-4"
          >
            <h3 className="text-sm font-medium text-[var(--text)]">New CalDAV Account</h3>
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <Input
                label="Display Name"
                placeholder="My Calendar"
                value={formData.displayName}
                onChange={(e) => setFormData((prev) => ({ ...prev, displayName: e.target.value }))}
                required
              />
              <Input
                label="Server URL"
                type="url"
                placeholder="https://caldav.example.com"
                value={formData.serverUrl}
                onChange={(e) => setFormData((prev) => ({ ...prev, serverUrl: e.target.value }))}
                required
              />
              <Input
                label="Username"
                placeholder="user@example.com"
                value={formData.username}
                onChange={(e) => setFormData((prev) => ({ ...prev, username: e.target.value }))}
                required
              />
              <Input
                label="Password"
                type="password"
                placeholder="Password"
                value={formData.password}
                onChange={(e) => setFormData((prev) => ({ ...prev, password: e.target.value }))}
                required
              />
            </div>
            <div className="flex justify-end gap-2">
              <Button
                type="button"
                variant="secondary"
                size="sm"
                onClick={() => {
                  setShowAddForm(false)
                  setFormData(emptyForm)
                }}
              >
                Cancel
              </Button>
              <Button type="submit" variant="primary" size="sm" disabled={isPending}>
                {isPending ? 'Adding...' : 'Add Account'}
              </Button>
            </div>
          </form>
        )}

        {/* Accounts */}
        {accounts.length === 0 && !showAddForm && (
          <div className="rounded-lg border border-dashed border-[var(--border)] bg-[var(--surface)] p-8 text-center">
            <p className="text-sm text-[var(--text-secondary)]">
              No CalDAV accounts configured. Add one to start syncing your calendars.
            </p>
          </div>
        )}

        {accounts.map((account) => {
          const accountCalendars = getAccountCalendars(account.id)
          const isEditing = editingId === account.id
          const isSyncing = syncingAccountId === account.id

          return (
            <div
              key={account.id}
              className="rounded-lg border border-[var(--border)] bg-[var(--surface)] overflow-hidden"
            >
              {/* Account header */}
              <div className="flex items-center justify-between gap-4 p-4 border-b border-[var(--border)]">
                <div className="min-w-0 flex-1">
                  <h3 className="text-sm font-semibold text-[var(--text)] truncate">
                    {account.displayName}
                  </h3>
                  <p className="text-xs text-[var(--text-secondary)] truncate mt-0.5">
                    {account.serverUrl}
                  </p>
                  <p className="text-xs text-[var(--text-secondary)] mt-0.5">
                    Last sync: {formatSyncTime(account.lastSyncAt)}
                  </p>
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  <Button
                    variant="secondary"
                    size="sm"
                    onClick={() => handleSync(account.id)}
                    disabled={isPending || isSyncing}
                  >
                    {isSyncing ? 'Syncing...' : 'Sync Now'}
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => (isEditing ? setEditingId(null) : startEditing(account))}
                  >
                    {isEditing ? 'Cancel' : 'Edit'}
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="text-[var(--error)] hover:text-[var(--error)]"
                    onClick={() => handleDeleteAccount(account.id, account.displayName)}
                    disabled={isPending}
                  >
                    Delete
                  </Button>
                </div>
              </div>

              {/* Edit form */}
              {isEditing && (
                <div className="p-4 border-b border-[var(--border)] bg-[var(--bg)]">
                  <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                    <Input
                      label="Display Name"
                      value={editData.displayName}
                      onChange={(e) =>
                        setEditData((prev) => ({ ...prev, displayName: e.target.value }))
                      }
                    />
                    <Input
                      label="Server URL"
                      type="url"
                      value={editData.serverUrl}
                      onChange={(e) =>
                        setEditData((prev) => ({ ...prev, serverUrl: e.target.value }))
                      }
                    />
                    <Input
                      label="Username"
                      value={editData.username}
                      onChange={(e) =>
                        setEditData((prev) => ({ ...prev, username: e.target.value }))
                      }
                    />
                    <Input
                      label="New Password"
                      type="password"
                      placeholder="Leave blank to keep current"
                      value={editData.password}
                      onChange={(e) =>
                        setEditData((prev) => ({ ...prev, password: e.target.value }))
                      }
                    />
                  </div>
                  <div className="flex justify-end gap-2 mt-4">
                    <Button
                      variant="secondary"
                      size="sm"
                      onClick={() => {
                        setEditingId(null)
                        setEditData(emptyForm)
                      }}
                    >
                      Cancel
                    </Button>
                    <Button
                      variant="primary"
                      size="sm"
                      onClick={() => handleUpdateAccount(account.id)}
                      disabled={isPending}
                    >
                      {isPending ? 'Saving...' : 'Save Changes'}
                    </Button>
                  </div>
                </div>
              )}

              {/* Calendars list */}
              {accountCalendars.length > 0 && (
                <div className="divide-y divide-[var(--border)]">
                  {accountCalendars.map((cal) => (
                    <div
                      key={cal.id}
                      className="flex items-center justify-between gap-3 px-4 py-3"
                    >
                      <div className="flex items-center gap-3 min-w-0">
                        <span
                          className="w-3 h-3 rounded-full shrink-0"
                          style={{ backgroundColor: cal.color ?? '#3b82f6' }}
                        />
                        <span className="text-sm text-[var(--text)] truncate">
                          {cal.displayName}
                        </span>
                      </div>
                      <button
                        type="button"
                        role="switch"
                        aria-checked={cal.enabled}
                        aria-label={`Toggle ${cal.displayName}`}
                        onClick={() => handleToggleCalendar(cal.id)}
                        disabled={isPending}
                        className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--accent)] focus-visible:ring-offset-2 focus-visible:ring-offset-[var(--bg)] disabled:opacity-50 disabled:cursor-not-allowed ${
                          cal.enabled ? 'bg-[var(--accent)]' : 'bg-[var(--border)]'
                        }`}
                      >
                        <span
                          className={`pointer-events-none inline-block h-5 w-5 rounded-full bg-white shadow-sm ring-0 transition-transform duration-200 ${
                            cal.enabled ? 'translate-x-5' : 'translate-x-0'
                          }`}
                        />
                      </button>
                    </div>
                  ))}
                </div>
              )}

              {accountCalendars.length === 0 && (
                <div className="px-4 py-3">
                  <p className="text-xs text-[var(--text-secondary)]">
                    No calendars found. Try syncing this account.
                  </p>
                </div>
              )}
            </div>
          )
        })}
      </div>
    </div>
  )
}
