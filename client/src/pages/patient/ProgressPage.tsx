import { useEffect, useState, useMemo } from 'react';
import { supabase } from '../../supabaseClient';
import { XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Area, AreaChart } from 'recharts';
import { useNavigate } from 'react-router-dom';
import SakuraLayout from '../../layouts/SakuraLayout';
import { jsPDF } from 'jspdf';
import html2canvas from 'html2canvas';
import type { CSSProperties } from 'react';

interface SessionData { date: string; scor: number; timestamp: Date; }
type FilterType = 'zile' | 'saptamani' | 'luni';

export default function ProgressPage() {
  const [rawData, setRawData] = useState<SessionData[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [exporting, setExporting] = useState<boolean>(false);
  const [filter, setFilter] = useState<FilterType>('zile');
  const navigate = useNavigate();

  useEffect(() => {
    async function fetchProgress() {
      try {
        setLoading(true);
        // 1. Obținem user-ul curent
        const { data: { user } } = await supabase.auth.getUser();

        if (user) {
          // 2. Filtrăm progresul doar pentru acest pacient (id_pacient)
          const { data: sessions, error } = await supabase
            .from('progres_pacienti')
            .select('data_finalizare, scor')
            .eq('id_pacient', user.id) // FILTRU CRITIC
            .order('data_finalizare', { ascending: true });

          if (error) throw error;

          if (sessions) {
            setRawData(sessions.map(s => ({
              timestamp: new Date(s.data_finalizare),
              date: new Date(s.data_finalizare).toLocaleDateString('ro-RO'),
              scor: Number(s.scor)
            })));
          }
        }
      } catch (err) {
        console.error("Eroare ProgressPage:", err);
      } finally {
        setLoading(false);
      }
    }
    fetchProgress();
  }, []);

  const chartData = useMemo(() => {
    const groups: Record<string, { totalScor: number; count: number; label: string }> = {};
    rawData.forEach(s => {
      let key = "";
      if (filter === 'zile') {
        key = s.timestamp.toLocaleDateString('ro-RO', { day: '2-digit', month: '2-digit' });
      } else if (filter === 'saptamani') {
        // Calculăm numărul săptămânii din an
        const firstDayOfYear = new Date(s.timestamp.getFullYear(), 0, 1);
        const pastDaysOfYear = (s.timestamp.getTime() - firstDayOfYear.getTime()) / 86400000;
        key = `Săpt ${Math.ceil((pastDaysOfYear + firstDayOfYear.getDay() + 1) / 7)}`;
      } else {
        key = s.timestamp.toLocaleString('ro-RO', { month: 'short' });
      }

      if (!groups[key]) groups[key] = { totalScor: 0, count: 0, label: key };
      groups[key].totalScor += s.scor; 
      groups[key].count += 1;
    });
    return Object.values(groups).map(g => ({ name: g.label, scor: Math.round(g.totalScor/g.count) }));
  }, [rawData, filter]);

  const exportPDF = async () => {
    const input = document.getElementById('report-content');
    if (!input) return;
    setExporting(true);
    try {
      const canvas = await html2canvas(input, { scale: 2, useCORS: true });
      const imgData = canvas.toDataURL('image/png');
      const pdf = new jsPDF('p', 'mm', 'a4');
      const imgProps = pdf.getImageProperties(imgData);
      const pdfWidth = pdf.internal.pageSize.getWidth();
      const pdfHeight = (imgProps.height * pdfWidth) / imgProps.width;
      
      pdf.addImage(imgData, 'PNG', 0, 0, pdfWidth, pdfHeight);
      pdf.save(`Raport_Evolutie_${new Date().toLocaleDateString()}.pdf`);
    } catch (e) {
      console.error("Eroare PDF:", e);
    } finally {
      setExporting(false);
    }
  };

  if (loading) return <SakuraLayout><div style={centeredStyle}>🌸 Generăm analizele...</div></SakuraLayout>;

  return (
    <SakuraLayout>
      <div style={{ padding: '40px', maxWidth: '1000px', margin: '0 auto' }}>
        <header style={headerStyle}>
          <div>
            <h1 style={{ color: '#4d444a', fontWeight: 900, margin: 0 }}>Evoluția Ta 📈</h1>
            <p style={{ color: '#8a7d84' }}>Istoricul performanței tale în exerciții</p>
          </div>
          <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
            <button onClick={exportPDF} style={exportBtnStyle}>
              {exporting ? 'Se generează...' : 'Descărcare PDF'}
            </button>
            <button onClick={() => navigate('/dashboard')} style={backBtnStyle}>Înapoi</button>
          </div>
        </header>

        <div id="report-content" style={reportContainerStyle}>
          <div style={filterGroupStyle}>
            {(['zile', 'saptamani', 'luni'] as FilterType[]).map(f => (
              <button 
                key={f} 
                onClick={() => setFilter(f)} 
                style={{ 
                  ...filterBtnStyle, 
                  backgroundColor: filter === f ? '#ff8fa3' : 'white', 
                  color: filter === f ? 'white' : '#8a7d84',
                  border: filter === f ? '1px solid #ff8fa3' : '1px solid #ffeef2'
                }}
              >
                {f.charAt(0).toUpperCase() + f.slice(1)}
              </button>
            ))}
          </div>

          <div style={chartCardStyle}>
            <h3 style={{ color: '#ff8fa3', marginBottom: '20px', fontSize: '18px' }}>Progres Acuratețe (%)</h3>
            <div style={{ height: '350px', width: '100%', position: 'relative' }}>
              {chartData.length > 0 ? (
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={chartData} margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
                    <defs>
                      <linearGradient id="colorScor" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#ffb7c5" stopOpacity={0.8}/>
                        <stop offset="95%" stopColor="#ffb7c5" stopOpacity={0}/>
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f0f0f0" />
                    <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{fill: '#8a7d84', fontSize: 12}} />
                    <YAxis domain={[0, 100]} axisLine={false} tickLine={false} tick={{fill: '#8a7d84', fontSize: 12}} />
                    <Tooltip contentStyle={{ borderRadius: '15px', border: 'none', boxShadow: '0 5px 15px rgba(0,0,0,0.05)' }} />
                    <Area 
                      type="monotone" 
                      dataKey="scor" 
                      stroke="#ff8fa3" 
                      fillOpacity={1} 
                      fill="url(#colorScor)" 
                      strokeWidth={4} 
                    />
                  </AreaChart>
                </ResponsiveContainer>
              ) : (
                <div style={emptyStateStyle}>Nu există date pentru perioada selectată.</div>
              )}
            </div>
          </div>
        </div>
      </div>
    </SakuraLayout>
  );
}

