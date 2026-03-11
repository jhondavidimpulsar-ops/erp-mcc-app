import { useState } from 'react'
import Layout from '../../components/Layout'
import { useProductos } from '../../hooks/useProductos'
import { formatMoneda } from '../../utils/formatMoneda'

const productoVacio = {
  nombre: '',
  codigo: '',
  precio: '',
  costo: '',
  categorias_id: '',
  sucursales_id: '',
  descripcion: '',
  imagen_url: '',
}

export default function Productos() {
    const { productos, categorias, sucursales, loading, agregarProducto, actualizarProducto, eliminarProducto, subirImagen } = useProductos()
    const [imagenArchivo, setImagenArchivo] = useState(null)
    const [subiendoImagen, setSubiendoImagen] = useState(false)
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

        const { error, data } = editando
            ? await actualizarProducto(editando, form)
            : await agregarProducto(form)

        if (error) { setError(error.message); return }

        // Si hay imagen, subirla
        if (imagenArchivo) {
            setSubiendoImagen(true)
            const productoId = editando || data?.id
            const { error: errorImg } = await subirImagen(productoId, imagenArchivo)
            if (errorImg) setError('Producto guardado pero error al subir imagen.')
            setSubiendoImagen(false)
        }

        setForm(productoVacio)
        setImagenArchivo(null)
        setEditando(null)
        setMostrarForm(false)
    }

    const handleEditar = (producto) => {
        setForm({
            nombre: producto.nombre,
            codigo: producto.codigo,
            precio: producto.precio,
            costo: producto.costo,
            categorias_id: producto.categorias_id ?? '',
            sucursales_id: producto.sucursales_id ?? '',
            descripcion: producto.descripcion ?? '',
            imagen_url: producto.imagen_url ?? '',
        })
        setImagenArchivo(null)
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

                        <div className="col-span-2">
                            <label className="text-sm font-medium text-gray-700 mb-1 block">
                                Imagen del producto
                            </label>
                            <div className="flex items-center gap-4">
                                {(imagenArchivo || form.imagen_url) && (
                                    <img
                                        src={imagenArchivo ? URL.createObjectURL(imagenArchivo) : form.imagen_url}
                                        alt="preview"
                                        className="w-16 h-16 object-cover rounded-lg border border-gray-200"
                                    />
                                )}
                                <input
                                    type="file"
                                    accept="image/*"
                                    placeholder="Agrege la imagen"
                                    className="text-sm text-gray-600"
                                    onChange={(e) => setImagenArchivo(e.target.files[0])}
                                />
                            </div>
                        </div>

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
                            <th className="px-6 py-3 text-left">Imagen</th>
                            <th className="px-6 py-3 text-left">Acciones</th>
                        </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100">
                        {productos.map(producto => (
                            <tr key={producto.id} className="hover:bg-gray-50">
                                <td className="px-6 py-4 text-gray-600">{producto.codigo}</td>
                                <td className="px-6 py-4 font-medium text-gray-800">{producto.nombre}</td>
                                <td className="px-6 py-4 text-gray-600">{producto.categorias?.nombre ?? '—'}</td>
                                <td className="px-6 py-4 text-gray-600">{formatMoneda(producto.costo, 'USD', '$')}</td>
                                <td className="px-6 py-4 text-gray-600">{formatMoneda(producto.precio, 'USD', '$')}</td>
                                <td className="px-6 py-4">
                                    {producto.imagen_url ? (
                                        <img
                                            src={producto.imagen_url}
                                            alt={producto.nombre}
                                            className="w-10 h-10 object-cover rounded-lg"
                                        />
                                    ) : (
                                        <div className="w-10 h-10 bg-gray-100 rounded-lg flex items-center justify-center text-gray-400 text-xs">
                                            Sin imagen
                                        </div>
                                    )}
                                </td>

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
