import React, { useState, useEffect } from 'react';
import axios from 'axios';
import './App.css';

function App() {
  const [user, setUser] = useState(null); // Authentification réelle
  const [tab, setTab] = useState('gestion');
  const [farmers, setFarmers] = useState([]);
  const [market, setMarket] = useState([]);
  const [stats, setStats] = useState({ total_p: 0 });
  const [loginData, setLoginData] = useState({ user: '', pass: '' });
  
  const API = "https://agri-tchad-backend.onrender.com/api";
  const etapes = ["Préparation des sols", "Semis", "Fertilisation", "Irrigation", "Traitements", "Récolte", "Stockage", "Transformation", "Vente", "Livraison"];

  useEffect(() => { if(user) load(); }, [user, tab]);

  const load = async () => {
    const r1 = await axios.get(`${API}/agriculteurs`);
    const r2 = await axios.get(`${API}/stats`);
    const r3 = await axios.get(`${API}/marketplace`);
    setFarmers(r1.data);
    setStats(r2.data);
    setMarket(r3.data);
  };

  const handleLogin = async (e) => {
    e.preventDefault();
    try {
      const res = await axios.post(`${API}/login`, { username: loginData.user, password: loginData.pass });
      setUser(res.data.user);
    } catch (err) { alert("Identifiants incorrects"); }
  };

  // 1. PAGE DE CONNEXION RÉELLE (Module 3.10)
  if (!user) {
    return (
      <div className="login-page">
        <form className="login-card" onSubmit={handleLogin}>
          <div className="logo">🚜</div>
          <h2>AGRI-TCHAD LOGIN</h2>
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
        <div className="user-info">👤 {user.nom_utilisateur} ({user.role})</div>
        <div className="tabs">
          <button onClick={() => setTab('gestion')} className={tab === 'gestion' ? 'active' : ''}>GESTION</button>
          <button onClick={() => setTab('market')} className={tab === 'market' ? 'active' : ''}>MARCHÉ</button>
        </div>
        <button onClick={() => setUser(null)} className="logout-btn">SORTIR</button>
      </nav>

      <main className="main">
        {tab === 'gestion' ? (
          <div className="grid">
            {farmers.map(f => (
              <div key={f.id} className="pro-card">
                <h3>{f.nom.toUpperCase()} <span className="id-tag">#TD-{f.id}</span></h3>
                <button className="gps-btn">📍 GPS PARCELLE</button>
                <p>🌾 {f.culture} | IA: {f.solvabilite}%</p>
                
                {/* LE TRAIT VERT (Module 3.5) */}
                <div className="progress-container">
                  <div className="progress-text">Étape: {f.etape_actuelle}/10</div>
                  <div className="bar-bg">
                    <div className="bar-fill" style={{ width: `${f.etape_actuelle * 10}%` }}></div>
                  </div>
                  <select value={f.etape_actuelle} onChange={async (e)=>{await axios.post(`${API}/update-etape`, {id: f.id, etape: e.target.value}); load();}}>
                    {etapes.map((et, i) => <option key={i} value={i+1}>{i+1}. {et}</option>)}
                  </select>
                </div>

                <div className="btns-fin">
                  <button className="b-airtel">Airtel 5000</button>
                  <button className="b-moov">Moov 50000</button>
                </div>
                <button className="b-vendre" onClick={async () => {
                  const p = prompt("Prix ?"); const q = prompt("Qté ?");
                  if(p && q) { await axios.post(`${API}/marketplace`, { agriculteur_id: f.id, produit: f.culture, prix: p, quantite: q }); load(); }
                }}>VENDRE LA RÉCOLTE</button>
              </div>
            ))}
          </div>
        ) : (
          <div className="market-list">
            <h2>🛒 Marché Agricole Tchadien (Module 3.7)</h2>
            {market.length === 0 ? <p>Aucun produit en vente.</p> : market.map(m => (
              <div key={m.id} className="m-item">
                <strong>{m.nom_produit}</strong> - {m.prix} F/KG (Stock: {m.quantite} KG)
                <br/><small>Vendeur: {m.vendeur} | 📱 {m.telephone}</small>
              </div>
            ))}
          </div>
        )}
      </main>
    </div>
  );
}

export default App;