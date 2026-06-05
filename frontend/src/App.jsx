import React, { useState, useEffect } from 'react';
import axios from 'axios';
import './App.css';

function App() {
  const [user, setUser] = useState(null);
  const [tab, setTab] = useState('gestion');
  const [farmers, setFarmers] = useState([]);
  const [market, setMarket] = useState([]);
  const [searchTerm, setSearchBar] = useState(""); // ZONE RECHERCHE
  const [loginData, setLoginData] = useState({ user: '', pass: '' });
  const [form, setForm] = useState({ nom: '', zone: '', telephone: '', culture: 'Maïs', surface_ha: 1 });
  const [showAdd, setShowAdd] = useState(false);

  const API = "https://agri-tchad-backend.onrender.com/api";
  const etapes = ["Préparation", "Semis", "Fertilisation", "Irrigation", "Traitements", "Récolte", "Stockage", "Transformation", "Vente", "Livraison"];

  useEffect(() => { if(user) load(); }, [user, tab]);

  const load = async () => {
    const r1 = await axios.get(`${API}/agriculteurs`);
    const r3 = await axios.get(`${API}/marketplace`);
    setFarmers(r1.data);
    setMarket(r3.data);
  };

  const handleLogin = async (e) => {
    e.preventDefault();
    try {
      const res = await axios.post(`${API}/login`, { username: loginData.user, password: loginData.pass });
      setUser(res.data.user);
    } catch (err) { alert("Identifiants incorrects (admin / admin123)"); }
  };

  // Filtrer les agriculteurs selon la recherche (Exigence)
  const filteredFarmers = farmers.filter(f => 
    f.nom.toLowerCase().includes(searchTerm.toLowerCase()) || 
    f.zone.toLowerCase().includes(searchTerm.toLowerCase())
  );

  // 1. PAGE DE CONNEXION PROFESSIONNELLE
  if (!user) {
    return (
      <div className="login-screen">
        <form className="login-card" onSubmit={handleLogin}>
          <div className="logo">🌱</div>
          <h2>PLATEFORME AGRI-TCHAD</h2>
          <p>Accès sécurisé réservé aux membres</p>
          <input placeholder="Nom d'utilisateur" onChange={e=>setLoginData({...loginData, user: e.target.value})} required />
          <input placeholder="Mot de passe" type="password" onChange={e=>setLoginData({...loginData, pass: e.target.value})} required />
          <button type="submit">SE CONNECTER</button>
        </form>
      </div>
    );
  }

  return (
    <div className="app-container">
      {/* NAVBAR AVEC BOUTON RETOUR (SORTIR) */}
      <nav className="navbar">
        <button onClick={() => setUser(null)} className="back-btn">⬅ RETOUR</button>
        <div className="user-label">👤 {user.nom_utilisateur} ({user.role})</div>
        <div className="tabs">
          <button onClick={() => setTab('gestion')} className={tab === 'gestion' ? 'active' : ''}>GESTION</button>
          <button onClick={() => setTab('market')} className={tab === 'market' ? 'active' : ''}>MARCHÉ</button>
        </div>
      </nav>

      <main className="main">
        {tab === 'gestion' ? (
          <>
            {/* ZONE DE RECHERCHE (Exigence) */}
            <div className="search-bar">
                <input type="text" placeholder="🔎 Rechercher un agriculteur ou une zone (Pala, Bongor...)" 
                       onChange={(e) => setSearchBar(e.target.value)} />
            </div>

            {showAdd && (
              <form className="form-add" onSubmit={async (e)=>{e.preventDefault(); await axios.post(`${API}/agriculteurs`, form); setShowAdd(false); load();}}>
                <h3>Nouvelle Inscription</h3>
                <input placeholder="Nom Complet" onChange={e=>setForm({...form, nom:e.target.value})} required />
                <input placeholder="Zone" onChange={e=>setForm({...form, zone:e.target.value})} required />
                <input placeholder="Téléphone" onChange={e=>setForm({...form, telephone:e.target.value})} required />
                <input placeholder="Surface (Hectares)" type="number" onChange={e=>setForm({...form, surface_ha:e.target.value})} required />
                <button type="submit">SAUVEGARDER DANS LA BASE</button>
                <button type="button" onClick={()=>setShowAdd(false)} className="cancel">ANNULER</button>
              </form>
            )}

            <div className="grid">
              {filteredFarmers.map(f => (
                <div key={f.id} className="farmer-card">
                  <div className="card-top">
                    <h3>{f.nom.toUpperCase()}</h3>
                    <span className="badge">#ID-{f.id}</span>
                  </div>
                  <p>📍 {f.zone} | 🌾 {f.culture}</p>
                  
                  {/* LE TRAIT VERT DE PROGRESSION (Module 3.5) */}
                  <div className="progress-box">
                    <p>Évolution : <strong>{etapes[f.etape_actuelle-1]}</strong></p>
                    <div className="trait-bg">
                      <div className="trait-vert" style={{ width: `${f.etape_actuelle * 10}%` }}></div>
                    </div>
                    <select value={f.etape_actuelle} onChange={async (e)=>{await axios.post(`${API}/update-etape`, {id: f.id, etape: e.target.value}); load();}}>
                      {etapes.map((et, i) => <option key={i} value={i+1}>{i+1}. {et}</option>)}
                    </select>
                  </div>

                  <div className="ia-score">Analyse IA : {f.solvabilite}%</div>

                  <div className="card-actions">
                    <button className="btn-v" onClick={async () => {
                      const p = prompt("Prix KG ?"); const q = prompt("Quantité ?");
                      if(p && q) { await axios.post(`${API}/marketplace`, { agriculteur_id: f.id, produit: f.culture, prix: p, quantite: q }); load(); }
                    }}>VENDRE RÉCOLTE</button>
                  </div>
                </div>
              ))}
            </div>
          </>
        ) : (
          <div className="market-container">
            <h2>🛒 Marché Agricole en Direct</h2>
            <div className="market-grid">
                {market.map(m => (
                <div key={m.id} className="market-card">
                    <h4>{m.nom_produit}</h4>
                    <p className="price">{m.prix} FCFA/KG</p>
                    <p>Stock : {m.quantite} KG</p>
                    <p className="seller">Vendeur : {m.vendeur}</p>
                </div>
                ))}
            </div>
          </div>
        )}
      </main>

      {tab === 'gestion' && <button className="add-fab" onClick={() => setShowAdd(true)}>+</button>}
    </div>
  );
}

export default App;