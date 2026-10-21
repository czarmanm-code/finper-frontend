import { useState, useEffect, useCallback } from 'react'
import Sidebar from '../components/Sidebar'
import Header from '../components/Header'
import ConfirmDialog from '../components/ui/ConfirmDialog'
import Modal from '../components/ui/Modal'
import {
  UserGroupIcon,
  UserPlusIcon,
  ShieldCheckIcon,
  UserIcon,
  TrashIcon,
  CheckCircleIcon,
  XCircleIcon,
  ClipboardDocumentIcon,
  ArrowPathIcon,
  ClockIcon,
} from '@heroicons/react/24/outline'
import { apiRequest } from '../services/api'
import { useAuth } from '../context/AuthContext'

export default function Users() {
  const { user: currentUser } = useAuth()
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [users, setUsers] = useState([])
  const [invitations, setInvitations] = useState([])
  const [isLoading, setIsLoading] = useState(true)

  // Invite modal state
  const [isInviteModalOpen, setIsInviteModalOpen] = useState(false)
  const [inviteRole, setInviteRole] = useState('user')
  const [inviteDays, setInviteDays] = useState('7')
  const [generatedInvite, setGeneratedInvite] = useState(null)
  const [isGeneratingInvite, setIsGeneratingInvite] = useState(false)
  const [copiedLink, setCopiedLink] = useState(false)

  // User edit / action state
  const [deleteTargetUser, setDeleteTargetUser] = useState(null)
  const [statusActionTarget, setStatusActionTarget] = useState(null)
  const [roleActionTarget, setRoleActionTarget] = useState(null)
  const [deleteInviteTarget, setDeleteInviteTarget] = useState(null)
  const [feedback, setFeedback] = useState('')

  const loadData = useCallback(async () => {
    setIsLoading(true)
    try {
      const [usersRes, invitesRes] = await Promise.all([
        apiRequest('/auth/users'),
        apiRequest('/auth/invitations'),
      ])
      setUsers(usersRes.users || [])
      setInvitations(invitesRes.invitations || [])
    } catch (err) {
      console.error('Failed to load users data:', err)
      setFeedback('Error loading users list: ' + err.message)
    } finally {
      setIsLoading(false)
    }
  }, [])

  useEffect(() => {
    loadData()
  }, [loadData])

  const handleGenerateInvite = async (e) => {
    e.preventDefault()
    setIsGeneratingInvite(true)
    try {
      const res = await apiRequest('/auth/invitations', {
        method: 'POST',
        body: JSON.stringify({
          assignedRole: inviteRole,
          expiresInDays: parseInt(inviteDays, 10),
        }),
      })

      const fullLink = `${window.location.origin}/register?token=${res.invitation.token}`
      setGeneratedInvite({
        ...res.invitation,
        fullLink,
      })
      await loadData()
    } catch (err) {
      alert('Error generating invitation: ' + err.message)
    } finally {
      setIsGeneratingInvite(false)
    }
  }

  const handleCopyLink = (link) => {
    navigator.clipboard.writeText(link)
    setCopiedLink(true)
    setTimeout(() => setCopiedLink(false), 2500)
  }

  // Toggle user active status
  const handleToggleStatus = async () => {
    if (!statusActionTarget) return
    try {
      await apiRequest(`/auth/users/${statusActionTarget.id}`, {
        method: 'PATCH',
        body: JSON.stringify({ isActive: !statusActionTarget.isActive }),
      })
      setStatusActionTarget(null)
      await loadData()
    } catch (err) {
      alert(err.message || 'Error updating user status')
    }
  }

  // Toggle user role
  const handleToggleRole = async () => {
    if (!roleActionTarget) return
    const newRole = roleActionTarget.role === 'admin' ? 'user' : 'admin'
    try {
      await apiRequest(`/auth/users/${roleActionTarget.id}`, {
        method: 'PATCH',
        body: JSON.stringify({ role: newRole }),
      })
      setRoleActionTarget(null)
      await loadData()
    } catch (err) {
      alert(err.message || 'Error updating user role')
    }
  }

  // Delete user and cascade their data
  const handleDeleteUser = async () => {
    if (!deleteTargetUser) return
    try {
      await apiRequest(`/auth/users/${deleteTargetUser.id}`, {
        method: 'DELETE',
      })
      setDeleteTargetUser(null)
      await loadData()
    } catch (err) {
      alert(err.message || 'Error deleting user')
    }
  }

  // Revoke invitation
  const handleRevokeInvite = async () => {
    if (!deleteInviteTarget) return
    try {
      await apiRequest(`/auth/invitations/${deleteInviteTarget._id || deleteInviteTarget.id}`, {
        method: 'DELETE',
      })
      setDeleteInviteTarget(null)
      await loadData()
    } catch (err) {
      alert(err.message || 'Error revoking invitation')
    }
  }

  return (
    <div className="flex min-h-screen bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 transition-colors">
      <Sidebar open={sidebarOpen} onClose={() => setSidebarOpen(false)} />

      <div className="flex-1 flex flex-col min-w-0">
        <Header onMenuClick={() => setSidebarOpen(true)} />

        <main className="flex-1 p-4 sm:p-6 lg:p-8 flex flex-col gap-6 lg:gap-8">
          {/* Header Bar */}
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-2xl font-bold text-slate-900 dark:text-white tracking-tight">
                  User Management
                </h1>
                <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-sky-50 dark:bg-sky-950/60 text-sky-600 dark:text-sky-400 border border-sky-200 dark:border-sky-800">
                  {users.length} Active Users
                </span>
              </div>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                Manage accounts, assign roles, and create invitation links with isolated data
              </p>
            </div>

            <div className="flex items-center gap-2.5">
              <button
                onClick={loadData}
                className="inline-flex items-center gap-1.5 px-3 py-2 text-xs font-medium text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg shadow-2xs transition"
                title="Refresh list"
              >
                <ArrowPathIcon className="w-3.5 h-3.5" />
                <span>Refresh</span>
              </button>

              <button
                onClick={() => {
                  setGeneratedInvite(null)
                  setIsInviteModalOpen(true)
                }}
                className="inline-flex items-center gap-2 px-3.5 py-2 text-sm font-semibold text-white bg-sky-600 hover:bg-sky-700 rounded-lg shadow-sm transition"
              >
                <UserPlusIcon className="w-4 h-4" />
                <span>Invite User</span>
              </button>
            </div>
          </div>

          {feedback && (
            <div className="p-3 text-xs rounded-xl bg-sky-50 dark:bg-sky-950/30 text-sky-800 dark:text-sky-300 border border-sky-200 dark:border-sky-800">
              {feedback}
            </div>
          )}

          {/* Users Table */}
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl overflow-hidden shadow-sm">
            <div className="px-6 py-4 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between">
              <h3 className="text-sm font-bold text-slate-900 dark:text-white">Registered Users</h3>
              <span className="text-xs text-slate-400">All data strictly user-isolated</span>
            </div>

            {isLoading ? (
              <div className="p-8 text-center text-xs text-slate-400">Loading users...</div>
            ) : users.length === 0 ? (
              <div className="p-8 text-center text-xs text-slate-400">No users found.</div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-sm">
                  <thead className="bg-slate-50 dark:bg-slate-800/40 text-[11px] font-semibold text-slate-500 uppercase tracking-wider border-b border-slate-200 dark:border-slate-800">
                    <tr>
                      <th className="px-6 py-3">User</th>
                      <th className="px-6 py-3">Role</th>
                      <th className="px-6 py-3">Status</th>
                      <th className="px-6 py-3">Joined</th>
                      <th className="px-6 py-3 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 dark:divide-slate-800 text-xs">
                    {users.map((u) => {
                      const isSelf = u.id === currentUser?.id || u._id === currentUser?.id
                      return (
                        <tr key={u.id || u._id} className="hover:bg-slate-50/60 dark:hover:bg-slate-800/40 transition">
                          <td className="px-6 py-4">
                            <div className="flex items-center gap-3">
                              <div className="w-8 h-8 rounded-full bg-sky-100 dark:bg-sky-950 flex items-center justify-center text-sky-700 dark:text-sky-300 font-bold uppercase text-xs">
                                {u.name ? u.name.charAt(0) : 'U'}
                              </div>
                              <div>
                                <div className="font-semibold text-slate-900 dark:text-white flex items-center gap-1.5">
                                  <span>{u.name}</span>
                                  {isSelf && (
                                    <span className="text-[10px] px-1.5 py-0.2 rounded bg-sky-50 dark:bg-sky-950 text-sky-600 dark:text-sky-400 border border-sky-200 dark:border-sky-800 font-medium">
                                      You
                                    </span>
                                  )}
                                </div>
                                <div className="text-slate-400">{u.email}</div>
                              </div>
                            </div>
                          </td>
                          <td className="px-6 py-4">
                            <span
                              className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full font-semibold uppercase text-[10px] ${
                                u.role === 'admin'
                                  ? 'bg-amber-50 dark:bg-amber-950/50 text-amber-700 dark:text-amber-400 border border-amber-200 dark:border-amber-800'
                                  : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400'
                              }`}
                            >
                              {u.role === 'admin' ? (
                                <ShieldCheckIcon className="w-3 h-3" />
                              ) : (
                                <UserIcon className="w-3 h-3" />
                              )}
                              {u.role}
                            </span>
                          </td>
                          <td className="px-6 py-4">
                            <span
                              className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full font-medium text-[11px] ${
                                u.isActive
                                  ? 'bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300'
                                  : 'bg-rose-50 dark:bg-rose-950/40 text-rose-700 dark:text-rose-300'
                              }`}
                            >
                              {u.isActive ? (
                                <>
                                  <CheckCircleIcon className="w-3 h-3" />
                                  <span>Active</span>
                                </>
                              ) : (
                                <>
                                  <XCircleIcon className="w-3 h-3" />
                                  <span>Suspended</span>
                                </>
                              )}
                            </span>
                          </td>
                          <td className="px-6 py-4 text-slate-400">
                            {u.createdAt ? new Date(u.createdAt).toLocaleDateString() : '—'}
                          </td>
                          <td className="px-6 py-4 text-right">
                            <div className="flex items-center justify-end gap-2">
                              {/* Change Role Button */}
                              {!isSelf && (
                                <button
                                  type="button"
                                  onClick={() => setRoleActionTarget(u)}
                                  className="px-2 py-1 text-[11px] font-medium text-slate-600 dark:text-slate-300 hover:text-sky-600 border border-slate-200 dark:border-slate-700 rounded-md transition"
                                  title="Change Role"
                                >
                                  {u.role === 'admin' ? 'Make User' : 'Make Admin'}
                                </button>
                              )}

                              {/* Toggle Active Button */}
                              {!isSelf && (
                                <button
                                  type="button"
                                  onClick={() => setStatusActionTarget(u)}
                                  className={`px-2 py-1 text-[11px] font-medium border rounded-md transition ${
                                    u.isActive
                                      ? 'text-amber-600 hover:bg-amber-50 border-amber-200 dark:border-amber-800'
                                      : 'text-emerald-600 hover:bg-emerald-50 border-emerald-200 dark:border-emerald-800'
                                  }`}
                                >
                                  {u.isActive ? 'Deactivate' : 'Activate'}
                                </button>
                              )}

                              {/* Delete Button */}
                              {!isSelf && (
                                <button
                                  type="button"
                                  onClick={() => setDeleteTargetUser(u)}
                                  className="p-1 text-slate-400 hover:text-rose-600 dark:hover:text-rose-400 rounded transition"
                                  title="Delete User and purge data"
                                >
                                  <TrashIcon className="w-4 h-4" />
                                </button>
                              )}
                            </div>
                          </td>
                        </tr>
                      )
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </div>

          {/* Active Invitations List */}
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl overflow-hidden shadow-sm">
            <div className="px-6 py-4 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between">
              <div>
                <h3 className="text-sm font-bold text-slate-900 dark:text-white">Invitation Links</h3>
                <p className="text-xs text-slate-400 mt-0.5">
                  Single-use links for onboarding new users or co-administrators
                </p>
              </div>
            </div>

            {invitations.length === 0 ? (
              <div className="p-8 text-center text-xs text-slate-400">
                No active or previous invitation links.
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-sm">
                  <thead className="bg-slate-50 dark:bg-slate-800/40 text-[11px] font-semibold text-slate-500 uppercase tracking-wider border-b border-slate-200 dark:border-slate-800">
                    <tr>
                      <th className="px-6 py-3">Assigned Role</th>
                      <th className="px-6 py-3">Status</th>
                      <th className="px-6 py-3">Expires</th>
                      <th className="px-6 py-3">Created By</th>
                      <th className="px-6 py-3 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 dark:divide-slate-800 text-xs">
                    {invitations.map((inv) => {
                      const isExpired = new Date() > new Date(inv.expiresAt)
                      const isAvailable = !inv.used && !isExpired
                      const link = `${window.location.origin}/register?token=${inv.token}`

                      return (
                        <tr key={inv._id || inv.id} className="hover:bg-slate-50/60 dark:hover:bg-slate-800/40 transition">
                          <td className="px-6 py-4 font-semibold uppercase tracking-wider text-[10px]">
                            <span
                              className={`px-2 py-0.5 rounded-full ${
                                inv.assignedRole === 'admin'
                                  ? 'bg-amber-50 dark:bg-amber-950/50 text-amber-700 dark:text-amber-400'
                                  : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400'
                              }`}
                            >
                              {inv.assignedRole}
                            </span>
                          </td>
                          <td className="px-6 py-4">
                            {inv.used ? (
                              <span className="text-slate-400">
                                Used by <span className="font-semibold text-slate-700 dark:text-slate-300">{inv.usedBy?.name || 'User'}</span>
                              </span>
                            ) : isExpired ? (
                              <span className="text-rose-500">Expired</span>
                            ) : (
                              <span className="text-emerald-600 font-semibold">Available</span>
                            )}
                          </td>
                          <td className="px-6 py-4 text-slate-400">
                            {new Date(inv.expiresAt).toLocaleDateString()}
                          </td>
                          <td className="px-6 py-4 text-slate-400">
                            {inv.createdBy?.name || 'Admin'}
                          </td>
                          <td className="px-6 py-4 text-right">
                            <div className="flex items-center justify-end gap-2">
                              {isAvailable && (
                                <button
                                  type="button"
                                  onClick={() => handleCopyLink(link)}
                                  className="inline-flex items-center gap-1 px-2.5 py-1 text-[11px] font-semibold text-sky-600 bg-sky-50 dark:bg-sky-950/50 rounded-lg border border-sky-200 dark:border-sky-800 hover:bg-sky-100 transition"
                                >
                                  <ClipboardDocumentIcon className="w-3.5 h-3.5" />
                                  <span>Copy Link</span>
                                </button>
                              )}

                              {!inv.used && (
                                <button
                                  type="button"
                                  onClick={() => setDeleteInviteTarget(inv)}
                                  className="p-1 text-slate-400 hover:text-rose-600 dark:hover:text-rose-400 rounded transition"
                                  title="Revoke Invitation"
                                >
                                  <TrashIcon className="w-4 h-4" />
                                </button>
                              )}
                            </div>
                          </td>
                        </tr>
                      )
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </main>
      </div>

      {/* Generate Invite Modal */}
      {isInviteModalOpen && (
        <Modal title="Generate Invitation Link" onClose={() => setIsInviteModalOpen(false)}>
          {generatedInvite ? (
            <div className="space-y-4">
              <div className="p-4 rounded-2xl bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-800 text-emerald-900 dark:text-emerald-200 text-xs">
                <p className="font-semibold text-sm mb-1">Invitation Link Created!</p>
                <p className="text-emerald-700 dark:text-emerald-300">
                  Share this single-use link with the person you want to invite.
                </p>
              </div>

              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-slate-500 mb-1">
                  Registration Link
                </label>
                <div className="flex items-center gap-2">
                  <input
                    type="text"
                    readOnly
                    value={generatedInvite.fullLink}
                    className="flex-1 px-3 py-2 text-xs font-mono bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-lg text-slate-900 dark:text-white"
                  />
                  <button
                    type="button"
                    onClick={() => handleCopyLink(generatedInvite.fullLink)}
                    className="px-3 py-2 text-xs font-semibold text-white bg-sky-600 hover:bg-sky-700 rounded-lg transition"
                  >
                    {copiedLink ? 'Copied!' : 'Copy'}
                  </button>
                </div>
              </div>

              <div className="flex justify-end pt-2">
                <button
                  type="button"
                  onClick={() => setIsInviteModalOpen(false)}
                  className="px-4 py-2 text-sm font-semibold text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition"
                >
                  Done
                </button>
              </div>
            </div>
          ) : (
            <form onSubmit={handleGenerateInvite} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-slate-500 mb-1">
                  Assigned Role
                </label>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => setInviteRole('user')}
                    className={`py-2 px-3 text-xs font-semibold rounded-xl border transition ${
                      inviteRole === 'user'
                        ? 'bg-sky-50 dark:bg-sky-950/40 border-sky-500 text-sky-700 dark:text-sky-300'
                        : 'border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400'
                    }`}
                  >
                    Regular User
                  </button>
                  <button
                    type="button"
                    onClick={() => setInviteRole('admin')}
                    className={`py-2 px-3 text-xs font-semibold rounded-xl border transition ${
                      inviteRole === 'admin'
                        ? 'bg-amber-50 dark:bg-amber-950/40 border-amber-500 text-amber-700 dark:text-amber-300'
                        : 'border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400'
                    }`}
                  >
                    Administrator
                  </button>
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-slate-500 mb-1">
                  Expiration
                </label>
                <select
                  value={inviteDays}
                  onChange={(e) => setInviteDays(e.target.value)}
                  className="w-full px-3 py-2 text-sm rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white"
                >
                  <option value="1">1 Day</option>
                  <option value="7">7 Days</option>
                  <option value="14">14 Days</option>
                  <option value="30">30 Days</option>
                </select>
              </div>

              <div className="flex justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setIsInviteModalOpen(false)}
                  className="px-4 py-2 text-sm font-medium text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isGeneratingInvite}
                  className="px-4 py-2 text-sm font-semibold text-white bg-sky-600 hover:bg-sky-700 disabled:opacity-50 rounded-lg transition"
                >
                  {isGeneratingInvite ? 'Generating...' : 'Create Link'}
                </button>
              </div>
            </form>
          )}
        </Modal>
      )}

      {/* Confirm Status Toggle Dialog */}
      {statusActionTarget && (
        <ConfirmDialog
          title={statusActionTarget.isActive ? 'Deactivate User' : 'Activate User'}
          message={`Are you sure you want to ${
            statusActionTarget.isActive ? 'suspend access for' : 'restore access for'
          } ${statusActionTarget.name}?`}
          confirmLabel={statusActionTarget.isActive ? 'Deactivate' : 'Activate'}
          danger={statusActionTarget.isActive}
          onConfirm={handleToggleStatus}
          onCancel={() => setStatusActionTarget(null)}
        />
      )}

      {/* Confirm Role Change Dialog */}
      {roleActionTarget && (
        <ConfirmDialog
          title="Change User Role"
          message={`Change ${roleActionTarget.name}'s role to ${
            roleActionTarget.role === 'admin' ? 'Regular User' : 'Administrator'
          }?`}
          confirmLabel="Change Role"
          onConfirm={handleToggleRole}
          onCancel={() => setRoleActionTarget(null)}
        />
      )}

      {/* Confirm User Delete Dialog */}
      {deleteTargetUser && (
        <ConfirmDialog
          title="Delete User"
          message={`Are you sure you want to permanently delete "${deleteTargetUser.name}"? All transactions, custom categories, and budgets belonging to this user will be purged. This action cannot be undone.`}
          confirmLabel="Delete Account & Data"
          danger
          onConfirm={handleDeleteUser}
          onCancel={() => setDeleteTargetUser(null)}
        />
      )}

      {/* Confirm Revoke Invite Dialog */}
      {deleteInviteTarget && (
        <ConfirmDialog
          title="Revoke Invitation"
          message="Are you sure you want to revoke this invitation? Anyone with the link will no longer be able to register."
          confirmLabel="Revoke Link"
          danger
          onConfirm={handleRevokeInvite}
          onCancel={() => setDeleteInviteTarget(null)}
        />
      )}
    </div>
  )
}

