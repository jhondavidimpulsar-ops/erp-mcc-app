import { useEffect, useState } from 'react'
import { supabase } from '../supabaseClient'

export function useInventario() {
    const [inventario, setInventario] = useState([])
    const [loading, setLoading] = useState(true)

    useEffect(() => {
        fetchInventario()
    }, [])

    async function fetchInventario() {
        const { data, error } = await supabase
            .from('inventario')
            .select(`
        *,
        productos (nombre, codigo),
        sucursales (nombre)
      `)
            .order('created_at', { ascending: false })

        if (!error) setInventario(data)
        setLoading(false)
    }

    async function ajustarCantidad(id, cantidad) {
        const { error } = await supabase
            .from('inventario')
            .update({ cantidad: Number(cantidad) })
            .eq('id', id)

        if (!error) fetchInventario()
        return { error }
    }

    return { inventario, loading, ajustarCantidad }
}