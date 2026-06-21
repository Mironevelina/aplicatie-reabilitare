import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import SakuraLayout from '../../layouts/SakuraLayout'; 
import type { CSSProperties } from 'react';

const Home = () => {
  const navigate = useNavigate();

  // Stări pentru efectele de hover pe butoane
  const [hoverBtn1, setHoverBtn1] = useState(false);
  const [hoverBtn2, setHoverBtn2] = useState(false);

  return (
    <SakuraLayout>
      {/* HERO SECTION */}
      <main style={mainHeroContainer}>
        <div style={{ maxWidth: '850px', textAlign: 'center', marginBottom: '70px' }}>
          
          {/* BADGE PRINCIPAL - Tehnic și profesional */}
          <div style={topBadgeStyle}>
             PLATFORMĂ DIGITALĂ PENTRU KINETOTERAPIE
          </div>
          
          {/* TITLU - Schimbat din metafore în scopul real al aplicației */}
          <h1 style={mainTitleStyle}>
            Renaște prin <span style={gradientTextStyle}>Mișcare</span>
          </h1>
          
          {/* SUBTITLU - Clar, medical, fără formulări pompoase de tip AI */}
          <p style={mainSubtitleStyle}>
            Sistem interactiv de reabilitare a membrelor superioare. Exerciții asistate și monitorizare clinică direct de la domiciliu.
          </p>

          {/* BUTOANE DE ACȚIUNE CU HOVER DINAMIC */}
          <div style={{ display: 'flex', gap: '20px', justifyContent: 'center', flexWrap: 'wrap' }}>
            <button 
              onClick={() => navigate('/signup')} 
              onMouseEnter={() => setHoverBtn1(true)}
              onMouseLeave={() => setHoverBtn1(false)}
              style={{ 
                ...primaryBtnStyle,
                transform: hoverBtn1 ? 'translateY(-3px)' : 'none',
                boxShadow: hoverBtn1 ? '0 15px 30px rgba(255, 143, 163, 0.4)' : '0 10px 25px rgba(255, 183, 197, 0.25)'
              }}
            >
              Creează cont 
            </button>

            <button 
              onClick={() => navigate('/explore')} 
              onMouseEnter={() => setHoverBtn2(true)}
              onMouseLeave={() => setHoverBtn2(false)}
              style={{ 
                ...secondaryBtnStyle,
                backgroundColor: hoverBtn2 ? '#ff8fa3' : 'white',
                color: hoverBtn2 ? 'white' : '#ff8fa3',
                transform: hoverBtn2 ? 'translateY(-3px)' : 'none',
                boxShadow: hoverBtn2 ? '0 15px 30px rgba(255, 143, 163, 0.2)' : 'none'
              }}
            >
              Explorează programele
            </button>
          </div>
        </div>

        {/* INFO CARDS - Schimbate cu pilonii tehnici/clinici ai licenței tale */}
        <div style={infoCardsGrid}>
          <CompactInfo icon="🩺" title="Monitorizare Clinică" desc="Date transmise direct medicului" color="#f0f9f1" />
          <CompactInfo icon="📷" title="Asistență Video" desc="Procesare locală prin camera web" color="#fff1f5" />
          <CompactInfo icon="📊" title="Grafice Evolutive" desc="Calcul statistic al progresului" color="#fff9ed" />
        </div>
      </main>
    </SakuraLayout>
  );
};

// --- COMPONENTA PENTRU CARDURILE INFORMATIVE (ÎMBUNĂTĂȚITĂ CĂRĂ CARACTERISTICI) ---
interface CompactInfoProps {
  icon: string;
  title: string;
  desc: string;
  color: string;
}

function CompactInfo({ icon, title, desc, color }: CompactInfoProps) {
  return (
    <div style={{ 
      backgroundColor: 'rgba(255, 255, 255, 0.85)', 
      padding: '25px 35px', 
      borderRadius: '30px', 
      border: `1px solid ${color}`, 
      boxShadow: '0 10px 30px rgba(255, 183, 197, 0.05)', 
      display: 'flex', 
      alignItems: 'center', 
      gap: '20px',
      flex: '1',
      minWidth: '280px',
      textAlign: 'left'
    }}>
      <span style={{ fontSize: '38px' }}>{icon}</span>
      <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
        <h3 style={{ fontSize: '17px', fontWeight: 800, color: '#4d444a', margin: 0 }}>{title}</h3>
        <p style={{ fontSize: '13px', color: '#8a7d84', margin: 0, lineHeight: 1.4 }}>{desc}</p>
      </div>
    </div>
  );
}

// --- CONTEXT STILURI CURATE ---

const mainHeroContainer: CSSProperties = {
  width: '100%', 
  flex: 1, 
  display: 'flex', 
  flexDirection: 'column', 
  alignItems: 'center', 
  justifyContent: 'center', 
  padding: '40px 20px', 
  boxSizing: 'border-box'
};

const topBadgeStyle: CSSProperties = { 
  display: 'inline-block', 
  padding: '8px 22px', 
  backgroundColor: 'white', 
  color: '#ff8fa3', 
  borderRadius: '30px', 
  fontSize: '13px', 
  fontWeight: 800, 
  marginBottom: '30px', 
  border: '1px solid #ffeef2', 
  boxShadow: '0 8px 20px rgba(255,183,197,0.12)',
  letterSpacing: '0.05em'
};

const mainTitleStyle: CSSProperties = { 
  fontSize: 'clamp(36px, 7vw, 64px)', 
  fontWeight: 900, 
  color: '#4d444a', 
  lineHeight: 1.1, 
  margin: '0 0 30px 0', 
  letterSpacing: '-2px' 
};

const gradientTextStyle: CSSProperties = { 
  background: 'linear-gradient(to right, #ffb7c5, #a7c9b0)', 
  WebkitBackgroundClip: 'text', 
  WebkitTextFillColor: 'transparent' 
};

const mainSubtitleStyle: CSSProperties = { 
  fontSize: '19px', 
  color: '#8a7d84', 
  maxWidth: '700px', 
  margin: '0 auto 45px auto', 
  lineHeight: 1.6, 
  fontWeight: 500 
};

const primaryBtnStyle: CSSProperties = { 
  padding: '18px 45px', 
  background: 'linear-gradient(135deg, #ffb7c5, #ff8fa3)', 
  color: 'white', 
  border: 'none', 
  borderRadius: '20px', 
  fontSize: '17px', 
  fontWeight: 800, 
  cursor: 'pointer', 
  transition: 'transform 0.3s cubic-bezier(0.175, 0.885, 0.32, 1.275), box-shadow 0.3s ease' 
};

const secondaryBtnStyle: CSSProperties = { 
  padding: '18px 45px', 
  backgroundColor: 'white', 
  color: '#ff8fa3', 
  border: '2px solid #ffb7c5', 
  borderRadius: '20px', 
  fontSize: '17px', 
  fontWeight: 800, 
  cursor: 'pointer', 
  transition: 'all 0.3s cubic-bezier(0.175, 0.885, 0.32, 1.275)' 
};

const infoCardsGrid: CSSProperties = { 
  display: 'flex', 
  gap: '25px', 
  flexWrap: 'wrap', 
  justifyContent: 'center', 
  width: '100%', 
  maxWidth: '1100px',
  marginTop: '20px'
};

export default Home;