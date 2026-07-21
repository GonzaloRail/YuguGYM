import { useState, useEffect, useRef } from 'react'
import { Plus, Edit, Trash2, Eye, X } from 'lucide-react'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from '@/components/ui/table'
import { Badge } from '@/components/ui/badge'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { api } from '@/lib/api'

interface Socio {
  id: number
  dni: string
  nombres: string
  apellidos: string
  telefono: string
  estado: string
  estado_membresia: string
}

interface SocioForm {
  dni: string
  nombres: string
  apellidos: string
  fecha_nacimiento: string
  sexo: string
  telefono: string
  direccion: string
  correo: string
}

const emptyForm: SocioForm = { dni: '', nombres: '', apellidos: '', fecha_nacimiento: '', sexo: 'Masculino', telefono: '', direccion: '', correo: '' }

export default function SociosPage() {
  const [socios, setSocios] = useState<Socio[]>([])
  const [loading, setLoading] = useState(true)
  const [searchDni, setSearchDni] = useState('')
  const [searchNombre, setSearchNombre] = useState('')
  const [searchApellido, setSearchApellido] = useState('')
  const [dialogOpen, setDialogOpen] = useState(false)
  const [form, setForm] = useState<SocioForm>(emptyForm)
  const [editingId, setEditingId] = useState<number | null>(null)
  const [formError, setFormError] = useState('')
  const [saving, setSaving] = useState(false)
  const [ficha, setFicha] = useState<any>(null)
  const [fichaOpen, setFichaOpen] = useState(false)
  const [deleteId, setDeleteId] = useState<number | null>(null)
  const [deleting, setDeleting] = useState(false)

  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  async function loadSocios(dni: string, nombre: string, apellido: string) {
    setLoading(true)
    try {
      const params = new URLSearchParams()
      if (dni) params.set('dni', dni)
      if (nombre) params.set('nombre', nombre)
      if (apellido) params.set('apellido', apellido)
      const data = await api<{ results: Socio[] }>(`/socios/?${params.toString()}`)
      setSocios(data.results || [])
    } catch {
      setSocios([])
    } finally {
      setLoading(false)
    }
  }

  function triggerSearch(dni: string, nombre: string, apellido: string) {
    if (debounceRef.current) clearTimeout(debounceRef.current)
    debounceRef.current = setTimeout(() => {
      loadSocios(dni, nombre, apellido)
    }, 300)
  }

  function handleSearch(e: React.FormEvent) {
    e.preventDefault()
    if (debounceRef.current) clearTimeout(debounceRef.current)
    loadSocios(searchDni, searchNombre, searchApellido)
  }

  function handleClearFilters() {
    setSearchDni('')
    setSearchNombre('')
    setSearchApellido('')
    loadSocios('', '', '')
  }

  useEffect(() => {
    loadSocios('', '', '')
  }, [])

  async function handleSave(e: React.FormEvent) {
    e.preventDefault()
    setFormError('')
    setSaving(true)

    if (!/^\d{8}$/.test(form.dni)) {
      setFormError('El DNI debe tener exactamente 8 dígitos.')
      setSaving(false)
      return
    }
    if (!/^[A-Za-zÀ-ÿ\s]+$/.test(form.nombres)) {
      setFormError('Los nombres solo pueden contener letras y espacios.')
      setSaving(false)
      return
    }
    if (!/^[A-Za-zÀ-ÿ\s]+$/.test(form.apellidos)) {
      setFormError('Los apellidos solo pueden contener letras y espacios.')
      setSaving(false)
      return
    }
    if (form.telefono && !/^\d{9}$/.test(form.telefono)) {
      setFormError('El teléfono debe tener exactamente 9 dígitos.')
      setSaving(false)
      return
    }
    if (form.correo && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.correo)) {
      setFormError('Ingrese un correo electrónico válido.')
      setSaving(false)
      return
    }

    const payload = {
      ...form,
      fecha_nacimiento: form.fecha_nacimiento || null,
      direccion: form.direccion || null,
      correo: form.correo || null,
    }
    try {
      if (editingId) {
        await api(`/socios/${editingId}/`, {
          method: 'PUT',
          body: JSON.stringify(payload),
        })
      } else {
        await api('/socios/', {
          method: 'POST',
          body: JSON.stringify(payload),
        })
      }
      setDialogOpen(false)
      setForm(emptyForm)
      setEditingId(null)
      loadSocios(searchDni, searchNombre, searchApellido)
      toast.success(editingId ? 'Socio actualizado correctamente.' : 'Socio registrado correctamente.')
    } catch (err) {
      setFormError(err instanceof Error ? err.message : 'Error al guardar')
    } finally {
      setSaving(false)
    }
  }

  function handleDelete(id: number) {
    setDeleteId(id)
  }

  async function confirmDelete() {
    if (!deleteId) return
    setDeleting(true)
    try {
      await api(`/socios/${deleteId}/`, { method: 'DELETE' })
      setDeleteId(null)
      loadSocios(searchDni, searchNombre, searchApellido)
      toast.success('Socio eliminado correctamente.')
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Error al eliminar')
    } finally {
      setDeleting(false)
    }
  }

  async function openFicha(id: number) {
    try {
      const data = await api<any>(`/socios/${id}/ficha/`)
      setFicha(data)
      setFichaOpen(true)
    } catch (err) {
      toast.error('Error al cargar ficha')
    }
  }

  async function openEdit(socio: Socio) {
    setEditingId(socio.id)
    setFormError('')
    setDialogOpen(true)
    try {
      const data = await api<any>(`/socios/${socio.id}/`)
      setForm({
        dni: data.dni,
        nombres: data.nombres,
        apellidos: data.apellidos,
        fecha_nacimiento: data.fecha_nacimiento || '',
        sexo: data.sexo || 'Masculino',
        telefono: data.telefono,
        direccion: data.direccion || '',
        correo: data.correo || '',
      })
    } catch {
      setForm({
        dni: socio.dni,
        nombres: socio.nombres,
        apellidos: socio.apellidos,
        fecha_nacimiento: '',
        sexo: 'Masculino',
        telefono: socio.telefono,
        direccion: '',
        correo: '',
      })
    }
  }

  function openCreate() {
    setEditingId(null)
    setForm(emptyForm)
    setFormError('')
    setDialogOpen(true)
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-zinc-100">Gestión de Socios</h1>
        <Button onClick={openCreate} className="bg-orange-500 hover:bg-orange-600 text-white">
          <Plus className="h-4 w-4 mr-2" /> Nuevo Socio
        </Button>
      </div>

      <Card className="bg-zinc-900 border-zinc-800">
        <CardHeader><CardTitle className="text-sm font-medium text-zinc-400">Filtros de Búsqueda</CardTitle></CardHeader>
        <CardContent>
          <div className="flex gap-3 flex-wrap">
            <div className="flex-1 min-w-[160px]">
              <Label className="text-zinc-400 text-xs mb-1 block">DNI</Label>
              <Input placeholder="12345678" value={searchDni} maxLength={8} inputMode="numeric" pattern="[0-9]*"
                onChange={(e) => { const v = e.target.value.replace(/\D/g, ''); setSearchDni(v); triggerSearch(v, searchNombre, searchApellido) }}
                className="bg-zinc-800 border-zinc-700 text-zinc-100" />
            </div>
            <div className="flex-1 min-w-[200px]">
              <Label className="text-zinc-400 text-xs mb-1 block">Nombre</Label>
              <Input placeholder="Juan" value={searchNombre}
                onChange={(e) => { const v = e.target.value; setSearchNombre(v); triggerSearch(searchDni, v, searchApellido) }}
                className="bg-zinc-800 border-zinc-700 text-zinc-100" />
            </div>
            <div className="flex-1 min-w-[200px]">
              <Label className="text-zinc-400 text-xs mb-1 block">Apellido</Label>
              <Input placeholder="Pérez" value={searchApellido}
                onChange={(e) => { const v = e.target.value; setSearchApellido(v); triggerSearch(searchDni, searchNombre, v) }}
                className="bg-zinc-800 border-zinc-700 text-zinc-100" />
            </div>
            {(searchDni || searchNombre || searchApellido) && (
              <div className="flex items-end">
                <Button type="button" variant="outline" onClick={handleClearFilters}
                  className="border-zinc-700 text-zinc-300 hover:bg-zinc-800">
                  <X className="h-4 w-4 mr-1" /> Limpiar
                </Button>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      <Card className="bg-zinc-900 border-zinc-800">
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow className="border-zinc-800 hover:bg-zinc-800/50">
                <TableHead className="text-zinc-400">DNI</TableHead>
                <TableHead className="text-zinc-400">Nombres</TableHead>
                <TableHead className="text-zinc-400">Apellidos</TableHead>
                <TableHead className="text-zinc-400">Teléfono</TableHead>
                <TableHead className="text-zinc-400">Estado</TableHead>
                <TableHead className="text-zinc-400">Acciones</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {loading ? (
                <TableRow><TableCell colSpan={6} className="text-center text-zinc-500 py-8">Cargando...</TableCell></TableRow>
              ) : socios.length === 0 ? (
                <TableRow><TableCell colSpan={6} className="text-center text-zinc-500 py-8">No se encontraron socios.</TableCell></TableRow>
              ) : socios.map((s) => (
                <TableRow key={s.id} className="border-zinc-800 hover:bg-zinc-800/30">
                  <TableCell className="font-medium text-zinc-200">{s.dni}</TableCell>
                  <TableCell className="text-zinc-300">{s.nombres}</TableCell>
                  <TableCell className="text-zinc-300">{s.apellidos}</TableCell>
                  <TableCell className="text-zinc-300">{s.telefono}</TableCell>
                  <TableCell>
                    <Badge variant={s.estado_membresia.includes('Activa') ? 'default' : 'secondary'}
                      className={s.estado_membresia.includes('Activa') ? 'bg-green-500/20 text-green-400 border-green-500/30' : 'bg-zinc-800 text-zinc-400'}>
                      {s.estado_membresia.includes('Activa') ? 'Activo' : 'Inactivo'}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <div className="flex gap-2">
                      <Button variant="ghost" size="icon" onClick={() => openFicha(s.id)} className="text-zinc-400 hover:text-orange-400"><Eye className="h-4 w-4" /></Button>
                      <Button variant="ghost" size="icon" onClick={() => openEdit(s)} className="text-zinc-400 hover:text-blue-400"><Edit className="h-4 w-4" /></Button>
                      <Button variant="ghost" size="icon" onClick={() => handleDelete(s.id)} className="text-zinc-400 hover:text-red-400"><Trash2 className="h-4 w-4" /></Button>
      <Dialog open={deleteId !== null} onOpenChange={(open) => { if (!open) setDeleteId(null) }}>
        <DialogContent className="bg-zinc-900 border-zinc-800 text-zinc-100 max-w-sm">
          <DialogHeader><DialogTitle>Confirmar Eliminación</DialogTitle></DialogHeader>
          <p className="text-zinc-400 text-sm">¿Está seguro de eliminar este socio? Esta acción no se puede deshacer.</p>
          <div className="flex justify-end gap-3 pt-4">
            <Button onClick={() => setDeleteId(null)} variant="outline" className="border-zinc-700 text-zinc-300 hover:bg-zinc-800">
              Cancelar
            </Button>
            <Button onClick={confirmDelete} disabled={deleting} className="bg-red-500 hover:bg-red-600 text-white">
              {deleting ? 'Eliminando...' : 'Eliminar'}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="bg-zinc-900 border-zinc-800 text-zinc-100 max-w-lg">
          <DialogHeader><DialogTitle>{editingId ? 'Editar Socio' : 'Registrar Socio'}</DialogTitle></DialogHeader>
          <form onSubmit={handleSave} className="space-y-3">
            {formError && <div className="bg-red-500/10 border border-red-500/20 text-red-400 text-sm rounded-lg px-4 py-3">{formError}</div>}
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1">
                <Label className="text-zinc-300 text-sm">DNI</Label>
                <Input value={form.dni} onChange={(e) => setForm({ ...form, dni: e.target.value.replace(/\D/g, '') })} disabled={!!editingId} required maxLength={8} inputMode="numeric" pattern="[0-9]{8}"
                  className="bg-zinc-800 border-zinc-700 text-zinc-100" />
              </div>
              <div className="space-y-1">
                <Label className="text-zinc-300 text-sm">Sexo</Label>
                <Select value={form.sexo} onValueChange={(v: string | null) => setForm({ ...form, sexo: v ?? 'Masculino' })}>
                  <SelectTrigger className="bg-zinc-800 border-zinc-700 text-zinc-100 data-[placeholder]:text-zinc-400">
                    <SelectValue placeholder="Seleccionar" />
                  </SelectTrigger>
                  <SelectContent className="bg-zinc-800 border-zinc-700 text-zinc-100">
                    <SelectItem value="Masculino" className="text-zinc-100 focus:bg-orange-500/20 focus:text-orange-400">Masculino</SelectItem>
                    <SelectItem value="Femenino" className="text-zinc-100 focus:bg-orange-500/20 focus:text-orange-400">Femenino</SelectItem>
                    <SelectItem value="Otro" className="text-zinc-100 focus:bg-orange-500/20 focus:text-orange-400">Otro</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1">
                <Label className="text-zinc-300 text-sm">Nombres</Label>
                <Input value={form.nombres} onChange={(e) => setForm({ ...form, nombres: e.target.value })} required maxLength={80}
                  className="bg-zinc-800 border-zinc-700 text-zinc-100" />
              </div>
              <div className="space-y-1">
                <Label className="text-zinc-300 text-sm">Apellidos</Label>
                <Input value={form.apellidos} onChange={(e) => setForm({ ...form, apellidos: e.target.value })} required maxLength={80}
                  className="bg-zinc-800 border-zinc-700 text-zinc-100" />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1">
                <Label className="text-zinc-300 text-sm">Teléfono</Label>
                <Input value={form.telefono} onChange={(e) => setForm({ ...form, telefono: e.target.value.replace(/\D/g, '') })} required maxLength={9} inputMode="numeric" pattern="[0-9]{9}"
                  className="bg-zinc-800 border-zinc-700 text-zinc-100" />
              </div>
              <div className="space-y-1">
                <Label className="text-zinc-300 text-sm">Fecha Nacimiento</Label>
                <Input type="date" value={form.fecha_nacimiento} onChange={(e) => setForm({ ...form, fecha_nacimiento: e.target.value })}
                  className="bg-zinc-800 border-zinc-700 text-zinc-100" />
              </div>
            </div>
            <div className="space-y-1">
              <Label className="text-zinc-300 text-sm">Dirección</Label>
              <Input value={form.direccion} onChange={(e) => setForm({ ...form, direccion: e.target.value })} maxLength={150}
                className="bg-zinc-800 border-zinc-700 text-zinc-100" />
            </div>
            <div className="space-y-1">
              <Label className="text-zinc-300 text-sm">Correo (opcional)</Label>
              <Input type="email" value={form.correo} onChange={(e) => setForm({ ...form, correo: e.target.value })} maxLength={100}
                className="bg-zinc-800 border-zinc-700 text-zinc-100" />
            </div>
            <Button type="submit" disabled={saving} className="w-full bg-orange-500 hover:bg-orange-600 text-white">
              {saving ? 'Guardando...' : editingId ? 'Actualizar Socio' : 'Registrar Socio'}
            </Button>
          </form>
        </DialogContent>
      </Dialog>

      <Dialog open={fichaOpen} onOpenChange={setFichaOpen}>
        <DialogContent className="bg-zinc-900 border-zinc-800 text-zinc-100 max-w-2xl">
          <DialogHeader><DialogTitle>Ficha del Socio</DialogTitle></DialogHeader>
          {ficha && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4 bg-zinc-800/50 rounded-lg p-4">
                <div><span className="text-zinc-400 text-sm">DNI:</span><p className="text-zinc-200">{ficha.dni}</p></div>
                <div><span className="text-zinc-400 text-sm">Estado:</span><p className="text-zinc-200">{ficha.estado}</p></div>
                <div><span className="text-zinc-400 text-sm">Nombres:</span><p className="text-zinc-200">{ficha.nombres}</p></div>
                <div><span className="text-zinc-400 text-sm">Apellidos:</span><p className="text-zinc-200">{ficha.apellidos}</p></div>
                <div><span className="text-zinc-400 text-sm">Teléfono:</span><p className="text-zinc-200">{ficha.telefono}</p></div>
                <div><span className="text-zinc-400 text-sm">Correo:</span><p className="text-zinc-200">{ficha.correo || '-'}</p></div>
              </div>

              {ficha.membresia_actual && (
                <div className="bg-orange-500/10 border border-orange-500/20 rounded-lg p-4">
                  <h3 className="font-medium text-orange-400 mb-2">Membresía Actual</h3>
                  <p className="text-sm text-zinc-300">
                    {ficha.membresia_actual.tipo} — Vence: {ficha.membresia_actual.fecha_vencimiento} — {ficha.membresia_actual.dias_restantes} días restantes
                  </p>
                </div>
              )}

              {ficha.ultimo_pago && (
                <div className="bg-green-500/10 border border-green-500/20 rounded-lg p-4">
                  <h3 className="font-medium text-green-400 mb-2">Último Pago</h3>
                  <p className="text-sm text-zinc-300">
                    S/ {ficha.ultimo_pago.monto} — {ficha.ultimo_pago.fecha} — {ficha.ultimo_pago.metodo}
                  </p>
                </div>
              )}

              {ficha.historial_asistencia && ficha.historial_asistencia.length > 0 && (
                <div>
                  <h3 className="font-medium text-zinc-200 mb-2">Últimas Asistencias</h3>
                  <div className="bg-zinc-800/50 rounded-lg">
                    <Table>
                      <TableHeader>
                        <TableRow className="border-zinc-700">
                          <TableHead className="text-zinc-400">Fecha</TableHead>
                          <TableHead className="text-zinc-400">Hora</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {ficha.historial_asistencia.slice(0, 10).map((a: any, i: number) => (
                          <TableRow key={i} className="border-zinc-700">
                            <TableCell className="text-zinc-300">{a.fecha}</TableCell>
                            <TableCell className="text-zinc-300">{a.hora}</TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>
                </div>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>

      <Dialog open={deleteId !== null} onOpenChange={(open) => { if (!open) setDeleteId(null) }}>
        <DialogContent className="bg-zinc-900 border-zinc-800 text-zinc-100 max-w-sm">
          <DialogHeader><DialogTitle>Confirmar Eliminación</DialogTitle></DialogHeader>
          <p className="text-zinc-400 text-sm">¿Está seguro de eliminar este socio? Esta acción no se puede deshacer.</p>
          <div className="flex justify-end gap-3 pt-4">
            <Button onClick={() => setDeleteId(null)} variant="outline" className="border-zinc-700 text-zinc-300 hover:bg-zinc-800">
              Cancelar
            </Button>
            <Button onClick={confirmDelete} disabled={deleting} className="bg-red-500 hover:bg-red-600 text-white">
              {deleting ? 'Eliminando...' : 'Eliminar'}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}
