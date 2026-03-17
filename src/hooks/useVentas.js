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

    async function registrarActividad(empleados_id, accion, descripcion, metadata = null) {
        await supabase.from('actividad').insert({
            empleados_id,
            accion,
            modulo: 'ventas',
            descripcion,
            metadata,
        })
    }

    // esCxc: boolean — si true, la venta queda pendiente y se crea registro en cxc
    async function registrarVenta(venta, detalle, esCxc = false) {
        const ventaPayload = {
            ...venta,
            estado: esCxc ? 'pendiente' : 'completada',
        }

        const { data, error } = await supabase
            .from('ventas')
            .insert(ventaPayload)
            .select()
            .single()

        if (error) return { error }

        const detalleConId = detalle.map(item => ({
            ventas_id: data.id,
            productos_id: item.productos_id,
            cantidad: item.cantidad,
            precio: item.precio,
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

        const total = detalle.reduce((acc, item) => acc + item.precio * item.cantidad, 0)
        const costo = detalle.reduce((acc, item) => acc + (item.costo || 0) * item.cantidad, 0)

        await supabase.rpc('registrar_asiento_venta', {
            p_venta_id: data.id,
            p_total: total,
            p_costo: costo,
            p_sucursal_id: venta.sucursales_id,
        })

        // Si es crédito, crear registro en CXC
        if (esCxc) {
            const { error: errorCxc } = await supabase.from('cxc').insert({
                ventas_id: data.id,
                clientes_id: venta.clientes_id,
                monto_total: total,
                monto_pagado: 0,
                estado: 'pendiente',
            })

            if (errorCxc) {
                // La venta ya se creó — logueamos el error pero no revertimos
                console.error('Error al crear CXC:', errorCxc.message)
            }
        }

        await registrarActividad(
            venta.empleados_id,
            'venta_creada',
            `Venta ${esCxc ? 'a crédito' : ''} por $${total.toFixed(2)} — ${detalle.length} producto(s)`,
            { venta_id: data.id, total, esCxc, productos: detalle.map(d => d.nombre) }
        )

        fetchVentas()
        return { error: null }
    }

    async function cancelarVenta(id) {
        const venta = ventas.find(v => v.id === id)

        const { error } = await supabase.rpc('cancelar_venta', {
            p_venta_id: id,
        })

        if (!error) {
            // Sincronizar CXC si existe
            await supabase
                .from('cxc')
                .update({ estado: 'anulado', monto_pagado: 0 })
                .eq('ventas_id', id)

            await registrarActividad(
                venta?.empleados_id ?? null,
                'venta_cancelada',
                `Venta cancelada — Cliente: ${venta?.clientes?.nombre ?? '—'}`,
                { venta_id: id }
            )

            fetchVentas()
        }

        return { error }
    }

    return { ventas, sucursales, inventario, loading, registrarVenta, cancelarVenta, fetchInventario }
}