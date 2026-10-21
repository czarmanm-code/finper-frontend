import { useState, useEffect } from 'react'
import { Link, useNavigate, useSearchParams } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { apiRequest } from '../services/api'
import { WalletIcon, ShieldCheckIcon, UserPlusIcon } from '@heroicons/react/24/outline'

export default function Register() {
  const { register, needsSetup } = useAuth()
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()

  const invitationToken = searchParams.get('token') || ''

  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [error, setError] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)

  // Token validation state
  const [isVerifyingToken, setIsVerifyingToken] = useState(!needsSetup && Boolean(invitationToken))
  const [tokenInfo, setTokenInfo] = useState(null)
  const [tokenError, setTokenError] = useState('')

  useEffect(() => {
    async function checkToken() {
      if (needsSetup) {
        setIsVerifyingToken(false)
        return
      }

      if (!invitationToken) {
        setTokenError('An invitation token is required to register an account.')
        setIsVerifyingToken(false)
        return
      }

      try {
        const res = await apiRequest(`/auth/invitations/verify/${invitationToken}`)
        setTokenInfo(res.invitation)
      } catch (err) {
        setTokenError(err.message || 'Invalid or expired invitation token.')
      } finally {
        setIsVerifyingToken(false)
      }
    }

    checkToken()
  }, [invitationToken, needsSetup])

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')

    if (password !== confirmPassword) {
      setError('Passwords do not match.')
      return
    }

    if (password.length < 6) {
      setError('Password must be at least 6 characters long.')
      return
    }

    setIsSubmitting(true)

    try {
      await register({
        name: name.trim(),
        email: email.trim(),
        password,
        invitationToken: needsSetup ? undefined : invitationToken,
      })
      navigate('/')
    } catch (err) {
      setError(err.message || 'Registration failed. Please try again.')
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-50 dark:bg-slate-950 p-4 transition-colors">
      <div className="w-full max-w-md bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-8 shadow-sm">
        {/* Brand Header */}
        <div className="flex flex-col items-center text-center mb-8">
          <div className="w-12 h-12 rounded-2xl bg-sky-50 dark:bg-sky-950/60 border border-sky-200 dark:border-sky-800/80 flex items-center justify-center text-sky-600 dark:text-sky-400 mb-3 shadow-2xs">
            {needsSetup ? <ShieldCheckIcon className="w-7 h-7" /> : <WalletIcon className="w-7 h-7" />}
          </div>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-white tracking-tight">
            {needsSetup ? 'Setup Initial Administrator' : 'Create Your Account'}
          </h1>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
            {needsSetup
              ? 'Bootstrap PerFin with your master administrator credentials'
              : 'Join PerFin with your personal financial workspace'}
          </p>
        </div>

        {/* Invitation verification banner */}
        {!needsSetup && tokenInfo && (
          <div className="mb-6 p-4 rounded-2xl bg-sky-50 dark:bg-sky-950/30 border border-sky-200 dark:border-sky-800 text-sky-900 dark:text-sky-200 text-xs flex items-center gap-3">
            <UserPlusIcon className="w-5 h-5 text-sky-600 dark:text-sky-400 flex-shrink-0" />
            <div>
              <p className="font-semibold">Invited by {tokenInfo.invitedBy}</p>
              <p className="text-sky-700 dark:text-sky-300">
                You are joining with role: <span className="font-bold uppercase tracking-wider">{tokenInfo.assignedRole}</span>
              </p>
            </div>
          </div>
        )}

        {/* Token Error */}
        {!needsSetup && tokenError && (
          <div className="mb-6 p-4 rounded-2xl bg-rose-50 dark:bg-rose-950/30 border border-rose-200 dark:border-rose-800 text-rose-700 dark:text-rose-300 text-xs flex flex-col gap-2">
            <p className="font-semibold">Invalid Invitation</p>
            <p>{tokenError}</p>
            <Link to="/login" className="font-semibold underline text-rose-800 dark:text-rose-200 mt-1">
              Go to Sign In
            </Link>
          </div>
        )}

        {error && (
          <div className="mb-6 p-3.5 rounded-xl bg-rose-50 dark:bg-rose-950/30 border border-rose-200 dark:border-rose-800 text-rose-700 dark:text-rose-300 text-xs font-medium">
            {error}
          </div>
        )}

        {isVerifyingToken ? (
          <div className="py-8 text-center text-xs text-slate-400">
            Verifying invitation token...
          </div>
        ) : (needsSetup || tokenInfo) ? (
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-1.5">
                Full Name
              </label>
              <input
                type="text"
                required
                autoFocus
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Jane Doe"
                className="w-full px-3.5 py-2.5 text-sm rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-sky-500"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-1.5">
                Email Address
              </label>
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="jane@example.com"
                className="w-full px-3.5 py-2.5 text-sm rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-sky-500"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-1.5">
                Password
              </label>
              <input
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full px-3.5 py-2.5 text-sm rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-sky-500"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-1.5">
                Confirm Password
              </label>
              <input
                type="password"
                required
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full px-3.5 py-2.5 text-sm rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-sky-500"
              />
            </div>

            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full py-3 mt-2 px-4 rounded-xl text-sm font-semibold text-white bg-sky-600 hover:bg-sky-700 disabled:opacity-50 transition shadow-sm"
            >
              {isSubmitting
                ? 'Creating account...'
                : needsSetup
                ? 'Create Administrator'
                : 'Complete Registration'}
            </button>
          </form>
        ) : null}

        <div className="mt-6 text-center text-xs text-slate-500 dark:text-slate-400">
          Already have an account?{' '}
          <Link to="/login" className="font-semibold text-sky-600 dark:text-sky-400 hover:underline">
            Sign In
          </Link>
        </div>
      </div>
    </div>
  )
}

