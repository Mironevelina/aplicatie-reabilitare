import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { supabase } from '../../supabaseClient';
import SakuraLayout from '../../layouts/SakuraLayout';
import type { CSSProperties } from 'react';

interface DoctorProfile {
  id: string;
  full_name: string | null;
  email: string | null;
  medical_code: string | null;
  created_at: string;
}

interface Patient {
  id: string;
  full_name: string | null;
  email: string;
}

const DoctorDetails = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [doctor, setDoctor] = useState<DoctorProfile | null>(null);
  const [patients, setPatients] = useState<Patient[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchDoctorData = async () => {
      setLoading(true);
      // Preluăm datele doctorului din tabelul corect
      const { data: profile } = await supabase.from('doctori').select('*').eq('id', id).single();
      
      // Preluăm pacienții alocați acestui doctor
      const { data: assignedPatients } = await supabase
        .from('pacienti')
        .select('id, full_name, email')
        .eq('doctor_id', id);

      setDoctor(profile);
      setPatients(assignedPatients || []);
      setLoading(false);
    };
    if (id) fetchDoctorData();
  }, [id]);

  const formatDate = (dateString: string | undefined | null) => {
    if (!dateString) return 'Fără dată';
    const d = new Date(dateString);
    return isNaN(d.getTime()) ? 'Dată incorectă' : d.toLocaleDateString('ro-RO');
  };

  if (loading) return <SakuraLayout><div style={centeredContainer}>🌸 Se încarcă profilul medicului...</div></SakuraLayout>;

  return (
    <SakuraLayout>
      <div style={pageContainer}>
        {/* Buton Înapoi fix către lista de medici */}
        <button onClick={() => navigate('/admin/doctors')} style={backButtonStyle}>
          ← Înapoi la listă medici
        </button>

        <div style={headerCard}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '25px' }}>
            <div style={doctorAvatar}>🩺</div>
            <div>
              <h1 style={titleStyle}>{doctor?.full_name || 'Dr. Necunoscut'}</h1>
              <p style={subtitleStyle}>Cod Parafă: <span style={{fontWeight: 800}}>{doctor?.medical_code || 'Fără cod'}</span></p>
            </div>
          </div>
          <div style={statBadge}>
            <p style={badgeLabel}>PACIENȚI ALOCAȚI</p>
            <p style={badgeValue}>{patients.length}</p>
          </div>
        </div>

        <div style={contentGrid}>
          {/* Coloana Stângă: Info Medic */}
          <div style={infoCard}>
            <h3 style={sectionTitle}>Informații Cont</h3>
            <div style={infoRow}>
              <span style={infoLabel}>Email:</span>
              <span style={infoValue}>{doctor?.email || 'Nespecificat'}</span>
            </div>
            <div style={infoRow}>
              <span style={infoLabel}>Membru din:</span>
              <span style={infoValue}>{formatDate(doctor?.created_at)}</span>
            </div>
          </div>

          {/* Coloana Dreaptă: Lista Pacienților acestui medic */}
          <div style={patientsCard}>
            <h3 style={sectionTitle}>Pacienți în Monitorizare</h3>
            <div style={patientListContainer}>
              {patients.map((p) => (
                <div 
                  key={p.id} 
                  style={patientRow} 
                  onClick={() => navigate(`/admin/pacient/${p.id}`)}
                >
                  <div>
                    <div style={patientName}>{p.full_name}</div>
                    <div style={patientEmail}>{p.email}</div>
                  </div>
                  <button style={viewBtn}>Vezi Fișă →</button>
                </div>
              ))}
              {patients.length === 0 && <div style={emptyText}>Niciun pacient alocat acestui medic.</div>}
            </div>
          </div>
        </div>
      </div>
    </SakuraLayout>
  );
};

// --- STILURI SAKURA ---
const pageContainer: CSSProperties = { padding: '40px', maxWidth: '1100px', margin: '0 auto' };
const centeredContainer: CSSProperties = { height: '70vh', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#ff8fa3', fontWeight: 900 };
const backButtonStyle: CSSProperties = { marginBottom: '25px', background: 'white', border: '1px solid #ffeef2', color: '#8a7d84', padding: '10px 20px', borderRadius: '15px', fontWeight: 700, cursor: 'pointer' };
const headerCard: CSSProperties = { display: 'flex', justifyContent: 'space-between', alignItems: 'center', backgroundColor: 'white', padding: '35px', borderRadius: '35px', boxShadow: '0 10px 30px rgba(255, 183, 197, 0.1)', marginBottom: '30px', border: '1px solid #fff0f3' };
const doctorAvatar: CSSProperties = { width: '70px', height: '70px', borderRadius: '50%', backgroundColor: '#fff0f3', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '30px', border: '2px solid #ffb7c5' };
const titleStyle: CSSProperties = { fontSize: '30px', fontWeight: 900, margin: 0, color: '#4d444a' };
const subtitleStyle: CSSProperties = { color: '#ff8fa3', fontSize: '15px', margin: '5px 0 0 0' };
const statBadge: CSSProperties = { backgroundColor: '#fff9fa', padding: '15px 30px', borderRadius: '25px', textAlign: 'center', border: '1px solid #fff0f3' };
const badgeLabel: CSSProperties = { margin: 0, color: '#8a7d84', fontSize: '11px', fontWeight: 800, letterSpacing: '1px' };
const badgeValue: CSSProperties = { fontSize: '32px', fontWeight: 900, margin: 0, color: '#ff8fa3' };
const contentGrid: CSSProperties = { display: 'grid', gridTemplateColumns: '1fr 2fr', gap: '30px' };
const infoCard: CSSProperties = { backgroundColor: 'white', padding: '30px', borderRadius: '35px', border: '1px solid #fff0f3', alignSelf: 'start' };
const sectionTitle: CSSProperties = { marginTop: 0, marginBottom: '20px', fontSize: '18px', color: '#4d444a', fontWeight: 900 };
const infoRow: CSSProperties = { marginBottom: '15px', display: 'flex', flexDirection: 'column' };
const infoLabel: CSSProperties = { fontSize: '11px', color: '#ffb7c5', fontWeight: 800, textTransform: 'uppercase' };
const infoValue: CSSProperties = { color: '#4d444a', fontWeight: 600, fontSize: '15px' };
const patientsCard: CSSProperties = { backgroundColor: 'white', padding: '30px', borderRadius: '35px', border: '1px solid #fff0f3' };
const patientListContainer: CSSProperties = { display: 'flex', flexDirection: 'column', gap: '10px' };
const patientRow: CSSProperties = { display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '15px 20px', backgroundColor: '#fffcfd', borderRadius: '20px', border: '1px solid #fff0f3', cursor: 'pointer' };
const patientName: CSSProperties = { fontWeight: 800, color: '#4d444a' };
const patientEmail: CSSProperties = { fontSize: '12px', color: '#8a7d84' };
const viewBtn: CSSProperties = { background: 'none', border: 'none', color: '#ff8fa3', fontWeight: 800, fontSize: '13px', cursor: 'pointer' };
const emptyText: CSSProperties = { textAlign: 'center', color: '#8a7d84', padding: '40px' };

export default DoctorDetails;