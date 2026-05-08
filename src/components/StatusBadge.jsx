import React from 'react';

const styles = {
  'Reached Out':                 'bg-gray-100 text-gray-600 ring-1 ring-gray-200',
  'No Response':                 'bg-orange-50 text-orange-700 ring-1 ring-orange-200',
  'Interested':                  'bg-gold-50 text-yellow-700 ring-1 ring-yellow-200',
  'Connected with Ascend Admin': 'bg-blue-50 text-blue-700 ring-1 ring-blue-200',
  'Enrolled':                    'bg-green-50 text-green-700 ring-1 ring-green-200',
  'Not Interested':              'bg-red-50 text-red-600 ring-1 ring-red-200',
};

export default function StatusBadge({ status }) {
  return (
    <span className={`badge ${styles[status] || 'bg-gray-100 text-gray-700'}`}>
      {status}
    </span>
  );
}
