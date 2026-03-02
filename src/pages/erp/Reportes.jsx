import Layout from '../../components/Layout'
import { useReportes } from '../../hooks/useReportes'
import { formatMoneda } from '../../utils/formatMoneda'
import {
    BarChart, Bar, XAxis, YAxis, CartesianGrid,
    Tooltip, ResponsiveContainer, LineChart, Line
} from 'recharts'

export default function Reportes() {
    const {
        ventasDiarias,
        productosVendidos,
        inventarioBajo,
        sucursales,
        loading,
        filtros,
        setFiltros,
    } = useReportes()

    const totalVentas = ventasDiarias.reduce((acc, d) => acc + Number(d.total_ventas), 0)

    const totalesReporte = (() => {
        const totales = {}
        ventasDiarias.forEach(d => {
            const suc = sucursales?.find(s => s.nombre === d.sucursal)
            const moneda = suc?.moneda ?? 'USD'
            const simbolo = suc?.simbolo ?? '$'
            if (!totales[moneda]) totales[moneda] = { moneda, simbolo, total: 0 }
            totales[moneda].total += Number(d.total_monto)
        })
        return Object.values(totales)
    })()

    const datosGrafico = ventasDiarias.map(d => ({
        fecha: new Date(d.fecha).toLocaleDateString('es', { month: 'short', day: 'numeric' }),
        monto: Number(d.total_monto),
        ventas: Number(d.total_ventas),
    }))

    return (
        <Layout>
            <div className="mb-6">
                <h2 className="text-2xl font-bold text-gray-800">Reportes</h2>
            </div>

            {/* Filtros */}
            <div className="bg-white rounded-lg shadow-sm p-4 mb-6 flex flex-wrap gap-4 items-end">
                <div>
                    <label className="text-sm font-medium text-gray-700 mb-1 block">Desde</label>
                    <input
                        className="border border-gray-300 rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                        type="date"
                        value={filtros.fechaInicio}
                        onChange={(e) => setFiltros({ ...filtros, fechaInicio: e.target.value })}
                    />
                </div>
                <div>
                    <label className="text-sm font-medium text-gray-700 mb-1 block">Hasta</label>
                    <input
                        className="border border-gray-300 rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                        type="date"
                        value={filtros.fechaFin}
                        onChange={(e) => setFiltros({ ...filtros, fechaFin: e.target.value })}
                    />
                </div>
                <div>
                    <label className="text-sm font-medium text-gray-700 mb-1 block">Sucursal</label>
                    <select
                        className="border border-gray-300 rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                        value={filtros.sucursalId}
                        onChange={(e) => setFiltros({ ...filtros, sucursalId: e.target.value })}
                    >
                        <option value="">Todas las sucursales</option>
                        {sucursales.map(s => (
                            <option key={s.id} value={s.id}>{s.nombre}</option>
                        ))}
                    </select>
                </div>
            </div>

            {/* Tarjetas resumen */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
                <div className="bg-white rounded-lg shadow-sm p-6">
                    <h3 className="text-gray-500 text-sm">Total vendido</h3>
                    {loading ? (
                        <p className="text-gray-400 mt-2">...</p>
                    ) : totalesReporte.length === 0 ? (
                        <p className="text-3xl font-bold text-gray-800 mt-2">$0.00</p>
                    ) : (
                        totalesReporte.map(t => (
                            <p key={t.moneda} className="text-2xl font-bold text-green-600 mt-1">
                                {formatMoneda(t.total, t.moneda, t.simbolo)}
                            </p>
                        ))
                    )}
                </div>
                <div className="bg-white rounded-lg shadow-sm p-6">
                    <h3 className="text-gray-500 text-sm">Número de ventas</h3>
                    <p className="text-3xl font-bold text-gray-800 mt-2">
                        {loading ? '...' : totalVentas}
                    </p>
                </div>
                <div className="bg-white rounded-lg shadow-sm p-6">
                    <h3 className="text-gray-500 text-sm">Productos con stock bajo</h3>
                    <p className={`text-3xl font-bold mt-2 ${inventarioBajo.length > 0 ? 'text-red-500' : 'text-gray-800'}`}>
                        {loading ? '...' : inventarioBajo.length}
                    </p>
                </div>
            </div>

            {/* Gráficos */}
            {/* 1. Ventas por día */}
            <div className="bg-white rounded-lg shadow-sm p-6 mb-6">
                <h3 className="font-bold text-gray-800 mb-4">Ventas por día</h3>
                {loading ? (
                    <p className="text-gray-500">Cargando...</p>
                ) : datosGrafico.length === 0 ? (
                    <p className="text-gray-500">No hay ventas en este período.</p>
                ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        {(() => {
                            const datosUSD = ventasDiarias
                                .filter(d => (sucursales?.find(s => s.nombre === d.sucursal)?.moneda ?? 'USD') === 'USD')
                                .sort((a, b) => new Date(a.fecha) - new Date(b.fecha))
                                .map(d => ({
                                    fecha: new Date(d.fecha).toLocaleDateString('es', { month: 'short', day: 'numeric' }),
                                    monto: Number(d.total_monto),
                                }))

                            return datosUSD.length === 0 ? null : (
                                <div>
                                    <p className="text-sm font-medium text-gray-500 mb-2">Dólares (USD)</p>
                                    <ResponsiveContainer width="100%" height={200}>
                                        <LineChart data={datosUSD}>
                                            <CartesianGrid strokeDasharray="3 3" />
                                            <XAxis dataKey="fecha" tick={{ fontSize: 11 }} />
                                            <YAxis tick={{ fontSize: 11 }} />
                                            <Tooltip formatter={(value) => formatMoneda(value, 'USD', '$')} />
                                            <Line type="monotone" dataKey="monto" stroke="#2563eb" strokeWidth={2} dot={{ r: 3 }} name="Monto" />
                                        </LineChart>
                                    </ResponsiveContainer>
                                </div>
                            )
                        })()}

                        {(() => {
                            const datosCOP = ventasDiarias
                                .filter(d => sucursales?.find(s => s.nombre === d.sucursal)?.moneda === 'COP')
                                .sort((a, b) => new Date(a.fecha) - new Date(b.fecha))
                                .map(d => ({
                                    fecha: new Date(d.fecha).toLocaleDateString('es', { month: 'short', day: 'numeric' }),
                                    monto: Number(d.total_monto),
                                }))

                            return datosCOP.length === 0 ? null : (
                                <div>
                                    <p className="text-sm font-medium text-gray-500 mb-2">Pesos colombianos (COP)</p>
                                    <ResponsiveContainer width="100%" height={200}>
                                        <LineChart data={datosCOP}>
                                            <CartesianGrid strokeDasharray="3 3" />
                                            <XAxis dataKey="fecha" tick={{ fontSize: 11 }} />
                                            <YAxis tick={{ fontSize: 11 }} />
                                            <Tooltip formatter={(value) => formatMoneda(value, 'COP', 'COP$')} />
                                            <Line type="monotone" dataKey="monto" stroke="#16a34a" strokeWidth={2} dot={{ r: 3 }} name="Monto" />
                                        </LineChart>
                                    </ResponsiveContainer>
                                </div>
                            )
                        })()}
                    </div>
                )}
            </div>

            {/* 2. Productos más vendidos */}
            <div className="bg-white rounded-lg shadow-sm p-6 mb-6">
                <h3 className="font-bold text-gray-800 mb-4">Productos más vendidos</h3>
                {loading ? (
                    <p className="text-gray-500">Cargando...</p>
                ) : productosVendidos.length === 0 ? (
                    <p className="text-gray-500">No hay datos aún.</p>
                ) : (
                    <ResponsiveContainer width="100%" height={250}>
                        <BarChart data={productosVendidos.slice(0, 10)}>
                            <CartesianGrid strokeDasharray="3 3" />
                            <XAxis
                                dataKey="producto"
                                tick={{ fontSize: 11 }}
                                tickFormatter={(value, index) => {
                                    const item = productosVendidos[index]
                                    return item?.codigo ? `${item.codigo}` : value
                                }}
                            />
                            <YAxis tick={{ fontSize: 12 }} />
                            <Tooltip
                                formatter={(value) => [value, 'Unidades']}
                                labelFormatter={(label, payload) => {
                                    const item = payload?.[0]?.payload
                                    return item ? `${item.codigo} - ${item.producto}` : label
                                }}
                            />
                            <Bar dataKey="total_vendido" fill="#2563eb" name="Unidades" />
                        </BarChart>
                    </ResponsiveContainer>
                )}
            </div>

            {/* 3. Inventario bajo */}
            <div className="bg-white rounded-lg shadow-sm overflow-hidden">
                <div className="px-6 py-4 border-b border-gray-100">
                    <h3 className="font-bold text-gray-800">Productos con stock bajo</h3>
                    <p className="text-gray-400 text-xs mt-1">Productos con 50 o menos unidades</p>
                </div>
                {loading ? (
                    <p className="p-6 text-gray-500">Cargando...</p>
                ) : inventarioBajo.length === 0 ? (
                    <p className="p-6 text-gray-500">✅ Todo el inventario está bien.</p>
                ) : (
                    <table className="w-full text-sm">
                        <thead className="bg-gray-50 text-gray-500 uppercase text-xs">
                        <tr>
                            <th className="px-6 py-3 text-left">Producto</th>
                            <th className="px-6 py-3 text-left">Sucursal</th>
                            <th className="px-6 py-3 text-left">Stock</th>
                        </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100">
                        {inventarioBajo.map((item, index) => (
                            <tr key={index} className="hover:bg-gray-50">
                                <td className="px-6 py-4 font-medium text-gray-800">{item.producto}</td>
                                <td className="px-6 py-4 text-gray-600">{item.sucursal}</td>
                                <td className="px-6 py-4">
                                    <span className={`font-bold ${item.cantidad === 0 ? 'text-red-600' : 'text-yellow-600'}`}>
                                      {item.cantidad}
                                    </span>
                                </td>
                            </tr>
                        ))}
                        </tbody>
                    </table>
                )}
            </div>
        </Layout>
    )
}