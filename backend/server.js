const express = require('express');
const cors = require('cors');
const { Pool } = require('pg');
const app = express();
app.use(cors()); app.use(express.json());

const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: { rejectUnauthorized: false }
});

// INITIALISATION AUTOMATIQUE (Module 3.10)
const initDB = async () => {
    try {
        // 1. Créer les tables
        await pool.query(`
            CREATE TABLE IF NOT EXISTS utilisateurs (id SERIAL PRIMARY KEY, nom_utilisateur VARCHAR(50) UNIQUE, mot_de_passe VARCHAR(100), role VARCHAR(20));
            CREATE TABLE IF NOT EXISTS agriculteurs (id SERIAL PRIMARY KEY, nom VARCHAR(100), zone VARCHAR(100), telephone VARCHAR(20), culture VARCHAR(50), surface_ha DECIMAL, solvabilite INTEGER, etape_actuelle INTEGER DEFAULT 1, latitude DECIMAL, longitude DECIMAL);
            CREATE TABLE IF NOT EXISTS produits (id SERIAL PRIMARY KEY, agriculteur_id INTEGER, nom_produit VARCHAR(100), prix DECIMAL, quantite INTEGER);
            CREATE TABLE IF NOT EXISTS finances (id SERIAL PRIMARY KEY, agriculteur_id INTEGER, montant DECIMAL, type_t VARCHAR(50), operateur VARCHAR(20));
        `);
        
        // 2. Créer l'admin automatiquement s'il n'existe pas
        await pool.query(`
            INSERT INTO utilisateurs (nom_utilisateur, mot_de_passe, role) 
            VALUES ('admin', 'admin123', 'ADMIN') 
            ON CONFLICT (nom_utilisateur) DO NOTHING
        `);
        console.log("✅ Système de sécurité AGRI-TCHAD initialisé");
    } catch (err) { console.log("Erreur Init:", err.message); }
};
initDB();

app.post('/api/login', async (req, res) => {
    const { username, password } = req.body;
    try {
        const r = await pool.query("SELECT * FROM utilisateurs WHERE nom_utilisateur=$1 AND mot_de_passe=$2", [username, password]);
        if (r.rows.length > 0) res.json({ success: true, user: r.rows[0] });
        else res.status(401).json({ message: "Identifiants incorrects" });
    } catch (e) { res.status(500).send(e.message); }
});

app.get('/api/agriculteurs', async (req, res) => {
    const r = await pool.query("SELECT * FROM agriculteurs ORDER BY id DESC");
    res.json(r.rows);
});

app.post('/api/agriculteurs', async (req, res) => {
    const { nom, zone, telephone, culture, surface_ha } = req.body;
    const r = await pool.query('INSERT INTO agriculteurs (nom, zone, telephone, culture, surface_ha, solvabilite, latitude, longitude) VALUES ($1,$2,$3,$4,$5,$6,$7,$8) RETURNING *', 
    [nom, zone, telephone, culture, surface_ha, Math.floor(Math.random()*100), 12.11, 15.02]);
    res.json(r.rows[0]);
});

app.post('/api/update-etape', async (req, res) => {
    const { id, etape } = req.body;
    await pool.query('UPDATE agriculteurs SET etape_actuelle = $1 WHERE id = $2', [etape, id]);
    res.json({success: true});
});

app.post('/api/marketplace', async (req, res) => {
    const { agriculteur_id, produit, prix, quantite } = req.body;
    await pool.query('INSERT INTO produits (agriculteur_id, nom_produit, prix, quantite) VALUES ($1,$2,$3,$4)', [agriculteur_id, produit, prix, quantite]);
    res.json({success: true});
});

app.get('/api/marketplace', async (req, res) => {
    const r = await pool.query('SELECT p.*, a.nom as vendeur, a.telephone FROM produits p JOIN agriculteurs a ON p.agriculteur_id = a.id ORDER BY p.id DESC');
    res.json(r.rows);
});

app.post('/api/finances', async (req, res) => {
    const { agriculteur_id, montant, type, operateur } = req.body;
    await pool.query('INSERT INTO finances (agriculteur_id, montant, type_t, operateur) VALUES ($1,$2,$3,$4)', [agriculteur_id, montant, type, operateur]);
    res.json({success: true});
});

app.get('/api/stats-globales', async (req, res) => {
    const f = await pool.query('SELECT COUNT(*) FROM agriculteurs');
    const fin = await pool.query('SELECT SUM(montant) FROM finances');
    res.json({ total_p: f.rows[0].count, total_f: fin.rows[0].sum || 0 });
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, '0.0.0.0', () => console.log(`🚀 Serveur Master prêt`));