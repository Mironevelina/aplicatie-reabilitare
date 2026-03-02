import { useNavigate } from 'react-router-dom';
import SakuraLayout from '../../layouts/SakuraLayout'; 

const Home = () => {
  const navigate = useNavigate();

  return (
    <SakuraLayout>
      {/* HERO SECTION */}
      <main style={{ width: '100%', flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '60px 20px', boxSizing: 'border-box' }}>
        <div style={{ maxWidth: '850px', textAlign: 'center', marginBottom: '80px' }}>
          <div style={{ 
            display: 'inline-block', padding: '8px 25px', backgroundColor: 'white', color: '#ff8fa3', 
            borderRadius: '30px', fontSize: '14px', fontWeight: 800, marginBottom: '25px', 
            border: '1px solid #ffeef2', boxShadow: '0 10px 30px rgba(255,183,197,0.15)' 
          }}>
            ✨ E TIMPUL SĂ ÎNFLOREȘTI DIN NOU
          </div>
          <h1 style={{ fontSize: 'clamp(40px, 8vw, 72px)', fontWeight: 950, color: '#4d444a', lineHeight: 1, margin: '0 0 35px 0', letterSpacing: '-3px' }}>
            Renaște prin <br /> 
            <span style={{ background: 'linear-gradient(to right, #ffb7c5, #a7c9b0)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>Mișcare</span>
          </h1>
          <p style={{ fontSize: '21px', color: '#8a7d84', maxWidth: '650px', margin: '0 auto 50px auto', lineHeight: 1.7, fontWeight: 500 }}>
            O experiență caldă, creată pentru a-ți reda controlul într-un ritm blând, inspirat de perfecțiunea naturii.
          </p>

          {/* BUTOANE DE ACȚIUNE - REPARATE AICI */}
          <div style={{ display: 'flex', gap: '20px', justifyContent: 'center', flexWrap: 'wrap' }}>
            <button 
              onClick={() => navigate('/signup')} 
              style={{ 
                padding: '20px 50px', 
                background: 'linear-gradient(135deg, #ffb7c5, #ff8fa3)', 
                color: 'white', border: 'none', borderRadius: '22px', 
                fontSize: '19px', fontWeight: 900, cursor: 'pointer', 
                boxShadow: '0 15px 35px rgba(255, 183, 197, 0.4)', 
                transition: '0.3s' 
              }}
            >
              Începe Călătoria
            </button>

            <button 
              onClick={() => navigate('/explore')} 
              style={{ 
                padding: '20px 50px', 
                background: 'white', 
                color: '#ff8fa3', 
                border: '2px solid #ffb7c5', 
                borderRadius: '22px', 
                fontSize: '19px', fontWeight: 800, cursor: 'pointer', 
                transition: '0.3s' 
              }}
            >
              Vezi Demo Interactiv
            </button>
          </div>
        </div>

        {/* INFO CARDS */}
        <div style={{ display: 'flex', gap: '40px', flexWrap: 'wrap', justifyContent: 'center', width: '100%', maxWidth: '1100px' }}>
          <CompactInfo icon="🌿" title="Liniște" color="#f0f9f1" />
          <CompactInfo icon="🌸" title="Progres" color="#fff1f5" />
          <CompactInfo icon="☀️" title="Claritate" color="#fff9ed" />
        </div>
      </main>

    
    </SakuraLayout>
  );
};

function CompactInfo({ icon, title, color }: { icon: string, title: string, color: string }) {
  return (
    <div style={{ 
      backgroundColor: 'rgba(255, 255, 255, 0.7)', padding: '20px 40px', borderRadius: '35px', 
      textAlign: 'center', border: `1px solid ${color}`, backdropFilter: 'blur(5px)',
      boxShadow: '0 10px 30px rgba(0,0,0,0.03)', display: 'flex', alignItems: 'center', gap: '20px' 
    }}>
      <span style={{ fontSize: '36px' }}>{icon}</span>
      <h3 style={{ fontSize: '20px', fontWeight: 900, color: '#4d444a', margin: 0 }}>{title}</h3>
    </div>
  );
}

export default Home;