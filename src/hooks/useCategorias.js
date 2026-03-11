import { useEffect, useState } from 'react'
import { supabase } from '../supabaseClient'

export function useCategorias() {
    const [categorias, setCategorias] = useState([])
    const [loading, setLoading] = useState(true)

    useEffect(() => { fetchCategorias() }, [])

    async function fetchCategorias() {
        const { data } = await supabase
            .from('categorias')
            .select('*')
            .order('nombre')
        if (data) setCategorias(data)
        setLoading(false)
    }

    async function agregarCategoria(categoria) {
        const { error } = await supabase
            .from('categorias')
            .insert({
                nombre: categoria.nombre,
                descripcion: categoria.descripcion || null,
                aplica_iva: categoria.aplica_iva ?? true,
            })
        if (!error) await fetchCategorias()
        return { error }
    }

    async function actualizarCategoria(id, campos) {
        const { error } = await supabase
            .from('categorias')
            .update({
                nombre: campos.nombre,
                descripcion: campos.descripcion || null,
                aplica_iva: campos.aplica_iva ?? true,
                updated_at: new Date().toISOString(),
            })
            .eq('id', id)
        if (!error) await fetchCategorias()
        return { error }
    }

    async function eliminarCategoria(id) {
        const { error } = await supabase
            .from('categorias')
            .delete()
            .eq('id', id)
        if (!error) await fetchCategorias()
        return { error }
    }

    return {
        categorias,
        loading,
        fetchCategorias,
        agregarCategoria,
        actualizarCategoria,
        eliminarCategoria,
    }
}