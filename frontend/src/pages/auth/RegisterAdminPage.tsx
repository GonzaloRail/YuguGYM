import { useState } from 'react'
import { useAuth } from '@/lib/auth'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { UserPlus } from 'lucide-react'

export default function RegisterAdminPage() {
  const { register } = useAuth()
  const [form, setForm] = useState({
    usuario: '', nombres: '', apellidos: '', correo: '', password: '', password_confirm: '',
  })
  const [error, setError] = useState('')
  const [success, setSuccess] = useState(false)
  const [loading, setLoading] = useState(false)

  function handleChange(e: React.ChangeEvent<HTMLInputElement>) {
    setForm({ ...form, [e.target.name]: e.target.value })
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError('')
    setSuccess(false)

    if (form.usuario.length < 3) {
      setError('El usuario debe tener al menos 3 caracteres.')
      return
    }
    if (form.password !== form.password_confirm) {
      setError('Las contraseñas no coinciden.')
      return
    }
    if (form.password.length < 8) {
      setError('La contraseña debe tener al menos 8 caracteres.')
      return
    }
    if (!/[A-Z]/.test(form.password)) {
      setError('La contraseña debe contener al menos una mayúscula.')
      return
    }
    if (!/[a-z]/.test(form.password)) {
      setError('La contraseña debe contener al menos una minúscula.')
      return
    }
    if (!/[0-9]/.test(form.password)) {
      setError('La contraseña debe contener al menos un número.')
      return
    }

    setLoading(true)
    try {
      await register(form)
      setSuccess(true)
      setForm({ usuario: '', nombres: '', apellidos: '', correo: '', password: '', password_confirm: '' })
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error al registrar administrador')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="max-w-lg mx-auto mt-8">
      <h1 className="text-2xl font-bold text-zinc-100 mb-6">Registrar Administrador</h1>
      <form onSubmit={handleSubmit} className="bg-zinc-900 border border-zinc-800 rounded-xl p-6 space-y-4">
        {success && <div className="bg-green-500/10 border border-green-500/20 text-green-400 text-sm rounded-lg px-4 py-3">Administrador registrado correctamente.</div>}
        {error && <div className="bg-red-500/10 border border-red-500/20 text-red-400 text-sm rounded-lg px-4 py-3">{error}</div>}

        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label className="text-zinc-300">Usuario</Label>
            <Input name="usuario" value={form.usuario} onChange={handleChange} required maxLength={20} minLength={3} className="bg-zinc-800 border-zinc-700 text-zinc-100" />
          </div>
          <div className="space-y-2">
            <Label className="text-zinc-300">Correo</Label>
            <Input name="correo" type="email" value={form.correo} onChange={handleChange} required maxLength={100} className="bg-zinc-800 border-zinc-700 text-zinc-100" />
          </div>
        </div>
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label className="text-zinc-300">Nombres</Label>
            <Input name="nombres" value={form.nombres} onChange={handleChange} required maxLength={80} className="bg-zinc-800 border-zinc-700 text-zinc-100" />
          </div>
          <div className="space-y-2">
            <Label className="text-zinc-300">Apellidos</Label>
            <Input name="apellidos" value={form.apellidos} onChange={handleChange} required maxLength={80} className="bg-zinc-800 border-zinc-700 text-zinc-100" />
          </div>
        </div>
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label className="text-zinc-300">Contraseña</Label>
            <Input name="password" type="password" value={form.password} onChange={handleChange} required minLength={8} className="bg-zinc-800 border-zinc-700 text-zinc-100" />
          </div>
          <div className="space-y-2">
            <Label className="text-zinc-300">Confirmar</Label>
            <Input name="password_confirm" type="password" value={form.password_confirm} onChange={handleChange} required minLength={8} className="bg-zinc-800 border-zinc-700 text-zinc-100" />
          </div>
        </div>

        <Button type="submit" disabled={loading} className="w-full bg-orange-500 hover:bg-orange-600 text-white">
          <UserPlus className="h-4 w-4 mr-2" />
          {loading ? 'Registrando...' : 'Registrar Administrador'}
        </Button>
      </form>
    </div>
  )
}
