# AI-SOC - Autonomous AI Security Operations Center

A proof-of-concept security monitoring and incident response platform that combines AI-driven threat detection with automated incident response.

## Features

- **AI Threat Detection** – ML-based phishing detection, anomaly detection, threat classification, and risk scoring (scikit-learn)
- **Pattern-Based Detection** – Rule engines for brute force, port scans, malware signatures, phishing emails, and user behavior analytics
- **SOAR Engine** – Automated incident response with severity-based escalation, IP blocking, and account management
- **Real-Time Dashboard** – Next.js frontend with live threat feeds, charts, and network visualization
- **Log Simulation** – Background synthetic log generation for demo and development

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Backend | FastAPI, Pydantic, Motor (async MongoDB) |
| Frontend | Next.js 15, React 18, TypeScript, Tailwind CSS, Recharts |
| ML/AI | scikit-learn, pandas, NumPy |
| Database | MongoDB (optional – falls back to in-memory store) |

## Getting Started

### Prerequisites

- Python 3.10+
- Node.js 18+
- MongoDB (optional)

### Backend

```bash
cd backend
pip install -r requirements.txt
cp .env.example .env   # edit as needed
python main.py         # starts on http://localhost:8000
```

### Frontend

```bash
cd frontend
npm install
npm run dev            # starts on http://localhost:3000
```

Set `NEXT_PUBLIC_API_URL` if the backend runs on a different host (defaults to `http://localhost:8000`).

## Project Structure

```
├── backend/
│   ├── ai_models/           # ML models (phishing, anomaly, risk scoring)
│   ├── api/                 # REST routes & log simulator
│   ├── database/            # Pydantic models, MongoDB connection, seed data
│   ├── detection_engine/    # Pattern-based threat detectors
│   ├── incident_response/   # SOAR engine, IP blocker, notifier, reports
│   ├── main.py              # FastAPI entry point
│   └── requirements.txt
├── frontend/
│   ├── app/                 # Next.js pages (dashboard, threats, incidents, …)
│   ├── components/          # React components (charts, tables, sidebar, …)
│   └── lib/                 # API client & mock data
└── datasets/                # Sample logs, malware signatures, phishing emails
```

## License

This project is provided for educational and demonstration purposes.