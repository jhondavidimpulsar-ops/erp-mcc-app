import { useEffect, useState } from 'react'
import { supabase } from '../supabaseClient'

export function useClientes() {
    const [clientes, setClientes] = useState([])
    const [loading, setLoading] = useState(true)

    useEffect(() => {
        fetchClientes()
    }, [])

    async function fetchClientes() {
        const { data, error } = await supabase
            .from('clientes')
            .select('*')
            .order('created_at', { ascending: false })

        if (!error) setClientes(data)
        setLoading(false)
    }

    async function agregarCliente(cliente) {
        const { error } = await supabase.from('clientes').insert(cliente)
        if (!error) fetchClientes()
        return { error }
    }

    async function actualizarCliente(id, cliente) {
        const { error } = await supabase.from('clientes').update(cliente).eq('id', id)
        if (!error) fetchClientes()
        return { error }
    }
    async function eliminarCliente(id) {
        const { error } = await supabase.from('clientes').delete().eq('id', id)
        if (!error) fetchClientes()
        return { error }
    }
    return { clientes, loading, agregarCliente, actualizarCliente, eliminarCliente }
}