import { useEffect, useState } from 'react'
import { Navigate, useLocation, useNavigate } from 'react-router-dom'
import { useAuth } from './AuthContext.jsx'
import { ROLE_HOME, ROUTE_ROLES } from './roles.js'
import AuthLayout from './AuthLayout.jsx'
import Toast from '../components/Toast.jsx'

// Apres connexion : retour a l'ecran demande s'il est permis pour ce role,
// sinon espace par defaut du role (ROLE_HOME).
function destinationFor(role, from) {
  return from && ROUTE_ROLES[from]?.includes(role) ? from : ROLE_HOME[role]
}

const OTP_DURATION_SECONDS = 5 * 60
const EMAIL_LOCK_SECONDS = 5 * 60
const MAX_EMAIL_ATTEMPTS = 5
const OTP_LENGTH = 6

function formatDuration(seconds) {
  const minutes = Math.floor(seconds / 60).toString().padStart(2, '0')
  const remainingSeconds = (seconds % 60).toString().padStart(2, '0')
  return `${minutes}:${remainingSeconds}`
}

function maskEmail(email) {
  const [name, domain] = email.split('@')
  if (!name || !domain) return email
  return `${name.slice(0, 2)}•••@${domain}`
}

function PasswordInput({ value, onChange, autoComplete, autoFocus, required }) {
  const [visible, setVisible] = useState(false)

  return (
    <span className="auth-password-control">
      <input
        type={visible ? 'text' : 'password'}
        value={value}
        onChange={onChange}
        autoComplete={autoComplete}
        autoFocus={autoFocus}
        required={required}
      />
      <button
        type="button"
        className="auth-password-toggle"
        aria-label={visible ? 'Masquer le mot de passe' : 'Afficher le mot de passe'}
        onClick={() => setVisible((current) => !current)}
      >
        <svg className="auth-eye-icon" viewBox="0 0 24 24" aria-hidden="true">
          <path d="M2.5 12s3.3-5.2 9.5-5.2 9.5 5.2 9.5 5.2-3.3 5.2-9.5 5.2S2.5 12 2.5 12Z" />
          <circle cx="12" cy="12" r="2.6" />
          {visible && <path className="auth-eye-slash" d="m4 4 16 16" />}
        </svg>
      </button>
    </span>
  )
}

