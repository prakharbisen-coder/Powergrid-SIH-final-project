# ML Service for Power Grid Forecasting

This service provides machine learning predictions for material demand forecasting using a trained model.

## Setup

1. Create virtual environment:
```bash
python -m venv venv
venv\Scripts\activate  # On Windows
```

2. Install dependencies:
```bash
pip install -r requirements.txt
```

3. Run the service:
```bash
uvicorn main:app --reload --host 0.0.0.0 --port 8000
```

## API Endpoints

- `GET /` - Health check
- `POST /predict` - Make predictions
- `POST /train` - Train/retrain model
- `GET /model-info` - Get model information

## Integration with Node.js Backend

The Node.js backend can call this service at `http://localhost:8000` for ML predictions.