// --- STILURI ---
const centeredStyle: CSSProperties = { textAlign: 'center', padding: '100px', color: '#ff8fa3', fontWeight: 800 };
const headerStyle: CSSProperties = { display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '30px' };
const reportContainerStyle: CSSProperties = { backgroundColor: 'white', padding: '35px', borderRadius: '40px', boxShadow: '0 10px 40px rgba(0,0,0,0.03)' };
const filterGroupStyle: CSSProperties = { display: 'flex', gap: '10px', marginBottom: '40px', justifyContent: 'center' };
const chartCardStyle: CSSProperties = { backgroundColor: '#fffafb', padding: '25px', borderRadius: '25px', border: '1px solid #fff0f3' };
const filterBtnStyle: CSSProperties = { padding: '10px 25px', borderRadius: '15px', cursor: 'pointer', fontWeight: 800, transition: 'all 0.3s ease' };
const exportBtnStyle: CSSProperties = { padding: '12px 25px', backgroundColor: '#a7c9b0', color: 'white', border: 'none', borderRadius: '15px', fontWeight: 800, cursor: 'pointer' };
const backBtnStyle: CSSProperties = { padding: '12px 25px', backgroundColor: 'white', color: '#8a7d84', border: '1px solid #ffeef2', borderRadius: '15px', fontWeight: 700, cursor: 'pointer' };
const emptyStateStyle: CSSProperties = { display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%', color: '#8a7d84', fontStyle: 'italic' };