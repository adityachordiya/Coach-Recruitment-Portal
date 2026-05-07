import React from 'react';

const styles = {
  'Reached Out':                 'bg-gray-100 text-gray-700',
  'No Response':                 'bg-orange-100 text-orange-700',
  'Interested':                  'bg-gold-100 text-yellow-800',
  'Connected with Ascend Admin': 'bg-blue-100 text-blue-700',
  'Enrolled':                    'bg-green-100 text-green-800',
  'Not Interested':              'bg-red-100 text-red-700',
};

export default function StatusBadge({ status }) {
  return (
    <span className={`badge ${styles[status] || 'bg-gray-100 text-gray-700'}`}>
      {status}
    </span>
  );
}
