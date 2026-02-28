import { useState } from 'react'
import Layout from '../../components/Layout'
import {useSucursales} from "../../hooks/useSucursales.js";

const sucursalVacia = {
    nombre: '',
    direccion: '',
    ciudad: '',
    telefono: '',
    moneda: '',
    simbolo: '',
}

export default function Sucursales() {
    const { sucursales, loading, crearSucursal, actualizarSucursal, eliminarSucursal } = useSucursales()
    const [mostrarForm, setMostrarForm] = useState(false)
    const [form, setForm] = useState(sucursalVacia)
    const [editando, setEditando] = useState(null)
    const [error, setError] = useState(null)
    const [exito, setExito] = useState(false)

    const handleChange = (e) => {
        const { name, value } = e.target
        if (name === 'moneda') {
            setForm({ ...form, moneda: value, simbolo: value === 'COP' ? 'COP$' : '$' })
        } else {
            setForm({ ...form, [name]: value })
        }
    }

    const handleSubmit = async (e) => {
        e.preventDefault()
        setError(null)

        const { error } = editando
            ? await actualizarSucursal(editando, form)
            : await crearSucursal(form)

        if (error) {
            setError(error.message)
            return
        }

        setExito(true)
        setTimeout(() => {
            setExito(false)
            setForm(sucursalVacia)
            setEditando(null)
            setMostrarForm(false)
        }, 1500)
    }

    const handleEditar = (sucursal) => {
        setForm({
            nombre: sucursal.nombre,
            direccion: sucursal.direccion,
            ciudad: sucursal.ciudad,
            telefono: sucursal.telefono,
            moneda: sucursal.moneda,
            simbolo: sucursal.simbolo,
        })
        setEditando(sucursal.id)
        setMostrarForm(true)
    }

    const handleCancelar = () => {
        setForm(sucursalVacia)
        setEditando(null)
        setMostrarForm(false)
        setError(null)
    }

    return (
        <Layout>
            <div className="flex justify-between items-center mb-6">
                <h2 className="text-2xl font-bold text-gray-800">Sucursales</h2>
                {!mostrarForm && (
                    <button
                        className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition text-sm"
                        onClick={() => setMostrarForm(true)}
                    >
                        + Agregar sucursal
                    </button>
                )}
            </div>

            {mostrarForm && (
                <div className="bg-white rounded-lg shadow-sm p-6 mb-6">
                    <h3 className="text-lg font-bold text-gray-800 mb-4">
                        {editando ? 'Editar sucursal' : 'Nueva sucursal'}
                    </h3>

                    {exito && (
                        <div className="bg-green-100 text-green-700 px-4 py-3 rounded-lg text-sm mb-4">
                            ✅ {editando ? 'Sucursal actualizada' : 'Sucursal creada'} correctamente
                        </div>
                    )}

                    <form onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <input
                            className="border border-gray-300 rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                            name="nombre"
                            placeholder="Nombre completo"
                            value={form.nombre}
                            onChange={handleChange}
                            required
                        />

                        <input
                            className="border border-gray-300 rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                            name="direccion"
                            placeholder="Direccion "
                            value={form.direccion}
                            onChange={handleChange}
                            required
                        />

                        <input
                            className="border border-gray-300 rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                            name="ciudad"
                            placeholder="Ciudad "
                            value={form.ciudad}
                            onChange={handleChange}
                            required
                        />
                        <input
                            className="border border-gray-300 rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                            name="telefono"
                            placeholder="Telefono "
                            value={form.telefono}
                            onChange={handleChange}
                            required
                        />

                        <select
                            className="border border-gray-300 rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                            name="moneda"
                            value={form.moneda}
                            onChange={handleChange}
                            required
                        >
                            <option value="">Selecciona una moneda</option>
                            <option value="USD">USD - Dólar</option>
                            <option value="COP">COP - Peso colombiano</option>
                        </select>

                        <input
                            className="border border-gray-300 rounded-lg px-4 py-2 bg-gray-50"
                            name="simbolo"
                            placeholder="Símbolo"
                            value={form.simbolo}
                            readOnly
                        />

                        {error && <p className="text-red-500 text-sm md:col-span-2">{error}</p>}

                        <div className="md:col-span-2 flex gap-3">
                            <button
                                className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 transition text-sm"
                                type="submit"
                            >
                                {editando ? 'Guardar cambios' : 'Crear sucursal'}
                            </button>
                            <button
                                className="bg-gray-200 text-gray-700 px-6 py-2 rounded-lg hover:bg-gray-300 transition text-sm"
                                type="button"
                                onClick={handleCancelar}
                            >
                                Cancelar
                            </button>
                        </div>
                    </form>
                </div>
            )}

            <div className="bg-white rounded-lg shadow-sm overflow-hidden">
                {loading ? (
                    <p className="p-6 text-gray-500">Cargando sucursales...</p>
                ) : sucursales.length === 0 ? (
                    <p className="p-6 text-gray-500">No hay sucursales registradas.</p>
                ) : (
                    <table className="w-full text-sm">
                        <thead className="bg-gray-50 text-gray-500 uppercase text-xs">
                        <tr>
                            <th className="px-6 py-3 text-left">Nombre</th>
                            <th className="px-6 py-3 text-left">Direccion</th>
                            <th className="px-6 py-3 text-left">Moneda</th>
                            <th className="px-6 py-3 text-left">Simbolo</th>
                            <th className="px-6 py-3 text-left">Ciudad</th>
                            <th className="px-6 py-3 text-left">Teléfono</th>
                            <th className="px-6 py-3 text-left">Acciones</th>
                        </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100">
                        {sucursales.map(sucursal => (
                            <tr key={sucursal.id} className="hover:bg-gray-50">
                                <td className="px-6 py-4 font-medium text-gray-800">{sucursal.nombre ?? '—'}</td>
                                <td className="px-6 py-4 text-gray-600">{sucursal.direccion ?? '—'}</td>
                                <td className="px-6 py-4 text-gray-600">{sucursal.moneda ?? '—'}</td>
                                <td className="px-6 py-4 text-gray-600">{sucursal.simbolo ?? '—'}</td>
                                <td className="px-6 py-4 text-gray-600">{sucursal.ciudad ?? '—'}</td>
                                <td className="px-6 py-4 text-gray-600">{sucursal.telefono ?? '—'}</td>
                                <td className="px-6 py-4 flex gap-2">
                                    <button
                                        className="text-blue-600 hover:underline text-xs"
                                        onClick={() => handleEditar(sucursal)}
                                    >
                                        Editar
                                    </button>
                                    <button
                                        className="text-red-500 hover:underline text-xs"
                                        onClick={() => eliminarSucursal(sucursal.id, sucursal.auth_id)}
                                    >
                                        Eliminar
                                    </button>
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