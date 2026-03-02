import { useNavigate } from 'react-router-dom';
import { useState } from 'react';
import { supabase } from '../../supabaseClient';
import SakuraLayout from '../../layouts/SakuraLayout';

const Signup = () => {
  const navigate = useNavigate();
  
  const [role, setRole] = useState<'pacient' | 'doctor'>('pacient');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [nume, setNume] = useState('');
  const [prenume, setPrenume] = useState('');
  const [codParafa, setCodParafa] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSignUp = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      // 1. CREARE CONT ÎN SUPABASE AUTH
      const { data: authData, error: authError } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            full_name: `${nume} ${prenume}`,
            role: role, 
          }
        }
      });

      if (authError) throw authError;

      if (authData.user) {
        const userId = authData.user.id;
        const fullName = `${nume} ${prenume}`;

        // 2. INSERARE ÎN TABELUL SPECIFIC (pacienti sau doctori)
        if (role === 'pacient') {
          const { error: dbError } = await supabase
            .from('pacienti')
            .insert([{ id: userId, full_name: fullName }]);
          if (dbError) throw dbError;
        } else {
          const { error: dbError } = await supabase
            .from('doctori')
            .insert([{ id: userId, full_name: fullName, cod_parafa: codParafa }]);
          if (dbError) throw dbError;
        }

        alert("Cont creat cu succes!");
        navigate(role === 'pacient' ? '/dashboard' : '/medic-portal');
      }
    } catch (error: unknown) {
      // REZOLVARE ANY: Folosim unknown și verificăm dacă este o instanță de Error
      const errorMessage = error instanceof Error ? error.message : "A apărut o eroare necunoscută";
      alert("Eroare: " + errorMessage);
    } finally {
      setLoading(false);
    }
  };

  return (
    <SakuraLayout>
      <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '40px 20px' }}>
        <div style={containerStyle}>
          <div style={{ fontSize: '45px', marginBottom: '15px' }}>🌿</div>
          <h2 style={titleStyle}>Alătură-te comunității</h2>
          <p style={subtitleStyle}>Alege-ți rolul pentru a personaliza experiența.</p>

          <div style={{ display: 'flex', gap: '20px', marginBottom: '35px', justifyContent: 'center' }}>
            <div 
              onClick={() => setRole('pacient')}
              style={{ 
                ...roleCardStyle, 
                border: role === 'pacient' ? '2px solid #ffb7c5' : '2px solid transparent', 
                backgroundColor: role === 'pacient' ? '#fff0f3' : 'white' 
              }}
            >
              <span>🌱</span> <span style={roleLabelStyle}>Pacient</span>
            </div>
            <div 
              onClick={() => setRole('doctor')}
              style={{ 
                ...roleCardStyle, 
                border: role === 'doctor' ? '2px solid #a7c9b0' : '2px solid transparent', 
                backgroundColor: role === 'doctor' ? '#f0f9f1' : 'white' 
              }}
            >
              <span>👨‍⚕️</span> <span style={roleLabelStyle}>Medic</span>
            </div>
          </div>

          <form onSubmit={handleSignUp} style={formGridStyle}>
            <div style={{ gridColumn: '1 / 2' }}>
              <label style={labelStyle}>Nume</label>
              <input type="text" placeholder="Popescu" style={inputStyle} value={nume} onChange={(e)=>setNume(e.target.value)} required />
            </div>
            <div style={{ gridColumn: '2 / 3' }}>
              <label style={labelStyle}>Prenume</label>
              <input type="text" placeholder="Andrei" style={inputStyle} value={prenume} onChange={(e)=>setPrenume(e.target.value)} required />
            </div>
            
            <div style={{ gridColumn: '1 / 3' }}>
              <label style={labelStyle}>Email</label>
              <input type="email" placeholder="andrei@exemplu.com" style={inputStyle} value={email} onChange={(e)=>setEmail(e.target.value)} required />
            </div>

            {role === 'doctor' && (
              <div style={doctorFieldStyle}>
                <label style={{ ...labelStyle, color: '#5d7a64' }}>Cod Parafă / ID Medic</label>
                <input type="text" placeholder="Ex: MED-123456" style={{ ...inputStyle, border: '1px solid #a7c9b0' }} value={codParafa} onChange={(e)=>setCodParafa(e.target.value)} required={role === 'doctor'} />
              </div>
            )}

            <div style={{ gridColumn: '1 / 2' }}>
              <label style={labelStyle}>Parolă</label>
              <input type="password" placeholder="••••••••" style={inputStyle} value={password} onChange={(e)=>setPassword(e.target.value)} required />
            </div>
            <div style={{ gridColumn: '2 / 3' }}>
              <label style={labelStyle}>Confirmă</label>
              <input type="password" placeholder="••••••••" style={inputStyle} required />
            </div>

            <button 
                type="submit" 
                disabled={loading} 
                style={{ 
                    ...buttonStyle, 
                    background: role === 'pacient' ? 'linear-gradient(135deg, #ffb7c5, #ff8fa3)' : 'linear-gradient(135deg, #a7c9b0, #84a59d)' 
                }}
            >
              {loading ? 'Se procesează...' : 'Finalizează Înregistrarea'}
            </button>
          </form>

          <div style={{ marginTop: '30px', color: '#8a7d84', fontSize: '14px' }}>
            Ai deja un cont? <span onClick={() => navigate('/login')} style={{ color: '#ff8fa3', fontWeight: 700, cursor: 'pointer' }}>Loghează-te</span>
          </div>
        </div>
      </div>
    </SakuraLayout>
  );
};

