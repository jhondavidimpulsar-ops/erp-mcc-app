import { useAuth } from '../../context/AuthContext'
import { useDashboard } from '../../hooks/useDashboard'
import { useEmpleado } from '../../hooks/useEmpleado'
import Layout from '../../components/Layout'

export default function Dashboard() {
    const { user } = useAuth()
    const { stats, ventasRecientes, loading } = useDashboard()
    const { empleado } = useEmpleado()

    return (
        <Layout>
            <div className="mb-6">
                <h2 className="text-2xl font-bold text-gray-800">Dashboard</h2>
                <p className="text-gray-500 text-sm mt-1">
                    Bienvenido, {empleado?.nombre ?? user?.email}
                </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
                <div className="bg-white rounded-lg shadow-sm p-6">
                    <h3 className="text-gray-500 text-sm">Productos</h3>
                    <p className="text-3xl font-bold text-gray-800 mt-2">
                        {loading ? '...' : stats.productos}
                    </p>
                </div>
                <div className="bg-white rounded-lg shadow-sm p-6">
                    <h3 className="text-gray-500 text-sm">Ventas hoy</h3>
                    <p className="text-3xl font-bold text-gray-800 mt-2">
                        {loading ? '...' : stats.ventasHoy}
                    </p>
                </div>
                <div className="bg-white rounded-lg shadow-sm p-6">
                    <h3 className="text-gray-500 text-sm">Total vendido hoy</h3>
                    <p className="text-3xl font-bold text-green-600 mt-2">
                        {loading ? '...' : `$${stats.totalHoy.toFixed(2)}`}
                    </p>
                </div>
                <div className="bg-white rounded-lg shadow-sm p-6">
                    <h3 className="text-gray-500 text-sm">Clientes</h3>
                    <p className="text-3xl font-bold text-gray-800 mt-2">
                        {loading ? '...' : stats.clientes}
                    </p>
                </div>
            </div>

            <div className="bg-white rounded-lg shadow-sm overflow-hidden">
                <div className="px-6 py-4 border-b border-gray-100">
                    <h3 className="font-bold text-gray-800">Ventas recientes</h3>
                </div>
                {loading ? (
                    <p className="p-6 text-gray-500">Cargando...</p>
                ) : ventasRecientes.length === 0 ? (
                    <p className="p-6 text-gray-500">No hay ventas registradas aún.</p>
                ) : (
                    <table className="w-full text-sm">
                        <thead className="bg-gray-50 text-gray-500 uppercase text-xs">
                        <tr>
                            <th className="px-6 py-3 text-left">Cliente</th>
                            <th className="px-6 py-3 text-left">Sucursal</th>
                            <th className="px-6 py-3 text-left">Pago</th>
                            <th className="px-6 py-3 text-left">Total</th>
                            <th className="px-6 py-3 text-left">Fecha</th>
                        </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100">
                        {ventasRecientes.map(venta => {
                            const total = venta.ventas_detalle?.reduce(
                                (acc, d) => acc + d.productos?.precio * d.cantidad, 0
                            )
                            return (
                                <tr key={venta.id} className="hover:bg-gray-50">
                                    <td className="px-6 py-4 text-gray-800">{venta.clientes?.nombre ?? '—'}</td>
                                    <td className="px-6 py-4 text-gray-600">{venta.sucursales?.nombre ?? '—'}</td>
                                    <td className="px-6 py-4 text-gray-600">{venta.tipo_pago?.nombre ?? '—'}</td>
                                    <td className="px-6 py-4 font-medium text-gray-800">${total?.toFixed(2) ?? '0.00'}</td>
                                    <td className="px-6 py-4 text-gray-600">
                                        {new Date(venta.created_at).toLocaleDateString()}
                                    </td>
                                </tr>
                            )
                        })}
                        </tbody>
                    </table>
                )}
            </div>
        </Layout>
    )
}