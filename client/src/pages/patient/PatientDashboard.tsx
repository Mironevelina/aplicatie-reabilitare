import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "../../supabaseClient";
import SakuraLayout from "../../layouts/SakuraLayout";
import type { CSSProperties } from "react";

interface Session {
  id: string | number;
  data_finalizare: string;
  scor: number;
  tip_exercitiu: string;
}

export default function PatientDashboard() {
  const navigate = useNavigate();
  const [sessions, setSessions] = useState<Session[]>([]);
  const [fullName, setFullName] = useState<string>("");
  const [loading, setLoading] = useState(true);
  const [isBtnHovered, setIsBtnHovered] = useState(false);

  // --- STĂRI PENTRU FILTRARE ȘI PAGINARE ---
  const [activeFilter, setActiveFilter] = useState<string>("Toate");
  const [currentPage, setCurrentPage] = useState<number>(1);
  const sessionsPerPage = 5; // Afișează exact 5 sesiuni pe pagină

  useEffect(() => {
    const fetchPatientData = async () => {
      try {
        setLoading(true);
        const {
          data: { user },
        } = await supabase.auth.getUser();

        if (user) {
          const { data: patientProfile } = await supabase
            .from("pacienti")
            .select("full_name")
            .eq("id", user.id)
            .single();

          setFullName(patientProfile?.full_name || "Pacient");

          const { data: sessionData, error } = await supabase
            .from("progres_pacienti")
            .select("id, data_finalizare, scor, tip_exercitiu")
            .eq("id_pacient", user.id)
            .order("data_finalizare", { ascending: false });

          if (!error && sessionData) setSessions(sessionData as Session[]);
        }
      } catch (error) {
        console.error("Eroare date Dashboard:", error);
      } finally {
        setLoading(false);
      }
    };
    fetchPatientData();
  }, []);

  // Calcul acuratețe medie globală
  const avgScore =
    sessions.length > 0
      ? Math.round(
          sessions.reduce((acc, s) => acc + s.scor, 0) / sessions.length,
        )
      : 0;

  // Scop săptămânal
  const weeklyGoal = 5;
  const weeklyProgress = Math.min(
    sessions.filter((s) => {
      const date = new Date(s.data_finalizare);
      const acum = new Date();
      return date > new Date(acum.getTime() - 7 * 24 * 60 * 60 * 1000);
    }).length,
    weeklyGoal,
  );

  // --- LOGICĂ FILTRARE ȘI PAGINARE ---
  // 1. Filtrăm sesiunile în funcție de butonul selectat
  const filteredSessions = sessions.filter((session) => {
    if (activeFilter === "Toate") return true;
    return session.tip_exercitiu.toLowerCase().includes(activeFilter.toLowerCase());
  });

  // Resetează pagina curentă la 1 când utilizatorul schimbă filtrul
  const handleFilterChange = (filterName: string) => {
    setActiveFilter(filterName);
    setCurrentPage(1);
  };

  // 2. Calculăm indecșii pentru felierea array-ului paginat
  const indexOfLastSession = currentPage * sessionsPerPage;
  const indexOfFirstSession = indexOfLastSession - sessionsPerPage;
  const currentSessions = filteredSessions.slice(indexOfFirstSession, indexOfLastSession);

  // 3. Determinăm numărul total de pagini
  const totalPages = Math.ceil(filteredSessions.length / sessionsPerPage);

  if (loading)
    return (
      <SakuraLayout>
        <div style={centeredStyle}>
          <p style={{ color: "#ff8fa3", fontWeight: 600 }}>
            Se încarcă profilul Sakura...
          </p>
        </div>
      </SakuraLayout>
    );

  return (
    <SakuraLayout>
      <div style={pageWrapper}>
        <div style={{ maxWidth: "900px", margin: "0 auto" }}>
          
          {/* HEADER */}
          <header style={headerStyle}>
            <div>
              <h1 style={welcomeTitle}>
                Bună dimineața, {fullName.split(" ")[0]}
              </h1>
              <p style={welcomeSubtitle}>
                Monitorizarea progresului tău în timp real.
              </p>
            </div>
          </header>

          {/* BANNER: ANALIZA EVOLUTIE */}
          <div
            onClick={() => navigate("/progres")}
            onMouseEnter={() => setIsBtnHovered(true)}
            onMouseLeave={() => setIsBtnHovered(false)}
            style={{
              ...analysisBanner,
              transform: isBtnHovered ? "translateY(-3px)" : "none",
              boxShadow: isBtnHovered
                ? "0 12px 24px rgba(255, 143, 163, 0.25)"
                : "0 4px 12px rgba(255, 183, 197, 0.15)",
            }}
          >
            <div style={{ display: "flex", alignItems: "center", gap: "20px" }}>
              <div style={analysisIconBox}>📊</div>
              <div>
                <h3 style={{ margin: 0, fontSize: "18px", color: "#4d444a" }}>
                  Analiza Completă a Evoluției
                </h3>
                <p style={{ margin: "4px 0 0 0", fontSize: "14px", color: "#8a7d84" }}>
                  Consultă rapoartele detaliate și istoricul tău medical.
                </p>
              </div>
            </div>
            <div
              style={{
                ...arrowCircle,
                backgroundColor: isBtnHovered ? "#ff8fa3" : "#fff",
                color: isBtnHovered ? "#fff" : "#ff8fa3",
              }}
            >
              →
            </div>
          </div>

          {/* OBIECTIV SAPTAMANAL */}
          <section style={challengeBox}>
            <div style={{ flex: 1 }}>
              <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "10px" }}>
                <span style={labelBold}>Activitate Săptămânală</span>
                <span style={progressText}>
                  {weeklyProgress} / {weeklyGoal} ședințe
                </span>
              </div>
              <div style={progressBarTrack}>
                <div
                  style={{
                    ...progressBarFill,
                    width: `${(weeklyProgress / weeklyGoal) * 100}%`,
                    backgroundColor: weeklyProgress === weeklyGoal ? "#10b981" : "#ffb7c5",
                  }}
                />
              </div>
            </div>
          </section>

          {/* STATISTICI */}
          <div style={statsGrid}>
            <div style={{ ...statCard, borderLeft: "5px solid #ffb7c5" }}>
              <p style={statLabel}>Acuratețe Medie</p>
              <h2 style={statValue}>{avgScore}%</h2>
            </div>

            <div style={{ ...statCard, borderLeft: "5px solid #4f46e5" }}>
              <p style={statLabel}>Total Sesiuni</p>
              <h2 style={statValue}>{sessions.length}</h2>
            </div>
          </div>

          {/* SECTIUNE: SELECTIE TOATE EXERCITIILE */}
          <div style={exerciseSelectionBox}>
            <h3 style={sectionTitle}>Programe de Recuperare Disponibile 🌸</h3>
            <div style={exerciseGrid}>
              
              {/* Card Exercițiu 1 */}
              <div style={exerciseCard}>
                <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
                  <span style={exerciseCardTitle}>Coordonare Forme</span>
                  <span style={exerciseCardDesc}>Potrivirea figurilor geometrice prin translație pe ecran.</span>
                </div>
                <button onClick={() => navigate("/exercitiu")} style={startExerciseBtn}>
                  Start ▶
                </button>
              </div>

              {/* Card Exercițiu 2 */}
              <div style={{ ...exerciseCard, borderTop: "4px solid #a7c9b0" }}>
                <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
                  <span style={exerciseCardTitle}>Prindere Obiecte Virtuale</span>
                  <span style={exerciseCardDesc}>Antrenarea motricității fine prin gestul de ciupire (Pinch).</span>
                </div>
                <button 
                  onClick={() => navigate("/exercitiu-prindere")} 
                  style={{ ...startExerciseBtn, backgroundColor: "#a7c9b0" }}
                  onMouseOver={(e) => (e.currentTarget.style.backgroundColor = "#96b89f")}
                  onMouseOut={(e) => (e.currentTarget.style.backgroundColor = "#a7c9b0")}
                >
                  Start ▶
                </button>
              </div>

              {/* Card Exercițiu 3 */}
              <div style={{ ...exerciseCard, borderTop: "4px solid #8b5cf6" }}>
                <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
                  <span style={exerciseCardTitle}>Urmărire Traseu</span>
                  <span style={exerciseCardDesc}>Controlul stabilității cinematice continue pe puncte de reper.</span>
                </div>
                <button 
                  onClick={() => navigate("/exercitiu-traseu")} 
                  style={{ ...startExerciseBtn, backgroundColor: "#8b5cf6" }}
                  onMouseOver={(e) => (e.currentTarget.style.backgroundColor = "#7c4ee4")}
                  onMouseOut={(e) => (e.currentTarget.style.backgroundColor = "#8b5cf6")}
                >
                  Start ▶
                </button>
              </div>

              {/* Card Exercițiu 4 */}
              <div style={{ ...exerciseCard, borderTop: "4px solid #f59e0b" }}>
                <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
                  <span style={exerciseCardTitle}>Asamblare Floare</span>
                  <span style={exerciseCardDesc}>Monitorizarea amplitudinii articulare și a rigidității musculare.</span>
                </div>
                <button 
                  onClick={() => navigate("/exercitiu-degete")} 
                  style={{ ...startExerciseBtn, backgroundColor: "#f59e0b" }}
                  onMouseOver={(e) => (e.currentTarget.style.backgroundColor = "#e08e07")}
                  onMouseOut={(e) => (e.currentTarget.style.backgroundColor = "#f59e0b")}
                >
                  Start ▶
                </button>
              </div>

            </div>
          </div>

          {/* ISTORIC CU FILTRE ȘI PAGINARE */}
          <div style={activityBox}>
            <div style={historyHeader}>
              <h3 style={sectionTitle}>Istoric Sesiuni</h3>
              
              {/* Grup Butoane de Filtrare */}
              <div style={filterGroup}>
                {["Toate", "Forme", "Prindere", "Traseu", "Asamblare Cinematică Floare Sakura"].map((f) => (
                  <button
                    key={f}
                    onClick={() => handleFilterChange(f)}
                    style={{
                      ...filterTabBtn,
                      backgroundColor: activeFilter === f ? "#ff8fa3" : "#fff",
                      color: activeFilter === f ? "#fff" : "#8a7d84",
                      border: activeFilter === f ? "1px solid #ff8fa3" : "1px solid #eef2f5",
                    }}
                  >
                    {f === "Forme" ? "Coordonare" : f === "Asamblare Cinematică Floare Sakura" ? "Asamblare Cinematică Floare Sakura" : f}
                  </button>
                ))}
              </div>
            </div>

            {/* Listă Sesiuni Filtrate și Paginate */}
            <div style={listWrapper}>
              {currentSessions.length > 0 ? (
                <>
                  {currentSessions.map((s, i) => (
                    <div
                      key={s.id}
                      style={{
                        ...sessionRow,
                        backgroundColor: i % 2 === 0 ? "#ffffff" : "#fffbfc",
                        borderBottom: i === currentSessions.length - 1 ? "none" : "1px solid #fceef1",
                      }}
                    >
                      <div style={rowInfo}>
                        <div style={dateBadge}>
                          {new Date(s.data_finalizare).toLocaleDateString("ro-RO")}
                        </div>
                        <span style={exerciseName}>{s.tip_exercitiu}</span>
                      </div>
                      <div
                        style={{
                          ...scoreBadge,
                          color: s.scor >= 80 ? "#059669" : "#e11d48",
                          backgroundColor: s.scor >= 80 ? "#ecfdf5" : "#fff1f2",
                        }}
                      >
                        {s.scor}%
                      </div>
                    </div>
                  ))}

                  {/* CONTROALE PAGINARE (Apar doar dacă avem mai mult de o pagină) */}
                  {totalPages > 1 && (
                    <div style={paginationControlRow}>
                      <button
                        disabled={currentPage === 1}
                        onClick={() => setCurrentPage((prev) => prev - 1)}
                        style={{
                          ...paginationBtn,
                          opacity: currentPage === 1 ? 0.4 : 1,
                          cursor: currentPage === 1 ? "not-allowed" : "pointer",
                        }}
                      >
                        ← Înapoi
                      </button>
                      <span style={pageIndicatorText}>
                        Pagina {currentPage} din {totalPages}
                      </span>
                      <button
                        disabled={currentPage === totalPages}
                        onClick={() => setCurrentPage((prev) => prev + 1)}
                        style={{
                          ...paginationBtn,
                          opacity: currentPage === totalPages ? 0.4 : 1,
                          cursor: currentPage === totalPages ? "not-allowed" : "pointer",
                        }}
                      >
                        Înainte →
                      </button>
                    </div>
                  )}
                </>
              ) : (
                <div style={emptyState}>
                  <p style={{ fontWeight: 600, color: "#8a7d84", margin: 0 }}>
                    Nu s-au găsit sesiuni pentru filtrul "{activeFilter}".
                  </p>
                </div>
              )}
            </div>
          </div>

        </div>
      </div>
    </SakuraLayout>
  );
}

