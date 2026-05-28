import 'package:flutter/material.dart';
import 'package:http/http.dart' as http;
import 'dart:convert';
import 'package:url_launcher/url_launcher.dart';

void main() => runApp(AgriTchadMobile());

class AgriTchadMobile extends StatelessWidget {
  @override
  Widget build(BuildContext context) {
    return MaterialApp(
      debugShowCheckedModeBanner: false,
      theme: ThemeData(primaryColor: Color(0xFF1B5E20)),
      home: MainScreen(),
    );
  }
}

class MainScreen extends StatefulWidget {
  @override
  _MainScreenState createState() => _MainScreenState();
}

class _MainScreenState extends State<MainScreen> {
  int _currentIndex = 0;
  String _lang = 'fr';
  final String baseUrl = "http://192.168.1.238:5000/api";

  final Map<String, dynamic> _text = {
    'fr': {
      'title': 'AGRI-TCHAD : SMART MOBILE',
      'tab1': 'Gestion',
      'tab2': 'Marché',
    },
    'ar': {
      'title': 'المنصة الزراعية الذكية',
      'tab1': 'الإدارة',
      'tab2': 'السوق',
    },
  };

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        title: Text(_text[_lang]['title'], style: TextStyle(fontSize: 14)),
        backgroundColor: Color(0xFF1B5E20),
        actions: [
          TextButton(
            onPressed: () =>
                setState(() => _lang = _lang == 'fr' ? 'ar' : 'fr'),
            child: Text(
              _lang == 'fr' ? "AR" : "FR",
              style: TextStyle(
                color: Colors.white,
                fontWeight: FontWeight.bold,
              ),
            ),
          ),
        ],
      ),
      body: _currentIndex == 0
          ? GestionTab(lang: _lang, baseUrl: baseUrl)
          : MarketTab(lang: _lang, baseUrl: baseUrl),
      bottomNavigationBar: BottomNavigationBar(
        currentIndex: _currentIndex,
        onTap: (index) => setState(() => _currentIndex = index),
        selectedItemColor: Color(0xFF1B5E20),
        items: [
          BottomNavigationBarItem(
            icon: Icon(Icons.group),
            label: _text[_lang]['tab1'],
          ),
          BottomNavigationBarItem(
            icon: Icon(Icons.shopping_cart),
            label: _text[_lang]['tab2'],
          ),
        ],
      ),
    );
  }
}

class GestionTab extends StatefulWidget {
  final String lang;
  final String baseUrl;
  GestionTab({required this.lang, required this.baseUrl});
  @override
  _GestionTabState createState() => _GestionTabState();
}

class _GestionTabState extends State<GestionTab> {
  List farmers = [];
  final List<String> etapes = [
    "1. Préparation",
    "2. Semis",
    "3. Fertilisation",
    "6. Récolte",
    "10. Livraison",
  ];

  fetchData() async {
    final res = await http.get(Uri.parse("${widget.baseUrl}/agriculteurs"));
    if (res.statusCode == 200) setState(() => farmers = json.decode(res.body));
  }

  // FONCTION PAIEMENT RÉPARÉE
  Future<void> _payer(int id, String op, double montant, String type) async {
    await http.post(
      Uri.parse("${widget.baseUrl}/finances"),
      headers: {"Content-Type": "application/json"},
      body: jsonEncode({
        "agriculteur_id": id,
        "type_transaction": type,
        "montant": montant,
        "operateur": op,
      }),
    );
    ScaffoldMessenger.of(context).showSnackBar(
      SnackBar(content: Text("✅ $op : $montant FCFA enregistré !")),
    );
    fetchData();
  }

  // FONCTION VENTE RÉPARÉE
  void _vendreDialog(int id, String culture) {
    String prix = "", qte = "";
    showDialog(
      context: context,
      builder: (ctx) => AlertDialog(
        title: Text("Vendre : $culture"),
        content: Column(
          mainAxisSize: MainAxisSize.min,
          children: [
            TextField(
              decoration: InputDecoration(labelText: "Prix (FCFA/KG)"),
              keyboardType: TextInputType.number,
              onChanged: (v) => prix = v,
            ),
            TextField(
              decoration: InputDecoration(labelText: "Quantité (KG)"),
              keyboardType: TextInputType.number,
              onChanged: (v) => qte = v,
            ),
          ],
        ),
        actions: [
          TextButton(
            onPressed: () => Navigator.pop(ctx),
            child: Text("Annuler"),
          ),
          ElevatedButton(
            onPressed: () async {
              await http.post(
                Uri.parse("${widget.baseUrl}/marketplace"),
                headers: {"Content-Type": "application/json"},
                body: jsonEncode({
                  "agriculteur_id": id,
                  "produit": culture,
                  "prix": prix,
                  "quantite": qte,
                }),
              );
              Navigator.pop(ctx);
              ScaffoldMessenger.of(
                context,
              ).showSnackBar(SnackBar(content: Text("📦 Ajouté au Marché !")));
            },
            child: Text("Publier"),
          ),
        ],
      ),
    );
  }

