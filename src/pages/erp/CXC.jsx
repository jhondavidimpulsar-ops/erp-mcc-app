import { useState } from 'react'
import Layout from '../../components/Layout'
import { useCXC } from '../../hooks/useCXC'

export default function CXC() {
    const { cxcs, tiposPago, loading, registrarAbono } = useCXC()
    const [abonoForm, setAbonoForm] = useState(null)
    const [monto, setMonto] = useState('')
    const [tipoPagoId, setTipoPagoId] = useState('')
    const [error, setError] = useState(null)
    const [filtro, setFiltro] = useState('pendiente')

    const handleAbono = async () => {
        setError(null)
        if (!monto || !tipoPagoId) return setError('Completa todos los campos.')

        const cxc = cxcs.find(c => c.id === abonoForm)
        const saldo = cxc.monto_total - cxc.monto_pagado

        if (Number(monto) > saldo) {
            return setError(`El abono no puede ser mayor al saldo pendiente ($${saldo.toFixed(2)})`)
        }

        const { error } = await registrarAbono(abonoForm, monto, tipoPagoId)
        if (error) { setError(error.message); return }

        setAbonoForm(null)
        setMonto('')
        setTipoPagoId('')
    }

    const cxcsFiltradas = cxcs.filter(c =>
        filtro === 'todas' ? true : c.estado === filtro
    )

    const totalPendiente = cxcs
        .filter(c => c.estado === 'pendiente')
        .reduce((acc, c) => acc + (c.monto_total - c.monto_pagado), 0)

    return (
        <Layout>
            <div className="mb-6">
                <h2 className="text-2xl font-bold text-gray-800">Cuentas por Cobrar</h2>
            </div>

            {/* Resumen */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
                <div className="bg-white rounded-lg shadow-sm p-6">
                    <h3 className="text-gray-500 text-sm">Total pendiente</h3>
                    <p className="text-3xl font-bold text-red-600 mt-2">
                        ${totalPendiente.toFixed(2)}
                    </p>
                </div>
                <div className="bg-white rounded-lg shadow-sm p-6">
                    <h3 className="text-gray-500 text-sm">CXC pendientes</h3>
                    <p className="text-3xl font-bold text-gray-800 mt-2">
                        {cxcs.filter(c => c.estado === 'pendiente').length}
                    </p>
                </div>
                <div className="bg-white rounded-lg shadow-sm p-6">
                    <h3 className="text-gray-500 text-sm">CXC cobradas</h3>
                    <p className="text-3xl font-bold text-green-600 mt-2">
                        {cxcs.filter(c => c.estado === 'pagado').length}
                    </p>
                </div>
            </div>

            {/* Filtros */}
            <div className="flex gap-2 mb-6">
                {[
                    { id: 'pendiente', label: 'Pendientes' },
                    { id: 'pagado', label: 'Cobradas' },
                    { id: 'todas', label: 'Todas' },
                ].map(f => (
                    <button
                        key={f.id}
                        className={`px-4 py-2 rounded-lg text-sm font-medium transition ${
                            filtro === f.id
                                ? 'bg-blue-600 text-white'
                                : 'bg-white text-gray-600 hover:bg-gray-50 shadow-sm'
                        }`}
                        onClick={() => setFiltro(f.id)}
                    >
                        {f.label}
                    </button>
                ))}
            </div>

            {/* Lista CXC */}
            <div className="flex flex-col gap-4">
                {loading ? (
                    <p className="text-gray-500">Cargando...</p>
                ) : cxcsFiltradas.length === 0 ? (
                    <p className="text-gray-500">No hay cuentas por cobrar.</p>
                ) : (
                    cxcsFiltradas.map(cxc => {
                        const saldo = cxc.monto_total - cxc.monto_pagado
                        return (
                            <div key={cxc.id} className="bg-white rounded-lg shadow-sm p-6">
                                <div className="flex justify-between items-start mb-4">
                                    <div>
                                        <h3 className="font-bold text-gray-800">{cxc.clientes?.nombre}</h3>
                                        <p className="text-gray-500 text-sm">
                                            Cédula: {cxc.clientes?.cedula ?? '—'} ·
                                            Sucursal: {cxc.ventas?.sucursales?.nombre ?? '—'} ·
                                            Fecha: {new Date(cxc.created_at).toLocaleDateString()}
                                        </p>
                                    </div>
                                    <span className={`px-3 py-1 rounded-full text-xs font-medium ${
                                        cxc.estado === 'pagado'
                                            ? 'bg-green-100 text-green-700'
                                            : 'bg-yellow-100 text-yellow-700'
                                    }`}>
                    {cxc.estado === 'pagado' ? 'Cobrada' : 'Pendiente'}
                  </span>
                                </div>

                                <div className="grid grid-cols-3 gap-4 mb-4">
                                    <div>
                                        <p className="text-gray-500 text-xs">Total</p>
                                        <p className="font-bold text-gray-800">${cxc.monto_total.toFixed(2)}</p>
                                    </div>
                                    <div>
                                        <p className="text-gray-500 text-xs">Pagado</p>
                                        <p className="font-bold text-green-600">${cxc.monto_pagado.toFixed(2)}</p>
                                    </div>
                                    <div>
                                        <p className="text-gray-500 text-xs">Saldo</p>
                                        <p className="font-bold text-red-600">${saldo.toFixed(2)}</p>
                                    </div>
                                </div>

                                {/* Historial de abonos */}
                                {cxc.cxc_abonos?.length > 0 && (
                                    <div className="mb-4">
                                        <p className="text-xs font-medium text-gray-500 mb-2">Historial de abonos</p>
                                        <div className="flex flex-col gap-1">
                                            {cxc.cxc_abonos.map(abono => (
                                                <div key={abono.id} className="flex justify-between text-sm bg-gray-50 px-3 py-2 rounded">
                          <span className="text-gray-600">
                            {new Date(abono.created_at).toLocaleDateString()} · {abono.tipo_pago?.nombre}
                          </span>
                                                    <span className="font-medium text-green-600">${Number(abono.monto).toFixed(2)}</span>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                )}

                                {/* Formulario de abono */}
                                {cxc.estado === 'pendiente' && (
                                    <div>
                                        {abonoForm === cxc.id ? (
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
                                                onClick={() => { setAbonoForm(cxc.id); setError(null) }}
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