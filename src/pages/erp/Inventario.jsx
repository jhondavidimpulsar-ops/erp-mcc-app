import { useState } from 'react'
import Layout from '../../components/Layout'
import { useInventario } from '../../hooks/useInventario'
import jsPDF from 'jspdf'
import autoTable from 'jspdf-autotable'
import * as XLSX from 'xlsx'

export default function Inventario() {
    const { inventario, loading, ajustarCantidad } = useInventario()
    const [editando, setEditando] = useState(null)
    const [cantidad, setCantidad] = useState('')
    const [busqueda, setBusqueda] = useState('')
    const [filtroStock, setFiltroStock] = useState('todos')
    const [umbralStock, setUmbralStock] = useState(10)

    const handleAjustar = async (id) => {
        const { error } = await ajustarCantidad(id, cantidad)
        if (!error) {
            setEditando(null)
            setCantidad('')
        }
    }

    const inventarioFiltrado = inventario.filter(item => {
        const matchBusqueda =
            item.productos?.nombre?.toLowerCase().includes(busqueda.toLowerCase()) ||
            item.productos?.codigo?.toLowerCase().includes(busqueda.toLowerCase())

        const matchStock =
            filtroStock === 'todos' ? true :
                filtroStock === 'sin_stock' ? item.cantidad === 0 :
                    filtroStock === 'stock_bajo' ? item.cantidad > 0 && item.cantidad <= umbralStock :
                        item.cantidad > umbralStock

        return matchBusqueda && matchStock
    })

    const generarPDF = () => {
        const doc = new jsPDF()

        // Encabezado
        doc.setFontSize(18)
        doc.setTextColor(31, 41, 55)
        doc.text('Reporte de Inventario', 14, 20)

        doc.setFontSize(10)
        doc.setTextColor(107, 114, 128)
        doc.text(`Generado: ${new Date().toLocaleDateString()} ${new Date().toLocaleTimeString()}`, 14, 28)
        doc.text(`Total productos: ${inventarioFiltrado.length}`, 14, 34)

        const costoTotal = inventarioFiltrado.reduce((acc, item) => {
            return acc + (item.productos?.costo ?? 0) * item.cantidad
        }, 0)
        doc.text(`Valor total en inventario: $${costoTotal.toFixed(2)}`, 14, 40)

        // Tabla
        autoTable(doc, {
            startY: 48,
            head: [['Código', 'Producto', 'Sucursal', 'Cantidad', 'Costo unit.', 'Total costo']],
            body: inventarioFiltrado.map(item => [
                item.productos?.codigo ?? '—',
                item.productos?.nombre ?? '—',
                item.sucursales?.nombre ?? '—',
                item.cantidad,
                `$${(item.productos?.costo ?? 0).toFixed(2)}`,
                `$${((item.productos?.costo ?? 0) * item.cantidad).toFixed(2)}`,
            ]),
            styles: { fontSize: 8 },
            headStyles: { fillColor: [37, 99, 235], textColor: 255 },
            alternateRowStyles: { fillColor: [249, 250, 251] },
        })

        doc.save(`inventario_${new Date().toISOString().split('T')[0]}.pdf`)
    }

    const exportarExcel = () => {
        const datos = inventarioFiltrado.map(item => ({
            'Código': item.productos?.codigo ?? '—',
            'Producto': item.productos?.nombre ?? '—',
            'Sucursal': item.sucursales?.nombre ?? '—',
            'Cantidad': item.cantidad,
            'Costo unitario': item.productos?.costo ?? 0,
            'Total costo': (item.productos?.costo ?? 0) * item.cantidad,
        }))

        const worksheet = XLSX.utils.json_to_sheet(datos)
        const workbook = XLSX.utils.book_new()
        XLSX.utils.book_append_sheet(workbook, worksheet, 'Inventario')

        // Ajustar ancho de columnas
        worksheet['!cols'] = [
            { wch: 12 },
            { wch: 40 },
            { wch: 20 },
            { wch: 10 },
            { wch: 15 },
            { wch: 15 },
        ]

        XLSX.writeFile(workbook, `inventario_${new Date().toISOString().split('T')[0]}.xlsx`)
    }

    const imprimirReporte = () => {
        const costoTotal = inventarioFiltrado.reduce((acc, item) => {
            return acc + (item.productos?.costo ?? 0) * item.cantidad
        }, 0)

        const ventana = window.open('', '_blank')
        ventana.document.write(`
            <html>
            <head>
                <title>Reporte de Inventario</title>
                <style>
                    body { font-family: Arial, sans-serif; padding: 20px; color: #1f2937; }
                    h1 { font-size: 20px; margin-bottom: 4px; }
                    p { font-size: 12px; color: #6b7280; margin: 2px 0; }
                    table { width: 100%; border-collapse: collapse; margin-top: 16px; font-size: 11px; }
                    th { background: #2563eb; color: white; padding: 8px; text-align: left; }
                    td { padding: 7px 8px; border-bottom: 1px solid #e5e7eb; }
                    tr:nth-child(even) { background: #f9fafb; }
                    .total { margin-top: 12px; font-weight: bold; font-size: 13px; }
                </style>
            </head>
            <body>
                <h1>Reporte de Inventario</h1>
                <p>Generado: ${new Date().toLocaleDateString()} ${new Date().toLocaleTimeString()}</p>
                <p>Total productos: ${inventarioFiltrado.length}</p>
                <p>Valor total en inventario: $${costoTotal.toFixed(2)}</p>
                <table>
                    <thead>
                        <tr>
                            <th>Código</th>
                            <th>Producto</th>
                            <th>Sucursal</th>
                            <th>Cantidad</th>
                            <th>Costo unit.</th>
                            <th>Total costo</th>
                        </tr>
                    </thead>
                    <tbody>
                        ${inventarioFiltrado.map(item => `
                            <tr>
                                <td>${item.productos?.codigo ?? '—'}</td>
                                <td>${item.productos?.nombre ?? '—'}</td>
                                <td>${item.sucursales?.nombre ?? '—'}</td>
                                <td>${item.cantidad}</td>
                                <td>$${(item.productos?.costo ?? 0).toFixed(2)}</td>
                                <td>$${((item.productos?.costo ?? 0) * item.cantidad).toFixed(2)}</td>
                            </tr>
                        `).join('')}
                    </tbody>
                </table>
                <p class="total">Valor total: $${costoTotal.toFixed(2)}</p>
            </body>
            </html>
        `)
        ventana.document.close()
        ventana.print()
    }

    return (
        <Layout>
            <div className="flex justify-between items-center mb-6">
                <h2 className="text-2xl font-bold text-gray-800">Inventario</h2>
                <div className="flex gap-2">
                    <button
                        className="bg-gray-700 text-white px-4 py-2 rounded-lg hover:bg-gray-800 transition text-sm"
                        onClick={imprimirReporte}
                    >
                        🖨️ Imprimir
                    </button>
                    <button
                        className="bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 transition text-sm"
                        onClick={exportarExcel}
                    >
                        📊 Excel
                    </button>
                    <button
                        className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition text-sm"
                        onClick={generarPDF}
                    >
                        📄 PDF
                    </button>
                </div>
            </div>

            {/* Filtros */}
            <div>
                <label className="text-xs font-medium text-gray-500 mb-1 block">Filtrar por stock</label>
                <div className="flex gap-2">
                    <select
                        className="border border-gray-300 rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
                        value={filtroStock}
                        onChange={(e) => setFiltroStock(e.target.value)}
                    >
                        <option value="todos">Todos</option>
                        <option value="sin_stock">Sin stock</option>
                        <option value="stock_bajo">Stock bajo</option>
                        <option value="stock_ok">Stock OK</option>
                    </select>
                    {(filtroStock === 'stock_bajo' || filtroStock === 'stock_ok') && (
                        <div className="flex items-center gap-1">
                            <label className="text-xs text-gray-500">Umbral:</label>
                            <input
                                type="number"
                                min="1"
                                value={umbralStock}
                                onChange={(e) => setUmbralStock(Number(e.target.value))}
                                className="border border-gray-300 rounded-lg px-3 py-2 w-20 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                            />
                        </div>
                    )}
                </div>
            </div>

            {/* Tabla */}
            <div className="bg-white rounded-lg shadow-sm overflow-hidden">
                {loading ? (
                    <p className="p-6 text-gray-500">Cargando inventario...</p>
                ) : inventarioFiltrado.length === 0 ? (
                    <p className="p-6 text-gray-500">No hay productos que coincidan.</p>
                ) : (
                    <table className="w-full text-sm">
                        <thead className="bg-gray-50 text-gray-500 uppercase text-xs">
                        <tr>
                            <th className="px-6 py-3 text-left">Producto</th>
                            <th className="px-6 py-3 text-left">Código</th>
                            <th className="px-6 py-3 text-left">Sucursal</th>
                            <th className="px-6 py-3 text-right">Costo unit.</th>
                            <th className="px-6 py-3 text-right">Total costo</th>
                            <th className="px-6 py-3 text-center">Cantidad</th>
                            <th className="px-6 py-3 text-left">Ajuste</th>
                        </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100">
                        {inventarioFiltrado.map(item => (
                            <tr key={item.id} className="hover:bg-gray-50">
                                <td className="px-6 py-4 font-medium text-gray-800">
                                    {item.productos?.nombre ?? '—'}
                                </td>
                                <td className="px-6 py-4 text-gray-600">
                                    {item.productos?.codigo ?? '—'}
                                </td>
                                <td className="px-6 py-4 text-gray-600">
                                    {item.sucursales?.nombre ?? '—'}
                                </td>
                                <td className="px-6 py-4 text-right text-gray-600">
                                    ${(item.productos?.costo ?? 0).toFixed(2)}
                                </td>
                                <td className="px-6 py-4 text-right font-medium text-gray-800">
                                    ${((item.productos?.costo ?? 0) * item.cantidad).toFixed(2)}
                                </td>
                                <td className="px-6 py-4 text-center">
                                        <span className={`font-bold ${
                                            item.cantidad === 0
                                                ? 'text-red-500'
                                                : item.cantidad <= 10
                                                    ? 'text-yellow-500'
                                                    : 'text-green-600'
                                        }`}>
                                            {item.cantidad}
                                        </span>
                                </td>
                                <td className="px-6 py-4">
                                    {editando === item.id ? (
                                        <div className="flex gap-2 items-center">
                                            <input
                                                className="border border-gray-300 rounded-lg px-3 py-1 w-24 focus:outline-none focus:ring-2 focus:ring-blue-500"
                                                type="number"
                                                value={cantidad}
                                                onChange={(e) => setCantidad(e.target.value)}
                                                min="0"
                                            />
                                            <button
                                                className="text-green-600 hover:underline text-xs"
                                                onClick={() => handleAjustar(item.id)}
                                            >
                                                Guardar
                                            </button>
                                            <button
                                                className="text-gray-400 hover:underline text-xs"
                                                onClick={() => setEditando(null)}
                                            >
                                                Cancelar
                                            </button>
                                        </div>
                                    ) : (
                                        <button
                                            className="text-blue-600 hover:underline text-xs"
                                            onClick={() => { setEditando(item.id); setCantidad(item.cantidad) }}
                                        >
                                            Ajustar
                                        </button>
                                    )}
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