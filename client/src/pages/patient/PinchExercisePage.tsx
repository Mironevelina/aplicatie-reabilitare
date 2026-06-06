import React, { useRef, useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Hands, HAND_CONNECTIONS } from "@mediapipe/hands";
import { drawConnectors } from "@mediapipe/drawing_utils";
import { supabase } from "../../supabaseClient";
import SakuraLayout from "../../layouts/SakuraLayout";
import type { CSSProperties } from "react";

interface HandData {
  pinch: boolean;
  x: number;
  y: number;
  landmarks: any;
}

interface MediaPipeResults {
  multiHandLandmarks: any[];
}

export default function PinchExercisePage() {
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const handsInstanceRef = useRef<Hands | null>(null);
  const navigate = useNavigate();

  // Stări pacient și control (Identice cu modelul tău din Labirint)
  const [idPacient, setIdPacient] = useState<string>("");
  const [loadingUser, setLoadingUser] = useState<boolean>(true);
  const [isObjectGrabbed, setIsObjectGrabbed] = useState(false);
  const [exerciseStarted, setExerciseStarted] = useState(false);
  const [exerciseFinished, setExerciseFinished] = useState(false);
  const [startTime, setStartTime] = useState<number | null>(null);
  const [score, setScore] = useState(0);

  // Referințe stabile pentru păstrarea coordonatelor și calcul kinetic la 60 FPS
  const objectPosRef = useRef({ x: 0.25, y: 0.3 }); 
  const basketPosRef = useRef({ x: 0.75, y: 0.5 }); 
  const currentHandDataRef = useRef<HandData | null>(null);
  const internalScoreRef = useRef(0);
  const isFinishedFlagRef = useRef(false);

  // Preluare securizată a ID-ului din Supabase
  useEffect(() => {
    const getPatientData = async () => {
      try {
        setLoadingUser(true);
        const { data: { user } } = await supabase.auth.getUser();
        if (user) {
          setIdPacient(user.id);
        }
      } catch (err) {
        console.error("Eroare la preluarea utilizatorului din Supabase:", err);
      } finally {
        setLoadingUser(false);
      }
    };
    getPatientData();
  }, []);

  const genereazaPozitieAleatorieFloare = () => {
    objectPosRef.current = {
      x: 0.15 + Math.random() * 0.3, 
      y: 0.2 + Math.random() * 0.6,  
    };
    setIsObjectGrabbed(false);
  };

  const stopCameraComplet = () => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => track.stop());
      streamRef.current = null;
    }
    if (videoRef.current) videoRef.current.srcObject = null;

    if (handsInstanceRef.current) {
      try {
        handsInstanceRef.current.close();
      } catch (e) {
        console.error("Eroare eliberare instanță MediaPipe:", e);
      }
      handsInstanceRef.current = null;
    }
  };

  // REPARAT RADICAL: Navigare instantanee, urmată de curățare asincronă în fundal
  const salveazaSesiune = async () => {
    if (isFinishedFlagRef.current) return;
    isFinishedFlagRef.current = true;
    setExerciseFinished(true);

    const scorDeTrimis = Math.round(internalScoreRef.current);
    const durata = startTime ? Math.floor((Date.now() - startTime) / 1000) : 0;

    // 1. SCHIMBĂM PAGINA INSTANTANEU (Ocolim orice crash hardware din React)
    navigate('/felicitari', { state: { finalScore: scorDeTrimis }, replace: true });

    // 2. Executăm oprirea camerei și salvarea datelor silențios, pe fundal
    try {
      stopCameraComplet();
      
      let currentUserId = idPacient;
      if (!currentUserId) {
        const { data: { session } } = await supabase.auth.getSession();
        currentUserId = session?.user?.id || "";
      }

      if (currentUserId) {
        await supabase.from('progres_pacienti').insert([{
          id_pacient: currentUserId,
          tip_exercitiu: "Prindere Obiecte Virtuale",
          scor: scorDeTrimis,
          durata_secunde: durata,
          data_finalizare: new Date().toISOString()
        }]);
      }
    } catch (error) {
      console.error("Eroare asincronă salvare fundal:", error);
    }
  };

  const pornesteExercitiu = () => {
    setExerciseStarted(true);
    setExerciseFinished(false);
    internalScoreRef.current = 0;
    setScore(0);
    isFinishedFlagRef.current = false;
    objectPosRef.current = { x: 0.25, y: 0.3 };
    setStartTime(Date.now());
  };

  // --- 1. CONFIGURARE SENZORI ȘI CONEXIUNE MEDIAPIPE ---
  useEffect(() => {
    let active = true;
    let hands: Hands;

    const initMediaPipe = async () => {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({
          video: { width: 640, height: 480 },
        });
        if (videoRef.current) videoRef.current.srcObject = stream;
        streamRef.current = stream;

        hands = new Hands({
          locateFile: (file) => `https://cdn.jsdelivr.net/npm/@mediapipe/hands/${file}`,
        });
        handsInstanceRef.current = hands;

        hands.setOptions({
          maxNumHands: 1,
          modelComplexity: 0,
          minDetectionConfidence: 0.5,
          minTrackingConfidence: 0.5,
        });

        hands.onResults((results: MediaPipeResults) => {
          if (!active || isFinishedFlagRef.current) return;

          if (results.multiHandLandmarks?.[0]) {
            const landmarks = results.multiHandLandmarks[0];
            const isPinching = Math.hypot(
              landmarks[4].x - landmarks[8].x,
              landmarks[4].y - landmarks[8].y
            ) < 0.045;

            currentHandDataRef.current = {
              pinch: isPinching,
              x: 1 - (landmarks[4].x + landmarks[8].x) / 2, 
              y: (landmarks[4].y + landmarks[8].y) / 2,
              landmarks: landmarks,
            };
          } else {
            currentHandDataRef.current = null;
          }
        });

        const processVideoFrame = async () => {
          if (active && videoRef.current?.readyState === 4 && !isFinishedFlagRef.current) {
            await hands.send({ image: videoRef.current });
          }
          if (active && !isFinishedFlagRef.current) {
            requestAnimationFrame(processVideoFrame);
          }
        };
        processVideoFrame();

      } catch (err) {
        console.error("Eroare inițializare cameră / MediaPipe:", err);
      }
    };

    initMediaPipe();
    return () => {
      active = false;
      stopCameraComplet();
    };
  }, []);

  // --- 2. ENGINE GRAFICĂ ȘI LOGICĂ INTERACTIVĂ (CANVAS 2D) ---
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let animationFrameId: number;

    const renderLoop = () => {
      if (isFinishedFlagRef.current) return;

      const hand = currentHandDataRef.current;
      const floare = objectPosRef.current;
      const cos = basketPosRef.current;

      const width = canvas.width;
      const height = canvas.height;
      const razaFloare = 0.04 * width;
      const razaCos = 0.07 * width;

      if (exerciseStarted && !isFinishedFlagRef.current && hand) {
        const distantaPanaLaFloare = Math.hypot(hand.x - floare.x, hand.y - floare.y);

        if (distantaPanaLaFloare < 0.06 && hand.pinch) {
          setIsObjectGrabbed(true);
        }

        if (hand.pinch && (distantaPanaLaFloare < 0.06 || isObjectGrabbed)) {
          floare.x = hand.x;
          floare.y = hand.y;

          const distantaPanaLaCos = Math.hypot(floare.x - cos.x, floare.y - cos.y);
          if (distantaPanaLaCos < 0.07) {
            internalScoreRef.current = Math.min(100, internalScoreRef.current + 20);
            setScore(internalScoreRef.current);

            if (internalScoreRef.current >= 100) {
              salveazaSesiune();
              return;
            } else {
              genereazaPozitieAleatorieFloare();
            }
          }
        } else {
          setIsObjectGrabbed(false);
        }
      }

      ctx.clearRect(0, 0, width, height);

      // Coș de colectare
      ctx.beginPath();
      ctx.arc(cos.x * width, cos.y * height, razaCos, 0, 2 * Math.PI);
      ctx.fillStyle = "rgba(255, 143, 163, 0.15)";
      ctx.fill();
      ctx.lineWidth = 3;
      ctx.strokeStyle = "#ff8fa3";
      ctx.setLineDash([6, 4]);
      ctx.stroke();

      ctx.fillStyle = "#ff8fa3";
      ctx.font = "bold 13px sans-serif";
      ctx.textAlign = "center";
      ctx.textBaseline = "middle";
      ctx.fillText("COȘ COLECTARE", cos.x * width, cos.y * height);

      // Floare virtuală
      ctx.setLineDash([]);
      ctx.beginPath();
      ctx.arc(floare.x * width, floare.y * height, razaFloare, 0, 2 * Math.PI);
      ctx.fillStyle = hand?.pinch && (Math.hypot(hand.x - floare.x, hand.y - floare.y) < 0.06 || isObjectGrabbed) ? "#ff4d6d" : "#ff8fa3";
      ctx.fill();
      ctx.lineWidth = 2;
      ctx.strokeStyle = "#ffffff";
      ctx.stroke();

      ctx.fillStyle = "#ffffff";
      ctx.font = "16px sans-serif";
      ctx.fillText("🌸", floare.x * width, floare.y * height);

      // Schelet MediaPipe
      if (hand && hand.landmarks) {
        const mirroredLandmarks = hand.landmarks.map((l: any) => ({ ...l, x: 1 - l.x }));
        drawConnectors(ctx, mirroredLandmarks, HAND_CONNECTIONS, {
          color: hand.pinch ? "#10b981" : "#ffffff",
          lineWidth: 4,
        });
      }

      animationFrameId = requestAnimationFrame(renderLoop);
    };

    renderLoop();
    return () => cancelAnimationFrame(animationFrameId);
  }, [exerciseStarted, isObjectGrabbed]);

  if (loadingUser) {
    return (
      <SakuraLayout>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '80vh', color: '#ff8fa3', fontWeight: 'bold' }}>
          Se securizează sesiunea de recuperare...
        </div>
      </SakuraLayout>
    );
  }

  return (
    <SakuraLayout>
      <div style={{ display: 'flex', padding: '40px', gap: '30px', justifyContent: 'center', minHeight: '85vh' }}>
        
        <div style={{ background: '#fff', padding: '15px', borderRadius: '20px', border: '1px solid #fceef1', boxShadow: '0 4px 12px rgba(255, 183, 197, 0.1)', position: 'relative', width: '640px', height: '480px' }}>
          <video ref={videoRef} autoPlay playsInline muted style={{ position: 'absolute', top: 15, left: 15, width: '640px', height: '480px', objectFit: 'cover', transform: 'scaleX(-1)', opacity: 0.4, borderRadius: '12px' }} />
          <canvas ref={canvasRef} width={640} height={480} style={{ position: 'absolute', top: 15, left: 15, borderRadius: '12px', zIndex: 2 }} />
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '20px', width: '280px', justifyContent: 'center' }}>
          <div style={{ textAlign: 'left', backgroundColor: '#fff', padding: '15px', borderRadius: '14px', border: '1px solid #ffdae1' }}>
            <h3 style={{ color: '#4d444a', margin: '0 0 8px 0', fontSize: '16px', fontWeight: 800 }}>Instrucțiuni:</h3>
            <p style={{ fontSize: '13px', color: '#8a7d84', margin: 0, lineHeight: '1.4' }}>
              Apasă pe <strong>Pornește Exercițiul</strong>, apoi apropie degetul mare de cel arătător peste floarea de Sakura pentru a o prinde și ghideaz-o în <strong>COȘUL DE COLECTARE</strong>.
            </p>
          </div>

          <button
            onClick={pornesteExercitiu}
            style={{ padding: '14px', fontSize: '16px', fontWeight: 'bold', backgroundColor: '#ff8fa3', color: '#fff', border: 'none', borderRadius: '12px', cursor: 'pointer', boxShadow: '0 4px 10px rgba(255, 143, 163, 0.2)' }}
          >
            {exerciseStarted && !exerciseFinished ? "Resetează" : "Pornește Exercițiul"}
          </button>

          <div style={{ backgroundColor: '#fff', padding: '20px', borderRadius: '16px', border: '1px solid #fceef1' }}>
            <h4 style={{ margin: '0 0 12px 0', color: '#4d444a', fontWeight: 700 }}>Evoluție Ședință:</h4>
            <p style={{ fontSize: '14px', color: '#8a7d84', margin: '6px 0' }}>Control Traseu: <span style={{ fontWeight: 'bold', color: isObjectGrabbed ? '#10b981' : '#e11d48' }}>{isObjectGrabbed ? "ACTIV" : "INACTIV"}</span></p>
            <p style={{ fontSize: '14px', color: '#8a7d84', margin: '6px 0' }}>Scor Evaluare: <strong>{score}%</strong></p>
          </div>

          <button
            onClick={() => { stopCameraComplet(); navigate('/dashboard'); }}
            style={{ padding: '10px', backgroundColor: '#fff', color: '#8a7d84', border: '1px solid #ffdae1', borderRadius: '10px', cursor: 'pointer', fontWeight: 'bold' }}
          >
            Renunță / Dashboard
          </button>
        </div>

      </div>
    </SakuraLayout>
  );
}