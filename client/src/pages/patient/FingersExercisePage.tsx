import React, { useRef, useEffect, useState, useCallback } from 'react';
import { Hands } from "@mediapipe/hands";
import type { LandmarkList } from "@mediapipe/hands";
import { useNavigate } from 'react-router-dom';
import { supabase } from '../../supabaseClient';
import SakuraLayout from '../../layouts/SakuraLayout';
import type { CSSProperties } from "react";

// --- INTERFEȚE ---
interface Petal {
  id: number;
  x: number; 
  y: number; 
  targetX: number; 
  targetY: number;
  angle: number; 
  radius: number; 
  atasata: boolean;
}

interface MediaPipeResults {
  multiHandLandmarks: LandmarkList[];
  image: HTMLVideoElement;
}

export function FingersExercisePage() {
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const navigate = useNavigate();

  const handsRef = useRef<any>(null);
  const cameraActiveRef = useRef<boolean>(false);
  const requestRef = useRef<number | null>(null);

  // Stări administrative și progres
  const [idPacient, setIdPacient] = useState<string>("");
  const [loadingUser, setLoadingUser] = useState<boolean>(true);
  const [score, setScore] = useState(0);
  const [isReady, setIsReady] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [ghidTerapeutic, setGhidTerapeutic] = useState("Se inițializează fluxul video și senzorul optic...");

  // Obiectiv fix: Receptaculul central al florii (proporții normalizate 0-1)
  const centerFlower = { x: 0.5, y: 0.23, radius: 0.05 }; 

  // Referințe mutabile pentru stocarea datelor în timp real
  const scoreRef = useRef(0);
  const startTimeRef = useRef<number | null>(null);
  const isFinishedRef = useRef(false);
  const activePetalIdRef = useRef<number | null>(null);
  const handDataRef = useRef<{ x: number; y: number; visible: boolean }>({ x: 0.5, y: 0.5, visible: false });

  // Matricea de petale salvată în Ref pentru acces instantaneu la 60fps
  const petalsRef = useRef<Petal[]>([
    { id: 1, x: 0.15, y: 0.8, targetX: 0.5, targetY: 0.23, angle: 0, radius: 0.022, atasata: false },
    { id: 2, x: 0.32, y: 0.83, targetX: 0.5, targetY: 0.23, angle: (2 * Math.PI) / 5, radius: 0.022, atasata: false },
    { id: 3, x: 0.5, y: 0.85, targetX: 0.5, targetY: 0.23, angle: (4 * Math.PI) / 5, radius: 0.022, atasata: false },
    { id: 4, x: 0.68, y: 0.83, targetX: 0.5, targetY: 0.23, angle: (6 * Math.PI) / 5, radius: 0.022, atasata: false },
    { id: 5, x: 0.85, y: 0.8, targetX: 0.5, targetY: 0.23, angle: (8 * Math.PI) / 5, radius: 0.022, atasata: false },
  ]);

  // Preluare securizată a ID-ului de pacient la montare
  useEffect(() => {
    const getPatientData = async () => {
      try {
        setLoadingUser(true);
        const { data: { user } } = await supabase.auth.getUser();
        if (user) setIdPacient(user.id);
      } catch (err) {
        console.error("Eroare autentificare:", err);
      } finally {
        setLoadingUser(false);
      }
    };
    getPatientData();
  }, []);

  // REPARAT DEFINITIV: Oprirea completă a camerei hardware și eliminarea loop-ului video
  const stopCamera = useCallback(() => {
    // 1. Blocăm instantaneu buclele active din rula asincronă
    cameraActiveRef.current = false;
    isFinishedRef.current = true;

    // 2. Anulăm frame-urile de animație programate
    if (requestRef.current !== null) {
      cancelAnimationFrame(requestRef.current);
      requestRef.current = null;
    }

    // 3. Oprim toate track-urile stream-ului video hardware
    if (streamRef.current) {
      const tracks = streamRef.current.getTracks();
      tracks.forEach((track) => {
        track.stop();
        track.enabled = false; // Forțăm dezactivarea la nivel electric/hardware
      });
      streamRef.current = null;
    }

    // 4. Decuplăm elementul video nativ din DOM
    if (videoRef.current) {
      videoRef.current.pause();
      videoRef.current.srcObject = null;
      videoRef.current.load(); // Resetează complet bufferul video din browser
    }

    // 5. Închidem instanța asincronă a modelului AI
    if (handsRef.current) {
      try {
        const instance = handsRef.current;
        handsRef.current = null; 
        instance.close();
      } catch (e) {
        console.log("MediaPipe curățat.");
      }
    }
  }, []);

  const handleFinish = useCallback(async () => {
    if (isSaving) return;
    setIsSaving(true);
    
    // Oprim camera IMEDIAT pentru a stinge ledul înainte de procesarea bazei de date
    stopCamera();

    try {
      const endTime = Date.now();
      const start = startTimeRef.current || endTime;
      const duration = Math.floor((endTime - start) / 1000);

      const payload = {
        id_pacient: idPacient || (await supabase.auth.getUser()).data.user?.id,
        tip_exercitiu: "Asamblare Cinematică Floare Sakura",
        scor: scoreRef.current,
        durata_secunde: duration,
        data_finalizare: new Date()
      };

      await supabase.from('progres_pacienti').insert([payload]);
      navigate('/felicitari', { state: { finalScore: scoreRef.current } });
    } catch (error) {
      console.error("Eroare salvare progres:", error);
      navigate('/felicitari', { state: { finalScore: scoreRef.current } });
    } finally {
      setIsSaving(false);
    }
  }, [isSaving, idPacient, navigate, stopCamera]);

  const handleCancel = () => {
    stopCamera();
    navigate("/dashboard");
  };

  // Funcție geometrică stabilă pentru desenarea elegantă a unei petale Sakura (picătură)
  const drawSakuraPetalGeometry = (ctx: CanvasRenderingContext2D, x: number, y: number, r: number, rotation: number, isAttached: boolean) => {
    ctx.save();
    ctx.translate(x, y);
    ctx.rotate(rotation);
    
    ctx.beginPath();
    ctx.moveTo(0, 0);
    ctx.bezierCurveTo(-r * 1.5, -r * 1.5, -r * 1.5, -r * 3.5, 0, -r * 4);
    ctx.bezierCurveTo(r * 1.5, -r * 3.5, r * 1.5, -r * 1.5, 0, 0);
    
    const gradient = ctx.createLinearGradient(0, 0, 0, -r * 4);
    if (isAttached) {
      gradient.addColorStop(0, '#ffccd5');
      gradient.addColorStop(1, '#ff4d6d'); 
    } else {
      gradient.addColorStop(0, '#fff0f3');
      gradient.addColorStop(1, '#ff8fa3'); 
    }
    
    ctx.fillStyle = gradient;
    ctx.fill();
    ctx.lineWidth = 1.5;
    ctx.strokeStyle = '#ffffff';
    ctx.stroke();
    ctx.closePath();
    ctx.restore();
  };

  // --- EFFECT MASTER: INIȚIALIZARE ȘI COORDOONARE MEDIAPIPE ---
  useEffect(() => {
    let active = true;
    cameraActiveRef.current = true;
    isFinishedRef.current = false;
    let handsInstance: Hands;

    const initMasterExercise = async () => {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({
          video: { width: 640, height: 480 },
        });
        
        if (!active || isFinishedRef.current || !cameraActiveRef.current) {
          stream.getTracks().forEach(t => t.stop());
          return;
        }

        if (videoRef.current) videoRef.current.srcObject = stream;
        streamRef.current = stream;

        handsInstance = new Hands({
          locateFile: (file) => `https://cdn.jsdelivr.net/npm/@mediapipe/hands/${file}`,
        });

        handsInstance.setOptions({
          maxNumHands: 1,
          modelComplexity: 1,
          minDetectionConfidence: 0.5,
          minTrackingConfidence: 0.5,
        });

        handsRef.current = handsInstance;

        handsInstance.onResults((results: MediaPipeResults) => {
          if (!active || isFinishedRef.current || !cameraActiveRef.current) return;

          const canvas = canvasRef.current;
          const ctx = canvas?.getContext("2d");
          if (!canvas || !ctx) return;

          const w = canvas.width;
          const h = canvas.height;
          const rFlower = centerFlower.radius * w;

          if (!isReady && results.multiHandLandmarks?.[0]) {
            setIsReady(true);
            setGhidTerapeutic("🌸 Conexiune AI activă! Prinde petalele de jos cu degetul arătător.");
            if (!startTimeRef.current) startTimeRef.current = Date.now();
          }

          if (results.multiHandLandmarks?.[0]) {
            const landmarks = results.multiHandLandmarks[0];
            const indexTip = landmarks[8];

            if (indexTip) {
              handDataRef.current = {
                visible: true,
                x: 1 - indexTip.x, 
                y: indexTip.y,
              };
            }
          } else {
            handDataRef.current.visible = false;
          }

          const hand = handDataRef.current;

          if (hand && hand.visible) {
            let activeId = activePetalIdRef.current;

            petalsRef.current = petalsRef.current.map((petal) => {
              if (petal.atasata) return petal;

              const distLaDeget = Math.hypot(hand.x - petal.x, hand.y - petal.y);

              if (activeId === null && distLaDeget < 0.075) {
                activeId = petal.id;
                activePetalIdRef.current = petal.id;
                return { ...petal, x: hand.x, y: hand.y };
              }

              if (activeId === petal.id) {
                const distLaCentruFloare = Math.hypot(hand.x - centerFlower.x, hand.y - centerFlower.y);

                if (distLaCentruFloare < 0.075) {
                  activeId = null;
                  activePetalIdRef.current = null;

                  const totalFixate = petalsRef.current.filter((p) => p.id === petal.id ? true : p.atasata).length;
                  const scorNou = Math.round((totalFixate / petalsRef.current.length) * 100);
                  scoreRef.current = scorNou;
                  setScore(scorNou);

                  if (totalFixate === petalsRef.current.length) {
                    // Stopăm camera hardware în mod direct
                    stopCamera();
                  }

                  return { ...petal, x: centerFlower.x, y: centerFlower.y, atasata: true };
                }

                return { ...petal, x: hand.x, y: hand.y };
              }

              return petal;
            });
          }

          ctx.clearRect(0, 0, w, h);

          // Contur roz de sus
          ctx.beginPath();
          ctx.arc(centerFlower.x * w, centerFlower.y * h, rFlower, 0, 2 * Math.PI);
          ctx.fillStyle = 'rgba(255, 255, 255, 0.35)';
          ctx.fill();
          ctx.lineWidth = 3;
          ctx.strokeStyle = '#ffb7c5';
          ctx.stroke();
          ctx.closePath();

          // Petale active
          petalsRef.current.forEach((petal) => {
            const rotationAngle = petal.atasata ? petal.angle : 0;
            drawSakuraPetalGeometry(ctx, petal.x * w, petal.y * h, petal.radius * w, rotationAngle, petal.atasata);
          });

          // Indicator deget arătător
          if (hand && hand.visible) {
            ctx.beginPath();
            ctx.arc(hand.x * w, hand.y * h, 11, 0, 2 * Math.PI);
            ctx.fillStyle = activePetalIdRef.current !== null ? '#10b981' : '#4f46e5'; 
            ctx.shadowColor = '#ffffff';
            ctx.shadowBlur = 10;
            ctx.fill();
            ctx.lineWidth = 2.5;
            ctx.strokeStyle = '#ffffff';
            ctx.stroke();
            ctx.closePath();
            ctx.shadowBlur = 0;
          }
        });

        const processVideoFrame = async () => {
          if (active && cameraActiveRef.current && videoRef.current?.readyState === 4 && !isFinishedRef.current) {
            try {
              await handsInstance.send({ image: videoRef.current });
            } catch (e) {
              console.log("Senzor oprit.");
            }
          }
          if (active && cameraActiveRef.current && !isFinishedRef.current) {
            requestRef.current = requestAnimationFrame(processVideoFrame);
          }
        };
        processVideoFrame();

      } catch (err) {
        console.error("Eroare inițializare master loop:", err);
        setGhidTerapeutic("❌ Oglinda optică nu a putut fi pornită.");
      }
    };

    initMasterExercise();

    return () => {
      active = false;
      cameraActiveRef.current = false;
      isFinishedRef.current = true;
      if (requestRef.current) cancelAnimationFrame(requestRef.current);
      if (handsInstance) {
        try {
          handsInstance.close();
        } catch (e) {}
      }
      if (streamRef.current) {
        streamRef.current.getTracks().forEach(t => t.stop());
      }
    };
  }, [isReady, stopCamera, handleFinish]);

  if (loadingUser) {
    return (
      <SakuraLayout>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '80vh', color: '#ff8fa3', fontWeight: 'bold' }}>
          Se securizează conexiunea...
        </div>
      </SakuraLayout>
    );
  }

  return (
    <SakuraLayout>
      <div style={fullPageWrapper}>
        <div style={headerContainer}>
          <div style={scoreBadge}>FLOARE ASAMBLATĂ: {score}%</div>
          <div style={statusText}>
            {isReady ? "Senzori AI Activi" : "Se validează modelul optic..."}
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
            width={800}
            height={600}
            style={canvasStyles}
          />

          {!isReady && (
            <div style={loaderOverlay}>
              <div className="spinner-sakura" />
              <p style={{ marginTop: "15px", color: "#64748b", fontWeight: 'bold' }}>
                {ghidTerapeutic}
              </p>
            </div>
          )}
        </div>

        {isReady && (
          <div style={{ width: '100%', maxWidth: '800px', backgroundColor: '#fff', padding: '15px 25px', borderRadius: '16px', border: '1px solid #ffdae1', marginTop: '20px', textAlign: 'center', fontSize: '14px', color: '#ff8fa3', fontWeight: 700 }}>
            {activePetalIdRef.current !== null ? "👌 Ai prins o petală! Ridică brațul sus și du-o la cerc." : "🖐 Coboară brațul, pune degetul arătător peste o petală de jos și ridic-o!"}
          </div>
        )}

        <div style={buttonGroup}>
          <button onClick={handleCancel} style={btnCancel}>
            Renunță
          </button>
          <button onClick={handleFinish} style={btnFinish} disabled={isSaving}>
            {isSaving ? "Se salvează..." : "Finalizare Manuală"}
          </button>
        </div>
      </div>
    </SakuraLayout>
  );
}

