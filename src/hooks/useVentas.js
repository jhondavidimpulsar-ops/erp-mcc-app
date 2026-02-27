import { useEffect, useState } from 'react'
import { supabase } from '../supabaseClient'

export function useVentas() {
    const [ventas, setVentas] = useState([])
    const [loading, setLoading] = useState(true)

    useEffect(() => {
        fetchVentas()
    }, [])

    async function fetchVentas() {
        const { data, error } = await supabase
            .from('ventas')
            .select(`
        *,
        clientes(nombre),
        sucursales(nombre),
        empleados(nombre),
        tipo_pago(nombre),
        ventas_detalle(
        id,
        cantidad,
        productos_id,
        productos(nombre, precio)
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

        fetchVentas()
        return { error: null }
    }
    async function eliminarVenta(venta) {
        for (const detalle of venta.ventas_detalle) {
            await supabase.rpc('restaurar_inventario', {
                p_producto_id: detalle.productos_id,
                p_sucursal_id: venta.sucursales_id,
                p_cantidad: detalle.cantidad,
            })
        }

        await supabase
            .from('ventas_detalle')
            .delete()
            .eq('ventas_id', venta.id)

        const { error } = await supabase
            .from('ventas')
            .delete()
            .eq('id', venta.id)

        if (!error) fetchVentas()
        return { error }
    }

    return { ventas, loading, registrarVenta, eliminarVenta }
}