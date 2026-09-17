// FR-5: o ciclo mensal sempre cobre o mês anterior completo -- esse é o "mês
// de referência" repassado pro resto da feature (AD-3, AD-4, AD-8). Roda no
// dia 1 do mês corrente, então "mês anterior" é sempre o mês que acabou de
// fechar por completo.
export function getPreviousReferenceMonth(now: Date = new Date()): { month: number; year: number } {
    const isJanuary = now.getMonth() === 0;

    return {
        month: isJanuary ? 12 : now.getMonth(),
        year: isJanuary ? now.getFullYear() - 1 : now.getFullYear(),
    };
}
