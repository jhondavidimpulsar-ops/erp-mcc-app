import { useState } from 'react'
import Layout from '../../components/Layout'
import { useVentas } from '../../hooks/useVentas'
import { useClientes } from '../../hooks/useClientes'
import { useProductos } from '../../hooks/useProductos'
import { useEmpleado } from '../../hooks/useEmpleado'
import { supabase } from '../../supabaseClient'
import jsPDF from 'jspdf'
import autoTable from 'jspdf-autotable'
import * as XLSX from 'xlsx'

export default function Ventas() {
    const { ventas, loading, registrarVenta, cancelarVenta } = useVentas()
    const { clientes, fetchClientes } = useClientes()
    const { productos } = useProductos()
    const { empleado } = useEmpleado()

    // Form nueva venta
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
    const [cancelando, setCancelando] = useState(null)

    // Form cliente rápido
    const [mostrarFormCliente, setMostrarFormCliente] = useState(false)
    const [formCliente, setFormCliente] = useState({
        nombre: '',
        cedula: '',
        telefono: '',
        correo: '',
    })
    const [creandoCliente, setCreandoCliente] = useState(false)

    // Búsqueda historial
    const [busquedaHistorial, setBusquedaHistorial] = useState('')
    const [fechaInicio, setFechaInicio] = useState('')
    const [fechaFin, setFechaFin] = useState('')

    const fetchTiposPago = async () => {
        const { data } = await supabase
            .from('tipo_pago')
            .select('*')
            .neq('nombre', 'pendiente')
            .neq('nombre', 'credito')
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
                costo: producto.costo,
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

    const handleCancelarForm = () => {
        setMostrarForm(false)
        setCarrito([])
        setClienteId('')
        setTipoPagoId('')
        setBusquedaCliente('')
        setBusquedaProducto('')
        setSucursalId('')
        setMostrarFormCliente(false)
        setError(null)
    }

    const handleCancelarVenta = async (id) => {
        setCancelando(id)
        await cancelarVenta(id)
        setCancelando(null)
    }

    const handleCrearCliente = async () => {
        if (!formCliente.nombre) return setError('El nombre es obligatorio.')
        setCreandoCliente(true)

        const { data, error } = await supabase
            .from('clientes')
            .insert({
                nombre: formCliente.nombre,
                cedula: formCliente.cedula || null,
                telefono: formCliente.telefono || null,
                correo: formCliente.correo || null,
            })
            .select()
            .single()

        if (error) {
            setError(error.message)
            setCreandoCliente(false)
            return
        }

        await fetchClientes()
        setClienteId(data.id)
        setBusquedaCliente(data.nombre)
        setMostrarFormCliente(false)
        setFormCliente({ nombre: '', cedula: '', telefono: '', correo: '' })
        setCreandoCliente(false)
    }

    const ventasFiltradas = ventas.filter(venta => {
        const nombreCliente = venta.clientes?.nombre?.toLowerCase() ?? ''
        const matchBusqueda = nombreCliente.includes(busquedaHistorial.toLowerCase())
        const fecha = new Date(venta.created_at)
        const matchInicio = fechaInicio ? fecha >= new Date(fechaInicio) : true
        const matchFin = fechaFin ? fecha <= new Date(fechaFin + 'T23:59:59') : true
        return matchBusqueda && matchInicio && matchFin
    })

    const productosFiltrados = productos.filter(p =>
        p.nombre.toLowerCase().includes(busquedaProducto.toLowerCase()) ||
        p.codigo?.toLowerCase().includes(busquedaProducto.toLowerCase())
    )

    const clientesFiltrados = clientes.filter(c =>
        c.nombre.toLowerCase().includes(busquedaCliente.toLowerCase()) ||
        c.cedula?.includes(busquedaCliente)
    )

    const generarPDF = () => {
        const doc = new jsPDF()

        doc.setFontSize(18)
        doc.setTextColor(31, 41, 55)
        doc.text('Reporte de Ventas', 14, 20)

        doc.setFontSize(10)
        doc.setTextColor(107, 114, 128)
        doc.text(`Generado: ${new Date().toLocaleDateString()} ${new Date().toLocaleTimeString()}`, 14, 28)
        doc.text(`Total ventas: ${ventasFiltradas.length}`, 14, 34)

        const totalGeneral = ventasFiltradas
            .filter(v => v.estado !== 'cancelada')
            .reduce((acc, v) => acc + (v.ventas_detalle?.reduce(
                (a, d) => a + (d.precio ?? d.productos?.precio ?? 0) * d.cantidad, 0
            ) ?? 0), 0)
        doc.text(`Total general: $${totalGeneral.toFixed(2)}`, 14, 40)

        autoTable(doc, {
            startY: 48,
            head: [['Cliente', 'Sucursal', 'Empleado', 'Pago', 'Origen', 'Total', 'Fecha', 'Estado']],
            body: ventasFiltradas.map(venta => {
                const totalVenta = venta.ventas_detalle?.reduce(
                    (acc, d) => acc + (d.precio ?? d.productos?.precio ?? 0) * d.cantidad, 0
                )
                return [
                    venta.clientes?.nombre ?? '—',
                    venta.sucursales?.nombre ?? '—',
                    venta.empleados?.nombre ?? '—',
                    venta.tipo_pago?.nombre ?? '—',
                    venta.origen === 'ecommerce' ? 'Online' : 'ERP',
                    `$${totalVenta?.toFixed(2) ?? '0.00'}`,
                    new Date(venta.created_at).toLocaleDateString(),
                    venta.estado ?? 'completada',
                ]
            }),
            styles: { fontSize: 7 },
            headStyles: { fillColor: [37, 99, 235], textColor: 255 },
            alternateRowStyles: { fillColor: [249, 250, 251] },
        })

        doc.save(`ventas_${new Date().toISOString().split('T')[0]}.pdf`)
    }

    const exportarExcel = () => {
        const datos = ventasFiltradas.map(venta => {
            const totalVenta = venta.ventas_detalle?.reduce(
                (acc, d) => acc + (d.precio ?? d.productos?.precio ?? 0) * d.cantidad, 0
            )
            return {
                'Cliente': venta.clientes?.nombre ?? '—',
                'Sucursal': venta.sucursales?.nombre ?? '—',
                'Empleado': venta.empleados?.nombre ?? '—',
                'Método de pago': venta.tipo_pago?.nombre ?? '—',
                'Origen': venta.origen === 'ecommerce' ? 'Online' : 'ERP',
                'Total': totalVenta?.toFixed(2) ?? '0.00',
                'Fecha': new Date(venta.created_at).toLocaleDateString(),
                'Estado': venta.estado ?? 'completada',
                'Productos': venta.ventas_detalle?.map(d => d.productos?.nombre).join(', ') ?? '—',
            }
        })

        const worksheet = XLSX.utils.json_to_sheet(datos)
        const workbook = XLSX.utils.book_new()
        XLSX.utils.book_append_sheet(workbook, worksheet, 'Ventas')

        worksheet['!cols'] = [
            { wch: 25 }, { wch: 20 }, { wch: 20 }, { wch: 15 },
            { wch: 10 }, { wch: 12 }, { wch: 12 }, { wch: 12 }, { wch: 50 },
        ]

        XLSX.writeFile(workbook, `ventas_${new Date().toISOString().split('T')[0]}.xlsx`)
    }

    const generarFactura = (venta) => {
        const doc = new jsPDF()
        const totalVenta = venta.ventas_detalle?.reduce(
            (acc, d) => acc + (d.precio ?? d.productos?.precio ?? 0) * d.cantidad, 0
        ) ?? 0

        // ── Encabezado ──────────────────────────────────────────
        doc.setFillColor(37, 99, 235)
        doc.rect(0, 0, 220, 35, 'F')

        doc.setTextColor(255, 255, 255)
        doc.setFontSize(20)
        doc.setFont('helvetica', 'bold')
        doc.text('FACTURA / RECIBO', 14, 15)

        doc.setFontSize(10)
        doc.setFont('helvetica', 'normal')
        doc.text('MCC Mccraft Tools', 14, 23)
        doc.text(`Fecha: ${new Date(venta.created_at).toLocaleDateString()}`, 14, 29)

        // Número de factura (esquina derecha)
        doc.setFontSize(11)
        doc.setFont('helvetica', 'bold')
        doc.text(`# ${venta.id.slice(0, 8).toUpperCase()}`, 150, 20)

        // ── Datos cliente y venta ────────────────────────────────
        doc.setTextColor(31, 41, 55)
        doc.setFontSize(11)
        doc.setFont('helvetica', 'bold')
        doc.text('Datos del cliente', 14, 48)

        doc.setFont('helvetica', 'normal')
        doc.setFontSize(10)
        doc.text(`Nombre: ${venta.clientes?.nombre ?? '—'}`, 14, 56)
        doc.text(`Sucursal: ${venta.sucursales?.nombre ?? '—'}`, 14, 62)
        doc.text(`Atendido por: ${venta.empleados?.nombre ?? '—'}`, 14, 68)
        doc.text(`Método de pago: ${venta.tipo_pago?.nombre ?? '—'}`, 14, 74)
        doc.text(`Origen: ${venta.origen === 'ecommerce' ? 'Tienda Online' : 'ERP'}`, 14, 80)

        // ── Tabla de productos ───────────────────────────────────
        autoTable(doc, {
            startY: 90,
            head: [['Código', 'Producto', 'Cant.', 'Precio unit.', 'Subtotal']],
            body: venta.ventas_detalle?.map(d => {
                const precio = d.precio ?? d.productos?.precio ?? 0
                return [
                    d.productos?.codigo ?? '—',
                    d.productos?.nombre ?? '—',
                    d.cantidad,
                    `$${Number(precio).toFixed(2)}`,
                    `$${(precio * d.cantidad).toFixed(2)}`,
                ]
            }) ?? [],
            styles: { fontSize: 9 },
            headStyles: { fillColor: [37, 99, 235], textColor: 255 },
            alternateRowStyles: { fillColor: [249, 250, 251] },
            columnStyles: {
                0: { cellWidth: 25 },
                1: { cellWidth: 80 },
                2: { cellWidth: 15, halign: 'center' },
                3: { cellWidth: 30, halign: 'right' },
                4: { cellWidth: 30, halign: 'right' },
            },
        })

        // ── Total ────────────────────────────────────────────────
        const finalY = doc.lastAutoTable.finalY + 8
        doc.setDrawColor(229, 231, 235)
        doc.line(14, finalY, 196, finalY)

        doc.setFontSize(13)
        doc.setFont('helvetica', 'bold')
        doc.setTextColor(31, 41, 55)
        doc.text('TOTAL:', 140, finalY + 10)
        doc.setTextColor(37, 99, 235)
        doc.text(`$${totalVenta.toFixed(2)}`, 175, finalY + 10)

        // ── Estado ───────────────────────────────────────────────
        if (venta.estado === 'cancelada') {
            doc.setTextColor(220, 38, 38)
            doc.setFontSize(28)
            doc.setFont('helvetica', 'bold')
            doc.setGState(new doc.GState({ opacity: 0.15 }))
            doc.text('CANCELADA', 45, 160, { angle: 35 })
            doc.setGState(new doc.GState({ opacity: 1 }))
        }

        // ── Pie de página ────────────────────────────────────────
        doc.setTextColor(156, 163, 175)
        doc.setFontSize(8)
        doc.setFont('helvetica', 'normal')
        doc.text('Gracias por su compra — MCC Mccraft Tools', 14, 280)
        doc.text(`Generado el ${new Date().toLocaleString()}`, 14, 285)

        doc.save(`factura_${venta.id.slice(0, 8)}.pdf`)
    }

    return (
        <Layout>
            <div className="flex justify-between items-center mb-6">
                <h2 className="text-2xl font-bold text-gray-800">Ventas</h2>
                <div className="flex gap-2">
                    {!mostrarForm && (
                        <>
                            <button
                                className="bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 transition text-sm"
                                onClick={exportarExcel}
                            >
                                📊 Excel
                            </button>
                            <button
                                className="bg-gray-700 text-white px-4 py-2 rounded-lg hover:bg-gray-800 transition text-sm"
                                onClick={generarPDF}
                            >
                                📄 PDF
                            </button>
                            <button
                                className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition text-sm"
                                onClick={handleAbrirForm}
                            >
                                + Nueva venta
                            </button>
                        </>
                    )}
                </div>
            </div>

            {/* Formulario nueva venta */}
            {mostrarForm && (
                <div className="bg-white rounded-lg shadow-sm p-6 mb-6 flex flex-col gap-6">
                    <h3 className="text-lg font-bold text-gray-800">Nueva venta</h3>

                    {exito && (
                        <div className="bg-green-100 text-green-700 px-4 py-3 rounded-lg text-sm">
                            ✅ Venta registrada correctamente
                        </div>
                    )}

                    {/* Sucursal + Cliente */}
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
                                <div className="border border-gray-200 rounded-lg max-h-40 overflow-y-auto mt-1 bg-white shadow-md z-10">
                                    {clientesFiltrados.length === 0 ? (
                                        <div className="px-4 py-2">
                                            <p className="text-gray-400 text-sm mb-2">No se encontraron clientes</p>
                                            <button
                                                className="text-blue-600 text-sm hover:underline"
                                                onClick={() => {
                                                    setMostrarFormCliente(true)
                                                    setFormCliente({ nombre: busquedaCliente, cedula: '', telefono: '', correo: '' })
                                                }}
                                            >
                                                + Crear cliente "{busquedaCliente}"
                                            </button>
                                        </div>
                                    ) : (
                                        <>
                                            {clientesFiltrados.map(c => (
                                                <div
                                                    key={c.id}
                                                    className="px-4 py-2 hover:bg-gray-50 cursor-pointer text-sm"
                                                    onClick={() => { setClienteId(c.id); setBusquedaCliente(c.nombre) }}
                                                >
                                                    {c.nombre} — {c.cedula ?? 'Sin cédula'}
                                                </div>
                                            ))}
                                            <div className="px-4 py-2 border-t border-gray-100">
                                                <button
                                                    className="text-blue-600 text-sm hover:underline"
                                                    onClick={() => {
                                                        setMostrarFormCliente(true)
                                                        setFormCliente({ nombre: busquedaCliente, cedula: '', telefono: '', correo: '' })
                                                    }}
                                                >
                                                    + Crear nuevo cliente
                                                </button>
                                            </div>
                                        </>
                                    )}
                                </div>
                            )}
                            {clienteId && (
                                <p className="text-green-600 text-xs mt-1">✅ Cliente seleccionado</p>
                            )}

                            {/* Form cliente rápido */}
                            {mostrarFormCliente && (
                                <div className="border border-blue-200 rounded-lg p-4 mt-2 bg-blue-50">
                                    <h4 className="text-sm font-medium text-blue-800 mb-3">Nuevo cliente</h4>
                                    <div className="flex flex-col gap-2">
                                        <input
                                            className="border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                                            placeholder="Nombre *"
                                            value={formCliente.nombre}
                                            onChange={(e) => setFormCliente({ ...formCliente, nombre: e.target.value })}
                                        />
                                        <input
                                            className="border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                                            placeholder="Cédula / RUC"
                                            value={formCliente.cedula}
                                            onChange={(e) => setFormCliente({ ...formCliente, cedula: e.target.value })}
                                        />
                                        <input
                                            className="border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                                            placeholder="Teléfono"
                                            value={formCliente.telefono}
                                            onChange={(e) => setFormCliente({ ...formCliente, telefono: e.target.value })}
                                        />
                                        <input
                                            className="border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                                            placeholder="Correo"
                                            value={formCliente.correo}
                                            onChange={(e) => setFormCliente({ ...formCliente, correo: e.target.value })}
                                        />
                                        <div className="flex gap-2">
                                            <button
                                                className="bg-blue-600 text-white px-4 py-2 rounded-lg text-sm hover:bg-blue-700 transition disabled:opacity-50"
                                                onClick={handleCrearCliente}
                                                disabled={creandoCliente}
                                            >
                                                {creandoCliente ? 'Creando...' : 'Crear cliente'}
                                            </button>
                                            <button
                                                className="bg-gray-200 text-gray-700 px-4 py-2 rounded-lg text-sm hover:bg-gray-300 transition"
                                                onClick={() => setMostrarFormCliente(false)}
                                            >
                                                Cancelar
                                            </button>
                                        </div>
                                    </div>
                                </div>
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
                            onClick={handleCancelarForm}
                        >
                            Cancelar
                        </button>
                    </div>
                </div>
            )}

            {/* Búsqueda historial */}
            <div className="bg-white rounded-lg shadow-sm p-4 mb-4 flex flex-wrap gap-4 items-end">
                <div className="flex-1 min-w-48">
                    <label className="text-xs font-medium text-gray-500 mb-1 block">Buscar por cliente</label>
                    <input
                        className="border border-gray-300 rounded-lg px-4 py-2 w-full focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
                        placeholder="Nombre del cliente..."
                        value={busquedaHistorial}
                        onChange={(e) => setBusquedaHistorial(e.target.value)}
                    />
                </div>
                <div>
                    <label className="text-xs font-medium text-gray-500 mb-1 block">Desde</label>
                    <input
                        className="border border-gray-300 rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
                        type="date"
                        value={fechaInicio}
                        onChange={(e) => setFechaInicio(e.target.value)}
                    />
                </div>
                <div>
                    <label className="text-xs font-medium text-gray-500 mb-1 block">Hasta</label>
                    <input
                        className="border border-gray-300 rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
                        type="date"
                        value={fechaFin}
                        onChange={(e) => setFechaFin(e.target.value)}
                    />
                </div>
                {(busquedaHistorial || fechaInicio || fechaFin) && (
                    <button
                        className="text-sm text-gray-400 hover:text-gray-600"
                        onClick={() => { setBusquedaHistorial(''); setFechaInicio(''); setFechaFin('') }}
                    >
                        Limpiar filtros
                    </button>
                )}
            </div>

            {/* Historial */}
            <div className="bg-white rounded-lg shadow-sm overflow-hidden">
                {loading ? (
                    <p className="p-6 text-gray-500">Cargando ventas...</p>
                ) : ventasFiltradas.length === 0 ? (
                    <p className="p-6 text-gray-500">No hay ventas que coincidan.</p>
                ) : (
                    <table className="w-full text-sm">
                        <thead className="bg-gray-50 text-gray-500 uppercase text-xs">
                        <tr>
                            <th className="px-6 py-3 text-left">Cliente</th>
                            <th className="px-6 py-3 text-left">Sucursal</th>
                            <th className="px-6 py-3 text-left">Empleado</th>
                            <th className="px-6 py-3 text-left">Pago</th>
                            <th className="px-6 py-3 text-left">Origen</th>
                            <th className="px-6 py-3 text-left">Total</th>
                            <th className="px-6 py-3 text-left">Fecha</th>
                            <th className="px-6 py-3 text-left">Estado</th>
                            <th className="px-6 py-3 text-left">Acción</th>
                        </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100">
                        {ventasFiltradas.map(venta => {
                            const totalVenta = venta.ventas_detalle?.reduce(
                                (acc, d) => acc + (d.precio ?? d.productos?.precio ?? 0) * d.cantidad, 0
                            )
                            return (
                                <tr key={venta.id} className="hover:bg-gray-50">
                                    <td className="px-6 py-4 text-gray-800">{venta.clientes?.nombre ?? '—'}</td>
                                    <td className="px-6 py-4 text-gray-600">{venta.sucursales?.nombre ?? '—'}</td>
                                    <td className="px-6 py-4 text-gray-600">{venta.empleados?.nombre ?? '—'}</td>
                                    <td className="px-6 py-4 text-gray-600">{venta.tipo_pago?.nombre ?? '—'}</td>
                                    <td className="px-6 py-4">
                                            <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                                                venta.origen === 'ecommerce'
                                                    ? 'bg-purple-100 text-purple-700'
                                                    : 'bg-blue-100 text-blue-700'
                                            }`}>
                                                {venta.origen === 'ecommerce' ? '🛒 Online' : 'ERP'}
                                            </span>
                                    </td>
                                    <td className="px-6 py-4 font-medium text-gray-800">
                                        ${totalVenta?.toFixed(2) ?? '0.00'}
                                    </td>
                                    <td className="px-6 py-4 text-gray-600">
                                        {new Date(venta.created_at).toLocaleDateString()}
                                    </td>
                                    <td className="px-6 py-4">
                                            <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                                                venta.estado === 'cancelada'
                                                    ? 'bg-red-100 text-red-700'
                                                    : venta.estado === 'completada'
                                                        ? 'bg-green-100 text-green-700'
                                                        : 'bg-yellow-100 text-yellow-700'
                                            }`}>
                                                {venta.estado ?? 'completada'}
                                            </span>
                                    </td>

                                    <td className="px-6 py-4">
                                        <div className="flex gap-2 items-center">
                                            <button
                                                className="text-blue-600 hover:underline text-xs"
                                                onClick={() => generarFactura(venta)}
                                            >
                                                🧾 Factura
                                            </button>
                                            <button
                                                className="text-red-500 hover:underline text-xs disabled:opacity-40"
                                                onClick={() => handleCancelarVenta(venta.id)}
                                                disabled={venta.estado === 'cancelada' || cancelando === venta.id}
                                            >
                                                {cancelando === venta.id
                                                    ? 'Cancelando...'
                                                    : venta.estado === 'cancelada'
                                                        ? 'Cancelada'
                                                        : 'Cancelar'}
                                            </button>
                                        </div>
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