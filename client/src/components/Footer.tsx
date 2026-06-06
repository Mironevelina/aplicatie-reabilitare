import type { CSSProperties } from 'react';

const Footer = () => {
  return (
    <footer style={footerStyle}>
      <div style={footerGrid}>
        
        {/* Coloana 1: Despre Platformă */}
        <div style={footerColumn}>
          <div style={columnTitle}>🌸 SakuraMotion</div>
          <p style={columnText}>
            O platformă digitală integrată de reabilitare care utilizează tehnici avansate 
            de vedere artificială pentru recuperarea motricității fine a membrelor superioare, 
            asigurând asistență medicală monitorizată direct la domiciliul pacientului.
          </p>
        </div>

        {/* Coloana 2: Cadru Academic */}
        <div style={footerColumn}>
          <div style={columnTitle}>Cadru Academic</div>
          <p style={columnText}>
            Proiect de Diplomă realizat în cadrul Facultății de Inginerie Electrică și Știința Calculatoarelor 
            (FIESC), Universitatea „Ștefan cel Mare” din Suceava. <br />
            <strong>Specializarea:</strong> Calculatoare
          </p>
        </div>

        {/* Coloana 3: Credite Autor */}
        <div style={footerColumn}>
          <div style={columnTitle}>Echipa de Proiect</div>
          <p style={columnText}>
            <strong>Absolvent:</strong> Evelina Miron<br />
            <strong>Îndrumător Științific:</strong> Șef lucrări dr. inf. Bilius Laura-Bianca<br />
            <strong>An universitar:</strong> 2025 - 2026
          </p>
        </div>

      </div>

      {/* Linia de jos pentru Copyright și Linkuri */}
      <div style={footerBottom}>
        <div style={{ fontSize: '13px', opacity: 0.8 }}>
          © 2026 SakuraMotion. Toate drepturile rezervate.
        </div>
        <div style={{ display: 'flex', gap: '20px', justifyContent: 'center' }}>
          <span style={footerLink}>Termeni și condiții</span>
          <span style={footerLink}>Politică de Confidențialitate</span>
          <span style={footerLink}>Contact USV</span>
        </div>
      </div>
    </footer>
  );
};

// --- STILURI FOOTER ---
const footerStyle: CSSProperties = {
  padding: '50px 5% 30px 5%',
  backgroundColor: '#fdf7f8',
  borderTop: '1px solid #ffeef2',
  color: '#8a7d84',
  marginTop: '60px'
};

const footerGrid: CSSProperties = {
  display: 'grid',
  gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))',
  gap: '40px',
  maxWidth: '1200px',
  margin: '0 auto',
  textAlign: 'left'
};

const footerColumn: CSSProperties = {
  display: 'flex',
  flexDirection: 'column',
  gap: '10px'
};

const columnTitle: CSSProperties = {
  fontSize: '16px',
  fontWeight: '700',
  color: '#4d444a',
  marginBottom: '5px'
};

const columnText: CSSProperties = {
  fontSize: '13px',
  lineHeight: '1.6',
  opacity: 0.9,
  margin: 0
};

const footerBottom: CSSProperties = {
  marginTop: '40px',
  paddingTop: '20px',
  borderTop: '1px solid rgba(255, 183, 197, 0.2)',
  display: 'flex',
  flexDirection: 'column',
  gap: '15px',
  alignItems: 'center',
  justifyContent: 'center',
  textAlign: 'center'
};

const footerLink: CSSProperties = { 
  fontSize: '13px', 
  cursor: 'pointer', 
  textDecoration: 'none',
  opacity: 0.8,
  transition: 'opacity 0.2s'
};

export default Footer;