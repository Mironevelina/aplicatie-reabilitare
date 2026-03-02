import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { supabase } from '../../supabaseClient';
import SakuraLayout from '../../layouts/SakuraLayout';
import { XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, AreaChart, Area } from 'recharts';

export default function PatientStats() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [patient, setPatient] = useState<any>(null);
  const [sessions, setSessions] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchData() {
      if (!id) return;
      try {
        setLoading(true);
        
        // 1. Preluăm datele profilului
        const { data: p } = await supabase
          .from('pacienti')
          .select('full_name')
          .eq('id', id)
          .maybeSingle();
        setPatient(p);

        // 2. Preluăm progresul folosind coloanele tale exacte
        const { data, error } = await supabase
          .from('progres_pacienti')
          .select('*')
          .eq('id_pacient', id)
          .order('data_finalizare', { ascending: true });

        if (error) throw error;

        setSessions(data || []);
      } catch (e) {
        console.error("Eroare la încărcare date doctor:", e);
      } finally {
        setLoading(false);
      }
    }
    fetchData();
  }, [id]);

  // Funcție de procesare a datelor adaptată la coloanele tale
  const processSession = (s: any) => {
    const dateObj = s.data_finalizare ? new Date(s.data_finalizare) : new Date();
    return {
      scor: s.scor ?? s.score ?? 0,
      // Folosim numele coloanei tale: durata_secunde
      durata: s.durata_secunde ?? s.durata ?? s.duration ?? 0,
      dataAfisare: dateObj.toLocaleString('ro-RO', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      }),
      dataGrafic: dateObj.toLocaleDateString('ro-RO')
    };
  };

  const chartData = sessions.map((s, i) => ({
    name: `S${i + 1}`,
    scor: processSession(s).scor,
    data: processSession(s).dataGrafic
  }));

  if (loading) return (
    <SakuraLayout>
      <div style={{ textAlign: 'center', padding: '50px', color: '#ff8fa3', fontWeight: 'bold' }}>
        🌸 Se încarcă datele clinice...
      </div>
    </SakuraLayout>
  );

  return (
    <SakuraLayout>
      <div style={{ padding: '40px', maxWidth: '1000px', margin: '0 auto' }}>
        <button 
          onClick={() => navigate(-1)} 
          style={{ marginBottom: '20px', padding: '10px 20px', borderRadius: '15px', border: '1px solid #ffeef2', background: 'white', cursor: 'pointer', color: '#8a7d84', fontWeight: 'bold' }}
        >
          ← Înapoi
        </button>
        
        <div style={{ marginBottom: '35px' }}>
          <h1 style={{ color: '#4d444a', margin: 0, fontSize: '32px' }}>Evoluție: {patient?.full_name || 'Pacient'}</h1>
          <div style={{ display: 'flex', gap: '15px', marginTop: '10px' }}>
             <span style={{ background: '#fff0f3', color: '#ff8fa3', padding: '5px 15px', borderRadius: '10px', fontSize: '14px', fontWeight: 'bold' }}>
               {sessions.length} Sesiuni înregistrate
             </span>
          </div>
        </div>
        
        {sessions.length > 0 ? (
          <>
            <div style={{ background: 'white', padding: '30px', borderRadius: '30px', boxShadow: '0 10px 30px rgba(0,0,0,0.05)', marginBottom: '35px', border: '1px solid #fff0f3' }}>
              <div style={{ height: '300px', width: '100%' }}>
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={chartData}>
                    <defs>
                      <linearGradient id="colorDoctor" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#ffb7c5" stopOpacity={0.4}/>
                        <stop offset="95%" stopColor="#ffb7c5" stopOpacity={0}/>
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f0f0f0" />
                    <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{fill: '#8a7d84'}} />
                    <YAxis domain={[0, 100]} axisLine={false} tickLine={false} tick={{fill: '#8a7d84'}} />
                    <Tooltip />
                    <Area type="monotone" dataKey="scor" stroke="#ff8fa3" fill="url(#colorDoctor)" strokeWidth={4} />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            </div>

            <div style={{ display: 'grid', gap: '12px' }}>
              {[...sessions].reverse().map((s, i) => {
                const info = processSession(s);
                return (
                  <div key={i} style={{ background: 'white', padding: '20px 25px', borderRadius: '22px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', border: '1px solid #fdf0f2' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '15px' }}>
                      <div style={{ background: '#fff0f3', color: '#ff8fa3', width: '35px', height: '35px', borderRadius: '10px', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 'bold' }}>
                        {sessions.length - i}
                      </div>
                      <div>
                        <div style={{ fontWeight: 'bold', color: '#4d444a' }}>{info.dataAfisare}</div>
                        <div style={{ fontSize: '12px', color: '#8a7d84' }}>Timp de lucru: <b>{info.durata} secunde</b></div>
                      </div>
                    </div>
                    <div style={{ textAlign: 'right' }}>
                      <span style={{ color: '#ff8fa3', fontWeight: 900, fontSize: '22px' }}>{info.scor}%</span>
                    </div>
                  </div>
                );
              })}
            </div>
          </>
        ) : (
          <div style={{ textAlign: 'center', padding: '60px', background: '#fffcfd', border: '2px dashed #ffb7c5', borderRadius: '30px', color: '#8a7d84' }}>
             <p>Nicio sesiune găsită pentru acest pacient.</p>
          </div>
        )}
      </div>
    </SakuraLayout>
  );
}