import { useEffect, useState } from 'react'
import { supabase } from '../supabaseClient'

export function useProvedores() {
    const [provedores, setProvedores] = useState([])
    const [loading, setLoading] = useState(true)

    useEffect(() => {
        fetchProvedores()
    }, [])

    async function fetchProvedores() {
        const { data, error } = await supabase
            .from('provedores')
            .select('*')
            .order('created_at', { ascending: false })

        if (!error) setProvedores(data)
        setLoading(false)
    }

    async function agregarProvedores(provedores) {
        const { error } = await supabase.from('provedores').insert(provedores)
        if (!error) fetchProvedores()
        return { error }
    }

    async function actualizarProvedores(id, provedores) {
        const { error } = await supabase.from('provedores').update(provedores).eq('id', id)
        if (!error) fetchProvedores()
        return { error }
    }
    async function eliminarProvedores(id) {
        const { error } = await supabase.from('provedores').delete().eq('id', id)
        if (!error) fetchProvedores()
        return { error }
    }
    return { provedores, loading, agregarProvedores, actualizarProvedores, eliminarProvedores}
}