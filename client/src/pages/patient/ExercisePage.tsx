import { useEffect, useRef, useState } from 'react';
// Separăm importul de valori (Hands, HAND_CONNECTIONS) de importul de tip (LandmarkList)
import { Hands, HAND_CONNECTIONS } from '@mediapipe/hands';
import type { LandmarkList } from '@mediapipe/hands'; 

import { drawConnectors } from '@mediapipe/drawing_utils';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../../supabaseClient'; 
import SakuraLayout from '../../layouts/SakuraLayout';
import type { CSSProperties } from 'react';

// --- INTERFEȚE PENTRU TYPESCRIPT ---
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

const TARGETS = [
  { x: 0.8, y: 0.3 }, { x: 0.8, y: 0.7 }, { x: 0.65, y: 0.3 }, { x: 0.65, y: 0.7 }
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
  // Rezolvată eroarea de la linia 25: Tipizat de la any la HandData | null
  const handDataRef = useRef<HandData | null>(null);
  
  const shapesRef = useRef<Shape[]>([
    { type: 'Cerc', x: 0.15, y: 0.3, active: true, color: '#ff6b81' },
    { type: 'Pătrat', x: 0.15, y: 0.7, active: true, color: '#2ed573' },
    { type: 'Triunghi', x: 0.3, y: 0.3, active: true, color: '#a29bfe' },
    { type: 'Romb', x: 0.3, y: 0.7, active: true, color: '#ffa502' }
  ]);

  const drawGeometry = (ctx: CanvasRenderingContext2D, x: number, y: number, s: number, type: string) => {
    ctx.beginPath();
    if (type === 'Cerc') ctx.arc(x, y, s, 0, 2 * Math.PI);
    else if (type === 'Pătrat') ctx.rect(x - s, y - s, s * 2, s * 2);
    else if (type === 'Triunghi') {
      ctx.moveTo(x, y - s); ctx.lineTo(x - s, y + s); ctx.lineTo(x + s, y + s); ctx.closePath();
    } else if (type === 'Romb') {
      ctx.moveTo(x, y - s); ctx.lineTo(x + s, y); ctx.lineTo(x, y + s); ctx.lineTo(x - s, y); ctx.closePath();
    }
  };

  const handleFinish = async () => {
    setIsSaving(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();

      if (!user) throw new Error("Nu am găsit utilizatorul logat!");

      const { error } = await supabase
        .from('progres_pacienti')
        .insert([
          { 
            id_pacient: user.id,
            scor: scoreRef.current, 
            tip_exercitiu: 'Coordonare Forme',
            durata_secunde: 60 
          }
        ]);

      if (error) throw error;

      console.log("Salvare reușită!");
      navigate('/felicitari', { state: { finalScore: scoreRef.current } });
    } catch (error: unknown) {
      // Rezolvată eroarea de la linia 69: Schimbat din any în unknown + tipizare eroare
      const errorMessage = error instanceof Error ? error.message : "Eroare necunoscută";
      console.error("Eroare la salvare:", errorMessage);
      navigate('/felicitari', { state: { finalScore: scoreRef.current } });
    } finally {
      setIsSaving(false);
    }
  };

  useEffect(() => {
    let active = true;
    let hands: Hands;

    const init = async () => {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({ video: { width: 640, height: 480 } });
        if (videoRef.current) videoRef.current.srcObject = stream;
        streamRef.current = stream;

        hands = new Hands({ locateFile: (file) => `/mediapipe/${file}` });
        hands.setOptions({ maxNumHands: 1, modelComplexity: 0, minDetectionConfidence: 0.5, minTrackingConfidence: 0.5 });

        hands.onResults((results) => {
          if (!active) return;
          setIsReady(true);
          if (results.multiHandLandmarks?.[0]) {
            const landmarks = results.multiHandLandmarks[0];
            const dist = Math.hypot(landmarks[4].x - landmarks[8].x, landmarks[4].y - landmarks[8].y);
            handDataRef.current = {
              pinch: dist < 0.06,
              x: 1 - (landmarks[4].x + landmarks[8].x) / 2,
              y: (landmarks[4].y + landmarks[8].y) / 2,
              landmarks: landmarks
            };
          } else { handDataRef.current = null; }
        });

        const process = async () => {
          if (active && videoRef.current?.readyState === 4) await hands.send({ image: videoRef.current });
          if (active) requestAnimationFrame(process);
        };
        process();
      } catch (e) { console.error(e); }
    };

    init();
    return () => { 
      active = false; 
      hands?.close(); 
      streamRef.current?.getTracks().forEach(t => t.stop()); 
    };
  }, []);

  useEffect(() => {
    const canvas = canvasRef.current;
    const ctx = canvas?.getContext('2d');
    let raf: number;

    const render = () => {
      if (!ctx || !canvas) return;
      const hand = handDataRef.current;
      const s = 0.08 * canvas.width;

      if (hand) {
        shapesRef.current.forEach((shape, idx) => {
          if (!shape.active) return;
          const dist = Math.hypot(hand.x - shape.x, hand.y - shape.y);
          if (dist < 0.08 && hand.pinch && isGrabbed === null) setIsGrabbed(idx);
          if (isGrabbed === idx) {
            if (!hand.pinch) setIsGrabbed(null);
            else {
              shape.x = hand.x; shape.y = hand.y;
              if (Math.hypot(shape.x - TARGETS[idx].x, shape.y - TARGETS[idx].y) < 0.06) {
                shape.active = false; setIsGrabbed(null);
                scoreRef.current += 25; setScore(scoreRef.current);
              }
            }
          }
        });
      }

      ctx.clearRect(0, 0, canvas.width, canvas.height);
      TARGETS.forEach((t, index) => {
        if (!shapesRef.current[index].active) return;
        ctx.setLineDash([5, 5]); ctx.strokeStyle = 'rgba(0,0,0,0.1)';
        drawGeometry(ctx, t.x * canvas.width, t.y * canvas.height, s, shapesRef.current[index].type);
        ctx.stroke();
      });

      shapesRef.current.forEach((sh, idx) => {
        if (!sh.active) return;
        ctx.setLineDash([]); ctx.fillStyle = sh.color; ctx.beginPath();
        drawGeometry(ctx, sh.x * canvas.width, sh.y * canvas.height, s, sh.type);
        ctx.fill();
        if (isGrabbed === idx) {
            ctx.strokeStyle = "white"; ctx.lineWidth = 3; ctx.stroke();
        }
      });

      if (hand) {
        // Rezolvată eroarea de la linia 169: Schimbat any cu interfața corectă
        const mirrored = hand.landmarks.map((l) => ({ ...l, x: 1 - l.x }));
        drawConnectors(ctx, mirrored, HAND_CONNECTIONS, { color: hand.pinch ? '#2ed573' : '#ffb7c5', lineWidth: 4 });
      }
      raf = requestAnimationFrame(render);
    };
    render();
    return () => cancelAnimationFrame(raf);
  }, [isGrabbed]);

  return (
    <SakuraLayout>
      <div style={fullPageWrapper}>
        <div style={headerContainer}>
          <div style={scoreBadge}>Scor: {score}%</div>
          <div style={statusText}>{isReady ? '🌸 Senzori Activi' : '⏳ Pregătire cameră...'}</div>
        </div>

        <div style={mainExerciseArea}>
          <video ref={videoRef} autoPlay playsInline muted style={videoStyles} />
          <canvas ref={canvasRef} width="800" height="600" style={canvasStyles} />
          
          {!isReady && (
            <div style={loaderOverlay}>
              <div className="spinner-sakura" />
              <p style={{marginTop: '15px', color: '#ff6b81'}}>Se conectează senzorii locali...</p>
            </div>
          )}
        </div>

        <div style={buttonGroup}>
          <button onClick={() => navigate('/dashboard')} style={btnCancel}>Anulează</button>
          <button 
            onClick={handleFinish} 
            style={btnFinish} 
            disabled={!isReady || isSaving}
          >
            {isSaving ? 'Se salvează...' : 'Finalizează'}
          </button>
        </div>
      </div>
    </SakuraLayout>
  );
}

