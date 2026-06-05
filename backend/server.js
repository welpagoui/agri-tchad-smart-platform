const express = require('express');
const cors = require('cors');
const { Pool } = require('pg');
const app = express();
app.use(cors());
app.use(express.json());

const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: { rejectUnauthorized: false }
});

// Initialisation des tables au démarrage
const initDB = async () => {
    try {
        await pool.query(`
            CREATE TABLE IF NOT EXISTS agriculteurs (
                id SERIAL PRIMARY KEY, nom VARCHAR(100), zone VARCHAR(100), 
                culture VARCHAR(50), solvabilite INTEGER, latitude DECIMAL, 
                longitude DECIMAL, telephone VARCHAR(20)
            );
            CREATE TABLE IF NOT EXISTS productions (
                id SERIAL PRIMARY KEY, agriculteur_id INTEGER UNIQUE REFERENCES agriculteurs(id),
                etape_actuelle VARCHAR(100) DEFAULT '1. Préparation des sols'
            );
            CREATE TABLE IF NOT EXISTS finances (
                id SERIAL PRIMARY KEY, montant DECIMAL
            );
            CREATE TABLE IF NOT EXISTS produits (
                id SERIAL PRIMARY KEY, agriculteur_id INTEGER REFERENCES agriculteurs(id),
                nom_produit VARCHAR(100), prix DECIMAL, quantite_stock INTEGER
            );
        `);
        console.log("✅ Base de données prête");
    } catch (err) { console.log(err.message); }
};
initDB();

// ROUTES
app.get('/api/agriculteurs', async (req, res) => {
    const r = await pool.query("SELECT a.*, COALESCE(p.etape_actuelle, '1. Préparation des sols') as etape FROM agriculteurs a LEFT JOIN productions p ON a.id = p.agriculteur_id ORDER BY a.id DESC");
    res.json(r.rows);
});

app.post('/api/agriculteurs', async (req, res) => {
    const { nom, zone, culture, telephone } = req.body;
    const lat = (12.1 + Math.random()).toFixed(4);
    const lng = (15.0 + Math.random()).toFixed(4);
    const r = await pool.query('INSERT INTO agriculteurs (nom, zone, culture, solvabilite, latitude, longitude, telephone) VALUES ($1, $2, $3, $4, $5, $6, $7) RETURNING *', [nom, zone, culture, Math.floor(Math.random() * 100), lat, lng, telephone]);
    res.json(r.rows[0]);
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

app.get('/api/stats-globales', async (req, res) => {
    const f = await pool.query('SELECT COUNT(*) FROM agriculteurs');
    const fin = await pool.query('SELECT SUM(montant) FROM finances');
    res.json({ total_p: f.rows[0].count, total_f: fin.rows[0].sum || 0 });
});

app.post('/api/finances', async (req, res) => {
    await pool.query('INSERT INTO finances (montant) VALUES ($1)', [req.body.montant]);
    res.json({success: true});
});

app.get('/api/marketplace', async (req, res) => {
    const r = await pool.query('SELECT m.*, a.nom as vendeur, a.telephone FROM produits m JOIN agriculteurs a ON m.agriculteur_id = a.id ORDER BY m.id DESC');
    res.json(r.rows);
});

app.post('/api/marketplace', async (req, res) => {
    const { agriculteur_id, produit, prix, quantite } = req.body;
    await pool.query('INSERT INTO produits (agriculteur_id, nom_produit, prix, quantite_stock) VALUES ($1, $2, $3, $4)', [agriculteur_id, produit, prix, quantite]);
    res.json({success: true});
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, '0.0.0.0', () => console.log(`🚀 Serveur Master sur le port ${PORT}`));