import { useState } from 'react'
import Layout from '../../components/Layout'
import { useVentas } from '../../hooks/useVentas'
import { useClientes } from '../../hooks/useClientes'
import { useProductos } from '../../hooks/useProductos'
import { useEmpleado } from '../../hooks/useEmpleado'
import { supabase } from '../../supabaseClient'

export default function Ventas() {
    const { ventas, loading, registrarVenta, eliminarVenta } = useVentas()
    const { clientes } = useClientes()
    const { productos } = useProductos()
    const { empleado } = useEmpleado()

    const [mostrarForm, setMostrarForm] = useState(false)
    const [sucursalId, setSucursalId] = useState('')
    const [clienteId, setClienteId] = useState('')
    const [busquedaCliente, setBusquedaCliente] = useState('')
    const [tipoPagoId, setTipoPagoId] = useState('')
    const [tiposPago, setTiposPago] = useState([])
    const [carrito, setCarrito] = useState([])
    const [productoSeleccionado, setProductoSeleccionado] = useState('')
    const [busquedaProducto, setBusquedaProducto] = useState('')
    const [mostrarSugerencias, setMostrarSugerencias] = useState(false)
    const [cantidad, setCantidad] = useState(1)
    const [error, setError] = useState(null)
    const [exito, setExito] = useState(false)

    const fetchTiposPago = async () => {
        const { data } = await supabase.from('tipo_pago').select('*')
        if (data) setTiposPago(data)
    }

    const handleAbrirForm = () => {
        fetchTiposPago()
        setMostrarForm(true)
    }

    const handleSeleccionarProducto = (producto) => {
        setProductoSeleccionado(producto.id)
        setBusquedaProducto(`${producto.codigo} - ${producto.nombre}`)
        setMostrarSugerencias(false)
    }

    const handleAgregarAlCarrito = () => {
        if (!productoSeleccionado) return

        const producto = productos.find(p => p.id === productoSeleccionado)
        if (!producto) return

        const existente = carrito.find(item => item.productos_id === productoSeleccionado)
        if (existente) {
            setCarrito(carrito.map(item =>
                item.productos_id === productoSeleccionado
                    ? { ...item, cantidad: item.cantidad + Number(cantidad) }
                    : item
            ))
        } else {
            setCarrito([...carrito, {
                productos_id: producto.id,
                nombre: producto.nombre,
                codigo: producto.codigo,
                precio: producto.precio,
                costo: producto.costo,  // ← agregar esta línea
                cantidad: Number(cantidad),
            }])
        }

        setProductoSeleccionado('')
        setBusquedaProducto('')
        setCantidad(1)
        setMostrarSugerencias(false)
    }

    const handleKeyDownProducto = (e) => {
        if (e.key === 'Enter') {
            e.preventDefault()
            handleAgregarAlCarrito()
        }
    }

    const handleEliminarDelCarrito = (productos_id) => {
        setCarrito(carrito.filter(item => item.productos_id !== productos_id))
    }

    const total = carrito.reduce((acc, item) => acc + item.precio * item.cantidad, 0)

    const handleConfirmar = async () => {
        setError(null)
        if (!sucursalId) return setError('Selecciona una sucursal.')
        if (!clienteId) return setError('Selecciona un cliente.')
        if (carrito.length === 0) return setError('Agrega al menos un producto.')
        if (!tipoPagoId) return setError('Selecciona un método de pago.')
        if (!empleado) return setError('No se encontró el empleado.')

        const venta = {
            clientes_id: clienteId,
            empleados_id: empleado.id,
            sucursales_id: sucursalId,
            tipo_pago_id: tipoPagoId,
        }

        const { error } = await registrarVenta(venta, carrito)
        if (error) { setError(error.message); return }

        setExito(true)
        setTimeout(() => {
            setExito(false)
            setMostrarForm(false)
            setCarrito([])
            setClienteId('')
            setTipoPagoId('')
            setBusquedaCliente('')
            setBusquedaProducto('')
            setSucursalId('')
        }, 2000)
    }

    const handleCancelar = () => {
        setMostrarForm(false)
        setCarrito([])
        setClienteId('')
        setTipoPagoId('')
        setBusquedaCliente('')
        setBusquedaProducto('')
        setSucursalId('')
        setError(null)
    }

    const productosFiltrados = productos.filter(p =>
        p.nombre.toLowerCase().includes(busquedaProducto.toLowerCase()) ||
        p.codigo?.toLowerCase().includes(busquedaProducto.toLowerCase())
    )

    const clientesFiltrados = clientes.filter(c =>
        c.nombre.toLowerCase().includes(busquedaCliente.toLowerCase()) ||
        c.cedula?.includes(busquedaCliente)
    )

    return (
        <Layout>
            <div className="flex justify-between items-center mb-6">
                <h2 className="text-2xl font-bold text-gray-800">Ventas</h2>
                {!mostrarForm && (
                    <button
                        className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition text-sm"
                        onClick={handleAbrirForm}
                    >
                        + Nueva venta
                    </button>
                )}
            </div>

            {mostrarForm && (
                <div className="bg-white rounded-lg shadow-sm p-6 mb-6 flex flex-col gap-6">
                    <h3 className="text-lg font-bold text-gray-800">Nueva venta</h3>

                    {exito && (
                        <div className="bg-green-100 text-green-700 px-4 py-3 rounded-lg text-sm">
                            ✅ Venta registrada correctamente
                        </div>
                    )}

                    {/* Fila superior: Sucursal + Cliente */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                            <label className="text-sm font-medium text-gray-700 mb-1 block">Sucursal</label>
                            <select
                                className="border border-gray-300 rounded-lg px-4 py-2 w-full focus:outline-none focus:ring-2 focus:ring-blue-500"
                                value={sucursalId}
                                onChange={(e) => setSucursalId(e.target.value)}
                            >
                                <option value="">Selecciona una sucursal</option>
                                {empleado?.empleados_sucursales?.map(es => (
                                    <option key={es.sucursales?.id} value={es.sucursales?.id}>
                                        {es.sucursales?.nombre}
                                    </option>
                                ))}
                            </select>
                        </div>

                        <div>
                            <label className="text-sm font-medium text-gray-700 mb-1 block">Cliente</label>
                            <input
                                className="border border-gray-300 rounded-lg px-4 py-2 w-full focus:outline-none focus:ring-2 focus:ring-blue-500"
                                placeholder="Buscar por nombre o cédula..."
                                value={busquedaCliente}
                                onChange={(e) => { setBusquedaCliente(e.target.value); setClienteId('') }}
                            />
                            {busquedaCliente && !clienteId && (
                                <div className="border border-gray-200 rounded-lg max-h-40 overflow-y-auto mt-1">
                                    {clientesFiltrados.length === 0 ? (
                                        <p className="px-4 py-2 text-gray-400 text-sm">No se encontraron clientes</p>
                                    ) : (
                                        clientesFiltrados.map(c => (
                                            <div
                                                key={c.id}
                                                className="px-4 py-2 hover:bg-gray-50 cursor-pointer text-sm"
                                                onClick={() => { setClienteId(c.id); setBusquedaCliente(c.nombre) }}
                                            >
                                                {c.nombre} — {c.cedula ?? 'Sin cédula'}
                                            </div>
                                        ))
                                    )}
                                </div>
                            )}
                            {clienteId && (
                                <p className="text-green-600 text-xs mt-1">✅ Cliente seleccionado</p>
                            )}
                        </div>
                    </div>

                    {/* Agregar productos */}
                    <div>
                        <label className="text-sm font-medium text-gray-700 mb-1 block">
                            Agregar producto <span className="text-gray-400 font-normal">(Enter para agregar)</span>
                        </label>
                        <div className="flex gap-2 items-start">
                            <div className="flex flex-col flex-1">
                                <input
                                    className="border border-gray-300 rounded-lg px-4 py-2 w-full focus:outline-none focus:ring-2 focus:ring-blue-500"
                                    placeholder="Buscar por nombre o código..."
                                    value={busquedaProducto}
                                    onChange={(e) => {
                                        setBusquedaProducto(e.target.value)
                                        setProductoSeleccionado('')
                                        setMostrarSugerencias(true)
                                    }}
                                    onKeyDown={handleKeyDownProducto}
                                    onFocus={() => setMostrarSugerencias(true)}
                                />
                                {mostrarSugerencias && busquedaProducto && (
                                    <div className="border border-gray-200 rounded-lg max-h-48 overflow-y-auto mt-1 z-10 bg-white shadow-md">
                                        {productosFiltrados.length === 0 ? (
                                            <p className="px-4 py-2 text-gray-400 text-sm">No se encontraron productos</p>
                                        ) : (
                                            productosFiltrados.map(p => (
                                                <div
                                                    key={p.id}
                                                    className="px-4 py-2 hover:bg-blue-50 cursor-pointer text-sm flex justify-between items-center"
                                                    onMouseDown={(e) => e.preventDefault()}
                                                    onClick={() => handleSeleccionarProducto(p)}
                                                >
                                                    <span>{p.codigo} - {p.nombre}</span>
                                                    <span className="text-gray-500 ml-4">${p.precio}</span>
                                                </div>
                                            ))
                                        )}
                                    </div>
                                )}
                            </div>
                            <input
                                className="border border-gray-300 rounded-lg px-4 py-2 w-24 focus:outline-none focus:ring-2 focus:ring-blue-500"
                                type="number"
                                min="1"
                                value={cantidad}
                                onChange={(e) => setCantidad(e.target.value)}
                                onKeyDown={handleKeyDownProducto}
                            />
                            <button
                                className="bg-gray-800 text-white px-4 py-2 rounded-lg hover:bg-gray-900 transition text-sm whitespace-nowrap"
                                onClick={handleAgregarAlCarrito}
                            >
                                Agregar
                            </button>
                        </div>
                    </div>

                    {/* Carrito */}
                    {carrito.length > 0 && (
                        <div>
                            <label className="text-sm font-medium text-gray-700 mb-2 block">Productos en la venta</label>
                            <table className="w-full text-sm mb-2">
                                <thead className="bg-gray-50 text-gray-500 uppercase text-xs">
                                <tr>
                                    <th className="px-4 py-2 text-left">Codigo</th>
                                    <th className="px-4 py-2 text-left">Producto</th>
                                    <th className="px-4 py-2 text-left">Cantidad</th>
                                    <th className="px-4 py-2 text-left">Precio</th>
                                    <th className="px-4 py-2 text-left">Subtotal</th>
                                    <th className="px-4 py-2"></th>
                                </tr>
                                </thead>
                                <tbody className="divide-y divide-gray-100">
                                {carrito.map(item => (
                                    <tr key={item.productos_id}>
                                        <td className="px-4 py-2">{item.codigo}</td>
                                        <td className="px-4 py-2">{item.nombre}</td>
                                        <td className="px-4 py-2">{item.cantidad}</td>
                                        <td className="px-4 py-2">${item.precio}</td>
                                        <td className="px-4 py-2 font-medium">${(item.precio * item.cantidad).toFixed(2)}</td>
                                        <td className="px-4 py-2">
                                            <button
                                                className="text-red-500 hover:underline text-xs"
                                                onClick={() => handleEliminarDelCarrito(item.productos_id)}
                                            >
                                                Quitar
                                            </button>
                                        </td>
                                    </tr>
                                ))}
                                </tbody>
                            </table>
                            <p className="text-right font-bold text-gray-800 text-lg">Total: ${total.toFixed(2)}</p>
                        </div>
                    )}

                    {/* Método de pago */}
                    <div>
                        <label className="text-sm font-medium text-gray-700 mb-1 block">Método de pago</label>
                        <select
                            className="border border-gray-300 rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                            value={tipoPagoId}
                            onChange={(e) => setTipoPagoId(e.target.value)}
                        >
                            <option value="">Selecciona un método</option>
                            {tiposPago.map(tp => (
                                <option key={tp.id} value={tp.id}>{tp.nombre}</option>
                            ))}
                        </select>
                    </div>

                    {error && <p className="text-red-500 text-sm">{error}</p>}

                    <div className="flex gap-3">
                        <button
                            className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 transition text-sm"
                            onClick={handleConfirmar}
                        >
                            Confirmar venta
                        </button>
                        <button
                            className="bg-gray-200 text-gray-700 px-6 py-2 rounded-lg hover:bg-gray-300 transition text-sm"
                            onClick={handleCancelar}
                        >
                            Cancelar
                        </button>
                    </div>
                </div>
            )}

            {/* Historial */}
            <div className="bg-white rounded-lg shadow-sm overflow-hidden">
                {loading ? (
                    <p className="p-6 text-gray-500">Cargando ventas...</p>
                ) : ventas.length === 0 ? (
                    <p className="p-6 text-gray-500">No hay ventas registradas aún.</p>
                ) : (
                    <table className="w-full text-sm">
                        <thead className="bg-gray-50 text-gray-500 uppercase text-xs">
                        <tr>
                            <th className="px-6 py-3 text-left">Cliente</th>
                            <th className="px-6 py-3 text-left">Sucursal</th>
                            <th className="px-6 py-3 text-left">Empleado</th>
                            <th className="px-6 py-3 text-left">Pago</th>
                            <th className="px-6 py-3 text-left">Total</th>
                            <th className="px-6 py-3 text-left">Fecha</th>
                            <th className="px-6 py-3 text-left">Acciones</th>
                        </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100">
                        {ventas.map(venta => {
                            const totalVenta = venta.ventas_detalle?.reduce(
                                (acc, d) => acc + d.productos?.precio * d.cantidad, 0
                            )
                            return (
                                <tr key={venta.id} className="hover:bg-gray-50">
                                    <td className="px-6 py-4 text-gray-800">{venta.clientes?.nombre ?? '—'}</td>
                                    <td className="px-6 py-4 text-gray-600">{venta.sucursales?.nombre ?? '—'}</td>
                                    <td className="px-6 py-4 text-gray-600">{venta.empleados?.nombre ?? '—'}</td>
                                    <td className="px-6 py-4 text-gray-600">{venta.tipo_pago?.nombre ?? '—'}</td>
                                    <td className="px-6 py-4 font-medium text-gray-800">${totalVenta?.toFixed(2) ?? '0.00'}</td>
                                    <td className="px-6 py-4 text-gray-600">
                                        {new Date(venta.created_at).toLocaleDateString()}
                                    </td>
                                    <td className="px-6 py-4">
                                        <button className="text-red-500 hover:underline text-xs"
                                            onClick={() => eliminarVenta(venta)}
                                        >
                                            Eliminar
                                        </button>
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