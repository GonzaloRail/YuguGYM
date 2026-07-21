import { useState, useEffect } from 'react'
import { ClipboardCheck, UserCheck, XCircle } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { api } from '@/lib/api'
import { SociosTable } from '@/components/shared/SociosTable'
import { formatDate } from '@/lib/utils'
import { toast } from 'sonner'

export default function AsistenciasPage() {
  const [tab, setTab] = useState('registrar')
  const [socio, setSocio] = useState<any>(null)
  const [verificacion, setVerificacion] = useState<any>(null)
  const [ingresoInfo, setIngresoInfo] = useState<any>(null)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  const [loading, setLoading] = useState(false)
  const [socioHistorial, setSocioHistorial] = useState<any>(null)

  const [historialGlobal, setHistorialGlobal] = useState<any>(null)
  const [historialLoading, setHistorialLoading] = useState(false)
  const [historialSocio, setHistorialSocio] = useState<any>(null)

  useEffect(() => { loadHistorialGlobal() }, [])

  async function loadHistorialGlobal() {
    setHistorialLoading(true)
    try {
      const data = await api<any>('/asistencias/historial/')
      setHistorialGlobal(data)
    } catch { setHistorialGlobal(null) }
    finally { setHistorialLoading(false) }
  }

  async function handleSelectSocio(s: any) {
    setSocio(s); setError(''); setSuccess(''); setIngresoInfo(null); setVerificacion(null)
    try {
      const resp = await api<any>(`/socios/${s.id}/verificar_membresia/`)
      setVerificacion(resp)
      const histData = await api<any>(`/asistencias/historial/?dni=${s.dni}`)
      setSocioHistorial(histData)
    } catch (err: any) {
      console.error('Error al verificar:', err.message || err)
      setError(err instanceof Error ? err.message : 'Error al verificar membresía.')
    }
  }

  function handleBuscarHistorial(s: any) {
    setSocio(s)
    buscarHistorialSocio(s.dni)
    setTab('historial')
  }

  async function buscarHistorialSocio(dni: string) {
    try {
      const data = await api<any>(`/asistencias/historial/?dni=${dni}`)
      setHistorialSocio(data)
    } catch { setHistorialSocio(null) }
  }

  async function handleRegistrar() {
    if (!socio) { setError('Selecciona un socio.'); return }
    setError(''); setLoading(true)
    try {
      const data = await api<any>('/asistencias/registrar/', {
        method: 'POST', body: JSON.stringify({ socio_dni: socio.dni }),
      })
      setSuccess(data.mensaje); setIngresoInfo(data.asistencia)
      toast.success(data.mensaje)
      loadHistorialGlobal()
      const h = await api<any>(`/asistencias/historial/?dni=${socio.dni}`)
      setSocioHistorial(h)
    } catch (err) { setError(err instanceof Error ? err.message : 'Error') }
    finally { setLoading(false) }
  }

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-zinc-100">Control de Asistencia</h1>

      <Tabs value={tab} onValueChange={(v) => v && setTab(v)}>
        <TabsList className="bg-zinc-900 border border-zinc-800">
          <TabsTrigger value="registrar" className="text-zinc-400 data-[state=active]:text-orange-400 data-[state=active]:bg-zinc-800">Registrar Ingreso</TabsTrigger>
          <TabsTrigger value="historial" className="text-zinc-400 data-[state=active]:text-orange-400 data-[state=active]:bg-zinc-800">Historial General</TabsTrigger>
        </TabsList>

        <TabsContent value="registrar" className="space-y-4">
          <Card className="bg-zinc-900 border-zinc-800 overflow-visible">
            <CardHeader><CardTitle className="text-zinc-200">Selecciona un socio para registrar ingreso</CardTitle></CardHeader>
            <CardContent>
              <SociosTable
                actions={[{ label: 'Registrar', color: 'bg-orange-500 hover:bg-orange-600 text-white', onClick: handleSelectSocio }]}
                selectedDni={socio?.dni}
              />
            </CardContent>
          </Card>

          {socio && (
            <Card className="bg-zinc-900 border-zinc-800">
              <CardContent className="pt-6 space-y-4">
                {error && <div className="bg-red-500/10 border border-red-500/20 text-red-400 text-sm rounded-lg px-4 py-3">{error}</div>}
                {success && <div className="bg-green-500/10 border border-green-500/20 text-green-400 text-sm rounded-lg px-4 py-3">{success}</div>}

                <div className="flex items-center justify-between bg-zinc-800/50 rounded-lg p-4">
                  <div className="flex items-center gap-3">
                    <div className="h-12 w-12 rounded-full bg-orange-500 flex items-center justify-center">
                      <UserCheck className="h-6 w-6 text-white" />
                    </div>
                    <div>
                      <p className="font-medium text-zinc-100">{socio.nombres} {socio.apellidos}</p>
                      <p className="text-sm text-zinc-400">DNI: {socio.dni}</p>
                    </div>
                  </div>
                  <button onClick={() => setSocio(null)} className="text-xs text-zinc-400 hover:text-zinc-200">Cambiar</button>
                </div>

                {verificacion && (
                  <div className={`rounded-lg p-4 ${verificacion.vigente ? 'bg-green-500/10 border border-green-500/20' : 'bg-red-500/10 border border-red-500/20'}`}>
                    <div className="flex items-center gap-3">
                      {verificacion.vigente ? <UserCheck className="h-6 w-6 text-green-400" /> : <XCircle className="h-6 w-6 text-red-400" />}
                      <div>
                        <p className={`font-medium ${verificacion.vigente ? 'text-green-400' : 'text-red-400'}`}>
                          {verificacion.vigente ? 'Membresía Vigente' : 'Membresía Vencida'}
                        </p>
                        <p className="text-sm text-zinc-300">{verificacion.mensaje}</p>
                        {verificacion.vigente && (
                          <p className="text-xs text-zinc-400 mt-1">Vence: {formatDate(verificacion.fecha_vencimiento)} ({verificacion.dias_restantes} días)</p>
                        )}
                      </div>
                    </div>
                  </div>
                )}

                {verificacion?.vigente && (
                  <Button onClick={handleRegistrar} disabled={loading}
                    className="w-full h-12 bg-orange-500 hover:bg-orange-600 text-white text-base">
                    <ClipboardCheck className="h-5 w-5 mr-2" />
                    {loading ? 'Registrando...' : 'Registrar Ingreso'}
                  </Button>
                )}

                {ingresoInfo && (
                  <div className="bg-green-500/10 border border-green-500/20 rounded-lg p-4 text-center">
                    <p className="text-green-400 font-medium">✓ Ingreso Registrado</p>
                    <p className="text-sm text-zinc-300 mt-1">{formatDate(ingresoInfo.fecha)} — {ingresoInfo.hora}</p>
                  </div>
                )}

                {socioHistorial && socioHistorial.historial && (
                  <div>
                    <h3 className="text-sm font-medium text-zinc-300 mb-2">Historial de {socio.nombres}</h3>
                    <div className="bg-zinc-800/30 rounded-lg max-h-64 overflow-auto">
                      <Table>
                        <TableHeader>
                          <TableRow className="border-zinc-700">
                            <TableHead className="text-zinc-400">Fecha</TableHead>
                            <TableHead className="text-zinc-400">Hora</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {socioHistorial.historial.length === 0 ? (
                            <TableRow><TableCell colSpan={2} className="text-center text-zinc-500 py-4">Sin asistencias.</TableCell></TableRow>
                          ) : socioHistorial.historial.map((a: any) => (
                            <TableRow key={a.id} className="border-zinc-700">
                              <TableCell className="text-zinc-300">{formatDate(a.fecha)}</TableCell>
                              <TableCell className="text-zinc-300">{a.hora}</TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          )}
        </TabsContent>

        <TabsContent value="historial" className="space-y-4">
          <Card className="bg-zinc-900 border-zinc-800 overflow-visible">
            <CardHeader className="flex flex-row items-center justify-between">
              <div>
                <CardTitle className="text-zinc-200">
                  {socio ? `Historial de ${socio.nombres} ${socio.apellidos}` : 'Todas las Asistencias'}
                </CardTitle>
                <p className="text-xs text-zinc-500 mt-1">
                  Filtra por socio o deja vacío para ver todos
                </p>
              </div>
              <div className="flex gap-2">
                {socio && (
                  <Button onClick={() => { setSocio(null); setHistorialSocio(null); }} variant="outline" className="border-zinc-700 text-zinc-300 hover:bg-zinc-800 text-xs">
                    Ver todos
                  </Button>
                )}
                <Button onClick={() => { loadHistorialGlobal(); setHistorialSocio(null); setSocio(null); }} disabled={historialLoading} className="bg-orange-500 hover:bg-orange-600 text-white text-xs">
                  Actualizar
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              <SociosTable
                actions={[{ label: 'Ver', color: 'bg-orange-500 hover:bg-orange-600 text-white', onClick: handleBuscarHistorial }]}
                selectedDni={socio?.dni}
                autoLoad={false}
              />

              <div className="mt-4 bg-zinc-800/30 rounded-lg max-h-[60vh] overflow-y-auto">
                <div className="grid grid-cols-12 gap-2 px-4 py-2 text-xs text-zinc-400 border-b border-zinc-700 sticky top-0 bg-zinc-800/80 backdrop-blur">
                  <span className="col-span-5">Socio</span>
                  <span className="col-span-3">DNI</span>
                  <span className="col-span-2">Fecha</span>
                  <span className="col-span-2">Hora</span>
                </div>

                {historialLoading ? (
                  <div className="p-6 text-center text-zinc-500 text-sm">Cargando...</div>
                ) : socio && historialSocio ? (
                  historialSocio.historial?.length > 0 ? (
                    historialSocio.historial.map((a: any) => (
                      <div key={a.id} className="grid grid-cols-12 gap-2 px-4 py-2.5 border-b border-zinc-700/30 last:border-0 text-sm">
                        <span className="col-span-5 text-zinc-200 truncate">{a.socio_nombres} {a.socio_apellidos}</span>
                        <span className="col-span-3 text-zinc-300">{a.socio_dni}</span>
                        <span className="col-span-2 text-zinc-300">{formatDate(a.fecha)}</span>
                        <span className="col-span-2 text-zinc-400 text-xs">{a.hora}</span>
                      </div>
                    ))
                  ) : (
                    <div className="p-6 text-center text-zinc-500 text-sm">Sin asistencias registradas.</div>
                  )
                ) : historialGlobal ? (
                  historialGlobal.historial?.length > 0 ? (
                    historialGlobal.historial.slice(0, 100).map((a: any) => (
                      <div key={a.id} className="grid grid-cols-12 gap-2 px-4 py-2.5 border-b border-zinc-700/30 last:border-0 text-sm hover:bg-zinc-700/20">
                        <span className="col-span-5 text-zinc-200 truncate">{a.socio_nombres} {a.socio_apellidos}</span>
                        <span className="col-span-3 text-zinc-300">{a.socio_dni}</span>
                        <span className="col-span-2 text-zinc-300">{formatDate(a.fecha)}</span>
                        <span className="col-span-2 text-zinc-400 text-xs">{a.hora}</span>
                      </div>
                    ))
                  ) : (
                    <div className="p-6 text-center text-zinc-500 text-sm">No hay asistencias registradas.</div>
                  )
                ) : null}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}
