import { useEffect, useState, useCallback } from "react";
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
  durata_secunde?: number;
}

export default function PatientStats() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();

  // State-uri de bază
  const [patient, setPatient] = useState<PatientData | null>(null);
  const [allSessions, setAllSessions] = useState<SessionData[]>([]);
  const [filteredSessions, setFilteredSessions] = useState<SessionData[]>([]);
  const [loading, setLoading] = useState(true);

  // State-uri pentru Filtrare și Paginare
  const [filterType, setFilterType] = useState<"toate" | "peste80" | "recente">(
    "toate",
  );
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 5; // Am pus 5 ca să poți testa paginarea ușor

  // State-uri pentru AI
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

      // 2. Luăm toate sesiunile
      const { data, error } = await supabase
        .from("progres_pacienti")
        .select("*")
        .eq("id_pacient", id)
        .order("data_finalizare", { ascending: true });

      if (error) throw error;
      const sessions = (data as SessionData[]) || [];
      setAllSessions(sessions);
      setFilteredSessions(sessions);
    } catch (e) {
      console.error("Eroare la preluarea datelor:", e);
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  // --- LOGICA DE FILTRARE ---
  useEffect(() => {
    let result = [...allSessions];
    if (filterType === "peste80") {
      result = result.filter((s) => s.scor >= 80);
    } else if (filterType === "recente") {
      const oSaptamanaInUrma = new Date();
      oSaptamanaInUrma.setDate(oSaptamanaInUrma.getDate() - 7);
      result = result.filter(
        (s) => new Date(s.data_finalizare) >= oSaptamanaInUrma,
      );
    }
    // Când filtrăm, resetăm la prima pagină
    setFilteredSessions(result);
    setCurrentPage(1);
  }, [filterType, allSessions]);

  // --- LOGICA DE PAGINARE ---
  const indexOfLastItem = currentPage * itemsPerPage;
  const indexOfFirstItem = indexOfLastItem - itemsPerPage;
  const currentSessions = [...filteredSessions]
    .reverse()
    .slice(indexOfFirstItem, indexOfLastItem);
  const totalPages = Math.ceil(filteredSessions.length / itemsPerPage);

  // Datele pentru grafic (întotdeauna folosim ALL sessions pentru a vedea evoluția completă)
  const chartData = allSessions.map((curr, index) => ({
    index,
    scor: curr.scor,
    dataReal: new Date(curr.data_finalizare).toLocaleDateString("ro-RO"),
  }));

  const firstScore = allSessions.length > 0 ? allSessions[0].scor : 0;
  const lastScore =
    allSessions.length > 0 ? allSessions[allSessions.length - 1].scor : 0;
  const diff = lastScore - firstScore;
  const isEvolution = diff >= 0;

  const generateAiReport = async () => {
    setIsGeneratingAi(true);
    setTimeout(() => {
      if (allSessions.length < 3) {
        setAiAnalysis(
          "Date insuficiente pentru o analiză statistică relevantă. Sunt necesare minim 3 ședințe pentru a genera un raport de trend.",
        );
      } else {
        setAiAnalysis(
          `Analiza indică o traiectorie ${isEvolution ? "pozitivă" : "stagnantă"}. S-a observat o variație de ${diff}%. Se recomandă menținerea frecvenței curente.`,
        );
      }
      setIsGeneratingAi(false);
    }, 1200);
  };

  if (loading)
    return (
      <SakuraLayout>
        <div
          style={{ textAlign: "center", padding: "100px", color: "#64748b" }}
        >
          Se analizează indicatorii...
        </div>
      </SakuraLayout>
    );

  return (
    <SakuraLayout>
      <div
        style={{
          padding: "20px 40px",
          background: "#f8fafc",
          minHeight: "100vh",
        }}
      >
        <div style={{ maxWidth: "1200px", margin: "0 auto" }}>
          <button onClick={() => navigate(-1)} style={backBtnStyle}>
            ← Dashboard
          </button>

          <div style={headerStyle}>
            <div>
              <h1
                style={{
                  color: "#1e293b",
                  margin: 0,
                  fontSize: "28px",
                  fontWeight: 800,
                }}
              >
                Raport Evoluție
              </h1>
              <p style={{ color: "#64748b", fontSize: "18px" }}>
                Pacient: {patient?.full_name}
              </p>
            </div>

            {allSessions.length > 1 && (
              <div
                style={{
                  ...trendBadge,
                  background: isEvolution ? "#f0fdf4" : "#fef2f2",
                  color: isEvolution ? "#166534" : "#991b1b",
                }}
              >
                Trend: {isEvolution ? "Progresiv" : "Regresiv"} (
                {diff > 0 ? `+${diff}` : diff}%)
              </div>
            )}
          </div>

          {/* Grafic */}
          <div style={chartContainerStyle}>
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={chartData}>
                <CartesianGrid
                  strokeDasharray="3 3"
                  vertical={false}
                  stroke="#f1f5f9"
                />
                <XAxis dataKey="index" hide />
                <YAxis
                  domain={[0, 100]}
                  axisLine={false}
                  tickLine={false}
                  tick={{ fill: "#94a3b8", fontSize: 12 }}
                />
                <Tooltip
                  formatter={(
                    value: unknown,
                    _name: unknown,
                    item: unknown,
                  ) => {
                    const payload = (item as { payload?: { dataReal: string } })
                      ?.payload;
                    return [
                      `${(value as number) ?? 0}% Acuratețe`,
                      `Data: ${payload?.dataReal ?? "N/A"}`,
                    ] as [string, string];
                  }}
                />
                <Line
                  type="monotone"
                  dataKey="scor"
                  stroke={isEvolution ? "#10b981" : "#ef4444"}
                  strokeWidth={3}
                  dot={{ r: 4 }}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>

          {/* AI Panel */}
          <div style={aiPanelStyle}>
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                marginBottom: "15px",
              }}
            >
              <h3 style={{ margin: 0 }}>Analiză AI</h3>
              <button
                onClick={generateAiReport}
                disabled={isGeneratingAi}
                style={aiBtnStyle}
              >
                {isGeneratingAi ? "Generare..." : "Analizează Datele"}
              </button>
            </div>
            <div style={aiContentStyle}>
              {aiAnalysis || "Sistem pregătit pentru evaluare."}
            </div>
          </div>

          {/* Filtre și Tabel */}
          <div style={{ marginBottom: "60px" }}>
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                marginBottom: "20px",
              }}
            >
              <h3 style={{ margin: 0 }}>Istoric Ședințe</h3>

              {/* Dropdown Filtrare */}
              <select
                value={filterType}
                onChange={(e) =>
                  setFilterType(
                    e.target.value as "toate" | "peste80" | "recente",
                  )
                }
                style={filterSelectStyle}
              >
                <option value="toate">Toate ședințele</option>
                <option value="peste80">Scor &gt; 80%</option>
                <option value="recente">Ultima săptămână</option>
              </select>
            </div>

            <div style={{ display: "grid", gap: "10px" }}>
              {currentSessions.map((s, i) => (
                <div key={s.id} style={sessionRowStyle}>
                  <span>
                    <b>#{filteredSessions.length - (indexOfFirstItem + i)}</b> —{" "}
                    {new Date(s.data_finalizare).toLocaleString("ro-RO")}
                  </span>
                  <span
                    style={{
                      color: s.scor >= 70 ? "#10b981" : "#ef4444",
                      fontWeight: 800,
                    }}
                  >
                    {s.scor}%
                  </span>
                </div>
              ))}
              {filteredSessions.length === 0 && (
                <p style={{ textAlign: "center", color: "#94a3b8" }}>
                  Nu există ședințe care să corespundă filtrului.
                </p>
              )}
            </div>

            {/* Controale Paginare */}
            {totalPages > 1 && (
              <div style={paginationContainer}>
                <button
                  disabled={currentPage === 1}
                  onClick={() => setCurrentPage((p) => p - 1)}
                  style={pageBtn}
                >
                  Înapoi
                </button>
                <span style={{ fontWeight: 600 }}>
                  Pagina {currentPage} din {totalPages}
                </span>
                <button
                  disabled={currentPage === totalPages}
                  onClick={() => setCurrentPage((p) => p + 1)}
                  style={pageBtn}
                >
                  Înainte
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </SakuraLayout>
  );
}

