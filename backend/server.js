const express = require('express');
const cors = require('cors');
const { Pool } = require('pg');
const app = express();
app.use(cors()); app.use(express.json());

const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: { rejectUnauthorized: false }
});

// LOGIN (Module 3.10)
app.post('/api/login', async (req, res) => {
    const { username, password } = req.body;
    const r = await pool.query("SELECT * FROM utilisateurs WHERE nom_utilisateur=$1 AND mot_de_passe=$2", [username, password]);
    if (r.rows.length > 0) res.json({ success: true, user: r.rows[0] });
    else res.status(401).json({ message: "Erreur" });
});

// LISTE (Module 3.1)
app.get('/api/agriculteurs', async (req, res) => {
    const r = await pool.query("SELECT * FROM agriculteurs ORDER BY id DESC");
    res.json(r.rows);
});

// INSCRIPTION
app.post('/api/agriculteurs', async (req, res) => {
    const { nom, zone, telephone, culture } = req.body;
    const scoreIA = 40 + Math.floor(Math.random() * 50);
    const r = await pool.query('INSERT INTO agriculteurs (nom, zone, telephone, culture, solvabilite, latitude, longitude) VALUES ($1,$2,$3,$4, $5, 12.11, 15.02) RETURNING *', [nom, zone, telephone, culture, scoreIA]);
    res.json(r.rows[0]);
});

// MISE À JOUR ÉTAPE (Correction progression)
app.post('/api/update-etape', async (req, res) => {
    const { id, etape } = req.body;
    await pool.query('UPDATE agriculteurs SET etape_actuelle = $1 WHERE id = $2', [etape, id]);
    res.json({success: true});
});

// MARCHÉ (Module 3.7)
app.get('/api/marketplace', async (req, res) => {
    const r = await pool.query('SELECT p.*, a.nom as vendeur, a.telephone FROM produits p JOIN agriculteurs a ON p.agriculteur_id = a.id ORDER BY p.id DESC');
    res.json(r.rows);
});

app.post('/api/marketplace', async (req, res) => {
    const { agriculteur_id, produit, prix, quantite } = req.body;
    await pool.query('INSERT INTO produits (agriculteur_id, nom_produit, prix, quantite) VALUES ($1,$2,$3,$4)', [agriculteur_id, produit, prix, quantite]);
    res.json({success: true});
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, '0.0.0.0', () => console.log("🚀 AGRI-TCHAD MASTER SYSTEM ONLINE"));