/** The alert list's filter chips. */
export const QUEUE_FILTERS = [
  { id: 'all', label: 'All', test: () => true },
  { id: 'red', label: 'Red', test: (alert) => alert.level === 'red' },
  { id: 'orange', label: 'Orange', test: (alert) => alert.level === 'orange' },
  { id: 'sent', label: 'Sent', test: (alert) => alert.status === 'sent' },
];
