import { useState } from 'react'
import Layout from '../../components/Layout'
import { useProductos } from '../../hooks/useProductos'
import { useInventario } from '../../hooks/useInventario'
import jsPDF from 'jspdf'
import autoTable from 'jspdf-autotable'
import * as XLSX from 'xlsx'

export default function Rentabilidad() {
    const { productos, loading } = useProductos()
    const { inventario } = useInventario()
    const [busqueda, setBusqueda] = useState('')
    const [orden, setOrden] = useState('margen_desc')
    const [filtroRentabilidad, setFiltroRentabilidad] = useState('todos')

    const productosCon = productos
        .filter(p => p.precio > 0 && p.costo > 0)
        .map(p => {
            const margen = p.precio - p.costo
            const margenPct = ((margen / p.precio) * 100)
            const stockTotal = inventario
                .filter(i => i.productos_id === p.id)
                .reduce((acc, i) => acc + i.cantidad, 0)
            const valorStock = stockTotal * p.costo
            const gananciaPotencial = stockTotal * margen

            return {
                ...p,
                margen,
                margenPct,
                stockTotal,
                valorStock,
                gananciaPotencial,
            }
        })

    const productosFiltrados = productosCon
        .filter(p => {
            const matchBusqueda =
                p.nombre.toLowerCase().includes(busqueda.toLowerCase()) ||
                p.codigo?.toLowerCase().includes(busqueda.toLowerCase())

            const matchRentabilidad =
                filtroRentabilidad === 'todos' ? true :
                    filtroRentabilidad === 'alta' ? p.margenPct >= 40 :
                        filtroRentabilidad === 'media' ? p.margenPct >= 20 && p.margenPct < 40 :
                            p.margenPct < 20

            return matchBusqueda && matchRentabilidad
        })
        .sort((a, b) => {
            if (orden === 'margen_desc') return b.margenPct - a.margenPct
            if (orden === 'margen_asc') return a.margenPct - b.margenPct
            if (orden === 'ganancia_desc') return b.gananciaPotencial - a.gananciaPotencial
            if (orden === 'precio_desc') return b.precio - a.precio
            return 0
        })

    // Estadísticas generales
    const margenPromedio = productosCon.length > 0
        ? productosCon.reduce((acc, p) => acc + p.margenPct, 0) / productosCon.length
        : 0
    const valorTotalStock = productosCon.reduce((acc, p) => acc + p.valorStock, 0)
    const gananciaPotencialTotal = productosCon.reduce((acc, p) => acc + p.gananciaPotencial, 0)
    const productosAltaRentabilidad = productosCon.filter(p => p.margenPct >= 40).length

    const getColorMargen = (pct) => {
        if (pct >= 40) return 'text-green-600'
        if (pct >= 20) return 'text-yellow-600'
        return 'text-red-500'
    }

    const getBadgeMargen = (pct) => {
        if (pct >= 40) return 'bg-green-100 text-green-700'
        if (pct >= 20) return 'bg-yellow-100 text-yellow-700'
        return 'bg-red-100 text-red-600'
    }

    const getLabelMargen = (pct) => {
        if (pct >= 40) return 'Alta'
        if (pct >= 20) return 'Media'
        return 'Baja'
    }

    const generarPDF = () => {
        const doc = new jsPDF()

        doc.setFillColor(37, 99, 235)
        doc.rect(0, 0, 220, 30, 'F')
        doc.setTextColor(255, 255, 255)
        doc.setFontSize(16)
        doc.setFont('helvetica', 'bold')
        doc.text('Reporte de Rentabilidad por Producto', 14, 18)

        doc.setTextColor(31, 41, 55)
        doc.setFontSize(9)
        doc.setFont('helvetica', 'normal')
        doc.text(`Generado: ${new Date().toLocaleDateString()} ${new Date().toLocaleTimeString()}`, 14, 38)
        doc.text(`Margen promedio: ${margenPromedio.toFixed(1)}%`, 14, 44)
        doc.text(`Valor total en stock: $${valorTotalStock.toFixed(2)}`, 14, 50)
        doc.text(`Ganancia potencial: $${gananciaPotencialTotal.toFixed(2)}`, 14, 56)

        autoTable(doc, {
            startY: 64,
            head: [['Código', 'Producto', 'Costo', 'Precio', 'Margen $', 'Margen %', 'Stock', 'Ganancia pot.']],
            body: productosFiltrados.map(p => [
                p.codigo ?? '—',
                p.nombre,
                `$${p.costo.toFixed(2)}`,
                `$${p.precio.toFixed(2)}`,
                `$${p.margen.toFixed(2)}`,
                `${p.margenPct.toFixed(1)}%`,
                p.stockTotal,
                `$${p.gananciaPotencial.toFixed(2)}`,
            ]),
            styles: { fontSize: 7 },
            headStyles: { fillColor: [37, 99, 235], textColor: 255 },
            alternateRowStyles: { fillColor: [249, 250, 251] },
        })

        doc.save(`rentabilidad_${new Date().toISOString().split('T')[0]}.pdf`)
    }

    const exportarExcel = () => {
        const datos = productosFiltrados.map(p => ({
            'Código': p.codigo ?? '—',
            'Producto': p.nombre,
            'Categoría': p.categorias?.nombre ?? '—',
            'Costo': p.costo,
            'Precio': p.precio,
            'Margen $': p.margen.toFixed(2),
            'Margen %': `${p.margenPct.toFixed(1)}%`,
            'Rentabilidad': getLabelMargen(p.margenPct),
            'Stock total': p.stockTotal,
            'Valor en stock': p.valorStock.toFixed(2),
            'Ganancia potencial': p.gananciaPotencial.toFixed(2),
        }))

        const worksheet = XLSX.utils.json_to_sheet(datos)
        const workbook = XLSX.utils.book_new()
        XLSX.utils.book_append_sheet(workbook, worksheet, 'Rentabilidad')
        worksheet['!cols'] = [
            { wch: 12 }, { wch: 40 }, { wch: 20 }, { wch: 10 },
            { wch: 10 }, { wch: 12 }, { wch: 12 }, { wch: 14 },
            { wch: 12 }, { wch: 15 }, { wch: 18 },
        ]
        XLSX.writeFile(workbook, `rentabilidad_${new Date().toISOString().split('T')[0]}.xlsx`)
    }

    return (
        <Layout>
            <div className="flex justify-between items-center mb-6">
                <div>
                    <h2 className="text-2xl font-bold text-gray-800">Rentabilidad</h2>
                    <p className="text-gray-500 text-sm mt-1">Análisis de margen por producto</p>
                </div>
                <div className="flex gap-2">
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
                </div>
            </div>

            {/* Cards resumen */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
                <div className="bg-white rounded-lg shadow-sm p-5">
                    <p className="text-gray-500 text-xs">Margen promedio</p>
                    <p className={`text-2xl font-bold mt-1 ${getColorMargen(margenPromedio)}`}>
                        {margenPromedio.toFixed(1)}%
                    </p>
                </div>
                <div className="bg-white rounded-lg shadow-sm p-5">
                    <p className="text-gray-500 text-xs">Valor total en stock</p>
                    <p className="text-2xl font-bold text-gray-800 mt-1">
                        ${valorTotalStock.toFixed(2)}
                    </p>
                </div>
                <div className="bg-white rounded-lg shadow-sm p-5">
                    <p className="text-gray-500 text-xs">Ganancia potencial</p>
                    <p className="text-2xl font-bold text-green-600 mt-1">
                        ${gananciaPotencialTotal.toFixed(2)}
                    </p>
                </div>
                <div className="bg-white rounded-lg shadow-sm p-5">
                    <p className="text-gray-500 text-xs">Alta rentabilidad (≥40%)</p>
                    <p className="text-2xl font-bold text-blue-600 mt-1">
                        {productosAltaRentabilidad} productos
                    </p>
                </div>
            </div>

            {/* Filtros */}
            <div className="bg-white rounded-lg shadow-sm p-4 mb-4 flex flex-wrap gap-4 items-end">
                <div className="flex-1 min-w-48">
                    <label className="text-xs font-medium text-gray-500 mb-1 block">Buscar</label>
                    <input
                        className="border border-gray-300 rounded-lg px-4 py-2 w-full focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
                        placeholder="Nombre o código..."
                        value={busqueda}
                        onChange={(e) => setBusqueda(e.target.value)}
                    />
                </div>
                <div>
                    <label className="text-xs font-medium text-gray-500 mb-1 block">Rentabilidad</label>
                    <select
                        className="border border-gray-300 rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
                        value={filtroRentabilidad}
                        onChange={(e) => setFiltroRentabilidad(e.target.value)}
                    >
                        <option value="todos">Todas</option>
                        <option value="alta">Alta (≥40%)</option>
                        <option value="media">Media (20–40%)</option>
                        <option value="baja">Baja ({'<'}20%)</option>
                    </select>
                </div>
                <div>
                    <label className="text-xs font-medium text-gray-500 mb-1 block">Ordenar por</label>
                    <select
                        className="border border-gray-300 rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
                        value={orden}
                        onChange={(e) => setOrden(e.target.value)}
                    >
                        <option value="margen_desc">Mayor margen %</option>
                        <option value="margen_asc">Menor margen %</option>
                        <option value="ganancia_desc">Mayor ganancia potencial</option>
                        <option value="precio_desc">Mayor precio</option>
                    </select>
                </div>
                <p className="text-xs text-gray-400 ml-auto self-center">
                    {productosFiltrados.length} productos
                </p>
            </div>

            {/* Tabla */}
            <div className="bg-white rounded-lg shadow-sm overflow-hidden">
                {loading ? (
                    <p className="p-6 text-gray-500">Cargando...</p>
                ) : productosFiltrados.length === 0 ? (
                    <p className="p-6 text-gray-500">No hay productos que coincidan.</p>
                ) : (
                    <table className="w-full text-sm">
                        <thead className="bg-gray-50 text-gray-500 uppercase text-xs">
                        <tr>
                            <th className="px-6 py-3 text-left">Producto</th>
                            <th className="px-6 py-3 text-right">Costo</th>
                            <th className="px-6 py-3 text-right">Precio</th>
                            <th className="px-6 py-3 text-right">Margen $</th>
                            <th className="px-6 py-3 text-center">Margen %</th>
                            <th className="px-6 py-3 text-right">Stock</th>
                            <th className="px-6 py-3 text-right">Ganancia pot.</th>
                        </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100">
                        {productosFiltrados.map(p => (
                            <tr key={p.id} className="hover:bg-gray-50">
                                <td className="px-6 py-4">
                                    <p className="font-medium text-gray-800">{p.nombre}</p>
                                    <p className="text-gray-400 text-xs">{p.codigo}</p>
                                </td>
                                <td className="px-6 py-4 text-right text-gray-600">
                                    ${p.costo.toFixed(2)}
                                </td>
                                <td className="px-6 py-4 text-right text-gray-600">
                                    ${p.precio.toFixed(2)}
                                </td>
                                <td className="px-6 py-4 text-right font-medium text-gray-800">
                                    ${p.margen.toFixed(2)}
                                </td>
                                <td className="px-6 py-4 text-center">
                                        <span className={`px-2 py-1 rounded-full text-xs font-bold ${getBadgeMargen(p.margenPct)}`}>
                                            {p.margenPct.toFixed(1)}% — {getLabelMargen(p.margenPct)}
                                        </span>
                                </td>
                                <td className="px-6 py-4 text-right text-gray-600">
                                    {p.stockTotal}
                                </td>
                                <td className="px-6 py-4 text-right font-medium text-green-600">
                                    ${p.gananciaPotencial.toFixed(2)}
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