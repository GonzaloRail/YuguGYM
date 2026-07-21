import { useState, useEffect } from 'react'
import { Users, AlertTriangle, DollarSign, Calendar, UserCheck, Clock, ArrowUpRight } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Skeleton } from '@/components/ui/skeleton'
import { useAuth } from '@/lib/auth'
import { api } from '@/lib/api'
import { formatCurrency, formatDate, formatDateTime } from '@/lib/utils'

export default function DashboardPage() {
  const { user } = useAuth()
  const [data, setData] = useState<any>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    Promise.all([
      api<any>('/reportes/socios-activos/'),
      api<any>('/membresias/vencidas/'),
      api<any>('/membresias/proximas/'),
      api<any>('/pagos/dia/'),
      api<any>('/asistencias/historial/'),
      api<any>('/pagos/historial/?limit=8'),
    ]).then(([activos, vencidas, proximas, pagosDia, asistencias, pagosRecientes]) => {
      setData({ activos, vencidas, proximas, pagosDia, asistencias, pagosRecientes })
    }).finally(() => setLoading(false))
  }, [])

  if (loading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-8 w-48 bg-zinc-800" />
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {[...Array(4)].map((_, i) => (
            <Card key={i} className="bg-zinc-900 border-zinc-800">
              <CardHeader><Skeleton className="h-4 w-24 bg-zinc-800" /></CardHeader>
              <CardContent><Skeleton className="h-8 w-16 bg-zinc-800" /></CardContent>
            </Card>
          ))}
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-bold text-zinc-100">
          Bienvenido, {user?.nombres}
        </h1>
        <p className="text-zinc-400 mt-1 text-sm">
          {new Date().toLocaleDateString('es-PE', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-5 hover:border-orange-500/30 transition-colors group">
          <div className="flex items-center justify-between mb-3">
            <div className="h-10 w-10 rounded-lg bg-green-500/10 flex items-center justify-center">
              <UserCheck className="h-5 w-5 text-green-400" />
            </div>
            <ArrowUpRight className="h-4 w-4 text-zinc-600 group-hover:text-green-400 transition-colors" />
          </div>
          <p className="text-3xl font-bold text-zinc-100">{data?.activos?.total_socios_activos || 0}</p>
          <p className="text-sm text-zinc-400 mt-1">Socios activos con membresía vigente</p>
        </div>

        <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-5 hover:border-yellow-500/30 transition-colors group">
          <div className="flex items-center justify-between mb-3">
            <div className="h-10 w-10 rounded-lg bg-yellow-500/10 flex items-center justify-center">
              <Calendar className="h-5 w-5 text-yellow-400" />
            </div>
            <ArrowUpRight className="h-4 w-4 text-zinc-600 group-hover:text-yellow-400 transition-colors" />
          </div>
          <p className="text-3xl font-bold text-zinc-100">{data?.proximas?.total || 0}</p>
          <p className="text-sm text-zinc-400 mt-1">Membresías por vencer en 7 días</p>
        </div>

        <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-5 hover:border-red-500/30 transition-colors group">
          <div className="flex items-center justify-between mb-3">
            <div className="h-10 w-10 rounded-lg bg-red-500/10 flex items-center justify-center">
              <AlertTriangle className="h-5 w-5 text-red-400" />
            </div>
            <ArrowUpRight className="h-4 w-4 text-zinc-600 group-hover:text-red-400 transition-colors" />
          </div>
          <p className="text-3xl font-bold text-zinc-100">{data?.vencidas?.total || 0}</p>
          <p className="text-sm text-zinc-400 mt-1">Membresías vencidas</p>
        </div>

        <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-5 hover:border-orange-500/30 transition-colors group">
          <div className="flex items-center justify-between mb-3">
            <div className="h-10 w-10 rounded-lg bg-orange-500/10 flex items-center justify-center">
              <DollarSign className="h-5 w-5 text-orange-400" />
            </div>
            <ArrowUpRight className="h-4 w-4 text-zinc-600 group-hover:text-orange-400 transition-colors" />
          </div>
          <p className="text-3xl font-bold text-orange-400">{formatCurrency(data?.pagosDia?.total_general || 0)}</p>
          <p className="text-sm text-zinc-400 mt-1">Ingresos del día • {data?.pagosDia?.cantidad || 0} pagos</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card className="bg-zinc-900 border-zinc-800">
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle className="text-zinc-200">Últimos Ingresos</CardTitle>
            <Badge variant="outline" className="border-zinc-700 text-zinc-400">{data?.asistencias?.historial?.length || 0} hoy</Badge>
          </CardHeader>
          <CardContent>
            {data?.asistencias?.historial?.length > 0 ? (
              <div className="space-y-3">
                {data.asistencias.historial.slice(0, 8).map((a: any) => (
                  <div key={a.id} className="flex items-center gap-3 bg-zinc-800/30 rounded-lg p-3">
                    <div className="h-8 w-8 rounded-full bg-green-500/10 flex items-center justify-center shrink-0">
                      <UserCheck className="h-4 w-4 text-green-400" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm text-zinc-200 truncate">{a.socio_dni} — {a.socio_nombres} {a.socio_apellidos}</p>
                      <p className="text-xs text-zinc-500">{formatDate(a.fecha)} • {a.hora}</p>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-zinc-500 text-sm py-4 text-center">No hay ingresos registrados hoy.</p>
            )}
          </CardContent>
        </Card>

        <Card className="bg-zinc-900 border-zinc-800">
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle className="text-zinc-200">Últimos Pagos</CardTitle>
            <Badge variant="outline" className="border-zinc-700 text-zinc-400">{data?.pagosRecientes?.historial?.length || 0} recientes</Badge>
          </CardHeader>
          <CardContent>
            {data?.pagosRecientes?.historial?.length > 0 ? (
              <div className="space-y-3">
                {data.pagosRecientes.historial.slice(0, 8).map((p: any) => (
                  <div key={p.id} className="flex items-center gap-3 bg-zinc-800/30 rounded-lg p-3">
                    <div className="h-8 w-8 rounded-full bg-orange-500/10 flex items-center justify-center shrink-0">
                      <DollarSign className="h-4 w-4 text-orange-400" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm text-zinc-200 truncate">{p.socio_nombres} {p.socio_apellidos} — S/ {p.monto.toFixed(2)}</p>
                      <p className="text-xs text-zinc-500">{formatDateTime(p.fecha)} • {p.metodo}</p>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-zinc-500 text-sm py-4 text-center">No hay pagos registrados.</p>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
