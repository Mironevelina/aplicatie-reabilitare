import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts';

interface EvolutionChartProps {
  data: { data_finalizare: string; scor: number }[];
}

const EvolutionChart = ({ data }: EvolutionChartProps) => {
  // Sortăm datele cronologic și formatăm data pentru a fi lizibilă
  const formattedData = data
    .sort((a, b) => new Date(a.data_finalizare).getTime() - new Date(b.data_finalizare).getTime())
    .map(item => ({
      data: new Date(item.data_finalizare).toLocaleDateString('ro-RO'),
      scor: item.scor,
    }));

  return (
    <div style={{ width: '100%', height: 300, backgroundColor: 'white', padding: '20px', borderRadius: '15px', boxShadow: '0 4px 12px rgba(0,0,0,0.05)' }}>
      <h3 style={{ color: '#4d444a', marginBottom: '20px', fontSize: '16px' }}>Evoluția Scorului în Timp (%)</h3>
      <ResponsiveContainer width="100%" height="100%">
        <LineChart data={formattedData}>
          <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#eee" />
          <XAxis 
            dataKey="data" 
            axisLine={false} 
            tickLine={false} 
            tick={{ fill: '#888', fontSize: 12 }} 
          />
          <YAxis 
            domain={[0, 100]} 
            axisLine={false} 
            tickLine={false} 
            tick={{ fill: '#888', fontSize: 12 }} 
          />
          <Tooltip 
            contentStyle={{ borderRadius: '10px', border: 'none', boxShadow: '0 4px 12px rgba(0,0,0,0.1)' }}
          />
          <Line 
            type="monotone" 
            dataKey="scor" 
            stroke="#ff6b81" 
            strokeWidth={3} 
            dot={{ r: 4, fill: '#ff6b81' }} 
            activeDot={{ r: 6 }} 
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
};

export default EvolutionChart;