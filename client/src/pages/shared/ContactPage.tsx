import React from 'react';
import { useNavigate } from 'react-router-dom';

const ContactPage = () => {
  const navigate = useNavigate();

  return (
    <div style={styles.container}>
      {/* BUTONUL CERC - ÎNAPOI */}
      <div style={styles.backWrapper}>
        <button 
          style={styles.circleBackButton} 
          onClick={() => navigate(-1)}
          onMouseOver={(e) => (e.currentTarget.style.backgroundColor = '#f9f9f9')}
          onMouseOut={(e) => (e.currentTarget.style.backgroundColor = 'white')}
          title="Înapoi"
        >
          ←
        </button>
      </div>

      {/* CARDUL DE CONTACT */}
      <div style={styles.card}>
        <div style={styles.iconHeader}>✉️</div>
        <h2 style={{ color: '#4d444a', marginBottom: '10px' }}>Contactează-ne 🌸</h2>
        <p style={{ color: '#8a7d84', marginBottom: '30px' }}>
          Echipa SakuraMotion este aici să te susțină. Trimite-ne un mesaj și îți vom răspunde în cel mai scurt timp.
        </p>
        
        <div style={styles.infoSection}>
          <div style={styles.infoItem}>
            <span style={styles.emoji}>📧</span>
            <div>
              <label style={styles.label}>Email Suport</label>
              <p style={styles.data}>suport@sakuramotion.ro</p>
            </div>
          </div>

          <div style={styles.infoItem}>
            <span style={styles.emoji}>📞</span>
            <div>
              <label style={styles.label}>Telefon</label>
              <p style={styles.data}>+40 722 000 000</p>
            </div>
          </div>

          <div style={styles.infoItem}>
            <span style={styles.emoji}>📍</span>
            <div>
              <label style={styles.label}>Locație</label>
              <p style={styles.data}>Iași, România</p>
            </div>
          </div>
        </div>

        <button 
          style={styles.actionButton}
          onMouseOver={(e) => (e.currentTarget.style.backgroundColor = '#ff4d63')}
          onMouseOut={(e) => (e.currentTarget.style.backgroundColor = '#ff6b81')}
        >
          Trimite un mesaj
        </button>
      </div>
    </div>
  );
};

// --- STILURI ---
const styles: { [key: string]: React.CSSProperties } = {
  container: {
    padding: '30px 40px',
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    minHeight: '80vh'
  },
  backWrapper: {
    width: '100%',
    maxWidth: '500px',
    textAlign: 'left',
    marginBottom: '15px'
  },
  circleBackButton: {
    width: '40px',
    height: '40px',
    borderRadius: '50%',
    backgroundColor: 'white',
    border: '1px solid #f0f0f0',
    color: '#4d444a',
    fontSize: '18px',
    cursor: 'pointer',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    boxShadow: '0 2px 8px rgba(0,0,0,0.05)',
    transition: 'all 0.2s ease'
  },
  card: {
    backgroundColor: 'white',
    padding: '40px',
    borderRadius: '30px',
    boxShadow: '0 10px 30px rgba(0,0,0,0.05)',
    width: '100%',
    maxWidth: '500px',
    textAlign: 'center'
  },
  iconHeader: {
    fontSize: '40px',
    marginBottom: '15px'
  },
  infoSection: {
    textAlign: 'left',
    marginBottom: '30px',
    display: 'flex',
    flexDirection: 'column',
    gap: '20px'
  },
  infoItem: {
    display: 'flex',
    alignItems: 'center',
    gap: '15px'
  },
  emoji: {
    fontSize: '20px',
    backgroundColor: '#fff5f6',
    padding: '10px',
    borderRadius: '12px'
  },
  label: {
    fontSize: '11px',
    color: '#8a7d84',
    textTransform: 'uppercase',
    letterSpacing: '0.5px',
    display: 'block'
  },
  data: {
    fontSize: '15px',
    color: '#4d444a',
    fontWeight: '600',
    margin: 0
  },
  actionButton: {
    backgroundColor: '#ff6b81',
    color: 'white',
    border: 'none',
    padding: '14px 40px',
    borderRadius: '25px',
    fontWeight: 'bold',
    fontSize: '15px',
    cursor: 'pointer',
    transition: 'all 0.3s ease',
    boxShadow: '0 4px 15px rgba(255, 107, 129, 0.2)'
  }
};

export default ContactPage;