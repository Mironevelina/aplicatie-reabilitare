import type { CSSProperties } from "react";

// DECLARAȚIILE UNICE (Fără duplicate):

export const pageContainer: CSSProperties = { 
  padding: '40px', 
  maxWidth: '1000px', 
  margin: '0 auto' 
};

export const centeredContainer: CSSProperties = { 
  height: '70vh', 
  display: 'flex', 
  alignItems: 'center', 
  justifyContent: 'center', 
  color: '#ff8fa3', 
  fontWeight: 900 
};

export const headerContainer: CSSProperties = { 
  display: 'flex', 
  alignItems: 'center', 
  justifyContent: 'space-between', 
  marginBottom: '32px' 
};

export const backButtonStyle: CSSProperties = { 
  backgroundColor: 'white', 
  color: '#8a7d84', 
  border: '1px solid #ffeef2', 
  padding: '10px 20px', 
  borderRadius: '15px', 
  cursor: 'pointer', 
  fontWeight: 700 
};

export const titleStyle: CSSProperties = { 
  fontSize: '28px', 
  fontWeight: 900, 
  color: '#4d444a', 
  margin: 0 
};

export const listContainer: CSSProperties = { 
  display: 'flex', 
  flexDirection: 'column', 
  gap: '15px' 
};

export const userCardStyle: CSSProperties = { 
  backgroundColor: 'rgba(255, 255, 255, 0.9)', 
  padding: '25px', 
  borderRadius: '25px', 
  border: '1px solid white', 
  display: 'flex', 
  justifyContent: 'space-between', 
  alignItems: 'center',
  boxShadow: '0 10px 30px rgba(255, 183, 197, 0.08)'
};

export const patientNameStyle: CSSProperties = { 
  margin: 0, 
  fontWeight: 800, 
  fontSize: '18px', 
  color: '#4d444a' 
};

export const emailStyle: CSSProperties = { 
  margin: 0, 
  color: '#8a7d84', 
  fontSize: '14px' 
};

export const selectorContainer: CSSProperties = { 
  textAlign: 'right', 
  minWidth: '220px' 
};

export const labelStyle: CSSProperties = { 
  margin: '0 0 8px 0', 
  fontSize: '10px', 
  color: '#ffb7c5', 
  fontWeight: 800, 
  letterSpacing: '1px' 
};

export const selectStyle: CSSProperties = { 
  backgroundColor: 'white', 
  padding: '10px 15px', 
  borderRadius: '12px', 
  border: '2px solid', 
  outline: 'none',
  fontWeight: 700,
  fontSize: '14px',
  cursor: 'pointer',
  width: '100%'
};

export const emptyState: CSSProperties = { 
  textAlign: 'center', 
  padding: '50px', 
  color: '#8a7d84', 
  fontStyle: 'italic' 
};