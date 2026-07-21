import { useState, useRef, useEffect, useCallback } from 'react'
import { User } from 'lucide-react'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { api } from '@/lib/api'

interface Socio {
  id: number
  dni: string
  nombres: string
  apellidos: string
  telefono: string
  estado_membresia: string
}

interface SocioSearchProps {
  onSelect: (socio: Socio) => void
}

export function SocioSearch({ onSelect }: SocioSearchProps) {
  const [dni, setDni] = useState('')
  const [nombre, setNombre] = useState('')
  const [apellido, setApellido] = useState('')
  const [results, setResults] = useState<Socio[]>([])
  const [open, setOpen] = useState(false)
  const [selected, setSelected] = useState<Socio | null>(null)
  const ref = useRef<HTMLDivElement>(null)
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false)
    }
    document.addEventListener('mousedown', handleClick)
    return () => document.removeEventListener('mousedown', handleClick)
  }, [])

  const doSearch = useCallback((d: string, n: string, a: string) => {
    if (debounceRef.current) clearTimeout(debounceRef.current)
    if (!d && !n && !a) { setResults([]); setOpen(false); return }
    debounceRef.current = setTimeout(async () => {
      try {
        const params = new URLSearchParams()
        if (d) params.set('dni', d)
        if (n) params.set('nombre', n)
        if (a) params.set('apellido', a)
        const data = await api<{ results: Socio[] }>(`/socios/?${params.toString()}`)
        setResults(data.results || [])
        setOpen((data.results?.length || 0) > 0)
      } catch { setResults([]); setOpen(false) }
    }, 200)
  }, [])

  function handleDni(e: React.ChangeEvent<HTMLInputElement>) {
    const v = e.target.value; setDni(v); setSelected(null); doSearch(v, nombre, apellido)
  }
  function handleNombre(e: React.ChangeEvent<HTMLInputElement>) {
    const v = e.target.value; setNombre(v); setSelected(null); doSearch(dni, v, apellido)
  }
  function handleApellido(e: React.ChangeEvent<HTMLInputElement>) {
    const v = e.target.value; setApellido(v); setSelected(null); doSearch(dni, nombre, v)
  }

  function handleSelect(socio: Socio) {
    setSelected(socio)
    setDni(socio.dni)
    setNombre(socio.nombres)
    setApellido(socio.apellidos)
    setOpen(false)
    setResults([])
    onSelect(socio)
  }

  function clearAll() {
    setDni(''); setNombre(''); setApellido('')
    setSelected(null); setResults([]); setOpen(false)
  }

  return (
    <div ref={ref} className="relative space-y-3">
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        <div>
          <Label className="text-zinc-400 text-xs mb-1 block">DNI</Label>
          <Input placeholder="12345678" value={dni} onChange={handleDni} maxLength={8} inputMode="numeric" pattern="[0-9]*"
            className="bg-zinc-800 border-zinc-700 text-zinc-100 placeholder:text-zinc-500 h-10" />
        </div>
        <div>
          <Label className="text-zinc-400 text-xs mb-1 block">Nombre</Label>
          <Input placeholder="Juan" value={nombre} onChange={handleNombre}
            className="bg-zinc-800 border-zinc-700 text-zinc-100 placeholder:text-zinc-500 h-10" />
        </div>
        <div>
          <Label className="text-zinc-400 text-xs mb-1 block">Apellido</Label>
          <Input placeholder="Pérez" value={apellido} onChange={handleApellido}
            className="bg-zinc-800 border-zinc-700 text-zinc-100 placeholder:text-zinc-500 h-10" />
        </div>
      </div>

      {selected && (
        <div className="bg-orange-500/10 border border-orange-500/20 rounded-lg p-3 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="h-8 w-8 rounded-full bg-orange-500 flex items-center justify-center">
              <User className="h-4 w-4 text-white" />
            </div>
            <div>
              <p className="text-sm font-medium text-zinc-100">{selected.nombres} {selected.apellidos}</p>
              <p className="text-xs text-zinc-400">DNI: {selected.dni}</p>
            </div>
          </div>
          <button onClick={clearAll} className="text-xs text-zinc-400 hover:text-zinc-200">Cambiar</button>
        </div>
      )}

      {open && results.length > 0 && (
        <div className="bg-zinc-800/50 border border-zinc-700 rounded-lg max-h-72 overflow-y-auto">
          <ul>
            {results.map((s) => (
              <li key={s.id} className="border-b border-zinc-700/50 last:border-0">
                <button
                  type="button"
                  onClick={() => handleSelect(s)}
                  className="w-full px-4 py-3 text-left hover:bg-zinc-700/50 flex items-center gap-3 transition-colors"
                >
                  <div className="h-9 w-9 rounded-full bg-orange-500/10 flex items-center justify-center shrink-0">
                    <User className="h-4 w-4 text-orange-400" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-zinc-100 truncate">{s.nombres} {s.apellidos}</p>
                    <p className="text-xs text-zinc-400 mt-0.5">
                      DNI: {s.dni} • {s.telefono || 'sin teléfono'}
                      <span className={s.estado_membresia?.includes('Activa') ? 'text-green-400 ml-1' : 'text-zinc-500 ml-1'}>
                        {s.estado_membresia?.includes('Activa') ? '• Activo' : '• Inactivo'}
                      </span>
                    </p>
                  </div>
                </button>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  )
}
