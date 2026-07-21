import { useState } from 'react'
import { Link } from 'react-router-dom'
import { api } from '@/lib/api'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Dumbbell, Mail } from 'lucide-react'

export default function ForgotPasswordPage() {
  const [correo, setCorreo] = useState('')
  const [mensaje, setMensaje] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError('')
    setMensaje('')
    setLoading(true)
    try {
      const data = await api<{ mensaje: string }>('/auth/forgot-password/', {
        method: 'POST',
        body: JSON.stringify({ correo }),
      })
      setMensaje(data.mensaje)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error al enviar solicitud')
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
          <h1 className="text-2xl font-bold text-zinc-100">Recuperar Contraseña</h1>
        </div>

        <form onSubmit={handleSubmit} className="bg-zinc-900 border border-zinc-800 rounded-xl p-6 space-y-4">
          {mensaje && (
            <div className="bg-green-500/10 border border-green-500/20 text-green-400 text-sm rounded-lg px-4 py-3">
              {mensaje}
            </div>
          )}

          {error && (
            <div className="bg-red-500/10 border border-red-500/20 text-red-400 text-sm rounded-lg px-4 py-3">
              {error}
            </div>
          )}

          <div className="space-y-2">
            <Label htmlFor="correo" className="text-zinc-300">Correo Electrónico Registrado</Label>
            <Input
              id="correo"
              type="email"
              placeholder="admin@yugugym.com"
              value={correo}
              onChange={(e) => setCorreo(e.target.value)}
              required maxLength={100}
              className="bg-zinc-800 border-zinc-700 text-zinc-100"
            />
          </div>

          <Button type="submit" disabled={loading} className="w-full bg-orange-500 hover:bg-orange-600 text-white">
            <Mail className="h-4 w-4 mr-2" />
            {loading ? 'Enviando...' : 'Enviar Enlace'}
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
