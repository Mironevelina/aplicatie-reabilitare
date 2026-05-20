import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { supabase } from '../supabaseClient';
import type { User } from '@supabase/supabase-js';

interface Profile {
  id: string;
  full_name: string | null;
  role: 'admin' | 'doctor' | 'pacient';
}

const Header = () => {
  const navigate = useNavigate();
  const location = useLocation();

  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);

  const detectRoleAndFetchProfile = useCallback(async (userId: string) => {
    try {
      const { data: admin } = await supabase.from('admini').select('full_name').eq('id', userId).maybeSingle();
      if (admin) {
        setProfile({ id: userId, full_name: admin.full_name, role: 'admin' });
        return;
      }
      const { data: doctor } = await supabase.from('doctori').select('full_name').eq('id', userId).maybeSingle();
      if (doctor) {
        setProfile({ id: userId, full_name: doctor.full_name, role: 'doctor' });
        return;
      }
      const { data: pacient } = await supabase.from('pacienti').select('full_name').eq('id', userId).maybeSingle();
      setProfile({ id: userId, full_name: pacient?.full_name || 'Utilizator', role: 'pacient' });
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    const initAuth = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      const currentUser = session?.user ?? null;
      setUser(currentUser);
      if (currentUser) detectRoleAndFetchProfile(currentUser.id);
      else setLoading(false);
    };
    initAuth();

    const { data: { subscription: authSub } } = supabase.auth.onAuthStateChange((_event, session) => {
      const currentUser = session?.user ?? null;
      setUser(currentUser);
      if (currentUser) detectRoleAndFetchProfile(currentUser.id);
      else { setProfile(null); setLoading(false); }
    });

    return () => authSub.unsubscribe();
  }, [detectRoleAndFetchProfile]);

  if (['/login', '/signup', '/forgot-password'].includes(location.pathname)) return null;

  return (
    <header style={headerStyle}>
      <div style={logoSection} onClick={() => navigate('/')}>
        <span style={{ fontSize: '24px' }}>🌸</span>
        <span style={titleStyle}>SakuraMotion</span>
      </div>

      <nav style={navStyle}>
        <span style={linkStyle} onClick={() => navigate('/')}>Acasa</span>
        <span style={linkStyle} onClick={() => navigate('/contact')}>Contact</span>

        {!loading && (
          <>
            {user ? (
              <div style={{ display: 'flex', alignItems: 'center', gap: '20px' }}>
                
                {/* AM ELIMINAT CLOPOȚELUL DE NOTIFICĂRI CHAT AICI */}

                {profile?.role === 'admin' ? (
                  <button style={adminBtn} onClick={() => navigate('/admin')}>Panou Admin</button>
                ) : (
                  <div 
                    style={{...profileCircle, backgroundColor: profile?.role === 'doctor' ? '#a7c9b0' : '#ffb7c5'}} 
                    onClick={() => navigate('/profil')}
                  >
                    {profile?.full_name?.[0]?.toUpperCase() || 'U'}
                  </div>
                )}
                
                <button style={logoutBtn} onClick={() => supabase.auth.signOut().then(() => navigate('/'))}>Ieșire</button>
              </div>
            ) : (
              <button style={authBtn} onClick={() => navigate('/login')}>Autentificare</button>
            )}
          </>
        )}
      </nav>
    </header>
  );
};

// --- STILURI (curățate de badge/notificări) ---
const headerStyle: React.CSSProperties = { display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '12px 5%', backgroundColor: 'rgba(255, 255, 255, 0.9)', backdropFilter: 'blur(10px)', borderBottom: '1px solid rgba(255, 183, 197, 0.3)', position: 'sticky', top: 0, zIndex: 1000 };
const logoSection: React.CSSProperties = { display: 'flex', alignItems: 'center', gap: '10px', cursor: 'pointer' };
const titleStyle: React.CSSProperties = { fontSize: '20px', fontWeight: '800', color: '#4d444a', letterSpacing: '-0.5px' };
const navStyle: React.CSSProperties = { display: 'flex', alignItems: 'center', gap: '20px' };
const linkStyle: React.CSSProperties = { fontSize: '15px', fontWeight: '600', color: '#8a7d84', cursor: 'pointer' };
const authBtn: React.CSSProperties = { padding: '10px 25px', backgroundColor: '#ff6b81', color: 'white', border: 'none', borderRadius: '25px', fontWeight: '700', cursor: 'pointer' };
const adminBtn: React.CSSProperties = { padding: '8px 20px', backgroundColor: '#4d444a', color: 'white', border: 'none', borderRadius: '20px', fontWeight: '700', cursor: 'pointer' };
const logoutBtn: React.CSSProperties = { padding: '8px 18px', backgroundColor: 'transparent', color: '#8a7d84', border: '1px solid #e0e0e0', borderRadius: '20px', fontWeight: '600', fontSize: '13px', cursor: 'pointer' };
const profileCircle: React.CSSProperties = { width: '38px', height: '38px', borderRadius: '50%', color: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 'bold', cursor: 'pointer' };

export default Header;