'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';

// Redirect /legal-help to a simple informational page
export default function LegalHelpPage() {
  const { user } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!user) router.push('/login');
  }, [user, router]);

  return (
    <div style={{ minHeight: '100dvh', background: '#f9fafb', paddingBottom: 80 }}>
      <header style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '12px 16px', background: 'white', borderBottom: '1px solid #f3f4f6' }}>
        <button style={{ background: 'none', border: 'none', fontSize: '0.9rem', color: '#6b7280', cursor: 'pointer' }} onClick={() => router.push('/dashboard')}>← Back</button>
        <h1 style={{ fontSize: '1rem', fontWeight: 800, color: '#111827' }}>Free Legal Help</h1>
        <div style={{ width: 60 }} />
      </header>

      <div style={{ background: 'linear-gradient(135deg, #eef2ff, #e0e7ff)', borderBottom: '1px solid #c7d2fe', padding: '8px 16px', display: 'flex', gap: 8, fontSize: '0.78rem', color: '#3730d4' }}>
        <span>🛡️</span>
        <span>Informational assistance — not formal legal advice.</span>
      </div>

      <main style={{ padding: 16, maxWidth: 480, margin: '0 auto', display: 'flex', flexDirection: 'column', gap: 14 }}>
        <div style={{ background: 'linear-gradient(140deg, #1a1f52, #3730d4)', borderRadius: 16, padding: 20, color: 'white' }}>
          <h2 style={{ fontSize: '1.2rem', fontWeight: 800, marginBottom: 8 }}>⚖️ Free Legal Aid Resources</h2>
          <p style={{ fontSize: '0.85rem', color: 'rgba(255,255,255,0.85)', lineHeight: 1.5 }}>
            These government and NGO resources can provide free or subsidized legal assistance to eligible citizens.
          </p>
        </div>

        {legalResources.map((r, i) => (
          <div key={i} style={{ background: 'white', border: '1px solid #f3f4f6', borderRadius: 14, padding: 16 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
              <span style={{ background: '#e0e7ff', color: '#3730d4', fontSize: '0.65rem', fontWeight: 800, padding: '2px 8px', borderRadius: 6, textTransform: 'uppercase' }}>{r.type}</span>
              <p style={{ fontSize: '0.9rem', fontWeight: 700, color: '#111827' }}>{r.name}</p>
            </div>
            <p style={{ fontSize: '0.82rem', color: '#374151', lineHeight: 1.5, marginBottom: 8 }}>{r.description}</p>
            <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}>
              {r.contact && (
                <a href={`tel:${r.contact}`} style={{ fontSize: '0.8rem', color: '#4f46e5', fontWeight: 600, display: 'flex', alignItems: 'center', gap: 4 }}>
                  📞 {r.contact}
                </a>
              )}
              {r.url && (
                <a href={r.url} target="_blank" rel="noopener noreferrer" style={{ fontSize: '0.8rem', color: '#4f46e5', fontWeight: 600 }}>
                  🌐 Visit Website →
                </a>
              )}
            </div>
          </div>
        ))}

        <div style={{ background: '#fafafa', border: '1px solid #e5e7eb', borderRadius: 12, padding: 14 }}>
          <p style={{ fontSize: '0.78rem', color: '#6b7280', lineHeight: 1.5 }}>
            ⚖️ This is informational civic assistance only. NyayaLens is not a lawyer and this is not formal legal advice. 
            Consult a qualified advocate for representation.
          </p>
        </div>
      </main>
    </div>
  );
}

const legalResources = [
  { name: 'NALSA — National Legal Services Authority', type: 'GOVERNMENT', description: 'Provides free and competent legal services to the weaker sections of society. Covers all types of cases.', contact: '15100', url: 'https://nalsa.gov.in' },
  { name: 'District Legal Services Authority (DLSA)', type: 'GOVERNMENT', description: 'Located in every district court complex. Provides free legal aid, mediation, and Lok Adalat services. Visit your nearest district court.', contact: '15100', url: 'https://nalsa.gov.in/dlsa' },
  { name: 'State Legal Services Authority (SLSA)', type: 'GOVERNMENT', description: 'State-level legal aid organization. Coordinates with DLSAs to ensure legal access for all citizens.', url: 'https://nalsa.gov.in/slsa' },
  { name: 'Nyaya Mitra Scheme', type: 'GOVERNMENT', description: 'Trained paralegals who assist citizens in understanding their legal rights and navigating the system.', url: 'https://legalaffairs.gov.in' },
  { name: 'Consumer Helpline', type: 'HELPLINE', description: 'For consumer disputes, product defects, service deficiencies. Free advice and complaint registration.', contact: '1915', url: 'https://consumerhelpline.gov.in' },
  { name: 'Tele-Law Service', type: 'ONLINE', description: 'Free legal advice via video call through Common Service Centres (CSC). Available in all states.', contact: '14567', url: 'https://tele-law.in' },
];
