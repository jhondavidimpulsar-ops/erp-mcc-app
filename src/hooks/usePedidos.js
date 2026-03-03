import { useEffect, useState } from 'react'
import { supabase } from '../supabaseClient'

export function usePedidos() {
    const [pedidos, setPedidos] = useState([])
    const [loading, setLoading] = useState(true)

    useEffect(() => {
        fetchPedidos()
    }, [])

    async function fetchPedidos() {
        setLoading(true)
        const { data, error } = await supabase
            .from('ventas')
            .select(`
                id,
                created_at,
                estado,
                notas,
                origen,
                clientes(nombre, correo, telefono, direccion),
                sucursales(nombre, moneda, simbolo),
                ventas_detalle(
                  cantidad,
                  productos(nombre, codigo, precio, costo)
                )
            `)
            .eq('origen', 'ecommerce')
            .order('created_at', { ascending: false })

        if (!error) setPedidos(data)
        setLoading(false)
    }

    async function actualizarEstado(id, estado) {
        const { error } = await supabase
            .from('ventas')
            .update({ estado })
            .eq('id', id)
        if (!error) fetchPedidos()
        return { error }
    }

    return { pedidos, loading, actualizarEstado }
}