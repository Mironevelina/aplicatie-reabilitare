import { useEffect, useState, useCallback, useMemo } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { supabase } from "../../supabaseClient";
import SakuraLayout from "../../layouts/SakuraLayout";
import {
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  LineChart,
  Line,
} from "recharts";

// --- INTERFEȚE ---
interface PatientData {
  full_name: string;
}

interface SessionData {
  id: string | number;
  scor: number;
  data_finalizare: string;
  tip_exercitiu?: string;
  durata_secunde?: number;
}

export default function PatientStats() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();

  // State-uri de bază
  const [patient, setPatient] = useState<PatientData | null>(null);
  const [allSessions, setAllSessions] = useState<SessionData[]>([]);
  const [loading, setLoading] = useState(true);

  // State-uri pentru Filtrare și Paginare avansată
  const [filterType, setFilterType] = useState<"toate" | "peste80" | "recente">("toate");
  const [filtruExercitiu, setFiltruExercitiu] = useState<string>("all");
  const [ordonareData, setOrdonareData] = useState<"desc" | "asc">("desc");
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 5; 

  // State-uri pentru AI real
  const [aiAnalysis, setAiAnalysis] = useState<string>("");
  const [isGeneratingAi, setIsGeneratingAi] = useState(false);

  const fetchData = useCallback(async () => {
    if (!id) return;
    try {
      setLoading(true);
      // 1. Luăm datele pacientului
      const { data: p } = await supabase
        .from("pacienti")
        .select("full_name")
        .eq("id", id)
        .maybeSingle();
      setPatient(p as PatientData);

      // 2. Luăm toate sesiunile din Supabase (ordonate cronologic crescător pentru grafic)
      const { data, error } = await supabase
        .from("progres_pacienti")
        .select("id, scor, data_finalizare, tip_exercitiu, durata_secunde")
        .eq("id_pacient", id)
        .order("data_finalizare", { ascending: true });

      if (error) throw error;
      const sessions = (data as SessionData[]) || [];
      setAllSessions(sessions);
    } catch (e) {
      console.error("Eroare la preluarea datelor:", e);
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  // --- LOGICA DE FILTRARE ȘI ORDONARE ADVANCED (useMemo) ---
  const filteredSessions = useMemo(() => {
    let result = [...allSessions];

    // Filtru tip sesiune (Toate / Peste 80 / Recente)
    if (filterType === "peste80") {
      result = result.filter((s) => s.scor >= 80);
    } else if (filterType === "recente") {
      const oSaptamanaInUrma = new Date();
      oSaptamanaInUrma.setDate(oSaptamanaInUrma.getDate() - 7);
      result = result.filter((s) => new Date(s.data_finalizare) >= oSaptamanaInUrma);
    }

    // Filtru după Tipul de exercițiu (Cerința profei)
    if (filtruExercitiu !== "all") {
      result = result.filter((s) => s.tip_exercitiu === filtruExercitiu);
    }

    // Ordonare cronologică dinamică pentru tabel/liste (implicit cele mai recente sus)
    result.sort((a, b) => {
      const timeA = new Date(a.data_finalizare).getTime();
      const timeB = new Date(b.data_finalizare).getTime();
      return ordonareData === "desc" ? timeB - timeA : timeA - timeB;
    });

    return result;
  }, [allSessions, filterType, filtruExercitiu, ordonareData]);

  // Resetăm pagina când filtrele se modifică
  useEffect(() => {
    setCurrentPage(1);
  }, [filterType, filtruExercitiu, ordonareData]);

  // --- LOGICA DE PAGINARE ---
  const totalPages = Math.ceil(filteredSessions.length / itemsPerPage) || 1;
  const paginaSigura = currentPage > totalPages ? 1 : currentPage;

  const indexOfLastItem = paginaSigura * itemsPerPage;
  const indexOfFirstItem = indexOfLastItem - itemsPerPage;
  const currentSessions = filteredSessions.slice(indexOfFirstItem, indexOfLastItem);

  // Datele pentru grafic (folosesc ordinea cronologică brută: de la stânga la dreapta)
  const chartData = allSessions.map((curr, index) => ({
    index,
    scor: curr.scor,
    dataReal: new Date(curr.data_finalizare).toLocaleDateString("ro-RO"),
  }));

  // --- LOGICĂ CORECTATĂ PENTRU MEDIE ȘI BADGE RECUPERARE ---
  const firstScore = allSessions.length > 0 ? allSessions[0].scor : 0;
  const lastScore = allSessions.length > 0 ? allSessions[allSessions.length - 1].scor : 0;
  
  const totalScoruri = allSessions.reduce((acc, curr) => acc + curr.scor, 0);
  const medieGlobala = allSessions.length > 0 ? Math.round(totalScoruri / allSessions.length) : 0;

  const diff = lastScore - firstScore;
  const isEvolution = lastScore >= firstScore || medieGlobala >= 60;

  // --- APEL RECONFIGURAT CONTEXT MEDICAL PENTRU ENDPOINT-UL AI ---
  const generateAiReport = async () => {
    if (allSessions.length === 0) return;
    setIsGeneratingAi(true);
    setAiAnalysis("");
    try {
      const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000';
      
      const res = await fetch(`${API_URL}/api/exercises/analiza-ai`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id_pacient: id // Trimitem ID-ul în body, forțând backend-ul să aplice formatul academic de medic
        })
      });

      const data = await res.json();
      if (res.ok && data.success) {
        setAiAnalysis(data.analysis || data.rezumat);
      } else {
        setAiAnalysis("Sistemul AI nu a putut prelua datele pacientului. Verificați conexiunea la server.");
      }
    } catch (err) {
      console.error("Eroare AI doctor panel:", err);
      setAiAnalysis("Eroare de comunicare asincronă cu motorul clinic.");
    } finally {
      setIsGeneratingAi(false);
    }
  };

  if (loading)
    return (
      <SakuraLayout>
        <div style={{ textAlign: "center", padding: "100px", color: "#ff8fa3", fontWeight: 800 }}>
          🌸 Se încarcă fișa clinică a pacientului...
        </div>
      </SakuraLayout>
    );

  return (
    <SakuraLayout>
      <div style={{ padding: "40px 20px", background: "#fffafb", minHeight: "100vh" }}>
        <div style={{ maxWidth: "1200px", margin: "0 auto" }}>
          
          <button onClick={() => navigate(-1)} style={backBtnStyle}>
            ← Înapoi la Dashboard
          </button>

          <div style={headerStyle}>
            <div>
              <h1 style={{ color: "#4d444a", margin: 0, fontSize: "28px", fontWeight: 900 }}>
                Fișă Clinică & Evoluție 📈
              </h1>
              <p style={{ color: "#8a7d84", fontSize: "16px", margin: "6px 0 0 0", fontWeight: 600 }}>
                Pacient: <span style={{ color: "#ff8fa3", fontWeight: 800 }}>{patient?.full_name}</span>
              </p>
            </div>

            {allSessions.length > 1 && (
              <div
                style={{
                  ...trendBadge,
                  background: isEvolution ? "#e6f7ed" : "#fff3cd",
                  color: isEvolution ? "#1f7a42" : "#856404",
                  border: isEvolution ? "1px solid #a3e635" : "1px solid #fef08a"
                }}
              >
                {diff === 0 && lastScore === 100 
                  ? "✓ Recuperare Totală Consolidată (100%)" 
                  : isEvolution 
                    ? `Evoluție globală: 📈 Progres (+${diff}%)` 
                    : `Evoluție globală: 📉 Stagnare/Regres (${diff}%)`}
              </div>
            )}
          </div>

          {/* Grafic Evolutiv Recharts */}
          <div style={chartContainerStyle}>
            <div style={{ marginBottom: "15px", color: "#ff8fa3", fontWeight: 800, fontSize: "15px" }}>
              Analiza Grafică a Scorurilor de Reabilitare
            </div>
            <ResponsiveContainer width="100%" height="85%">
              <LineChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#fff0f3" />
                <XAxis dataKey="index" hide />
                <YAxis domain={[0, 100]} axisLine={false} tickLine={false} tick={{ fill: "#8a7d84", fontSize: 12 }} />
                <Tooltip
                  contentStyle={{ borderRadius: "12px", border: "1px solid #ffeef2", boxShadow: "0 4px 12px rgba(0,0,0,0.02)" }}
                  formatter={(value: unknown, _name: unknown, item: unknown) => {
                    const payload = (item as { payload?: { dataReal: string } })?.payload;
                    return [`${value}% Acuratețe`, `Data: ${payload?.dataReal ?? "N/A"}`];
                  }}
                />
                <Line
                  type="monotone"
                  dataKey="scor"
                  stroke="#ff8fa3"
                  strokeWidth={4}
                  dot={{ r: 5, fill: "#ff8fa3", strokeWidth: 2 }}
                  activeDot={{ r: 7 }}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>

          {/* Raport AI dedicat Medicului */}
          <div style={aiPanelStyle}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "15px" }}>
              <h3 style={{ margin: 0, color: "#4d444a", fontWeight: 800 }}>✨ Interpretare Clinică AI (Raport Medic)</h3>
              <button onClick={generateAiReport} disabled={isGeneratingAi} style={aiBtnStyle}>
                {isGeneratingAi ? "🌸 Se analizează..." : "Generează Raport Direct"}
              </button>
            </div>
            <div style={aiContentStyle}>
              {aiAnalysis || "Sistemul expert este pregătit pentru evaluarea automată a istoricului mișcărilor."}
            </div>
          </div>

          {/* Secțiune Filtre Multiple și Tabel Sesiuni */}
          <div style={{ marginBottom: "60px" }}>
            <div style={filterHeaderStyle}>
              <h3 style={{ margin: 0, color: "#4d444a", fontWeight: 800 }}>Istoric Ședințe Monitorizate</h3>

              {/* Panou de selectoare pentru filtre avansate */}
              <div style={{ display: "flex", gap: "10px", flexWrap: "wrap" }}>
                
                {/* Filtru Tip Interval */}
                <select value={filterType} onChange={(e) => setFilterType(e.target.value as any)} style={filterSelectStyle}>
                  <option value="toate">Toate perioadele</option>
                  <option value="peste80">Scor bun (Acuratețe ≥ 80%)</option>
                  <option value="recente">Ultima săptămână</option>
                </select>

                {/* Filtru Exercițiu */}
                <select value={filtruExercitiu} onChange={(e) => setFiltruExercitiu(e.target.value)} style={filterSelectStyle}>
                  <option value="all">Toate tipurile de exerciții</option>
                  <option value="Coordonare Forme">Coordonare Forme</option>
                  <option value="Urmărire Traseu">Urmărire Traseu</option>
                  <option value="Flexie Degete">Flexie Degete</option>
                </select>

                {/* Ordonare Dată */}
                <select value={ordonareData} onChange={(e) => setOrdonareData(e.target.value as any)} style={filterSelectStyle}>
                  <option value="desc">Cele mai recente în top</option>
                  <option value="asc">Cele mai vechi în top</option>
                </select>
              </div>
            </div>

            {/* Rândurile cu Sesiuni */}
            <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
              {currentSessions.map((s, i) => (
                <div key={s.id} style={sessionRowStyle}>
                  <div style={{ display: "flex", flexDirection: "column", gap: "4px" }}>
                    <span style={{ fontWeight: 800, color: "#4d444a" }}>
                      {s.tip_exercitiu || "Coordonare Forme"}
                    </span>
                    <span style={{ fontSize: "12px", color: "#8a7d84" }}>
                      Data finalizării: {new Date(s.data_finalizare).toLocaleString("ro-RO")} {s.durata_secunde ? `| Durată: ${s.durata_secunde} secunde` : ''}
                    </span>
                  </div>
                  <span style={{ color: s.scor >= 70 ? "#1f7a42" : "#991b1b", fontWeight: 900, fontSize: "16px", backgroundColor: s.scor >= 70 ? "#e6f7ed" : "#fef2f2", padding: "4px 12px", borderRadius: "8px" }}>
                    {s.scor}%
                  </span>
                </div>
              ))}
              
              {filteredSessions.length === 0 && (
                <p style={{ textAlign: "center", color: "#8a7d84", fontStyle: "italic", padding: "20px" }}>
                  Nu s-au găsit ședințe care să corespundă criteriilor de filtrare selectate.
                </p>
              )}
            </div>

            {/* Controale Paginare (1...X) */}
            {totalPages > 1 && (
              <div style={paginationContainer}>
                <button disabled={paginaSigura === 1} onClick={() => setCurrentPage((p) => p - 1)} style={pageBtn}>
                  Anterior
                </button>
                <span style={{ fontWeight: 700, color: "#4d444a", fontSize: "13px" }}>
                  Pagina {paginaSigura} din {totalPages}
                </span>
                <button disabled={paginaSigura === totalPages} onClick={() => setCurrentPage((p) => p + 1)} style={pageBtn}>
                  Următor
                </button>
              </div>
            )}
          </div>

        </div>
      </div>
    </SakuraLayout>
  );
}

