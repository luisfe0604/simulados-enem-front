"use client";

import { useEffect } from "react";

/**
 * Trava o scroll do body enquanto um modal `fixed inset-0` está aberto.
 *
 * Resolve dois problemas de uma vez:
 * 1. UX padrão de modal: o conteúdo atrás não deve rolar junto.
 * 2. Bug clássico de CSS: quando a página tem barra de rolagem vertical,
 *    elementos `position: fixed` com `inset: 0` são dimensionados pela
 *    largura de layout do navegador (que inclui o espaço da scrollbar),
 *    não pela largura visível real — o modal fica alguns pixels mais
 *    largo que a tela e a centralização parece "errada". Sem scrollbar
 *    (body travado), as duas larguras coincidem e o modal centraliza certo.
 */
export function useBodyScrollLock(active: boolean) {
  useEffect(() => {
    if (!active) return;

    const original = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    return () => {
      document.body.style.overflow = original;
    };
  }, [active]);
}
