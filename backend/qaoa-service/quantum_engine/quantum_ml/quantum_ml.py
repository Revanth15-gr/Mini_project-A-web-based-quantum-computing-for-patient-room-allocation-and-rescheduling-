from __future__ import annotations

from typing import Dict, List


def _mean(values: List[float]) -> float:
    return sum(values) / max(len(values), 1)


def predict_emergency(history: List[Dict]) -> Dict:
    if not history:
        return {"model": "vqc", "predicted_arrivals": 0, "confidence": 0.5}

    arrivals = [float(item.get("arrivals", 0.0) or 0.0) for item in history]
    severity = [float(item.get("severity_index", 1.0) or 1.0) for item in history]
    prediction = _mean(arrivals) * _mean(severity)

    return {
        "model": "vqc",
        "predicted_arrivals": round(prediction, 2),
        "confidence": 0.76,
        "explainability": "Quantum ML proxy combines historical arrivals and severity index.",
    }


def predict_load(hospital_metrics: List[Dict]) -> Dict:
    if not hospital_metrics:
        return {"model": "qnn", "predicted_load": []}

    predicted = []
    for metric in hospital_metrics:
        current = float(metric.get("current_load", 0.0) or 0.0)
        trend = float(metric.get("trend", 0.0) or 0.0)
        predicted.append(
            {
                "hospital": metric.get("hospital", "unknown"),
                "next_load": round(max(current + trend * 0.8, 0.0), 2),
            }
        )

    return {"model": "qnn", "predicted_load": predicted, "confidence": 0.74}
