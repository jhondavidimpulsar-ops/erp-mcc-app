import { useState } from 'react'
import Layout from '../../components/Layout'
import { useOrganizacion } from '../../hooks/useOrganizacion'
import { useActividad } from '../../hooks/useActividad'
import { useCategorias } from '../../hooks/useCategorias'
import { useParametros } from '../../hooks/useParametros'

const TABS = [
    { id: 'organizacion', label: '🏢 Organización' },
    { id: 'categorias', label: '🏷️ Categorías' },
    { id: 'parametros', label: '⚙️ Parámetros' },
    { id: 'actividad', label: '📋 Actividad' },
]

export default function Admin() {
    const [tab, setTab] = useState('organizacion')

    return (
        <Layout>
            <div className="mb-6">
                <h2 className="text-2xl font-bold text-gray-800">Administración</h2>
                <p className="text-gray-500 text-sm mt-1">Configuración general del sistema</p>
            </div>

            {/* Tabs */}
            <div className="flex gap-2 mb-6 border-b border-gray-200">
                {TABS.map(t => (
                    <button
                        key={t.id}
                        onClick={() => setTab(t.id)}
                        className={`px-4 py-2 text-sm font-medium border-b-2 transition -mb-px ${
                            tab === t.id
                                ? 'border-blue-600 text-blue-600'
                                : 'border-transparent text-gray-500 hover:text-gray-700'
                        }`}
                    >
                        {t.label}
                    </button>
                ))}
            </div>

            {tab === 'organizacion' && <TabOrganizacion />}
            {tab === 'categorias' && <TabCategorias />}
            {tab === 'parametros' && <TabParametros />}
            {tab === 'actividad' && <TabActividad />}
        </Layout>
    )
}