// --- STILURI MODERNE PREMIUM ---
const fullPageWrapper: CSSProperties = {
  display: "flex",
  flexDirection: "column",
  alignItems: "center",
  padding: "40px",
  background: '#fffcfd',
  minHeight: '88vh'
};
const headerContainer: CSSProperties = {
  width: "100%",
  maxWidth: "800px",
  display: "flex",
  justifyContent: "space-between",
  alignItems: 'center',
  marginBottom: "20px",
};
const mainExerciseArea: CSSProperties = {
  position: "relative",
  width: "800px",
  height: "600px",
  background: "#1e1b1c",
  borderRadius: "24px",
  overflow: "hidden",
  border: "4px solid #fff0f3",
  boxShadow: '0 10px 30px rgba(255, 183, 197, 0.15)'
};
const videoStyles: CSSProperties = {
  position: "absolute",
  width: "100%",
  height: "100%",
  objectFit: "cover",
  transform: "scaleX(-1)", 
  opacity: 0.45,
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
  background: "#fffcfd",
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
  fontSize: "16px",
  boxShadow: '0 4px 12px rgba(255, 143, 163, 0.25)'
};
const statusText: CSSProperties = {
  color: "#64748b",
  fontWeight: 700,
  textTransform: "uppercase",
  letterSpacing: "1px",
  fontSize: '13px'
};
const buttonGroup: CSSProperties = {
  marginTop: "25px",
  display: "flex",
  gap: "15px",
};
const btnFinish: CSSProperties = {
  padding: "15px 40px",
  background: "#10b981",
  color: "white",
  border: "none",
  borderRadius: "12px",
  fontWeight: 700,
  cursor: "pointer",
  boxShadow: '0 4px 12px rgba(16, 185, 129, 0.2)'
};
const btnCancel: CSSProperties = {
  padding: "15px 30px",
  background: "white",
  color: "#8a7d84",
  border: "1px solid #ffdae1",
  borderRadius: "12px",
  fontWeight: 600,
  cursor: "pointer",
};