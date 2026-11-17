import { useEffect, useRef } from 'react';

// Ejecuta `effect` `delay` ms después del último cambio de `dependencies`.
// El efecto se guarda en un ref: si fuera dependencia, como es una función nueva en cada render,
// el timer se reiniciaría con cualquier re-render (p. ej. al cambiar de página) y volvería a disparar.
export default function useDebounce(effect: () => void, dependencies: unknown[], delay: number) {
  const effectRef = useRef(effect);
  effectRef.current = effect;

  useEffect(() => {
    const timeout = setTimeout(() => effectRef.current(), delay);
    return () => clearTimeout(timeout);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [...dependencies, delay]);
}
