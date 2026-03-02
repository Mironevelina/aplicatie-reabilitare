import { useEffect, useState, useCallback } from 'react';
import { supabase } from '../../supabaseClient';
import SakuraLayout from '../../layouts/SakuraLayout';
import type { CSSProperties } from 'react';

interface Message {
  id: string;
  created_at: string;
  nume_pacient: string;
  mesaj: string;
  citit: boolean;
  patient_id: string;
  raspuns_admin: string | null;
  data_raspuns: string | null;
}

const AdminMessages = () => {
  const [messages, setMessages] = useState<Message[]>([]);
  const [loading, setLoading] = useState(true);
  
  // State pentru gestionarea răspunsului
  const [replyToId, setReplyToId] = useState<string | null>(null);
  const [replyText, setReplyText] = useState('');
  const [isSending, setIsSending] = useState(false);

  const fetchMessages = useCallback(async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('contact_messages')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setMessages(data || []);
    } catch (err) {
      console.error("Eroare la încărcarea mesajelor:", err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchMessages();
  }, [fetchMessages]);

  // Funcție pentru a marca mesajul ca citit și a notifica Header-ul
  const markAsRead = async (id: string) => {
    const { error } = await supabase
      .from('contact_messages')
      .update({ citit: true })
      .eq('id', id);
    
    if (!error) {
      setMessages(prev => prev.map(m => m.id === id ? { ...m, citit: true } : m));
      // Trimitem evenimentul pentru Header să-și actualizeze badge-ul
      window.dispatchEvent(new Event('messageRead'));
    }
  };

  const handleSendInternalReply = async (messageId: string) => {
    if (!replyText.trim()) return;

    setIsSending(true);
    try {
      const { error } = await supabase
        .from('contact_messages')
        .update({ 
          raspuns_admin: replyText,
          data_raspuns: new Date().toISOString(),
          citit: true 
        })
        .eq('id', messageId);

      if (error) throw error;

      // Actualizăm lista locală
      setMessages(prev => prev.map(m => 
        m.id === messageId ? { ...m, raspuns_admin: replyText, citit: true } : m
      ));
      
      setReplyToId(null);
      setReplyText('');
      window.dispatchEvent(new Event('messageRead'));
      alert("Răspunsul a fost trimis în aplicație!");

    } catch (err) {
      console.error("Eroare trimitere răspuns:", err);
      alert("Eroare la salvarea răspunsului.");
    } finally {
      setIsSending(false);
    }
  };

  const deleteMessage = async (id: string) => {
    if (!window.confirm("Ești sigur că vrei să ștergi această conversație?")) return;
    const { error } = await supabase.from('contact_messages').delete().eq('id', id);
    if (!error) {
      setMessages(prev => prev.filter(m => m.id !== id));
      window.dispatchEvent(new Event('messageRead'));
    }
  };

  return (
    <SakuraLayout>
      <div style={container}>
        <div style={headerSection}>
          <h1 style={title}>📥 Inbox Mesaje</h1>
          <p style={subtitle}>Răspunde pacienților direct în platformă</p>
        </div>

        {loading ? (
          <div style={loadingContainer}>🌸 Se încarcă mesajele...</div>
        ) : (
          <div style={listContainer}>
            {messages.length === 0 && (
              <div style={emptyState}>Nu ai primit niciun mesaj încă.</div>
            )}
            
            {messages.map((msg) => (
              <div key={msg.id} style={{
                ...messageCard,
                borderLeft: msg.citit ? '5px solid #eee' : '5px solid #ff8fa3',
                backgroundColor: msg.citit ? 'white' : '#fff9fa'
              }}>
                <div style={cardHeader}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                    <span style={patientAvatar}>{msg.nume_pacient.charAt(0)}</span>
                    <div>
                      <div style={patientName}>{msg.nume_pacient}</div>
                      <div style={dateText}>{new Date(msg.created_at).toLocaleString('ro-RO')}</div>
                    </div>
                  </div>
                  {!msg.citit && <span style={newBadge}>NOU</span>}
                </div>
                
                <div style={messageText}>
                  <p style={{ margin: 0 }}>{msg.mesaj}</p>
                </div>

                {msg.raspuns_admin && (
                  <div style={adminReplyBox}>
                    <div style={adminReplyHeader}>Răspunsul tău (Intern):</div>
                    <p style={{ margin: 0, fontSize: '14px' }}>{msg.raspuns_admin}</p>
                  </div>
                )}
                
                <div style={cardActions}>
                  {!msg.raspuns_admin && (
                    <button onClick={() => setReplyToId(msg.id)} style={replyBtn}>
                      💬 Răspunde
                    </button>
                  )}
                  {!msg.citit && !msg.raspuns_admin && (
                    <button onClick={() => markAsRead(msg.id)} style={readBtn}>
                      Bifează ca citit
                    </button>
                  )}
                  <button onClick={() => deleteMessage(msg.id)} style={deleteBtn}>Șterge</button>
                </div>

                {replyToId === msg.id && (
                  <div style={replyArea}>
                    <textarea 
                      style={textareaStyle}
                      value={replyText}
                      onChange={(e) => setReplyText(e.target.value)}
                      placeholder="Scrie răspunsul care va apărea în chat-ul pacientului..."
                      rows={3}
                    />
                    <div style={{ display: 'flex', gap: '10px', marginTop: '10px' }}>
                      <button 
                        disabled={isSending}
                        onClick={() => handleSendInternalReply(msg.id)} 
                        style={sendBtn}
                      >
                        {isSending ? 'Se trimite...' : 'Trimite Răspuns'}
                      </button>
                      <button onClick={() => setReplyToId(null)} style={cancelBtn}>Anulează</button>
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </SakuraLayout>
  );
};

// --- STILURI ---
const container: CSSProperties = { padding: '30px 20px', maxWidth: '850px', margin: '0 auto' };
const headerSection: CSSProperties = { marginBottom: '30px' };
const title: CSSProperties = { color: '#4d444a', fontSize: '28px', fontWeight: 900, margin: 0 };
const subtitle: CSSProperties = { color: '#8a7d84', fontSize: '15px', marginTop: '5px' };

const listContainer: CSSProperties = { display: 'flex', flexDirection: 'column', gap: '15px' };
const messageCard: CSSProperties = { padding: '20px', borderRadius: '22px', boxShadow: '0 5px 20px rgba(0,0,0,0.03)', transition: '0.3s' };
const cardHeader: CSSProperties = { display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '15px' };

const patientAvatar: CSSProperties = { width: '40px', height: '40px', borderRadius: '12px', backgroundColor: '#ffb7c5', color: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 'bold', fontSize: '18px' };
const patientName: CSSProperties = { fontWeight: 800, color: '#4d444a', fontSize: '16px' };
const dateText: CSSProperties = { fontSize: '12px', color: '#8a7d84' };
const newBadge: CSSProperties = { backgroundColor: '#ff8fa3', color: 'white', fontSize: '10px', padding: '4px 10px', borderRadius: '20px', fontWeight: 900 };

const messageText: CSSProperties = { padding: '15px', backgroundColor: 'rgba(255, 255, 255, 0.5)', borderRadius: '15px', color: '#4d444a', lineHeight: '1.5', marginBottom: '15px', border: '1px solid #fff0f3' };

const adminReplyBox: CSSProperties = { padding: '15px', backgroundColor: '#f0f9f4', borderRadius: '15px', color: '#2d4a3e', marginBottom: '15px', border: '1px solid #d1e7dd' };
const adminReplyHeader: CSSProperties = { fontSize: '11px', fontWeight: 800, color: '#4a7a65', textTransform: 'uppercase', marginBottom: '5px' };

const cardActions: CSSProperties = { display: 'flex', gap: '12px' };
const replyBtn: CSSProperties = { background: '#4d444a', color: 'white', border: 'none', padding: '8px 16px', borderRadius: '10px', cursor: 'pointer', fontWeight: 700, fontSize: '13px' };
const readBtn: CSSProperties = { background: '#ff8fa3', color: 'white', border: 'none', padding: '8px 16px', borderRadius: '10px', cursor: 'pointer', fontWeight: 700, fontSize: '13px' };
const deleteBtn: CSSProperties = { background: 'transparent', color: '#8a7d84', border: '1px solid #e0e0e0', padding: '8px 16px', borderRadius: '10px', cursor: 'pointer', fontWeight: 600, fontSize: '13px' };

const replyArea: CSSProperties = { marginTop: '20px', padding: '20px', backgroundColor: 'white', borderRadius: '15px', border: '2px solid #ffb7c5' };
const textareaStyle: CSSProperties = { width: '100%', borderRadius: '10px', border: '1px solid #eee', padding: '12px', outline: 'none', fontFamily: 'inherit', resize: 'none' };
const sendBtn: CSSProperties = { background: '#ff8fa3', color: 'white', border: 'none', padding: '10px 20px', borderRadius: '10px', cursor: 'pointer', fontWeight: 800 };
const cancelBtn: CSSProperties = { background: 'transparent', color: '#8a7d84', border: 'none', padding: '10px', cursor: 'pointer', fontWeight: 600 };

const loadingContainer: CSSProperties = { textAlign: 'center', padding: '100px', color: '#ff8fa3', fontWeight: 800 };
const emptyState: CSSProperties = { textAlign: 'center', padding: '50px', background: 'white', borderRadius: '30px', color: '#8a7d84' };

export default AdminMessages;