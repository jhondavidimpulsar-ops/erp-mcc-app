import { useState } from 'react'
import Layout from '../../components/Layout'
import { useEmpleados } from '../../hooks/useEmpleados'

const empleadoVacio = {
    nombre: '',
    correo: '',
    password: '',
    rol_id: '',
    sucursal_ids: [],
}

export default function Empleados() {
    const { empleados, roles, sucursales, loading, crearEmpleado, actualizarEmpleado, eliminarEmpleado } = useEmpleados()
    const [mostrarForm, setMostrarForm] = useState(false)
    const [form, setForm] = useState(empleadoVacio)
    const [editando, setEditando] = useState(null)
    const [error, setError] = useState(null)
    const [exito, setExito] = useState(false)

    const handleChange = (e) => {
        setForm({ ...form, [e.target.name]: e.target.value })
    }

    const handleSucursalToggle = (id) => {
        setForm(prev => ({
            ...prev,
            sucursal_ids: prev.sucursal_ids.includes(id)
                ? prev.sucursal_ids.filter(s => s !== id)
                : [...prev.sucursal_ids, id]
        }))
    }

    const handleSubmit = async (e) => {
        e.preventDefault()
        setError(null)

        if (form.sucursal_ids.length === 0) {
            setError('Selecciona al menos una sucursal.')
            return
        }

        const { error } = editando
            ? await actualizarEmpleado(editando, form)
            : await crearEmpleado(form)

        if (error) {
            setError(error.message)
            return
        }

        setExito(true)
        setTimeout(() => {
            setExito(false)
            setForm(empleadoVacio)
            setEditando(null)
            setMostrarForm(false)
        }, 1500)
    }

    const handleEditar = (empleado) => {
        setForm({
            nombre: empleado.nombre,
            correo: '',
            password: '',
            rol_id: empleado.roles_id,
            sucursal_ids: empleado.empleados_sucursales?.map(es => es.sucursales?.id) ?? [],
        })
        setEditando(empleado.id)
        setMostrarForm(true)
    }

    const handleCancelar = () => {
        setForm(empleadoVacio)
        setEditando(null)
        setMostrarForm(false)
        setError(null)
    }

    return (
        <Layout>
            <div className="flex justify-between items-center mb-6">
                <h2 className="text-2xl font-bold text-gray-800">Empleados</h2>
                {!mostrarForm && (
                    <button
                        className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition text-sm"
                        onClick={() => setMostrarForm(true)}
                    >
                        + Agregar empleado
                    </button>
                )}
            </div>

            {mostrarForm && (
                <div className="bg-white rounded-lg shadow-sm p-6 mb-6">
                    <h3 className="text-lg font-bold text-gray-800 mb-4">
                        {editando ? 'Editar empleado' : 'Nuevo empleado'}
                    </h3>

                    {exito && (
                        <div className="bg-green-100 text-green-700 px-4 py-3 rounded-lg text-sm mb-4">
                            ✅ {editando ? 'Empleado actualizado' : 'Empleado creado'} correctamente
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

                        {!editando && (
                            <>
                                <input
                                    className="border border-gray-300 rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                                    name="correo"
                                    placeholder="Correo electrónico"
                                    type="email"
                                    value={form.correo}
                                    onChange={handleChange}
                                    required
                                />
                                <input
                                    className="border border-gray-300 rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                                    name="password"
                                    placeholder="Contraseña temporal"
                                    type="password"
                                    value={form.password}
                                    onChange={handleChange}
                                    required
                                />
                            </>
                        )}

                        <select
                            className="border border-gray-300 rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                            name="rol_id"
                            value={form.rol_id}
                            onChange={handleChange}
                            required
                        >
                            <option value="">Selecciona un rol</option>
                            {roles.map(rol => (
                                <option key={rol.id} value={rol.id}>{rol.nombre}</option>
                            ))}
                        </select>

                        <div className="md:col-span-2">
                            <label className="text-sm font-medium text-gray-700 mb-2 block">Sucursales</label>
                            <div className="flex gap-4 flex-wrap">
                                {sucursales.map(suc => (
                                    <label key={suc.id} className="flex items-center gap-2 cursor-pointer text-sm">
                                        <input
                                            type="checkbox"
                                            checked={form.sucursal_ids.includes(suc.id)}
                                            onChange={() => handleSucursalToggle(suc.id)}
                                            className="w-4 h-4"
                                        />
                                        {suc.nombre}
                                    </label>
                                ))}
                            </div>
                        </div>

                        {error && <p className="text-red-500 text-sm md:col-span-2">{error}</p>}

                        <div className="md:col-span-2 flex gap-3">
                            <button
                                className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 transition text-sm"
                                type="submit"
                            >
                                {editando ? 'Guardar cambios' : 'Crear empleado'}
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
                    <p className="p-6 text-gray-500">Cargando empleados...</p>
                ) : empleados.length === 0 ? (
                    <p className="p-6 text-gray-500">No hay empleados registrados.</p>
                ) : (
                    <table className="w-full text-sm">
                        <thead className="bg-gray-50 text-gray-500 uppercase text-xs">
                        <tr>
                            <th className="px-6 py-3 text-left">Nombre</th>
                            <th className="px-6 py-3 text-left">Rol</th>
                            <th className="px-6 py-3 text-left">Sucursales</th>
                            <th className="px-6 py-3 text-left">Acciones</th>
                        </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100">
                        {empleados.map(empleado => (
                            <tr key={empleado.id} className="hover:bg-gray-50">
                                <td className="px-6 py-4 font-medium text-gray-800">{empleado.nombre}</td>
                                <td className="px-6 py-4 text-gray-600">{empleado.roles?.nombre ?? '—'}</td>
                                <td className="px-6 py-4 text-gray-600">
                                    {empleado.empleados_sucursales?.map(es => es.sucursales?.nombre).join(', ') ?? '—'}
                                </td>
                                <td className="px-6 py-4 flex gap-2">
                                    <button
                                        className="text-blue-600 hover:underline text-xs"
                                        onClick={() => handleEditar(empleado)}
                                    >
                                        Editar
                                    </button>
                                    <button
                                        className="text-red-500 hover:underline text-xs"
                                        onClick={() => eliminarEmpleado(empleado.id, empleado.auth_id)}
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