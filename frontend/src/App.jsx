import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { Chart as ChartJS, ArcElement, Tooltip, Legend } from 'chart.js';
import { Pie } from 'react-chartjs-2';
import './App.css';

ChartJS.register(ArcElement, Tooltip, Legend);

function App() {
  const [tab, setTab] = useState('gestion');
  const [farmers, setFarmers] = useState([]);
  const [market, setMarket] = useState([]);
  const [stats, setStats] = useState({ total_p: 0, total_f: 0 });
  const [graphData, setGraphData] = useState({ labels: [], datasets: [] });
  const [formData, setFormData] = useState({ nom: '', zone: '', culture: 'Maïs', telephone: '' });

  const API_URL = "https://agri-tchad-backend.onrender.com/api";
  const etapesPDF = ["1. Préparation des sols", "2. Semis", "3. Fertilisation", "4. Irrigation", "6. Récolte", "10. Livraison"];
  const culturesTchad = ["Maïs", "Riz", "Arachide", "Coton", "Sorgho", "Sésame", "Gomme Arabique", "Autre"];

  useEffect(() => { fetchData(); }, [tab]);

  const fetchData = async () => {
    try {
        const resF = await axios.get(`${API_URL}/agriculteurs`);
        const resS = await axios.get(`${API_URL}/stats-globales`);
        const resG = await axios.get(`${API_URL}/stats-graphique`);
        const resM = await axios.get(`${API_URL}/marketplace`);
        
        setFarmers(resF.data);
        setStats(resS.data);
        setMarket(resM.data);
        
        setGraphData({
          labels: resG.data.map(d => d.label),
          datasets: [{
            data: resG.data.map(d => d.value),
            backgroundColor: ['#2e7d32', '#ed1c24', '#0054a6', '#ff9800', '#9c27b0', '#795548']
          }]
        });
    } catch (e) { console.log("Erreur chargement"); }
  };

  const updateProduction = async (id, etape) => {
    await axios.post(`${API_URL}/update-production`, { id, etape });
    fetchData(); // 🔄 ICI : On recharge tout pour faire bouger le graphique !
  };

  const payer = async (montant) => {
    await axios.post(`${API_URL}/finances`, { montant });
    fetchData();
  };

  const vendre = async (id, culture) => {
    const prix = prompt("Prix au KG ?");
    const qte = prompt("Quantité ?");
    if(prix && qte) {
        await axios.post(`${API_URL}/marketplace`, { agriculteur_id: id, produit: culture, prix, quantite: qte });
        alert("Ajouté au marché !");
        fetchData();
    }
  };

  return (
    <div className="app-container">
      <nav className="navbar">
        <h1>PLATEFORME AGRICOLE INTELLIGENTE DU TCHAD</h1>
        <div className="nav-tabs">
            <button className={tab === 'gestion' ? 'active' : ''} onClick={() => setTab('gestion')}>GESTION & FINANCES</button>
            <button className={tab === 'market' ? 'active' : ''} onClick={() => setTab('market')}>MARCHÉ AGRICOLE</button>
        </div>
      </nav>

      {/* DASHBOARD STATS + GRAPHIQUE */}
      <div className="dashboard-stats">
        <div className="stat-info">
            <p>👥 <strong>{stats.total_p}</strong> Producteurs</p>
            <p>💰 <strong>{Number(stats.total_f).toLocaleString()}</strong> FCFA en circulation</p>
        </div>
        <div className="chart-box">
            {graphData.labels.length > 0 ? (
                <Pie data={graphData} options={{ maintainAspectRatio: false, plugins: { legend: { position: 'right' } } }} />
            ) : <small>En attente de production...</small>}
        </div>
      </div>

      <main className="main-content">
        {tab === 'gestion' ? (
          <>
            <form className="agri-form" onSubmit={async (e) => { e.preventDefault(); await axios.post(`${API_URL}/agriculteurs`, formData); fetchData(); }}>
              <input placeholder="Nom" onChange={e=>setFormData({...formData, nom:e.target.value})} required />
              <input placeholder="Zone" onChange={e=>setFormData({...formData, zone:e.target.value})} required />
              <input placeholder="Téléphone" onChange={e=>setFormData({...formData, telephone:e.target.value})} required />
              <select onChange={e=>setFormData({...formData, culture:e.target.value})}>
                {culturesTchad.map(c => <option key={c} value={c}>{c}</option>)}
              </select>
              <button type="submit">S'inscrire</button>
            </form>

            <div className="grid">
              {farmers.map(f => (
                <div key={f.id} className="card">
                  <div className="card-header">
                    <h3>{f.nom.toUpperCase()}</h3>
                    <span className="badge">#TD-{f.id}</span>
                  </div>
                  <button className="gps-btn" onClick={() => window.open(`https://www.google.com/maps/search/?api=1&query=${f.latitude},${f.longitude}`)}>📍 Localiser la parcelle (GPS)</button>
                  <p>🌾 Culture: <strong>{f.culture}</strong> | IA: <strong>{f.solvabilite}%</strong></p>
                  
                  <select className="prod-select" value={f.etape} onChange={(e) => updateProduction(f.id, e.target.value)}>
                    {etapesPDF.map(et => <option key={et} value={et}>{et}</option>)}
                  </select>

                  <div className="btns-row">
                    <button className="btn-red" onClick={()=>payer(5000)}>Airtel 5000</button>
                    <button className="btn-blue" onClick={()=>payer(50000)}>Moov 50000</button>
                  </div>
                  <button className="btn-orange" onClick={()=>payer(2000)}>Tontine 2000</button>
                  <button className="btn-green" onClick={()=>vendre(f.id, f.culture)}>Vendre la récolte</button>
                </div>
              ))}
            </div>
          </>
        ) : (
          <div className="market-grid">
            {market.map(m => (
              <div key={m.id} className="m-card">
                <h3>{m.nom_produit}</h3>
                <p className="price">{m.prix} F/KG</p>
                <p>Vendeur: {m.vendeur}</p>
                <button className="btn-wa" onClick={() => window.open(`https://wa.me/${m.telephone}`)}>Contacter via WhatsApp</button>
              </div>
            ))}
          </div>
        )}
      </main>
    </div>
  );
}

export default App;