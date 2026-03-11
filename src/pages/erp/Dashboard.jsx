import { useAuth } from '../../context/AuthContext'
import { useDashboard } from '../../hooks/useDashboard'
import { useEmpleado } from '../../hooks/useEmpleado'
import { formatMoneda } from '../../utils/formatMoneda'
import Layout from '../../components/Layout'

export default function Dashboard() {
    const { user } = useAuth()
    const {
        stats,
        ventasRecientes,
        sucursales,
        sucursalFiltro,
        setSucursalFiltro,
        stockBajo,
        umbral,
        setUmbral,
        loading
    } = useDashboard()
    const { empleado } = useEmpleado()

    return (
        <Layout>
            <div className="mb-6 flex justify-between items-center">
                <div>
                    <h2 className="text-2xl font-bold text-gray-800">Dashboard</h2>
                    <p className="text-gray-500 text-sm mt-1">
                        Bienvenido, {empleado?.nombre ?? user?.email}
                    </p>
                </div>
                <select
                    className="border border-gray-300 rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
                    value={sucursalFiltro}
                    onChange={(e) => setSucursalFiltro(e.target.value)}
                >
                    <option value="">Todas las sucursales</option>
                    {sucursales.map(s => (
                        <option key={s.id} value={s.id}>{s.nombre}</option>
                    ))}
                </select>
            </div>

            {/* Stats */}
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
                    {loading ? (
                        <p className="text-gray-400 mt-2">...</p>
                    ) : stats.totalesHoy.length === 0 ? (
                        <p className="text-3xl font-bold text-gray-800 mt-2">$0.00</p>
                    ) : (
                        stats.totalesHoy.map(t => (
                            <p key={t.moneda} className="text-2xl font-bold text-green-600 mt-1">
                                {formatMoneda(t.total, t.moneda, t.simbolo)}
                            </p>
                        ))
                    )}
                </div>
                <div className="bg-white rounded-lg shadow-sm p-6">
                    <h3 className="text-gray-500 text-sm">Clientes</h3>
                    <p className="text-3xl font-bold text-gray-800 mt-2">
                        {loading ? '...' : stats.clientes}
                    </p>
                </div>
            </div>

            {/* Ventas recientes + Stock bajo */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">

                {/* Ventas recientes */}
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
                                <th className="px-6 py-3 text-left">Pago</th>
                                <th className="px-6 py-3 text-left">Total</th>
                                <th className="px-6 py-3 text-left">Fecha</th>
                            </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-100">
                            {ventasRecientes.map(venta => {
                                const sucVenta = sucursales?.find(s => s.id === venta.sucursales_id)
                                const monedaVenta = sucVenta?.moneda ?? 'USD'
                                const simboloVenta = sucVenta?.simbolo ?? '$'
                                const total = venta.ventas_detalle?.reduce(
                                    (acc, d) => acc + d.productos?.precio * d.cantidad, 0
                                )
                                return (
                                    <tr key={venta.id} className="hover:bg-gray-50">
                                        <td className="px-6 py-4 text-gray-800">{venta.clientes?.nombre ?? '—'}</td>
                                        <td className="px-6 py-4 text-gray-600">{venta.tipo_pago?.nombre ?? '—'}</td>
                                        <td className="px-6 py-4 font-medium text-gray-800">
                                            {formatMoneda(total, monedaVenta, simboloVenta)}
                                        </td>
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

                {/* Stock bajo */}
                <div className="bg-white rounded-lg shadow-sm overflow-hidden">
                    <div className="px-6 py-4 border-b border-gray-100 flex justify-between items-center">
                        <div className="flex items-center gap-2">
                            <h3 className="font-bold text-gray-800">⚠️ Stock bajo</h3>
                            {stockBajo.length > 0 && (
                                <span className="bg-red-100 text-red-700 text-xs font-medium px-2 py-0.5 rounded-full">
                                    {stockBajo.length}
                                </span>
                            )}
                        </div>
                        <div className="flex items-center gap-2">
                            <label className="text-xs text-gray-500">Umbral:</label>
                            <input
                                type="number"
                                min="1"
                                value={umbral}
                                onChange={(e) => setUmbral(Number(e.target.value))}
                                className="border border-gray-300 rounded-lg px-3 py-1 w-20 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                            />
                        </div>
                    </div>
                    {stockBajo.length === 0 ? (
                        <div className="p-6 text-center">
                            <p className="text-green-600 font-medium text-sm">✅ Todo el stock está bien</p>
                            <p className="text-gray-400 text-xs mt-1">
                                No hay productos por debajo de {umbral} unidades
                            </p>
                        </div>
                    ) : (
                        <table className="w-full text-sm">
                            <thead className="bg-gray-50 text-gray-500 uppercase text-xs">
                            <tr>
                                <th className="px-6 py-3 text-left">Producto</th>
                                <th className="px-6 py-3 text-left">Código</th>
                                <th className="px-6 py-3 text-right">Stock</th>
                            </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-100">
                            {stockBajo.map((item, index) => (
                                <tr key={index} className="hover:bg-gray-50">
                                    <td className="px-6 py-3 text-gray-800 truncate max-w-32">
                                        {item.productos?.nombre ?? '—'}
                                    </td>
                                    <td className="px-6 py-3 text-gray-500 text-xs">
                                        {item.productos?.codigo ?? '—'}
                                    </td>
                                    <td className="px-6 py-3 text-right">
                                            <span className={`font-bold ${
                                                item.cantidad === 0
                                                    ? 'text-red-600'
                                                    : item.cantidad <= 3
                                                        ? 'text-orange-500'
                                                        : 'text-yellow-500'
                                            }`}>
                                                {item.cantidad}
                                            </span>
                                    </td>
                                </tr>
                            ))}
                            </tbody>
                        </table>
                    )}
                </div>
            </div>
        </Layout>
    )
}