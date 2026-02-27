import { useState } from 'react'
import Layout from '../../components/Layout'
import {useProvedores} from "../../hooks/useProvedores.js";

const provedorVacio = {
    nombre: '',
}

export default function Provedores() {
    const { provedores, loading, agregarProvedores, actualizarProvedores, eliminarProvedores } = useProvedores()
    const [mostrarForm, setMostrarForm] = useState(false)
    const [form, setForm] = useState(provedorVacio)
    const [editando, setEditando] = useState(null)
    const [error, setError] = useState(null)
    const [busqueda, setBusqueda] = useState('')

    const handleChange = (e) => {
        setForm({ ...form, [e.target.name]: e.target.value })
    }

    const handleSubmit = async (e) => {
        e.preventDefault()
        setError(null)

        if (!editando) {
            const duplicado = provedores.find(p => p.nombre === form.nombre && form.nombre !== '')
            if (duplicado) {
                handleEditar(duplicado)
                setError('Ya existe un provedor con ese nombre. Puedes editar su información.')
                return
            }
        }

        const { error } = editando
            ? await actualizarProvedores(editando, form)
            : await agregarProvedores(form)

        if (error) {
            setError(error.message)
            return
        }

        setForm(provedorVacio)
        setEditando(null)
        setMostrarForm(false)
    }

    const handleEditar = (provedores) => {
        setForm({
            nombre: provedores.nombre,
        })
        setEditando(provedores.id)
        setMostrarForm(true)
    }

    const handleCancelar = () => {
        setForm(provedorVacio)
        setEditando(null)
        setMostrarForm(false)
        setError(null)
    }

    const provedoresFiltrados = provedores.filter(p =>
        p.nombre.toLowerCase().includes(busqueda.toLowerCase())
    )

    return (
        <Layout>
            <div className="flex justify-between items-center mb-6">
                <h2 className="text-2xl font-bold text-gray-800">Provedores</h2>
                {!mostrarForm && (
                    <button
                        className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition text-sm"
                        onClick={() => setMostrarForm(true)}
                    >
                        + Agregar provedor
                    </button>
                )}
            </div>

            {mostrarForm && (
                <div className="bg-white rounded-lg shadow-sm p-6 mb-6">
                    <h3 className="text-lg font-bold text-gray-800 mb-4">
                        {editando ? 'Editar provedor' : 'Nuevo provedor'}
                    </h3>
                    <form onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <input className="border border-gray-300 rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                            name="nombre"
                            placeholder="Nombre completo"
                            value={form.nombre}
                            onChange={handleChange}
                            required
                        />

                        {error && <p className="text-red-500 text-sm col-span-2">{error}</p>}

                        <div className="col-span-2 flex gap-3">
                            <button
                                className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 transition text-sm"
                                type="submit"
                            >
                                {editando ? 'Guardar cambios' : 'Agregar'}
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

            <div className="mb-4">
                <input
                    className="border border-gray-300 rounded-lg px-4 py-2 w-full max-w-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="Buscar por nombre"
                    value={busqueda}
                    onChange={(e) => setBusqueda(e.target.value)}
                />
            </div>

            <div className="bg-white rounded-lg shadow-sm overflow-hidden">
                {loading ? (
                    <p className="p-6 text-gray-500">Cargando provedores...</p>
                ) : provedoresFiltrados.length === 0 ? (
                    <p className="p-6 text-gray-500">No hay provedores aún.</p>
                ) : (
                    <table className="w-full text-sm">
                        <thead className="bg-gray-50 text-gray-500 uppercase text-xs">
                        <tr>
                            <th className="px-6 py-3 text-left">Nombre</th>
                            <th className="px-6 py-3 text-left">Acciones</th>
                        </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100">
                        {provedoresFiltrados.map(p => (
                            <tr key={p.id} className="hover:bg-gray-50">
                                <td className="px-6 py-4 font-medium text-gray-800">{p.nombre}</td>
                                <td className="px-6 py-4">
                                    <button
                                        className="text-blue-600 hover:underline text-xs"
                                        onClick={() => handleEditar(p)}
                                    >
                                        Editar
                                    </button>
                                    <button
                                        className="text-red-500 hover:underline text-xs"
                                        onClick={() => eliminarProvedores(p.id)}
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