  @override
  void initState() {
    super.initState();
    fetchData();
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      body: ListView.builder(
        itemCount: farmers.length,
        itemBuilder: (context, index) {
          final f = farmers[index];
          String current = etapes.contains(f['etape']) ? f['etape'] : etapes[0];
          return Card(
            margin: EdgeInsets.all(8),
            child: ExpansionTile(
              title: Text(
                f['nom'],
                style: TextStyle(
                  fontWeight: FontWeight.bold,
                  color: Color(0xFF1B5E20),
                ),
              ),
              subtitle: Text("${f['zone']} | IA: ${f['solvabilite']}%"),
              children: [
                Padding(
                  padding: EdgeInsets.all(15),
                  child: Column(
                    children: [
                      ElevatedButton.icon(
                        icon: Icon(Icons.map),
                        label: Text("GPS PARCELLE"),
                        onPressed: () => launchUrl(
                          Uri.parse(
                            "https://www.google.com/maps/search/?api=1&query=${f['latitude']},${f['longitude']}",
                          ),
                        ),
                        style: ElevatedButton.styleFrom(
                          backgroundColor: Colors.blueGrey,
                          minimumSize: Size(double.infinity, 35),
                        ),
                      ),
                      SizedBox(height: 10),
                      Row(
                        children: [
                          Expanded(
                            child: ElevatedButton(
                              onPressed: () =>
                                  _payer(f['id'], 'Airtel', 5000, 'Crédit'),
                              child: Text("AIRTEL"),
                              style: ElevatedButton.styleFrom(
                                backgroundColor: Colors.red,
                              ),
                            ),
                          ),
                          SizedBox(width: 5),
                          Expanded(
                            child: ElevatedButton(
                              onPressed: () =>
                                  _payer(f['id'], 'Moov', 50000, 'Crédit'),
                              child: Text("MOOV"),
                              style: ElevatedButton.styleFrom(
                                backgroundColor: Colors.blue[900],
                              ),
                            ),
                          ),
                          SizedBox(width: 5),
                          Expanded(
                            child: ElevatedButton(
                              onPressed: () =>
                                  _payer(f['id'], 'Épargne', 2000, 'Tontine'),
                              child: Text("TONTINE"),
                              style: ElevatedButton.styleFrom(
                                backgroundColor: Colors.orange[800],
                              ),
                            ),
                          ),
                        ],
                      ),
                      SizedBox(height: 10),
                      ElevatedButton.icon(
                        icon: Icon(Icons.store),
                        label: Text("VENDRE LA RÉCOLTE"),
                        onPressed: () => _vendreDialog(f['id'], f['culture']),
                        style: ElevatedButton.styleFrom(
                          backgroundColor: Colors.green[900],
                          minimumSize: Size(double.infinity, 40),
                        ),
                      ),
                    ],
                  ),
                ),
              ],
            ),
          );
        },
      ),
      floatingActionButton: FloatingActionButton(
        onPressed: () => fetchData(),
        child: Icon(Icons.refresh),
        backgroundColor: Color(0xFF1B5E20),
      ),
    );
  }
}

class MarketTab extends StatefulWidget {
  final String lang;
  final String baseUrl;
  MarketTab({required this.lang, required this.baseUrl});
  @override
  _MarketTabState createState() => _MarketTabState();
}

class _MarketTabState extends State<MarketTab> {
  List products = [];
  fetchM() async {
    final res = await http.get(Uri.parse("${widget.baseUrl}/marketplace"));
    if (res.statusCode == 200) setState(() => products = json.decode(res.body));
  }

  @override
  void initState() {
    super.initState();
    fetchM();
  }

  @override
  Widget build(BuildContext context) {
    return RefreshIndicator(
      onRefresh: () => fetchM(),
      child: GridView.builder(
        padding: EdgeInsets.all(10),
        gridDelegate: SliverGridDelegateWithFixedCrossAxisCount(
          crossAxisCount: 2,
          childAspectRatio: 0.75,
        ),
        itemCount: products.length,
        itemBuilder: (context, index) {
          final p = products[index];
          return Card(
            elevation: 5,
            child: Column(
              mainAxisAlignment: MainAxisAlignment.center,
              children: [
                Icon(Icons.eco, size: 40, color: Colors.green),
                Text(
                  p['nom_produit'],
                  style: TextStyle(fontWeight: FontWeight.bold),
                ),
                Text(
                  "${p['prix']} F/KG",
                  style: TextStyle(
                    color: Colors.green,
                    fontWeight: FontWeight.bold,
                  ),
                ),
                Text("Stock: ${p['quantite_stock']} KG"),
                IconButton(
                  onPressed: () =>
                      launchUrl(Uri.parse("https://wa.me/${p['telephone']}")),
                  icon: Icon(Icons.chat, color: Colors.green),
                ),
              ],
            ),
          );
        },
      ),
    );
  }
}
