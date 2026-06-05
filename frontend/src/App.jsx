import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { Chart as ChartJS, ArcElement, Tooltip, Legend } from 'chart.js';
import { Pie } from 'react-chartjs-2';
import './App.css';

ChartJS.register(ArcElement, Tooltip, Legend);

function App() {
  const [user, setUser] = useState(null);
  const [tab, setTab] = useState('gestion');
  const [farmers, setFarmers] = useState([]);
  const [market, setMarket] = useState([]);
  const [stats, setStats] = useState({ total_p: 0, graph: [] });
  const [searchTerm, setSearchTerm] = useState("");
  const [loginData, setLoginData] = useState({ user: '', pass: '' });
  const [form, setForm] = useState({ nom: '', zone: '', telephone: '', culture: 'Maïs', surface_ha: 1 });

  const API = "https://agri-tchad-backend.onrender.com/api";
  const etapes = ["Préparation des sols", "Semis", "Fertilisation", "Irrigation", "Traitements", "Récolte", "Stockage", "Transformation", "Vente", "Livraison"];

  useEffect(() => { if(user) load(); }, [user, tab]);

  const load = async () => {
    try {
        const r1 = await axios.get(`${API}/agriculteurs`);
        const r2 = await axios.get(`${API}/stats`);
        const r3 = await axios.get(`${API}/marketplace`);
        setFarmers(r1.data);
        setStats(r2.data);
        setMarket(r3.data);
    } catch (e) { console.error(e); }
  };

  const handleLogin = async (e) => {
    e.preventDefault();
    try {
      const res = await axios.post(`${API}/login`, { username: loginData.user, password: loginData.pass });
      setUser(res.data.user);
    } catch (err) { alert("Identifiants incorrects (admin / admin123)"); }
  };

  const chartData = {
    labels: stats.graph?.map(g => etapes[g.label-1] || "Autre") || [],
    datasets: [{ data: stats.graph?.map(g => g.value) || [], backgroundColor: ['#2e7d32','#ed1c24','#0054a6','#ff9800','#9c27b0'] }]
  };

  if (!user) {
    return (
      <div className="login-page">
        <form className="login-card" onSubmit={handleLogin}>
          <h1>🚜 AGRI-TCHAD</h1>
          <p>Authentification sécurisée (Module 3.10)</p>
          <input placeholder="Utilisateur" onChange={e=>setLoginData({...loginData, user: e.target.value})} required />
          <input placeholder="Mot de passe" type="password" onChange={e=>setLoginData({...loginData, pass: e.target.value})} required />
          <button type="submit">SE CONNECTER</button>
        </form>
      </div>
    );
  }

  return (
    <div className="app-container">
      <nav className="navbar">
        <button onClick={() => setUser(null)} className="back-btn">⬅ RETOUR</button>
        <h1>PLATFORME AGRI-TCHAD</h1>
        <div className="user-badge">👤 {user.nom_utilisateur} ({user.role})</div>
      </nav>

      <div className="dashboard-stats">
        <div className="stat-item">👥 {stats.total_p} <br/><span>Producteurs</span></div>
        <div className="chart-item"><Pie data={chartData} options={{maintainAspectRatio:false}} /></div>
        <div className="tabs">
          <button onClick={() => setTab('gestion')} className={tab === 'gestion' ? 'active' : ''}>GESTION</button>
          <button onClick={() => setTab('market')} className={tab === 'market' ? 'active' : ''}>MARCHÉ</button>
        </div>
      </div>

      <main className="main">
        {tab === 'gestion' ? (
          <>
            <div className="search-zone">
                <input type="text" placeholder="🔎 Rechercher par nom ou zone (Pala, Bongor...)" onChange={(e)=>setSearchTerm(e.target.value)} />
                {(user.role === 'ADMIN' || user.role === 'COOPERATIVE') && (
                    <button className="add-btn" onClick={()=>{
                        const n = prompt("Nom complet?"); 
                        const z = prompt("Zone?"); 
                        if(n && z) axios.post(`${API}/agriculteurs`, {...form, nom:n, zone:z}).then(()=>load());
                    }}>+ S'INSCRIRE</button>
                )}
            </div>

            <div className="grid">
              {farmers.filter(f => f.nom.toLowerCase().includes(searchTerm.toLowerCase()) || f.zone.toLowerCase().includes(searchTerm.toLowerCase())).map(f => (
                <div key={f.id} className="pro-card">
                  <div className="card-top"><h3>{f.nom.toUpperCase()}</h3> <span className="id-tag">#TD-{f.id}</span></div>
                  <button className="gps-btn" onClick={()=>window.open(`https://maps.google.com/?q=${f.latitude},${f.longitude}`)}>📍 LOCALISER GPS</button>
                  <p>📍 {f.zone} | 🌾 {f.culture}</p>
                  
                  <div className="progress-section">
                    <p>Évolution Production (Module 3.5)</p>
                    <div className="bar-bg"><div className="bar-fill" style={{width: `${f.etape_actuelle * 10}%`}}></div></div>
                    {(user.role === 'ADMIN' || user.role === 'COOPERATIVE') && (
                        <select value={f.etape_actuelle} onChange={async (e)=>{await axios.post(`${API}/update-etape`, {id: f.id, etape: e.target.value}); load();}}>
                            {etapes.map((et, i) => <option key={i} value={i+1}>{i+1}. {et}</option>)}
                        </select>
                    )}
                  </div>

                  <div className="ia-badge">IA Scoring : <strong>{f.solvabilite}%</strong></div>

                  {(user.role === 'ADMIN' || user.role === 'BANQUE') && (
                    <div className="finance-btns">
                        <button className="b-airtel">Airtel</button>
                        <button className="b-moov">Moov</button>
                        <button className="b-vendre" onClick={async ()=>{
                            const p=prompt("Prix KG?"); const q=prompt("Quantité?");
                            if(p&&q){await axios.post(`${API}/marketplace`, {agriculteur_id:f.id, produit:f.culture, prix:p, quantite:q}); load();}
                        }}>VENDRE RÉCOLTE</button>
                    </div>
                  )}
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
                <button onClick={()=>window.open(`https://wa.me/${m.telephone}`)} className="wa-btn">WhatsApp</button>
              </div>
            ))}
          </div>
        )}
      </main>
    </div>
  );
}

export default App;