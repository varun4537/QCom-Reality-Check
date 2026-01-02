import React from 'react';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  ReferenceLine,
  Cell
} from 'recharts';
import { DeliveryEstimate } from '../types';

interface Props {
  data: DeliveryEstimate[];
}

const CustomTooltip = ({ active, payload, label }: any) => {
  if (active && payload && payload.length) {
    const data = payload[0].payload;
    return (
      <div className="bg-white p-3 border border-gray-100 shadow-lg rounded-lg text-sm">
        <p className="font-bold text-gray-800">{label}</p>
        <p className="text-gray-600">Est. Time: <span className="font-mono font-bold text-blue-600">{data.estimatedTravelTimeMin} min</span></p>
        <p className="text-gray-600">Distance: {data.distanceKm} km</p>
        <p className={`mt-1 font-semibold ${
          data.feasibility === 'Highly Feasible' ? 'text-green-600' :
          data.feasibility === 'Borderline' ? 'text-yellow-600' : 'text-red-600'
        }`}>{data.feasibility}</p>
      </div>
    );
  }
  return null;
};

const EstimatesChart: React.FC<Props> = ({ data }) => {
  return (
    <div className="h-72 w-full mt-6 bg-white p-4 rounded-xl border border-gray-100 shadow-sm">
      <h3 className="text-gray-700 font-semibold mb-4 text-center">Estimated Travel Time vs. 10m Promise</h3>
      <ResponsiveContainer width="100%" height="100%">
        <BarChart
          data={data}
          margin={{
            top: 5,
            right: 30,
            left: 0,
            bottom: 5,
          }}
          layout="vertical"
        >
          <CartesianGrid strokeDasharray="3 3" horizontal={false} />
          <XAxis type="number" domain={[0, 'dataMax + 10']} hide />
          <YAxis 
            dataKey="platform" 
            type="category" 
            width={80} 
            tick={{fontSize: 10}} 
            interval={0}
          />
          <Tooltip content={<CustomTooltip />} cursor={{fill: 'transparent'}} />
          <ReferenceLine x={10} stroke="red" strokeDasharray="3 3" label={{ position: 'top', value: '10 min limit', fill: 'red', fontSize: 10 }} />
          <Bar dataKey="estimatedTravelTimeMin" name="Estimated Time (min)" radius={[0, 4, 4, 0]} barSize={30}>
            {data.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={entry.color} />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
};

export default EstimatesChart;