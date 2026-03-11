import { useEffect, useState } from 'react'
import { supabase } from '../supabaseClient'

export function useOrdenes() {
    const [ordenes, setOrdenes] = useState([])
    const [proveedores, setProveedores] = useState([])
    const [sucursales, setSucursales] = useState([])
    const [loading, setLoading] = useState(true)

    useEffect(() => {
        fetchOrdenes()
        fetchProveedores()
        fetchSucursales()
    }, [])

    async function fetchOrdenes() {
        const { data, error } = await supabase
            .from('orden_de_compras')
            .select(`
        *,
        provedores(nombre),
        sucursales(nombre),
        orden_de_compras_detalle(
          id,
          cantidad,
          costo,
          productos_id,
          productos(nombre, codigo)
        )
      `)
            .order('created_at', { ascending: false })

        if (!error) setOrdenes(data)
        setLoading(false)
    }

    async function fetchProveedores() {
        const { data } = await supabase.from('provedores').select('*')
        if (data) setProveedores(data)
    }

    async function fetchSucursales() {
        const { data } = await supabase.from('sucursales').select('id, nombre, moneda, simbolo')
        if (data) setSucursales(data)
    }

    async function crearOrden(orden, detalle) {
        const { data, error } = await supabase
            .from('orden_de_compras')
            .insert(orden)
            .select()
            .single()

        if (error) return { error }

        const detalleConId = detalle.map(item => ({
            orden_id: data.id,
            productos_id: item.productos_id,
            cantidad: item.cantidad,
            costo: item.costo,
        }))

        const { error: errorDetalle } = await supabase
            .from('orden_de_compras_detalle')
            .insert(detalleConId)

        if (errorDetalle) return { error: errorDetalle }

        fetchOrdenes()
        return { error: null }
    }

    async function recibirOrden(id) {
        // 1. Marcar orden como recibida
        const { error } = await supabase
            .from('orden_de_compras')
            .update({ estado: 'recibida' })
            .eq('id', id)

        if (error) return { error }

        // 2. Obtener detalle de la orden con productos_id
        const { data: orden } = await supabase
            .from('orden_de_compras')
            .select(`
            id,
            provedores_id,
            sucursales_id,
            orden_de_compras_detalle(productos_id, costo, cantidad)
        `)
            .eq('id', id)
            .single()

        // 3. Calcular total
        const total = orden.orden_de_compras_detalle?.reduce(
            (acc, d) => acc + d.costo * d.cantidad, 0
        ) ?? 0

        // 4. Aumentar inventario por cada producto
        for (const item of orden.orden_de_compras_detalle) {
            await supabase.rpc('aumentar_inventario', {
                p_producto_id: item.productos_id,
                p_sucursal_id: orden.sucursales_id,
                p_cantidad: item.cantidad,
            })
        }

        // 5. Crear CXP automáticamente
        await supabase.from('cxp').insert({
            orden_de_compras_id: orden.id,
            provedores_id: orden.provedores_id,
            monto_total: total,
            estado: 'pendiente',
        })

        fetchOrdenes()
        return { error: null }
    }

    async function eliminarOrden(orden) {
        await supabase
            .from('orden_de_compras_detalle')
            .delete()
            .eq('orden_id', orden.id)

        await supabase
            .from('orden_de_compras')
            .delete()
            .eq('id', orden.id)

        fetchOrdenes()
    }

    return { ordenes, proveedores, sucursales, loading, crearOrden, recibirOrden, eliminarOrden }
}