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
  
  const [formData, setFormData] = useState({ nom: '', zone: '', culture: 'Maïs', telephone: '' });
  const [autreCulture, setAutreCulture] = useState('');

  const translations = {
    fr: { title: "PLATEFORME AGRICOLE INTELLIGENTE DU TCHAD", tab1: "GESTION & FINANCE", tab2: "MARCHÉ AGRICOLE" },
    ar: { title: "المنصة الزراعية الذكية في تشاد", tab1: "الإدارة والتمويل", tab2: "السوق الزراعي" }
  };

  useEffect(() => { fetchData(); }, [tab]);

  const fetchData = async () => {
    const resF = await axios.get('http://localhost:5000/api/agriculteurs');
    const resS = await axios.get('http://localhost:5000/api/stats-globales');
    const resG = await axios.get('http://localhost:5000/api/stats-graphique');
    const resM = await axios.get('http://localhost:5000/api/marketplace');
    setFarmers(resF.data); setStats(resS.data); setMarket(resM.data);
    setGraphData({
      labels: resG.data.map(d => d.label),
      datasets: [{ data: resG.data.map(d => d.value), backgroundColor: ['#2e7d32', '#ed1c24', '#0054a6', '#ffc107'] }]
    });
  };

  const effectuerPaiement = async (id, op, montant) => {
    await axios.post('http://localhost:5000/api/finances', { agriculteur_id: id, type: 'Paiement', montant, operateur: op });
    alert("Succès : " + op + " de " + montant + " FCFA enregistré !");
    fetchData(); // Rafraîchit le compteur FCFA
  };

  const mettreEnVente = async (id, culture) => {
    const prix = prompt("Prix au KG ?");
    const qte = prompt("Quantité (KG) ?");
    if(prix && qte) {
      await axios.post('https://agri-tchad-backend.onrender.com/api/marketplace', { id, produit: culture, prix, qte });
      alert("Produit ajouté au marché !"); fetchData();
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const cultureFinale = formData.culture === 'Autre' ? autreCulture : formData.culture;
    await axios.post('http://localhost:5000/api/agriculteurs', { ...formData, culture: cultureFinale });
    setFormData({ nom: '', zone: '', culture: 'Maïs', telephone: '' }); setAutreCulture('');
    fetchData();
  };

  return (
    <div className="app-container">
      <nav className="navbar">
        <div className="nav-row-1"><h1>{translations[lang].title}</h1></div>
        <div className="nav-row-2">
            <div className="nav-left">
                <select onChange={(e) => setLang(e.target.value)} className="lang-select">
                    <option value="fr">Français</option><option value="ar">العربية</option>
                </select>
                <button className="logout-btn">Déconnexion</button>
            </div>
            <div className="tabs">
              <button onClick={() => setTab('gestion')} className={tab === 'gestion' ? 'active' : ''}>{translations[lang].tab1}</button>
              <button onClick={() => setTab('market')} className={tab === 'market' ? 'active' : ''}>{translations[lang].tab2}</button>
            </div>
        </div>
      </nav>

      <div className="dashboard-stats">
        <div className="stat-i">👥 {stats.total_p} Producteurs</div>
        <div className="stat-i">💰 {Number(stats.total_f).toLocaleString()} FCFA</div>
        <div className="chart-i"><Pie data={graphData} options={{maintainAspectRatio: false}} /></div>
      </div>

      <main className="main-content">
        {tab === 'gestion' ? (
          <>
            <form className="agri-form" onSubmit={handleSubmit}>
              <input placeholder="Nom" value={formData.nom} onChange={e=>setFormData({...formData, nom:e.target.value})} required />
              <input placeholder="Zone" value={formData.zone} onChange={e=>setFormData({...formData, zone:e.target.value})} required />
              <input placeholder="Téléphone" value={formData.telephone} onChange={e=>setFormData({...formData, telephone:e.target.value})} required />
              <select value={formData.culture} onChange={e=>setFormData({...formData, culture:e.target.value})}>
                <option value="Maïs">Maïs</option><option value="Riz">Riz</option><option value="Arachide">Arachide</option><option value="Autre">Autre...</option>
              </select>
              {formData.culture === 'Autre' && <input placeholder="Nom du grain..." onChange={e=>setAutreCulture(e.target.value)} required />}
              <button type="submit">S'inscrire</button>
            </form>

            <div className="grid">
              {farmers.map(f => (
                <div key={f.id} className="card">
                  <h3>{f.nom}</h3>
                  <p>📍 GPS: {f.latitude} | 🌾 {f.culture}</p>
                  <select className="prod-select" value={f.etape} onChange={async (e) => { await axios.post('http://localhost:5000/api/update-production', {id: f.id, etape: e.target.value}); fetchData(); }}>
                    <option value="1. Préparation">1. Préparation</option><option value="2. Semis">2. Semis</option><option value="6. Récolte">6. Récolte</option>
                  </select>
                  <div className="btns">
                    <button onClick={() => effectuerPaiement(f.id, 'Airtel', 5000)} className="btn-a">Airtel 5000</button>
                    <button onClick={() => effectuerPaiement(f.id, 'Moov', 50000)} className="btn-m">Moov 50000</button>
                  </div>
                  <button onClick={() => mettreEnVente(f.id, f.culture)} className="btn-v">Vendre la récolte</button>
                </div>
              ))}
            </div>
          </>
        ) : (
          <div className="market-grid">
            {market.map(m => (
              <div key={m.id} className="m-card">
                <h3>{m.nom_produit}</h3>
                <p className="price">{m.prix} F / KG</p>
                <p>Stock: {m.quantite_stock} KG | Vendeur: {m.vendeur}</p>
                <button onClick={() => window.open(`https://wa.me/${m.telephone}`)} className="btn-wa">Contacter via WhatsApp</button>
              </div>
            ))}
          </div>
        )}
      </main>
    </div>
  );
}

export default App;