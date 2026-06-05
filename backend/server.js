const express = require('express');
const cors = require('cors');
const { Pool } = require('pg');
const app = express();
app.use(cors()); app.use(express.json());

const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: { rejectUnauthorized: false }
});

// ROUTE DE CONNEXION (Module 3.10)
app.post('/api/login', async (req, res) => {
    const { username, password } = req.body;
    const r = await pool.query("SELECT * FROM utilisateurs WHERE nom_utilisateur=$1 AND mot_de_passe=$2", [username, password]);
    if (r.rows.length > 0) {
        res.json({ success: true, user: { nom: r.rows[0].nom_utilisateur, role: r.rows[0].role } });
    } else {
        res.status(401).json({ message: "Échec connexion" });
    }
});

// LISTE DES AGRICULTEURS
app.get('/api/agriculteurs', async (req, res) => {
    const r = await pool.query("SELECT * FROM agriculteurs ORDER BY id DESC");
    res.json(r.rows);
});

// INSCRIPTION (Admin/Coop uniquement)
app.post('/api/agriculteurs', async (req, res) => {
    const { nom, zone, telephone, culture, surface } = req.body;
    const scoreIA = Math.floor(Math.random() * 100); 
    const r = await pool.query(
        'INSERT INTO agriculteurs (nom, zone, telephone, culture, surface_ha, solvabilite) VALUES ($1,$2,$3,$4,$5,$6) RETURNING *',
        [nom, zone, telephone, culture, surface, scoreIA]
    );
    res.json(r.rows[0]);
});

// MISE À JOUR ÉTAPE (Module 3.5)
app.post('/api/update-etape', async (req, res) => {
    const { id, etape } = req.body;
    await pool.query('UPDATE agriculteurs SET etape_actuelle = $1 WHERE id = $2', [etape, id]);
    res.json({success: true});
});

// STATISTIQUES (Module 3.9)
app.get('/api/stats', async (req, res) => {
    const f = await pool.query('SELECT COUNT(*) FROM agriculteurs');
    const fin = await pool.query('SELECT SUM(montant) FROM finances');
    const graph = await pool.query('SELECT etape_actuelle as label, COUNT(*)::int as value FROM agriculteurs GROUP BY etape_actuelle');
    res.json({ total_p: f.rows[0].count, total_f: fin.rows[0].sum || 0, graph: graph.rows });
});

app.post('/api/finances', async (req, res) => {
    await pool.query('INSERT INTO finances (agriculteur_id, montant, type_t) VALUES ($1,$2,$3)', [req.body.id, req.body.montant, req.body.type]);
    res.json({success: true});
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log("🚀 Plateforme Agri-Smart Tchad en ligne"));