import type { CSSProperties } from 'react';

const Footer = () => {
  return (
    <footer style={footerStyle}>
      <div style={{ marginBottom: '10px' }}>
        <strong>SakuraMotion</strong> - Platformă Digitală de Reabilitare
      </div>
      <div style={{ fontSize: '13px', opacity: 0.8 }}>
        © 2026 Proiect de Licență | Realizat pentru recuperare medicală
      </div>
      <div style={{ marginTop: '10px', display: 'flex', gap: '20px', justifyContent: 'center' }}>
        <span style={footerLink}>Termeni</span>
        <span style={footerLink}>Confidențialitate</span>
        <span style={footerLink}>Contact</span>
      </div>
    </footer>
  );
};

const footerStyle: CSSProperties = {
  textAlign: 'center',
  padding: '40px 20px',
  backgroundColor: '#fdf7f8',
  borderTop: '1px solid #ffeef2',
  color: '#8a7d84',
  marginTop: '50px'
};

const footerLink: CSSProperties = { fontSize: '12px', cursor: 'pointer', textDecoration: 'underline' };

export default Footer; 