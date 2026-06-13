import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { Chart as ChartJS, ArcElement, Tooltip, Legend } from 'chart.js';
import { Pie } from 'react-chartjs-2';
import './App.css';

ChartJS.register(ArcElement, Tooltip, Legend);

function App() {
  const [user, setUser] = useState(null);
  const [farmers, setFarmers] = useState([]);
  const [stats, setStats] = useState({ total_p: 0, total_f: 0, graph: [] });
  const [loginData, setLoginData] = useState({ user: 'admin', pass: 'admin123' });
  const [form, setForm] = useState({ nom: '', zone: '', telephone: '', culture: 'Maïs' });

  const API = "https://agri-tchad-backend.onrender.com/api";
  const etapes = ["Préparation des sols", "Semis", "Fertilisation", "Irrigation", "Traitements", "Récolte", "Stockage", "Transformation", "Vente", "Livraison"];

  useEffect(() => { if(user) load(); }, [user]);

  const load = async () => {
    const r1 = await axios.get(`${API}/agriculteurs`);
    const r2 = await axios.get(`${API}/stats`);
    setFarmers(r1.data);
    setStats(r2.data);
  };

  const chartData = {
    labels: stats.graph.map(g => etapes[g.label-1] || "Autre"),
    datasets: [{ data: stats.graph.map(g => g.value), backgroundColor: ['#2e7d32','#ed1c24','#0054a6','#ff9800','#9c27b0'] }]
  };

  const handlePaiement = async (id, montant, type) => {
    await axios.post(`${API}/finances`, { agriculteur_id: id, montant, type });
    alert("Transaction réussie !");
    load();
  };

  if (!user) {
    return (
      <div className="login-page">
        <form className="login-card" onSubmit={async (e)=>{e.preventDefault(); try{const r=await axios.post(`${API}/login`, {username:loginData.user, password:loginData.pass}); setUser(r.data.user);}catch(e){alert("Erreur");}}}>
          <div className="logo">🚜</div>
          <h2>AGRI-TCHAD</h2>
          <input value={loginData.user} onChange={e=>setLoginData({...loginData, user:e.target.value})} placeholder="Utilisateur" />
          <input value={loginData.pass} type="password" onChange={e=>setLoginData({...loginData, pass:e.target.value})} placeholder="Mot de passe" />
          <button type="submit">SE CONNECTER</button>
        </form>
      </div>
    );
  }

  return (
    <div className="app-container">
      <nav className="navbar">
        <h1>PLATEFORME AGRICOLE INTELLIGENTE DU TCHAD</h1>
        <button onClick={() => setUser(null)} className="logout">DÉCONNEXION</button>
      </nav>

      {/* DASHBOARD AVEC CERCLE (Exactement comme l'image) */}
      <div className="dashboard-top">
        <div className="stat-v">👥 {stats.total_p} Producteurs</div>
        <div className="stat-v">💰 {Number(stats.total_f).toLocaleString()} FCFA en circulation</div>
        <div className="chart-v">
            <Pie data={chartData} options={{maintainAspectRatio:false}} />
        </div>
      </div>

      <main className="main">
        <form className="agri-form" onSubmit={async (e)=>{e.preventDefault(); await axios.post(`${API}/agriculteurs`, form); load();}}>
          <input placeholder="Nom" onChange={e=>setForm({...form, nom:e.target.value})} required />
          <input placeholder="Zone" onChange={e=>setForm({...form, zone:e.target.value})} required />
          <input placeholder="Téléphone" onChange={e=>setForm({...form, telephone:e.target.value})} required />
          <select onChange={e=>setForm({...form, culture:e.target.value})}>
            <option>Mil</option><option>Maïs</option><option>Sésame</option><option>Arachide</option>
          </select>
          <button type="submit">S'INSCRIRE</button>
        </form>

        <div className="grid">
          {farmers.map(f => (
            <div key={f.id} className="card">
              <div className="card-h"><h3>{f.nom.toUpperCase()}</h3> <span className="badge">#TD-{f.id}</span></div>
              <button className="gps-btn" onClick={()=>window.open(`https://maps.google.com/?q=${f.latitude},${f.longitude}`)}>📍 Localiser la parcelle (GPS)</button>
              <p>🌾 {f.culture} | IA: {f.solvabilite}%</p>
              
              {/* TRAIT VERT DYNAMIQUE (Module 3.5) */}
              <div className="progress-box">
                <div className="trait-bg"><div className="trait-fill" style={{width: `${f.etape_actuelle * 10}%`}}></div></div>
                <select value={f.etape_actuelle} onChange={async (e)=>{await axios.post(`${API}/update-etape`, {id:f.id, etape:e.target.value}); load();}}>
                  {etapes.map((et, i) => <option key={i} value={i+1}>{i+1}. {et}</option>)}
                </select>
              </div>

              <div className="btns-fin">
                <button className="b-airtel" onClick={()=>handlePaiement(f.id, 5000, 'Airtel')}>Airtel 5000</button>
                <button className="b-moov" onClick={()=>handlePaiement(f.id, 50000, 'Moov')}>Moov 50000</button>
              </div>
              <button className="b-tontine" onClick={()=>handlePaiement(f.id, 2000, 'Tontine')}>Tontine 2000</button>
              <button className="b-vendre">Vendre la récolte</button>
            </div>
          ))}
        </div>
      </main>
    </div>
  );
}

export default App;