// --- STILURILE (Tipizate corect pentru a evita problemele de render) ---
const containerStyle: React.CSSProperties = { width: '100%', maxWidth: '650px', backgroundColor: 'rgba(255, 255, 255, 0.75)', backdropFilter: 'blur(15px)', borderRadius: '40px', padding: '50px', border: '1px solid rgba(255, 255, 255, 0.5)', boxShadow: '0 25px 50px rgba(255, 183, 197, 0.2)', textAlign: 'center' };
const titleStyle: React.CSSProperties = { fontSize: '34px', fontWeight: 900, color: '#4d444a', marginBottom: '10px' };
const subtitleStyle: React.CSSProperties = { color: '#8a7d84', marginBottom: '30px', fontWeight: 500 };
const roleCardStyle: React.CSSProperties = { flex: 1, padding: '15px', borderRadius: '20px', cursor: 'pointer', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '8px', transition: '0.3s' };
const roleLabelStyle: React.CSSProperties = { fontWeight: 700, fontSize: '14px', color: '#4d444a' };
const formGridStyle: React.CSSProperties = { display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px', textAlign: 'left' };
const labelStyle: React.CSSProperties = { display: 'block', fontSize: '12px', fontWeight: 800, color: '#6b5e66', marginBottom: '8px', marginLeft: '12px', textTransform: 'uppercase' };
const inputStyle: React.CSSProperties = { width: '100%', padding: '14px 22px', borderRadius: '18px', border: '1px solid #ffeef2', outline: 'none', backgroundColor: 'rgba(255, 255, 255, 0.8)', color: '#4d444a', fontSize: '15px', boxSizing: 'border-box' };
const doctorFieldStyle: React.CSSProperties = { gridColumn: '1 / 3', padding: '15px', borderRadius: '20px', border: '1px dashed #a7c9b0', backgroundColor: 'rgba(167, 201, 176, 0.1)' };
const buttonStyle: React.CSSProperties = { gridColumn: '1 / 3', marginTop: '20px', padding: '18px', color: 'white', border: 'none', borderRadius: '22px', fontSize: '19px', fontWeight: 800, cursor: 'pointer', transition: '0.3s' };

export default Signup;