export default function Connexion() {
  const { role, login, loginDemoCuisine } = useAuth()
  const navigate = useNavigate()
  const from = useLocation().state?.from
  const [mode, setMode] = useState('login')
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [email, setEmail] = useState('')
  const [otp, setOtp] = useState('')
  const [newPassword, setNewPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [emailAttempts, setEmailAttempts] = useState(0)
  const [otpSeconds, setOtpSeconds] = useState(0)
  const [lockSeconds, setLockSeconds] = useState(0)
  const [inlineError, setInlineError] = useState(null)
  const [toast, setToast] = useState(null)
  const [submitting, setSubmitting] = useState(false)

  const currentHour = new Date().getHours()
  const loginGreeting = currentHour >= 5 && currentHour < 12
    ? 'Bonjour.'
    : currentHour >= 12 && currentHour < 18
      ? 'Bon après-midi.'
      : 'Bonsoir.'

  const otpDigits = Array.from({ length: OTP_LENGTH }, (_, index) => otp[index] ?? '')

  function handleOtpDigitChange(index, nextValue) {
    const normalized = nextValue.replace(/\D/g, '').slice(0, 1)
    const updatedDigits = [...otpDigits]
    updatedDigits[index] = normalized
    const nextOtp = updatedDigits.join('')
    setOtp(nextOtp)

    if (normalized && index < OTP_LENGTH - 1) {
      const nextInput = document.getElementById(`otp-digit-${index + 1}`)
      nextInput?.focus()
      nextInput?.select()
    }
  }

  function handleOtpPaste(event) {
    event.preventDefault()
    const pasted = (event.clipboardData.getData('text') || '').replace(/\D/g, '').slice(0, OTP_LENGTH)
    if (!pasted) return

    const nextDigits = [...otpDigits]
    for (let index = 0; index < OTP_LENGTH; index += 1) {
      nextDigits[index] = pasted[index] ?? ''
    }
    setOtp(nextDigits.join(''))
  }

  useEffect(() => {
    if (otpSeconds === 0 && lockSeconds === 0) return undefined

    const timer = window.setInterval(() => {
      setOtpSeconds((current) => Math.max(0, current - 1))
      setLockSeconds((current) => Math.max(0, current - 1))
    }, 1000)

    return () => window.clearInterval(timer)
  }, [otpSeconds, lockSeconds])

  if (role && !submitting) return <Navigate to={destinationFor(role, from)} replace />

  async function handleSubmit(e) {
    e.preventDefault()
    setInlineError(null)
    setToast(null)

    if (mode === 'reset-email') {
      if (lockSeconds > 0) return

      const nextAttempts = emailAttempts + 1
      setEmailAttempts(nextAttempts)

      if (nextAttempts >= MAX_EMAIL_ATTEMPTS) {
        setLockSeconds(EMAIL_LOCK_SECONDS)
        setToast({ id: Date.now(), type: 'error', message: 'Limite de tentatives atteinte. Réessayez dans 05:00.' })
        return
      }

      setOtpSeconds(OTP_DURATION_SECONDS)
      setToast({ id: Date.now(), type: 'success', message: `Un code a été envoyé à ${maskEmail(email)}.` })
      setMode('reset-code')
      return
    }

    if (mode === 'reset-code') {
      if (otpSeconds === 0) {
        setToast({ id: Date.now(), type: 'error', message: 'Ce code a expiré. Demandez un nouveau code.' })
        return
      }
      if (!/^\d{6}$/.test(otp)) {
        setToast({ id: Date.now(), type: 'error', message: 'Saisissez un code de 6 chiffres.' })
        return
      }

      setMode('reset-password')
      return
    }

    if (mode === 'reset-password') {
      if (newPassword !== confirmPassword) {
        setToast({ id: Date.now(), type: 'error', message: 'Les deux mots de passe ne correspondent pas.' })
        return
      }
      setToast({ id: Date.now(), type: 'success', message: 'Votre nouveau mot de passe est prêt à être enregistré.' })
      return
    }

    setSubmitting(true)
    try {
      const receivedRole = await login(username.trim(), password)
      navigate(destinationFor(receivedRole, from), { replace: true })
    } catch (err) {
      if (err.status === 401) {
        setInlineError('Échec de connexion. Vérifiez votre identifiant et votre mot de passe, puis réessayez.')
      } else {
        setToast({
          id: Date.now(),
          type: 'error',
          message: err.status ? err.message : 'Serveur injoignable. Vérifiez votre connexion et réessayez.',
        })
      }
      setSubmitting(false)
    }
  }

  return (
    <AuthLayout>
      {mode !== 'login' && (
        <button
          className="auth-back-link auth-top-back"
          type="button"
          onClick={() => {
            setMode(mode === 'reset-email' ? 'login' : mode === 'reset-code' ? 'reset-email' : 'reset-code')
            setToast(null)
          }}
        >
          ← Retour
        </button>
      )}
      <div className="auth-form-header">
        <span className="auth-form-logo">
          SEN<span className="auth-form-logo-accent">YUMMIES</span>
        </span>
        <p className="auth-form-kicker">Espace du personnel</p>
        <h1>
          {mode === 'login'
            ? loginGreeting
            : mode === 'reset-email'
              ? 'Réinitialiser le mot de passe.'
              : mode === 'reset-code'
                ? 'Vérifiez votre identité.'
                : 'Créez un nouveau mot de passe.'}
        </h1>
        {mode !== 'reset-password' && (
          <p>
            {mode === 'login'
              ? 'Connectez-vous pour retrouver votre espace de travail.'
              : mode === 'reset-email'
                ? 'Indiquez votre adresse professionnelle pour recevoir un code sécurisé.'
                : `Le code est valable encore ${formatDuration(otpSeconds)}.`}
          </p>
        )}
      </div>

      <form className="auth-form" onSubmit={handleSubmit}>
        {mode === 'login' ? (
          <>
            {inlineError && <p className="auth-inline-error" role="alert">{inlineError}</p>}
            <label className="auth-field">
              Identifiant
              <input
                value={username}
                onChange={(e) => { setUsername(e.target.value); setInlineError(null) }}
                autoComplete="username"
                autoFocus
                required
              />
            </label>

            <label className="auth-field">
              Mot de passe
              <PasswordInput
                value={password}
                onChange={(e) => { setPassword(e.target.value); setInlineError(null) }}
                autoComplete="current-password"
                required
              />
            </label>

            <div className="auth-secondary-row">
              <span>Accès réservé au personnel</span>
              <button type="button" onClick={() => { setMode('reset-email'); setInlineError(null); setToast(null) }}>
                Mot de passe oublié ?
              </button>
            </div>
          </>
        ) : mode === 'reset-email' ? (
          <label className="auth-field">
            Adresse e-mail professionnelle
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              autoComplete="email"
              autoFocus
              required
            />
            <span className="auth-field-help">
              {lockSeconds > 0
                ? `Trop de demandes. Réessayez dans ${formatDuration(lockSeconds)}.`
                : `Il vous reste ${MAX_EMAIL_ATTEMPTS - emailAttempts} tentative${MAX_EMAIL_ATTEMPTS - emailAttempts > 1 ? 's' : ''}.`}
            </span>
          </label>
        ) : mode === 'reset-code' ? (
          <>
            <label className="auth-field">
              Code de vérification
              <div className="auth-otp-row" aria-label="Code de vérification à 6 chiffres">
                {otpDigits.map((digit, index) => (
                  <input
                    key={`otp-${index}`}
                    id={`otp-digit-${index}`}
                    className="auth-otp-input"
                    inputMode="numeric"
                    pattern="[0-9]"
                    maxLength={1}
                    value={digit}
                    autoFocus={index === 0}
                    onChange={(event) => handleOtpDigitChange(index, event.target.value)}
                    onKeyDown={(event) => {
                      if (event.key === 'Backspace' && !digit && index > 0) {
                        const previousInput = document.getElementById(`otp-digit-${index - 1}`)
                        previousInput?.focus()
                        previousInput?.select()
                      }
                      if (event.key === 'ArrowLeft' && index > 0) {
                        document.getElementById(`otp-digit-${index - 1}`)?.focus()
                      }
                      if (event.key === 'ArrowRight' && index < OTP_LENGTH - 1) {
                        document.getElementById(`otp-digit-${index + 1}`)?.focus()
                      }
                    }}
                    onFocus={(event) => event.target.select()}
                    onPaste={handleOtpPaste}
                    required
                  />
                ))}
              </div>
              <span className="auth-field-help">Code envoyé à {maskEmail(email)}.</span>
            </label>
            <div className="auth-code-meta">
              {otpSeconds === 0 && <span className="is-expired">Code expiré</span>}
              <button
                type="button"
                disabled={otpSeconds > 0}
                onClick={() => { setOtpSeconds(OTP_DURATION_SECONDS); setOtp(''); setToast({ id: Date.now(), type: 'success', message: 'Un nouveau code a été envoyé.' }) }}
              >
                Renvoyer le code
              </button>
            </div>
          </>
        ) : (
          <>
            <label className="auth-field">
              Nouveau mot de passe
              <PasswordInput
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                autoComplete="new-password"
                autoFocus
                required
              />
            </label>
            <label className="auth-field">
              Confirmer le mot de passe
              <PasswordInput
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                autoComplete="new-password"
                required
              />
            </label>
          </>
        )}

        <button
          className="auth-submit"
          type="submit"
          aria-busy={submitting}
          disabled={
            submitting ||
            (mode === 'login' && (!username.trim() || !password)) ||
            (mode === 'reset-email' && (!email || lockSeconds > 0)) ||
            (mode === 'reset-code' && otp.length !== 6) ||
            (mode === 'reset-password' && (!newPassword || !confirmPassword || newPassword !== confirmPassword))
          }
        >
          {submitting && <span className="auth-submit-spinner" aria-hidden="true" />}
          <span>
            {mode === 'reset-email'
              ? 'Envoyer le code'
              : mode === 'reset-code'
                ? 'Vérifier le code'
                : mode === 'reset-password'
                  ? 'Enregistrer le mot de passe'
                  : submitting
                    ? 'Connexion…'
                    : 'Se connecter'}
          </span>
        </button>

        {mode === 'login' && (
          <button
            type="button"
            className="auth-submit"
            style={{ marginTop: 10, background: 'transparent', color: '#a6192e', border: '1px solid #e6c2c9' }}
            onClick={() => {
              const receivedRole = loginDemoCuisine()
              navigate(destinationFor(receivedRole, from), { replace: true })
            }}
          >
            <span>Entrer en démo Cuisine (sans backend)</span>
          </button>
        )}

      </form>
      <Toast toast={toast} onClose={() => setToast(null)} />
    </AuthLayout>
  )
}
