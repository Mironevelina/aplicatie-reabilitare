import { useNavigate } from 'react-router-dom';
import SakuraLayout from '../../layouts/SakuraLayout';

const PublicDashboard = () => {
  const navigate = useNavigate();

  return (
    <SakuraLayout>
      <div style={{ padding: '40px 20px', maxWidth: '1200px', margin: '0 auto', textAlign: 'center' }}>

        {/* SECȚIUNE VIDEO - „Demonstrație Exerciții” */}
        <div style={{ 
          position: 'relative', 
          width: '100%', 
          maxWidth: '900px', 
          margin: '0 auto 80px auto',
          borderRadius: '40px',
          overflow: 'hidden',
          boxShadow: '0 25px 50px rgba(255, 183, 197, 0.2)',
          border: '8px solid rgba(255, 255, 255, 0.5)'
        }}>
          {/* Am pus un video placeholder de pe YouTube despre recuperare medicală */}
          <iframe 
            width="100%" 
            height="500px" 
            src="https://www.youtube.com/embed/S2p_6_L497c" 
            title="Demonstrație Recuperare"
            frameBorder="0" 
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" 
            allowFullScreen
            style={{ display: 'block' }}
          ></iframe>
        </div>

        {/* STATISTICI PUBLICE (Social Proof) */}
        <div style={{ display: 'flex', gap: '30px', flexWrap: 'wrap', justifyContent: 'center', marginBottom: '80px' }}>
          <StatCard number="1,200+" label="Pacienți Activi" icon="🌱" />
          <StatCard number="85%" label="Rată Succes" icon="📈" />
          <StatCard number="24/7" label="Monitorizare" icon="🛡️" />
        </div>

        {/* CTA (Call to Action) */}
        <section style={{ 
          backgroundColor: 'rgba(255, 255, 255, 0.6)', 
          backdropFilter: 'blur(10px)',
          padding: '60px', 
          borderRadius: '50px',
          border: '1px solid #ffeef2'
        }}>
          <h2 style={{ fontSize: '32px', fontWeight: 900, color: '#4d444a', marginBottom: '20px' }}>
            Ești gata să începi propria ta călătorie?
          </h2>
          <button 
            onClick={() => navigate('/signup')}
            style={{ 
              padding: '20px 60px', 
              background: 'linear-gradient(135deg, #ffb7c5, #ff8fa3)', 
              color: 'white', border: 'none', borderRadius: '22px', 
              fontSize: '20px', fontWeight: 800, cursor: 'pointer',
              boxShadow: '0 15px 35px rgba(255, 183, 197, 0.4)',
              transition: '0.3s'
            }}
          >
            Creează Cont Gratuit
          </button>
        </section>
      </div>
    </SakuraLayout>
  );
};

// Componentă pentru Cardurile de Statisici
const StatCard = ({ number, label, icon }: { number: string, label: string, icon: string }) => (
  <div style={{ 
    backgroundColor: 'white', padding: '30px', borderRadius: '30px', 
    minWidth: '200px', boxShadow: '0 10px 25px rgba(0,0,0,0.02)',
    border: '1px solid #f0f9f1'
  }}>
    <div style={{ fontSize: '35px', marginBottom: '10px' }}>{icon}</div>
    <div style={{ fontSize: '28px', fontWeight: 900, color: '#4d444a' }}>{number}</div>
    <div style={{ fontSize: '15px', color: '#8a7d84', fontWeight: 600 }}>{label}</div>
  </div>
);

export default PublicDashboard;