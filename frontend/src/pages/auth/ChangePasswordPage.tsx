import { useState } from 'react'
import { useAuth } from '@/lib/auth'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Lock } from 'lucide-react'

export default function ChangePasswordPage() {
  const { changePassword } = useAuth()
  const [currentPassword, setCurrentPassword] = useState('')
  const [newPassword, setNewPassword] = useState('')
  const [newPasswordConfirm, setNewPasswordConfirm] = useState('')
  const [error, setError] = useState('')
  const [success, setSuccess] = useState(false)
  const [loading, setLoading] = useState(false)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError('')
    setSuccess(false)
    if (newPassword !== newPasswordConfirm) {
      setError('Las contraseñas no coinciden.')
      return
    }
    if (newPassword.length < 8) {
      setError('La contraseña debe tener al menos 8 caracteres.')
      return
    }
    if (!/[A-Z]/.test(newPassword)) {
      setError('La contraseña debe contener al menos una mayúscula.')
      return
    }
    if (!/[a-z]/.test(newPassword)) {
      setError('La contraseña debe contener al menos una minúscula.')
      return
    }
    if (!/[0-9]/.test(newPassword)) {
      setError('La contraseña debe contener al menos un número.')
      return
    }
    setLoading(true)
    try {
      await changePassword({ current_password: currentPassword, new_password: newPassword, new_password_confirm: newPasswordConfirm })
      setSuccess(true)
      setCurrentPassword(''); setNewPassword(''); setNewPasswordConfirm('')
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error al cambiar contraseña')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="max-w-md mx-auto mt-8">
      <h1 className="text-2xl font-bold text-zinc-100 mb-6">Cambiar Contraseña</h1>

      <form onSubmit={handleSubmit} className="bg-zinc-900 border border-zinc-800 rounded-xl p-6 space-y-4">
        {success && (
          <div className="bg-green-500/10 border border-green-500/20 text-green-400 text-sm rounded-lg px-4 py-3">
            Contraseña actualizada correctamente.
          </div>
        )}
        {error && (
          <div className="bg-red-500/10 border border-red-500/20 text-red-400 text-sm rounded-lg px-4 py-3">
            {error}
          </div>
        )}

        <div className="space-y-2">
          <Label className="text-zinc-300">Contraseña Actual</Label>
          <Input type="password" value={currentPassword} onChange={(e) => setCurrentPassword(e.target.value)} required
            className="bg-zinc-800 border-zinc-700 text-zinc-100" />
        </div>
        <div className="space-y-2">
          <Label className="text-zinc-300">Nueva Contraseña</Label>
          <Input type="password" value={newPassword} onChange={(e) => setNewPassword(e.target.value)} required minLength={8}
            className="bg-zinc-800 border-zinc-700 text-zinc-100" />
        </div>
        <div className="space-y-2">
          <Label className="text-zinc-300">Confirmar Nueva Contraseña</Label>
          <Input type="password" value={newPasswordConfirm} onChange={(e) => setNewPasswordConfirm(e.target.value)} required minLength={8}
            className="bg-zinc-800 border-zinc-700 text-zinc-100" />
        </div>

        <Button type="submit" disabled={loading} className="w-full bg-orange-500 hover:bg-orange-600 text-white">
          <Lock className="h-4 w-4 mr-2" />
          {loading ? 'Cambiando...' : 'Cambiar Contraseña'}
        </Button>
      </form>
    </div>
  )
}
