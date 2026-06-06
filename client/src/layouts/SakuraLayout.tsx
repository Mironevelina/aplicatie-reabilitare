import { type ReactNode, memo } from 'react';
import Header from '../components/Header';
import Footer from '../components/Footer';

interface SakuraLayoutProps {
  children: ReactNode;
}

const SakuraLayout = memo(({ children }: SakuraLayoutProps) => {
  return (
    <div style={layoutWrapper}>
      {/* HEADER-UL APLICAȚIEI */}
      <Header />
      
      {/* ELEMENTE DE FUNDAL FIXE ÎN COLȚURI */}
      <div style={sakuraDecorationLeft}>🌸</div>
      <div style={sakuraDecorationRight}>🌸</div>

      {/* CONȚINUTUL PRINCIPAL */}
      <main style={mainContent}>
        {children}
      </main>
      
      {/* FOOTER-UL ACADEMIC */}
      <Footer />

      {/* STILUL CSS INJECTAT PENTRU MIȘCAREA ȘI OPACITATEA COMPONENTELOR */}
      <style>{`
        @keyframes floatSlow {
          0% { transform: translateY(-20px) rotate(0deg); opacity: 0; }
          10% { opacity: 0.5; }
          90% { opacity: 0.5; }
          100% { transform: translateY(105vh) translateX(70px) rotate(360deg); opacity: 0; }
        }
        
        /* Forțăm containerele albe din pagini să devină ușor translucide */
        main div[style*="backgroundColor: rgb(255, 255, 255)"], 
        main div[style*="background-color: rgb(255, 255, 255)"],
        main .bg-white {
          background-color: rgba(255, 255, 255, 0.92) !important;
          backdrop-filter: blur(3px);
        }
      `}</style>
      
      {/* PLOAIE BOGATĂ DE PETALE (10 fluxuri cu zIndex: 2 - în spatele textului) */}
      <div style={{...petalStyle, left: '5%', animationDelay: '0s', fontSize: '14px', animationDuration: '14s'}}>🌸</div>
      <div style={{...petalStyle, left: '15%', animationDelay: '4s', fontSize: '10px', animationDuration: '16s'}}>🌸</div>
      <div style={{...petalStyle, left: '25%', animationDelay: '1s', fontSize: '16px', animationDuration: '13s'}}>🌸</div>
      <div style={{...petalStyle, left: '38%', animationDelay: '6s', fontSize: '12px', animationDuration: '15s'}}>🌸</div>
      <div style={{...petalStyle, left: '48%', animationDelay: '2s', fontSize: '15px', animationDuration: '12s'}}>🌸</div>
      <div style={{...petalStyle, left: '58%', animationDelay: '8s', fontSize: '9px', animationDuration: '17s'}}>🌸</div>
      <div style={{...petalStyle, left: '68%', animationDelay: '3s', fontSize: '18px', animationDuration: '14s'}}>🌸</div>
      <div style={{...petalStyle, left: '78%', animationDelay: '5s', fontSize: '11px', animationDuration: '16s'}}>🌸</div>
      <div style={{...petalStyle, left: '88%', animationDelay: '0.5s', fontSize: '13px', animationDuration: '13s'}}>🌸</div>
      <div style={{...petalStyle, left: '95%', animationDelay: '7s', fontSize: '16px', animationDuration: '15s'}}>🌸</div>
    </div>
  );
});

// --- CONFIGURAȚIE STILURI ---

const layoutWrapper: React.CSSProperties = {
  display: 'flex',
  flexDirection: 'column',
  minHeight: '100vh',
  backgroundColor: '#fffafb', 
  position: 'relative',
  overflowX: 'hidden',
};

const mainContent: React.CSSProperties = {
  flex: 1,
  display: 'flex',
  flexDirection: 'column',
  position: 'relative', 
  paddingTop: '90px',        
  paddingBottom: '50px',     
  width: '100%',
  maxWidth: '1280px',        
  margin: '0 auto',          
  paddingLeft: '5%',       
  paddingRight: '5%',      
  boxSizing: 'border-box',
  zIndex: 3, // Textul stă deasupra pentru interacțiune facilă
};

const sakuraDecorationLeft: React.CSSProperties = {
  position: 'fixed',
  bottom: '-20px',
  left: '-20px',
  fontSize: '120px',
  opacity: 0.05, 
  pointerEvents: 'none', 
  zIndex: 2, 
  userSelect: 'none'
};

const sakuraDecorationRight: React.CSSProperties = {
  position: 'fixed',
  top: '120px',
  right: '-30px',
  fontSize: '140px',
  opacity: 0.04, 
  pointerEvents: 'none',
  zIndex: 2, 
  userSelect: 'none'
};

const petalStyle: React.CSSProperties = {
  position: 'fixed',
  top: '-40px',
  pointerEvents: 'none',
  zIndex: 2, // În spatele textului din main (care are zIndex: 3)
  opacity: 0,
  userSelect: 'none',
  animation: 'floatSlow 14s linear infinite', 
};

export default SakuraLayout;