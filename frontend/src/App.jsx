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
  const [loginData, setLoginData] = useState({ user: '', pass: '' });
  const [form, setForm] = useState({ nom: '', zone: '', telephone: '', culture: 'Maïs', surface: 1 });

  const API = "https://agri-tchad-backend.onrender.com/api";
  const etapes = ["Préparation", "Semis", "Fertilisation", "Irrigation", "Traitements", "Récolte", "Stockage", "Transformation", "Vente", "Livraison"];

  useEffect(() => { if(user) load(); }, [user]);

  const load = async () => {
    const r1 = await axios.get(`${API}/agriculteurs`);
    const r2 = await axios.get(`${API}/stats`);
    setFarmers(r1.data);
    setStats({
        ...r2.data,
        chart: {
            labels: r2.data.graph.map(g => etapes[g.label-1]),
            datasets: [{ data: r2.data.graph.map(g => g.value), backgroundColor: ['#2e7d32','#ed1c24','#0054a6','#ff9800','#9c27b0'] }]
        }
    });
  };

  const handleLogin = async (e) => {
    e.preventDefault();
    try {
      const res = await axios.post(`${API}/login`, { username: loginData.user, password: loginData.pass });
      setUser(res.data.user);
    } catch (err) { alert("Identifiants incorrects au Tchad"); }
  };

  if (!user) {
    return (
      <div className="login-page">
        <form className="login-card" onSubmit={handleLogin}>
          <h2>🔐 ACCÈS SÉCURISÉ <br/><span>Agri-Smart Tchad</span></h2>
          <input placeholder="Utilisateur" onChange={e=>setLoginData({...loginData, user: e.target.value})} required />
          <input placeholder="Mot de passe" type="password" onChange={e=>setLoginData({...loginData, pass: e.target.value})} required />
          <button type="submit">SE CONNECTER</button>
          <div className="test-info">Test : admin / admin123 | ong_tchad / ong123</div>
        </form>
      </div>
    );
  }

  return (
    <div className="app-container">
      <nav className="navbar">
        <div className="user-badge">👤 {user.nom} ({user.role})</div>
        <h1>PLATEFORME AGRICOLE DU TCHAD</h1>
        <button onClick={() => setUser(null)} className="logout">DÉCONNEXION</button>
      </nav>

      {/* DASHBOARD (Module 3.9) */}
      <div className="dashboard-stats">
        <div className="stat-v">👥 {stats.total_p} <br/><span>Producteurs</span></div>
        <div className="stat-v">💰 {stats.total_f} F <br/><span>Circulants</span></div>
        <div className="chart-v">{stats.chart && <Pie data={stats.chart} options={{maintainAspectRatio:false}} />}</div>
      </div>

      <main className="main">
        {/* Module 3.1 : Seuls ADMIN et COOP peuvent inscrire */}
        {(user.role === 'ADMIN' || user.role === 'COOPERATIVE') && (
          <form className="form-in" onSubmit={async (e)=>{e.preventDefault(); await axios.post(`${API}/agriculteurs`, form); load();}}>
            <input placeholder="Nom" onChange={e=>setForm({...form, nom:e.target.value})} required />
            <input placeholder="Zone" onChange={e=>setForm({...form, zone:e.target.value})} required />
            <input placeholder="Surface (Ha)" type="number" onChange={e=>setForm({...form, surface:e.target.value})} required />
            <button type="submit">INSCRIRE</button>
          </form>
        )}

        {/* Module 3.2 : Les ONG voient les alertes climatiques prioritaires */}
        {user.role === 'ONG' && <div className="ong-alert">📢 Attention ONG : Risque de pluie tardive sur la zone Sud.</div>}

        <div className="grid">
          {farmers.map(f => (
            <div key={f.id} className="pro-card">
              <div className="card-header">
                <h3>{f.nom.toUpperCase()}</h3>
                <span className="badge">#TD-{f.id}</span>
              </div>
              
              <button className="gps-btn" onClick={()=>window.open(`https://maps.google.com/?q=${f.latitude},${f.longitude}`)}>📍 LOCALISER GPS</button>
              
              <div className="progress-zone">
                <p>Étape : {etapes[f.etape_actuelle-1]}</p>
                <div className="bar-bg"><div className="bar-fill" style={{width: `${f.etape_actuelle * 10}%`}}></div></div>
                
                {/* Seuls ADMIN et COOP changent les étapes */}
                {(user.role === 'ADMIN' || user.role === 'COOPERATIVE') && (
                    <select value={f.etape_actuelle} onChange={async (e)=>{await axios.post(`${API}/update-etape`, {id: f.id, etape: e.target.value}); load();}}>
                        {etapes.map((et, i) => <option key={i} value={i+1}>{i+1}. {et}</option>)}
                    </select>
                )}
              </div>

              <div className="ia-box">Scoring Solvabilité IA : <strong>{f.solvabilite}%</strong></div>

              {/* Module 3.3 & 3.4 : Seuls ADMIN et BANQUE gèrent l'argent */}
              {(user.role === 'ADMIN' || user.role === 'BANQUE') && (
                <div className="finance-btns">
                    <button className="b-airtel" onClick={()=>axios.post(`${API}/finances`, {id:f.id, montant:5000, type:'Crédit'}).then(()=>load())}>Airtel 5000</button>
                    <button className="b-moov" onClick={()=>axios.post(`${API}/finances`, {id:f.id, montant:50000, type:'Crédit'}).then(()=>load())}>Moov 50000</button>
                    <button className="b-tontine" onClick={()=>axios.post(`${API}/finances`, {id:f.id, montant:2000, type:'Tontine'}).then(()=>load())}>Tontine 2000</button>
                </div>
              )}
              
              {/* Les ONG peuvent laisser un commentaire technique */}
              {user.role === 'ONG' && <button className="btn-ong">Envoyer Support Technique</button>}
            </div>
          ))}
        </div>
      </main>
    </div>
  );
}

export default App;