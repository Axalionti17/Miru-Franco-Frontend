import { METODO_PAGO_MERCADOPAGO, type PedidoApi, type ReembolsoCancelacionApi } from '../services/ecommerce';
import type { ToastType } from './toast';

/** Texto del modal de detalle cuando el pedido cargó pero sus productos no. */
export const MENSAJE_ITEMS_NO_DISPONIBLES =
  'No pudimos cargar los productos de este pedido. Cierra y vuelve a abrirlo para intentarlo de nuevo.';

/**
 * Detalle de un pedido para un modal: el pedido es la petición principal (si falla, el error sube);
 * las líneas son secundarias (si fallan, el modal muestra `errorItems` en su lugar y no se pierde el pedido).
 */
export async function cargarDetallePedido<P, I>(
  id: number,
  deps: {
    obtenerPedido: (id: number) => Promise<P>;
    listarPedidoItems: (id: number) => Promise<I[]>;
  },
): Promise<{ pedido: P; items: I[]; errorItems: string | null }> {
  const lineas = deps.listarPedidoItems(id).then(
    (items) => ({ items, errorItems: null }),
    () => ({ items: [] as I[], errorItems: MENSAJE_ITEMS_NO_DISPONIBLES }),
  );
  const pedido = await deps.obtenerPedido(id);
  return { pedido, ...(await lineas) };
}

/** Mensaje del detalle de pedido en el portal: un 404 (ajeno o inexistente) se explica sin el texto crudo. */
export function mensajeErrorDetallePedido(e: unknown): string {
  if ((e as { status?: number } | null)?.status === 404) return 'No encontramos ese pedido.';
  return e instanceof Error && e.message ? e.message : 'Error al cargar';
}

/** Aviso de devolución al cancelar un pedido ya pagado con Mercado Pago. */
export const TEXTO_DEVOLUCION_MERCADOPAGO =
  'Te devolvemos el pago completo a tu tarjeta con Mercado Pago. Puede tardar unos días en reflejarse, según tu banco.';

/** Confirmación de cancelar en el portal: si ya pagó con Mercado Pago, se le avisa que se le devuelve el pago. */
export function textoConfirmarCancelacion(pedido: Pick<PedidoApi, 'estado' | 'metodoPago'>): string {
  const pagadoEnLinea =
    pedido.estado === 'pagado' && (pedido.metodoPago ?? '').trim().toLowerCase() === METODO_PAGO_MERCADOPAGO;
  return pagadoEnLinea
    ? `Se cancela tu pedido y los productos vuelven a la tienda. ${TEXTO_DEVOLUCION_MERCADOPAGO} Esta acción no se puede deshacer.`
    : 'Se cancela tu pedido y los productos vuelven a la tienda. Esta acción no se puede deshacer.';
}

/** Resultado de cancelar según lo que respondió el servidor sobre la devolución del pago. */
export function resultadoCancelacion(reembolso: ReembolsoCancelacionApi | null): { mensaje: string; tipo: ToastType } {
  if (reembolso?.estado === 'reembolsado') {
    return {
      mensaje: 'Tu pedido quedó cancelado y te devolvimos el pago completo. Puede tardar unos días en reflejarse, según tu banco.',
      tipo: 'success',
    };
  }
  if (reembolso?.estado === 'en_revision') {
    return {
      mensaje: 'Tu pedido quedó cancelado. El equipo del salón revisará la devolución de tu pago y te contactará.',
      tipo: 'warning',
    };
  }
  return { mensaje: 'Tu pedido quedó cancelado.', tipo: 'success' };
}