// --- STILURI REFINED ȘI NOI ACCESORII DE FILTRARE ---
const pageWrapper: CSSProperties = { padding: "40px 20px" }; // Eliminat background-ul solid rigid pentru transparență transparentă
const headerStyle: CSSProperties = { display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "35px" };
const welcomeTitle: CSSProperties = { fontSize: "28px", fontWeight: 800, color: "#4d444a", margin: 0 };
const welcomeSubtitle: CSSProperties = { color: "#b2a4ac", fontSize: "15px", marginTop: "4px" };
const analysisBanner: CSSProperties = { background: "linear-gradient(90deg, #fff 0%, #fff5f7 100%)", padding: "24px", borderRadius: "20px", border: "1px solid #ffdae1", display: "flex", justifyContent: "space-between", alignItems: "center", cursor: "pointer", marginBottom: "25px", transition: "all 0.3s cubic-bezier(0.4, 0, 0.2, 1)" };
const analysisIconBox: CSSProperties = { width: "50px", height: "50px", backgroundColor: "#fff", borderRadius: "12px", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "24px", boxShadow: "0 2px 8px rgba(255, 143, 163, 0.1)" };
const arrowCircle: CSSProperties = { width: "40px", height: "40px", borderRadius: "50%", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "18px", fontWeight: "bold", transition: "all 0.3s ease", border: "1px solid #ffdae1" };
const challengeBox: CSSProperties = { background: "#ffffff", padding: "20px", borderRadius: "20px", marginBottom: "25px", border: "1px solid #fceef1" };
const progressBarTrack: CSSProperties = { height: "8px", background: "#fceef1", borderRadius: "4px", overflow: "hidden" };
const progressBarFill: CSSProperties = { height: "100%", borderRadius: "4px", transition: "width 1s ease-out" };
const statsGrid: CSSProperties = { display: "grid", gridTemplateColumns: "1fr 1fr", gap: "20px", marginBottom: "30px" };
const statCard: CSSProperties = { background: "white", padding: "24px", borderRadius: "20px", border: "1px solid #fceef1", boxShadow: "0 2px 10px rgba(0,0,0,0.01)" };
const statLabel: CSSProperties = { color: "#b2a4ac", fontSize: "12px", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.05em" };
const statValue: CSSProperties = { fontSize: "32px", fontWeight: 800, color: "#4d444a", margin: "8px 0 0 0" };
const exerciseSelectionBox: CSSProperties = { background: "white", borderRadius: "20px", padding: "24px", border: "1px solid #fceef1", marginBottom: "30px" };
const exerciseGrid: CSSProperties = { display: "flex", flexDirection: "column", gap: "14px", marginTop: "15px" };
const exerciseCard: CSSProperties = { display: "flex", justifyContent: "space-between", alignItems: "center", padding: "16px 20px", backgroundColor: "#fffafb", border: "1px solid #ffeef2", borderTop: "4px solid #ff8fa3", borderRadius: "14px" };
const exerciseCardTitle: CSSProperties = { fontWeight: 800, color: "#4d444a", fontSize: "16px" };
const exerciseCardDesc: CSSProperties = { color: "#8a7d84", fontSize: "13px" };
const startExerciseBtn: CSSProperties = { padding: "10px 20px", backgroundColor: "#ff8fa3", color: "white", border: "none", borderRadius: "10px", fontWeight: "bold", fontSize: "14px", cursor: "pointer", transition: "all 0.2s" };

const activityBox: CSSProperties = { background: "white", borderRadius: "20px", padding: "24px", border: "1px solid #fceef1" };
const historyHeader: CSSProperties = { display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: "15px" };
const filterGroup: CSSProperties = { display: "flex", gap: "8px", flexWrap: "wrap" };
const filterTabBtn: CSSProperties = { padding: "6px 14px", borderRadius: "20px", fontSize: "13px", fontWeight: "600", cursor: "pointer", transition: "all 0.2s ease" };

const sectionTitle: CSSProperties = { fontSize: "18px", fontWeight: 800, color: "#4d444a", margin: 0 };
const listWrapper: CSSProperties = { borderRadius: "15px", overflow: "hidden", border: "1px solid #fceef1", marginTop: "15px" };
const sessionRow: CSSProperties = { display: "flex", justifyContent: "space-between", alignItems: "center", padding: "14px 18px" };
const rowInfo: CSSProperties = { display: "flex", alignItems: "center", gap: "15px" };
const dateBadge: CSSProperties = { background: "#fff5f7", color: "#ff8fa3", padding: "4px 10px", borderRadius: "8px", fontSize: "12px", fontWeight: 700 };
const exerciseName: CSSProperties = { fontWeight: 600, color: "#4d444a" };
const scoreBadge: CSSProperties = { fontWeight: 800, fontSize: "14px", padding: "6px 12px", borderRadius: "10px" };
const emptyState: CSSProperties = { textAlign: "center", padding: "40px", color: "#b2a4ac" };
const centeredStyle: CSSProperties = { textAlign: "center", marginTop: "30vh" };
const labelBold: CSSProperties = { fontWeight: 700, color: "#8a7d84", fontSize: "14px" };
const progressText: CSSProperties = { fontWeight: 800, color: "#ffb7c5", fontSize: "14px" };

// Stiluri specifice pentru bara de paginare
const paginationControlRow: CSSProperties = { display: "flex", justifyContent: "space-between", alignItems: "center", padding: "12px 18px", backgroundColor: "#fffafb", borderTop: "1px solid #fceef1" };
const paginationBtn: CSSProperties = { padding: "6px 14px", backgroundColor: "white", border: "1px solid #eef2f5", borderRadius: "8px", fontSize: "13px", fontWeight: "600", color: "#8a7d84", transition: "all 0.2s" };
const pageIndicatorText: CSSProperties = { fontSize: "13px", fontWeight: "700", color: "#b2a4ac" };