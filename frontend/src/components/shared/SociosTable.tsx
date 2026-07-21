import { useState, useEffect, useRef } from 'react'
import { User } from 'lucide-react'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import { api } from '@/lib/api'

interface Socio {
  id: number
  dni: string
  nombres: string
  apellidos: string
  telefono: string
  estado_membresia: string
}

interface Action {
  label: string
  color: string
  onClick: (socio: Socio) => void
}

interface SociosTableProps {
  actions: Action[]
  selectedDni?: string
  autoLoad?: boolean
}

export function SociosTable({ actions, selectedDni, autoLoad = true }: SociosTableProps) {
  const [socios, setSocios] = useState<Socio[]>([])
  const [dni, setDni] = useState('')
  const [nombre, setNombre] = useState('')
  const [apellido, setApellido] = useState('')
  const [loading, setLoading] = useState(autoLoad)
  const [mounted, setMounted] = useState(false)
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  function doSearch(d: string, n: string, a: string) {
    if (debounceRef.current) clearTimeout(debounceRef.current)
    setLoading(true)
    debounceRef.current = setTimeout(async () => {
      try {
        const params = new URLSearchParams()
        if (d) params.set('dni', d)
        if (n) params.set('nombre', n)
        if (a) params.set('apellido', a)
        const data = await api<{ results: Socio[] }>(`/socios/?${params.toString()}`)
        setSocios(data.results || [])
      } catch { setSocios([]) }
      finally { setLoading(false) }
    }, 200)
  }

  useEffect(() => {
    if (autoLoad) {
      doSearch('', '', '')
    } else {
      setLoading(false)
    }
    setMounted(true)
  }, [])

  function handleDni(v: string) { setDni(v); doSearch(v, nombre, apellido) }
  function handleNombre(v: string) { setNombre(v); doSearch(dni, v, apellido) }
  function handleApellido(v: string) { setApellido(v); doSearch(dni, nombre, v) }

  return (
    <div className="space-y-3">
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        <div>
          <Label className="text-zinc-400 text-xs mb-1 block">DNI</Label>
          <Input placeholder="12345678" value={dni} maxLength={8} inputMode="numeric" pattern="[0-9]*"
            onChange={(e) => handleDni(e.target.value.replace(/\D/g, ''))}
            className="bg-zinc-800 border-zinc-700 text-zinc-100 placeholder:text-zinc-500 h-10" />
        </div>
        <div>
          <Label className="text-zinc-400 text-xs mb-1 block">Nombre</Label>
          <Input placeholder="Buscar..." value={nombre}
            onChange={(e) => handleNombre(e.target.value)}
            className="bg-zinc-800 border-zinc-700 text-zinc-100 placeholder:text-zinc-500 h-10" />
        </div>
        <div>
          <Label className="text-zinc-400 text-xs mb-1 block">Apellido</Label>
          <Input placeholder="Buscar..." value={apellido}
            onChange={(e) => handleApellido(e.target.value)}
            className="bg-zinc-800 border-zinc-700 text-zinc-100 placeholder:text-zinc-500 h-10" />
        </div>
      </div>

      <div className="bg-zinc-800/30 rounded-lg overflow-hidden">
        <div className="grid grid-cols-12 gap-2 px-4 py-2 text-xs text-zinc-400 border-b border-zinc-700">
          <span className="col-span-2">DNI</span>
          <span className="col-span-5">Socio</span>
          <span className="col-span-2">Estado</span>
          <span className="col-span-3 text-right">Acción</span>
        </div>

        {loading ? (
          <div className="p-6 text-center text-zinc-500 text-sm">Cargando...</div>
        ) : !autoLoad && !dni && !nombre && !apellido ? (
          <div className="p-6 text-center text-zinc-500 text-sm">Busca un socio por DNI, nombre o apellido.</div>
        ) : socios.length === 0 ? (
          <div className="p-6 text-center text-zinc-500 text-sm">No se encontraron socios.</div>
        ) : (
          <div className="max-h-80 overflow-y-auto">
            {socios.map((s) => (
              <div
                key={s.id}
                className={`grid grid-cols-12 gap-2 px-4 py-3 border-b border-zinc-700/30 last:border-0 items-center text-sm ${
                  selectedDni === s.dni ? 'bg-orange-500/10' : 'hover:bg-zinc-700/30'
                }`}
              >
                <span className="col-span-2 text-zinc-200 font-medium">{s.dni}</span>
                <span className="col-span-5 flex items-center gap-2 text-zinc-100">
                  <div className="h-6 w-6 rounded-full bg-orange-500/10 flex items-center justify-center shrink-0">
                    <User className="h-3 w-3 text-orange-400" />
                  </div>
                  <span className="truncate">{s.nombres} {s.apellidos}</span>
                </span>
                <span className="col-span-2">
                  <Badge variant="outline" className={
                    s.estado_membresia?.includes('Activa')
                      ? 'border-green-500/30 text-green-400 text-xs'
                      : 'border-zinc-600 text-zinc-400 text-xs'
                  }>
                    {s.estado_membresia?.includes('Activa') ? 'Activo' : 'Inactivo'}
                  </Badge>
                </span>
                <span className="col-span-3 flex justify-end gap-1.5">
                  {actions.map((action, i) => (
                    <button
                      key={i}
                      onClick={() => action.onClick(s)}
                      className={`px-3 py-1 rounded-md text-xs font-medium transition-colors ${action.color}`}
                    >
                      {action.label}
                    </button>
                  ))}
                </span>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
