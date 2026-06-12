export function createPageUrl(pageName: string) {
    return '/' + pageName.replace(/ /g, '-');
}

// Utilitário à prova de erros para ler créditos.
// Source of truth = user.data.credits (escrita por Schedule/Admin).
// Top-level user.credits é usado apenas como fallback legado.
export function getCredits(user: any) {
    if (!user) return 0;
    const c = user.data?.credits ?? user.data?.data?.credits ?? user.credits;
    return typeof c === "number" ? c : Number(c) || 0;
}

// Utilitário à prova de erros para ler plano
export function getPlan(user: any) {
    if (!user) return null;
    return user.plan ?? user.data?.plan ?? user.data?.data?.plan ?? null;
}

// Utilitário à prova de erros para ler data de início do plano
export function getPlanStartDate(user: any) {
    if (!user) return null;
    return user.plan_start_date ?? user.data?.plan_start_date ?? user.data?.data?.plan_start_date ?? null;
}
