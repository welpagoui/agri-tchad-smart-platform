const express = require('express');
const cors = require('cors');
const { Pool } = require('pg');
const app = express();
app.use(cors()); app.use(express.json());

const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: { rejectUnauthorized: false }
});

// LOGIN
app.post('/api/login', async (req, res) => {
    const { username, password } = req.body;
    const r = await pool.query("SELECT * FROM utilisateurs WHERE nom_utilisateur=$1 AND mot_de_passe=$2", [username, password]);
    if (r.rows.length > 0) res.json({ success: true, user: r.rows[0] });
    else res.status(401).json({ message: "Erreur" });
});

// STATS (POUR LE SOLDE ET LE CERCLE)
app.get('/api/stats', async (req, res) => {
    const f = await pool.query('SELECT COUNT(*) FROM agriculteurs');
    const fin = await pool.query('SELECT SUM(montant) FROM finances');
    const graph = await pool.query('SELECT etape_actuelle as label, COUNT(*)::int as value FROM agriculteurs GROUP BY etape_actuelle');
    res.json({ total_p: f.rows[0].count, total_f: fin.rows[0].sum || 0, graph: graph.rows });
});

// ACTIONS FINANCIÈRES (POUR QUE LE SOLDE AUGMENTE)
app.post('/api/finances', async (req, res) => {
    const { agriculteur_id, montant, type } = req.body;
    await pool.query('INSERT INTO finances (agriculteur_id, montant, type_transaction) VALUES ($1, $2, $3)', [agriculteur_id, montant, type]);
    res.json({ success: true });
});

app.get('/api/agriculteurs', async (req, res) => {
    const r = await pool.query("SELECT * FROM agriculteurs ORDER BY id DESC");
    res.json(r.rows);
});

app.post('/api/agriculteurs', async (req, res) => {
    const { nom, zone, telephone, culture } = req.body;
    const r = await pool.query('INSERT INTO agriculteurs (nom, zone, telephone, culture, solvabilite, latitude, longitude) VALUES ($1,$2,$3,$4, 50, 12.11, 15.02) RETURNING *', [nom, zone, telephone, culture]);
    res.json(r.rows[0]);
});

app.post('/api/update-etape', async (req, res) => {
    const { id, etape } = req.body;
    await pool.query('UPDATE agriculteurs SET etape_actuelle = $1 WHERE id = $2', [etape, id]);
    res.json({success: true});
});

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
app.listen(PORT, '0.0.0.0', () => console.log("🚀 MASTER SYSTEM ONLINE"));