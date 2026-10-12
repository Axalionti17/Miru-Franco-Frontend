import { describe, expect, it, vi } from 'vitest';
import {
  cargarDetallePedido,
  MENSAJE_ITEMS_NO_DISPONIBLES,
  mensajeErrorDetallePedido,
  resultadoCancelacion,
  textoConfirmarCancelacion,
} from './detallePedido';

const pedido = { id: 7, estado: 'pagado' };
const items = [{ id: 1, cantidad: 2 }];

describe('cargarDetallePedido: el pedido manda, las líneas son secundarias', () => {
  it('con todo bien devuelve el pedido y sus líneas, sin error', async () => {
    const r = await cargarDetallePedido(7, {
      obtenerPedido: async () => pedido,
      listarPedidoItems: async () => items,
    });
    expect(r).toEqual({ pedido, items, errorItems: null });
  });

  it('si las líneas fallan (403, 5xx, red) se conserva el pedido y se da el mensaje para el modal', async () => {
    const err = Object.assign(new Error('Acceso denegado'), { status: 403 });
    const r = await cargarDetallePedido(7, {
      obtenerPedido: async () => pedido,
      listarPedidoItems: async () => { throw err; },
    });
    expect(r).toEqual({ pedido, items: [], errorItems: MENSAJE_ITEMS_NO_DISPONIBLES });
  });

  it('si el pedido falla, el error sube a quien llama', async () => {
    const listar = vi.fn(async () => items);
    await expect(
      cargarDetallePedido(7, {
        obtenerPedido: async () => { throw new Error('No se pudo cargar el pedido'); },
        listarPedidoItems: listar,
      }),
    ).rejects.toThrow('No se pudo cargar el pedido');
  });

  it('pide las dos cosas en paralelo con el mismo id', async () => {
    const obtener = vi.fn(async () => pedido);
    const listar = vi.fn(async () => items);
    await cargarDetallePedido(7, { obtenerPedido: obtener, listarPedidoItems: listar });
    expect(obtener).toHaveBeenCalledWith(7);
    expect(listar).toHaveBeenCalledWith(7);
  });
});

describe('mensajeErrorDetallePedido', () => {
  it('un 404 (pedido ajeno o inexistente) se explica en español, sin el texto crudo del servidor', () => {
    const e = Object.assign(new Error('Not Found'), { status: 404 });
    expect(mensajeErrorDetallePedido(e)).toBe('No encontramos ese pedido.');
  });

  it('otros errores conservan su mensaje', () => {
    expect(mensajeErrorDetallePedido(new Error('Sin conexión'))).toBe('Sin conexión');
    expect(mensajeErrorDetallePedido('raro')).toBe('Error al cargar');
  });
});

describe('Cancelar un pedido desde el portal', () => {
  const TEXTO_ANTERIOR = 'Se cancela tu pedido y los productos vuelven a la tienda. Esta acción no se puede deshacer.';
  const DEVOLUCION =
    'Te devolvemos el pago completo a tu tarjeta con Mercado Pago. Puede tardar unos días en reflejarse, según tu banco.';

  it('pagado con Mercado Pago: la confirmación avisa que se devuelve el pago completo', () => {
    const texto = textoConfirmarCancelacion({ estado: 'pagado', metodoPago: 'mercado_pago' });
    expect(texto).toContain(DEVOLUCION);
    expect(texto).toContain('Esta acción no se puede deshacer.');
  });

  it('sin pago en línea todavía (pendiente de pago o apartado): la confirmación queda como antes', () => {
    expect(textoConfirmarCancelacion({ estado: 'pendiente_pago', metodoPago: 'mercado_pago' })).toBe(TEXTO_ANTERIOR);
    expect(textoConfirmarCancelacion({ estado: 'pendiente_pago', metodoPago: 'pago_en_salon' })).toBe(TEXTO_ANTERIOR);
    expect(textoConfirmarCancelacion({ estado: 'pagado', metodoPago: 'tarjeta_credito' })).toBe(TEXTO_ANTERIOR);
  });

  it('reembolsado: éxito, se devolvió el pago y puede tardar según el banco', () => {
    const r = resultadoCancelacion({ estado: 'reembolsado', monto: 450 });
    expect(r.tipo).toBe('success');
    expect(r.mensaje).toContain('te devolvimos el pago completo');
    expect(r.mensaje).toContain('según tu banco');
  });

  it('en revisión: aviso (no error), el salón revisará la devolución y la contactará', () => {
    const r = resultadoCancelacion({ estado: 'en_revision', monto: 450 });
    expect(r.tipo).toBe('warning');
    expect(r.mensaje).toBe('Tu pedido quedó cancelado. El equipo del salón revisará la devolución de tu pago y te contactará.');
  });

  it('sin reembolso en la respuesta: el mensaje de siempre', () => {
    expect(resultadoCancelacion(null)).toEqual({ mensaje: 'Tu pedido quedó cancelado.', tipo: 'success' });
  });
});
