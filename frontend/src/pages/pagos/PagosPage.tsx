import { useState, useEffect } from 'react'
import { DollarSign, Receipt, Calendar } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Badge } from '@/components/ui/badge'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { api } from '@/lib/api'
import { formatDateTime, formatCurrency } from '@/lib/utils'
import { SociosTable } from '@/components/shared/SociosTable'
import { toast } from 'sonner'

const TIPOS = [
  { id: 1, nombre: 'Mensual', precio: 79.90 },
  { id: 2, nombre: 'Trimestral', precio: 199.90 },
  { id: 3, nombre: 'Semestral', precio: 349.90 },
]

const METODOS = [
  { id: 1, nombre: 'Efectivo' },
  { id: 2, nombre: 'Yape' },
  { id: 3, nombre: 'Transferencia' },
]

export default function PagosPage() {
  const [tab, setTab] = useState('registrar')
  const [socio, setSocio] = useState<any>(null)
  const [tipoId, setTipoId] = useState('1')
  const [metodoId, setMetodoId] = useState('1')
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  const [pagoInfo, setPagoInfo] = useState<any>(null)
  const [loading, setLoading] = useState(false)
  const [socioHistorial, setSocioHistorial] = useState<any>(null)

  const [pagosDia, setPagosDia] = useState<any[]>([])
  const [pagosDiaResumen, setPagosDiaResumen] = useState<any>(null)
  const [loadingDia, setLoadingDia] = useState(false)
  const [comprobante, setComprobante] = useState<any>(null)
  const [showComprobante, setShowComprobante] = useState(false)

  const [historialGlobal, setHistorialGlobal] = useState<any>(null)
  const [historialLoading, setHistorialLoading] = useState(false)
  const [historialSocio, setHistorialSocio] = useState<any>(null)

  useEffect(() => { loadHistorialGlobal() }, [])

  useEffect(() => {
    if (tab === 'dia') loadPagosDia()
  }, [tab])

  async function loadHistorialGlobal() {
    setHistorialLoading(true)
    try {
      const data = await api<any>('/pagos/historial/?limit=30')
      setHistorialGlobal(data)
    } catch { setHistorialGlobal(null) }
    finally { setHistorialLoading(false) }
  }

  function handleSelectSocio(s: any) {
    setSocio(s); setError(''); setSuccess(''); setPagoInfo(null)
    buscarHistorialSocio(s.dni)
  }

  function handleBuscarHistorial(s: any) {
    setSocio(s)
    buscarHistorialSocio(s.dni)
    setTab('historial')
  }

  async function buscarHistorialSocio(dni: string) {
    try {
      const data = await api<any>(`/pagos/historial/?dni=${dni}`)
      setSocioHistorial(data)
    } catch { setSocioHistorial(null) }
  }

  async function handleRegistrar() {
    if (!socio) { setError('Selecciona un socio.'); return }
    setError(''); setSuccess(''); setLoading(true)
    try {
      const data = await api<any>('/pagos/registrar/', {
        method: 'POST',
        body: JSON.stringify({ socio_dni: socio.dni, tipo_membresia_id: tipo.id, metodo_pago_id: parseInt(metodoId) }),
      })
      setSuccess(data.mensaje); setPagoInfo(data.pago)
      toast.success(data.mensaje)
      loadHistorialGlobal()
      buscarHistorialSocio(socio.dni)
    } catch (err) { setError(err instanceof Error ? err.message : 'Error') }
    finally { setLoading(false) }
  }

  async function loadPagosDia() {
    setLoadingDia(true)
    try {
      const data = await api<any>('/pagos/dia/')
      setPagosDia(data.pagos); setPagosDiaResumen(data)
    } catch {}
    finally { setLoadingDia(false) }
  }

  async function loadComprobante(pagoId: number) {
    try {
      const data = await api<any>(`/pagos/comprobante/${pagoId}/`)
      setComprobante(data); setShowComprobante(true)
    } catch {}
  }

  const tipo = TIPOS.find(t => t.id === parseInt(tipoId))!

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-zinc-100">Gestión de Pagos</h1>

      <Tabs value={tab} onValueChange={(v) => v && setTab(v)}>
        <TabsList className="bg-zinc-900 border border-zinc-800">
          <TabsTrigger value="registrar" className="text-zinc-400 data-[state=active]:text-orange-400 data-[state=active]:bg-zinc-800">Registrar Pago</TabsTrigger>
          <TabsTrigger value="historial" className="text-zinc-400 data-[state=active]:text-orange-400 data-[state=active]:bg-zinc-800">Historial</TabsTrigger>
          <TabsTrigger value="dia" className="text-zinc-400 data-[state=active]:text-orange-400 data-[state=active]:bg-zinc-800">Pagos del Día</TabsTrigger>
        </TabsList>

        <TabsContent value="registrar" className="space-y-4">
          <Card className="bg-zinc-900 border-zinc-800 overflow-visible">
            <CardHeader><CardTitle className="text-zinc-200">1. Selecciona un socio para pagar</CardTitle></CardHeader>
            <CardContent>
              <SociosTable
                actions={[{ label: 'Pagar', color: 'bg-orange-500 hover:bg-orange-600 text-white', onClick: handleSelectSocio }]}
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

                <div>
                  <p className="text-sm text-zinc-300 mb-2">2. Tipo de Membresía</p>
                  <div className="grid grid-cols-3 gap-3">
                    {TIPOS.map(t => (
                      <button key={t.id} type="button" onClick={() => setTipoId(t.id.toString())}
                        className={`p-4 rounded-lg border-2 text-left transition-all ${tipoId === t.id.toString() ? 'border-orange-500 bg-orange-500/10' : 'border-zinc-700 bg-zinc-800/50 hover:border-zinc-600'}`}>
                        <p className="font-semibold text-zinc-100">{t.nombre}</p>
                        <p className="text-lg font-bold text-orange-400 mt-2">S/ {t.precio.toFixed(2)}</p>
                      </button>
                    ))}
                  </div>
                </div>

                <div>
                  <p className="text-sm text-zinc-300 mb-2">3. Método de Pago</p>
                  <div className="grid grid-cols-3 gap-3">
                    {METODOS.map(m => (
                      <button key={m.id} type="button" onClick={() => setMetodoId(m.id.toString())}
                        className={`p-3 rounded-lg border-2 transition-all ${metodoId === m.id.toString() ? 'border-orange-500 bg-orange-500/10 text-orange-400' : 'border-zinc-700 bg-zinc-800/50 text-zinc-300 hover:border-zinc-600'}`}>
                        <p className="font-medium">{m.nombre}</p>
                      </button>
                    ))}
                  </div>
                </div>

                <div className="bg-orange-500/10 border border-orange-500/20 rounded-lg p-4 flex items-center justify-between">
                  <span className="text-zinc-300">Total:</span>
                  <span className="text-3xl font-bold text-orange-400">S/ {tipo.precio.toFixed(2)}</span>
                </div>

                <Button onClick={handleRegistrar} disabled={loading} className="w-full h-12 bg-orange-500 hover:bg-orange-600 text-white text-base">
                  <DollarSign className="h-5 w-5 mr-2" /> {loading ? 'Registrando...' : 'Confirmar Pago'}
                </Button>

                {pagoInfo && (
                  <div className="bg-green-500/10 border border-green-500/20 rounded-lg p-4">
                    <p className="text-sm text-green-400">✓ Pago registrado — {pagoInfo.comprobante}</p>
                    <Button onClick={() => loadComprobante(pagoInfo.id)} variant="link" className="text-orange-400 p-0 h-auto mt-2">
                      <Receipt className="h-4 w-4 mr-1" /> Ver Comprobante
                    </Button>
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
                            <TableHead className="text-zinc-400">Monto</TableHead>
                            <TableHead className="text-zinc-400">Método</TableHead>
                            <TableHead className="text-zinc-400">Comp.</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {socioHistorial.historial.length === 0 ? (
                            <TableRow><TableCell colSpan={4} className="text-center text-zinc-500 py-4">Sin pagos.</TableCell></TableRow>
                          ) : socioHistorial.historial.map((p: any) => (
                            <TableRow key={p.id} className="border-zinc-700">
                              <TableCell className="text-zinc-300">{formatDateTime(p.fecha)}</TableCell>
                              <TableCell className="text-zinc-200 font-medium">{formatCurrency(p.monto)}</TableCell>
                              <TableCell className="text-zinc-300">{p.metodo}</TableCell>
                              <TableCell className="text-zinc-400 text-xs">{p.comprobante}</TableCell>
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
            <CardHeader><CardTitle className="text-zinc-200">Selecciona un socio para ver su historial</CardTitle></CardHeader>
            <CardContent>
              <SociosTable
                actions={[{ label: 'Ver pagos', color: 'bg-orange-500 hover:bg-orange-600 text-white', onClick: handleBuscarHistorial }]}
                selectedDni={socio?.dni}
                autoLoad={false}
              />
            </CardContent>
          </Card>

          {socioHistorial && socioHistorial.historial && (
            <Card className="bg-zinc-900 border-zinc-800">
              <CardHeader className="flex flex-row items-center justify-between">
                <CardTitle className="text-zinc-200">Historial ({socioHistorial.historial.length} pagos)</CardTitle>
                <Badge variant="outline" className="border-orange-500/30 text-orange-400 text-base px-3 py-1">
                  Total: {formatCurrency(socioHistorial.monto_total)}
                </Badge>
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
                      <TableHead className="text-zinc-400"></TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {socioHistorial.historial.length === 0 ? (
                      <TableRow><TableCell colSpan={6} className="text-center text-zinc-500 py-8">Sin pagos.</TableCell></TableRow>
                    ) : socioHistorial.historial.map((p: any) => (
                      <TableRow key={p.id} className="border-zinc-800">
                        <TableCell className="text-zinc-300">{formatDateTime(p.fecha)}</TableCell>
                        <TableCell className="text-zinc-200 font-medium">{formatCurrency(p.monto)}</TableCell>
                        <TableCell className="text-zinc-300">{p.tipo_membresia}</TableCell>
                        <TableCell><Badge variant="outline" className="border-zinc-600 text-zinc-300">{p.metodo}</Badge></TableCell>
                        <TableCell className="text-zinc-400 text-sm">{p.comprobante}</TableCell>
                        <TableCell>
                          <Button onClick={() => loadComprobante(p.id)} variant="link" className="text-orange-400 p-0 h-auto">
                            <Receipt className="h-4 w-4" />
                          </Button>
                        </TableCell>
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
              {!historialGlobal || historialGlobal.historial?.length === 0 ? (
                <div className="py-8 text-center text-zinc-500">No hay pagos.</div>
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

        <TabsContent value="dia" className="space-y-4">
          {loadingDia ? (
            <Card className="bg-zinc-900 border-zinc-800">
              <CardContent className="py-8 text-center text-zinc-500">Cargando pagos del día...</CardContent>
            </Card>
          ) : (
            <Card className="bg-zinc-900 border-zinc-800">
              <CardHeader className="flex flex-row items-center justify-between">
                <CardTitle className="text-zinc-200">Pagos del Día</CardTitle>
                <Button onClick={loadPagosDia} className="bg-orange-500 hover:bg-orange-600 text-white text-xs">
                  <Calendar className="h-4 w-4 mr-2" /> Actualizar
                </Button>
              </CardHeader>
              <CardContent className="p-0">
                {pagosDiaResumen && (
                  <div className="grid grid-cols-4 gap-3 p-4 pb-2">
                    <div className="bg-zinc-800 rounded-lg p-3 text-center">
                      <p className="text-2xl font-bold text-zinc-100">{formatCurrency(pagosDiaResumen.total_general)}</p>
                      <p className="text-xs text-zinc-400">Total</p>
                    </div>
                    <div className="bg-zinc-800 rounded-lg p-3 text-center">
                      <p className="text-2xl font-bold text-green-400">{formatCurrency(pagosDiaResumen.desglose?.Efectivo || 0)}</p>
                      <p className="text-xs text-zinc-400">Efectivo</p>
                    </div>
                    <div className="bg-zinc-800 rounded-lg p-3 text-center">
                      <p className="text-2xl font-bold text-blue-400">{formatCurrency(pagosDiaResumen.desglose?.Yape || 0)}</p>
                      <p className="text-xs text-zinc-400">Yape</p>
                    </div>
                    <div className="bg-zinc-800 rounded-lg p-3 text-center">
                      <p className="text-2xl font-bold text-purple-400">{formatCurrency(pagosDiaResumen.desglose?.Transferencia || 0)}</p>
                      <p className="text-xs text-zinc-400">Transferencia</p>
                    </div>
                  </div>
                )}
                <Table>
                  <TableHeader>
                    <TableRow className="border-zinc-800">
                      <TableHead className="text-zinc-400">Socio</TableHead>
                      <TableHead className="text-zinc-400">Monto</TableHead>
                      <TableHead className="text-zinc-400">Método</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {pagosDia.length === 0 ? (
                      <TableRow><TableCell colSpan={3} className="text-center text-zinc-500 py-8">No hay pagos hoy.</TableCell></TableRow>
                    ) : pagosDia.map((p) => (
                      <TableRow key={p.id} className="border-zinc-800">
                        <TableCell className="text-zinc-300">{p.socio_nombres} {p.socio_apellidos}</TableCell>
                        <TableCell className="text-zinc-200 font-medium">{formatCurrency(p.monto)}</TableCell>
                        <TableCell className="text-zinc-300">{p.metodo}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          )}
        </TabsContent>
      </Tabs>

      <Dialog open={showComprobante} onOpenChange={setShowComprobante}>
        <DialogContent className="bg-zinc-900 border-zinc-800 text-zinc-100 max-w-lg">
          <DialogHeader><DialogTitle>Comprobante</DialogTitle></DialogHeader>
          {comprobante && (
            <div className="space-y-3">
              <div className="bg-zinc-800/50 rounded-lg p-4 text-center">
                <p className="text-xl font-bold text-orange-400">YuguGYM</p>
                <p className="text-xs text-zinc-400">N° {comprobante.numero_comprobante}</p>
              </div>
              <div className="grid grid-cols-2 gap-3 text-sm">
                <div><span className="text-zinc-400">Socio:</span><p className="text-zinc-200">{comprobante.socio_nombres} {comprobante.socio_apellidos}</p></div>
                <div><span className="text-zinc-400">DNI:</span><p className="text-zinc-200">{comprobante.socio_dni}</p></div>
                <div><span className="text-zinc-400">Fecha:</span><p className="text-zinc-200">{comprobante.fecha_pago}</p></div>
                <div><span className="text-zinc-400">Monto:</span><p className="text-zinc-200 font-bold">S/ {comprobante.monto}</p></div>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  )
}
