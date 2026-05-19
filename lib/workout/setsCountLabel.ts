/** «4 подхода» с правильным склонением. */
export function setsCountLabel(n: number): string {
  const mod10 = n % 10;
  const mod100 = n % 100;
  if (mod100 >= 11 && mod100 <= 14) return `${n} подходов`;
  if (mod10 === 1) return `${n} подход`;
  if (mod10 >= 2 && mod10 <= 4) return `${n} подхода`;
  return `${n} подходов`;
}
