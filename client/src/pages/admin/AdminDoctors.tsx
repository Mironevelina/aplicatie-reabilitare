import { useEffect, useState } from 'react';
import { supabase } from '../../supabaseClient';
import SakuraLayout from '../../layouts/SakuraLayout';
import { useNavigate } from 'react-router-dom';
import type { CSSProperties } from 'react';

// 1. Definim structura datelor
interface Doctor {
  id: string;
  full_name: string;
  specializare?: string;
}

export default function AdminDoctors() {
  const navigate = useNavigate();
  const [doctors, setDoctors] = useState<Doctor[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchDoctors() {
      setLoading(true);
      const { data, error } = await supabase
        .from('doctori')
        .select('*')
        .order('full_name', { ascending: true });
      
      if (!error && data) {
        setDoctors(data as Doctor[]);
      }
      setLoading(false);
    }
    fetchDoctors();
  }, []);

  return (
    <SakuraLayout>
      <div style={pageContainer}>
        {/* BUTON ÎNAPOI - Te duce la Dashboard-ul principal de Admin */}
        <button onClick={() => navigate('/admin')} style={backButtonStyle}>
          ← Înapoi la Panou Admin
        </button>

        <h1 style={{ color: '#4d444a', marginBottom: '25px', fontWeight: 900 }}>
          Gestionare Doctori 👨‍⚕️
        </h1>
        
        {loading ? (
          <div style={{ textAlign: 'center', padding: '40px', color: '#8a7d84' }}>
            🌸 Se încarcă lista de medici...
          </div>
        ) : (
          <div style={{ display: 'grid', gap: '15px' }}>
            {doctors.length > 0 ? (
              doctors.map((doc) => (
                <div 
                  key={doc.id} 
                  style={doctorCard}
                  onClick={() => navigate(`/admin/doctor/${doc.id}`)} // Navigare către detalii
                >
                  <div>
                    <strong style={{ fontWeight: 800, fontSize: '17px', color: '#4d444a' }}>
                      {doc.full_name}
                    </strong>
                    <p style={{ margin: '5px 0 0', fontSize: '14px', color: '#ff8fa3', fontWeight: 600 }}>
                      {doc.specializare || 'Medic Specialist'}
                    </p>
                  </div>
                  
                  <span style={{ color: '#ffb7c5', fontWeight: 800 }}>Vezi Detalii →</span>
                </div>
              ))
            ) : (
              <p style={{ textAlign: 'center', color: '#8a7d84', padding: '20px' }}>
                Nu există medici înregistrați.
              </p>
            )}
          </div>
        )}
      </div>
    </SakuraLayout>
  );
}

// --- STILURI CONSISTENTE SAKURA ---
const pageContainer: CSSProperties = { 
  padding: '40px', 
  maxWidth: '1000px', 
  margin: '0 auto' 
};

const backButtonStyle: CSSProperties = { 
  marginBottom: '25px', 
  background: 'white', 
  border: '1px solid #ffeef2', 
  color: '#8a7d84', 
  padding: '10px 20px', 
  borderRadius: '15px', 
  fontWeight: 700, 
  cursor: 'pointer',
  transition: '0.3s'
};

const doctorCard: CSSProperties = { 
  backgroundColor: 'white', 
  padding: '20px 30px', 
  borderRadius: '20px', 
  display: 'flex', 
  justifyContent: 'space-between', 
  alignItems: 'center',
  boxShadow: '0 4px 15px rgba(255, 183, 197, 0.1)',
  border: '1px solid #fff0f3',
  cursor: 'pointer',
  transition: 'transform 0.2s ease'
};