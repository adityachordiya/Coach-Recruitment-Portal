import React from 'react';

const styles = {
  'Reached Out': 'bg-gray-100 text-gray-700',
  'Interested':  'bg-gold-100 text-yellow-800',
  'Enrolled':    'bg-green-100 text-green-800',
};

export default function StatusBadge({ status }) {
  return (
    <span className={`badge ${styles[status] || 'bg-gray-100 text-gray-700'}`}>
      {status}
    </span>
  );
}
