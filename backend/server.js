const express = require('express');
const cors = require('cors');
const { Pool } = require('pg');
const app = express();
app.use(cors());
app.use(express.json());

// CONNEXION À LA DB RENDER
const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: { rejectUnauthorized: false } // Obligatoire pour Render
});

// --- SCRIPT D'INITIALISATION AUTOMATIQUE (Module 3.1, 3.2, 3.4, 3.5, 3.7) ---
const initDB = async () => {
    try {
        await pool.query(`
            CREATE TABLE IF NOT EXISTS agriculteurs (
                id SERIAL PRIMARY KEY, nom VARCHAR(100), zone VARCHAR(100), 
                culture VARCHAR(50), solvabilite INTEGER, latitude DECIMAL, 
                longitude DECIMAL, telephone VARCHAR(20), date_inscription TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            );
            CREATE TABLE IF NOT EXISTS productions (
                id SERIAL PRIMARY KEY, agriculteur_id INTEGER UNIQUE REFERENCES agriculteurs(id),
                etape_actuelle VARCHAR(100) DEFAULT '1. Préparation'
            );
            CREATE TABLE IF NOT EXISTS finances (
                id SERIAL PRIMARY KEY, agriculteur_id INTEGER REFERENCES agriculteurs(id),
                type_transaction VARCHAR(50), montant DECIMAL, operateur VARCHAR(20)
            );
            CREATE TABLE IF NOT EXISTS produits (
                id SERIAL PRIMARY KEY, agriculteur_id INTEGER REFERENCES agriculteurs(id),
                nom_produit VARCHAR(100), prix DECIMAL, quantite_stock INTEGER
            );
        `);
        console.log("✅ Tables vérifiées et prêtes sur Render");
    } catch (err) { console.error("❌ Erreur init DB:", err.message); }
};
initDB();

// --- TES ROUTES (GARDÉES EXACTEMENT COMME AVANT) ---
app.get('/api/agriculteurs', async (req, res) => {
    const r = await pool.query("SELECT a.*, COALESCE(p.etape_actuelle, '1. Préparation') as etape FROM agriculteurs a LEFT JOIN productions p ON a.id = p.agriculteur_id ORDER BY a.id DESC");
    res.json(r.rows);
});

app.post('/api/agriculteurs', async (req, res) => {
    const { nom, zone, culture, telephone } = req.body;
    const lat = (12 + Math.random() * 2).toFixed(4);
    const lng = (14 + Math.random() * 3).toFixed(4);
    const r = await pool.query('INSERT INTO agriculteurs (nom, zone, culture, solvabilite, latitude, longitude, telephone) VALUES ($1, $2, $3, $4, $5, $6, $7) RETURNING *', [nom, zone, culture, Math.floor(Math.random() * 100), lat, lng, telephone]);
    res.json(r.rows[0]);
});

app.get('/api/stats-globales', async (req, res) => {
    const f = await pool.query('SELECT COUNT(*) FROM agriculteurs');
    const fin = await pool.query('SELECT SUM(montant) FROM finances');
    res.json({ total_p: f.rows[0].count, total_f: fin.rows[0].sum || 0 });
});

app.post('/api/finances', async (req, res) => {
    const { agriculteur_id, type_transaction, montant, operateur } = req.body;
    await pool.query('INSERT INTO finances (agriculteur_id, type_transaction, montant, operateur) VALUES ($1, $2, $3, $4)', [agriculteur_id, type_transaction, montant, operateur]);
    res.json({success: true});
});

app.get('/api/marketplace', async (req, res) => {
    const r = await pool.query('SELECT m.*, a.nom as vendeur, a.telephone FROM produits m LEFT JOIN agriculteurs a ON m.agriculteur_id = a.id ORDER BY m.id DESC');
    res.json(r.rows);
});

app.post('/api/marketplace', async (req, res) => {
    const { agriculteur_id, produit, prix, quantite } = req.body;
    await pool.query('INSERT INTO produits (agriculteur_id, nom_produit, prix, quantite_stock) VALUES ($1, $2, $3, $4)', [agriculteur_id, produit, prix, quantite]);
    res.json({success: true});
});

app.post('/api/update-production', async (req, res) => {
    const { id, etape } = req.body;
    await pool.query('INSERT INTO productions (agriculteur_id, etape_actuelle) VALUES ($1, $2) ON CONFLICT (agriculteur_id) DO UPDATE SET etape_actuelle = EXCLUDED.etape_actuelle', [id, etape]);
    res.json({success: true});
});

app.get('/api/stats-graphique', async (req, res) => {
    const r = await pool.query('SELECT etape_actuelle as label, COUNT(*)::int as value FROM productions GROUP BY etape_actuelle');
    res.json(r.rows);
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`🚀 Serveur Master prêt sur le port ${PORT}`));