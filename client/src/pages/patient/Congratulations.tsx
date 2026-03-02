import { useEffect, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { supabase } from '../../supabaseClient';
import confetti from 'canvas-confetti';
import SakuraLayout from '../../layouts/SakuraLayout';
import type { CSSProperties } from 'react';

interface SessionData {
  duration_seconds: number;
}

export default function Congratulations() {
  const location = useLocation();
  const navigate = useNavigate();
  
  // Preluăm scorul trimis din pagina de exercițiu
  const finalScore = location.state?.finalScore || 0;
  
  const [feedback, setFeedback] = useState<string>("Se analizează progresul tău...");
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
        colors: ['#ffb7c5', '#ff8fa3', '#ffffff']
      });
      confetti({
        particleCount: 2,
        angle: 120,
        spread: 55,
        origin: { x: 1 },
        colors: ['#ffb7c5', '#ff8fa3', '#ffffff']
      });

      if (Date.now() < end) {
        requestAnimationFrame(frame);
      }
    };
    frame();

    async function checkEvolution() {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      // Preluăm ultimele 2 sesiuni pentru comparare
      const { data } = await supabase.from('sessions')
        .select('duration_seconds')
        .eq('patient_id', user.id)
        .order('created_at', { ascending: false })
        .limit(2);

      if (data && data.length > 1) {
        const currentSession = data[0] as SessionData;
        const previousSession = data[1] as SessionData;
        
        // Dacă sesiunea curentă e mai scurtă decât precedenta, e progres
        const diff = previousSession.duration_seconds - currentSession.duration_seconds;
        setIsProgress(diff > 0);
        setFeedback(diff > 0 
          ? `🌸 Progres minunat! Ai fost mai rapid cu ${diff}s.` 
          : `✨ Menține acest ritm constant pentru rezultate optime.`);
      } else {
        setFeedback("Prima sesiune salvată cu succes! Continuă tot așa.");
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
          
          <div style={{
            ...feedbackBoxStyle,
            borderColor: isProgress === true ? '#a7c9b0' : '#ffb7c5'
          }}>
            <p style={{ 
              color: isProgress === true ? '#7fa98b' : '#ff8fa3', 
              fontSize: '16px', 
              fontWeight: 800, 
              margin: 0 
            }}>
              {feedback}
            </p>
          </div>
          
          <div style={buttonGroupStyle}>
            <button 
              onClick={() => navigate('/progres')} 
              style={primaryBtnStyle}
            >
              📊 VEZI EVOLUȚIA COMPLETĂ
            </button>
            
            <button 
              onClick={() => navigate('/dashboard')} 
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

// --- STILURI SAKURA ---
const containerStyle: CSSProperties = {
  height: '80vh',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  padding: '20px'
};

const cardStyle: CSSProperties = {
  backgroundColor: 'rgba(255, 255, 255, 0.9)',
  backdropFilter: 'blur(20px)',
  padding: '50px',
  borderRadius: '40px',
  textAlign: 'center',
  border: '1px solid white',
  width: '100%',
  maxWidth: '480px',
  boxShadow: '0 20px 50px rgba(255, 183, 197, 0.2)'
};

const iconStyle: CSSProperties = {
  fontSize: '70px',
  marginBottom: '10px',
  filter: 'drop-shadow(0 5px 10px rgba(255, 143, 163, 0.3))'
};

const titleStyle: CSSProperties = {
  fontSize: '36px',
  fontWeight: 900,
  marginBottom: '5px',
  color: '#4d444a'
};

const subtitleStyle: CSSProperties = {
  fontSize: '16px',
  color: '#8a7d84',
  marginBottom: '10px',
  fontWeight: 600
};

const scoreContainerStyle: CSSProperties = {
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  marginBottom: '30px'
};

const scoreTextStyle: CSSProperties = {
  fontSize: '96px',
  fontWeight: 900,
  color: '#ff8fa3',
  lineHeight: '1'
};

const percentStyle: CSSProperties = {
  fontSize: '32px',
  fontWeight: 900,
  color: '#ffb7c5',
  marginLeft: '5px'
};

const feedbackBoxStyle: CSSProperties = {
  backgroundColor: '#fff9fa',
  padding: '20px',
  borderRadius: '24px',
  marginBottom: '35px',
  border: '2px solid'
};

const buttonGroupStyle: CSSProperties = {
  display: 'flex',
  flexDirection: 'column',
  gap: '15px'
};

const primaryBtnStyle: CSSProperties = {
  padding: '18px',
  backgroundColor: '#ff8fa3',
  color: 'white',
  border: 'none',
  borderRadius: '20px',
  fontWeight: 900,
  fontSize: '16px',
  cursor: 'pointer',
  boxShadow: '0 10px 20px rgba(255, 143, 163, 0.3)',
  transition: '0.3s'
};

const secondaryBtnStyle: CSSProperties = {
  padding: '15px',
  backgroundColor: 'transparent',
  color: '#8a7d84',
  border: '2px solid #ffeef2',
  borderRadius: '20px',
  fontWeight: 700,
  cursor: 'pointer'
};