import { useState } from 'react'
import { useSearchParams, useNavigate, Link } from 'react-router-dom'
import { api } from '@/lib/api'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Dumbbell, KeyRound } from 'lucide-react'
import { toast } from 'sonner'

export default function ResetPasswordPage() {
  const [searchParams] = useSearchParams()
  const navigate = useNavigate()
  const token = searchParams.get('token') || ''

  const [newPassword, setNewPassword] = useState('')
  const [newPasswordConfirm, setNewPasswordConfirm] = useState('')
  const [error, setError] = useState(!token ? 'El enlace de restablecimiento no es válido o ha expirado.' : '')
  const [loading, setLoading] = useState(false)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError('')
    if (!token) {
      setError('Enlace de restablecimiento inválido o faltante.')
      return
    }
    if (newPassword !== newPasswordConfirm) {
      setError('Las contraseñas no coinciden.')
      return
    }
    if (newPassword.length < 8) {
      setError('La contraseña debe tener al menos 8 caracteres.')
      return
    }
    setLoading(true)
    try {
      await api('/auth/reset-password/', {
        method: 'POST',
        body: JSON.stringify({ token, new_password: newPassword, new_password_confirm: newPasswordConfirm }),
      })
      toast.success('Contraseña restablecida correctamente.')
      navigate('/login')
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error al restablecer contraseña')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-zinc-950 p-4">
      <div className="w-full max-w-md">
        <div className="flex flex-col items-center mb-8">
          <div className="h-14 w-14 rounded-2xl bg-orange-500 flex items-center justify-center mb-4">
            <Dumbbell className="h-8 w-8 text-white" />
          </div>
          <h1 className="text-2xl font-bold text-zinc-100">Nueva Contraseña</h1>
        </div>

        <form onSubmit={handleSubmit} className="bg-zinc-900 border border-zinc-800 rounded-xl p-6 space-y-4">
          {error && (
            <div className="bg-red-500/10 border border-red-500/20 text-red-400 text-sm rounded-lg px-4 py-3">
              {error}
            </div>
          )}

          <div className="space-y-2">
            <Label className="text-zinc-300">Nueva Contraseña</Label>
            <Input
              type="password"
              placeholder="Mínimo 8 caracteres"
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              required minLength={8}
              className="bg-zinc-800 border-zinc-700 text-zinc-100"
            />
          </div>

          <div className="space-y-2">
            <Label className="text-zinc-300">Confirmar Contraseña</Label>
            <Input
              type="password"
              placeholder="Repita la contraseña"
              value={newPasswordConfirm}
              onChange={(e) => setNewPasswordConfirm(e.target.value)}
              required minLength={8}
              className="bg-zinc-800 border-zinc-700 text-zinc-100"
            />
          </div>

          <Button type="submit" disabled={loading || !token} className="w-full bg-orange-500 hover:bg-orange-600 text-white">
            <KeyRound className="h-4 w-4 mr-2" />
            {loading ? 'Restableciendo...' : 'Restablecer Contraseña'}
          </Button>

          <div className="text-center">
            <Link to="/login" className="text-sm text-orange-400 hover:text-orange-300">
              Volver a Inicio de Sesión
            </Link>
          </div>
        </form>
      </div>
    </div>
  )
}
