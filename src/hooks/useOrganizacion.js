import { useEffect, useState } from 'react'
import { supabase } from '../supabaseClient'

export function useOrganizacion() {
    const [organizacion, setOrganizacion] = useState(null)
    const [loading, setLoading] = useState(true)
    const [guardando, setGuardando] = useState(false)

    useEffect(() => { fetchOrganizacion() }, [])

    async function fetchOrganizacion() {
        const { data } = await supabase
            .from('organizacion')
            .select('*')
            .limit(1)
            .single()
        if (data) setOrganizacion(data)
        setLoading(false)
    }

    async function actualizarOrganizacion(campos) {
        setGuardando(true)
        const { error } = await supabase
            .from('organizacion')
            .update({ ...campos, updated_at: new Date().toISOString() })
            .eq('id', organizacion.id)
        if (!error) await fetchOrganizacion()
        setGuardando(false)
        return { error }
    }

    async function subirLogo(archivo) {
        const ext = archivo.name.split('.').pop()
        const { error: uploadError } = await supabase.storage
            .from('organizacion')
            .upload(`logo.${ext}`, archivo, { upsert: true })
        if (uploadError) return { error: uploadError }

        const { data } = supabase.storage
            .from('organizacion')
            .getPublicUrl(`logo.${ext}`)

        const { error } = await actualizarOrganizacion({ logo_url: data.publicUrl })
        return { error, url: data.publicUrl }
    }

    return { organizacion, loading, guardando, actualizarOrganizacion, subirLogo }
}