// ─── TAB ORGANIZACIÓN ───────────────────────────────────────────────────────
function TabOrganizacion() {
    const { organizacion, loading, guardando, actualizarOrganizacion, subirLogo } = useOrganizacion()
    const [form, setForm] = useState(null)
    const [logoArchivo, setLogoArchivo] = useState(null)
    const [exito, setExito] = useState(false)
    const [error, setError] = useState(null)
    const [subiendoLogo, setSubiendoLogo] = useState(false)

    // Inicializar form cuando carga la org
    if (!form && organizacion) {
        setForm({
            nombre: organizacion.nombre ?? '',
            ruc: organizacion.ruc ?? '',
            direccion: organizacion.direccion ?? '',
            telefono: organizacion.telefono ?? '',
            correo: organizacion.correo ?? '',
            color_primario: organizacion.color_primario ?? '#2563eb',
        })
    }

    const handleGuardar = async () => {
        setError(null)
        if (!form.nombre) return setError('El nombre es obligatorio.')

        // Subir logo si hay uno nuevo
        if (logoArchivo) {
            setSubiendoLogo(true)
            const { error: logoError } = await subirLogo(logoArchivo)
            setSubiendoLogo(false)
            if (logoError) return setError('Error al subir el logo: ' + logoError.message)
        }

        const { error } = await actualizarOrganizacion(form)
        if (error) return setError(error.message)

        setExito(true)
        setLogoArchivo(null)
        setTimeout(() => setExito(false), 2500)
    }

    if (loading || !form) return <p className="text-gray-500">Cargando...</p>

    return (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Formulario */}
            <div className="lg:col-span-2 bg-white rounded-lg shadow-sm p-6 flex flex-col gap-4">
                <h3 className="font-bold text-gray-800 mb-2">Datos de la organización</h3>

                {exito && (
                    <div className="bg-green-100 text-green-700 px-4 py-3 rounded-lg text-sm">
                        ✅ Cambios guardados correctamente
                    </div>
                )}
                {error && <p className="text-red-500 text-sm">{error}</p>}

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                        <label className="text-sm font-medium text-gray-700 mb-1 block">Nombre *</label>
                        <input
                            className="border border-gray-300 rounded-lg px-4 py-2 w-full focus:outline-none focus:ring-2 focus:ring-blue-500"
                            value={form.nombre}
                            onChange={(e) => setForm({ ...form, nombre: e.target.value })}
                        />
                    </div>
                    <div>
                        <label className="text-sm font-medium text-gray-700 mb-1 block">RUC / NIT</label>
                        <input
                            className="border border-gray-300 rounded-lg px-4 py-2 w-full focus:outline-none focus:ring-2 focus:ring-blue-500"
                            value={form.ruc}
                            onChange={(e) => setForm({ ...form, ruc: e.target.value })}
                        />
                    </div>
                    <div>
                        <label className="text-sm font-medium text-gray-700 mb-1 block">Teléfono</label>
                        <input
                            className="border border-gray-300 rounded-lg px-4 py-2 w-full focus:outline-none focus:ring-2 focus:ring-blue-500"
                            value={form.telefono}
                            onChange={(e) => setForm({ ...form, telefono: e.target.value })}
                        />
                    </div>
                    <div>
                        <label className="text-sm font-medium text-gray-700 mb-1 block">Correo</label>
                        <input
                            className="border border-gray-300 rounded-lg px-4 py-2 w-full focus:outline-none focus:ring-2 focus:ring-blue-500"
                            type="email"
                            value={form.correo}
                            onChange={(e) => setForm({ ...form, correo: e.target.value })}
                        />
                    </div>
                    <div className="md:col-span-2">
                        <label className="text-sm font-medium text-gray-700 mb-1 block">Dirección</label>
                        <input
                            className="border border-gray-300 rounded-lg px-4 py-2 w-full focus:outline-none focus:ring-2 focus:ring-blue-500"
                            value={form.direccion}
                            onChange={(e) => setForm({ ...form, direccion: e.target.value })}
                        />
                    </div>
                    <div>
                        <label className="text-sm font-medium text-gray-700 mb-1 block">Color primario</label>
                        <div className="flex gap-3 items-center">
                            <input
                                type="color"
                                className="w-12 h-10 rounded cursor-pointer border border-gray-300"
                                value={form.color_primario}
                                onChange={(e) => setForm({ ...form, color_primario: e.target.value })}
                            />
                            <span className="text-sm text-gray-500">{form.color_primario}</span>
                        </div>
                    </div>
                </div>

                <button
                    className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 transition text-sm self-start disabled:opacity-50"
                    onClick={handleGuardar}
                    disabled={guardando || subiendoLogo}
                >
                    {guardando || subiendoLogo ? 'Guardando...' : 'Guardar cambios'}
                </button>
            </div>

            {/* Logo */}
            <div className="bg-white rounded-lg shadow-sm p-6 flex flex-col gap-4">
                <h3 className="font-bold text-gray-800 mb-2">Logo</h3>
                <div className="flex flex-col items-center gap-4">
                    <div className="w-32 h-32 rounded-lg border-2 border-dashed border-gray-300 flex items-center justify-center overflow-hidden bg-gray-50">
                        {logoArchivo ? (
                            <img src={URL.createObjectURL(logoArchivo)} className="w-full h-full object-contain" alt="Preview" />
                        ) : organizacion?.logo_url ? (
                            <img src={organizacion.logo_url} className="w-full h-full object-contain" alt="Logo" />
                        ) : (
                            <p className="text-gray-400 text-xs text-center">Sin logo</p>
                        )}
                    </div>
                    <label className="bg-gray-100 text-gray-700 px-4 py-2 rounded-lg text-sm hover:bg-gray-200 transition cursor-pointer">
                        Seleccionar imagen
                        <input
                            type="file"
                            accept="image/*"
                            className="hidden"
                            onChange={(e) => setLogoArchivo(e.target.files[0])}
                        />
                    </label>
                    {logoArchivo && (
                        <p className="text-xs text-gray-500">Guarda los cambios para subir el logo</p>
                    )}
                </div>

                {/* Preview color */}
                <div className="mt-4">
                    <p className="text-sm font-medium text-gray-700 mb-2">Preview color</p>
                    <div
                        className="w-full h-10 rounded-lg flex items-center justify-center text-white text-sm font-medium"
                        style={{ backgroundColor: form?.color_primario }}
                    >
                        {form?.nombre}
                    </div>
                </div>
            </div>
        </div>
    )
}

