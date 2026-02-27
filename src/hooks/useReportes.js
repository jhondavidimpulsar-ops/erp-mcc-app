import { useEffect, useState } from 'react'
import { supabase } from '../supabaseClient'

export function useReportes() {
    const [ventasDiarias, setVentasDiarias] = useState([])
    const [productosVendidos, setProductosVendidos] = useState([])
    const [inventarioBajo, setInventarioBajo] = useState([])
    const [sucursales, setSucursales] = useState([])
    const [loading, setLoading] = useState(true)

    const [filtros, setFiltros] = useState({
        fechaInicio: new Date(new Date().setDate(new Date().getDate() - 7))
            .toISOString().split('T')[0],
        fechaFin: new Date().toISOString().split('T')[0],
        sucursalId: '',
    })

    useEffect(() => {
        fetchSucursales()
    }, [])

    useEffect(() => {
        fetchReportes()
    }, [filtros])

    async function fetchSucursales() {
        const { data } = await supabase.from('sucursales').select('*')
        if (data) setSucursales(data)
    }

    async function fetchReportes() {
        setLoading(true)

        let queryVentas = supabase
            .from('reporte_ventas_diarias')
            .select('*')
            .gte('fecha', filtros.fechaInicio)
            .lte('fecha', filtros.fechaFin)

        if (filtros.sucursalId) {
            queryVentas = queryVentas.eq('sucursal',
                sucursales.find(s => s.id === filtros.sucursalId)?.nombre
            )
        }

        const [
            { data: ventas },
            { data: productos },
            { data: inventario },
        ] = await Promise.all([
            queryVentas,
            supabase.from('reporte_productos_vendidos').select('*').limit(10),
            supabase.from('reporte_inventario_bajo').select('*'),
        ])

        setVentasDiarias(ventas ?? [])
        setProductosVendidos(productos ?? [])
        setInventarioBajo(inventario ?? [])
        setLoading(false)
    }

    return {
        ventasDiarias,
        productosVendidos,
        inventarioBajo,
        sucursales,
        loading,
        filtros,
        setFiltros,
    }
}