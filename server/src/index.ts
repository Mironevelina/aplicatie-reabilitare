import express from 'express';
import type { Request, Response } from 'express';
import cors from 'cors';
import { supabase } from './config/supabase.js'; // Atenție la .js la final

const app = express();
const PORT = process.env.PORT || 5000;

app.use(cors());
app.use(express.json());

// Endpoint de test pentru baza de date
app.get('/test-db', async (req: Request, res: Response) => {
  try {
    // Schimbăm 'profiles' cu 'pacienti' pentru că acesta există la tine
    const { data, error } = await supabase.from('pacienti').select('*').limit(1);
    
    if (error) throw error;
    
    res.json({ 
      message: "Conexiune reusita! Serverul vede tabelul pacienti.", 
      data 
    });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

app.get('/', (req: Request, res: Response) => {
  res.send('Serverul de Reabilitare funcționează și e gata de testat DB!');
});

app.listen(PORT, () => {
  console.log(`Serverul rulează pe adresa: http://localhost:${PORT}`);
});