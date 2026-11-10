import type { Priority, Role, TicketStatus } from '../types';

export const STATUS_LABELS: Record<TicketStatus, string> = {
  NEW: 'Новая',
  IN_PROGRESS: 'В работе',
  RESOLVED: 'Решена',
  CLOSED: 'Закрыта',
};
export const PRIORITY_LABELS: Record<Priority, string> = {
  LOW: 'Низкий',
  MEDIUM: 'Средний',
  HIGH: 'Высокий',
};
export const ROLE_LABELS: Record<Role, string> = {
  STUDENT: 'Студент',
  STAFF: 'Сотрудник',
  ADMIN: 'Администратор',
};

export const STATUS_ORDER: TicketStatus[] = ['NEW', 'IN_PROGRESS', 'RESOLVED', 'CLOSED'];
export const PRIORITY_ORDER: Priority[] = ['LOW', 'MEDIUM', 'HIGH'];
export const PRIORITY_WEIGHT: Record<Priority, number> = { HIGH: 3, MEDIUM: 2, LOW: 1 };

/** Подпись кнопки перехода статуса: «из > в». */
export function transitionLabel(from: TicketStatus, to: TicketStatus): string {
  const labels: Record<string, string> = {
    'NEW>IN_PROGRESS': 'Взять в работу',
    'IN_PROGRESS>RESOLVED': 'Отметить решённой',
    'RESOLVED>CLOSED': 'Подтвердить и закрыть',
    'RESOLVED>IN_PROGRESS': 'Проблема осталась — вернуть в работу',
  };
  return labels[`${from}>${to}`] ?? STATUS_LABELS[to];
}