const fullPageWrapper: CSSProperties = { display: 'flex', flexDirection: 'column', alignItems: 'center', width: '100%', padding: '20px' };
const headerContainer: CSSProperties = { width: '100%', maxWidth: '800px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' };
const mainExerciseArea: CSSProperties = { position: 'relative', width: '800px', height: '600px', background: '#000', borderRadius: '30px', overflow: 'hidden', boxShadow: '0 20px 50px rgba(0,0,0,0.1)', border: '10px solid white' };
const videoStyles: CSSProperties = { position: 'absolute', width: '100%', height: '100%', objectFit: 'cover', transform: 'scaleX(-1)' };
const canvasStyles: CSSProperties = { position: 'absolute', width: '100%', height: '100%', zIndex: 5 };
const loaderOverlay: CSSProperties = { position: 'absolute', inset: 0, background: 'white', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', zIndex: 10 };
const scoreBadge: CSSProperties = { background: 'white', padding: '12px 30px', borderRadius: '20px', color: '#ff6b81', fontWeight: 900, fontSize: '20px', boxShadow: '0 4px 10px rgba(0,0,0,0.05)' };
const statusText: CSSProperties = { color: '#ff6b81', fontWeight: 600 };
const buttonGroup: CSSProperties = { marginTop: '30px', display: 'flex', gap: '20px' };
const btnFinish: CSSProperties = { padding: '15px 40px', background: '#ff6b81', color: 'white', border: 'none', borderRadius: '25px', fontWeight: 800, cursor: 'pointer' };
const btnCancel: CSSProperties = { padding: '15px 30px', background: 'transparent', color: '#888', border: '2px solid #ddd', borderRadius: '25px', cursor: 'pointer' };