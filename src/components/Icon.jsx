import React from 'react';

// Line icons (24px grid, 2px stroke) used across the portal in place of
// emoji in buttons and stat tiles. <Icon name="mail" className="w-4 h-4" />
const PATHS = {
  tag:      'M7 7h.01M3 11.6V5a2 2 0 012-2h6.6a2 2 0 011.4.6l7.4 7.4a2 2 0 010 2.8l-6.6 6.6a2 2 0 01-2.8 0L3.6 13a2 2 0 01-.6-1.4z',
  copy:     'M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z',
  check:    'M5 13l4 4L19 7',
  dollar:   'M12 3v18M16.5 7H10a3 3 0 000 6h4a3 3 0 010 6H6.5',
  users:    'M17 20v-1a4 4 0 00-4-4H7a4 4 0 00-4 4v1m18 0v-1a4 4 0 00-3-3.87M14 4.13A4 4 0 0114 11.87M10 7a4 4 0 11-8 0 4 4 0 018 0z',
  bell:     'M15 17h5l-1.4-1.4A2 2 0 0118 14.2V11a6 6 0 00-4-5.66V5a2 2 0 10-4 0v.34A6 6 0 006 11v3.2c0 .53-.21 1.04-.6 1.4L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9',
  mail:     'M3 8l7.9 5.26a2 2 0 002.2 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z',
  phone:    'M3 5a2 2 0 012-2h3.28a1 1 0 01.95.68l1.5 4.5a1 1 0 01-.5 1.2l-2.26 1.13a11 11 0 005.52 5.52l1.13-2.26a1 1 0 011.2-.5l4.5 1.5a1 1 0 01.68.95V19a2 2 0 01-2 2h-1C9.72 21 3 14.28 3 6V5z',
  plus:     'M12 5v14M5 12h14',
  x:        'M6 18L18 6M6 6l12 12',
  chevron:  'M19 9l-7 7-7-7',
  trash:    'M19 7l-.87 12.14A2 2 0 0116.14 21H7.86a2 2 0 01-2-1.86L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16',
  flame:    'M12 21c-3.87 0-7-2.91-7-6.5 0-2.5 1.5-4.5 3-6 .3 1.7 1.2 2.9 2.5 3.5C10 8.5 11.5 5 14.5 3c-.3 2.5.6 4.3 2 5.8 1.5 1.6 2.5 3.4 2.5 5.7 0 3.59-3.13 6.5-7 6.5z',
  target:   'M12 21a9 9 0 100-18 9 9 0 000 18zm0-4a5 5 0 100-10 5 5 0 000 10zm0-4a1 1 0 100-2 1 1 0 000 2z',
  trophy:   'M8 21h8m-4-4v4m-5-17h10v5a5 5 0 01-10 0V4zm10 1h3v2a3 3 0 01-3 3M7 5H4v2a3 3 0 003 3',
  reply:    'M10 9V5l-7 7 7 7v-4.1c5 0 8.5 1.6 11 5.1-1-5-4-10-11-11z',
  edit:     'M11 4H4a2 2 0 00-2 2v14a2 2 0 002 2h14a2 2 0 002-2v-7m-1.5-9.5a2.12 2.12 0 013 3L12 15l-4 1 1-4 9.5-9.5z',
  logout:   'M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1',
  menu:     'M4 6h16M4 12h16M4 18h16',
  alert:    'M12 9v4m0 4h.01M10.3 3.9L1.8 18a2 2 0 001.7 3h17a2 2 0 001.7-3L13.7 3.9a2 2 0 00-3.4 0z',
  filter:   'M3 4h18l-7 8.5V19l-4 2v-8.5L3 4z',
  calendar: 'M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z',
  map:      'M17.66 16.66L13.41 20.9a2 2 0 01-2.82 0l-4.25-4.24a8 8 0 1111.32 0zM15 11a3 3 0 11-6 0 3 3 0 016 0z',
  send:     'M22 2L11 13M22 2l-7 20-4-9-9-4 20-7z',
};

export default function Icon({ name, className = 'w-4 h-4', strokeWidth = 2 }) {
  const d = PATHS[name];
  if (!d) return null;
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={strokeWidth} aria-hidden="true">
      <path strokeLinecap="round" strokeLinejoin="round" d={d} />
    </svg>
  );
}
