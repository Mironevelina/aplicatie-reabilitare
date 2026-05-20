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

  const avgScore =
    sessions.length > 0
      ? Math.round(
          sessions.reduce((acc, s) => acc + s.scor, 0) / sessions.length,
        )
      : 0;

  const weeklyGoal = 5;
  const weeklyProgress = Math.min(
    sessions.filter((s) => {
      const date = new Date(s.data_finalizare);
      const acum = new Date();
      return date > new Date(acum.getTime() - 7 * 24 * 60 * 60 * 1000);
    }).length,
    weeklyGoal,
  );

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
            <button
              onClick={() => navigate("/exercitiu")}
              style={mainActionBtn}
              onMouseOver={(e) =>
                (e.currentTarget.style.backgroundColor = "#f472b6")
              }
              onMouseOut={(e) =>
                (e.currentTarget.style.backgroundColor = "#ff8fa3")
              }
            >
              + Sesiune Nouă
            </button>
          </header>

          {/* BANNER NOU: ANALIZA EVOLUTIE (Transformat în Buton Call-to-Action) */}
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
                <p
                  style={{
                    margin: "4px 0 0 0",
                    fontSize: "14px",
                    color: "#8a7d84",
                  }}
                >
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
              <div
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  marginBottom: "10px",
                }}
              >
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
                    backgroundColor:
                      weeklyProgress === weeklyGoal ? "#10b981" : "#ffb7c5",
                  }}
                />
              </div>
            </div>
          </section>

          {/* STATISTICI (Acum sunt doar două, mai aerisite) */}
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

          {/* ISTORIC */}
          <div style={activityBox}>
            <h3 style={sectionTitle}>Istoric Sesiuni</h3>
            <div style={listWrapper}>
              {sessions.length > 0 ? (
                sessions.map((s, i) => (
                  <div
                    key={s.id}
                    style={{
                      ...sessionRow,
                      backgroundColor: i % 2 === 0 ? "#ffffff" : "#fffbfc",
                      borderBottom:
                        i === sessions.length - 1
                          ? "none"
                          : "1px solid #fceef1",
                    }}
                  >
                    <div style={rowInfo}>
                      <div style={dateBadge}>
                        {new Date(s.data_finalizare).toLocaleDateString(
                          "ro-RO",
                        )}
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
                ))
              ) : (
                <div style={emptyState}>
                  <p style={{ fontWeight: 600, color: "#8a7d84" }}>
                    Încă nu ai nicio sesiune înregistrată.
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

// --- STILURI SAKURA REFINED ---
const pageWrapper: CSSProperties = {
  padding: "40px 20px",
  minHeight: "100vh",
  background: "#fffcfd",
};
const headerStyle: CSSProperties = {
  display: "flex",
  justifyContent: "space-between",
  alignItems: "center",
  marginBottom: "35px",
};
const welcomeTitle: CSSProperties = {
  fontSize: "28px",
  fontWeight: 800,
  color: "#4d444a",
  margin: 0,
};
const welcomeSubtitle: CSSProperties = {
  color: "#b2a4ac",
  fontSize: "15px",
  marginTop: "4px",
};

const mainActionBtn: CSSProperties = {
  padding: "12px 24px",
  background: "#ff8fa3",
  color: "white",
  border: "none",
  borderRadius: "15px",
  fontWeight: 700,
  fontSize: "15px",
  cursor: "pointer",
  transition: "all 0.2s ease",
  boxShadow: "0 4px 12px rgba(255, 143, 163, 0.3)",
};

const analysisBanner: CSSProperties = {
  background: "linear-gradient(90deg, #fff 0%, #fff5f7 100%)",
  padding: "24px",
  borderRadius: "20px",
  border: "1px solid #ffdae1",
  display: "flex",
  justifyContent: "space-between",
  alignItems: "center",
  cursor: "pointer",
  marginBottom: "25px",
  transition: "all 0.3s cubic-bezier(0.4, 0, 0.2, 1)",
};

const analysisIconBox: CSSProperties = {
  width: "50px",
  height: "50px",
  backgroundColor: "#fff",
  borderRadius: "12px",
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  fontSize: "24px",
  boxShadow: "0 2px 8px rgba(255, 143, 163, 0.1)",
};

const arrowCircle: CSSProperties = {
  width: "40px",
  height: "40px",
  borderRadius: "50%",
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  fontSize: "18px",
  fontWeight: "bold",
  transition: "all 0.3s ease",
  border: "1px solid #ffdae1",
};

const challengeBox: CSSProperties = {
  background: "#ffffff",
  padding: "20px",
  borderRadius: "20px",
  marginBottom: "25px",
  border: "1px solid #fceef1",
};

const progressBarTrack: CSSProperties = {
  height: "8px",
  background: "#fceef1",
  borderRadius: "4px",
  overflow: "hidden",
};
const progressBarFill: CSSProperties = {
  height: "100%",
  borderRadius: "4px",
  transition: "width 1s ease-out",
};

const statsGrid: CSSProperties = {
  display: "grid",
  gridTemplateColumns: "1fr 1fr",
  gap: "20px",
  marginBottom: "30px",
};
const statCard: CSSProperties = {
  background: "white",
  padding: "24px",
  borderRadius: "20px",
  border: "1px solid #fceef1",
  boxShadow: "0 2px 10px rgba(0,0,0,0.01)",
};

const statLabel: CSSProperties = {
  color: "#b2a4ac",
  fontSize: "12px",
  fontWeight: 700,
  textTransform: "uppercase",
  letterSpacing: "0.05em",
};
const statValue: CSSProperties = {
  fontSize: "32px",
  fontWeight: 800,
  color: "#4d444a",
  margin: "8px 0 0 0",
};

const activityBox: CSSProperties = {
  background: "white",
  borderRadius: "20px",
  padding: "24px",
  border: "1px solid #fceef1",
};
const sectionTitle: CSSProperties = {
  fontSize: "18px",
  fontWeight: 800,
  color: "#4d444a",
  marginBottom: "20px",
};
const listWrapper: CSSProperties = {
  borderRadius: "15px",
  overflow: "hidden",
  border: "1px solid #fceef1",
};
const sessionRow: CSSProperties = {
  display: "flex",
  justifyContent: "space-between",
  alignItems: "center",
  padding: "14px 18px",
};
const rowInfo: CSSProperties = {
  display: "flex",
  alignItems: "center",
  gap: "15px",
};
const dateBadge: CSSProperties = {
  background: "#fff5f7",
  color: "#ff8fa3",
  padding: "4px 10px",
  borderRadius: "8px",
  fontSize: "12px",
  fontWeight: 700,
};
const exerciseName: CSSProperties = { fontWeight: 600, color: "#4d444a" };
const scoreBadge: CSSProperties = {
  fontWeight: 800,
  fontSize: "14px",
  padding: "6px 12px",
  borderRadius: "10px",
};

const emptyState: CSSProperties = {
  textAlign: "center",
  padding: "40px",
  color: "#b2a4ac",
};
const centeredStyle: CSSProperties = { textAlign: "center", marginTop: "30vh" };
const labelBold: CSSProperties = {
  fontWeight: 700,
  color: "#8a7d84",
  fontSize: "14px",
};
const progressText: CSSProperties = {
  fontWeight: 800,
  color: "#ffb7c5",
  fontSize: "14px",
};
