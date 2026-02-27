import { useState } from 'react'
import Layout from '../../components/Layout'
import { useClientes } from '../../hooks/useClientes'

const clienteVacio = {
    nombre: '',
    cedula: '',
    numero: '',
    correo: '',
}

export default function Clientes() {
    const { clientes, loading, agregarCliente, actualizarCliente, eliminarCliente } = useClientes()
    const [mostrarForm, setMostrarForm] = useState(false)
    const [form, setForm] = useState(clienteVacio)
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
            const duplicado = clientes.find(c => c.cedula === form.cedula && form.cedula !== '')
            if (duplicado) {
                handleEditar(duplicado)
                setError('Ya existe un cliente con esa cédula. Puedes editar su información.')
                return
            }
        }

        const { error } = editando
            ? await actualizarCliente(editando, form)
            : await agregarCliente(form)

        if (error) {
            setError(error.message)
            return
        }

        setForm(clienteVacio)
        setEditando(null)
        setMostrarForm(false)
    }

    const handleEditar = (cliente) => {
        setForm({
            nombre: cliente.nombre,
            cedula: cliente.cedula,
            numero: cliente.numero,
            correo: cliente.correo,
        })
        setEditando(cliente.id)
        setMostrarForm(true)
    }

    const handleCancelar = () => {
        setForm(clienteVacio)
        setEditando(null)
        setMostrarForm(false)
        setError(null)
    }

    const clientesFiltrados = clientes.filter(c =>
        c.nombre.toLowerCase().includes(busqueda.toLowerCase()) ||
        c.cedula?.includes(busqueda) ||
        c.correo?.toLowerCase().includes(busqueda.toLowerCase())
    )

    return (
        <Layout>
            <div className="flex justify-between items-center mb-6">
                <h2 className="text-2xl font-bold text-gray-800">Clientes</h2>
                {!mostrarForm && (
                    <button
                        className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition text-sm"
                        onClick={() => setMostrarForm(true)}
                    >
                        + Agregar cliente
                    </button>
                )}
            </div>

            {mostrarForm && (
                <div className="bg-white rounded-lg shadow-sm p-6 mb-6">
                    <h3 className="text-lg font-bold text-gray-800 mb-4">
                        {editando ? 'Editar cliente' : 'Nuevo cliente'}
                    </h3>
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
                            name="cedula"
                            placeholder="Cédula"
                            value={form.cedula}
                            onChange={handleChange}
                        />
                        <input
                            className="border border-gray-300 rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                            name="numero"
                            placeholder="Teléfono"
                            value={form.numero}
                            onChange={handleChange}
                        />
                        <input
                            className="border border-gray-300 rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                            name="correo"
                            placeholder="Correo electrónico"
                            type="email"
                            value={form.correo}
                            onChange={handleChange}
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
                    placeholder="Buscar por nombre, cédula o correo..."
                    value={busqueda}
                    onChange={(e) => setBusqueda(e.target.value)}
                />
            </div>

            <div className="bg-white rounded-lg shadow-sm overflow-hidden">
                {loading ? (
                    <p className="p-6 text-gray-500">Cargando clientes...</p>
                ) : clientesFiltrados.length === 0 ? (
                    <p className="p-6 text-gray-500">No hay clientes aún.</p>
                ) : (
                    <table className="w-full text-sm">
                        <thead className="bg-gray-50 text-gray-500 uppercase text-xs">
                        <tr>
                            <th className="px-6 py-3 text-left">Nombre</th>
                            <th className="px-6 py-3 text-left">Cédula</th>
                            <th className="px-6 py-3 text-left">Teléfono</th>
                            <th className="px-6 py-3 text-left">Correo</th>
                            <th className="px-6 py-3 text-left">Acciones</th>
                        </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100">
                        {clientesFiltrados.map(cliente => (
                            <tr key={cliente.id} className="hover:bg-gray-50">
                                <td className="px-6 py-4 font-medium text-gray-800">{cliente.nombre}</td>
                                <td className="px-6 py-4 text-gray-600">{cliente.cedula ?? '—'}</td>
                                <td className="px-6 py-4 text-gray-600">{cliente.numero ?? '—'}</td>
                                <td className="px-6 py-4 text-gray-600">{cliente.correo ?? '—'}</td>
                                <td className="px-6 py-4">
                                    <button
                                        className="text-blue-600 hover:underline text-xs"
                                        onClick={() => handleEditar(cliente)}
                                    >
                                        Editar
                                    </button>
                                    <button
                                        className="text-red-500 hover:underline text-xs"
                                        onClick={() => eliminarCliente(cliente.id)}
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