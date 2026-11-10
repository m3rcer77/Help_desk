import { PRIORITY_LABELS, STATUS_LABELS } from '../lib/labels';
import type { Priority, TicketStatus } from '../types';

const STATUS_TONE: Record<TicketStatus, string> = {
  NEW: 'blue',
  IN_PROGRESS: 'amber',
  RESOLVED: 'green',
  CLOSED: 'gray',
};
const PRIORITY_TONE: Record<Priority, string> = { HIGH: 'red', MEDIUM: 'amber', LOW: 'gray' };

export function StatusBadge({ status }: { status: TicketStatus }) {
  return <span className={`badge ${STATUS_TONE[status]}`}>{STATUS_LABELS[status]}</span>;
}

export function PriorityBadge({ priority }: { priority: Priority }) {
  return <span className={`badge ${PRIORITY_TONE[priority]}`}>{PRIORITY_LABELS[priority]}</span>;
}