// --- STILURI ---
const backBtnStyle = {
  marginBottom: "20px",
  padding: "8px 16px",
  borderRadius: "8px",
  border: "1px solid #e2e8f0",
  background: "white",
  cursor: "pointer",
};
const headerStyle: React.CSSProperties = {
  display: "flex",
  justifyContent: "space-between",
  alignItems: "center",
  marginBottom: "25px",
};
const trendBadge: React.CSSProperties = {
  padding: "8px 16px",
  borderRadius: "20px",
  fontWeight: 700,
  fontSize: "14px",
};
const chartContainerStyle: React.CSSProperties = {
  background: "white",
  padding: "20px",
  borderRadius: "16px",
  border: "1px solid #e2e8f0",
  height: "300px",
  marginBottom: "30px",
};
const aiPanelStyle: React.CSSProperties = {
  background: "#f1f5f9",
  padding: "20px",
  borderRadius: "16px",
  marginBottom: "30px",
};
const aiBtnStyle = {
  background: "#4f46e5",
  color: "white",
  border: "none",
  padding: "8px 16px",
  borderRadius: "8px",
  cursor: "pointer",
};
const aiContentStyle: React.CSSProperties = {
  background: "white",
  padding: "15px",
  borderRadius: "10px",
  border: "1px solid #e2e8f0",
  fontSize: "14px",
};
const sessionRowStyle: React.CSSProperties = {
  background: "white",
  padding: "15px 20px",
  borderRadius: "12px",
  display: "flex",
  justifyContent: "space-between",
  border: "1px solid #e2e8f0",
};
const filterSelectStyle = {
  padding: "8px 12px",
  borderRadius: "8px",
  border: "1px solid #cbd5e1",
  background: "white",
  fontSize: "14px",
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
  padding: "6px 12px",
  borderRadius: "6px",
  border: "1px solid #cbd5e1",
  background: "white",
  cursor: "pointer",
};
