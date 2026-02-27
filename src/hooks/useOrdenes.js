import { useEffect, useState } from 'react'
import { supabase } from '../supabaseClient'

export function useOrdenes() {
    const [ordenes, setOrdenes] = useState([])
    const [proveedores, setProveedores] = useState([])
    const [loading, setLoading] = useState(true)

    useEffect(() => {
        fetchOrdenes()
        fetchProveedores()
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

    async function recibirOrden(orden) {
        for (const detalle of orden.orden_de_compras_detalle) {
            await supabase.rpc('aumentar_inventario', {
                p_producto_id: detalle.productos_id,
                p_sucursal_id: orden.sucursales_id,
                p_cantidad: detalle.cantidad,
            })
        }

        await supabase
            .from('orden_de_compras')
            .update({ estado: 'recibida' })
            .eq('id', orden.id)

        fetchOrdenes()
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

    return { ordenes, proveedores, loading, crearOrden, recibirOrden, eliminarOrden }
}