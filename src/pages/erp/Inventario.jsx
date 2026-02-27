import { useState } from 'react'
import Layout from '../../components/Layout'
import { useInventario } from '../../hooks/useInventario'

export default function Inventario() {
    const { inventario, loading, ajustarCantidad } = useInventario()
    const [editando, setEditando] = useState(null)
    const [cantidad, setCantidad] = useState('')

    const handleAjustar = async (id) => {
        const { error } = await ajustarCantidad(id, cantidad)
        if (!error) {
            setEditando(null)
            setCantidad('')
        }
    }

    return (
        <Layout>
            <div className="flex justify-between items-center mb-6">
                <h2 className="text-2xl font-bold text-gray-800">Inventario</h2>
            </div>

            <div className="bg-white rounded-lg shadow-sm overflow-hidden">
                {loading ? (
                    <p className="p-6 text-gray-500">Cargando inventario...</p>
                ) : inventario.length === 0 ? (
                    <p className="p-6 text-gray-500">No hay registros de inventario.</p>
                ) : (
                    <table className="w-full text-sm">
                        <thead className="bg-gray-50 text-gray-500 uppercase text-xs">
                        <tr>
                            <th className="px-6 py-3 text-left">Producto</th>
                            <th className="px-6 py-3 text-left">Código</th>
                            <th className="px-6 py-3 text-left">Sucursal</th>
                            <th className="px-6 py-3 text-left">Cantidad</th>
                            <th className="px-6 py-3 text-left">Ajuste manual</th>
                        </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100">
                        {inventario.map(item => (
                            <tr key={item.id} className="hover:bg-gray-50">
                                <td className="px-6 py-4 font-medium text-gray-800">{item.productos?.nombre ?? '—'}</td>
                                <td className="px-6 py-4 text-gray-600">{item.productos?.codigo ?? '—'}</td>
                                <td className="px-6 py-4 text-gray-600">{item.sucursales?.nombre ?? '—'}</td>
                                <td className="px-6 py-4">
                    <span className={`font-bold ${item.cantidad === 0 ? 'text-red-500' : 'text-green-600'}`}>
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