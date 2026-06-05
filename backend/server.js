const express = require('express');
const cors = require('cors');
const { Pool } = require('pg');
const app = express();
app.use(cors()); app.use(express.json());

const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: { rejectUnauthorized: false }
});

// ROUTE D'ACCUEIL (Pour enlever le message "Cannot GET /")
app.get('/', (req, res) => {
    res.send("🚀 Serveur AGRI-TCHAD opérationnel et connecté à PostgreSQL.");
});

// AUTHENTIFICATION (Module 3.10)
app.post('/api/login', async (req, res) => {
    const { username, password } = req.body;
    const r = await pool.query("SELECT * FROM utilisateurs WHERE nom_utilisateur=$1 AND mot_de_passe=$2", [username, password]);
    if (r.rows.length > 0) res.json({ success: true, user: r.rows[0] });
    else res.status(401).json({ message: "Invalide" });
});

// LISTE AGRICULTEURS
app.get('/api/agriculteurs', async (req, res) => {
    const r = await pool.query("SELECT * FROM agriculteurs ORDER BY id DESC");
    res.json(r.rows);
});

// INSCRIPTION (Corrigée avec surface_ha)
app.post('/api/agriculteurs', async (req, res) => {
    const { nom, zone, telephone, culture, surface_ha } = req.body;
    const scoreIA = Math.floor(Math.random() * 100); 
    try {
        const r = await pool.query(
            'INSERT INTO agriculteurs (nom, zone, telephone, culture, surface_ha, solvabilite) VALUES ($1,$2,$3,$4,$5,$6) RETURNING *',
            [nom, zone, telephone, culture, surface_ha || 1, scoreIA]
        );
        res.json(r.rows[0]);
    } catch (e) { res.status(500).send(e.message); }
});

// MISE À JOUR ÉTAPE (Pour le TRAIT VERT)
app.post('/api/update-etape', async (req, res) => {
    const { id, etape } = req.body;
    await pool.query('UPDATE agriculteurs SET etape_actuelle = $1 WHERE id = $2', [etape, id]);
    res.json({success: true});
});

// MARCHÉ (Module 3.7)
app.post('/api/marketplace', async (req, res) => {
    const { agriculteur_id, produit, prix, quantite } = req.body;
    await pool.query('INSERT INTO produits (agriculteur_id, nom_produit, prix, quantite) VALUES ($1,$2,$3,$4)', [agriculteur_id, produit, prix, quantite]);
    res.json({success: true});
});

app.get('/api/marketplace', async (req, res) => {
    const r = await pool.query('SELECT p.*, a.nom as vendeur FROM produits p JOIN agriculteurs a ON p.agriculteur_id = a.id ORDER BY p.id DESC');
    res.json(r.rows);
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, '0.0.0.0', () => console.log("✅ Serveur Master Lancé"));