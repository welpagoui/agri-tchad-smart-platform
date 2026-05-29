const express = require('express');
const cors = require('cors');
const { Pool } = require('pg');
const app = express();
app.use(cors());
app.use(express.json());

const pool = new Pool({
    connectionString: process.env.DATABASE_URL, // Render utilisera automatiquement le lien collé plus haut
    ssl: { rejectUnauthorized: false } // Obligatoire pour les connexions sécurisées en ligne
});

// 1. Liste des agriculteurs
app.get('/api/agriculteurs', async (req, res) => {
    try {
        const r = await pool.query("SELECT a.*, COALESCE(p.etape_actuelle, '1. Préparation') as etape FROM agriculteurs a LEFT JOIN productions p ON a.id = p.agriculteur_id ORDER BY a.id DESC");
        res.json(r.rows);
    } catch (err) { res.status(500).json(err.message); }
});

// 2. Inscription
app.post('/api/agriculteurs', async (req, res) => {
    const { nom, zone, culture, telephone } = req.body;
    const lat = (12 + Math.random() * 2).toFixed(4);
    const lng = (14 + Math.random() * 3).toFixed(4);
    try {
        const r = await pool.query('INSERT INTO agriculteurs (nom, zone, culture, solvabilite, latitude, longitude, telephone) VALUES ($1, $2, $3, $4, $5, $6, $7) RETURNING *', 
        [nom, zone, culture, Math.floor(Math.random() * 100), lat, lng, telephone]);
        res.json(r.rows[0]);
    } catch (err) { res.status(500).json(err.message); }
});

// 3. Stats Globales
app.get('/api/stats-globales', async (req, res) => {
    try {
        const f = await pool.query('SELECT COUNT(*) FROM agriculteurs');
        const fin = await pool.query('SELECT SUM(montant) FROM finances');
        res.json({ total_p: f.rows[0].count, total_f: fin.rows[0].sum || 0 });
    } catch (err) { res.status(500).json(err.message); }
});

// 4. Paiement Mobile
app.post('/api/finances', async (req, res) => {
    const { agriculteur_id, type_transaction, montant, operateur } = req.body;
    try {
        await pool.query('INSERT INTO finances (agriculteur_id, type_transaction, montant, operateur) VALUES ($1, $2, $3, $4)', [agriculteur_id, type_transaction, montant, operateur]);
        res.json({success: true});
    } catch (err) { res.status(500).json(err.message); }
});

// 5. MARCHÉ : RÉCUPÉRER (C'est ici qu'on utilise LEFT JOIN pour être sûr de tout voir)
app.get('/api/marketplace', async (req, res) => {
    try {
        const r = await pool.query(`
            SELECT m.*, a.nom as vendeur, a.zone, a.telephone 
            FROM produits m 
            LEFT JOIN agriculteurs a ON m.agriculteur_id = a.id 
            ORDER BY m.id DESC`);
        res.json(r.rows);
    } catch (err) { res.status(500).json(err.message); }
});

// 6. MARCHÉ : PUBLIER (Correction des noms de variables pour Flutter)
app.post('/api/marketplace', async (req, res) => {
    const { agriculteur_id, produit, prix, quantite } = req.body;
    try {
        // Log pour vérifier dans ton terminal si les données arrivent
        console.log("Publication reçue :", req.body);
        
        await pool.query(
            'INSERT INTO produits (agriculteur_id, nom_produit, prix, quantite_stock) VALUES ($1, $2, $3, $4)', 
            [agriculteur_id, produit, prix, quantite]
        );
        res.json({success: true});
    } catch (err) { 
        console.error("Erreur insertion marché:", err.message);
        res.status(500).json(err.message); 
    }
});

// 7. Update Production & Graphique
app.post('/api/update-production', async (req, res) => {
    const { id, etape } = req.body;
    try {
        await pool.query('INSERT INTO productions (agriculteur_id, etape_actuelle) VALUES ($1, $2) ON CONFLICT (agriculteur_id) DO UPDATE SET etape_actuelle = EXCLUDED.etape_actuelle', [id, etape]);
        res.json({success: true});
    } catch (err) { res.status(500).json(err.message); }
});

app.get('/api/stats-graphique', async (req, res) => {
    try {
        const r = await pool.query('SELECT etape_actuelle as label, COUNT(*)::int as value FROM productions GROUP BY etape_actuelle');
        res.json(r.rows);
    } catch (err) { res.status(500).json(err.message); }
});

const PORT = 5000;
app.listen(PORT, '0.0.0.0', () => {
    console.log(`✅ Serveur Agri-Tchad sur : http://192.168.1.238:${PORT}`);
});