// --- STILURI SAKURA ---
const backBtnStyle = {
  marginBottom: "20px",
  padding: "10px 20px",
  borderRadius: "12px",
  border: "1px solid #ffeef2",
  background: "white",
  color: "#8a7d84",
  fontWeight: "bold" as const,
  cursor: "pointer",
  transition: "all 0.2s ease"
};
const headerStyle: React.CSSProperties = {
  display: "flex",
  justifyContent: "space-between",
  alignItems: "center",
  marginBottom: "25px",
};
const trendBadge: React.CSSProperties = {
  padding: "8px 16px",
  borderRadius: "12px",
  fontWeight: 800,
  fontSize: "13px",
};
const chartContainerStyle: React.CSSProperties = {
  background: "white",
  padding: "25px",
  borderRadius: "24px",
  border: "1px solid #ffeef2",
  height: "340px",
  marginBottom: "30px",
};
const aiPanelStyle: React.CSSProperties = {
  background: "#fff5f6",
  border: "1px solid #fff0f2",
  padding: "20px",
  borderRadius: "20px",
  marginBottom: "30px",
};
const aiBtnStyle = {
  background: "#ff8fa3",
  color: "white",
  border: "none",
  padding: "10px 18px",
  borderRadius: "12px",
  fontWeight: "bold" as const,
  cursor: "pointer",
};
const aiContentStyle: React.CSSProperties = {
  background: "white",
  padding: "16px",
  borderRadius: "14px",
  border: "1px solid #ffeef2",
  fontSize: "14px",
  color: "#4d444a",
  lineHeight: "1.6"
};
const filterHeaderStyle: React.CSSProperties = {
  display: "flex",
  justifyContent: "space-between",
  alignItems: "center",
  marginBottom: "20px",
  flexWrap: "wrap",
  gap: "15px"
};
const sessionRowStyle: React.CSSProperties = {
  background: "white",
  padding: "16px 20px",
  borderRadius: "14px",
  display: "flex",
  justifyContent: "space-between",
  alignItems: "center",
  border: "1px solid #ffeef2",
};
const filterSelectStyle = {
  padding: "8px 14px",
  borderRadius: "10px",
  border: "1px solid #ffeef2",
  background: "white",
  color: "#4d444a",
  fontSize: "13px",
  fontWeight: "bold" as const,
  outline: "none",
};
const paginationContainer: React.CSSProperties = {
  display: "flex",
  justifyContent: "center",
  alignItems: "center",
  gap: "20px",
  marginTop: "25px",
};
const pageBtn = {
  padding: "8px 14px",
  borderRadius: "10px",
  border: "1px solid #ffeef2",
  background: "white",
  color: "#8a7d84",
  fontWeight: "bold" as const,
  cursor: "pointer",
};