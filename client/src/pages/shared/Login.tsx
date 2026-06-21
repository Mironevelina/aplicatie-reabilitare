import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../../supabaseClient';
import SakuraLayout from '../../layouts/SakuraLayout';
import type { CSSProperties } from 'react';

const Login = () => {
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      // 1. Autentificare prin Supabase Auth
      const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (authError) throw authError;

      const user = authData.user;
      if (!user) throw new Error("Utilizatorul nu a putut fi găsit.");

      console.log("Autentificare reușită pentru UUID:", user.id);

      // 2. VERIFICARE ROL: Căutăm succesiv în tabelele de specialitate
      
      // Verificăm dacă este ADMIN
      const { data: adminData } = await supabase
        .from('admini')
        .select('id')
        .eq('id', user.id)
        .maybeSingle(); // Folosim maybeSingle pentru a nu genera eroare dacă nu există

      if (adminData) {
        console.log("Rol detectat: Administrator");
        navigate('/admin');
        return;
      }

      // Verificăm dacă este DOCTOR
      const { data: doctorData } = await supabase
        .from('doctori')
        .select('id')
        .eq('id', user.id)
        .maybeSingle();

      if (doctorData) {
        console.log("Rol detectat: Medic");
        navigate('/doctor-dashboard');
        return;
      }

      // 3. Redirecționare implicită către PACIENT
      // Dacă nu a fost găsit în tabelele de mai sus, înseamnă că e pacient
      console.log("Rol detectat: Pacient");
      navigate('/dashboard');

    } catch (err: unknown) {
      const error = err as Error;
      alert("Eroare la autentificare: " + error.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <SakuraLayout>
      <div style={containerStyle}>
        <div style={cardStyle}>
          <div style={{ fontSize: '50px', marginBottom: '10px' }}>🌸</div>
          <h2 style={{ fontSize: '32px', fontWeight: 900, color: '#4d444a', margin: '0 0 10px 0' }}>SakuraMotion</h2>
          <p style={{ color: '#8a7d84', marginBottom: '35px' }}>Conectare la contul tău</p>

          <form onSubmit={handleLogin} style={formStyle}>
            <input 
              type="email" 
              required 
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="Adresă Email" 
              style={inputStyle} 
            />
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              <input 
                type="password" 
                required 
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Parolă" 
                style={inputStyle} 
              />
              <div style={{ textAlign: 'right', paddingRight: '5px' }}>
                <span onClick={() => navigate('/forgot-password')} style={forgotPassBtnStyle}>
                  Ai uitat parola?
                </span>
              </div>
            </div>
            <button type="submit" disabled={loading} style={buttonStyle}>
              {loading ? 'Se verifică...' : 'Autentificare'}
            </button>
          </form>

          <div style={footerTextStyle}>
            Nu ai un cont? {' '}
            <span onClick={() => navigate('/signup')} style={linkActionStyle}>Înregistrează-te</span>
          </div>
        </div>
      </div>
    </SakuraLayout>
  );
};

// --- STILURI ---
const containerStyle: CSSProperties = { minHeight: '80vh', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '20px' };
const cardStyle: CSSProperties = { width: '100%', maxWidth: '420px', backgroundColor: 'rgba(255, 255, 255, 0.9)', padding: '40px', borderRadius: '40px', textAlign: 'center', boxShadow: '0 20px 60px rgba(255, 183, 197, 0.2)', backdropFilter: 'blur(10px)', border: '1px solid rgba(255, 255, 255, 0.5)' };
const formStyle: CSSProperties = { display: 'flex', flexDirection: 'column', gap: '18px' };
const inputStyle: CSSProperties = { width: '100%', padding: '16px 20px', borderRadius: '18px', border: '1px solid #ffeef2', outline: 'none', boxSizing: 'border-box', fontSize: '15px', backgroundColor: '#fffcfd' };
const buttonStyle: CSSProperties = { padding: '16px', background: 'linear-gradient(135deg, #ffb7c5, #ff8fa3)', color: 'white', border: 'none', borderRadius: '18px', fontSize: '16px', fontWeight: 800, cursor: 'pointer', marginTop: '10px' };
const forgotPassBtnStyle: CSSProperties = { color: '#ff8fa3', fontSize: '13px', fontWeight: '700', cursor: 'pointer' };
const footerTextStyle: CSSProperties = { marginTop: '30px', color: '#8a7d84', fontSize: '14px' };
const linkActionStyle: CSSProperties = { color: '#ff8fa3', fontWeight: 800, cursor: 'pointer', marginLeft: '5px' };

export default Login;