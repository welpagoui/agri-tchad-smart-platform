const express = require('express');
const cors = require('cors');
const { Pool } = require('pg');
const app = express();
app.use(cors()); app.use(express.json());

const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: { rejectUnauthorized: false }
});

// Module 3.8 : Simulation Intelligence Artificielle (Scoring & Rendement)
const calculerIA = (surface, etape) => {
    const score = Math.floor(Math.random() * 100);
    const rendement = (surface * 1.5).toFixed(2); // Estimation pro
    return { score, rendement };
};

// Route complète (Module 3.1 à 3.6)
app.get('/api/complet', async (req, res) => {
    const r = await pool.query(`
        SELECT a.*, p.surface_ha, p.culture_type, p.etape_actuelle, p.rendement_estime 
        FROM agriculteurs a 
        LEFT JOIN parcelles p ON a.id = p.agriculteur_id 
        ORDER BY a.id DESC`);
    res.json(r.rows);
});

// Inscription (Module 3.1 & 3.2)
app.post('/api/inscription', async (req, res) => {
    const { nom, zone, tel, culture, surface } = req.body;
    const lat = (12.11).toFixed(4); const lng = (15.02).toFixed(4);
    const ia = calculerIA(surface, 1);
    
    const client = await pool.connect();
    try {
        await client.query('BEGIN');
        const resAgri = await client.query('INSERT INTO agriculteurs (nom, zone, telephone, latitude, longitude) VALUES ($1,$2,$3,$4,$5) RETURNING id', [nom, zone, tel, lat, lng]);
        await client.query('INSERT INTO parcelles (agriculteur_id, surface_ha, culture_type, rendement_estime) VALUES ($1,$2,$3,$4)', [resAgri.rows[0].id, surface, culture, ia.rendement]);
        await client.query('COMMIT');
        res.json({success: true});
    } catch (e) { await client.query('ROLLBACK'); res.status(500).send(e.message); } 
    finally { client.release(); }
});

// Mise à jour Production (Module 3.5)
app.post('/api/update-prod', async (req, res) => {
    const { id, etape } = req.body;
    await pool.query('UPDATE parcelles SET etape_actuelle = $1 WHERE agriculteur_id = $2', [etape, id]);
    res.json({success: true});
});

// Stats Globales (Module 3.9)
app.get('/api/stats', async (req, res) => {
    const f = await pool.query('SELECT COUNT(*) FROM agriculteurs');
    const t = await pool.query('SELECT SUM(solde_tontine) FROM agriculteurs');
    const r = await pool.query('SELECT etape_actuelle as label, COUNT(*)::int as value FROM parcelles GROUP BY etape_actuelle');
    res.json({ producteurs: f.rows[0].count, tontines: t.rows[0].sum || 0, graph: r.rows });
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log("🚀 Système Agri-Smart Tchad Actif"));