import { useEffect, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { supabase } from "../../supabaseClient";
import confetti from "canvas-confetti";
import SakuraLayout from "../../layouts/SakuraLayout";
import type { CSSProperties } from "react";

// Interfață pentru datele din Supabase
interface SessionRow {
  durata_secunde: number;
  created_at: string;
}

export default function Congratulations() {
  const location = useLocation();
  const navigate = useNavigate();

  // Preluăm scorul trimis din ExercisePage
  const finalScore = location.state?.finalScore || 0;

  const [feedback, setFeedback] = useState<string>(
    "Se analizează progresul tău...",
  );
  const [isProgress, setIsProgress] = useState<boolean | null>(null);

  useEffect(() => {
    // 1. Efect vizual Sakura (Confetti în nuanțe de roz și alb)
    const duration = 3 * 1000;
    const end = Date.now() + duration;

    const frame = () => {
      confetti({
        particleCount: 2,
        angle: 60,
        spread: 55,
        origin: { x: 0 },
        colors: ["#ffb7c5", "#ff8fa3", "#ffffff"],
      });
      confetti({
        particleCount: 2,
        angle: 120,
        spread: 55,
        origin: { x: 1 },
        colors: ["#ffb7c5", "#ff8fa3", "#ffffff"],
      });

      if (Date.now() < end) {
        requestAnimationFrame(frame);
      }
    };
    frame();

    // 2. Verificare evoluție față de sesiunea anterioară
    async function checkEvolution() {
      try {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) return;

        // REPARAT: Folosim 'data_finalizare' în loc de 'created_at'
        const { data, error } = await supabase
          .from("progres_pacienti")
          .select("durata_secunde, data_finalizare") // Verifică dacă e data_finalizare
          .eq("id_pacient", user.id)
          .order("data_finalizare", { ascending: false }) // Sortăm după data reală
          .limit(2);

        if (error) throw error;

        if (data && data.length > 1) {
          const currentSession = data[0];
          const previousSession = data[1];

          const diff = previousSession.durata_secunde - currentSession.durata_secunde;
          
          if (diff > 0) {
            setIsProgress(true);
            setFeedback(`🌸 Progres excelent! Ai terminat cu ${diff}s mai repede.`);
          } else {
            setIsProgress(false);
            setFeedback(`✨ Efort constant! Menține acest ritm pentru rezultate pe termen lung.`);
          }
        } else {
          setIsProgress(null);
          setFeedback("Prima sesiune salvată! Acesta este începutul călătoriei tale.");
        }
      } catch (err) {
        console.error("Eroare la calcularea evoluției:", err);
        setFeedback("Sesiune finalizată cu succes!");
      }
    }

    checkEvolution();
  }, []);

  return (
    <SakuraLayout>
      <div style={containerStyle}>
        <div style={cardStyle}>
          <div style={iconStyle}>🌸</div>
          <h2 style={titleStyle}>Felicitări!</h2>

          <p style={subtitleStyle}>Ai finalizat sesiunea cu scorul:</p>
          <div style={scoreContainerStyle}>
            <span style={scoreTextStyle}>{finalScore}</span>
            <span style={percentStyle}>%</span>
          </div>

          <div
            style={{
              ...feedbackBoxStyle,
              borderColor:
                isProgress === true
                  ? "#a7c9b0"
                  : isProgress === false
                    ? "#ffb7c5"
                    : "#e2e8f0",
              backgroundColor:
                isProgress === true
                  ? "#f0fdf4"
                  : isProgress === false
                    ? "#fff9fa"
                    : "#f8fafc",
            }}
          >
            <p
              style={{
                color:
                  isProgress === true
                    ? "#166534"
                    : isProgress === false
                      ? "#ff8fa3"
                      : "#64748b",
                fontSize: "16px",
                fontWeight: 800,
                margin: 0,
              }}
            >
              {feedback}
            </p>
          </div>

          <div style={buttonGroupStyle}>
            <button
              onClick={() => navigate("/progres")}
              style={primaryBtnStyle}
              onMouseOver={(e) =>
                (e.currentTarget.style.backgroundColor = "#ff7a91")
              }
              onMouseOut={(e) =>
                (e.currentTarget.style.backgroundColor = "#ff8fa3")
              }
            >
              📊 VEZI EVOLUȚIA COMPLETĂ
            </button>

            <button
              onClick={() => navigate("/dashboard")}
              style={secondaryBtnStyle}
            >
              Înapoi la Dashboard
            </button>
          </div>
        </div>
      </div>
    </SakuraLayout>
  );
}

// --- STILURI MODERATE PENTRU UN ASPECT PREMIUM ---
const containerStyle: CSSProperties = {
  minHeight: "80vh",
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  padding: "40px 20px",
};

const cardStyle: CSSProperties = {
  backgroundColor: "rgba(255, 255, 255, 0.95)",
  backdropFilter: "blur(20px)",
  padding: "50px",
  borderRadius: "40px",
  textAlign: "center",
  border: "1px solid rgba(255, 255, 255, 0.5)",
  width: "100%",
  maxWidth: "480px",
  boxShadow: "0 25px 60px rgba(255, 183, 197, 0.25)",
};

const iconStyle: CSSProperties = {
  fontSize: "70px",
  marginBottom: "15px",
  filter: "drop-shadow(0 5px 15px rgba(255, 143, 163, 0.4))",
};

const titleStyle: CSSProperties = {
  fontSize: "38px",
  fontWeight: 900,
  marginBottom: "5px",
  color: "#1e293b",
  letterSpacing: "-1px",
};

const subtitleStyle: CSSProperties = {
  fontSize: "16px",
  color: "#64748b",
  marginBottom: "10px",
  fontWeight: 600,
  textTransform: "uppercase",
  letterSpacing: "1px",
};

const scoreContainerStyle: CSSProperties = {
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  marginBottom: "35px",
};

const scoreTextStyle: CSSProperties = {
  fontSize: "100px",
  fontWeight: 950,
  color: "#ff8fa3",
  lineHeight: "1",
  textShadow: "0 10px 20px rgba(255, 143, 163, 0.2)",
};

const percentStyle: CSSProperties = {
  fontSize: "36px",
  fontWeight: 900,
  color: "#ffb7c5",
  marginLeft: "8px",
};

const feedbackBoxStyle: CSSProperties = {
  padding: "24px",
  borderRadius: "24px",
  marginBottom: "40px",
  border: "2px solid",
  transition: "all 0.4s ease",
};

const buttonGroupStyle: CSSProperties = {
  display: "flex",
  flexDirection: "column",
  gap: "12px",
};

const primaryBtnStyle: CSSProperties = {
  padding: "20px",
  backgroundColor: "#ff8fa3",
  color: "white",
  border: "none",
  borderRadius: "20px",
  fontWeight: 800,
  fontSize: "16px",
  cursor: "pointer",
  boxShadow: "0 12px 24px rgba(255, 143, 163, 0.3)",
  transition: "all 0.3s ease",
};

const secondaryBtnStyle: CSSProperties = {
  padding: "18px",
  backgroundColor: "white",
  color: "#64748b",
  border: "2px solid #f1f5f9",
  borderRadius: "20px",
  fontWeight: 700,
  fontSize: "15px",
  cursor: "pointer",
  transition: "all 0.3s ease",
};
