import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { Chart as ChartJS, ArcElement, Tooltip, Legend } from 'chart.js';
import { Pie } from 'react-chartjs-2';
import './App.css';

ChartJS.register(ArcElement, Tooltip, Legend);

function App() {
  const [tab, setTab] = useState('gestion'); 
  const [lang, setLang] = useState('fr');
  const [farmers, setFarmers] = useState([]);
  const [market, setMarket] = useState([]);
  const [stats, setStats] = useState({ total_p: 0, total_f: 0 });
  const [graphData, setGraphData] = useState({ labels: [], datasets: [] });
  
  // États du formulaire
  const [formData, setFormData] = useState({ nom: '', zone: '', culture: 'Maïs', telephone: '' });
  const [autreCulture, setAutreCulture] = useState('');

  const API_URL = "https://agri-tchad-backend.onrender.com/api";

  const etapesPDF = [
    "1. Préparation des sols", "2. Semis", "3. Fertilisation", "4. Irrigation", 
    "5. Traitements", "6. Récolte", "7. Stockage", "8. Transformation", 
    "9. Commercialisation", "10. Livraison"
  ];

  const listeGraines = ["Maïs", "Riz", "Arachide", "Sorgho", "Sésame", "Coton", "Autre"];

  useEffect(() => { fetchData(); }, [tab]);

  const fetchData = async () => {
    try {
        const resF = await axios.get(`${API_URL}/agriculteurs`);
        const resS = await axios.get(`${API_URL}/stats-globales`);
        const resG = await axios.get(`${API_URL}/stats-graphique`);
        const resM = await axios.get(`${API_URL}/marketplace`);
        setFarmers(resF.data); setStats(resS.data); setMarket(resM.data);
        setGraphData({
          labels: resG.data.map(d => d.label),
          datasets: [{ data: resG.data.map(d => d.value), backgroundColor: ['#2e7d32', '#ed1c24', '#0054a6', '#ff9800', '#9c27b0'] }]
        });
    } catch (e) { console.log("Erreur de connexion"); }
  };

  const payer = async (id, op, montant, type) => {
    await axios.post(`${API_URL}/finances`, { agriculteur_id: id, type_transaction: type, montant, operateur: op });
    alert(`Succès : ${type} enregistré !`);
    fetchData(); 
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const cultureFinale = formData.culture === 'Autre' ? autreCulture : formData.culture;
    await axios.post(`${API_URL}/agriculteurs`, { ...formData, culture: cultureFinale });
    setFormData({ nom: '', zone: '', culture: 'Maïs', telephone: '' });
    setAutreCulture('');
    fetchData();
  };

  const mettreEnVente = async (id, culture) => {
    const prix = prompt("Prix au KG ?");
    const qte = prompt("Quantité (KG) ?");
    if(prix && qte) {
      await axios.post(`${API_URL}/marketplace`, { agriculteur_id: id, produit: culture, prix, quantite: qte });
      alert("Produit ajouté au marché !"); fetchData();
    }
  };

  return (
    <div className="app-container">
      <nav className="navbar">
        <div className="nav-row-1"><h1>PLATEFORME AGRICOLE INTELLIGENTE DU TCHAD</h1></div>
        <div className="nav-row-2">
            <div className="nav-left">
                <select onChange={(e) => setLang(e.target.value)} className="lang-select">
                    <option value="fr">Français</option><option value="ar">العربية</option>
                </select>
                <button className="logout-btn">Déconnexion</button>
            </div>
            <div className="tabs">
              <button onClick={() => setTab('gestion')} className={tab === 'gestion' ? 'active' : ''}>GESTION & FINANCE</button>
              <button onClick={() => setTab('market')} className={tab === 'market' ? 'active' : ''}>MARCHÉ AGRICOLE</button>
            </div>
        </div>
      </nav>

      <div className="dashboard-stats">
        <div className="stat-item">👥 <strong>{stats.total_p}</strong> Producteurs</div>
        <div className="stat-item">💰 <strong>{Number(stats.total_f).toLocaleString()}</strong> FCFA en circulation</div>
        <div className="chart-area">
            {graphData.labels.length > 0 ? <Pie data={graphData} options={{maintainAspectRatio: false}} /> : <small>IA Stats</small>}
        </div>
      </div>

      <main className="main-content">
        {tab === 'gestion' ? (
          <>
            {/* FORMULAIRE AVEC CHOIX DES GRAINES (Module 3.1) */}
            <form className="agri-form" onSubmit={handleSubmit}>
              <input placeholder="Nom" value={formData.nom} onChange={e=>setFormData({...formData, nom:e.target.value})} required />
              <input placeholder="Zone" value={formData.zone} onChange={e=>setFormData({...formData, zone:e.target.value})} required />
              <input placeholder="Téléphone" value={formData.telephone} onChange={e=>setFormData({...formData, telephone:e.target.value})} required />
              
              <select value={formData.culture} onChange={e=>setFormData({...formData, culture:e.target.value})} className="grain-select">
                {listeGraines.map(g => <option key={g} value={g}>{g}</option>)}
              </select>

              {formData.culture === 'Autre' && (
                <input placeholder="Quelle culture ?" value={autreCulture} onChange={e=>setAutreCulture(e.target.value)} required className="autre-input" />
              )}

              <button type="submit">S'inscrire</button>
            </form>

            <div className="grid">
              {farmers.map(f => (
                <div key={f.id} className="card">
                  <div className="card-header">
                    <h3>{f.nom}</h3>
                    <span className="id-badge">#TD-{f.id}</span>
                  </div>
                  <p className="gps-row">
                    <a href={`https://www.google.com/maps/search/?api=1&query=${f.latitude},${f.longitude}`} target="_blank" rel="noreferrer">📍 Localiser la parcelle (GPS)</a>
                  </p>
                  <p>🌾 Culture: <strong>{f.culture}</strong> | IA: <strong>{f.solvabilite}%</strong></p>
                  
                  <select className="prod-select" value={f.etape} onChange={async (e) => { await axios.post(`${API_URL}/update-production`, {id: f.id, etape: e.target.value}); fetchData(); }}>
                    {etapesPDF.map(e => <option key={e} value={e}>{e}</option>)}
                  </select>

                  <div className="btns-finance">
                    <button onClick={() => payer(f.id, 'Airtel', 5000, 'Crédit')} className="btn-a">Airtel 5000</button>
                    <button onClick={() => payer(f.id, 'Moov', 50000, 'Crédit')} className="btn-m">Moov 50000</button>
                    <button onClick={() => payer(f.id, 'Épargne', 2000, 'Tontine')} className="btn-t">Tontine 2000</button>
                  </div>
                  <button onClick={() => mettreEnVente(f.id, f.culture)} className="btn-vendre-main">Vendre la récolte</button>
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
                <button onClick={() => window.open(`https://wa.me/${m.telephone}`)} className="btn-wa">WhatsApp</button>
              </div>
            ))}
          </div>
        )}
      </main>
    </div>
  );
}

export default App;