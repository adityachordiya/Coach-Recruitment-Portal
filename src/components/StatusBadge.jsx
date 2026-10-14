import React from 'react';

// One quiet colour per stage of the funnel; red is kept for urgency, so
// "Not Interested" reads as closed (grey), not as an alarm.
const styles = {
  'Reached Out':                 'bg-gray-50 text-gray-600 ring-gray-200',
  'No Response':                 'bg-amber-50 text-amber-700 ring-amber-200',
  'Interested':                  'bg-navy-50 text-navy ring-navy-100',
  'Connected with Ascend Admin': 'bg-violet-50 text-violet-700 ring-violet-200',
  'Enrolled':                    'bg-emerald-50 text-emerald-700 ring-emerald-200',
  'Not Interested':              'bg-gray-50 text-gray-400 ring-gray-200',
};

const dots = {
  'Reached Out': 'bg-gray-400',
  'No Response': 'bg-amber-500',
  'Interested': 'bg-navy',
  'Connected with Ascend Admin': 'bg-violet-500',
  'Enrolled': 'bg-emerald-500',
  'Not Interested': 'bg-gray-300',
};

export default function StatusBadge({ status }) {
  return (
    <span className={`badge ${styles[status] || 'bg-gray-50 text-gray-600 ring-gray-200'}`}>
      <span className={`w-1.5 h-1.5 rounded-full ${dots[status] || 'bg-gray-400'}`} />
      {status}
    </span>
  );
}
