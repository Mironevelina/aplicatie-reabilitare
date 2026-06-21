import React, { useRef, useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../../supabaseClient';
import SakuraLayout from '../../layouts/SakuraLayout';

// Matricea Labirintului Sakura
const MAZE_GRID = [
  [0, 0, 1, 0, 0, 0, 1, 0, 0, 0],
  [1, 0, 1, 0, 1, 0, 1, 1, 1, 0],
  [1, 0, 0, 0, 1, 0, 0, 0, 1, 0],
  [1, 1, 1, 1, 1, 1, 1, 0, 1, 0],
  [0, 0, 0, 0, 0, 0, 1, 0, 1, 0],
  [0, 1, 1, 1, 1, 0, 1, 0, 1, 0],
  [0, 1, 0, 0, 1, 0, 0, 0, 0, 0],
  [0, 1, 0, 1, 1, 1, 1, 1, 1, 0],
  [0, 0, 0, 1, 0, 0, 0, 0, 1, 0],
  [1, 1, 0, 0, 0, 1, 1, 0, 0, 2], 
];

function MazeExercisePage() {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const navigate = useNavigate();

  // Stări pacient și control
  const [idPacient, setIdPacient] = useState<string>("");
  const [loadingUser, setLoadingUser] = useState<boolean>(true);
  const [isObjectGrabbed, setIsObjectGrabbed] = useState(false);
  const [collisions, setCollisions] = useState(0);
  const [exerciseStarted, setExerciseStarted] = useState(false);
  const [exerciseFinished, setExerciseFinished] = useState(false);
  const [startTime, setStartTime] = useState<number | null>(null);
  const [score, setScore] = useState(100);

  // Setări cercul de control (Obiectul virtual)
  const [objectPos, setObjectPos] = useState({ x: 25, y: 25 });
  const objectRadius = 12;
  const cellSize = 50; 

  // Preluare securizată a ID-ului de utilizator direct la montarea paginii
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

  const checkCollision = (x: number, y: number): boolean => {
    const cellX = Math.floor(x / cellSize);
    const cellY = Math.floor(y / cellSize);
    if (cellX < 0 || cellX >= 10 || cellY < 0 || cellY >= 10) return true;
    return MAZE_GRID[cellY][cellX] === 1;
  };

  const checkWin = (x: number, y: number): boolean => {
    const cellX = Math.floor(x / cellSize);
    const cellY = Math.floor(y / cellSize);
    return MAZE_GRID[cellY]?.[cellX] === 2;
  };

  const salveazaSesiune = async () => {
    setExerciseFinished(true);
    const durata = startTime ? Math.floor((Date.now() - startTime) / 1000) : 0;

    let currentUserId = idPacient;
    if (!currentUserId) {
      const { data: { session } } = await supabase.auth.getSession();
      currentUserId = session?.user?.id || "";
    }

    if (!currentUserId) {
      alert("Eroare: Utilizatorul nu este autentificat.");
      return;
    }

    try {
      const dataNoua = {
        id_pacient: currentUserId,
        tip_exercitiu: "Urmărire Traseu Labirint",
        scor: Math.round(score), 
        durata_secunde: durata, // Adăugat pentru a asigura funcționarea feedback-ului din ecranul de felicitări
        data_finalizare: new Date()
      };

      const { error } = await supabase
        .from('progres_pacienti')
        .insert([dataNoua]);

      if (error) throw error;

      // ALINIERE CRITICĂ: Trimitem cheia 'finalScore' cerută de Congratulations.tsx
      navigate('/felicitari', { state: { finalScore: Math.round(score) } });
    } catch (error: any) {
      console.error("Eroare la salvarea în Supabase:", error);
      navigate('/felicitari', { state: { finalScore: Math.round(score) } });
    }
  };

  const handleMouseMove = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (!exerciseStarted || exerciseFinished) return;
    const canvas = canvasRef.current;
    if (!canvas) return;

    const rect = canvas.getBoundingClientRect();
    const mouseX = e.clientX - rect.left;
    const mouseY = e.clientY - rect.top;

    const dist = Math.sqrt(Math.pow(mouseX - objectPos.x, 2) + Math.pow(mouseY - objectPos.y, 2));

    if (dist < objectRadius + 25 || isObjectGrabbed) {
      setIsObjectGrabbed(true);
      if (!checkCollision(mouseX, mouseY)) {
        setObjectPos({ x: mouseX, y: mouseY });
      } else {
        setCollisions(prev => prev + 1);
        setScore(prev => Math.max(0, prev - 1));
      }

      if (checkWin(mouseX, mouseY)) {
        salveazaSesiune();
      }
    }
  };

  const pornesteExercitiu = () => {
    setExerciseStarted(true);
    setExerciseFinished(false);
    setCollisions(0);
    setScore(100);
    setObjectPos({ x: 25, y: 25 }); 
    setStartTime(Date.now());
  };

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    ctx.clearRect(0, 0, 500, 500);

    MAZE_GRID.forEach((row, y) => {
      row.forEach((cell, x) => {
        if (cell === 1) {
          ctx.fillStyle = '#4d444a'; 
          ctx.fillRect(x * cellSize, y * cellSize, cellSize, cellSize);
        } else if (cell === 2) {
          ctx.fillStyle = '#10b981'; 
          ctx.fillRect(x * cellSize, y * cellSize, cellSize, cellSize);
          ctx.fillStyle = '#ffffff';
          ctx.font = 'bold 10px sans-serif';
          ctx.fillText("SOSIRE", x * cellSize + 5, y * cellSize + 28);
        } else {
          ctx.fillStyle = '#fff5f7'; 
          ctx.fillRect(x * cellSize, y * cellSize, cellSize, cellSize);
        }
        ctx.strokeStyle = '#ffdae1';
        ctx.strokeRect(x * cellSize, y * cellSize, cellSize, cellSize);
      });
    });

    ctx.beginPath();
    ctx.arc(objectPos.x, objectPos.y, objectRadius, 0, 2 * Math.PI);
    ctx.fillStyle = isObjectGrabbed ? '#ff8fa3' : '#4f46e5';
    ctx.fill();
    ctx.lineWidth = 2;
    ctx.strokeStyle = '#ffffff';
    ctx.stroke();
  }, [objectPos, isObjectGrabbed]);

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
      <div style={{ display: 'flex', padding: '40px', gap: '30px', justifyContent: 'center', background: '#fffcfd', minHeight: '85vh' }}>
        <div style={{ background: '#fff', padding: '15px', borderRadius: '20px', border: '1px solid #fceef1', boxShadow: '0 4px 12px rgba(255, 183, 197, 0.1)' }}>
          <canvas
            ref={canvasRef}
            width={500}
            height={500}
            onMouseMove={handleMouseMove}
            onMouseLeave={() => setIsObjectGrabbed(false)}
            style={{ borderRadius: '12px', cursor: isObjectGrabbed ? 'grabbing' : 'grab', background: '#fff' }}
          />
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '20px', width: '280px', justifyContent: 'center' }}>
          <div style={{ textAlign: 'left', backgroundColor: '#fff', padding: '15px', borderRadius: '14px', border: '1px solid #ffdae1' }}>
            <h3 style={{ color: '#4d444a', margin: '0 0 8px 0', fontSize: '16px', fontWeight: 800 }}>Instrucțiuni:</h3>
            <p style={{ fontSize: '13px', color: '#8a7d84', margin: 0, lineHeight: '1.4' }}>
              Apasă pe <strong>Pornește Exercițiul</strong>, apoi prinde cercul albastru cu mouse-ul și ghidează-l cu atenție până la căsuța verde <strong>SOSIRE</strong>, evitând pereții închiși la culoare.
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
            <p style={{ fontSize: '14px', color: '#8a7d84', margin: '6px 0' }}>Atingeri perete: <span style={{ color: '#e11d48', fontWeight: 'bold' }}>{collisions}</span></p>
            <p style={{ fontSize: '14px', color: '#8a7d84', margin: '6px 0' }}>Scor Evaluare: <strong>{score}%</strong></p>
          </div>

          <button
            onClick={() => navigate('/dashboard')}
            style={{ padding: '10px', backgroundColor: '#fff', color: '#8a7d84', border: '1px solid #ffdae1', borderRadius: '10px', cursor: 'pointer', fontWeight: 'bold' }}
          >
            Renunță / Dashboard
          </button>
        </div>
      </div>
    </SakuraLayout>
  );
}

export { MazeExercisePage };
export default MazeExercisePage;