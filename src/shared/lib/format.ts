import type { Money } from './types';

export function formatMoney(money: Money): string {
  return new Intl.NumberFormat('en-ZA', { style: 'currency', currency: money.currency }).format(money.minorUnits / 100);
}

export function formatTime(iso: string): string {
  return new Date(iso).toLocaleTimeString('en-ZA', { hour12: false });
}

export function shortId(id: string): string {
  return id.length > 12 ? `${id.slice(0, 8)}…${id.slice(-4)}` : id;
}

export function humanise(camel: string): string {
  const spaced = camel.replace(/([a-z])([A-Z])/g, '$1 $2').replace(/[-_]/g, ' ');
  return spaced.charAt(0).toUpperCase() + spaced.slice(1).toLowerCase();
}
