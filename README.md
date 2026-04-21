# TranspoBot — Projet DIC1 ESP/UCAD

## Démarrage rapide

1. Créer la base de données :
   mysql -u root -p < schema.sql

2. Configurer l'environnement :
   cp .env.example .env
   # Éditer .env avec vos valeurs

3. Installer les dépendances backend :
   pip install -r backend/requirements.txt

4. Lancer le backend :
   python -m uvicorn backend.app:app --host 0.0.0.0 --port 8001

5. Lancer le frontend (React/Vite) :
   cd frontend
   npm install
   npm run dev

6. Ouvrir l'interface :
   http://localhost:5173
   (l'API est appelée via `/api/*` et proxy vers le backend sur `8001`)

## Livrables à rendre
- Lien plateforme déployée (Railway/Render)
- Lien interface de chat
- Rapport PDF (MCD, MLD, architecture, tests)
- Présentation PowerPoint (démo)

## Technologies
- Backend : FastAPI (Python)
- Base de données : MySQL
- LLM : OpenAI GPT / Ollama (local)
- Frontend : React (Vite)
