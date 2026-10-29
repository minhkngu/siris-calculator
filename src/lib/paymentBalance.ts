export function getPaymentBalance(total: number, paidAmount: number) {
    const payable = Math.max(0, total);
    return { remaining: Math.max(0, payable - paidAmount), excess: Math.max(0, paidAmount - payable) };
}
