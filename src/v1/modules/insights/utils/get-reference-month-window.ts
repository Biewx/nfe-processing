// Unica fonte da janela {start, end} do "mes de referencia" usada por
// InsightsRepository (findLatestPurchasePerProduct, findPurchaseHistoryByProduct
// -- AD-3 e AD-4 da Architecture). Timezone local do servidor, mesma
// convencao que GetBestSupplierService.getDateWindow ja usa hoje.
//
// monthly-report importa esta funcao direto por caminho relativo -- e um
// import de arquivo puro (sem estado, nao e provider do Nest), nao um
// import de modulo via imports/exports (AD-1). Mesmo padrao que FiltersDto
// ja usa hoje entre analytics e insights.
export function getReferenceMonthWindow(month: number, year: number): { start: Date; end: Date } {
    const start = new Date(year, month - 1, 1);
    const end = new Date(year, month, 0, 23, 59, 59);

    return { start, end };
}
