import { useEffect, useState } from 'react'
import { supabase } from '../supabaseClient'

export function useCXP() {
    const [cxps, setCxps] = useState([])
    const [tiposPago, setTiposPago] = useState([])
    const [loading, setLoading] = useState(true)

    useEffect(() => {
        fetchCXPs()
        fetchTiposPago()
    }, [])

    async function fetchCXPs() {
        const { data, error } = await supabase
            .from('cxp')
            .select(`
        id,
        monto_total,
        monto_pagado,
        estado,
        created_at,
        provedores(id, nombre),
        orden_de_compras(id, sucursales_id, sucursales(nombre, moneda, simbolo)),
        cxp_abonos(
          id,
          monto,
          created_at,
          tipo_pago(nombre)
        )
      `)
            .order('created_at', { ascending: false })

        if (!error) setCxps(data)
        setLoading(false)
    }

    async function fetchTiposPago() {
        const { data } = await supabase
            .from('tipo_pago')
            .select('*')
            .neq('nombre', 'pendiente')
            .neq('nombre', 'credito')
        if (data) setTiposPago(data)
    }

    async function registrarAbono(cxpId, monto, tipoPagoId) {
        const { error } = await supabase.rpc('registrar_abono_cxp', {
            p_cxp_id: cxpId,
            p_monto: Number(monto),
            p_tipo_pago_id: tipoPagoId,
        })
        if (!error) fetchCXPs()
        return { error }
    }

    return { cxps, tiposPago, loading, registrarAbono }
}