// ─── TAB CATEGORÍAS ──────────────────────────────────────────────────────────
function TabCategorias() {
    const { categorias, loading, agregarCategoria, actualizarCategoria, eliminarCategoria } = useCategorias()
    const [mostrarForm, setMostrarForm] = useState(false)
    const [editando, setEditando] = useState(null)
    const [form, setForm] = useState({ nombre: '', descripcion: '', aplica_iva: true })
    const [error, setError] = useState(null)

    const handleGuardar = async () => {
        setError(null)
        if (!form.nombre) return setError('El nombre es obligatorio.')

        const { error } = editando
            ? await actualizarCategoria(editando, form)
            : await agregarCategoria(form)

        if (error) return setError(error.message)

        setMostrarForm(false)
        setEditando(null)
        setForm({ nombre: '', descripcion: '', aplica_iva: true })
    }

    const handleEditar = (cat) => {
        setEditando(cat.id)
        setForm({
            nombre: cat.nombre,
            descripcion: cat.descripcion ?? '',
            aplica_iva: cat.aplica_iva ?? true,
        })
        setMostrarForm(true)
    }

    const handleCancelar = () => {
        setMostrarForm(false)
        setEditando(null)
        setForm({ nombre: '', descripcion: '', aplica_iva: true })
        setError(null)
    }

    return (
        <div className="flex flex-col gap-4">
            <div className="flex justify-between items-center">
                <p className="text-gray-500 text-sm">{categorias.length} categorías registradas</p>
                {!mostrarForm && (
                    <button
                        className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition text-sm"
                        onClick={() => setMostrarForm(true)}
                    >
                        + Nueva categoría
                    </button>
                )}
            </div>

            {mostrarForm && (
                <div className="bg-white rounded-lg shadow-sm p-6 flex flex-col gap-4">
                    <h3 className="font-bold text-gray-800">
                        {editando ? 'Editar categoría' : 'Nueva categoría'}
                    </h3>
                    {error && <p className="text-red-500 text-sm">{error}</p>}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                            <label className="text-sm font-medium text-gray-700 mb-1 block">Nombre *</label>
                            <input
                                className="border border-gray-300 rounded-lg px-4 py-2 w-full focus:outline-none focus:ring-2 focus:ring-blue-500"
                                value={form.nombre}
                                onChange={(e) => setForm({ ...form, nombre: e.target.value })}
                            />
                        </div>
                        <div>
                            <label className="text-sm font-medium text-gray-700 mb-1 block">Descripción</label>
                            <input
                                className="border border-gray-300 rounded-lg px-4 py-2 w-full focus:outline-none focus:ring-2 focus:ring-blue-500"
                                value={form.descripcion}
                                onChange={(e) => setForm({ ...form, descripcion: e.target.value })}
                            />
                        </div>
                    </div>
                    <div className="flex items-center gap-3">
                        <input
                            type="checkbox"
                            id="aplica_iva"
                            checked={form.aplica_iva}
                            onChange={(e) => setForm({ ...form, aplica_iva: e.target.checked })}
                            className="w-4 h-4 accent-blue-600"
                        />
                        <label htmlFor="aplica_iva" className="text-sm text-gray-700">
                            Aplica IVA en productos de esta categoría
                        </label>
                    </div>
                    <div className="flex gap-3">
                        <button
                            className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 transition text-sm"
                            onClick={handleGuardar}
                        >
                            {editando ? 'Guardar cambios' : 'Crear categoría'}
                        </button>
                        <button
                            className="bg-gray-200 text-gray-700 px-6 py-2 rounded-lg hover:bg-gray-300 transition text-sm"
                            onClick={handleCancelar}
                        >
                            Cancelar
                        </button>
                    </div>
                </div>
            )}

            <div className="bg-white rounded-lg shadow-sm overflow-hidden">
                {loading ? (
                    <p className="p-6 text-gray-500">Cargando...</p>
                ) : categorias.length === 0 ? (
                    <p className="p-6 text-gray-500">No hay categorías registradas.</p>
                ) : (
                    <table className="w-full text-sm">
                        <thead className="bg-gray-50 text-gray-500 uppercase text-xs">
                        <tr>
                            <th className="px-6 py-3 text-left">Nombre</th>
                            <th className="px-6 py-3 text-left">Descripción</th>
                            <th className="px-6 py-3 text-left">IVA</th>
                            <th className="px-6 py-3 text-left">Acciones</th>
                        </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100">
                        {categorias.map(cat => (
                            <tr key={cat.id} className="hover:bg-gray-50">
                                <td className="px-6 py-4 font-medium text-gray-800">{cat.nombre}</td>
                                <td className="px-6 py-4 text-gray-500">{cat.descripcion ?? '—'}</td>
                                <td className="px-6 py-4">
                                        <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                                            cat.aplica_iva
                                                ? 'bg-green-100 text-green-700'
                                                : 'bg-gray-100 text-gray-500'
                                        }`}>
                                            {cat.aplica_iva ? 'Aplica' : 'No aplica'}
                                        </span>
                                </td>
                                <td className="px-6 py-4 flex gap-3">
                                    <button
                                        className="text-blue-600 hover:underline text-xs"
                                        onClick={() => handleEditar(cat)}
                                    >
                                        Editar
                                    </button>
                                    <button
                                        className="text-red-500 hover:underline text-xs"
                                        onClick={() => eliminarCategoria(cat.id)}
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
        </div>
    )
}

// ─── TAB PARÁMETROS ──────────────────────────────────────────────────────────
function TabParametros() {
    const { parametros, loading, guardando, actualizarParametro } = useParametros()
    const [editando, setEditando] = useState(null)
    const [valorTemp, setValorTemp] = useState('')
    const [exito, setExito] = useState(null)

    const handleEditar = (param) => {
        setEditando(param.clave)
        setValorTemp(param.valor)
    }

    const handleGuardar = async (clave) => {
        const { error } = await actualizarParametro(clave, valorTemp)
        if (!error) {
            setEditando(null)
            setExito(clave)
            setTimeout(() => setExito(null), 2000)
        }
    }

    const labelMap = {
        iva: 'IVA (%)',
        moneda_defecto: 'Moneda predeterminada',
        decimales: 'Decimales en precios',
        nombre_sistema: 'Nombre del sistema',
    }

    const descripcionMap = {
        iva: 'Porcentaje de IVA aplicado en ventas (ej: 15)',
        moneda_defecto: 'USD o COP',
        decimales: 'Número de decimales (ej: 2)',
        nombre_sistema: 'Nombre visible en la interfaz',
    }

    return (
        <div className="flex flex-col gap-4">
            <p className="text-gray-500 text-sm">
                Configura los parámetros globales del sistema.
            </p>
            <div className="bg-white rounded-lg shadow-sm overflow-hidden">
                {loading ? (
                    <p className="p-6 text-gray-500">Cargando...</p>
                ) : (
                    <table className="w-full text-sm">
                        <thead className="bg-gray-50 text-gray-500 uppercase text-xs">
                        <tr>
                            <th className="px-6 py-3 text-left">Parámetro</th>
                            <th className="px-6 py-3 text-left">Descripción</th>
                            <th className="px-6 py-3 text-left">Valor</th>
                            <th className="px-6 py-3 text-left">Acción</th>
                        </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100">
                        {parametros.map(param => (
                            <tr key={param.clave} className="hover:bg-gray-50">
                                <td className="px-6 py-4 font-medium text-gray-800">
                                    {labelMap[param.clave] ?? param.clave}
                                </td>
                                <td className="px-6 py-4 text-gray-500 text-xs">
                                    {descripcionMap[param.clave] ?? param.descripcion ?? '—'}
                                </td>
                                <td className="px-6 py-4">
                                    {editando === param.clave ? (
                                        <input
                                            className="border border-gray-300 rounded-lg px-3 py-1 w-32 focus:outline-none focus:ring-2 focus:ring-blue-500"
                                            value={valorTemp}
                                            onChange={(e) => setValorTemp(e.target.value)}
                                        />
                                    ) : (
                                        <span className="font-medium text-gray-800">
                                                {param.clave === 'iva' ? `${param.valor}%` : param.valor}
                                            {exito === param.clave && (
                                                <span className="ml-2 text-green-600 text-xs">✅ Guardado</span>
                                            )}
                                            </span>
                                    )}
                                </td>
                                <td className="px-6 py-4">
                                    {editando === param.clave ? (
                                        <div className="flex gap-2">
                                            <button
                                                className="text-green-600 hover:underline text-xs disabled:opacity-50"
                                                onClick={() => handleGuardar(param.clave)}
                                                disabled={guardando}
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
                                            onClick={() => handleEditar(param)}
                                        >
                                            Editar
                                        </button>
                                    )}
                                </td>
                            </tr>
                        ))}
                        </tbody>
                    </table>
                )}
            </div>
        </div>
    )
}

// ─── TAB ACTIVIDAD ───────────────────────────────────────────────────────────
function TabActividad() {
    const { actividad, loading, fetchActividad } = useActividad()
    const [busqueda, setBusqueda] = useState('')
    const [filtroModulo, setFiltroModulo] = useState('')

    const modulosUnicos = [...new Set(actividad.map(a => a.modulo).filter(Boolean))]

    const actividadFiltrada = actividad.filter(a => {
        const matchBusqueda =
            a.descripcion?.toLowerCase().includes(busqueda.toLowerCase()) ||
            a.empleados?.nombre?.toLowerCase().includes(busqueda.toLowerCase()) ||
            a.accion?.toLowerCase().includes(busqueda.toLowerCase())
        const matchModulo = filtroModulo ? a.modulo === filtroModulo : true
        return matchBusqueda && matchModulo
    })

    const colorModulo = {
        ventas: 'bg-blue-100 text-blue-700',
        inventario: 'bg-yellow-100 text-yellow-700',
        cxc: 'bg-purple-100 text-purple-700',
        cxp: 'bg-red-100 text-red-700',
        productos: 'bg-green-100 text-green-700',
        compras: 'bg-orange-100 text-orange-700',
    }

    return (
        <div className="flex flex-col gap-4">
            {/* Filtros */}
            <div className="bg-white rounded-lg shadow-sm p-4 flex flex-wrap gap-4 items-end">
                <div className="flex-1 min-w-48">
                    <label className="text-xs font-medium text-gray-500 mb-1 block">Buscar</label>
                    <input
                        className="border border-gray-300 rounded-lg px-4 py-2 w-full focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
                        placeholder="Usuario, acción o descripción..."
                        value={busqueda}
                        onChange={(e) => setBusqueda(e.target.value)}
                    />
                </div>
                <div>
                    <label className="text-xs font-medium text-gray-500 mb-1 block">Módulo</label>
                    <select
                        className="border border-gray-300 rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
                        value={filtroModulo}
                        onChange={(e) => setFiltroModulo(e.target.value)}
                    >
                        <option value="">Todos</option>
                        {modulosUnicos.map(m => (
                            <option key={m} value={m}>{m}</option>
                        ))}
                    </select>
                </div>
                <button
                    className="text-sm text-blue-600 hover:underline"
                    onClick={fetchActividad}
                >
                    🔄 Actualizar
                </button>
                <p className="text-xs text-gray-400 ml-auto self-center">
                    {actividadFiltrada.length} registros
                </p>
            </div>

            <div className="bg-white rounded-lg shadow-sm overflow-hidden">
                {loading ? (
                    <p className="p-6 text-gray-500">Cargando actividad...</p>
                ) : actividadFiltrada.length === 0 ? (
                    <div className="p-6 text-center">
                        <p className="text-gray-500">No hay actividad registrada aún.</p>
                        <p className="text-gray-400 text-xs mt-1">
                            La actividad se registrará automáticamente con el uso del sistema.
                        </p>
                    </div>
                ) : (
                    <table className="w-full text-sm">
                        <thead className="bg-gray-50 text-gray-500 uppercase text-xs">
                        <tr>
                            <th className="px-6 py-3 text-left">Usuario</th>
                            <th className="px-6 py-3 text-left">Módulo</th>
                            <th className="px-6 py-3 text-left">Acción</th>
                            <th className="px-6 py-3 text-left">Descripción</th>
                            <th className="px-6 py-3 text-left">Fecha</th>
                        </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100">
                        {actividadFiltrada.map(a => (
                            <tr key={a.id} className="hover:bg-gray-50">
                                <td className="px-6 py-4 font-medium text-gray-800">
                                    {a.empleados?.nombre ?? 'Sistema'}
                                </td>
                                <td className="px-6 py-4">
                                    {a.modulo && (
                                        <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                                            colorModulo[a.modulo] ?? 'bg-gray-100 text-gray-600'
                                        }`}>
                                                {a.modulo}
                                            </span>
                                    )}
                                </td>
                                <td className="px-6 py-4 text-gray-600">{a.accion}</td>
                                <td className="px-6 py-4 text-gray-500 text-xs max-w-xs truncate">
                                    {a.descripcion ?? '—'}
                                </td>
                                <td className="px-6 py-4 text-gray-500 text-xs">
                                    {new Date(a.created_at).toLocaleDateString()} {new Date(a.created_at).toLocaleTimeString()}
                                </td>
                            </tr>
                        ))}
                        </tbody>
                    </table>
                )}
            </div>
        </div>
    )
}