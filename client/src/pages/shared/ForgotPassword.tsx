import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import SakuraLayout from '../../layouts/SakuraLayout';

const ForgotPassword = () => {
  const navigate = useNavigate();
  // State pentru a simula trimiterea email-ului
  const [isSent, setIsSent] = useState(false);

  const handleReset = (e: React.FormEvent) => {
    e.preventDefault();
    // Aici s-ar face apelul la baza de date în realitate
    setIsSent(true);
  };

  return (
    <SakuraLayout>
      <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '20px' }}>
        <div style={{ 
          width: '100%', maxWidth: '450px', backgroundColor: 'rgba(255, 255, 255, 0.75)', 
          backdropFilter: 'blur(15px)', borderRadius: '40px', padding: '50px 40px', 
          border: '1px solid rgba(255, 255, 255, 0.5)', boxShadow: '0 20px 40px rgba(255, 183, 197, 0.15)',
          textAlign: 'center'
        }}>
          
          {!isSent ? (
            /* PASUL 1: FORMULARUL DE INTRODUCERE EMAIL */
            <>
              <div style={{ fontSize: '40px', marginBottom: '20px' }}>🍃</div>
              <h2 style={{ fontSize: '30px', fontWeight: 900, color: '#4d444a', marginBottom: '15px' }}>Ai uitat parola?</h2>
              <p style={{ color: '#8a7d84', marginBottom: '35px', fontWeight: 500 }}>
                Introdu adresa de email și îți vom trimite instrucțiuni pentru resetare.
              </p>

              <form onSubmit={handleReset} style={{ display: 'flex', flexDirection: 'column', gap: '25px' }}>
                <div style={{ textAlign: 'left' }}>
                  <label style={labelStyle}>Email pentru recuperare</label>
                  <input required type="email" placeholder="nume@exemplu.com" style={inputStyle} />
                </div>

                <button 
                  type="submit" // Am schimbat în submit
                  style={buttonStyle}
                >
                  Trimite link-ul de resetare
                </button>
              </form>
            </>
          ) : (
            /* PASUL 2: MESAJUL DE CONFIRMARE (Apare după click) */
            <div style={{ animation: 'popIn 0.5s ease-out' }}>
              <div style={{ fontSize: '50px', marginBottom: '20px' }}>📧</div>
              <h2 style={{ fontSize: '28px', fontWeight: 900, color: '#4d444a', marginBottom: '15px' }}>Verifică Email-ul!</h2>
              <p style={{ color: '#8a7d84', marginBottom: '30px', fontWeight: 500, lineHeight: '1.6' }}>
                Am trimis instrucțiunile la adresa ta. Te rugăm să verifici și folderul <b>Spam</b> dacă nu apare în câteva minute.
              </p>
              <button 
                onClick={() => setIsSent(false)}
                style={{ ...buttonStyle, background: '#a7c9b0' }} // Buton verde pentru "Înțeles"
              >
                Încearcă alt email
              </button>
            </div>
          )}

          <button 
            onClick={() => navigate('/login')}
            style={{ marginTop: '30px', background: 'transparent', border: 'none', color: '#ff8fa3', cursor: 'pointer', fontSize: '15px', fontWeight: 700 }}
          >
            ← Înapoi la autentificare
          </button>
        </div>
      </div>

      <style>{`
        @keyframes popIn {
          from { opacity: 0; transform: scale(0.9); }
          to { opacity: 1; transform: scale(1); }
        }
      `}</style>
    </SakuraLayout>
  );
};

// Obiecte de stil extrase pentru curățenie
const labelStyle = { display: 'block', fontSize: '13px', fontWeight: 800, color: '#6b5e66', marginBottom: '8px', marginLeft: '15px', textTransform: 'uppercase' as const };
const inputStyle = { width: '100%', padding: '16px 25px', borderRadius: '20px', border: '1px solid #ffeef2', outline: 'none', backgroundColor: 'white', fontSize: '16px', boxSizing: 'border-box' as const };
const buttonStyle = { padding: '18px', background: 'linear-gradient(135deg, #ffb7c5, #ff8fa3)', color: 'white', border: 'none', borderRadius: '20px', fontSize: '18px', fontWeight: 800, cursor: 'pointer', boxShadow: '0 10px 25px rgba(255, 183, 197, 0.4)' };

export default ForgotPassword;