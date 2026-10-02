"""Aurum analytics service.

* A background thread consumes appointment events from Kafka and keeps event counters in MongoDB.
* GET /analytics/summary aggregates the appointments collection (written by the Java API) for the dashboard.
"""
import json
import logging
import os
import threading
import time
from contextlib import asynccontextmanager
from datetime import datetime, timezone

from fastapi import FastAPI
from kafka import KafkaConsumer
from pymongo import MongoClient

log = logging.getLogger("aurum.analytics")
logging.basicConfig(level=logging.INFO, format="%(asctime)s %(levelname)s %(name)s: %(message)s")

MONGO_URI = os.getenv("MONGO_URI", "mongodb://localhost:27017/aurum")
KAFKA_BOOTSTRAP = os.getenv("KAFKA_BOOTSTRAP", "localhost:9094")
TOPIC = os.getenv("KAFKA_TOPIC", "appointment-events")

client = MongoClient(MONGO_URI, serverSelectionTimeoutMS=5000)
db = client.get_default_database(default="aurum")

_stop = threading.Event()


def record_event(event: dict) -> None:
    """Count one event by type (CREATED, STATUS_CHANGED, DELETED)."""
    etype = str(event.get("type") or "UNKNOWN")
    db.analytics_events.update_one(
        {"_id": etype},
        {"$inc": {"count": 1}, "$set": {"lastAt": datetime.now(timezone.utc)}},
        upsert=True,
    )


def consume_forever() -> None:
    """Keep trying to connect to Kafka; the broker may still be starting when this service boots."""
    while not _stop.is_set():
        try:
            consumer = KafkaConsumer(
                TOPIC,
                bootstrap_servers=KAFKA_BOOTSTRAP,
                group_id="aurum-analytics",
                auto_offset_reset="earliest",
                enable_auto_commit=True,
                value_deserializer=lambda b: json.loads(b.decode("utf-8")),
                consumer_timeout_ms=1000,
            )
            log.info("Connected to Kafka at %s, topic %s", KAFKA_BOOTSTRAP, TOPIC)
            while not _stop.is_set():
                for msg in consumer:  # ends after consumer_timeout_ms without messages
                    try:
                        record_event(msg.value)
                    except Exception as ex:  # keep consuming even if one event is bad
                        log.warning("Could not record event: %s", ex)
                    if _stop.is_set():
                        break
            consumer.close()
        except Exception as ex:
            log.warning("Kafka not available yet (%s). Retrying in 5 seconds.", ex)
            _stop.wait(5)


@asynccontextmanager
async def lifespan(_app: FastAPI):
    t = threading.Thread(target=consume_forever, name="kafka-consumer", daemon=True)
    t.start()
    yield
    _stop.set()


app = FastAPI(title="Aurum analytics", lifespan=lifespan)


def _group(field: str) -> list:
    rows = db.appointments.aggregate([
        {"$match": {"status": {"$ne": "Cancelled"}}},
        {"$group": {"_id": f"${field}", "count": {"$sum": 1}}},
        {"$sort": {"count": -1, "_id": 1}},
    ])
    return [{"name": r["_id"] or "Unknown", "count": r["count"]} for r in rows]


@app.get("/analytics/health")
def health() -> dict:
    return {"status": "UP"}


@app.get("/analytics/summary")
def summary() -> dict:
    events = {d["_id"]: d["count"] for d in db.analytics_events.find()}
    return {
        "total": db.appointments.count_documents({"status": {"$ne": "Cancelled"}}),
        "byTreatment": _group("service"),
        "byDoctor": _group("doctor"),
        "events": events,
    }
