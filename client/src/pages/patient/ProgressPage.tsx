import { useEffect, useState, useMemo } from 'react';
import { supabase } from '../../supabaseClient';
import { XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Area, AreaChart } from 'recharts';
import { useNavigate } from 'react-router-dom';
import SakuraLayout from '../../layouts/SakuraLayout';
import { jsPDF } from 'jspdf';
import html2canvas from 'html2canvas';
import type { CSSProperties } from 'react';

interface SessionData { 
  id: string;
  date: string; 
  scor: number; 
  timestamp: Date; 
  tip_exercitiu: string;
  durata_secunde: number;
}
type FilterType = 'zile' | 'saptamani' | 'luni';

interface CerereDoctor {
  id: string;
  id_medic: string; 
  nume_doctor: string;
}

export default function ProgressPage() {
  const [rawData, setRawData] = useState<SessionData[]>([]);
  const [cereri, setCereri] = useState<CerereDoctor[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [exporting, setExporting] = useState<boolean>(false);
  const [filter, setFilter] = useState<FilterType>('zile');
  const [analizaAI, setAnalizaAI] = useState<string>("");
  const [loadingAI, setLoadingAI] = useState<boolean>(false);
  const [userNume, setUserNume] = useState<string>("Pacient");

  // State-uri pentru Filtrare și Paginare Tabel
  const [filtruExercitiu, setFiltruExercitiu] = useState<string>('all');
  const [filtruScor, setFiltruScor] = useState<string>('all'); 
  const [ordonareData, setOrdonareData] = useState<'desc' | 'asc'>('desc');
  const [paginaCurenta, setPaginaCurenta] = useState<number>(1);
  const randuriPePagina = 5; 

  const navigate = useNavigate();

  useEffect(() => {
    async function fetchProgressAndRequests() {
      try {
        setLoading(true);
        const { data: { user } } = await supabase.auth.getUser();

        if (user) {
          const numeIdentificat = user.user_metadata?.nume || user.user_metadata?.full_name || "Pacient";
          setUserNume(numeIdentificat);

          const { data: sessions, error } = await supabase
            .from('progres_pacienti')
            .select('id, data_finalizare, scor, tip_exercitiu, durata_secunde')
            .eq('id_pacient', user.id)
            .order('data_finalizare', { ascending: true });

          if (error) throw error;

          if (sessions) {
            setRawData(sessions.map(s => ({
              id: s.id,
              timestamp: new Date(s.data_finalizare),
              date: new Date(s.data_finalizare).toLocaleDateString('ro-RO'),
              scor: Number(s.scor),
              tip_exercitiu: s.tip_exercitiu || "Coordonare Forme",
              durata_secunde: s.durata_secunde || 0
            })));
          }

          const { data: relatiiData, error: relatiiError } = await supabase
            .from('relatii_pacienti')
            .select('id, id_medic') 
            .eq('id_pacient', user.id) 
            .eq('status', 'pending');

          if (!relatiiError && relatiiData && relatiiData.length > 0) {
            const cereriCuNume = await Promise.all(
              relatiiData.map(async (r: any) => {
                const { data: docData } = await supabase
                  .from('doctori')
                  .select('full_name') 
                  .eq('id', r.id_medic) 
                  .single();
                return {
                  id: r.id,
                  id_medic: r.id_medic,
                  nume_doctor: docData?.full_name || "Medic Specialist"
                };
              })
            );
            setCereri(cereriCuNume);
          }
        }
      } catch (err) {
        console.error("Eroare ProgressPage:", err);
      } finally {
        setLoading(false);
      }
    }
    fetchProgressAndRequests();
  }, []);

  const chartData = useMemo(() => {
    const groups: Record<string, { totalScor: number; count: number; label: string }> = {};
    rawData.forEach(s => {
      let key = "";
      if (filter === 'zile') {
        key = s.timestamp.toLocaleDateString('ro-RO', { day: '2-digit', month: '2-digit' });
      } else if (filter === 'saptamani') {
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

  const dateTabelFiltrate = useMemo(() => {
    let rezultate = [...rawData];

    if (filtruExercitiu !== 'all') {
      rezultate = rezultate.filter(s => s.tip_exercitiu === filtruExercitiu);
    }

    if (filtruScor === 'high') {
      rezultate = rezultate.filter(s => s.scor >= 70);
    } else if (filtruScor === 'low') {
      rezultate = rezultate.filter(s => s.scor < 70);
    }

    rezultate.sort((a, b) => {
      const timeA = a.timestamp.getTime();
      const timeB = b.timestamp.getTime();
      return ordonareData === 'desc' ? timeB - timeA : timeA - timeB;
    });

    return rezultate;
  }, [rawData, filtruExercitiu, filtruScor, ordonareData]);

  const totalPagini = Math.ceil(dateTabelFiltrate.length / randuriPePagina) || 1;
  const paginaSigura = paginaCurenta > totalPagini ? 1 : paginaCurenta;
  
  const indexUltimulRand = paginaSigura * randuriPePagina;
  const indexPrimulRand = indexUltimulRand - randuriPePagina;
  const randuriPaginaCurenta = dateTabelFiltrate.slice(indexPrimulRand, indexUltimulRand);

  const gestioneazaCerere = async (idRelatie: string, statusNou: 'acceptat' | 'respins') => {
    try {
      const { error } = await supabase
        .from('relatii_pacienti')
        .update({ status: statusNou })
        .eq('id', idRelatie);

      if (!error) {
        setCereri(prev => prev.filter(c => c.id !== idRelatie));
      }
    } catch (err) {
      console.error("Eroare la procesarea cererii:", err);
    }
  };

  // --- COD ASINCRON ABSOLUT CORECT ȘI SINCRONIZAT PE ID CU SERVERUL ---
  const genereazaRaportAI = async () => {
    if (rawData.length === 0) return;
    setLoadingAI(true);
    setAnalizaAI("");
    try {
      const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000';
      const { data: { user } } = await supabase.auth.getUser();

      const res = await fetch(`${API_URL}/api/exercises/analiza-ai`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id_pacient: user?.id, // Sincronizat perfect în 'id_pacient'
          pacientNume: String(userNume)
        })
      });

      const data = await res.json();
      if (res.ok && data.success) {
        setAnalizaAI(data.analysis || data.rezumat);
      } else {
        setAnalizaAI(`Eroare AI: ${data.error || "Eroare de procesare."}`);
      }
    } catch (err) {
      console.error("Eroare raport AI pacient:", err);
      setAnalizaAI("Eroare de rețea la conectarea cu serverul AI.");
    } finally {
      setLoadingAI(false);
    }
  };

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
      <div style={pageContainerStyle}>
        
        {cereri.length > 0 && (
          <div style={{ marginBottom: '25px', display: 'flex', flexDirection: 'column', gap: '12px', width: '100%' }}>
            {cereri.map(c => (
              <div key={c.id} style={bannerDoctorStyle}>
                <p style={{ margin: 0, fontWeight: 600, color: '#4d444a', fontSize: '15px' }}>
                  Doctorul <span style={{ color: '#ff8fa3', fontWeight: 800 }}>{c.nume_doctor}</span> dorește să vă monitorizeze progresul.
                </p>
                <div style={{ display: 'flex', gap: '10px' }}>
                  <button onClick={() => gestioneazaCerere(c.id, 'acceptat')} style={acceptBtnStyle}>Acceptă</button>
                  <button onClick={() => gestioneazaCerere(c.id, 'respins')} style={rejectBtnStyle}>Respinge</button>
                </div>
              </div>
            ))}
          </div>
        )}

        <header style={headerStyle}>
          <div>
            <h1 style={{ color: '#4d444a', fontWeight: 900, margin: 0 }}>Evoluția Ta 📈</h1>
            <p style={{ color: '#8a7d84', margin: '4px 0 0 0' }}>Istoricul performanței tale în exerciții</p>
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
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px', width: '100%' }}>
              <h3 style={{ color: '#ff8fa3', margin: 0, fontSize: '18px', fontWeight: 800 }}>Progres Acuratețe (%)</h3>
              {rawData.length > 0 && (
                <button onClick={genereazaRaportAI} disabled={loadingAI} style={aiTriggerBtnStyle}>
                  {loadingAI ? '🌸 Se analizează...' : '✨ Interpretare Clinică AI'}
                </button>
              )}
            </div>

            <div style={chartWrapperStyle}>
              {chartData.length > 0 ? (
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={chartData} margin={{ top: 10, right: 30, left: -20, bottom: 0 }}>
                    <defs>
                      <linearGradient id="colorScor" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#ffb7c5" stopOpacity={0.6}/>
                        <stop offset="95%" stopColor="#ffb7c5" stopOpacity={0}/>
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f0f0f0" />
                    <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{fill: '#8a7d84', fontSize: 12}} />
                    <YAxis domain={[0, 100]} axisLine={false} tickLine={false} tick={{fill: '#8a7d84', fontSize: 12}} />
                    <Tooltip contentStyle={{ borderRadius: '15px', border: 'none', boxShadow: '0 5px 15px rgba(0,0,0,0.05)' }} />
                    <Area type="monotone" dataKey="scor" stroke="#ff8fa3" fillOpacity={1} fill="url(#colorScor)" strokeWidth={4} />
                  </AreaChart>
                </ResponsiveContainer>
              ) : (
                <div style={emptyStateStyle}>Nu există date pentru perioada selectată.</div>
              )}
            </div>

            {analizaAI && (
              <div style={aiResponseBoxStyle}>
                <div style={{ fontWeight: 900, color: '#ff8fa3', marginBottom: '8px', fontSize: '14px' }}>
                  🤖 Evaluare Inteligentă a Graficului:
                </div>
                <div style={{ lineHeight: '1.6', color: '#4d444a', whiteSpace: 'pre-line' }}>{analizaAI}</div>
              </div>
            )}
          </div>

          {/* Tabel Istoric Paginat de Jos */}
          <div style={tabelSectiuneStyle}>
            <div style={tabelFiltreHeaderStyle}>
              <h3 style={{ color: '#4d444a', margin: 0, fontSize: '18px', fontWeight: 800 }}>Istoric Detaliat Sesiuni 📋</h3>
              <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap' }}>
                <select value={filtruExercitiu} onChange={(e) => { setFiltruExercitiu(e.target.value); setPaginaCurenta(1); }} style={selectStyle}>
                  <option value="all">Toate exercițiile</option>
                  <option value="Coordonare Forme">Coordonare Forme</option>
                  <option value="Urmărire Traseu">Urmărire Traseu</option>
                  <option value="Flexie Degete">Flexie Degete</option>
                </select>
                <select value={filtruScor} onChange={(e) => { setFiltruScor(e.target.value); setPaginaCurenta(1); }} style={selectStyle}>
                  <option value="all">Toate scorurile</option>
                  <option value="high">Scor mare (≥ 70%)</option>
                  <option value="low">Scor mic (&lt; 70%)</option>
                </select>
                <select value={ordonareData} onChange={(e) => setOrdonareData(e.target.value as any)} style={selectStyle}>
                  <option value="desc">Cele mai recente</option>
                  <option value="asc">Cele mai vechi</option>
                </select>
              </div>
            </div>

            <div style={{ overflowX: 'auto', width: '100%' }}>
              <table style={tableStyle}>
                <thead>
                  <tr style={{ backgroundColor: '#ff8fa3', color: 'white' }}>
                    <th style={thStyle}>Tip Exercițiu</th>
                    <th style={thStyle}>Scor</th>
                    <th style={thStyle}>Durată</th>
                    <th style={thStyle}>Data Finalizării</th>
                  </tr>
                </thead>
                <tbody>
                  {randuriPaginaCurenta.length > 0 ? (
                    randuriPaginaCurenta.map((sesiune) => (
                      <tr key={sesiune.id} style={trStyle}>
                        <td style={tdStyle}>{sesiune.tip_exercitiu}</td>
                        <td style={tdStyle}>
                          <span style={{
                            padding: '4px 10px', borderRadius: '8px', fontSize: '12px', fontWeight: 'bold',
                            backgroundColor: sesiune.scor >= 70 ? '#e6f7ed' : '#fff3cd',
                            color: sesiune.scor >= 70 ? '#1f7a42' : '#856404'
                          }}>
                            {sesiune.scor}%
                          </span>
                        </td>
                        <td style={tdStyle}>{sesiune.durata_secunde} secunde</td>
                        <td style={tdStyle}>{sesiune.date}</td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan={4} style={{ ...tdStyle, textAlign: 'center', color: '#8a7d84', padding: '30px' }}>
                        Nu s-au găsit sesiuni.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>

            {totalPagini > 1 && (
              <div style={paginareContainerStyle}>
                <button onClick={() => setPaginaCurenta(p => Math.max(p - 1, 1))} disabled={paginaSigura === 1} style={paginareNavBtnStyle}>Anterior</button>
                {Array.from({ length: totalPagini }, (_, i) => (
                  <button key={i + 1} onClick={() => setPaginaCurenta(i + 1)}
                    style={{
                      ...paginareNumarBtnStyle,
                      backgroundColor: paginaSigura === i + 1 ? '#ff8fa3' : 'white',
                      color: paginaSigura === i + 1 ? 'white' : '#4d444a',
                      border: paginaSigura === i + 1 ? '1px solid #ff8fa3' : '1px solid #ffeef2'
                    }}
                  >{i + 1}</button>
                ))}
                <button onClick={() => setPaginaCurenta(p => Math.min(p + 1, totalPagini))} disabled={paginaSigura === totalPagini} style={paginareNavBtnStyle}>Următor</button>
              </div>
            )}
          </div>

        </div>
      </div>
    </SakuraLayout>
  );
}

// --- CONFIGURAȚII STILURI INLINE ---
const pageContainerStyle: CSSProperties = { padding: '40px 20px', maxWidth: '1200px', margin: '0 auto', width: '100%', boxSizing: 'border-box', display: 'flex', flexDirection: 'column' };
const centeredStyle: CSSProperties = { textAlign: 'center', padding: '100px', color: '#ff8fa3', fontWeight: 800 };
const headerStyle: CSSProperties = { display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '30px' };
const reportContainerStyle: CSSProperties = { backgroundColor: 'white', padding: '35px', borderRadius: '40px', boxShadow: '0 10px 40px rgba(0,0,0,0.03)', display: 'flex', flexDirection: 'column', gap: '25px' };
const filterGroupStyle: CSSProperties = { display: 'flex', gap: '10px', marginBottom: '15px', justifyContent: 'center' };
const chartCardStyle: CSSProperties = { backgroundColor: '#fffafb', padding: '25px', borderRadius: '25px', border: '1px solid #fff0f3', display: 'flex', flexDirection: 'column' };
const chartWrapperStyle: CSSProperties = { position: 'relative', width: '100%', height: '380px' };
const filterBtnStyle: CSSProperties = { padding: '10px 25px', borderRadius: '15px', cursor: 'pointer', fontWeight: 800, transition: 'all 0.3s ease' };
const exportBtnStyle: CSSProperties = { padding: '12px 25px', backgroundColor: '#a7c9b0', color: 'white', border: 'none', borderRadius: '15px', fontWeight: 800, cursor: 'pointer' };
const backBtnStyle: CSSProperties = { padding: '12px 25px', backgroundColor: 'white', color: '#8a7d84', border: '1px solid #ffeef2', borderRadius: '15px', fontWeight: 700, cursor: 'pointer' };
const emptyStateStyle: CSSProperties = { display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%', color: '#8a7d84', fontStyle: 'italic' };
const bannerDoctorStyle: CSSProperties = { backgroundColor: 'white', border: '1px solid #ff8fa3', padding: '15px 25px', borderRadius: '15px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', boxShadow: '0 4px 12px rgba(255,143,163,0.08)' };
const acceptBtnStyle: CSSProperties = { padding: '8px 18px', backgroundColor: '#a7c9b0', color: 'white', border: 'none', borderRadius: '10px', fontWeight: 800, cursor: 'pointer' };
const rejectBtnStyle: CSSProperties = { padding: '8px 18px', backgroundColor: 'white', color: '#8a7d84', border: '1px solid #ffeef2', borderRadius: '10px', fontWeight: 700, cursor: 'pointer' };
const aiTriggerBtnStyle: CSSProperties = { padding: '8px 16px', backgroundColor: '#ff8fa3', color: 'white', border: 'none', borderRadius: '12px', fontWeight: 800, cursor: 'pointer' };
const aiResponseBoxStyle: CSSProperties = { marginTop: '20px', padding: '18px 20px', backgroundColor: 'white', borderRadius: '18px', border: '1px solid #ffeef2', fontStyle: 'italic' };
const tabelSectiuneStyle: CSSProperties = { marginTop: '15px', display: 'flex', flexDirection: 'column' };
const tabelFiltreHeaderStyle: CSSProperties = { display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '15px', flexWrap: 'wrap', gap: '15px' };
const selectStyle: CSSProperties = { padding: '8px 12px', borderRadius: '10px', border: '1px solid #ffeef2', backgroundColor: 'white', fontWeight: 'bold', outline: 'none' };
const tableStyle: CSSProperties = { width: '100%', borderCollapse: 'collapse', textAlign: 'left', borderRadius: '15px', overflow: 'hidden' };
const thStyle: CSSProperties = { padding: '12px 16px', fontSize: '14px', fontWeight: 800 };
const tdStyle: CSSProperties = { padding: '12px 16px', fontSize: '14px', color: '#4d444a', borderBottom: '1px solid #ffeef2' };
const trStyle: CSSProperties = { backgroundColor: '#fffafb' };
const paginareContainerStyle: CSSProperties = { display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '6px', marginTop: '20px' };
const paginareNavBtnStyle: CSSProperties = { padding: '6px 12px', border: '1px solid #ffeef2', borderRadius: '8px', backgroundColor: 'white', cursor: 'pointer', fontSize: '13px', color: '#8a7d84' };
const paginareNumarBtnStyle: CSSProperties = { width: '32px', height: '32px', borderRadius: '8px', cursor: 'pointer', fontSize: '13px', fontWeight: 'bold', display: 'flex', alignItems: 'center', justifyContent: 'center' };