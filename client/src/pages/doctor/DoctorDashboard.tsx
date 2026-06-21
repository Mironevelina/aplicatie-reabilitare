import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import SakuraLayout from '../../layouts/SakuraLayout';
import { supabase } from '../../supabaseClient';
import type { CSSProperties } from 'react';

// Interfața actualizată pentru a reflecta structura de asignare
interface Patient {
  id: string;
  full_name: string | null;
  doctor_id?: string;
}

const DoctorDashboard = () => {
  const navigate = useNavigate();
  
  const [patients, setPatients] = useState<Patient[]>([]);
  const [loading, setLoading] = useState<boolean>(true);

  useEffect(() => {
    const fetchAssignedPatients = async () => {
      try {
        setLoading(true);

        // 1. Obținem ID-ul doctorului logat din sesiunea curentă
        const { data: { session } } = await supabase.auth.getSession();
        const doctorId = session?.user?.id;

        if (!doctorId) {
          console.error("Doctorul nu este autentificat.");
          return;
        }

        // 2. Interogăm tabelul 'pacienti' filtrând după doctor_id
        const { data, error } = await supabase
          .from('pacienti') 
          .select('id, full_name, doctor_id')
          .eq('doctor_id', doctorId); 

        if (error) throw error;
        
        setPatients(data || []);
      } catch (error) {
        if (error instanceof Error) {
          console.error("Eroare la preluarea pacienților asignați:", error.message);
        }
      } finally {
        setLoading(false);
      }
    };

    fetchAssignedPatients();
  }, []);

  return (
    <SakuraLayout>
      {/* Zona principală extinsă și aerisită */}
      <div style={pageWrapperStyle}>
        <header style={{ marginBottom: '50px' }}>
          <h1 style={{ fontSize: '46px', fontWeight: 900, color: '#4d444a', margin: 0, letterSpacing: '-0.5px' }}>
            Cabinetul Meu 👨‍⚕️
          </h1>
          <p style={{ color: '#8a7d84', fontSize: '18px', marginTop: '10px' }}>
            Lista pacienților asignați pentru monitorizare și recuperare.
          </p>
        </header>

        <div style={cardContainerStyle}>
          {loading ? (
            <div style={{ textAlign: 'center', padding: '80px', color: '#ff8fa3', fontWeight: 700, fontSize: '18px' }}>
              Se încarcă pacienții dumneavoastră...
            </div>
          ) : patients.length > 0 ? (
            <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                <thead>
                  <tr style={{ borderBottom: '3px solid #fcf2f4', textAlign: 'left', color: '#8a7d84' }}>
                    <th style={thStyle}>Nume Pacient</th>
                    <th style={thStyle}>Status Clinic</th>
                    <th style={{ ...thStyle, textAlign: 'right' }}>Acțiuni Administrare</th>
                  </tr>
                </thead>
                <tbody>
                  {patients.map((p) => (
                    <tr key={p.id} style={tableRowStyle} onMouseOver={(e) => e.currentTarget.style.backgroundColor = '#fffafb'} onMouseOut={(e) => e.currentTarget.style.backgroundColor = 'transparent'}>
                      <td style={{ ...tdStyle, fontWeight: 700, fontSize: '16px' }}>{p.full_name || "Nume nesetat"}</td>
                      <td style={tdStyle}>
                        <span style={badgeStyle}>În tratament 🌸</span>
                      </td>
                      <td style={{ ...tdStyle, textAlign: 'right' }}>
                         <button 
                          // Navigăm direct către pagina de statistici a pacientului respectiv
                          onClick={() => navigate(`/patient-stats/${p.id}`)}
                          style={actionButtonStyle}
                          onMouseOver={(e) => e.currentTarget.style.transform = 'translateY(-2px)'}
                          onMouseOut={(e) => e.currentTarget.style.transform = 'none'}
                         >
                           Vezi Fișă Detaliată
                         </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <div style={{ textAlign: 'center', padding: '100px 20px', color: '#8a7d84' }}>
              <div style={{ fontSize: '64px', marginBottom: '25px', opacity: 0.8 }}>📁</div>
              <p style={{ fontSize: '22px', fontWeight: 700, color: '#4d444a', marginBottom: '10px' }}>Nu aveți pacienți asignați momentan.</p>
              <p style={{ fontSize: '16px' }}>Contactați administratorul pentru alocarea noilor profiluri.</p>
            </div>
          )}
        </div>
      </div>
    </SakuraLayout>
  );
};

// --- STILURI SAKURA AERISITE ---

const pageWrapperStyle: CSSProperties = {
  padding: '60px 5%',
  maxWidth: '1400px',
  margin: '0 auto',
  minHeight: '85vh',
  display: 'flex',
  flexDirection: 'column'
};

const cardContainerStyle: CSSProperties = { 
  backgroundColor: 'rgba(255, 255, 255, 0.95)', 
  borderRadius: '35px', 
  padding: '50px 60px',
  boxShadow: '0 15px 40px rgba(255, 183, 197, 0.12)', 
  border: '1px solid #fff5f7',
  flex: 1
};

const tableRowStyle: CSSProperties = {
  borderBottom: '1px solid #fcf2f4',
  transition: 'background-color 0.2s ease',
};

const thStyle: CSSProperties = { 
  padding: '24px 20px',
  fontSize: '14px', 
  fontWeight: 800, 
  textTransform: 'uppercase', 
  letterSpacing: '1.2px' 
};

const tdStyle: CSSProperties = { 
  padding: '24px 20px', 
  color: '#4d444a', 
  fontSize: '15px' 
};

const badgeStyle: CSSProperties = { 
  background: '#fdf0f2', 
  color: '#ff8fa3', 
  padding: '8px 16px', 
  borderRadius: '12px', 
  fontSize: '13px', 
  fontWeight: 800 
};

const actionButtonStyle: CSSProperties = { 
  background: 'linear-gradient(135deg, #ffb7c5, #ff8fa3)', 
  color: 'white', 
  border: 'none', 
  padding: '12px 28px',
  borderRadius: '15px', 
  cursor: 'pointer', 
  fontWeight: 700, 
  fontSize: '14px',
  transition: 'all 0.3s ease', 
  boxShadow: '0 6px 15px rgba(255, 143, 163, 0.25)' 
};

export default DoctorDashboard;