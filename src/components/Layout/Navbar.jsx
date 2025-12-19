import React from 'react';

export function Navbar({ title }) {
  return (
    <nav style={{
      display: 'flex',
      alignItems: 'center',
      padding: '15px 20px',
      backgroundColor: '#ffffff',
      borderBottom: '1px solid #dfe1e6',
      marginBottom: '20px',
      boxShadow: '0 1px 3px rgba(0,0,0,0.05)'
    }}>
      <div style={{ fontWeight: 'bold', fontSize: '1.2rem', color: '#172B4D' }}>
        {title || "Granban"}
      </div>
    </nav>
  );
}