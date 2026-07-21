import { useState } from 'react'
import { Outlet, NavLink, useNavigate } from 'react-router-dom'
import { useAuth } from '@/lib/auth'
import {
  Users, CreditCard, DollarSign, ClipboardCheck, BarChart3,
  Shield, LogOut, ChevronLeft, Menu, Dumbbell
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { cn } from '@/lib/utils'

const navItems = [
  { path: '/', label: 'Dashboard', icon: BarChart3, end: true },
  { path: '/socios', label: 'Socios', icon: Users },
  { path: '/membresias', label: 'Membresías', icon: CreditCard },
  { path: '/pagos', label: 'Pagos', icon: DollarSign },
  { path: '/asistencias', label: 'Asistencia', icon: ClipboardCheck },
  { path: '/reportes', label: 'Reportes', icon: BarChart3 },
  { path: '/registrar-admin', label: 'Usuarios', icon: Shield },
]

export default function DashboardLayout() {
  const { user, logout } = useAuth()
  const navigate = useNavigate()
  const [sidebarOpen, setSidebarOpen] = useState(true)

  const initials = user?.nombres?.charAt(0).toUpperCase() || 'A'

  function handleLogout() {
    logout()
    navigate('/login')
  }

  return (
    <div className="flex h-screen bg-zinc-950 text-zinc-100">
      <aside className={cn(
        'flex flex-col border-r border-zinc-800 bg-zinc-900 transition-all duration-300',
        sidebarOpen ? 'w-60' : 'w-16'
      )}>
        <div className="flex items-center gap-3 px-4 h-16 border-b border-zinc-800">
          <Dumbbell className="h-7 w-7 text-orange-500 shrink-0" />
          {sidebarOpen && <span className="font-bold text-lg text-orange-500 whitespace-nowrap">YuguGYM</span>}
        </div>

        <nav className="flex-1 py-4 space-y-1 px-2 overflow-y-auto">
          {navItems.map((item) => (
            <NavLink
              key={item.path}
              to={item.path}
              end={item.end}
              className={({ isActive }) => cn(
                'flex items-center gap-3 px-3 py-2.5 rounded-lg transition-colors',
                isActive
                  ? 'bg-orange-500/10 text-orange-400 font-medium'
                  : 'text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800'
              )}
            >
              <item.icon className="h-5 w-5 shrink-0" />
              {sidebarOpen && <span className="text-sm">{item.label}</span>}
            </NavLink>
          ))}
        </nav>

        <div className="p-2 border-t border-zinc-800">
          <button
            onClick={() => setSidebarOpen(!sidebarOpen)}
            className="flex items-center justify-center w-full p-2 text-zinc-400 hover:text-zinc-200 rounded-lg hover:bg-zinc-800 transition-colors"
          >
            <ChevronLeft className={cn('h-5 w-5 transition-transform', !sidebarOpen && 'rotate-180')} />
          </button>
        </div>
      </aside>

      <div className="flex-1 flex flex-col overflow-hidden">
        <header className="flex items-center justify-end gap-4 px-6 h-16 border-b border-zinc-800 bg-zinc-900/50">
          <DropdownMenu>
            <DropdownMenuTrigger className="flex items-center gap-2 px-2 py-1.5 rounded-lg hover:bg-zinc-800 cursor-pointer text-left">
              <Avatar className="h-8 w-8">
                <AvatarFallback className="bg-orange-500 text-white text-sm">{initials}</AvatarFallback>
              </Avatar>
              <div className="text-left hidden sm:block">
                <p className="text-sm font-medium text-zinc-200">{user?.nombres} {user?.apellidos}</p>
                <p className="text-xs text-zinc-400">{user?.correo}</p>
              </div>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-48 bg-zinc-900 border-zinc-700 text-zinc-200">
              <DropdownMenuItem onClick={() => navigate('/cambiar-password')}>
                Cambiar Contraseña
              </DropdownMenuItem>
              <DropdownMenuItem onClick={handleLogout} className="text-red-400">
                <LogOut className="h-4 w-4 mr-2" /> Cerrar Sesión
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </header>

        <main className="flex-1 overflow-y-auto p-6">
          <Outlet />
        </main>
      </div>
    </div>
  )
}
