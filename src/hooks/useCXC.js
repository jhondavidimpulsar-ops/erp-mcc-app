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
        ventas(created_at, sucursales(nombre)),
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

    async function registrarAbono(cxcId, monto, tipoPagoId) {
        const { error } = await supabase.rpc('registrar_abono_cxc', {
            p_cxc_id: cxcId,
            p_monto: Number(monto),
            p_tipo_pago_id: tipoPagoId,
        })
        if (!error) fetchCXCs()
        return { error }
    }

    return { cxcs, tiposPago, loading, registrarAbono }
}