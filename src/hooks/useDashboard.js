import { useEffect, useState } from 'react'
import { supabase } from '../supabaseClient'

export function useDashboard() {
    const [stats, setStats] = useState({
        productos: 0,
        ventasHoy: 0,
        clientes: 0,
        totalesHoy: [],
    })
    const [ventasRecientes, setVentasRecientes] = useState([])
    const [sucursales, setSucursales] = useState([])
    const [sucursalFiltro, setSucursalFiltro] = useState('')
    const [loading, setLoading] = useState(true)

    useEffect(() => {
        fetchSucursales()
    }, [])

    useEffect(() => {
        fetchStats()
    }, [sucursalFiltro, sucursales])

    async function fetchSucursales() {
        const { data } = await supabase.from('sucursales').select('id, nombre, moneda, simbolo')
        if (data) setSucursales(data)
    }

    async function fetchStats() {
        const hoy = new Date().toISOString().split('T')[0]

        let queryVentasHoy = supabase
            .from('ventas')
            .select(`id, sucursales_id, ventas_detalle(cantidad, productos(precio))`)
            .gte('created_at', hoy)

        let queryRecientes = supabase
            .from('ventas')
            .select(`
        id, created_at, sucursales_id,
        clientes(nombre),
        sucursales(nombre),
        tipo_pago(nombre),
        ventas_detalle(cantidad, productos(precio))
      `)
            .order('created_at', { ascending: false })
            .limit(5)

        let queryProductos = supabase
            .from('productos')
            .select('*', { count: 'exact', head: true })

        if (sucursalFiltro) {
            queryVentasHoy = queryVentasHoy.eq('sucursales_id', sucursalFiltro)
            queryRecientes = queryRecientes.eq('sucursales_id', sucursalFiltro)
        }

        const [
            { count: productos },
            { count: clientes },
            { data: ventasHoy },
            { data: recientes },
        ] = await Promise.all([
            queryProductos,
            supabase.from('clientes').select('*', { count: 'exact', head: true }),
            queryVentasHoy,
            queryRecientes,
        ])

        // Agrupar totales por sucursal y moneda
        const totalesPorSucursal = {}
        ventasHoy?.forEach(venta => {
            const sucursal = sucursales.find(s => s.id === venta.sucursales_id)
            if (!sucursal) return
            const moneda = sucursal.moneda
            const simbolo = sucursal.simbolo
            const total = venta.ventas_detalle?.reduce(
                (acc, d) => acc + d.productos?.precio * d.cantidad, 0
            ) ?? 0

            if (!totalesPorSucursal[moneda]) {
                totalesPorSucursal[moneda] = { moneda, simbolo, total: 0 }
            }
            totalesPorSucursal[moneda].total += total
        })

        setStats({
            productos: productos ?? 0,
            ventasHoy: ventasHoy?.length ?? 0,
            clientes: clientes ?? 0,
            totalesHoy: Object.values(totalesPorSucursal),
        })

        setVentasRecientes(recientes ?? [])
        setLoading(false)
    }

    return { stats, ventasRecientes, sucursales, sucursalFiltro, setSucursalFiltro, loading }
}