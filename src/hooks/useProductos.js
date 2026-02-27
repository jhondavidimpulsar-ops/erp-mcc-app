import { useEffect, useState } from 'react'
import { supabase } from '../supabaseClient'

export function useProductos() {
    const [productos, setProductos] = useState([])
    const [categorias, setCategorias] = useState([])
    const [sucursales, setSucursales] = useState([])
    const [loading, setLoading] = useState(true)

    async function fetchProductos() {
        const { data, error } = await supabase
            .from('productos')
            .select(`
        *,
        categorias (nombre)
      `)
            .order('created_at', { ascending: false })

        if (!error) setProductos(data)
        setLoading(false)
    }

    async function fetchCategorias() {
        const { data } = await supabase.from('categorias').select('*')
        if (data) setCategorias(data)
    }

    async function agregarProducto(producto) {
        const datos = {
            ...producto,
            sucursales_id: producto.sucursales_id || null,
            categorias_id: producto.categorias_id || null,
        }

        const { data, error } = await supabase
            .from('productos')
            .insert(datos)
            .select()
            .single()

        if (!error && data) {
            const { data: sucursales } = await supabase.from('sucursales').select('id')

            const registrosInventario = sucursales.map(suc => ({
                productos_id: data.id,
                sucursales_id: suc.id,
                cantidad: 0,
            }))

            await supabase.from('inventario').insert(registrosInventario)
            fetchProductos()
        }

        return { error }
    }

    async function actualizarProducto(id, producto) {
        const datos = {
            ...producto,
            sucursales_id: producto.sucursales_id || null,
            categorias_id: producto.categorias_id || null,
        }
        const { error } = await supabase.from('productos').update(datos).eq('id', id)
        if (!error) fetchProductos()
        return { error }
    }
    async function eliminarProducto(id) {
        const { error } = await supabase.from('productos').delete().eq('id', id)
        if (!error) fetchProductos()
        return { error }
    }
    async function fetchSucursales() {
        const { data } = await supabase.from('sucursales').select('*')
        if (data) setSucursales(data)
    }

    useEffect(() => {
        fetchProductos()
        fetchCategorias()
        fetchSucursales()
    }, [])

    return {
        productos,
        categorias,
        sucursales,
        loading,
        agregarProducto,
        actualizarProducto,
        eliminarProducto,
    }
}