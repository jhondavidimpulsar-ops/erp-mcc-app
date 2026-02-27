import { useEffect, useState } from 'react'
import { supabase } from '../supabaseClient'

export function useDashboard() {
    const [stats, setStats] = useState({
        productos: 0,
        ventasHoy: 0,
        clientes: 0,
        totalHoy: 0,
    })
    const [ventasRecientes, setVentasRecientes] = useState([])
    const [loading, setLoading] = useState(true)

    useEffect(() => {
        fetchStats()
    }, [])

    async function fetchStats() {
        const hoy = new Date().toISOString().split('T')[0]

        const [
            { count: productos },
            { count: clientes },
            { data: ventasHoy },
            { data: recientes },
        ] = await Promise.all([
            supabase.from('productos').select('*', { count: 'exact', head: true }),
            supabase.from('clientes').select('*', { count: 'exact', head: true }),
            supabase.from('ventas').select(`
        id,
        ventas_detalle(cantidad, productos(precio))
      `).gte('created_at', hoy),
            supabase.from('ventas').select(`
        id,
        created_at,
        clientes(nombre),
        sucursales(nombre),
        tipo_pago(nombre),
        ventas_detalle(cantidad, productos(precio))
      `)
                .order('created_at', { ascending: false })
                .limit(5),
        ])

        const totalHoy = ventasHoy?.reduce((acc, venta) =>
                acc + venta.ventas_detalle?.reduce((a, d) =>
                    a + d.productos?.precio * d.cantidad, 0
                ), 0
        ) ?? 0

        setStats({
            productos: productos ?? 0,
            ventasHoy: ventasHoy?.length ?? 0,
            clientes: clientes ?? 0,
            totalHoy,
        })

        setVentasRecientes(recientes ?? [])
        setLoading(false)
    }

    return { stats, ventasRecientes, loading }
}