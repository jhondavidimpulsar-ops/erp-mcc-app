import { useState } from 'react'
import Layout from '../../components/Layout'
import { useContabilidad } from '../../hooks/useContabilidad'

export default function Contabilidad() {
    const {
        asientos,
        cuentas,
        balanceGeneral,
        estadoResultados,
        loading,
        filtros,
        setFiltros,
        registrarAsientoManual,
    } = useContabilidad()

    const [vista, setVista] = useState('diario')

    const [movimientos, setMovimientos] = useState([
        { cuenta_id: '', tipo: 'debe', monto: '' },
        { cuenta_id: '', tipo: 'haber', monto: '' },
    ])
    const [concepto, setConcepto] = useState('')
    const [errorAsiento, setErrorAsiento] = useState(null)
    const [exitoAsiento, setExitoAsiento] = useState(false)
    const [plantillaSeleccionada, setPlantilaSeleccionada] = useState(null)

    const totalIngresos = estadoResultados.ingresos.reduce((acc, c) => acc + c.saldo, 0)
    const totalGastos = estadoResultados.gastos.reduce((acc, c) => acc + c.saldo, 0)
    const utilidad = totalIngresos - totalGastos

    const totalActivos = balanceGeneral.activos.reduce((acc, c) => acc + c.saldo, 0)
    const totalPasivos = balanceGeneral.pasivos.reduce((acc, c) => acc + c.saldo, 0)
    const totalPatrimonio = balanceGeneral.patrimonio.reduce((acc, c) => acc + c.saldo, 0)

    return (
        <Layout>
            <div className="mb-6">
                <h2 className="text-2xl font-bold text-gray-800">Contabilidad</h2>
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
            </div>

            {/* Tabs */}
            <div className="flex gap-2 mb-6">
                {[
                    { id: 'diario', label: 'Libro Diario' },
                    { id: 'balance', label: 'Balance General' },
                    { id: 'resultados', label: 'Estado de Resultados' },
                    { id: 'manual', label: 'Asiento Manual' },
                    { id: 'cuentas', label: 'Plan de Cuentas' },
                ].map(tab => (
                    <button
                        key={tab.id}
                        className={`px-4 py-2 rounded-lg text-sm font-medium transition ${
                            vista === tab.id
                                ? 'bg-blue-600 text-white'
                                : 'bg-white text-gray-600 hover:bg-gray-50 shadow-sm'
                        }`}
                        onClick={() => setVista(tab.id)}
                    >
                        {tab.label}
                    </button>
                ))}
            </div>

            {/* Libro Diario */}
            {vista === 'diario' && (
                <div className="bg-white rounded-lg shadow-sm overflow-hidden">
                    {loading ? (
                        <p className="p-6 text-gray-500">Cargando...</p>
                    ) : asientos.length === 0 ? (
                        <p className="p-6 text-gray-500">No hay asientos en este período.</p>
                    ) : (
                        <table className="w-full text-sm">
                            <thead className="bg-gray-50 text-gray-500 uppercase text-xs">
                            <tr>
                                <th className="px-6 py-3 text-left">Fecha</th>
                                <th className="px-6 py-3 text-left">Concepto</th>
                                <th className="px-6 py-3 text-left">Cuenta</th>
                                <th className="px-6 py-3 text-right">Debe</th>
                                <th className="px-6 py-3 text-right">Haber</th>
                            </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-100">
                            {asientos.map(asiento => (
                                asiento.asientos_detalle?.map((detalle, index) => (
                                    <tr key={`${asiento.id}-${index}`} className="hover:bg-gray-50">
                                        <td className="px-6 py-3 text-gray-600">
                                            {index === 0 ? new Date(asiento.created_at).toLocaleDateString() : ''}
                                        </td>
                                        <td className="px-6 py-3 text-gray-800">
                                            {index === 0 ? asiento.concepto : ''}
                                        </td>
                                        <td className="px-6 py-3 text-gray-600">
                                            {detalle.plan_cuentas?.codigo} - {detalle.plan_cuentas?.nombre}
                                        </td>
                                        <td className="px-6 py-3 text-right text-gray-800">
                                            {Number(detalle.debe) > 0 ? `$${Number(detalle.debe).toFixed(2)}` : ''}
                                        </td>
                                        <td className="px-6 py-3 text-right text-gray-800">
                                            {Number(detalle.haber) > 0 ? `$${Number(detalle.haber).toFixed(2)}` : ''}
                                        </td>
                                    </tr>
                                ))
                            ))}
                            </tbody>
                        </table>
                    )}
                </div>
            )}

            {/* Balance General */}
            {vista === 'balance' && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="bg-white rounded-lg shadow-sm overflow-hidden">
                        <div className="px-6 py-4 border-b border-gray-100 bg-blue-50">
                            <h3 className="font-bold text-blue-800">Activos</h3>
                        </div>
                        <table className="w-full text-sm">
                            <tbody className="divide-y divide-gray-100">
                            {balanceGeneral.activos.map(cuenta => (
                                <tr key={cuenta.id} className="hover:bg-gray-50">
                                    <td className="px-6 py-3 text-gray-600">{cuenta.codigo} - {cuenta.nombre}</td>
                                    <td className="px-6 py-3 text-right font-medium text-gray-800">
                                        ${cuenta.saldo.toFixed(2)}
                                    </td>
                                </tr>
                            ))}
                            <tr className="bg-blue-50">
                                <td className="px-6 py-3 font-bold text-blue-800">Total Activos</td>
                                <td className="px-6 py-3 text-right font-bold text-blue-800">
                                    ${totalActivos.toFixed(2)}
                                </td>
                            </tr>
                            </tbody>
                        </table>
                    </div>

                    <div className="flex flex-col gap-6">
                        <div className="bg-white rounded-lg shadow-sm overflow-hidden">
                            <div className="px-6 py-4 border-b border-gray-100 bg-red-50">
                                <h3 className="font-bold text-red-800">Pasivos</h3>
                            </div>
                            <table className="w-full text-sm">
                                <tbody className="divide-y divide-gray-100">
                                {balanceGeneral.pasivos.map(cuenta => (
                                    <tr key={cuenta.id} className="hover:bg-gray-50">
                                        <td className="px-6 py-3 text-gray-600">{cuenta.codigo} - {cuenta.nombre}</td>
                                        <td className="px-6 py-3 text-right font-medium text-gray-800">
                                            ${cuenta.saldo.toFixed(2)}
                                        </td>
                                    </tr>
                                ))}
                                <tr className="bg-red-50">
                                    <td className="px-6 py-3 font-bold text-red-800">Total Pasivos</td>
                                    <td className="px-6 py-3 text-right font-bold text-red-800">
                                        ${totalPasivos.toFixed(2)}
                                    </td>
                                </tr>
                                </tbody>
                            </table>
                        </div>

                        <div className="bg-white rounded-lg shadow-sm overflow-hidden">
                            <div className="px-6 py-4 border-b border-gray-100 bg-green-50">
                                <h3 className="font-bold text-green-800">Patrimonio</h3>
                            </div>
                            <table className="w-full text-sm">
                                <tbody className="divide-y divide-gray-100">
                                {balanceGeneral.patrimonio.map(cuenta => (
                                    <tr key={cuenta.id} className="hover:bg-gray-50">
                                        <td className="px-6 py-3 text-gray-600">{cuenta.codigo} - {cuenta.nombre}</td>
                                        <td className="px-6 py-3 text-right font-medium text-gray-800">
                                            ${cuenta.saldo.toFixed(2)}
                                        </td>
                                    </tr>
                                ))}
                                <tr className="bg-green-50">
                                    <td className="px-6 py-3 font-bold text-green-800">Total Patrimonio</td>
                                    <td className="px-6 py-3 text-right font-bold text-green-800">
                                        ${totalPatrimonio.toFixed(2)}
                                    </td>
                                </tr>
                                </tbody>
                            </table>
                        </div>
                    </div>
                </div>
            )}

            {/* Estado de Resultados */}
            {vista === 'resultados' && (
                <div className="max-w-2xl">
                    <div className="bg-white rounded-lg shadow-sm overflow-hidden mb-6">
                        <div className="px-6 py-4 border-b border-gray-100 bg-green-50">
                            <h3 className="font-bold text-green-800">Ingresos</h3>
                        </div>
                        <table className="w-full text-sm">
                            <tbody className="divide-y divide-gray-100">
                            {estadoResultados.ingresos.map(cuenta => (
                                <tr key={cuenta.id} className="hover:bg-gray-50">
                                    <td className="px-6 py-3 text-gray-600">{cuenta.codigo} - {cuenta.nombre}</td>
                                    <td className="px-6 py-3 text-right font-medium text-green-600">
                                        ${cuenta.saldo.toFixed(2)}
                                    </td>
                                </tr>
                            ))}
                            <tr className="bg-green-50">
                                <td className="px-6 py-3 font-bold text-green-800">Total Ingresos</td>
                                <td className="px-6 py-3 text-right font-bold text-green-600">
                                    ${totalIngresos.toFixed(2)}
                                </td>
                            </tr>
                            </tbody>
                        </table>
                    </div>

                    <div className="bg-white rounded-lg shadow-sm overflow-hidden mb-6">
                        <div className="px-6 py-4 border-b border-gray-100 bg-red-50">
                            <h3 className="font-bold text-red-800">Gastos</h3>
                        </div>
                        <table className="w-full text-sm">
                            <tbody className="divide-y divide-gray-100">
                            {estadoResultados.gastos.map(cuenta => (
                                <tr key={cuenta.id} className="hover:bg-gray-50">
                                    <td className="px-6 py-3 text-gray-600">{cuenta.codigo} - {cuenta.nombre}</td>
                                    <td className="px-6 py-3 text-right font-medium text-red-600">
                                        ${cuenta.saldo.toFixed(2)}
                                    </td>
                                </tr>
                            ))}
                            <tr className="bg-red-50">
                                <td className="px-6 py-3 font-bold text-red-800">Total Gastos</td>
                                <td className="px-6 py-3 text-right font-bold text-red-600">
                                    ${totalGastos.toFixed(2)}
                                </td>
                            </tr>
                            </tbody>
                        </table>
                    </div>

                    <div className={`rounded-lg p-6 ${utilidad >= 0 ? 'bg-green-100' : 'bg-red-100'}`}>
                        <div className="flex justify-between items-center">
                            <h3 className={`font-bold text-lg ${utilidad >= 0 ? 'text-green-800' : 'text-red-800'}`}>
                                {utilidad >= 0 ? 'Utilidad del período' : 'Pérdida del período'}
                            </h3>
                            <p className={`font-bold text-2xl ${utilidad >= 0 ? 'text-green-700' : 'text-red-700'}`}>
                                ${Math.abs(utilidad).toFixed(2)}
                            </p>
                        </div>
                    </div>
                </div>
            )}

            {/* Asiento Manual */}
            {/* Asiento Manual */}
            {vista === 'manual' && (
                <div className="max-w-2xl flex flex-col gap-6">

                    {exitoAsiento && (
                        <div className="bg-green-100 text-green-700 px-4 py-3 rounded-lg text-sm">
                            ✅ Asiento registrado correctamente
                        </div>
                    )}

                    {/* Plantillas */}
                    <div className="bg-white rounded-lg shadow-sm p-6">
                        <h3 className="font-bold text-gray-800 mb-4">Registrar gasto rápido</h3>
                        <div className="grid grid-cols-2 gap-3">
                            {[
                                { id: 'arriendo', label: '🏠 Pago de arriendo', cuentaDebe: '5.2', cuentaHaber: '1.1' },
                                { id: 'servicios', label: '💡 Servicios (agua, luz, internet)', cuentaDebe: '5.2', cuentaHaber: '1.1' },
                                { id: 'nomina', label: '👥 Pago de nómina', cuentaDebe: '5.3', cuentaHaber: '1.1' },
                                { id: 'varios', label: '📦 Gasto varios', cuentaDebe: '5.2', cuentaHaber: '1.1' },
                                { id: 'capital', label: '💵 Capital inicial', cuentaDebe: '1.1', cuentaHaber: '3.1' },
                                { id: 'deposito', label: '🏦 Depósito bancario', cuentaDebe: '1.2', cuentaHaber: '1.1' },
                                { id: 'retiro', label: '💳 Retiro de caja', cuentaDebe: '1.1', cuentaHaber: '1.2' },
                            ].map(plantilla => (
                                <button
                                    key={plantilla.id}
                                    className={`border-2 rounded-lg px-4 py-3 text-sm text-left transition ${
                                        plantillaSeleccionada === plantilla.id
                                            ? 'border-blue-500 bg-blue-50 text-blue-700'
                                            : 'border-gray-200 hover:border-blue-300 text-gray-700'
                                    }`}
                                    onClick={() => {
                                        setPlantilaSeleccionada(plantilla.id)
                                        const cuentaDebe = cuentas.find(c => c.codigo === plantilla.cuentaDebe)
                                        const cuentaHaber = cuentas.find(c => c.codigo === plantilla.cuentaHaber)
                                        setMovimientos([
                                            { cuenta_id: cuentaDebe?.id ?? '', tipo: 'debe', monto: '' },
                                            { cuenta_id: cuentaHaber?.id ?? '', tipo: 'haber', monto: '' },
                                        ])
                                        setConcepto(plantilla.label.replace(/^\S+\s/, ''))
                                    }}
                                >
                                    {plantilla.label}
                                </button>
                            ))}
                        </div>
                    </div>

                    {/* Formulario simplificado si hay plantilla seleccionada */}
                    {plantillaSeleccionada && plantillaSeleccionada !== 'personalizado' && (
                        <div className="bg-white rounded-lg shadow-sm p-6">
                            <h3 className="font-bold text-gray-800 mb-4">Detalle del gasto</h3>
                            <div className="flex flex-col gap-4">
                                <div>
                                    <label className="text-sm font-medium text-gray-700 mb-1 block">Concepto</label>
                                    <input
                                        className="border border-gray-300 rounded-lg px-4 py-2 w-full focus:outline-none focus:ring-2 focus:ring-blue-500"
                                        placeholder="Ej: Arriendo mes de marzo"
                                        value={concepto}
                                        onChange={(e) => setConcepto(e.target.value)}
                                    />
                                </div>
                                <div>
                                    <label className="text-sm font-medium text-gray-700 mb-1 block">Monto</label>
                                    <input
                                        className="border border-gray-300 rounded-lg px-4 py-2 w-full focus:outline-none focus:ring-2 focus:ring-blue-500"
                                        type="number"
                                        placeholder="$0.00"
                                        value={movimientos[0]?.monto ?? ''}
                                        onChange={(e) => {
                                            const nuevos = [...movimientos]
                                            nuevos[0].monto = e.target.value
                                            nuevos[1].monto = e.target.value
                                            setMovimientos(nuevos)
                                        }}
                                    />
                                </div>
                                <div className="bg-gray-50 rounded-lg p-4 text-sm text-gray-600">
                                    <p className="font-medium text-gray-700 mb-2">Se registrará automáticamente:</p>
                                    <div className="flex justify-between">
                                        <span>{cuentas.find(c => c.id === movimientos[0]?.cuenta_id)?.nombre}</span>
                                        <span className="text-gray-800 font-medium">Debe: ${movimientos[0]?.monto || '0.00'}</span>
                                    </div>
                                    <div className="flex justify-between mt-1">
                                        <span>{cuentas.find(c => c.id === movimientos[1]?.cuenta_id)?.nombre}</span>
                                        <span className="text-gray-800 font-medium">Haber: ${movimientos[1]?.monto || '0.00'}</span>
                                    </div>
                                </div>

                                {errorAsiento && <p className="text-red-500 text-sm">{errorAsiento}</p>}

                                <div className="flex gap-3">
                                    <button
                                        className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 transition text-sm"
                                        onClick={async () => {
                                            setErrorAsiento(null)
                                            if (!concepto) return setErrorAsiento('Ingresa un concepto.')
                                            if (!movimientos[0]?.monto) return setErrorAsiento('Ingresa un monto.')
                                            const { error } = await registrarAsientoManual(concepto, movimientos)
                                            if (error) { setErrorAsiento(error.message); return }
                                            setExitoAsiento(true)
                                            setConcepto('')
                                            setPlantilaSeleccionada(null)
                                            setMovimientos([
                                                { cuenta_id: '', tipo: 'debe', monto: '' },
                                                { cuenta_id: '', tipo: 'haber', monto: '' },
                                            ])
                                            setTimeout(() => setExitoAsiento(false), 2000)
                                        }}
                                    >
                                        Registrar gasto
                                    </button>
                                    <button
                                        className="bg-gray-200 text-gray-700 px-6 py-2 rounded-lg hover:bg-gray-300 transition text-sm"
                                        onClick={() => { setPlantilaSeleccionada(null); setErrorAsiento(null) }}
                                    >
                                        Cancelar
                                    </button>
                                </div>
                            </div>
                        </div>
                    )}

                    {/* Asiento personalizado */}
                    <div className="bg-white rounded-lg shadow-sm p-6">
                        <button
                            className="flex justify-between items-center w-full"
                            onClick={() => setPlantilaSeleccionada(
                                plantillaSeleccionada === 'personalizado' ? null : 'personalizado'
                            )}
                        >
                            <span className="font-bold text-gray-800">✏️ Asiento personalizado</span>
                            <span className="text-gray-400">{plantillaSeleccionada === 'personalizado' ? '▲' : '▼'}</span>
                        </button>

                        {plantillaSeleccionada === 'personalizado' && (
                            <div className="flex flex-col gap-4 mt-4">
                                <div>
                                    <label className="text-sm font-medium text-gray-700 mb-1 block">Concepto</label>
                                    <input
                                        className="border border-gray-300 rounded-lg px-4 py-2 w-full focus:outline-none focus:ring-2 focus:ring-blue-500"
                                        placeholder="Descripción del asiento"
                                        value={concepto}
                                        onChange={(e) => setConcepto(e.target.value)}
                                    />
                                </div>

                                <div className="flex flex-col gap-2">
                                    {movimientos.map((mov, index) => (
                                        <div key={index} className="flex gap-2 items-center">
                                            <select
                                                className="border border-gray-300 rounded-lg px-4 py-2 flex-1 focus:outline-none focus:ring-2 focus:ring-blue-500"
                                                value={mov.cuenta_id}
                                                onChange={(e) => {
                                                    const nuevos = [...movimientos]
                                                    nuevos[index].cuenta_id = e.target.value
                                                    setMovimientos(nuevos)
                                                }}
                                            >
                                                <option value="">Selecciona una cuenta</option>
                                                {cuentas.map(c => (
                                                    <option key={c.id} value={c.id}>{c.codigo} - {c.nombre}</option>
                                                ))}
                                            </select>
                                            <select
                                                className="border border-gray-300 rounded-lg px-4 py-2 w-28 focus:outline-none focus:ring-2 focus:ring-blue-500"
                                                value={mov.tipo}
                                                onChange={(e) => {
                                                    const nuevos = [...movimientos]
                                                    nuevos[index].tipo = e.target.value
                                                    setMovimientos(nuevos)
                                                }}
                                            >
                                                <option value="debe">Debe</option>
                                                <option value="haber">Haber</option>
                                            </select>
                                            <input
                                                className="border border-gray-300 rounded-lg px-4 py-2 w-32 focus:outline-none focus:ring-2 focus:ring-blue-500"
                                                type="number"
                                                placeholder="Monto"
                                                value={mov.monto}
                                                onChange={(e) => {
                                                    const nuevos = [...movimientos]
                                                    nuevos[index].monto = e.target.value
                                                    setMovimientos(nuevos)
                                                }}
                                            />
                                            {movimientos.length > 2 && (
                                                <button
                                                    className="text-red-500 hover:underline text-xs"
                                                    onClick={() => setMovimientos(movimientos.filter((_, i) => i !== index))}
                                                >
                                                    Quitar
                                                </button>
                                            )}
                                        </div>
                                    ))}
                                </div>

                                <button
                                    className="text-blue-600 hover:underline text-sm"
                                    onClick={() => setMovimientos([...movimientos, { cuenta_id: '', tipo: 'debe', monto: '' }])}
                                >
                                    + Agregar línea
                                </button>

                                <div className="text-sm text-gray-500">
                                    Debe: <span className="font-medium text-gray-800">
              ${movimientos.filter(m => m.tipo === 'debe').reduce((acc, m) => acc + Number(m.monto || 0), 0).toFixed(2)}
            </span>{' · '}
                                    Haber: <span className="font-medium text-gray-800">
              ${movimientos.filter(m => m.tipo === 'haber').reduce((acc, m) => acc + Number(m.monto || 0), 0).toFixed(2)}
            </span>
                                </div>

                                {errorAsiento && <p className="text-red-500 text-sm">{errorAsiento}</p>}

                                <button
                                    className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 transition text-sm w-fit"
                                    onClick={async () => {
                                        setErrorAsiento(null)
                                        if (!concepto) return setErrorAsiento('Ingresa un concepto.')
                                        const totalDebe = movimientos.filter(m => m.tipo === 'debe').reduce((acc, m) => acc + Number(m.monto || 0), 0)
                                        const totalHaber = movimientos.filter(m => m.tipo === 'haber').reduce((acc, m) => acc + Number(m.monto || 0), 0)
                                        if (totalDebe !== totalHaber) return setErrorAsiento('El debe y el haber deben ser iguales.')
                                        if (movimientos.some(m => !m.cuenta_id || !m.monto)) return setErrorAsiento('Completa todos los campos.')
                                        const { error } = await registrarAsientoManual(concepto, movimientos)
                                        if (error) { setErrorAsiento(error.message); return }
                                        setExitoAsiento(true)
                                        setConcepto('')
                                        setPlantilaSeleccionada(null)
                                        setMovimientos([
                                            { cuenta_id: '', tipo: 'debe', monto: '' },
                                            { cuenta_id: '', tipo: 'haber', monto: '' },
                                        ])
                                        setTimeout(() => setExitoAsiento(false), 2000)
                                    }}
                                >
                                    Registrar asiento
                                </button>
                            </div>
                        )}
                    </div>
                </div>
            )}

            {/* Plan de Cuentas */}
            {vista === 'cuentas' && (
                <div className="bg-white rounded-lg shadow-sm overflow-hidden">
                    <table className="w-full text-sm">
                        <thead className="bg-gray-50 text-gray-500 uppercase text-xs">
                        <tr>
                            <th className="px-6 py-3 text-left">Código</th>
                            <th className="px-6 py-3 text-left">Nombre</th>
                            <th className="px-6 py-3 text-left">Tipo</th>
                        </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100">
                        {cuentas.map(cuenta => (
                            <tr key={cuenta.id} className="hover:bg-gray-50">
                                <td className="px-6 py-4 font-medium text-gray-800">{cuenta.codigo}</td>
                                <td className="px-6 py-4 text-gray-600">{cuenta.nombre}</td>
                                <td className="px-6 py-4">
                                  <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                                      cuenta.tipo === 'activo' ? 'bg-blue-100 text-blue-700' :
                                          cuenta.tipo === 'pasivo' ? 'bg-red-100 text-red-700' :
                                              cuenta.tipo === 'patrimonio' ? 'bg-green-100 text-green-700' :
                                                  cuenta.tipo === 'ingreso' ? 'bg-purple-100 text-purple-700' : 'bg-yellow-100 text-yellow-700'
                                  }`}>
                                    {cuenta.tipo}
                                  </span>
                                </td>
                            </tr>
                        ))}
                        </tbody>
                    </table>
                </div>
            )}

        </Layout>
    )
}