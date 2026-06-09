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

const initDB = async () => {
    try {
        await pool.query(`
            CREATE TABLE IF NOT EXISTS utilisateurs (id SERIAL PRIMARY KEY, nom_utilisateur VARCHAR(50) UNIQUE, mot_de_passe VARCHAR(100), role VARCHAR(20));
            CREATE TABLE IF NOT EXISTS agriculteurs (id SERIAL PRIMARY KEY, nom VARCHAR(100), zone VARCHAR(100), telephone VARCHAR(20), culture VARCHAR(50), solvabilite INTEGER, etape_actuelle VARCHAR(100) DEFAULT '1. Préparation', latitude DECIMAL DEFAULT 12.11, longitude DECIMAL DEFAULT 15.02);
            CREATE TABLE IF NOT EXISTS produits (id SERIAL PRIMARY KEY, agriculteur_id INTEGER, nom_produit VARCHAR(100), prix DECIMAL, quantite_stock INTEGER);
            CREATE TABLE IF NOT EXISTS finances (id SERIAL PRIMARY KEY, agriculteur_id INTEGER, montant DECIMAL, type_t VARCHAR(50), operateur VARCHAR(20));
        `);
        await pool.query("INSERT INTO utilisateurs (nom_utilisateur, mot_de_passe, role) VALUES ('admin', 'admin123', 'ADMIN'), ('banque', 'bank123', 'BANQUE'), ('ong', 'ong123', 'ONG') ON CONFLICT DO NOTHING");
        console.log("✅ Base de données Agri-Tchad prête");
    } catch (err) { console.log(err.message); }
};
initDB();

app.post('/api/login', async (req, res) => {
    const { username, password } = req.body;
    const r = await pool.query("SELECT * FROM utilisateurs WHERE nom_utilisateur=$1 AND mot_de_passe=$2", [username, password]);
    if (r.rows.length > 0) res.json({ success: true, user: r.rows[0] });
    else res.status(401).json({ message: "Invalide" });
});

app.get('/api/agriculteurs', async (req, res) => {
    const r = await pool.query("SELECT a.*, COALESCE(p.nom_produit, '') as en_vente FROM agriculteurs a LEFT JOIN produits p ON a.id = p.agriculteur_id ORDER BY a.id DESC");
    res.json(r.rows);
});

app.post('/api/agriculteurs', async (req, res) => {
    const { nom, zone, telephone, culture } = req.body;
    const r = await pool.query('INSERT INTO agriculteurs (nom, zone, telephone, culture, solvabilite, latitude, longitude) VALUES ($1,$2,$3,$4, 50, 12.11, 15.02) RETURNING *', [nom, zone, telephone, culture]);
    res.json(r.rows[0]);
});

app.post('/api/finances', async (req, res) => {
    const { agriculteur_id, montant, type, operateur } = req.body;
    await pool.query('INSERT INTO finances (agriculteur_id, montant, type_t, operateur) VALUES ($1,$2,$3,$4)', [agriculteur_id, montant, type, operateur]);
    res.json({success: true});
});

// --- CORRECTION DU MARCHÉ ICI ---
app.post('/api/marketplace', async (req, res) => {
    const { id, produit, prix, quantite } = req.body; // Changé agriculteur_id en id pour correspondre au mobile
    await pool.query('INSERT INTO produits (agriculteur_id, nom_produit, prix, quantite_stock) VALUES ($1,$2,$3,$4)', [id, produit, prix, quantite]);
    res.json({success: true});
});

app.get('/api/marketplace', async (req, res) => {
    const r = await pool.query('SELECT p.*, a.nom as vendeur, a.telephone FROM produits p JOIN agriculteurs a ON p.agriculteur_id = a.id ORDER BY p.id DESC');
    res.json(r.rows);
});

app.post('/api/update-etape', async (req, res) => {
    const { id, etape } = req.body;
    await pool.query('UPDATE agriculteurs SET etape_actuelle = $1 WHERE id = $2', [etape, id]);
    res.json({success: true});
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, '0.0.0.0', () => console.log(`🚀 Serveur Master Lancé`));