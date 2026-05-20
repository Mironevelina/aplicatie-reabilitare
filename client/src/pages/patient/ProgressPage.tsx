import { useState, useEffect } from 'react';
import { supabase } from '../../supabaseClient';

export default function CereriDoctori() {
  const [cereri, setCereri] = useState<any[]>([]);

  useEffect(() => {
    fetchCereri();
  }, []);

  const fetchCereri = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    const { data, error } = await supabase
      .from('relatii_pacienti')
      .select(`
        id,
        id_medic,
        doctori (
          full_name
        )
      `)
      .eq('id_pacient', user.id)
      .eq('status', 'pending');

    if (data) setCereri(data);
  };

  const gestioneazaCerere = async (idRelatie: string, statusNou: 'acceptat' | 'respins') => {
    const { error } = await supabase
      .from('relatii_pacienti')
      .update({ status: statusNou })
      .eq('id', idRelatie);

    if (!error) {
      setCereri(prev => prev.filter(c => c.id !== idRelatie));
    }
  };

  if (cereri.length === 0) return null;

  return (
    <div style={containerStyle}>
      {cereri.map(c => (
        <div key={c.id} style={bannerStyle}>
          <p style={{ margin: 0, fontWeight: '600' }}>
            Doctorul {c.doctori?.full_name} solicită permisiunea de a vă monitoriza evoluția.
          </p>
          <div style={{ display: 'flex', gap: '10px' }}>
            <button onClick={() => gestioneazaCerere(c.id, 'acceptat')} style={acceptBtn}>Acceptă</button>
            <button onClick={() => gestioneazaCerere(c.id, 'respins')} style={rejectBtn}>Respinge</button>
          </div>
        </div>
      ))}
    </div>
  );
}

const containerStyle: React.CSSProperties = { marginBottom: '20px' };
const bannerStyle: React.CSSProperties = { 
  backgroundColor: '#fff', 
  border: '1px solid #ff8fa3', 
  padding: '15px 25px', 
  borderRadius: '15px', 
  display: 'flex', 
  justifyContent: 'space-between', 
  alignItems: 'center',
  boxShadow: '0 4px 12px rgba(255,143,163,0.1)'
};
const acceptBtn: React.CSSProperties = { backgroundColor: '#a7c9b0', color: 'white', border: 'none', padding: '8px 15px', borderRadius: '8px', cursor: 'pointer', fontWeight: 'bold' };
const rejectBtn: React.CSSProperties = { backgroundColor: 'white', color: '#8a7d84', border: '1px solid #ddd', padding: '8px 15px', borderRadius: '8px', cursor: 'pointer' };