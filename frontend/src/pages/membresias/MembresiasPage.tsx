import { useState, useEffect } from 'react'
import { Plus, RefreshCw } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { api } from '@/lib/api'
import { formatDate, formatCurrency, formatDateTime } from '@/lib/utils'
import { SociosTable } from '@/components/shared/SociosTable'
import { toast } from 'sonner'

const TIPOS = [
  { id: 1, nombre: 'Mensual', dias: 30, precio: 79.90 },
  { id: 2, nombre: 'Trimestral', dias: 90, precio: 199.90 },
  { id: 3, nombre: 'Semestral', dias: 180, precio: 349.90 },
]

export default function MembresiasPage() {
  const [tab, setTab] = useState('gestionar')
  const [socio, setSocio] = useState<any>(null)
  const [tipoId, setTipoId] = useState('1')
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  const [membresiaInfo, setMembresiaInfo] = useState<any>(null)
  const [loading, setLoading] = useState(false)

  const [vencidas, setVencidas] = useState<any[]>([])
  const [proximas, setProximas] = useState<any[]>([])
  const [showVencidas, setShowVencidas] = useState(false)
  const [showProximas, setShowProximas] = useState(false)

  const [historialGlobal, setHistorialGlobal] = useState<any>(null)
  const [historialLoading, setHistorialLoading] = useState(false)
  const [historialSocio, setHistorialSocio] = useState<any>(null)

  const tipo = TIPOS.find(t => t.id === parseInt(tipoId))!

  useEffect(() => { loadHistorialGlobal() }, [])

  async function loadHistorialGlobal() {
    setHistorialLoading(true)
    try {
      const data = await api<any>('/pagos/historial/?limit=30')
      setHistorialGlobal(data)
    } catch { setHistorialGlobal(null) }
    finally { setHistorialLoading(false) }
  }

  function handleSelectSocio(s: any) {
    setSocio(s); setError(''); setSuccess(''); setMembresiaInfo(null)
  }

  function handleBuscarHistorial(s: any) {
    setSocio(s)
    buscarHistorialSocio(s.dni)
  }

  async function buscarHistorialSocio(dni: string) {
    try {
      const data = await api<any>(`/pagos/historial/?dni=${dni}`)
      setHistorialSocio(data)
    } catch { setHistorialSocio(null) }
  }

  async function handleRegistrar() {
    if (!socio) { setError('Selecciona un socio.'); return }
    setError(''); setSuccess(''); setLoading(true)
    try {
      const data = await api<any>('/membresias/registrar/', {
        method: 'POST',
        body: JSON.stringify({ socio_dni: socio.dni, tipo_membresia_id: tipo.id }),
      })
      setSuccess(data.mensaje); setMembresiaInfo(data.membresia)
      toast.success(data.mensaje)
    } catch (err) { setError(err instanceof Error ? err.message : 'Error') }
    finally { setLoading(false) }
  }

  async function handleRenovar() {
    if (!socio) { setError('Selecciona un socio.'); return }
    setError(''); setSuccess(''); setLoading(true)
    try {
      const data = await api<any>('/membresias/renovar/', {
        method: 'POST',
        body: JSON.stringify({ socio_dni: socio.dni, tipo_membresia_id: tipo.id }),
      })
      setSuccess(data.mensaje); setMembresiaInfo(data.membresia)
      toast.success(data.mensaje)
    } catch (err) { setError(err instanceof Error ? err.message : 'Error') }
    finally { setLoading(false) }
  }

  async function loadVencidas() {
    try {
      const data = await api<any>('/membresias/vencidas/')
      setVencidas(data.membresias); setShowVencidas(true)
    } catch {}
  }
  async function loadProximas() {
    try {
      const data = await api<any>('/membresias/proximas/')
      setProximas(data.membresias); setShowProximas(true)
    } catch {}
  }

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-zinc-100">Gestión de Membresías</h1>

      <Tabs value={tab} onValueChange={(v) => v && setTab(v)} className="space-y-4">
        <TabsList className="bg-zinc-900 border border-zinc-800">
          <TabsTrigger value="gestionar" className="text-zinc-400 data-[state=active]:text-orange-400 data-[state=active]:bg-zinc-800">Registrar / Renovar</TabsTrigger>
          <TabsTrigger value="historial" className="text-zinc-400 data-[state=active]:text-orange-400 data-[state=active]:bg-zinc-800">Historial de Pagos</TabsTrigger>
          <TabsTrigger value="alertas" className="text-zinc-400 data-[state=active]:text-orange-400 data-[state=active]:bg-zinc-800">Alertas</TabsTrigger>
        </TabsList>

        <TabsContent value="gestionar" className="space-y-4">
          <Card className="bg-zinc-900 border-zinc-800 overflow-visible">
            <CardHeader><CardTitle className="text-zinc-200">Todos los Socios — selecciona uno para gestionar</CardTitle></CardHeader>
            <CardContent>
              <SociosTable
                actions={[{ label: 'Gestionar', color: 'bg-orange-500 hover:bg-orange-600 text-white', onClick: handleSelectSocio }]}
                selectedDni={socio?.dni}
              />
            </CardContent>
          </Card>

          {socio && (
            <Card className="bg-zinc-900 border-zinc-800">
              <CardContent className="pt-6 space-y-4">
                <div className="flex items-center justify-between bg-zinc-800/50 rounded-lg p-4">
                  <div>
                    <p className="font-medium text-zinc-100">{socio.nombres} {socio.apellidos}</p>
                    <p className="text-sm text-zinc-400">DNI: {socio.dni}</p>
                  </div>
                  <button onClick={() => setSocio(null)} className="text-xs text-zinc-400 hover:text-zinc-200">Cambiar</button>
                </div>

                {error && <div className="bg-red-500/10 border border-red-500/20 text-red-400 text-sm rounded-lg px-4 py-3">{error}</div>}
                {success && <div className="bg-green-500/10 border border-green-500/20 text-green-400 text-sm rounded-lg px-4 py-3">{success}</div>}

                <div className="space-y-3">
                  <Label className="text-zinc-300">Tipo de Membresía</Label>
                  <div className="grid grid-cols-3 gap-3">
                    {TIPOS.map(t => (
                      <button key={t.id} type="button" onClick={() => setTipoId(t.id.toString())}
                        className={`p-4 rounded-lg border-2 text-left transition-all ${
                          tipoId === t.id.toString() ? 'border-orange-500 bg-orange-500/10' : 'border-zinc-700 bg-zinc-800/50 hover:border-zinc-600'
                        }`}>
                        <p className="font-semibold text-zinc-100">{t.nombre}</p>
                        <p className="text-xs text-zinc-400 mt-1">{t.dias} días</p>
                        <p className="text-lg font-bold text-orange-400 mt-2">S/ {t.precio.toFixed(2)}</p>
                      </button>
                    ))}
                  </div>
                </div>

                <div className="flex gap-3 pt-2">
                  <Button onClick={handleRegistrar} disabled={loading} className="bg-orange-500 hover:bg-orange-600 text-white flex-1 h-11">
                    <Plus className="h-4 w-4 mr-2" /> Registrar Nueva
                  </Button>
                  <Button onClick={handleRenovar} disabled={loading} variant="outline" className="border-zinc-700 text-zinc-300 hover:bg-zinc-800 flex-1 h-11">
                    <RefreshCw className="h-4 w-4 mr-2" /> Renovar
                  </Button>
                </div>

                {membresiaInfo && (
                  <div className="bg-green-500/10 border border-green-500/20 rounded-lg p-4">
                    <p className="text-sm text-green-400"><strong>{membresiaInfo.tipo}</strong> — Inicio: {membresiaInfo.fecha_inicio} — Vence: {membresiaInfo.fecha_vencimiento}</p>
                    <p className="text-sm text-green-400">Monto: S/ {membresiaInfo.monto}</p>
                  </div>
                )}
              </CardContent>
            </Card>
          )}
        </TabsContent>

        <TabsContent value="historial" className="space-y-4">
          <Card className="bg-zinc-900 border-zinc-800 overflow-visible">
            <CardHeader><CardTitle className="text-zinc-200">Selecciona un socio para ver su historial</CardTitle></CardHeader>
            <CardContent>
              <SociosTable
                actions={[{ label: 'Ver pagos', color: 'bg-orange-500 hover:bg-orange-600 text-white', onClick: handleBuscarHistorial }]}
                selectedDni={socio?.dni}
                autoLoad={false}
              />
            </CardContent>
          </Card>

          {historialSocio && historialSocio.historial && (
            <Card className="bg-zinc-900 border-zinc-800">
              <CardHeader className="flex flex-row items-center justify-between">
                <CardTitle className="text-zinc-200">
                  Historial de {historialSocio.historial[0]?.socio_nombres} {historialSocio.historial[0]?.socio_apellidos} ({historialSocio.historial.length} pagos)
                </CardTitle>
                {historialSocio.monto_total > 0 && (
                  <Badge variant="outline" className="border-orange-500/30 text-orange-400 text-base px-3 py-1">
                    Total: {formatCurrency(historialSocio.monto_total)}
                  </Badge>
                )}
              </CardHeader>
              <CardContent className="p-0">
                <Table>
                  <TableHeader>
                    <TableRow className="border-zinc-800">
                      <TableHead className="text-zinc-400">Fecha</TableHead>
                      <TableHead className="text-zinc-400">Monto</TableHead>
                      <TableHead className="text-zinc-400">Tipo</TableHead>
                      <TableHead className="text-zinc-400">Método</TableHead>
                      <TableHead className="text-zinc-400">Comprobante</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {historialSocio.historial.length === 0 ? (
                      <TableRow><TableCell colSpan={5} className="text-center text-zinc-500 py-8">Sin pagos.</TableCell></TableRow>
                    ) : historialSocio.historial.map((p: any) => (
                      <TableRow key={p.id} className="border-zinc-800">
                        <TableCell className="text-zinc-300">{formatDate(p.fecha)}</TableCell>
                        <TableCell className="text-zinc-200 font-medium">S/ {p.monto.toFixed(2)}</TableCell>
                        <TableCell className="text-zinc-300">{p.tipo_membresia}</TableCell>
                        <TableCell><Badge variant="outline" className="border-zinc-600 text-zinc-300">{p.metodo}</Badge></TableCell>
                        <TableCell className="text-zinc-400 text-sm">{p.comprobante}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          )}

          <Card className="bg-zinc-900 border-zinc-800">
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle className="text-zinc-200">Todos los Pagos Recientes</CardTitle>
              <Button onClick={loadHistorialGlobal} disabled={historialLoading} className="bg-orange-500 hover:bg-orange-600 text-white text-xs">
                Actualizar
              </Button>
            </CardHeader>
            <CardContent className="p-0">
              {historialLoading ? (
                <div className="py-8 text-center text-zinc-500">Cargando...</div>
              ) : !historialGlobal || historialGlobal.historial?.length === 0 ? (
                <div className="py-8 text-center text-zinc-500">No hay pagos registrados.</div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow className="border-zinc-800">
                      <TableHead className="text-zinc-400">Socio</TableHead>
                      <TableHead className="text-zinc-400">Fecha</TableHead>
                      <TableHead className="text-zinc-400">Monto</TableHead>
                      <TableHead className="text-zinc-400">Método</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {historialGlobal.historial.map((p: any) => (
                      <TableRow key={p.id} className="border-zinc-800">
                        <TableCell className="text-zinc-300">{p.socio_nombres} {p.socio_apellidos}</TableCell>
                        <TableCell className="text-zinc-300">{formatDateTime(p.fecha)}</TableCell>
                        <TableCell className="text-zinc-200 font-medium">{formatCurrency(p.monto)}</TableCell>
                        <TableCell><Badge variant="outline" className="border-zinc-600 text-zinc-300">{p.metodo}</Badge></TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="alertas" className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <button onClick={loadVencidas}
              className="bg-zinc-900 border-2 border-red-500/30 hover:border-red-500 hover:bg-red-500/5 transition-all rounded-xl p-6 text-left group">
              <div className="flex items-start justify-between">
                <div>
                  <p className="text-sm text-zinc-400 mb-1">Membresías</p>
                  <p className="text-2xl font-bold text-red-400">Vencidas</p>
                </div>
                <div className="h-10 w-10 rounded-lg bg-red-500/10 flex items-center justify-center group-hover:bg-red-500/20">
                  <span className="text-red-400 text-lg">✕</span>
                </div>
              </div>
            </button>
            <button onClick={loadProximas}
              className="bg-zinc-900 border-2 border-yellow-500/30 hover:border-yellow-500 hover:bg-yellow-500/5 transition-all rounded-xl p-6 text-left group">
              <div className="flex items-start justify-between">
                <div>
                  <p className="text-sm text-zinc-400 mb-1">Próximas a</p>
                  <p className="text-2xl font-bold text-yellow-400">Vencer (7d)</p>
                </div>
                <div className="h-10 w-10 rounded-lg bg-yellow-500/10 flex items-center justify-center group-hover:bg-yellow-500/20">
                  <span className="text-yellow-400 text-lg">↓</span>
                </div>
              </div>
            </button>
          </div>

          {showVencidas && (
            <Card className="bg-zinc-900 border-red-500/30">
              <CardHeader><CardTitle className="text-zinc-200">Membresías Vencidas ({vencidas.length})</CardTitle></CardHeader>
              <CardContent className="p-0">
                <Table>
                  <TableHeader>
                    <TableRow className="border-zinc-800">
                      <TableHead className="text-zinc-400">DNI</TableHead>
                      <TableHead className="text-zinc-400">Socio</TableHead>
                      <TableHead className="text-zinc-400">Tipo</TableHead>
                      <TableHead className="text-zinc-400">Vencimiento</TableHead>
                      <TableHead className="text-zinc-400">Días</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {vencidas.length === 0 ? (
                      <TableRow><TableCell colSpan={5} className="text-center text-zinc-500 py-8">No hay vencidas.</TableCell></TableRow>
                    ) : vencidas.map((m, i) => (
                      <TableRow key={i} className="border-zinc-800">
                        <TableCell className="text-zinc-200">{m.socio_dni}</TableCell>
                        <TableCell className="text-zinc-300">{m.nombres} {m.apellidos}</TableCell>
                        <TableCell className="text-zinc-300">{m.tipo}</TableCell>
                        <TableCell className="text-zinc-300">{formatDate(m.fecha_vencimiento)}</TableCell>
                        <TableCell><Badge variant="outline" className="border-red-500/30 text-red-400">{m.dias_retraso}d</Badge></TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          )}

          {showProximas && (
            <Card className="bg-zinc-900 border-yellow-500/30">
              <CardHeader><CardTitle className="text-zinc-200">Próximas a Vencer ({proximas.length})</CardTitle></CardHeader>
              <CardContent className="p-0">
                <Table>
                  <TableHeader>
                    <TableRow className="border-zinc-800">
                      <TableHead className="text-zinc-400">DNI</TableHead>
                      <TableHead className="text-zinc-400">Socio</TableHead>
                      <TableHead className="text-zinc-400">Tipo</TableHead>
                      <TableHead className="text-zinc-400">Vence</TableHead>
                      <TableHead className="text-zinc-400">Días</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {proximas.length === 0 ? (
                      <TableRow><TableCell colSpan={5} className="text-center text-zinc-500 py-8">No hay próximas a vencer.</TableCell></TableRow>
                    ) : proximas.map((m, i) => (
                      <TableRow key={i} className="border-zinc-800">
                        <TableCell className="text-zinc-200">{m.socio_dni}</TableCell>
                        <TableCell className="text-zinc-300">{m.nombres} {m.apellidos}</TableCell>
                        <TableCell className="text-zinc-300">{m.tipo}</TableCell>
                        <TableCell className="text-zinc-300">{formatDate(m.fecha_vencimiento)}</TableCell>
                        <TableCell><Badge variant="outline" className="border-yellow-500/30 text-yellow-400">{m.dias_restantes}d</Badge></TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          )}
        </TabsContent>
      </Tabs>
    </div>
  )
}
