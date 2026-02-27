import { useState } from 'react'
import Layout from '../../components/Layout'
import { useProductos } from '../../hooks/useProductos'

const productoVacio = {
    nombre: '',
    codigo: '',
    precio: '',
    costo: '',
    categorias_id: '',
    sucursales_id: '',
}

export default function Productos() {
    const { productos, categorias, sucursales, loading, agregarProducto, actualizarProducto, eliminarProducto } = useProductos()
    const [mostrarForm, setMostrarForm] = useState(false)
    const [form, setForm] = useState(productoVacio)
    const [editando, setEditando] = useState(null)
    const [error, setError] = useState(null)

    const handleChange = (e) => {
        setForm({ ...form, [e.target.name]: e.target.value })
    }

    const handleSubmit = async (e) => {
        e.preventDefault()
        setError(null)

        const { error } = editando
            ? await actualizarProducto(editando, form)
            : await agregarProducto(form)

        if (error) {
            setError(error.message)
            return
        }

        setForm(productoVacio)
        setEditando(null)
        setMostrarForm(false)
    }

    const handleEditar = (producto) => {
        setForm({
            nombre: producto.nombre,
            codigo: producto.codigo,
            precio: producto.precio,
            costo: producto.costo,
            categorias_id: producto.categorias_id,
            sucursales_id: producto.sucursales_id,
        })
        setEditando(producto.id)
        setMostrarForm(true)
    }

    const handleCancelar = () => {
        setForm(productoVacio)
        setEditando(null)
        setMostrarForm(false)
        setError(null)
    }

    return (
        <Layout>
            <div className="flex justify-between items-center mb-6">
                <select
                    className="border border-gray-300 rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                    name="sucursales_id"
                    value={form.sucursales_id}
                    onChange={handleChange}
                >
                    <option value="">Sin sucursal específica</option>
                    {sucursales.map(suc => (
                        <option key={suc.id} value={suc.id}>{suc.nombre}</option>
                    ))}
                </select>
                <h2 className="text-2xl font-bold text-gray-800">Productos</h2>
                {!mostrarForm && (
                    <button
                        className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition text-sm"
                        onClick={() => setMostrarForm(true)}
                    >
                        + Agregar producto
                    </button>
                )}
            </div>

            {mostrarForm && (
                <div className="bg-white rounded-lg shadow-sm p-6 mb-6">
                    <h3 className="text-lg font-bold text-gray-800 mb-4">
                        {editando ? 'Editar producto' : 'Nuevo producto'}
                    </h3>
                    <form onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <input className="border border-gray-300 rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                               name="codigo"
                               placeholder="Código"
                               value={form.codigo}
                               onChange={handleChange}
                               required
                        />
                        <input className="border border-gray-300 rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                            name="nombre"
                            placeholder="Nombre"
                            value={form.nombre}
                            onChange={handleChange}
                            required
                        />
                        <input className="border border-gray-300 rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                            name="costo"
                            placeholder="Costo"
                            type="number"
                            value={form.costo}
                            onChange={handleChange}
                            required
                        />
                        <input
                            className="border border-gray-300 rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                            name="precio"
                            placeholder="Precio de venta"
                            type="number"
                            value={form.precio}
                            onChange={handleChange}
                            required
                        />
                        <select className="border border-gray-300 rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                            name="categorias_id"
                            value={form.categorias_id}
                            onChange={handleChange}
                            required
                        >
                            <option value="">Selecciona una categoría</option>
                            {categorias.map(cat => (
                                <option key={cat.id} value={cat.id}>{cat.nombre}</option>
                            ))}
                        </select>

                        {error && <p className="text-red-500 text-sm col-span-2">{error}</p>}

                        <div className="col-span-2 flex gap-3">
                            <button className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 transition text-sm"
                                type="submit"
                            >
                                {editando ? 'Guardar cambios' : 'Agregar'}
                            </button>
                            <button className="bg-gray-200 text-gray-700 px-6 py-2 rounded-lg hover:bg-gray-300 transition text-sm"
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
                    <p className="p-6 text-gray-500">Cargando productos...</p>
                ) : productos.length === 0 ? (
                    <p className="p-6 text-gray-500">No hay productos aún.</p>
                ) : (
                    <table className="w-full text-sm">
                        <thead className="bg-gray-50 text-gray-500 uppercase text-xs">
                        <tr>
                            <th className="px-6 py-3 text-left">Código</th>
                            <th className="px-6 py-3 text-left">Nombre</th>
                            <th className="px-6 py-3 text-left">Categoría</th>
                            <th className="px-6 py-3 text-left">Costo</th>
                            <th className="px-6 py-3 text-left">Precio</th>
                            <th className="px-6 py-3 text-left">Acciones</th>
                        </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100">
                        {productos.map(producto => (
                            <tr key={producto.id} className="hover:bg-gray-50">
                                <td className="px-6 py-4 text-gray-600">{producto.codigo}</td>
                                <td className="px-6 py-4 font-medium text-gray-800">{producto.nombre}</td>
                                <td className="px-6 py-4 text-gray-600">{producto.categorias?.nombre ?? '—'}</td>
                                <td className="px-6 py-4 text-gray-600">${producto.costo}</td>
                                <td className="px-6 py-4 text-gray-600">${producto.precio}</td>
                                <td className="px-6 py-4 flex gap-2">
                                    <button
                                        className="text-blue-600 hover:underline text-xs"
                                        onClick={() => handleEditar(producto)}
                                    >
                                        Editar
                                    </button>
                                    <button
                                        className="text-red-500 hover:underline text-xs"
                                        onClick={() => eliminarProducto(producto.id)}
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