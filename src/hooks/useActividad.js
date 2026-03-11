import { useEffect, useState } from 'react'
import { supabase } from '../supabaseClient'

export function useActividad() {
    const [actividad, setActividad] = useState([])
    const [loading, setLoading] = useState(true)

    useEffect(() => { fetchActividad() }, [])

    async function fetchActividad() {
        const { data } = await supabase
            .from('actividad')
            .select(`
                *,
                empleados(nombre)
            `)
            .order('created_at', { ascending: false })
            .limit(100)
        if (data) setActividad(data)
        setLoading(false)
    }

    async function registrarActividad(empleados_id, accion, modulo, descripcion, metadata = null) {
        await supabase.from('actividad').insert({
            empleados_id,
            accion,
            modulo,
            descripcion,
            metadata,
        })
    }

    return { actividad, loading, registrarActividad, fetchActividad }
}