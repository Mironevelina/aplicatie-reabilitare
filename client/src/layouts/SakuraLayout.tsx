import { type ReactNode, memo } from 'react';
import Header from '../components/Header';
import Footer from '../components/Footer';

interface SakuraLayoutProps {
  children: ReactNode;
}

const SakuraLayout = memo(({ children }: SakuraLayoutProps) => {
  return (
    <div style={layoutWrapper}>
      <Header />
      <main style={mainContent}>
        {children}
      </main>
      <Footer />
    </div>
  );
});

// Stiluri curate, fără elemente de chat
const layoutWrapper: React.CSSProperties = {
  display: 'flex',
  flexDirection: 'column',
  minHeight: '100vh',
  backgroundColor: '#fffafb', // Fundalul temei Sakura
};

const mainContent: React.CSSProperties = {
  flex: 1,
  display: 'flex',
  flexDirection: 'column',
  position: 'relative', // Păstrăm contextul pentru viitoarele elemente de analiză
};

export default SakuraLayout;