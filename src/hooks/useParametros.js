import { useEffect, useState } from 'react'
import { supabase } from '../supabaseClient'

export function useParametros() {
    const [parametros, setParametros] = useState([])
    const [loading, setLoading] = useState(true)
    const [guardando, setGuardando] = useState(false)

    useEffect(() => { fetchParametros() }, [])

    async function fetchParametros() {
        const { data } = await supabase
            .from('parametros')
            .select('*')
            .order('clave')
        if (data) setParametros(data)
        setLoading(false)
    }

    async function actualizarParametro(clave, valor) {
        setGuardando(true)
        const { error } = await supabase
            .from('parametros')
            .update({ valor, updated_at: new Date().toISOString() })
            .eq('clave', clave)
        if (!error) await fetchParametros()
        setGuardando(false)
        return { error }
    }

    // Helper para obtener valor por clave
    function getParametro(clave) {
        return parametros.find(p => p.clave === clave)?.valor ?? null
    }

    return { parametros, loading, guardando, actualizarParametro, getParametro }
}