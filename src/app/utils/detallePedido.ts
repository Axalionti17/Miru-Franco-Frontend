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
