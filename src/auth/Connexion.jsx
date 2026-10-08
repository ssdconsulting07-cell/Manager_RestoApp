import { useState } from 'react'
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

function PasswordInput({ value, onChange, autoComplete, autoFocus, required, minLength }) {
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
        minLength={minLength}
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
  const { role, login, changeTemporaryPassword } = useAuth()
  const navigate = useNavigate()
  const from = useLocation().state?.from
  const [mode, setMode] = useState('login')
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [temporaryCredentials, setTemporaryCredentials] = useState(null)
  const [newPassword, setNewPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [inlineError, setInlineError] = useState(null)
  const [toast, setToast] = useState(null)
  const [submitting, setSubmitting] = useState(false)

  const currentHour = new Date().getHours()
  const loginGreeting = currentHour >= 5 && currentHour < 12
    ? 'Bonjour.'
    : currentHour >= 12 && currentHour < 18
      ? 'Bon après-midi.'
      : 'Bonsoir.'

  if (role && !submitting) return <Navigate to={destinationFor(role, from)} replace />

  async function handleSubmit(e) {
    e.preventDefault()
    setInlineError(null)
    setToast(null)

    setSubmitting(true)
    try {
      if (mode === 'change-temporary-password') {
        const receivedRole = await changeTemporaryPassword({
          username: temporaryCredentials.username,
          temporaryPassword: temporaryCredentials.password,
          newPassword,
        })
        navigate(destinationFor(receivedRole, from), { replace: true })
      } else {
        const result = await login(username.trim(), password)
        if (result.mustChangePassword) {
          setTemporaryCredentials({ username: username.trim(), password })
          setPassword('')
          setMode('change-temporary-password')
          return
        }
        navigate(destinationFor(result.role, from), { replace: true })
      }
    } catch (err) {
      if (err.status === 401) {
        setInlineError(mode === 'login'
          ? 'Échec de connexion. Vérifiez votre identifiant et votre mot de passe, puis réessayez.'
          : 'Le mot de passe temporaire est invalide ou a déjà été remplacé. Contactez le gérant.')
      } else {
        setToast({
          id: Date.now(),
          type: 'error',
          message: err.status ? err.message : 'Serveur injoignable. Vérifiez votre connexion et réessayez.',
        })
      }
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <AuthLayout>
      {mode === 'forgot-password' && (
        <button
          className="auth-back-link auth-top-back"
          type="button"
          onClick={() => { setMode('login'); setToast(null); setInlineError(null) }}
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
            : mode === 'forgot-password'
              ? 'Mot de passe oublié ?'
              : 'Définissez votre mot de passe.'}
        </h1>
        <p>
          {mode === 'login'
            ? 'Connectez-vous pour retrouver votre espace de travail.'
            : mode === 'forgot-password'
              ? 'Contactez votre gérant pour obtenir un mot de passe temporaire.'
              : 'Votre mot de passe temporaire est validé. Choisissez un nouveau mot de passe pour accéder à votre espace.'}
        </p>
      </div>

      <form className="auth-form" onSubmit={handleSubmit}>
        {inlineError && <p className="auth-inline-error" role="alert">{inlineError}</p>}
        {mode === 'login' ? (
          <>
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
              <button type="button" onClick={() => { setMode('forgot-password'); setInlineError(null); setToast(null) }}>
                Mot de passe oublié ?
              </button>
            </div>
          </>
        ) : mode === 'forgot-password' ? (
          <div className="auth-reset-notice">
            Le gérant générera un nouveau mot de passe temporaire. Après connexion avec ce mot de passe, vous devrez le remplacer avant d’accéder à votre espace.
          </div>
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
                minLength={12}
              />
              <span className="auth-field-help">12 caractères minimum.</span>
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

        {mode === 'forgot-password' ? (
          <button className="auth-submit" type="button" onClick={() => setMode('login')}>
            <span>Retour à la connexion</span>
          </button>
        ) : (
          <button
            className="auth-submit"
            type="submit"
            aria-busy={submitting}
            disabled={
              submitting ||
              (mode === 'login' && (!username.trim() || !password)) ||
              (mode === 'change-temporary-password' && (
                newPassword.length < 12 ||
                !confirmPassword ||
                newPassword !== confirmPassword
              ))
            }
          >
            {submitting && <span className="auth-submit-spinner" aria-hidden="true" />}
            <span>
              {mode === 'change-temporary-password'
                ? submitting ? 'Enregistrement…' : 'Enregistrer et accéder à mon espace'
                : submitting ? 'Connexion…' : 'Se connecter'}
            </span>
          </button>
        )}

      </form>
      <Toast toast={toast} onClose={() => setToast(null)} />
    </AuthLayout>
  )
}
