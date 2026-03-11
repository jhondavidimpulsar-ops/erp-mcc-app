import { useState } from 'react'
import Layout from '../../components/Layout'
import { useCXP } from '../../hooks/useCXP'
import { formatMoneda } from '../../utils/formatMoneda'
import jsPDF from 'jspdf'
import autoTable from 'jspdf-autotable'
import * as XLSX from 'xlsx'

export default function CXP() {
    const { cxps, tiposPago, loading, registrarAbono } = useCXP()
    const [abonoForm, setAbonoForm] = useState(null)
    const [monto, setMonto] = useState('')
    const [tipoPagoId, setTipoPagoId] = useState('')
    const [error, setError] = useState(null)
    const [filtro, setFiltro] = useState('pendiente')
    const [filtroProveedor, setFiltroProveedor] = useState('')

    const handleAbono = async () => {
        setError(null)
        if (!monto || !tipoPagoId) return setError('Completa todos los campos.')

        const cxp = cxps.find(c => c.id === abonoForm)
        const saldo = cxp.monto_total - cxp.monto_pagado

        if (Number(monto) > saldo) return setError('El abono no puede ser mayor al saldo pendiente.')

        const { error } = await registrarAbono(abonoForm, monto, tipoPagoId)
        if (error) { setError(error.message); return }

        setAbonoForm(null)
        setMonto('')
        setTipoPagoId('')
    }

    // Lista única de proveedores para el filtro
    const proveedoresUnicos = [...new Map(
        cxps.map(c => [c.provedores?.id, c.provedores])
    ).values()].filter(Boolean)

    const cxpsFiltradas = cxps.filter(c => {
        const matchEstado = filtro === 'todas' ? true : c.estado === filtro
        const matchProveedor = filtroProveedor ? c.provedores?.id === filtroProveedor : true
        return matchEstado && matchProveedor
    })

    // Totales pendientes por moneda
    const totalesPendientes = (() => {
        const totales = {}
        cxps.filter(c => c.estado === 'pendiente').forEach(cxp => {
            const suc = cxp.orden_de_compras?.sucursales
            const moneda = suc?.moneda ?? 'USD'
            const simbolo = suc?.simbolo ?? '$'
            const saldo = cxp.monto_total - cxp.monto_pagado
            if (!totales[moneda]) totales[moneda] = { moneda, simbolo, total: 0 }
            totales[moneda].total += saldo
        })
        return Object.values(totales)
    })()

    const cxpActiva = cxps.find(c => c.id === abonoForm)
    const sucActiva = cxpActiva?.orden_de_compras?.sucursales
    const monedaActual = sucActiva?.moneda ?? 'USD'
    const simboloActual = sucActiva?.simbolo ?? '$'

    const generarPDF = () => {
        const doc = new jsPDF()

        doc.setFontSize(18)
        doc.setTextColor(31, 41, 55)
        doc.text('Reporte de Cuentas por Pagar', 14, 20)

        doc.setFontSize(10)
        doc.setTextColor(107, 114, 128)
        doc.text(`Generado: ${new Date().toLocaleDateString()} ${new Date().toLocaleTimeString()}`, 14, 28)
        doc.text(`Total registros: ${cxpsFiltradas.length}`, 14, 34)

        totalesPendientes.forEach((t, i) => {
            doc.text(`Saldo pendiente: ${formatMoneda(t.total, t.moneda, t.simbolo)}`, 14, 40 + i * 6)
        })

        const startY = 40 + totalesPendientes.length * 6 + 4

        autoTable(doc, {
            startY,
            head: [['Proveedor', 'Sucursal', 'Total', 'Pagado', 'Saldo', 'Estado', 'Fecha']],
            body: cxpsFiltradas.map(cxp => {
                const suc = cxp.orden_de_compras?.sucursales
                const moneda = suc?.moneda ?? 'USD'
                const simbolo = suc?.simbolo ?? '$'
                const saldo = cxp.monto_total - cxp.monto_pagado
                return [
                    cxp.provedores?.nombre ?? '—',
                    suc?.nombre ?? '—',
                    formatMoneda(cxp.monto_total, moneda, simbolo),
                    formatMoneda(cxp.monto_pagado, moneda, simbolo),
                    formatMoneda(saldo, moneda, simbolo),
                    cxp.estado === 'pagado' ? 'Pagada' : 'Pendiente',
                    new Date(cxp.created_at).toLocaleDateString(),
                ]
            }),
            styles: { fontSize: 8 },
            headStyles: { fillColor: [37, 99, 235], textColor: 255 },
            alternateRowStyles: { fillColor: [249, 250, 251] },
        })

        doc.save(`cxp_${new Date().toISOString().split('T')[0]}.pdf`)
    }

    const exportarExcel = () => {
        const datos = cxpsFiltradas.map(cxp => {
            const suc = cxp.orden_de_compras?.sucursales
            const moneda = suc?.moneda ?? 'USD'
            const simbolo = suc?.simbolo ?? '$'
            const saldo = cxp.monto_total - cxp.monto_pagado
            return {
                'Proveedor': cxp.provedores?.nombre ?? '—',
                'Sucursal': suc?.nombre ?? '—',
                'Total': formatMoneda(cxp.monto_total, moneda, simbolo),
                'Pagado': formatMoneda(cxp.monto_pagado, moneda, simbolo),
                'Saldo': formatMoneda(saldo, moneda, simbolo),
                'Estado': cxp.estado === 'pagado' ? 'Pagada' : 'Pendiente',
                'Fecha': new Date(cxp.created_at).toLocaleDateString(),
            }
        })

        const worksheet = XLSX.utils.json_to_sheet(datos)
        const workbook = XLSX.utils.book_new()
        XLSX.utils.book_append_sheet(workbook, worksheet, 'CXP')

        worksheet['!cols'] = [
            { wch: 25 }, { wch: 20 }, { wch: 15 },
            { wch: 15 }, { wch: 15 }, { wch: 12 }, { wch: 12 },
        ]

        XLSX.writeFile(workbook, `cxp_${new Date().toISOString().split('T')[0]}.xlsx`)
    }

    return (
        <Layout>
            <div className="flex justify-between items-center mb-6">
                <h2 className="text-2xl font-bold text-gray-800">Cuentas por Pagar</h2>
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

            {/* Resumen */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
                <div className="bg-white rounded-lg shadow-sm p-6">
                    <h3 className="text-gray-500 text-sm">Total pendiente</h3>
                    {totalesPendientes.length === 0 ? (
                        <p className="text-3xl font-bold text-gray-800 mt-2">$0.00</p>
                    ) : (
                        totalesPendientes.map(t => (
                            <p key={t.moneda} className="text-2xl font-bold text-red-600 mt-1">
                                {formatMoneda(t.total, t.moneda, t.simbolo)}
                            </p>
                        ))
                    )}
                </div>
                <div className="bg-white rounded-lg shadow-sm p-6">
                    <h3 className="text-gray-500 text-sm">CXP pendientes</h3>
                    <p className="text-3xl font-bold text-gray-800 mt-2">
                        {cxps.filter(c => c.estado === 'pendiente').length}
                    </p>
                </div>
                <div className="bg-white rounded-lg shadow-sm p-6">
                    <h3 className="text-gray-500 text-sm">CXP pagadas</h3>
                    <p className="text-3xl font-bold text-green-600 mt-2">
                        {cxps.filter(c => c.estado === 'pagado').length}
                    </p>
                </div>
            </div>

            {/* Filtros */}
            <div className="bg-white rounded-lg shadow-sm p-4 mb-4 flex flex-wrap gap-4 items-end">
                <div className="flex gap-2">
                    {[
                        { id: 'pendiente', label: 'Pendientes' },
                        { id: 'pagado', label: 'Pagadas' },
                        { id: 'todas', label: 'Todas' },
                    ].map(f => (
                        <button
                            key={f.id}
                            className={`px-4 py-2 rounded-lg text-sm font-medium transition ${
                                filtro === f.id
                                    ? 'bg-blue-600 text-white'
                                    : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                            }`}
                            onClick={() => setFiltro(f.id)}
                        >
                            {f.label}
                        </button>
                    ))}
                </div>
                <div>
                    <label className="text-xs font-medium text-gray-500 mb-1 block">Proveedor</label>
                    <select
                        className="border border-gray-300 rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
                        value={filtroProveedor}
                        onChange={(e) => setFiltroProveedor(e.target.value)}
                    >
                        <option value="">Todos los proveedores</option>
                        {proveedoresUnicos.map(p => (
                            <option key={p.id} value={p.id}>{p.nombre}</option>
                        ))}
                    </select>
                </div>
                {filtroProveedor && (
                    <button
                        className="text-sm text-gray-400 hover:text-gray-600"
                        onClick={() => setFiltroProveedor('')}
                    >
                        Limpiar
                    </button>
                )}
                <p className="text-xs text-gray-400 ml-auto self-center">
                    {cxpsFiltradas.length} registros
                </p>
            </div>

            {/* Lista CXP */}
            <div className="flex flex-col gap-4">
                {loading ? (
                    <p className="text-gray-500">Cargando...</p>
                ) : cxpsFiltradas.length === 0 ? (
                    <p className="text-gray-500">No hay cuentas por pagar.</p>
                ) : (
                    cxpsFiltradas.map(cxp => {
                        const suc = cxp.orden_de_compras?.sucursales
                        const moneda = suc?.moneda ?? 'USD'
                        const simbolo = suc?.simbolo ?? '$'
                        const saldo = cxp.monto_total - cxp.monto_pagado

                        return (
                            <div key={cxp.id} className="bg-white rounded-lg shadow-sm p-6">
                                <div className="flex justify-between items-start mb-4">
                                    <div>
                                        <h3 className="font-bold text-gray-800">{cxp.provedores?.nombre}</h3>
                                        <p className="text-gray-500 text-sm">
                                            Sucursal: {suc?.nombre ?? '—'} ·
                                            Fecha: {new Date(cxp.created_at).toLocaleDateString()}
                                        </p>
                                    </div>
                                    <span className={`px-3 py-1 rounded-full text-xs font-medium ${
                                        cxp.estado === 'pagado'
                                            ? 'bg-green-100 text-green-700'
                                            : 'bg-yellow-100 text-yellow-700'
                                    }`}>
                                        {cxp.estado === 'pagado' ? 'Pagada' : 'Pendiente'}
                                    </span>
                                </div>

                                <div className="grid grid-cols-3 gap-4 mb-4">
                                    <div>
                                        <p className="text-gray-500 text-xs">Total</p>
                                        <p className="font-bold text-gray-800">
                                            {formatMoneda(cxp.monto_total, moneda, simbolo)}
                                        </p>
                                    </div>
                                    <div>
                                        <p className="text-gray-500 text-xs">Pagado</p>
                                        <p className="font-bold text-green-600">
                                            {formatMoneda(cxp.monto_pagado, moneda, simbolo)}
                                        </p>
                                    </div>
                                    <div>
                                        <p className="text-gray-500 text-xs">Saldo</p>
                                        <p className="font-bold text-red-600">
                                            {formatMoneda(saldo, moneda, simbolo)}
                                        </p>
                                    </div>
                                </div>

                                {/* Historial de abonos */}
                                {cxp.cxp_abonos?.length > 0 && (
                                    <div className="mb-4">
                                        <p className="text-xs font-medium text-gray-500 mb-2">Historial de abonos</p>
                                        <div className="flex flex-col gap-1">
                                            {cxp.cxp_abonos.map(abono => (
                                                <div key={abono.id} className="flex justify-between text-sm bg-gray-50 px-3 py-2 rounded">
                                                    <span className="text-gray-600">
                                                        {new Date(abono.created_at).toLocaleDateString()} · {abono.tipo_pago?.nombre}
                                                    </span>
                                                    <span className="font-medium text-green-600">
                                                        {formatMoneda(Number(abono.monto), moneda, simbolo)}
                                                    </span>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                )}

                                {/* Formulario de abono */}
                                {cxp.estado === 'pendiente' && (
                                    <div>
                                        {abonoForm === cxp.id ? (
                                            <div className="flex gap-2 items-start flex-wrap">
                                                <input
                                                    className="border border-gray-300 rounded-lg px-4 py-2 w-36 focus:outline-none focus:ring-2 focus:ring-blue-500"
                                                    type="number"
                                                    placeholder="Monto"
                                                    value={monto}
                                                    onChange={(e) => setMonto(e.target.value)}
                                                    max={saldo}
                                                />
                                                <select
                                                    className="border border-gray-300 rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                                                    value={tipoPagoId}
                                                    onChange={(e) => setTipoPagoId(e.target.value)}
                                                >
                                                    <option value="">Método de pago</option>
                                                    {tiposPago.map(tp => (
                                                        <option key={tp.id} value={tp.id}>{tp.nombre}</option>
                                                    ))}
                                                </select>
                                                <button
                                                    className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition text-sm"
                                                    onClick={handleAbono}
                                                >
                                                    Registrar abono
                                                </button>
                                                <button
                                                    className="bg-gray-200 text-gray-700 px-4 py-2 rounded-lg hover:bg-gray-300 transition text-sm"
                                                    onClick={() => { setAbonoForm(null); setError(null) }}
                                                >
                                                    Cancelar
                                                </button>
                                                {error && <p className="text-red-500 text-sm w-full">{error}</p>}
                                            </div>
                                        ) : (
                                            <button
                                                className="bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 transition text-sm"
                                                onClick={() => { setAbonoForm(cxp.id); setError(null) }}
                                            >
                                                + Registrar abono
                                            </button>
                                        )}
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