import { useEffect, useState } from 'react'
import { supabase } from '../supabaseClient'

export function useVentas() {
    const [ventas, setVentas] = useState([])
    const [sucursales, setSucursales] = useState([])
    const [inventario, setInventario] = useState([])
    const [loading, setLoading] = useState(true)

    useEffect(() => {
        fetchVentas()
        fetchSucursales()
    }, [])

    async function fetchSucursales() {
        const { data } = await supabase.from('sucursales').select('id, nombre, moneda, simbolo')
        if (data) setSucursales(data)
    }

    async function fetchInventario(sucursalId) {
        const { data } = await supabase
            .from('inventario')
            .select('productos_id, cantidad')
            .eq('sucursales_id', sucursalId)
        if (data) setInventario(data)
    }

    async function fetchVentas() {
        const { data, error } = await supabase
            .from('ventas')
            .select(`
            *,
            clientes(nombre),
            sucursales(nombre),
            empleados(nombre),
            tipo_pago(nombre),
            estado,
            origen,
            ventas_detalle(
                cantidad,
                precio,
                productos(nombre, codigo, precio, costo)
            )
        `)
            .order('created_at', { ascending: false })

        if (!error) setVentas(data)
        setLoading(false)
    }

    async function registrarVenta(venta, detalle) {
        const { data, error } = await supabase
            .from('ventas')
            .insert(venta)
            .select()
            .single()

        if (error) return { error }

        const detalleConId = detalle.map(item => ({
            ventas_id: data.id,
            productos_id: item.productos_id,
            cantidad: item.cantidad,
            precio: item.precio, // ← precio histórico guardado
        }))

        const { error: errorDetalle } = await supabase
            .from('ventas_detalle')
            .insert(detalleConId)

        if (errorDetalle) return { error: errorDetalle }

        for (const item of detalle) {
            await supabase.rpc('descontar_inventario', {
                p_producto_id: item.productos_id,
                p_sucursal_id: venta.sucursales_id,
                p_cantidad: item.cantidad,
            })
        }

        const costo = detalle.reduce((acc, item) => acc + (item.costo || 0) * item.cantidad, 0)
        await supabase.rpc('registrar_asiento_venta', {
            p_venta_id: data.id,
            p_total: data.total || detalle.reduce((acc, item) => acc + item.precio * item.cantidad, 0),
            p_costo: costo,
            p_sucursal_id: venta.sucursales_id,
        })

        fetchVentas()
        return { error: null }
    }

    async function cancelarVenta(id) {
        const { error } = await supabase.rpc('cancelar_venta', {
            p_venta_id: id,
        })
        if (!error) fetchVentas()
        return { error }
    }

    return { ventas, sucursales, inventario, loading, registrarVenta, cancelarVenta, fetchInventario }
}