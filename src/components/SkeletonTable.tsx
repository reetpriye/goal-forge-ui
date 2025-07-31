import React from 'react';

interface SkeletonTableProps {
  columns: number;
}

const SkeletonTable: React.FC<SkeletonTableProps> = ({ columns }) => (
  <table className="min-w-full animate-pulse" style={{background: 'rgb(13,13,13)', boxShadow: 'none', borderRadius: 0}}>
    <thead>
      <tr className="bg-blue-50">
        {Array(columns).fill(0).map((_, i) => (
          <th key={i} className="py-3 px-4 text-left font-semibold">&nbsp;</th>
        ))}
      </tr>
    </thead>
    <tbody>
      {[...Array(3)].map((_, idx) => (
        <tr key={idx} className="border-b">
          {Array(columns).fill(0).map((_, i) => (
            <td key={i} className="py-2 px-4">
              <div className="h-4 bg-gray-200 rounded w-full"></div>
            </td>
          ))}
        </tr>
      ))}
    </tbody>
  </table>
);

export default SkeletonTable;
