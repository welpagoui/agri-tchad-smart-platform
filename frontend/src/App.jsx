import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { Chart as ChartJS, ArcElement, Tooltip, Legend } from 'chart.js';
import { Pie } from 'react-chartjs-2';
import './App.css';

ChartJS.register(ArcElement, Tooltip, Legend);

function App() {
  const [data, setData] = useState([]);
  const [stats, setStats] = useState({ producteurs: 0, tontines: 0, graph: [] });
  const [form, setForm] = useState({ nom: '', zone: '', tel: '', culture: 'Maïs', surface: 1 });
  const API = "https://agri-tchad-backend.onrender.com/api";

  const etapes = [
    "Préparation", "Semis", "Fertilisation", "Irrigation", "Traitements", 
    "Récolte", "Stockage", "Transformation", "Vente", "Livraison"
  ];

  useEffect(() => { load(); }, []);

  const load = async () => {
    const r1 = await axios.get(`${API}/complet`);
    const r2 = await axios.get(`${API}/stats`);
    setData(r1.data);
    setStats({ 
        ...r2.data, 
        chart: {
            labels: r2.data.graph.map(g => etapes[g.label-1]),
            datasets: [{ data: r2.data.graph.map(g => g.value), backgroundColor: ['#2e7d32','#ed1c24','#0054a6','#ff9800','#9c27b0'] }]
        }
    });
  };

  return (
    <div className="app-container">
      <header className="main-header">
        <h1>SISTÈME D'INCLUSION FINANCIÈRE ET SUIVI AGRICOLE (TCHAD)</h1>
        <div className="header-stats">
            <div className="stat-card">👥 {stats.producteurs} <br/><span>Producteurs</span></div>
            <div className="stat-card">💰 {stats.tontines} F <br/><span>Épargne Tontine</span></div>
            <div className="chart-min">{stats.chart && <Pie data={stats.chart} options={{maintainAspectRatio:false}} />}</div>
        </div>
      </header>

      <main className="content">
        {/* Module 3.1 : Inscription Professionnelle */}
        <section className="registration">
            <form onSubmit={async (e) => { e.preventDefault(); await axios.post(`${API}/inscription`, form); load(); }}>
                <input placeholder="Nom" onChange={e=>setForm({...form, nom:e.target.value})} required />
                <input placeholder="Zone" onChange={e=>setForm({...form, zone:e.target.value})} required />
                <input placeholder="Surface (Ha)" type="number" onChange={e=>setForm({...form, surface:e.target.value})} required />
                <select onChange={e=>setForm({...form, culture:e.target.value})}>
                    <option>Maïs</option><option>Riz</option><option>Coton</option>
                </select>
                <button type="submit">IDENTIFIER PRODUCTEUR</button>
            </form>
        </section>

        {/* Module 3.5 & 3.9 : Cartes de Suivi Intelligent */}
        <div className="farmers-grid">
          {data.map(f => (
            <div key={f.id} className="farmer-pro-card">
              <div className="card-top">
                <h3>{f.nom.toUpperCase()}</h3>
                <span className="id-badge">ID: #TD-{f.id}</span>
              </div>
              
              <div className="module-gps">
                <button onClick={() => window.open(`https://maps.google.com/?q=${f.latitude},${f.longitude}`)}>📍 LOCALISER PARCELLE (GPS)</button>
              </div>

              <div className="module-info">
                <p>🌾 Culture: <strong>{f.culture_type}</strong> | Surface: <strong>{f.surface_ha} Ha</strong></p>
                <p>📉 Rendement estimé (IA): <strong>{f.rendement_estime} Tonnes</strong></p>
              </div>

              {/* LE TRAIT VERT DE PROGRESSION (MODULE 3.5) */}
              <div className="progress-section">
                <label>Évolution de la production : {Math.round((f.etape_actuelle/10)*100)}%</label>
                <div className="progress-bar-bg">
                    <div className="progress-bar-fill" style={{ width: `${(f.etape_actuelle/10)*100}%` }}></div>
                </div>
                <select value={f.etape_actuelle} onChange={async (e) => { await axios.post(`${API}/update-prod`, {id: f.id, etape: e.target.value}); load(); }}>
                    {etapes.map((et, i) => <option key={i} value={i+1}>{i+1}. {et}</option>)}
                </select>
              </div>

              {/* Module 3.4 : Mobile Money & Finances */}
              <div className="finance-pro">
                <div className="btns-row">
                    <button className="airtel">Airtel Money</button>
                    <button className="moov">Moov Money</button>
                </div>
                <button className="tontine">COTISATION TONTINE NUMÉRIQUE</button>
                <button className="market">PUBLIER RÉCOLTE AU MARCHÉ</button>
              </div>
            </div>
          ))}
        </div>
      </main>
    </div>
  );
}

export default App;