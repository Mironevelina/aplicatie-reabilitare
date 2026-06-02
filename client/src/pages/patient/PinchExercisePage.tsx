import { useEffect, useRef, useState, useCallback } from "react";
import { Hands, HAND_CONNECTIONS } from "@mediapipe/hands";
import type { LandmarkList } from "@mediapipe/hands";
import { drawConnectors } from "@mediapipe/drawing_utils";
import { useNavigate } from "react-router-dom";
import { supabase } from "../../supabaseClient";
import SakuraLayout from "../../layouts/SakuraLayout";
import type { CSSProperties } from "react";

interface HandData {
  pinch: boolean;
  x: number;
  y: number;
  landmarks: LandmarkList;
}

interface MediaPipeResults {
  multiHandLandmarks: LandmarkList[];
}

export default function PinchExercisePage() {
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const navigate = useNavigate();

  // State-uri pentru exercițiu
  const [score, setScore] = useState(0);
  const [isReady, setIsReady] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [isTargetGrabbed, setIsTargetGrabbed] = useState(false);

  // Referințe stabile pentru animație și scor
  const scoreRef = useRef(0);
  const handDataRef = useRef<HandData | null>(null);
  const startTimeRef = useRef<number | null>(null);
  const isFinishedRef = useRef(false);

  // Poziția florii curente (Sakura) și a coșului țintă
  const targetPosRef = useRef({ x: 0.25, y: 0.3 });
  const basketPosRef = useRef({ x: 0.75, y: 0.5 }); // Coșul este fix în dreapta

  // Schimbă poziția florii aleator în jumătatea stângă a ecranului pentru a reîncepe task-ul
  const genereazaPozitieAleatorieFloare = () => {
    targetPosRef.current = {
      x: 0.15 + Math.random() * 0.3, // Între 15% și 45% pe orizontală
      y: 0.2 + Math.random() * 0.6,  // Între 20% și 80% pe verticală
    };
    setIsTargetGrabbed(false);
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
        id_pacient: user.id,
        tip_exercitiu: "Prindere Obiecte Virtuale", // Sincronizat cu filtrele
        scor: scoreRef.current,
        durata_secunde: duration
      };

      const response = await fetch(`${API_URL}/api/exercises/proceseaza`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(sessionData),
      });

      const result = await response.json();
      if (!response.ok) throw new Error(result.error || "Eroare la comunicarea cu serverul");

      navigate("/felicitari", { state: { finalScore: scoreRef.current } });
    } catch (error: any) {
      console.error("Eroare la finalizare:", error.message);
      navigate("/felicitari", { state: { finalScore: scoreRef.current } });
    } finally {
      setIsSaving(false);
    }
  }, [isSaving, navigate, stopCamera]);

  const handleCancel = () => {
    stopCamera();
    navigate("/dashboard");
  };

  // --- CONFIGURARE ȘI INIȚIALIZARE MEDIAPIPE ---
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
          locateFile: (file) => `https://cdn.jsdelivr.net/npm/@mediapipe/hands/${file}`,
        });

       hands.setOptions({
          maxNumHands: 1,
          modelComplexity: 0, // Schimbat de la 1 la 0 pentru viteză maximă și stabilitate live
          minDetectionConfidence: 0.5, // Scăzut puțin pragul ca să îți prindă mâna instant
          minTrackingConfidence: 0.5,
        });

        hands.onResults((results: MediaPipeResults) => {
          if (!active || isFinishedRef.current) return;

          // MODIFICARE INTELIGENTĂ: Trecem direct pe true imediat ce fluxul video rulează
          if (!isReady) {
            setIsReady(true);
            if (!startTimeRef.current) startTimeRef.current = Date.now();
          }

          if (results.multiHandLandmarks?.[0]) {
            const landmarks = results.multiHandLandmarks[0];
            
            const isPinching = Math.hypot(
              landmarks[4].x - landmarks[8].x,
              landmarks[4].y - landmarks[8].y
            ) < 0.045;

            handDataRef.current = {
              pinch: isPinching,
              x: 1 - (landmarks[4].x + landmarks[8].x) / 2,
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
        console.error("Eroare senzori web:", e);
      }
    };

    init();
    return () => {
      active = false;
      hands?.close();
      stopCamera();
    };
  }, [isReady, stopCamera]);

  // --- BUCLA DE REDARE GRAFICĂ (CANVAS 2D) ---
  useEffect(() => {
    const canvas = canvasRef.current;
    const ctx = canvas?.getContext("2d");
    let raf: number;

    const render = () => {
      if (!ctx || !canvas || isFinishedRef.current) return;
      const hand = handDataRef.current;

      // Dimensiuni calculate dinamic
      const razaFloare = 0.04 * canvas.width;
      const razaCos = 0.07 * canvas.width;

      const floare = targetPosRef.current;
      const cos = basketPosRef.current;

      if (hand) {
        const distantaPanaLaFloare = Math.hypot(hand.x - floare.x, hand.y - floare.y);

        // Dacă e destul de aproape, face pinch și nu a prins deja floarea
        if (distantaPanaLaFloare < 0.06 && hand.pinch) {
          setIsTargetGrabbed(true);
        }

        // Dacă floarea este prinsă, își actualizează poziția după coordonatele degetelor
        if (isTargetGrabbed) {
          if (!hand.pinch) {
            setIsTargetGrabbed(false); // A scăpat obiectul virtual
          } else {
            floare.x = hand.x;
            floare.y = hand.y;

            // Verificăm dacă a adus obiectul cu succes în interiorul coșului de colectare
            const distantaPanaLaCos = Math.hypot(floare.x - cos.x, floare.y - cos.y);
            if (distantaPanaLaCos < 0.07) {
              scoreRef.current += 20; // 5 flori aduse cu succes aduc scorul la 100%
              setScore(scoreRef.current);

              if (scoreRef.current >= 100) {
                handleFinish();
              } else {
                genereazaPozitieAleatorieFloare(); // Re-randăm o floare nouă pe ecran
              }
            }
          }
        }
      }

      ctx.clearRect(0, 0, canvas.width, canvas.height);

      // 1. DESENARE COȘ DE COLECTARE TINTĂ (Dreapta ecranului)
      ctx.beginPath();
      ctx.arc(cos.x * canvas.width, cos.y * canvas.height, razaCos, 0, 2 * Math.PI);
      ctx.fillStyle = "rgba(255, 143, 163, 0.2)"; // Fundal pastel translucent roz
      ctx.fill();
      ctx.lineWidth = 3;
      ctx.strokeStyle = "#ff8fa3";
      ctx.setLineDash([6, 4]); // Contur punctat elegant stil Sakura layout
      ctx.stroke();

      // Text descriptor pentru coș
      ctx.fillStyle = "white";
      ctx.font = "bold 14px Arial";
      ctx.textAlign = "center";
      ctx.textBaseline = "middle";
      ctx.fillText("COȘ COLECTARE", cos.x * canvas.width, cos.y * canvas.height);

      // 2. DESENARE FLOARE DE SAKURA (Obiectul Virtual)
      ctx.setLineDash([]);
      ctx.beginPath();
      ctx.arc(floare.x * canvas.width, floare.y * canvas.height, razaFloare, 0, 2 * Math.PI);
      ctx.fillStyle = isTargetGrabbed ? "#ff4d6d" : "#ff8fa3"; // Își schimbă culoarea când e prinsă!
      ctx.fill();
      ctx.lineWidth = 2;
      ctx.strokeStyle = "white";
      ctx.stroke();

      // Desenăm interiorul florii (mici detalii estetice pentru prezentare)
      ctx.fillStyle = "white";
      ctx.font = "16px Arial";
      ctx.fillText("🌸", floare.x * canvas.width, floare.y * canvas.height);

      // 3. DESENARE SCHELET ARTICULAȚIE MÂNĂ (MediaPipe)
      if (hand) {
        const mirrored = hand.landmarks.map((l) => ({ ...l, x: 1 - l.x }));
        drawConnectors(ctx, mirrored, HAND_CONNECTIONS, {
          color: hand.pinch ? "#a7c9b0" : "#ffffff", // Devine verde pastel când pacientul execută ciupirea corect
          lineWidth: 4,
        });
      }

      raf = requestAnimationFrame(render);
    };

    render();
    return () => cancelAnimationFrame(raf);
  }, [isTargetGrabbed, handleFinish]);

  return (
    <SakuraLayout>
      <div style={fullPageWrapper}>
        <div style={headerContainer}>
          <div style={scoreBadge}>PROGRES COORDONARE: {score}%</div>
          <div style={statusText}>
            {isReady ? "🎯 Prinde floarea și pune-o în coș" : "Inițializare cameră..."}
          </div>
        </div>

        <div style={mainExerciseArea}>
          <video ref={videoRef} autoPlay playsInline muted style={videoStyles} />
          <canvas ref={canvasRef} width="800" height="600" style={canvasStyles} />

          {!isReady && (
            <div style={loaderOverlay}>
              <div style={spinnerStyle} />
              <p style={{ marginTop: "15px", color: "#8a7d84", fontWeight: "bold" }}>
                Validare senzori motrici braț...
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

// --- STILURI INLINE HARMONIZATE CU IDENTITATEA VIZUALĂ SAKURAMOTION ---
const fullPageWrapper: CSSProperties = { display: "flex", flexDirection: "column", alignItems: "center", padding: "40px", background: "#fffafb", minHeight: "100vh" };
const headerContainer: CSSProperties = { width: "100%", maxWidth: "800px", display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "20px" };
const mainExerciseArea: CSSProperties = { position: "relative", width: "800px", height: "600px", background: "#2d2428", borderRadius: "30px", overflow: "hidden", border: "6px solid #ffeef2", boxShadow: "0 10px 30px rgba(255,143,163,0.06)" };
const videoStyles: CSSProperties = { position: "absolute", width: "100%", height: "100%", objectFit: "cover", transform: "scaleX(-1)", opacity: 0.45 };
const canvasStyles: CSSProperties = { position: "absolute", width: "100%", height: "100%", zIndex: 5 };
const loaderOverlay: CSSProperties = { position: "absolute", inset: 0, background: "#fffafb", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", zIndex: 10 };
const scoreBadge: CSSProperties = { background: "#ff8fa3", padding: "12px 26px", borderRadius: "16px", color: "white", fontWeight: 900, fontSize: "16px", boxShadow: "0 4px 12px rgba(255,143,163,0.2)" };
const statusText: CSSProperties = { color: "#8a7d84", fontWeight: 800, fontSize: "14px", textTransform: "uppercase", letterSpacing: "0.5px" };
const buttonGroup: CSSProperties = { marginTop: "30px", display: "flex", gap: "15px" };
const btnFinish: CSSProperties = { padding: "14px 35px", background: "#a7c9b0", color: "white", border: "none", borderRadius: "14px", fontWeight: 800, cursor: "pointer", boxShadow: "0 4px 12px rgba(167,201,176,0.2)" };
const btnCancel: CSSProperties = { padding: "14px 30px", background: "white", color: "#8a7d84", border: "1px solid #ffeef2", borderRadius: "14px", fontWeight: 700, cursor: "pointer" };

const spinnerStyle: CSSProperties = {
  width: "50px",
  height: "50px",
  border: "5px solid #ffeef2",
  borderTop: "5px solid #ff8fa3",
  borderRadius: "50%",
  animation: "spin 1s linear infinite"
};