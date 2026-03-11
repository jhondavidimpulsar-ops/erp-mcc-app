import { useEffect, useState } from 'react'
import { supabase } from '../supabaseClient'

export function useCXC() {
    const [cxcs, setCxcs] = useState([])
    const [tiposPago, setTiposPago] = useState([])
    const [loading, setLoading] = useState(true)

    useEffect(() => {
        fetchCXCs()
        fetchTiposPago()
    }, [])

    async function fetchCXCs() {
        const { data, error } = await supabase
            .from('cxc')
            .select(`
                *,
                clientes(nombre, cedula),
                ventas(created_at, sucursales_id, sucursales(nombre)),
                cxc_abonos(
                    id,
                    monto,
                    created_at,
                    tipo_pago(nombre)
                )
            `)
            .order('created_at', { ascending: false })

        if (!error) setCxcs(data)
        setLoading(false)
    }

    async function fetchTiposPago() {
        const { data } = await supabase
            .from('tipo_pago')
            .select('*')
            .neq('nombre', 'credito')
        if (data) setTiposPago(data)
    }

    async function registrarActividad(accion, descripcion, metadata = null) {
        await supabase.from('actividad').insert({
            empleados_id: null,
            accion,
            modulo: 'cxc',
            descripcion,
            metadata,
        })
    }

    async function registrarAbono(cxcId, monto, tipoPagoId) {
        const cxc = cxcs.find(c => c.id === cxcId)

        const { error } = await supabase.rpc('registrar_abono_cxc', {
            p_cxc_id: cxcId,
            p_monto: Number(monto),
            p_tipo_pago_id: tipoPagoId,
        })

        if (!error) {
            const saldoAnterior = cxc.monto_total - cxc.monto_pagado
            const nuevoSaldo = saldoAnterior - Number(monto)

            await registrarActividad(
                'abono_cxc',
                `Abono de $${Number(monto).toFixed(2)} — Cliente: ${cxc.clientes?.nombre ?? '—'} — Saldo restante: $${nuevoSaldo.toFixed(2)}`,
                { cxc_id: cxcId, monto: Number(monto), cliente: cxc.clientes?.nombre }
            )
            fetchCXCs()
        }

        return { error }
    }

    return { cxcs, tiposPago, loading, registrarAbono }
}