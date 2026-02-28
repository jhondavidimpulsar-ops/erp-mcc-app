import { useEffect, useState } from 'react'
import { supabase } from '../supabaseClient'

export function useSucursales() {
    const [sucursales, setSucursales] = useState([])
    const [loading, setLoading] = useState(true)

    useEffect(() => {
        fetchSucursales()
    }, [])

    async function fetchSucursales() {
        const { data, error } = await supabase
            .from('sucursales')
            .select('*')
            .order('created_at', { ascending: true })

        if (!error) setSucursales(data)
        setLoading(false)
    }

    async function crearSucursal(sucursal) {
        const { error } = await supabase.from('sucursales').insert(sucursal)
        if (!error) fetchSucursales()
        return { error }
    }

    async function actualizarSucursal(id, sucursal) {
        const { error } = await supabase.from('sucursales').update(sucursal).eq('id', id)
        if (!error) fetchSucursales()
        return { error }
    }

    async function eliminarSucursal(id) {
        const { error } = await supabase.from('sucursales').delete().eq('id', id)
        if (!error) fetchSucursales()
        return { error }
    }

    return { sucursales, loading, crearSucursal, actualizarSucursal, eliminarSucursal }
}