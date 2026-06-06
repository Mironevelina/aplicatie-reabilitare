import { useEffect, useRef, useState, useCallback } from "react";
import { Hands, HAND_CONNECTIONS } from "@mediapipe/hands";
import type { LandmarkList } from "@mediapipe/hands";
import { drawConnectors } from "@mediapipe/drawing_utils";
import { useNavigate } from "react-router-dom";
import { supabase } from "../../supabaseClient";
import SakuraLayout from "../../layouts/SakuraLayout";
import type { CSSProperties } from "react";

// --- INTERFEȚE ---
interface Shape {
  type: string;
  x: number;
  y: number;
  active: boolean;
  color: string;
}

interface HandData {
  pinch: boolean;
  x: number;
  y: number;
  landmarks: LandmarkList;
}

interface MediaPipeResults {
  multiHandLandmarks: LandmarkList[];
}

const TARGETS = [
  { x: 0.8, y: 0.3 },
  { x: 0.8, y: 0.7 },
  { x: 0.65, y: 0.3 },
  { x: 0.65, y: 0.7 },
];

export default function ExercisePage() {
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const navigate = useNavigate();

  const [score, setScore] = useState(0);
  const [isGrabbed, setIsGrabbed] = useState<number | null>(null);
  const [isReady, setIsReady] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  const scoreRef = useRef(0);
  const handDataRef = useRef<HandData | null>(null);
  const startTimeRef = useRef<number | null>(null);
  const isFinishedRef = useRef(false);

  const shapesRef = useRef<Shape[]>([
    { type: "Cerc", x: 0.15, y: 0.3, active: true, color: "#4f46e5" },
    { type: "Pătrat", x: 0.15, y: 0.7, active: true, color: "#10b981" },
    { type: "Triunghi", x: 0.3, y: 0.3, active: true, color: "#8b5cf6" },
    { type: "Romb", x: 0.3, y: 0.7, active: true, color: "#f59e0b" },
  ]);

  const drawGeometry = (
    ctx: CanvasRenderingContext2D,
    x: number,
    y: number,
    s: number,
    type: string,
  ) => {
    ctx.beginPath();
    if (type === "Cerc") ctx.arc(x, y, s, 0, 2 * Math.PI);
    else if (type === "Pătrat") ctx.rect(x - s, y - s, s * 2, s * 2);
    else if (type === "Triunghi") {
      ctx.moveTo(x, y - s);
      ctx.lineTo(x - s, y + s);
      ctx.lineTo(x + s, y + s);
      ctx.closePath();
    } else if (type === "Romb") {
      ctx.moveTo(x, y - s);
      ctx.lineTo(x + s, y);
      ctx.lineTo(x, y + s);
      ctx.lineTo(x - s, y);
      ctx.closePath();
    }
  };

  const stopCamera = useCallback(() => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => track.stop());
      streamRef.current = null;
    }
    if (videoRef.current) videoRef.current.srcObject = null;
  }, []);

 const handleFinish = useCallback(async () => {
  if (isSaving || isFinishedRef.current) return;
  setIsSaving(true);
  isFinishedRef.current = true;
  stopCamera();

  try {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error("Utilizator neautentificat");

    const endTime = Date.now();
    const start = startTimeRef.current || endTime;
    const duration = Math.floor((endTime - start) / 1000);

    const API_URL = import.meta.env.VITE_API_URL || "http://localhost:5000";

    const sessionData = {
      id_pacient: user.id,          // Sincronizat cu backend/tabel
      tip_exercitiu: "Coordonare Forme",
      scor: scoreRef.current,        // Sincronizat cu backend/tabel
      durata_secunde: duration
    };

    const response = await fetch(`${API_URL}/api/exercises/proceseaza`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(sessionData),
    });

    const result = await response.json();

    if (!response.ok) {
      throw new Error(result.error || "Eroare la comunicarea cu serverul");
    }

    navigate("/felicitari", { state: { finalScore: scoreRef.current } });
  } catch (error: any) {
    console.error("Eroare la finalizare:", error.message);
    // Alertă pentru debug - poți să o scoți la prezentare
    alert(`Eroare salvare: ${error.message}`);
    navigate("/felicitari", { state: { finalScore: scoreRef.current } });
  } finally {
    setIsSaving(false);
  }
}, [isSaving, navigate, stopCamera]);

  const handleCancel = () => {
    stopCamera();
    navigate("/dashboard");
  };

  useEffect(() => {
    let active = true;
    let hands: Hands;

    const init = async () => {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({
          video: { width: 640, height: 480 },
        });
        if (videoRef.current) videoRef.current.srcObject = stream;
        streamRef.current = stream;

        hands = new Hands({
          locateFile: (file) =>
            `https://cdn.jsdelivr.net/npm/@mediapipe/hands/${file}`,
        });

        hands.setOptions({
          maxNumHands: 1,
          modelComplexity: 1,
          minDetectionConfidence: 0.7,
          minTrackingConfidence: 0.7,
        });

        hands.onResults((results: MediaPipeResults) => {
          if (!active || isFinishedRef.current) return;

          if (!isReady && results.multiHandLandmarks?.[0]) {
            setIsReady(true);
            if (!startTimeRef.current) startTimeRef.current = Date.now();
          }

          if (results.multiHandLandmarks?.[0]) {
            const landmarks = results.multiHandLandmarks[0];
            // Calcul ciupire (pinch) între degetul mare (4) și arătător (8)
            const isPinching =
              Math.hypot(
                landmarks[4].x - landmarks[8].x,
                landmarks[4].y - landmarks[8].y,
              ) < 0.05;

            handDataRef.current = {
              pinch: isPinching,
              x: 1 - (landmarks[4].x + landmarks[8].x) / 2, // Oglindire coordonate
              y: (landmarks[4].y + landmarks[8].y) / 2,
              landmarks: landmarks,
            };
          } else {
            handDataRef.current = null;
          }
        });

        const process = async () => {
          if (active && videoRef.current?.readyState === 4) {
            await hands.send({ image: videoRef.current });
          }
          if (active && !isFinishedRef.current) requestAnimationFrame(process);
        };
        process();
      } catch (e) {
        console.error("Eroare inițializare senzori:", e);
      }
    };

    init();
    return () => {
      active = false;
      hands?.close();
      stopCamera();
    };
  }, [isReady, stopCamera]);

  useEffect(() => {
    const canvas = canvasRef.current;
    const ctx = canvas?.getContext("2d");
    let raf: number;

    const render = () => {
      if (!ctx || !canvas || isFinishedRef.current) return;
      const hand = handDataRef.current;
      const s = 0.07 * canvas.width;

      if (hand) {
        shapesRef.current.forEach((shape, idx) => {
          if (!shape.active) return;
          const dist = Math.hypot(hand.x - shape.x, hand.y - shape.y);

          if (dist < 0.07 && hand.pinch && isGrabbed === null) {
            setIsGrabbed(idx);
          }

          if (isGrabbed === idx) {
            if (!hand.pinch) {
              setIsGrabbed(null);
            } else {
              shape.x = hand.x;
              shape.y = hand.y;

              if (
                Math.hypot(shape.x - TARGETS[idx].x, shape.y - TARGETS[idx].y) <
                0.06
              ) {
                shape.active = false;
                setIsGrabbed(null);
                scoreRef.current += 25;
                setScore(scoreRef.current);

                if (scoreRef.current >= 100 && !isFinishedRef.current) {
                  handleFinish();
                }
              }
            }
          }
        });
      }

      ctx.clearRect(0, 0, canvas.width, canvas.height);

      // Desenează Țintele (Contur punctat)
      TARGETS.forEach((t, index) => {
        if (!shapesRef.current[index].active) return;
        ctx.setLineDash([8, 4]);
        ctx.strokeStyle = "rgba(255,255,255,0.4)";
        ctx.lineWidth = 2;
        drawGeometry(
          ctx,
          t.x * canvas.width,
          t.y * canvas.height,
          s,
          shapesRef.current[index].type,
        );
        ctx.stroke();
      });

      // Desenează Formele Active
      shapesRef.current.forEach((sh, idx) => {
        if (!sh.active) return;
        ctx.setLineDash([]);
        ctx.fillStyle = sh.color;
        ctx.beginPath();
        drawGeometry(
          ctx,
          sh.x * canvas.width,
          sh.y * canvas.height,
          s,
          sh.type,
        );
        ctx.fill();

        if (isGrabbed === idx) {
          ctx.strokeStyle = "white";
          ctx.lineWidth = 4;
          ctx.stroke();
        }
      });

      // Desenează Mâna (Schelet)
      if (hand) {
        const mirrored = hand.landmarks.map((l) => ({ ...l, x: 1 - l.x }));
        drawConnectors(ctx, mirrored, HAND_CONNECTIONS, {
          color: hand.pinch ? "#10b981" : "#fff",
          lineWidth: 4,
        });
      }

      raf = requestAnimationFrame(render);
    };

    render();
    return () => cancelAnimationFrame(raf);
  }, [isGrabbed, handleFinish]);

  return (
    <SakuraLayout>
      <div style={fullPageWrapper}>
        <div style={headerContainer}>
          <div style={scoreBadge}>ACURATEȚE: {score}%</div>
          <div style={statusText}>
            {isReady ? "Senzori Activi" : "Inițializare cameră..."}
          </div>
        </div>

        <div style={mainExerciseArea}>
          <video
            ref={videoRef}
            autoPlay
            playsInline
            muted
            style={videoStyles}
          />
          <canvas
            ref={canvasRef}
            width="800"
            height="600"
            style={canvasStyles}
          />

          {!isReady && (
            <div style={loaderOverlay}>
              <div className="spinner-sakura" />
              <p style={{ marginTop: "15px", color: "#64748b" }}>
                Validare flux video...
              </p>
            </div>
          )}
        </div>

        <div style={buttonGroup}>
          <button onClick={handleCancel} style={btnCancel}>
            Anulează
          </button>
          <button onClick={handleFinish} style={btnFinish} disabled={isSaving}>
            {isSaving ? "Se salvează..." : "Finalizare Manuală"}
          </button>
        </div>
      </div>
    </SakuraLayout>
  );
}

