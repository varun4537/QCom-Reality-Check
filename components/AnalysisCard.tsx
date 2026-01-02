import React from 'react';
import { AnalysisResponse } from '../types';
import { SparklesIcon, ExclamationTriangleIcon } from '@heroicons/react/24/outline';

interface Props {
  data: AnalysisResponse | null;
  loading: boolean;
}

const AnalysisCard: React.FC<Props> = ({ data, loading }) => {
  if (loading) {
    return (
      <div className="bg-gradient-to-br from-indigo-50 to-blue-50 rounded-xl p-6 border border-indigo-100 shadow-sm animate-pulse">
        <div className="flex items-center gap-2 mb-4">
          <SparklesIcon className="w-5 h-5 text-indigo-500 animate-spin" />
          <h3 className="text-lg font-semibold text-gray-800">Generating Reality Check...</h3>
        </div>
        <div className="h-4 bg-indigo-200 rounded w-3/4 mb-2"></div>
        <div className="h-4 bg-indigo-200 rounded w-1/2"></div>
      </div>
    );
  }

  if (!data) return null;

  return (
    <div className="bg-gradient-to-br from-indigo-50 to-blue-50 rounded-xl p-6 border border-indigo-100 shadow-sm mt-6">
      <div className="flex items-center gap-2 mb-3">
        <SparklesIcon className="w-6 h-6 text-indigo-600" />
        <h3 className="text-lg font-bold text-gray-800">AI Reality Check</h3>
      </div>
      
      <p className="text-gray-700 leading-relaxed mb-4">
        {data.summary}
      </p>

      <div className="bg-white/60 rounded-lg p-4">
        <h4 className="text-sm font-semibold text-gray-600 uppercase tracking-wider mb-2 flex items-center gap-2">
           <ExclamationTriangleIcon className="w-4 h-4" /> Potential Risks
        </h4>
        <ul className="list-disc list-inside space-y-1">
          {data.riskFactors.map((factor, idx) => (
            <li key={idx} className="text-sm text-gray-700">{factor}</li>
          ))}
        </ul>
      </div>
      <p className="text-xs text-indigo-400 mt-2 text-right">Powered by Gemini 2.5 Flash</p>
    </div>
  );
};

export default AnalysisCard;