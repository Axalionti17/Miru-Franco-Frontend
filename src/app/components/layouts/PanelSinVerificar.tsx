'use client';

import { RotateCw, WifiOff } from 'lucide-react';
import Button from '../ui/Button';
import Card from '../ui/Card';

/**
 * Estado de AdminLayout/OperacionLayout cuando el backend no pudo confirmar el acceso
 * (red, 5xx, 429, timeout). No es "Acceso denegado": se ofrece repetir la verificación.
 */
export default function PanelSinVerificar({ onReintentar }: { onReintentar: () => void }) {
  return (
    <div
      className="flex min-h-dvh items-center justify-center px-4"
      style={{ backgroundColor: 'var(--fondo-general)' }}
    >
      <Card variant="elevated" padding="lg" className="w-full max-w-md text-center" role="alert">
        <WifiOff size={32} aria-hidden className="mx-auto" style={{ color: 'var(--logo-branding)' }} />
        <h1 className="mt-4 text-lg font-semibold" style={{ color: 'var(--menu-texto-principal)' }}>
          No pudimos comprobar tu acceso
        </h1>
        <p className="mt-2 text-sm" style={{ color: 'var(--encabezados-alterno)' }}>
          No pudimos comprobar tu acceso. Revisa tu conexión e inténtalo de nuevo.
        </p>
        <Button className="mt-6 inline-flex items-center gap-2" onClick={onReintentar}>
          <RotateCw size={16} aria-hidden /> Reintentar
        </Button>
      </Card>
    </div>
  );
}
