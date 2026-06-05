import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { Chart as ChartJS, ArcElement, Tooltip, Legend } from 'chart.js';
import { Pie } from 'react-chartjs-2';
import './App.css';

ChartJS.register(ArcElement, Tooltip, Legend);

function App() {
  const [user, setUser] = useState(null);
  const [tab, setTab] = useState('gestion');
  const [lang, setLang] = useState('fr');
  const [farmers, setFarmers] = useState([]);
  const [market, setMarket] = useState([]);
  const [stats, setStats] = useState({ total_p: 0, total_f: 0, graph: [] });
  const [loginData, setLoginData] = useState({ user: '', pass: '' });
  const [form, setForm] = useState({ nom: '', zone: '', tel: '', culture: 'Maïs', surface: 1 });

  const API = "https://agri-tchad-backend.onrender.com/api";
  const etapes = ["Préparation des sols", "Semis", "Fertilisation", "Irrigation", "Traitements", "Récolte", "Stockage", "Transformation", "Vente", "Livraison"];

  const translations = {
    fr: { title: "PLATEFORME AGRICOLE INTELLIGENTE", tab1: "GESTION & FINANCES", tab2: "MARCHÉ", welcome: "Bonjour" },
    ar: { title: "المنصة الزراعية الذكية", tab1: "الإدارة والتمويل", tab2: "السوق", welcome: "مرحباً" }
  };

  useEffect(() => { if(user) load(); }, [user, tab]);

  const load = async () => {
    try {
        const r1 = await axios.get(`${API}/agriculteurs`);
        const r2 = await axios.get(`${API}/stats`);
        const r3 = await axios.get(`${API}/marketplace`);
        setFarmers(r1.data); setStats(r2.data); setMarket(r3.data);
    } catch (e) { console.error("Erreur serveur"); }
  };

  const chartData = {
    labels: stats.graph ? stats.graph.map(g => etapes[g.label-1] || "Autre") : [],
    datasets: [{ data: stats.graph ? stats.graph.map(g => g.value) : [], backgroundColor: ['#2e7d32','#ed1c24','#0054a6','#ff9800','#9c27b0'] }]
  };

  if (!user) {
    return (
      <div className="login-page">
        <form className="login-card" onSubmit={async (e)=>{e.preventDefault(); try { const r=await axios.post(`${API}/login`, {username:loginData.user, password:loginData.pass}); setUser(r.data.user); } catch(e){alert("Identifiants incorrects");}}}>
          <h1>🚜 AGRI-TCHAD</h1>
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
        <div className="nav-left">{translations[lang].welcome}, <strong>{user.nom_utilisateur}</strong> ({user.role})</div>
        <div className="nav-center"><h1>{translations[lang].title}</h1></div>
        <div className="nav-right">
            <select onChange={(e)=>setLang(e.target.value)} className="lang-s"><option value="fr">FR</option><option value="ar">AR</option></select>
            <button onClick={()=>setUser(null)} className="logout">QUITTER</button>
        </div>
      </nav>

      <div className="dashboard-stats">
        <div className="stat-v">👥 {stats.total_p} Producteurs</div>
        <div className="stat-v">💰 {Number(stats.total_f).toLocaleString()} F</div>
        <div className="chart-v"><Pie data={chartData} options={{maintainAspectRatio:false}} /></div>
        <div className="tabs-main">
            <button onClick={()=>setTab('gestion')} className={tab==='gestion'?'active':''}>{translations[lang].tab1}</button>
            <button onClick={()=>setTab('market')} className={tab==='market'?'active':''}>{translations[lang].tab2}</button>
        </div>
      </div>

      <main className="main">
        {tab === 'gestion' ? (
          <>
            {(user.role === 'ADMIN' || user.role === 'COOPERATIVE') && (
              <form className="form-in" onSubmit={async (e)=>{e.preventDefault(); await axios.post(`${API}/agriculteurs`, form); load();}}>
                <input placeholder="Nom" onChange={e=>setForm({...form, nom:e.target.value})} required />
                <input placeholder="Zone" onChange={e=>setForm({...form, zone:e.target.value})} required />
                <input placeholder="Surface (Ha)" type="number" onChange={e=>setForm({...form, surface:e.target.value})} required />
                <button type="submit">INSCRIRE</button>
              </form>
            )}

            <div className="grid">
              {farmers.map(f => (
                <div key={f.id} className="pro-card">
                  <div className="card-h"><h3>{f.nom.toUpperCase()}</h3> <span className="badge">#TD-{f.id}</span></div>
                  <button className="gps-btn" onClick={()=>window.open(`https://maps.google.com/?q=${f.latitude},${f.longitude}`)}>📍 LOCALISER GPS</button>
                  <p>🌾 {f.culture} | IA: {f.solvabilite}%</p>
                  
                  {/* LE TRAIT VERT (Module 3.5) */}
                  <div className="progress-zone">
                    <div className="bar-bg"><div className="bar-fill" style={{width: `${f.etape_actuelle * 10}%`}}></div></div>
                    <select value={f.etape_actuelle} onChange={async (e)=>{await axios.post(`${API}/update-etape`, {id: f.id, etape: e.target.value}); load();}}>
                        {etapes.map((et, i) => <option key={i} value={i+1}>{i+1}. {et}</option>)}
                    </select>
                  </div>

                  <div className="finance-btns">
                    <button className="b-airtel" onClick={()=>axios.post(`${API}/finances`, {id:f.id, montant:5000, type:'Crédit'}).then(()=>load())}>Airtel 5000</button>
                    <button className="b-moov" onClick={()=>axios.post(`${API}/finances`, {id:f.id, montant:50000, type:'Crédit'}).then(()=>load())}>Moov 50000</button>
                    <button className="b-tontine" onClick={()=>axios.post(`${API}/finances`, {id:f.id, montant:2000, type:'Tontine'}).then(()=>load())}>Tontine 2000</button>
                    <button className="b-vendre" onClick={async ()=>{const p=prompt("Prix?"); const q=prompt("Qté?"); if(p&&q){await axios.post(`${API}/marketplace`, {id:f.id, produit:f.culture, prix:p, qte:q}); load();}}}>VENDRE RÉCOLTE</button>
                  </div>
                </div>
              ))}
            </div>
          </>
        ) : (
          <div className="market-list">
            {market.map(m => (
              <div key={m.id} className="m-item">
                <strong>{m.nom_produit}</strong> - {m.prix} F/KG (Vendeur: {m.vendeur})
                <button onClick={()=>window.open(`https://wa.me/${m.telephone}`)} className="btn-wa">WhatsApp</button>
              </div>
            ))}
          </div>
        )}
      </main>
    </div>
  );
}

export default App;