// --- STILURI ---
const fullPageWrapper: CSSProperties = {
  display: "flex",
  flexDirection: "column",
  alignItems: "center",
  padding: "40px",
};
const headerContainer: CSSProperties = {
  width: "100%",
  maxWidth: "800px",
  display: "flex",
  justifyContent: "space-between",
  marginBottom: "20px",
};
const mainExerciseArea: CSSProperties = {
  position: "relative",
  width: "800px",
  height: "600px",
  background: "#1e293b",
  borderRadius: "24px",
  overflow: "hidden",
  border: "4px solid #f1f5f9",
};
const videoStyles: CSSProperties = {
  position: "absolute",
  width: "100%",
  height: "100%",
  objectFit: "cover",
  transform: "scaleX(-1)",
  opacity: 0.5,
};
const canvasStyles: CSSProperties = {
  position: "absolute",
  width: "100%",
  height: "100%",
  zIndex: 5,
};
const loaderOverlay: CSSProperties = {
  position: "absolute",
  inset: 0,
  background: "#f8fafc",
  display: "flex",
  flexDirection: "column",
  alignItems: "center",
  justifyContent: "center",
  zIndex: 10,
};
const scoreBadge: CSSProperties = {
  background: "#ff8fa3",
  padding: "10px 24px",
  borderRadius: "12px",
  color: "white",
  fontWeight: 800,
  fontSize: "18px",
};
const statusText: CSSProperties = {
  color: "#64748b",
  fontWeight: 600,
  textTransform: "uppercase",
  letterSpacing: "1px",
};
const buttonGroup: CSSProperties = {
  marginTop: "30px",
  display: "flex",
  gap: "15px",
};
const btnFinish: CSSProperties = {
  padding: "15px 40px",
  background: "#4f46e5",
  color: "white",
  border: "none",
  borderRadius: "12px",
  fontWeight: 700,
  cursor: "pointer",
};
const btnCancel: CSSProperties = {
  padding: "15px 30px",
  background: "white",
  color: "#64748b",
  border: "1px solid #e2e8f0",
  borderRadius: "12px",
  fontWeight: 600,
  cursor: "pointer",
};