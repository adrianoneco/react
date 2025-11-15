import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';

export function getDate(date: Date | string | number = new Date()): string {
  const dateObj = typeof date === 'string' || typeof date === 'number' ? new Date(date) : date;
  return format(dateObj, 'dd/MM/yyyy', { locale: ptBR });
}

export function getTime(date: Date | string | number = new Date()): string {
  const dateObj = typeof date === 'string' || typeof date === 'number' ? new Date(date) : date;
  return format(dateObj, 'HH:mm', { locale: ptBR });
}

export function getDateTime(date: Date | string | number = new Date()): string {
  return `${getDate(date)} ${getTime(date)}`;
}

export function generateProtocolNumber(): string {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
  let protocol = '';
  for (let i = 0; i < 10; i++) {
    protocol += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return protocol;
}
