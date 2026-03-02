import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../../supabaseClient';
import SakuraLayout from '../../layouts/SakuraLayout';


interface Patient {
  id: string;
  full_name: string | null;
  doctor_id: string | null;
}

interface Doctor {
  id: string;
  full_name: string | null;
}

const UserManagement = () => {
  const navigate = useNavigate();
  const [patients, setPatients] = useState<Patient[]>([]);
  const [doctors, setDoctors] = useState<Doctor[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchData = async () => {
    try {
      setLoading(true);
      const { data: pData } = await supabase.from('pacienti').select('id, full_name, doctor_id').order('full_name');
      const { data: dData } = await supabase.from('doctori').select('id, full_name').order('full_name');

      if (pData) setPatients(pData);
      if (dData) setDoctors(dData);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchData(); }, []);

  const handleAssign = async (pId: string, dId: string | null) => {
    const { error } = await supabase
      .from('pacienti')
      .update({ doctor_id: dId || null })
      .eq('id', pId);

    if (!error) {
      setPatients(prev => prev.map(p => p.id === pId ? { ...p, doctor_id: dId } : p));
    }
  };

  if (loading) return <SakuraLayout><div style={{ textAlign: 'center', padding: '100px', color: '#ff8fa3' }}>🌸 Se încarcă...</div></SakuraLayout>;

  return (
    <SakuraLayout>
      <div style={{ padding: '40px', maxWidth: '900px', margin: '0 auto' }}>
        <button onClick={() => navigate('/admin')} style={backBtn}>← Înapoi</button>
        <h1 style={{ color: '#4d444a', marginBottom: '30px' }}>Alocare Pacienți către Medici</h1>

        <div style={{ display: 'grid', gap: '15px' }}>
          {patients.map(p => (
            <div key={p.id} style={userCard}>
              <div>
                <p style={{ fontWeight: 800, margin: 0 }}>{p.full_name || 'Fără nume'}</p>
                <p style={{ fontSize: '12px', color: '#8a7d84' }}>ID: {p.id.substring(0, 8)}</p>
              </div>
              <select 
                value={p.doctor_id || ''} 
                onChange={(e) => handleAssign(p.id, e.target.value || null)}
                style={selectStyle}
              >
                <option value="">⚠️ Neatribuit</option>
                {doctors.map(d => (
                  <option key={d.id} value={d.id}>Dr. {d.full_name}</option>
                ))}
              </select>
            </div>
          ))}
        </div>
      </div>
    </SakuraLayout>
  );
};

const backBtn = { background: 'white', border: '1px solid #ffeef2', padding: '10px 20px', borderRadius: '15px', cursor: 'pointer', marginBottom: '20px' };
const userCard = { display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '20px', backgroundColor: 'white', borderRadius: '25px', boxShadow: '0 5px 15px rgba(0,0,0,0.05)' };
const selectStyle = { padding: '10px', borderRadius: '12px', border: '1px solid #ffb7c5', color: '#4d444a', fontWeight: 600 };

export default UserManagement;