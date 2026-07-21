import { useState } from 'react'
import { BarChart3, RefreshCw, Users, Activity, DollarSign, Download } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { api } from '@/lib/api'
import { formatCurrency, formatDate } from '@/lib/utils'
import {
  PieChart, Pie, Cell, Tooltip, ResponsiveContainer,
  BarChart, Bar, XAxis, YAxis, CartesianGrid,
} from 'recharts'

const METHOD_COLORS: Record<string, string> = {
  Efectivo: '#22c55e',
  Yape: '#3b82f6',
  Transferencia: '#a855f7',
}
const CHART_COLORS = ['#f97316', '#22c55e', '#3b82f6', '#a855f7', '#eab308', '#ef4444', '#06b6d4', '#f59e0b', '#8b5cf6', '#10b981']

export default function ReportesPage() {
  const [tab, setTab] = useState('activos')
  const [activos, setActivos] = useState<any[]>([])
  const [totalActivos, setTotalActivos] = useState(0)
  const [loadingActivos, setLoadingActivos] = useState(false)

  const [periodo, setPeriodo] = useState('diario')
  const [fechaIngresos, setFechaIngresos] = useState(new Date().toISOString().split('T')[0])
  const [ingresos, setIngresos] = useState<any>(null)
  const [loadingIngresos, setLoadingIngresos] = useState(false)

  const [fechaAsistencia, setFechaAsistencia] = useState(new Date().toISOString().split('T')[0])
  const [asistenciaData, setAsistenciaData] = useState<any>(null)
  const [loadingAsistencia, setLoadingAsistencia] = useState(false)

  async function downloadPdf(path: string) {
    const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8099/api'
    const token = localStorage.getItem('accessToken')
    try {
      const res = await fetch(`${API_URL}${path}`, {
        headers: token ? { Authorization: `Bearer ${token}` } : {},
      })
      if (!res.ok) return
      const blob = await res.blob()
      const url = URL.createObjectURL(blob)
      const link = document.createElement('a')
      link.href = url
      link.download = ''
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)
      URL.revokeObjectURL(url)
    } catch {}
  }

  async function loadActivos() {
    setLoadingActivos(true)
    try {
      const data = await api<any>('/reportes/socios-activos/')
      setActivos(data.socios); setTotalActivos(data.total_socios_activos)
    } catch {}
    finally { setLoadingActivos(false) }
  }

  async function loadIngresos() {
    setLoadingIngresos(true)
    try {
      const data = await api<any>(`/reportes/ingresos/?periodo=${periodo}&fecha=${fechaIngresos}`)
      setIngresos(data)
    } catch {}
    finally { setLoadingIngresos(false) }
  }

  async function loadAsistencia() {
    setLoadingAsistencia(true)
    try {
      const data = await api<any>(`/reportes/asistencia/?fecha=${fechaAsistencia}&top_n=10`)
      setAsistenciaData(data)
    } catch {}
    finally { setLoadingAsistencia(false) }
  }

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-zinc-100">Reportes</h1>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <button
          onClick={() => { setTab('activos'); loadActivos() }}
          className="bg-zinc-900 border-2 border-zinc-800 hover:border-green-500 hover:bg-green-500/5 transition-all rounded-xl p-5 text-left group"
        >
          <div className="flex items-center gap-3">
            <div className="h-11 w-11 rounded-lg bg-green-500/10 flex items-center justify-center group-hover:bg-green-500/20">
              <Users className="h-5 w-5 text-green-400" />
            </div>
            <div>
              <p className="font-semibold text-zinc-100">Socios Activos</p>
              <p className="text-xs text-zinc-500">Con membresía vigente</p>
            </div>
          </div>
        </button>

        <button
          onClick={() => { setTab('ingresos'); loadIngresos() }}
          className="bg-zinc-900 border-2 border-zinc-800 hover:border-orange-500 hover:bg-orange-500/5 transition-all rounded-xl p-5 text-left group"
        >
          <div className="flex items-center gap-3">
            <div className="h-11 w-11 rounded-lg bg-orange-500/10 flex items-center justify-center group-hover:bg-orange-500/20">
              <DollarSign className="h-5 w-5 text-orange-400" />
            </div>
            <div>
              <p className="font-semibold text-zinc-100">Ingresos</p>
              <p className="text-xs text-zinc-500">Por período</p>
            </div>
          </div>
        </button>

        <button
          onClick={() => { setTab('asistencia'); loadAsistencia() }}
          className="bg-zinc-900 border-2 border-zinc-800 hover:border-blue-500 hover:bg-blue-500/5 transition-all rounded-xl p-5 text-left group"
        >
          <div className="flex items-center gap-3">
            <div className="h-11 w-11 rounded-lg bg-blue-500/10 flex items-center justify-center group-hover:bg-blue-500/20">
              <Activity className="h-5 w-5 text-blue-400" />
            </div>
            <div>
              <p className="font-semibold text-zinc-100">Asistencia</p>
              <p className="text-xs text-zinc-500">Socios más frecuentes</p>
            </div>
          </div>
        </button>
      </div>

      <Tabs value={tab} onValueChange={(v) => v && setTab(v)} className="space-y-4">

        <TabsContent value="activos" className="space-y-4">
          <Card className="bg-zinc-900 border-zinc-800">
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle className="text-zinc-200">Socios con Membresía Activa</CardTitle>
              <div className="flex gap-2">
                <Button onClick={loadActivos} disabled={loadingActivos} className="bg-orange-500 hover:bg-orange-600 text-white">
                  <RefreshCw className="h-4 w-4 mr-2" /> Actualizar
                </Button>
                {activos.length > 0 && (
                  <Button onClick={() => downloadPdf('/pdf/reporte/activos/')} variant="outline" className="border-orange-500/30 text-orange-400 hover:bg-orange-500/10">
                    <Download className="h-4 w-4 mr-2" /> PDF
                  </Button>
                )}
              </div>
            </CardHeader>
            <CardContent>
              {totalActivos > 0 && (
                <p className="text-lg font-bold text-zinc-100 mb-4">Total: {totalActivos} socios activos</p>
              )}
              <Table>
                <TableHeader>
                  <TableRow className="border-zinc-800">
                    <TableHead className="text-zinc-400">DNI</TableHead>
                    <TableHead className="text-zinc-400">Apellidos y Nombres</TableHead>
                    <TableHead className="text-zinc-400">Tipo</TableHead>
                    <TableHead className="text-zinc-400">Vence</TableHead>
                    <TableHead className="text-zinc-400">Días restantes</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {activos.length === 0 ? (
                    <TableRow><TableCell colSpan={5} className="text-center text-zinc-500 py-8">Presiona "Actualizar" para cargar datos.</TableCell></TableRow>
                  ) : activos.map((s, i) => (
                    <TableRow key={i} className="border-zinc-800">
                      <TableCell className="text-zinc-200">{s.dni}</TableCell>
                      <TableCell className="text-zinc-300">{s.apellidos}, {s.nombres}</TableCell>
                      <TableCell className="text-zinc-300">{s.tipo_membresia}</TableCell>
                      <TableCell className="text-zinc-300">{formatDate(s.fecha_vencimiento)}</TableCell>
                      <TableCell><Badge variant="outline" className="border-green-500/30 text-green-400">{s.dias_restantes}d</Badge></TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="ingresos" className="space-y-4">
          <Card className="bg-zinc-900 border-zinc-800">
            <CardHeader><CardTitle className="text-zinc-200">Reporte de Ingresos</CardTitle></CardHeader>
            <CardContent className="space-y-4">
              <div className="flex flex-wrap gap-3">
                <div className="flex gap-2 bg-zinc-800 rounded-lg p-1">
                  {['diario', 'semanal', 'mensual'].map(p => (
                    <button
                      key={p}
                      onClick={() => setPeriodo(p)}
                      className={`px-3 py-1.5 rounded-md text-sm capitalize transition-colors ${
                        periodo === p
                          ? 'bg-orange-500 text-white'
                          : 'text-zinc-400 hover:text-zinc-200'
                      }`}
                    >
                      {p}
                    </button>
                  ))}
                </div>
                <Input type="date" value={fechaIngresos} onChange={(e) => setFechaIngresos(e.target.value)} className="bg-zinc-800 border-zinc-700 text-zinc-100 w-auto" />
                <Button onClick={loadIngresos} disabled={loadingIngresos} className="bg-orange-500 hover:bg-orange-600 text-white">
                  <BarChart3 className="h-4 w-4 mr-2" /> Generar
                </Button>
                {ingresos && (
                  <Button onClick={() => downloadPdf(`/pdf/reporte/ingresos/?periodo=${periodo}&fecha=${fechaIngresos}`)} variant="outline" className="border-orange-500/30 text-orange-400 hover:bg-orange-500/10">
                    <Download className="h-4 w-4 mr-2" /> PDF
                  </Button>
                )}
              </div>

              {ingresos && (
                <div className="space-y-4">
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                    <div className="bg-orange-500/10 border border-orange-500/20 rounded-lg p-4 text-center">
                      <p className="text-xs text-zinc-400 uppercase tracking-wide">Total</p>
                      <p className="text-2xl font-bold text-orange-400 mt-1">{formatCurrency(ingresos.total_ingresos)}</p>
                    </div>
                    <div className="bg-green-500/10 border border-green-500/20 rounded-lg p-4 text-center">
                      <p className="text-xs text-zinc-400 uppercase tracking-wide">Efectivo</p>
                      <p className="text-xl font-bold text-green-400 mt-1">{formatCurrency(ingresos.desglose?.Efectivo || 0)}</p>
                    </div>
                    <div className="bg-blue-500/10 border border-blue-500/20 rounded-lg p-4 text-center">
                      <p className="text-xs text-zinc-400 uppercase tracking-wide">Yape</p>
                      <p className="text-xl font-bold text-blue-400 mt-1">{formatCurrency(ingresos.desglose?.Yape || 0)}</p>
                    </div>
                    <div className="bg-purple-500/10 border border-purple-500/20 rounded-lg p-4 text-center">
                      <p className="text-xs text-zinc-400 uppercase tracking-wide">Transferencia</p>
                      <p className="text-xl font-bold text-purple-400 mt-1">{formatCurrency(ingresos.desglose?.Transferencia || 0)}</p>
                    </div>
                  </div>
                  <div className="flex items-center justify-between text-sm text-zinc-400">
                    <span>{ingresos.cantidad_pagos} transacciones</span>
                    <span>{ingresos.fecha_inicio} → {ingresos.fecha_fin}</span>
                  </div>

                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                    {Object.keys(ingresos.desglose || {}).length > 0 && (
                      <Card className="bg-zinc-800/50 border-zinc-700">
                        <CardHeader><CardTitle className="text-zinc-300 text-sm">Desglose por Método</CardTitle></CardHeader>
                        <CardContent>
                          <ResponsiveContainer width="100%" height={220}>
                            <PieChart>
                              <Pie
                                data={Object.entries(ingresos.desglose).map(([k, v]) => ({ name: k, value: v as number }))}
                                cx="50%" cy="50%" innerRadius={50} outerRadius={85}
                                paddingAngle={4} dataKey="value"
                              >
                                {Object.keys(ingresos.desglose).map((metodo) => (
                                  <Cell key={metodo} fill={METHOD_COLORS[metodo] || '#f97316'} stroke="transparent" />
                                ))}
                              </Pie>
                              <Tooltip
                                contentStyle={{ background: '#27272a', border: '1px solid #3f3f46', borderRadius: '8px', color: '#e4e4e7' }}
                                formatter={(value: number) => formatCurrency(value)}
                              />
                            </PieChart>
                          </ResponsiveContainer>
                          <div className="flex justify-center gap-4 mt-2">
                            {Object.entries(ingresos.desglose).map(([k, v]) => (
                              <div key={k} className="flex items-center gap-1.5 text-xs text-zinc-400">
                                <div className="h-2.5 w-2.5 rounded-sm" style={{ backgroundColor: METHOD_COLORS[k] || '#f97316' }} />
                                {k}: {formatCurrency(v as number)}
                              </div>
                            ))}
                          </div>
                        </CardContent>
                      </Card>
                    )}

                    {ingresos.detalle_por_dia?.length > 1 && (
                      <Card className="bg-zinc-800/50 border-zinc-700">
                        <CardHeader><CardTitle className="text-zinc-300 text-sm">Ingresos por Día</CardTitle></CardHeader>
                        <CardContent>
                          <ResponsiveContainer width="100%" height={220}>
                            <BarChart data={ingresos.detalle_por_dia}>
                              <CartesianGrid strokeDasharray="3 3" stroke="#3f3f46" />
                              <XAxis dataKey="fecha" tick={{ fill: '#a1a1aa', fontSize: 11 }} axisLine={{ stroke: '#3f3f46' }} />
                              <YAxis tick={{ fill: '#a1a1aa', fontSize: 11 }} axisLine={{ stroke: '#3f3f46' }} />
                              <Tooltip
                                contentStyle={{ background: '#27272a', border: '1px solid #3f3f46', borderRadius: '8px', color: '#e4e4e7' }}
                                formatter={(value: number) => formatCurrency(value)}
                              />
                              <Bar dataKey="monto" fill="#f97316" radius={[4, 4, 0, 0]} />
                            </BarChart>
                          </ResponsiveContainer>
                        </CardContent>
                      </Card>
                    )}
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="asistencia" className="space-y-4">
          <Card className="bg-zinc-900 border-zinc-800">
            <CardHeader><CardTitle className="text-zinc-200">Reporte de Asistencia</CardTitle></CardHeader>
            <CardContent className="space-y-4">
              <div className="flex gap-3">
                <Input type="date" value={fechaAsistencia} onChange={(e) => setFechaAsistencia(e.target.value)} className="bg-zinc-800 border-zinc-700 text-zinc-100 w-auto" />
                <Button onClick={loadAsistencia} disabled={loadingAsistencia} className="bg-orange-500 hover:bg-orange-600 text-white">
                  <BarChart3 className="h-4 w-4 mr-2" /> Generar
                </Button>
                {asistenciaData && (
                  <Button onClick={() => downloadPdf(`/pdf/reporte/asistencia/?fecha=${fechaAsistencia}&top_n=10`)} variant="outline" className="border-orange-500/30 text-orange-400 hover:bg-orange-500/10">
                    <Download className="h-4 w-4 mr-2" /> PDF
                  </Button>
                )}
              </div>

              {asistenciaData && (
                <div className="space-y-4">
                  <div className="bg-orange-500/10 border border-orange-500/20 rounded-lg p-5 text-center">
                    <p className="text-xs text-zinc-400 uppercase tracking-wide">Ingresos del día</p>
                    <p className="text-4xl font-bold text-orange-400 mt-1">{asistenciaData.ingresos_diarios}</p>
                    <p className="text-sm text-zinc-400 mt-1">{formatDate(asistenciaData.fecha_consulta)}</p>
                  </div>

                  {asistenciaData.top_socios?.length > 0 && (
                    <div className="space-y-4">
                      <Card className="bg-zinc-800/50 border-zinc-700">
                        <CardHeader><CardTitle className="text-zinc-200 text-base">Top 10 Socios más Frecuentes</CardTitle></CardHeader>
                        <CardContent>
                          <ResponsiveContainer width="100%" height={Math.max(250, asistenciaData.top_socios.length * 35)}>
                            <BarChart data={asistenciaData.top_socios.map((s: any) => ({
                              name: `${s.socio__apellidos?.split(' ')[0] || ''}, ${s.socio__nombres?.split(' ')[0] || ''}`,
                              total: s.total,
                            }))} layout="vertical" margin={{ left: 20, right: 20 }}>
                              <CartesianGrid strokeDasharray="3 3" stroke="#3f3f46" />
                              <XAxis type="number" tick={{ fill: '#a1a1aa', fontSize: 11 }} axisLine={{ stroke: '#3f3f46' }} />
                              <YAxis type="category" dataKey="name" width={120} tick={{ fill: '#a1a1aa', fontSize: 11 }} axisLine={{ stroke: '#3f3f46' }} />
                              <Tooltip
                                contentStyle={{ background: '#27272a', border: '1px solid #3f3f46', borderRadius: '8px', color: '#e4e4e7' }}
                              />
                              <Bar dataKey="total" fill="#f97316" radius={[0, 4, 4, 0]} />
                            </BarChart>
                          </ResponsiveContainer>
                        </CardContent>
                      </Card>
                      <Card className="bg-zinc-800/50 border-zinc-700">
                        <CardHeader><CardTitle className="text-zinc-300 text-sm">Detalle</CardTitle></CardHeader>
                        <CardContent className="p-0">
                          <Table>
                            <TableHeader>
                              <TableRow className="border-zinc-700">
                                <TableHead className="text-zinc-400">#</TableHead>
                                <TableHead className="text-zinc-400">Socio</TableHead>
                                <TableHead className="text-zinc-400">DNI</TableHead>
                                <TableHead className="text-zinc-400">Asistencias</TableHead>
                              </TableRow>
                            </TableHeader>
                            <TableBody>
                              {asistenciaData.top_socios.map((s: any, i: number) => (
                                <TableRow key={i} className="border-zinc-700">
                                  <TableCell className="text-zinc-400">{i + 1}</TableCell>
                                  <TableCell className="text-zinc-300">{s.socio__apellidos}, {s.socio__nombres}</TableCell>
                                  <TableCell className="text-zinc-300">{s.socio__dni}</TableCell>
                                  <TableCell><Badge variant="outline" className="border-orange-500/30 text-orange-400">{s.total}</Badge></TableCell>
                                </TableRow>
                              ))}
                            </TableBody>
                          </Table>
                        </CardContent>
                      </Card>
                    </div>
                  )}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}
