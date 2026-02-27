import { NavLink } from 'react-router-dom'
import { supabase } from '../supabaseClient'
import { useNavigate } from 'react-router-dom'
import { useEmpleado } from '../hooks/useEmpleado'

export default function Sidebar() {
    const navigate = useNavigate()
    const { empleado } = useEmpleado()

    const handleLogout = async () => {
        await supabase.auth.signOut()
        navigate('/login')
    }

    const links = [
        { to: '/dashboard', label: 'Dashboard' },
        { to: '/productos', label: 'Productos' },
        { to: '/inventario', label: 'Inventario' },
        { to: '/ventas', label: 'Ventas' },
        { to: '/clientes', label: 'Clientes' },
    ]

    return (
        <aside className="w-64 min-h-screen bg-gray-900 text-white flex flex-col">
            <div className="px-6 py-5 border-b border-gray-700">
                <h1 className="text-xl font-bold">ERP</h1>
            </div>

            <nav className="flex-1 px-4 py-6 flex flex-col gap-1">
                {links.map(link => (
                    <NavLink
                        key={link.to}
                        to={link.to}
                        className={({ isActive }) =>
                            `px-4 py-2 rounded-lg text-sm transition ${
                                isActive ? 'bg-blue-600 text-white' : 'text-gray-300 hover:bg-gray-700'
                            }`
                        }
                    >
                        {link.label}
                    </NavLink>
                ))}
            </nav>

            <div className="px-4 py-4 border-t border-gray-700">
                {empleado && (
                    <div className="mb-3 px-2">
                        <p className="text-white text-sm font-medium">{empleado.nombre}</p>
                        <p className="text-gray-400 text-xs">{empleado.roles?.nombre}</p>
                        <p className="text-gray-400 text-xs">{empleado.empleados_sucursales?.map(es => es.sucursales?.nombre).join(', ')}
                        </p>
                    </div>
                )}
                <button
                    className="w-full bg-red-500 text-white px-4 py-2 rounded-lg hover:bg-red-600 transition text-sm"
                    onClick={handleLogout}
                >
                    Cerrar sesión
                </button>
            </div>
        </aside>
    )
}