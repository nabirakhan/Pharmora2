
import React from 'react';

function StatsCard({ title, value, icon: Icon, color = 'blue', subtitle }) {
  const colorClasses = {
    blue: 'bg-blue-500',
    green: 'bg-green-500',
    yellow: 'bg-yellow-500',
    red: 'bg-red-500',
    purple: 'bg-purple-500',
    teal: 'bg-teal-500',
    cyan: 'bg-cyan-500',
    orange: 'bg-orange-500'
  };

  return (
    <div className="bg-white rounded-xl shadow-md p-3 md:p-6 border-l-4 border-blue-500 hover:shadow-lg transition">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-xs md:text-sm font-medium text-gray-600">{title}</p>
          <p className="text-xl md:text-2xl font-bold text-gray-900 mt-2">{value}</p>
          {subtitle && <p className="text-xs text-gray-500 mt-1">{subtitle}</p>}
        </div>
        <div className={`p-2 md:p-3 ${colorClasses[color]} bg-opacity-10 rounded-lg`}>
          <Icon className={`h-4 w-4 md:h-6 md:w-6 text-${color}-600`} />
        </div>
      </div>
    </div>
  );
}

export default StatsCard;