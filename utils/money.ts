/** "$29.99" or "Item total: $29.99" → 29.99 */
export const money = (text: string): number => Number(text.replace(/[^0-9.]/g, ''));
