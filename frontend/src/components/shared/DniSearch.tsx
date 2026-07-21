import { useState, useEffect, useRef } from 'react'
import { Search, X, User } from 'lucide-react'
import { Input } from '@/components/ui/input'
import { Card } from '@/components/ui/card'
import { api } from '@/lib/api'

interface Socio {
  id: number
  dni: string
  nombres: string
  apellidos: string
  telefono: string
  estado_membresia: string
}

interface DniSearchProps {
  value: string
  onSelect: (socio: Socio) => void
  onClear?: () => void
  placeholder?: string
}

export function DniSearch({ value, onSelect, onClear, placeholder = 'Buscar por DNI o nombre...' }: DniSearchProps) {
  const [query, setQuery] = useState(value || '')
  const [open, setOpen] = useState(false)
  const [results, setResults] = useState<Socio[]>([])
  const [loading, setLoading] = useState(false)
  const ref = useRef<HTMLDivElement>(null)
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  useEffect(() => { setQuery(value || '') }, [value])

  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false)
    }
    document.addEventListener('mousedown', handleClick)
    return () => document.removeEventListener('mousedown', handleClick)
  }, [])

  function search(q: string) {
    if (!q.trim()) { setOpen(false); setResults([]); setLoading(false); return }
    if (debounceRef.current) clearTimeout(debounceRef.current)
    setOpen(true)
    setLoading(true)

    debounceRef.current = setTimeout(async () => {
      try {
        const soloNumeros = /^\d+$/.test(q)
        const url = soloNumeros
          ? `/socios/?dni=${encodeURIComponent(q)}`
          : `/socios/?nombre=${encodeURIComponent(q)}`
        const data = await api<any>(url)
        setResults(data.results || [])
      } catch { setResults([]) }
      finally { setLoading(false) }
    }, 150)
  }

  function handleChange(e: React.ChangeEvent<HTMLInputElement>) {
    const v = e.target.value
    setQuery(v)
    search(v)
  }

  function handleFocus() {
    if (query) search(query)
  }

  function handleSelect(socio: Socio) {
    setQuery(`${socio.dni} — ${socio.nombres} ${socio.apellidos}`)
    setOpen(false)
    setResults([])
    onSelect(socio)
  }

  function handleClear() {
    setQuery('')
    setResults([])
    setOpen(false)
    onClear?.()
  }

  return (
    <div ref={ref} className="relative w-full">
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-zinc-400" />
        <Input
          value={query}
          onChange={handleChange}
          onFocus={handleFocus}
          placeholder={placeholder}
          maxLength={80}
          className="bg-zinc-800 border-zinc-700 text-zinc-100 placeholder:text-zinc-500 pl-10 pr-10 h-12 text-base"
        />
        {query && (
          <button
            type="button"
            onClick={handleClear}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-500 hover:text-zinc-300"
          >
            <X className="h-4 w-4" />
          </button>
        )}
      </div>

      {open && (
        <Card className="absolute z-50 mt-1 w-full bg-zinc-900 border-zinc-700 shadow-2xl max-h-80 overflow-y-auto">
          {loading ? (
            <div className="p-3 text-sm text-zinc-500 flex items-center gap-2">
              <span className="h-3 w-3 border-2 border-orange-500 border-t-transparent rounded-full animate-spin" />
              Buscando...
            </div>
          ) : results.length > 0 ? (
            <ul className="py-1">
              {results.map((s) => (
                <li key={s.id}>
                  <button
                    type="button"
                    onClick={() => handleSelect(s)}
                    className="w-full px-4 py-3 text-left hover:bg-zinc-800 flex items-center gap-3 border-b border-zinc-800 last:border-0 transition-colors"
                  >
                    <div className="h-9 w-9 rounded-full bg-orange-500/10 flex items-center justify-center shrink-0">
                      <User className="h-4 w-4 text-orange-400" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-zinc-100 truncate">
                        {s.nombres} {s.apellidos}
                      </p>
                      <p className="text-xs text-zinc-500">DNI: {s.dni} • {s.telefono || 'sin teléfono'}</p>
                    </div>
                    <span className="text-xs text-zinc-500 truncate max-w-[140px]">
                      {s.estado_membresia?.includes('Activa') ? (
                        <span className="text-green-400">Activo</span>
                      ) : (
                        <span className="text-zinc-500">Inactivo</span>
                      )}
                    </span>
                  </button>
                </li>
              ))}
            </ul>
          ) : (
            <div className="p-4 text-sm text-zinc-500 text-center">
              No se encontraron socios con "{query}"
            </div>
          )}
        </Card>
      )}
    </div>
  )
}
