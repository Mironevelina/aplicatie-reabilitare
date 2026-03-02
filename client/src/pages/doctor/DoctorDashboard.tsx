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
  const [selectedPatient, setSelectedPatient] = useState<Patient | null>(null);
  const [isModalOpen, setIsModalOpen] = useState<boolean>(false);

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
        // Luăm doar pacienții care aparțin acestui doctor specific
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

  const openPatientFile = (patient: Patient) => {
    setSelectedPatient(patient);
    setIsModalOpen(true);
  };

  return (
    <SakuraLayout>
      <div style={{ padding: '50px 60px', maxWidth: '1200px', margin: '0 auto' }}>
        <header style={{ marginBottom: '40px' }}>
          <h1 style={{ fontSize: '42px', fontWeight: 900, color: '#4d444a', margin: 0 }}>
            Cabinetul Meu 👨‍⚕️
          </h1>
          <p style={{ color: '#8a7d84', fontSize: '18px' }}>
            Lista pacienților asignați pentru monitorizare și recuperare.
          </p>
        </header>

        <div style={cardContainerStyle}>
          {loading ? (
            <div style={{ textAlign: 'center', padding: '40px', color: '#ff8fa3', fontWeight: 700 }}>
              Se încarcă pacienții dumneavoastră...
            </div>
          ) : patients.length > 0 ? (
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead>
                <tr style={{ borderBottom: '2px solid #f0f9f1', textAlign: 'left', color: '#8a7d84' }}>
                  <th style={thStyle}>Nume Pacient</th>
                  <th style={thStyle}>Status</th>
                  <th style={thStyle}>Acțiuni</th>
                </tr>
              </thead>
              <tbody>
                {patients.map((p) => (
                  <tr key={p.id} style={{ borderBottom: '1px solid #f0f9f1' }}>
                    <td style={{ ...tdStyle, fontWeight: 700 }}>{p.full_name || "Nume nesetat"}</td>
                    <td style={tdStyle}><span style={badgeStyle}>În tratament</span></td>
                    <td style={tdStyle}>
                       <button 
                        onClick={() => openPatientFile(p)}
                        style={actionButtonStyle}
                       >
                         Vezi Fișă
                       </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          ) : (
            <div style={{ textAlign: 'center', padding: '60px', color: '#8a7d84' }}>
              <div style={{ fontSize: '50px', marginBottom: '20px' }}>📁</div>
              <p style={{ fontSize: '18px', fontWeight: 600 }}>Nu aveți pacienți asignați momentan.</p>
              <p style={{ fontSize: '14px' }}>Contactați administratorul pentru alocarea pacienților.</p>
            </div>
          )}
        </div>

        {/* Modal Detalii Pacient */}
        {isModalOpen && selectedPatient && (
          <div style={modalOverlayStyle}>
            <div style={modalContentStyle}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '25px' }}>
                <h2 style={{ color: '#4d444a', margin: 0 }}>Fișă Pacient 📋</h2>
                <button onClick={() => setIsModalOpen(false)} style={closeButtonStyle}>✕</button>
              </div>
              
              <div style={infoBoxStyle}>
                <p style={{ margin: '5px 0' }}><strong>Nume:</strong> {selectedPatient.full_name || "Nesetat"}</p>
                <p style={{ margin: '5px 0', fontSize: '11px', color: '#8a7d84' }}>ID UNIC: {selectedPatient.id}</p>
              </div>

              <button 
                onClick={() => navigate(`/patient-stats/${selectedPatient.id}`)}
                style={statsButtonStyle}
              >
                📊 Analizează Evoluția AI
              </button>

              <div style={{ marginTop: '25px' }}>
                <h3 style={{ color: '#ff8fa3', fontSize: '15px', marginBottom: '10px' }}>Note Medicale</h3>
                <textarea 
                  placeholder="Introduceți observații despre ședințele de kinetoterapie..."
                  style={textareaStyle}
                />
              </div>
              
              <button 
                style={saveButtonStyle} 
                onClick={() => setIsModalOpen(false)}
              >
                Salvează Observațiile
              </button>
            </div>
          </div>
        )}
      </div>
    </SakuraLayout>
  );
};

// --- STILURI SAKURA ---
const cardContainerStyle: CSSProperties = { backgroundColor: 'rgba(255, 255, 255, 0.9)', borderRadius: '35px', padding: '35px', boxShadow: '0 15px 35px rgba(255, 183, 197, 0.15)', border: '1px solid white' };
const thStyle: CSSProperties = { padding: '20px 15px', fontSize: '13px', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '1px' };
const tdStyle: CSSProperties = { padding: '20px 15px', color: '#4d444a', fontSize: '15px' };
const badgeStyle: CSSProperties = { background: '#fdf0f2', color: '#ff8fa3', padding: '6px 12px', borderRadius: '10px', fontSize: '12px', fontWeight: 800 };
const actionButtonStyle: CSSProperties = { background: 'linear-gradient(135deg, #ffb7c5, #ff8fa3)', color: 'white', border: 'none', padding: '10px 22px', borderRadius: '15px', cursor: 'pointer', fontWeight: 700, transition: '0.3s transform', boxShadow: '0 4px 10px rgba(255, 143, 163, 0.2)' };
const modalOverlayStyle: CSSProperties = { position: 'fixed', top: 0, left: 0, width: '100%', height: '100%', backgroundColor: 'rgba(77, 68, 74, 0.4)', backdropFilter: 'blur(8px)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000 };
const modalContentStyle: CSSProperties = { backgroundColor: 'white', padding: '40px', borderRadius: '40px', width: '450px', boxShadow: '0 30px 60px rgba(0,0,0,0.2)' };
const infoBoxStyle: CSSProperties = { backgroundColor: '#fff9fa', padding: '20px', borderRadius: '20px', border: '1px solid #ffeef2', color: '#6b5e66' };
const statsButtonStyle: CSSProperties = { width: '100%', backgroundColor: '#2d3436', color: '#55efc4', border: 'none', padding: '15px', borderRadius: '20px', marginTop: '20px', fontWeight: 800, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '10px' };
const textareaStyle: CSSProperties = { width: '100%', height: '100px', borderRadius: '20px', border: '1px solid #ffeef2', padding: '15px', outline: 'none', boxSizing: 'border-box', fontFamily: 'inherit', fontSize: '14px' };
const saveButtonStyle: CSSProperties = { width: '100%', background: '#ff8fa3', color: 'white', border: 'none', padding: '16px', borderRadius: '20px', marginTop: '20px', fontWeight: 800, cursor: 'pointer' };
const closeButtonStyle: CSSProperties = { background: 'none', border: 'none', fontSize: '24px', cursor: 'pointer', color: '#ffb7c5' };

export default DoctorDashboard;