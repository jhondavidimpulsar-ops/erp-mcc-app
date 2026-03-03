import { useState, useEffect } from 'react'
import Layout from '../../components/Layout'
import { usePedidos } from '../../hooks/usePedidos'
import { formatMoneda } from '../../utils/formatMoneda'
import { supabase } from '../../supabaseClient'

const ESTADOS = [
    { id: 'pendiente', label: 'Pendiente', color: 'bg-yellow-100 text-yellow-700' },
    { id: 'pagado', label: 'Pagado', color: 'bg-blue-100 text-blue-700' },
    { id: 'en_camino', label: 'En camino', color: 'bg-purple-100 text-purple-700' },
    { id: 'entregado', label: 'Entregado', color: 'bg-green-100 text-green-700' },
    { id: 'cancelado', label: 'Cancelado', color: 'bg-red-100 text-red-700' },
]

export default function Pedidos() {
    const { pedidos, loading, actualizarEstado } = usePedidos()
    const [filtro, setFiltro] = useState('pendiente')
    const [actualizando, setActualizando] = useState(null)
    const [pagoForm, setPagoForm] = useState(null)
    const [tipoPagoId, setTipoPagoId] = useState('')
    const [tiposPago, setTiposPago] = useState([])

    useEffect(() => {
        fetchTiposPago()
    }, [])

    async function fetchTiposPago() {
        const { data } = await supabase
            .from('tipo_pago')
            .select('*')
            .neq('nombre', 'pendiente')
            .neq('nombre', 'credito')
        if (data) setTiposPago(data)
    }

    const handleEstado = async (id, estado) => {
        setActualizando(id)
        await actualizarEstado(id, estado)
        setActualizando(null)
    }

    const pedidosFiltrados = pedidos.filter(p =>
        filtro === 'todos' ? true : p.estado === filtro
    )

    const getBadge = (estado) => {
        const e = ESTADOS.find(e => e.id === estado)
        return e
            ? <span className={`px-3 py-1 rounded-full text-xs font-medium ${e.color}`}>{e.label}</span>
            : <span className="px-3 py-1 rounded-full text-xs font-medium bg-gray-100 text-gray-600">{estado}</span>
    }

    return (
        <Layout>
            <div className="mb-6">
                <h2 className="text-2xl font-bold text-gray-800">Pedidos Online</h2>
                <p className="text-gray-500 text-sm mt-1">Pedidos recibidos desde la tienda e-commerce</p>
            </div>

            {/* Tarjetas resumen */}
            <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mb-6">
                {ESTADOS.map(e => (
                    <div key={e.id} className="bg-white rounded-lg shadow-sm p-4 text-center">
                        <p className="text-2xl font-bold text-gray-800">
                            {pedidos.filter(p => p.estado === e.id).length}
                        </p>
                        <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${e.color}`}>
              {e.label}
            </span>
                    </div>
                ))}
            </div>

            {/* Filtros */}
            <div className="flex gap-2 mb-6 flex-wrap">
                <button
                    className={`px-4 py-2 rounded-lg text-sm font-medium transition ${
                        filtro === 'todos'
                            ? 'bg-blue-600 text-white'
                            : 'bg-white text-gray-600 hover:bg-gray-50 shadow-sm'
                    }`}
                    onClick={() => setFiltro('todos')}
                >
                    Todos
                </button>
                {ESTADOS.map(e => (
                    <button
                        key={e.id}
                        className={`px-4 py-2 rounded-lg text-sm font-medium transition ${
                            filtro === e.id
                                ? 'bg-blue-600 text-white'
                                : 'bg-white text-gray-600 hover:bg-gray-50 shadow-sm'
                        }`}
                        onClick={() => setFiltro(e.id)}
                    >
                        {e.label}
                        {pedidos.filter(p => p.estado === e.id).length > 0 && (
                            <span className="ml-2 bg-blue-100 text-blue-700 px-1.5 py-0.5 rounded-full text-xs">
                {pedidos.filter(p => p.estado === e.id).length}
              </span>
                        )}
                    </button>
                ))}
            </div>

            {/* Lista de pedidos */}
            <div className="flex flex-col gap-4">
                {loading ? (
                    <p className="text-gray-500">Cargando pedidos...</p>
                ) : pedidosFiltrados.length === 0 ? (
                    <p className="text-gray-500">No hay pedidos en este estado.</p>
                ) : (
                    pedidosFiltrados.map(pedido => {
                        const total = pedido.ventas_detalle?.reduce(
                            (acc, d) => acc + d.productos?.precio * d.cantidad, 0
                        ) ?? 0
                        const costo = pedido.ventas_detalle?.reduce(
                            (acc, d) => acc + (d.productos?.costo ?? 0) * d.cantidad, 0
                        ) ?? 0
                        const moneda = pedido.sucursales?.moneda ?? 'USD'
                        const simbolo = pedido.sucursales?.simbolo ?? '$'

                        return (
                            <div key={pedido.id} className="bg-white rounded-lg shadow-sm p-6">
                                <div className="flex justify-between items-start mb-4">
                                    <div>
                                        <div className="flex items-center gap-3 mb-1">
                                            <h3 className="font-bold text-gray-800">
                                                {pedido.clientes?.nombre}
                                            </h3>
                                            {getBadge(pedido.estado)}
                                        </div>
                                        <p className="text-gray-500 text-xs">
                                            Pedido #{pedido.id.slice(0, 8).toUpperCase()} ·{' '}
                                            {new Date(pedido.created_at).toLocaleDateString()} ·{' '}
                                            {pedido.sucursales?.nombre ?? '—'}
                                        </p>
                                    </div>
                                    <p className="font-bold text-gray-900 text-lg">
                                        {formatMoneda(total, moneda, simbolo)}
                                    </p>
                                </div>

                                {/* Productos */}
                                <div className="bg-gray-50 rounded-lg p-3 mb-4">
                                    <p className="text-xs font-medium text-gray-500 mb-2">Productos</p>
                                    <div className="flex flex-col gap-1">
                                        {pedido.ventas_detalle?.map((item, index) => (
                                            <div key={index} className="flex justify-between text-sm">
                        <span className="text-gray-600">
                          {item.productos?.nombre} x{item.cantidad}
                        </span>
                                                <span className="font-medium text-gray-800">
                          {formatMoneda(item.productos?.precio * item.cantidad, moneda, simbolo)}
                        </span>
                                            </div>
                                        ))}
                                    </div>
                                </div>

                                {/* Datos cliente */}
                                <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-4 text-xs">
                                    <div>
                                        <p className="text-gray-400">Correo</p>
                                        <p className="text-gray-700">{pedido.clientes?.correo ?? '—'}</p>
                                    </div>
                                    <div>
                                        <p className="text-gray-400">Teléfono</p>
                                        <p className="text-gray-700">{pedido.clientes?.telefono ?? '—'}</p>
                                    </div>
                                    <div>
                                        <p className="text-gray-400">Dirección</p>
                                        <p className="text-gray-700">{pedido.clientes?.direccion ?? '—'}</p>
                                    </div>
                                    {pedido.notas && (
                                        <div>
                                            <p className="text-gray-400">Notas</p>
                                            <p className="text-gray-700">{pedido.notas}</p>
                                        </div>
                                    )}
                                </div>

                                {/* Acciones */}
                                {pedido.estado !== 'entregado' && pedido.estado !== 'cancelado' && (
                                    <div className="flex gap-2 flex-wrap items-center">

                                        {/* Pendiente → confirmar pago */}
                                        {pedido.estado === 'pendiente' && (
                                            pagoForm === pedido.id ? (
                                                <div className="flex gap-2 items-center flex-wrap">
                                                    <select
                                                        className="border border-gray-300 rounded-lg px-4 py-2 text-xs focus:outline-none focus:ring-2 focus:ring-blue-500"
                                                        value={tipoPagoId}
                                                        onChange={(e) => setTipoPagoId(e.target.value)}
                                                    >
                                                        <option value="">Método de pago</option>
                                                        {tiposPago.map(tp => (
                                                            <option key={tp.id} value={tp.id}>{tp.nombre}</option>
                                                        ))}
                                                    </select>
                                                    <button
                                                        className="bg-blue-600 text-white px-4 py-2 rounded-lg text-xs font-medium hover:bg-blue-700 transition"
                                                        disabled={!tipoPagoId || actualizando === pedido.id}
                                                        onClick={async () => {
                                                            if (!tipoPagoId) return
                                                            setActualizando(pedido.id)

                                                            await supabase
                                                                .from('ventas')
                                                                .update({ tipo_pago_id: tipoPagoId })
                                                                .eq('id', pedido.id)

                                                            await supabase.rpc('registrar_asiento_venta', {
                                                                p_venta_id: pedido.id,
                                                                p_total: total,
                                                                p_costo: costo,
                                                                p_sucursal_id: pedido.sucursales_id ?? null,
                                                            })

                                                            await actualizarEstado(pedido.id, 'pagado')
                                                            setPagoForm(null)
                                                            setTipoPagoId('')
                                                            setActualizando(null)
                                                        }}
                                                    >
                                                        ✓ Confirmar pago
                                                    </button>
                                                    <button
                                                        className="bg-gray-200 text-gray-700 px-4 py-2 rounded-lg text-xs hover:bg-gray-300 transition"
                                                        onClick={() => { setPagoForm(null); setTipoPagoId('') }}
                                                    >
                                                        Cancelar
                                                    </button>
                                                </div>
                                            ) : (
                                                <button
                                                    className="bg-blue-600 text-white px-4 py-2 rounded-lg text-xs font-medium hover:bg-blue-700 transition"
                                                    onClick={() => setPagoForm(pedido.id)}
                                                >
                                                    💳 Confirmar pago
                                                </button>
                                            )
                                        )}

                                        {/* Pagado → en camino */}
                                        {pedido.estado === 'pagado' && (
                                            <button
                                                className="bg-purple-600 text-white px-4 py-2 rounded-lg text-xs font-medium hover:bg-purple-700 transition"
                                                onClick={() => handleEstado(pedido.id, 'en_camino')}
                                                disabled={actualizando === pedido.id}
                                            >
                                                🚚 Marcar en camino
                                            </button>
                                        )}

                                        {/* En camino → entregado */}
                                        {pedido.estado === 'en_camino' && (
                                            <button
                                                className="bg-green-600 text-white px-4 py-2 rounded-lg text-xs font-medium hover:bg-green-700 transition"
                                                onClick={() => handleEstado(pedido.id, 'entregado')}
                                                disabled={actualizando === pedido.id}
                                            >
                                                ✓ Marcar entregado
                                            </button>
                                        )}

                                        <button
                                            className="bg-red-100 text-red-600 px-4 py-2 rounded-lg text-xs font-medium hover:bg-red-200 transition"
                                            onClick={() => handleEstado(pedido.id, 'cancelado')}
                                            disabled={actualizando === pedido.id}
                                        >
                                            ✕ Cancelar
                                        </button>
                                    </div>
                                )}
                            </div>
                        )
                    })
                )}
            </div>
        </Layout>
    )
}