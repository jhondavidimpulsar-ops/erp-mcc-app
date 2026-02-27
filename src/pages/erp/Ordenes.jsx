import { useState } from 'react'
import Layout from '../../components/Layout'
import { useOrdenes } from '../../hooks/useOrdenes'
import { useProductos } from '../../hooks/useProductos'
import { useEmpleado } from '../../hooks/useEmpleado'

export default function Ordenes() {
    const { ordenes, proveedores, loading, crearOrden, recibirOrden, eliminarOrden } = useOrdenes()
    const { productos, sucursales } = useProductos()
    const { empleado } = useEmpleado()

    const [mostrarForm, setMostrarForm] = useState(false)
    const [proveedorId, setProveedorId] = useState('')
    const [sucursalId, setSucursalId] = useState('')
    const [observaciones, setObservaciones] = useState('')
    const [carrito, setCarrito] = useState([])
    const [productoSeleccionado, setProductoSeleccionado] = useState('')
    const [busquedaProducto, setBusquedaProducto] = useState('')
    const [mostrarSugerencias, setMostrarSugerencias] = useState(false)
    const [cantidad, setCantidad] = useState(1)
    const [costo, setCosto] = useState('')
    const [error, setError] = useState(null)
    const [exito, setExito] = useState(false)

    const handleSeleccionarProducto = (producto) => {
        setProductoSeleccionado(producto.id)
        setBusquedaProducto(`${producto.codigo} - ${producto.nombre}`)
        setCosto(producto.costo)
        setMostrarSugerencias(false)
    }

    const handleAgregarAlCarrito = () => {
        if (!productoSeleccionado || !costo) return

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
                cantidad: Number(cantidad),
                costo: Number(costo),
            }])
        }

        setProductoSeleccionado('')
        setBusquedaProducto('')
        setCantidad(1)
        setCosto('')
        setMostrarSugerencias(false)
    }

    const handleKeyDown = (e) => {
        if (e.key === 'Enter') {
            e.preventDefault()
            handleAgregarAlCarrito()
        }
    }

    const totalOrden = carrito.reduce((acc, item) => acc + item.costo * item.cantidad, 0)

    const handleConfirmar = async () => {
        setError(null)
        if (!proveedorId) return setError('Selecciona un proveedor.')
        if (!sucursalId) return setError('Selecciona una sucursal.')
        if (carrito.length === 0) return setError('Agrega al menos un producto.')

        const orden = {
            provedores_id: proveedorId,
            sucursales_id: sucursalId,
            observaciones,
            estado: 'pendiente',
        }

        const { error } = await crearOrden(orden, carrito)
        if (error) { setError(error.message); return }

        setExito(true)
        setTimeout(() => {
            setExito(false)
            setMostrarForm(false)
            setCarrito([])
            setProveedorId('')
            setSucursalId('')
            setObservaciones('')
        }, 1500)
    }

    const handleCancelar = () => {
        setMostrarForm(false)
        setCarrito([])
        setProveedorId('')
        setSucursalId('')
        setObservaciones('')
        setBusquedaProducto('')
        setError(null)
    }

    const productosFiltrados = productos.filter(p =>
        p.nombre.toLowerCase().includes(busquedaProducto.toLowerCase()) ||
        p.codigo?.toLowerCase().includes(busquedaProducto.toLowerCase())
    )

    return (
        <Layout>
            <div className="flex justify-between items-center mb-6">
                <h2 className="text-2xl font-bold text-gray-800">Órdenes de Compra</h2>
                {!mostrarForm && (
                    <button
                        className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition text-sm"
                        onClick={() => setMostrarForm(true)}
                    >
                        + Nueva orden
                    </button>
                )}
            </div>

            {mostrarForm && (
                <div className="bg-white rounded-lg shadow-sm p-6 mb-6 flex flex-col gap-6">
                    <h3 className="text-lg font-bold text-gray-800">Nueva orden de compra</h3>

                    {exito && (
                        <div className="bg-green-100 text-green-700 px-4 py-3 rounded-lg text-sm">
                            ✅ Orden creada correctamente
                        </div>
                    )}

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                            <label className="text-sm font-medium text-gray-700 mb-1 block">Proveedor</label>
                            <select
                                className="border border-gray-300 rounded-lg px-4 py-2 w-full focus:outline-none focus:ring-2 focus:ring-blue-500"
                                value={proveedorId}
                                onChange={(e) => setProveedorId(e.target.value)}
                            >
                                <option value="">Selecciona un proveedor</option>
                                {proveedores.map(p => (
                                    <option key={p.id} value={p.id}>{p.nombre}</option>
                                ))}
                            </select>
                        </div>

                        <div>
                            <label className="text-sm font-medium text-gray-700 mb-1 block">Sucursal destino</label>
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
                    </div>

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
                                    onKeyDown={handleKeyDown}
                                    onFocus={() => setMostrarSugerencias(true)}
                                />
                                {mostrarSugerencias && busquedaProducto && (
                                    <div className="border border-gray-200 rounded-lg max-h-48 overflow-y-auto mt-1 bg-white shadow-md">
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
                                                    <span className="text-gray-500 ml-4">Costo: ${p.costo}</span>
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
                                placeholder="Cant."
                                value={cantidad}
                                onChange={(e) => setCantidad(e.target.value)}
                                onKeyDown={handleKeyDown}
                            />
                            <input
                                className="border border-gray-300 rounded-lg px-4 py-2 w-28 focus:outline-none focus:ring-2 focus:ring-blue-500"
                                type="number"
                                placeholder="Costo"
                                value={costo}
                                onChange={(e) => setCosto(e.target.value)}
                                onKeyDown={handleKeyDown}
                            />
                            <button
                                className="bg-gray-800 text-white px-4 py-2 rounded-lg hover:bg-gray-900 transition text-sm whitespace-nowrap"
                                onClick={handleAgregarAlCarrito}
                            >
                                Agregar
                            </button>
                        </div>
                    </div>

                    {carrito.length > 0 && (
                        <div>
                            <label className="text-sm font-medium text-gray-700 mb-2 block">Productos en la orden</label>
                            <table className="w-full text-sm mb-2">
                                <thead className="bg-gray-50 text-gray-500 uppercase text-xs">
                                <tr>
                                    <th className="px-4 py-2 text-left">Código</th>
                                    <th className="px-4 py-2 text-left">Producto</th>
                                    <th className="px-4 py-2 text-left">Cantidad</th>
                                    <th className="px-4 py-2 text-left">Costo unit.</th>
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
                                        <td className="px-4 py-2">${item.costo}</td>
                                        <td className="px-4 py-2 font-medium">${(item.costo * item.cantidad).toFixed(2)}</td>
                                        <td className="px-4 py-2">
                                            <button
                                                className="text-red-500 hover:underline text-xs"
                                                onClick={() => setCarrito(carrito.filter(i => i.productos_id !== item.productos_id))}
                                            >
                                                Quitar
                                            </button>
                                        </td>
                                    </tr>
                                ))}
                                </tbody>
                            </table>
                            <p className="text-right font-bold text-gray-800 text-lg">Total: ${totalOrden.toFixed(2)}</p>
                        </div>
                    )}

                    <div>
                        <label className="text-sm font-medium text-gray-700 mb-1 block">Observaciones</label>
                        <textarea
                            className="border border-gray-300 rounded-lg px-4 py-2 w-full focus:outline-none focus:ring-2 focus:ring-blue-500"
                            rows={2}
                            placeholder="Notas adicionales..."
                            value={observaciones}
                            onChange={(e) => setObservaciones(e.target.value)}
                        />
                    </div>

                    {error && <p className="text-red-500 text-sm">{error}</p>}

                    <div className="flex gap-3">
                        <button
                            className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 transition text-sm"
                            onClick={handleConfirmar}
                        >
                            Crear orden
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

            <div className="bg-white rounded-lg shadow-sm overflow-hidden">
                {loading ? (
                    <p className="p-6 text-gray-500">Cargando órdenes...</p>
                ) : ordenes.length === 0 ? (
                    <p className="p-6 text-gray-500">No hay órdenes de compra aún.</p>
                ) : (
                    <table className="w-full text-sm">
                        <thead className="bg-gray-50 text-gray-500 uppercase text-xs">
                        <tr>
                            <th className="px-6 py-3 text-left">Proveedor</th>
                            <th className="px-6 py-3 text-left">Sucursal</th>
                            <th className="px-6 py-3 text-left">Productos</th>
                            <th className="px-6 py-3 text-left">Total</th>
                            <th className="px-6 py-3 text-left">Estado</th>
                            <th className="px-6 py-3 text-left">Fecha</th>
                            <th className="px-6 py-3 text-left">Acciones</th>
                        </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100">
                        {ordenes.map(orden => {
                            const total = orden.orden_de_compras_detalle?.reduce(
                                (acc, d) => acc + d.costo * d.cantidad, 0
                            )
                            return (
                                <tr key={orden.id} className="hover:bg-gray-50">
                                    <td className="px-6 py-4 text-gray-800">{orden.provedores?.nombre ?? '—'}</td>
                                    <td className="px-6 py-4 text-gray-600">{orden.sucursales?.nombre ?? '—'}</td>
                                    <td className="px-6 py-4 text-gray-600">
                                        {orden.orden_de_compras_detalle?.map(d => d.productos?.nombre).join(', ')}
                                    </td>
                                    <td className="px-6 py-4 font-medium text-gray-800">${total?.toFixed(2) ?? '0.00'}</td>
                                    <td className="px-6 py-4">
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                          orden.estado === 'recibida'
                              ? 'bg-green-100 text-green-700'
                              : 'bg-yellow-100 text-yellow-700'
                      }`}>
                        {orden.estado}
                      </span>
                                    </td>
                                    <td className="px-6 py-4 text-gray-600">
                                        {new Date(orden.created_at).toLocaleDateString()}
                                    </td>
                                    <td className="px-6 py-4 flex gap-2">
                                        {orden.estado === 'pendiente' && (
                                            <button
                                                className="text-green-600 hover:underline text-xs"
                                                onClick={() => recibirOrden(orden)}
                                            >
                                                Recibir
                                            </button>
                                        )}
                                        {orden.estado === 'pendiente' && (
                                            <button
                                                className="text-red-500 hover:underline text-xs"
                                                onClick={() => eliminarOrden(orden)}
                                            >
                                                Eliminar
                                            </button>
                                        )}
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