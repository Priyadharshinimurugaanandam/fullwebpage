# main.py ← FINAL FIXED VERSION
import os
import json
import logging
from datetime import datetime
from typing import List, Dict, Any

from fastapi import FastAPI, UploadFile, File, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from supabase import create_client
from dotenv import load_dotenv

# Load .env
load_dotenv()

SUPABASE_URL = os.getenv("SUPABASE_URL")
SUPABASE_KEY = os.getenv("SUPABASE_KEY")  # Use service_role key

if not SUPABASE_URL or not SUPABASE_KEY:
    raise ValueError("Missing Supabase credentials")

supabase = create_client(SUPABASE_URL, SUPABASE_KEY)

app = FastAPI()

# ADD THIS — ALLOW FRONTEND
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # Or ["http://localhost:5173"]
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

def parse_json_events(events: List[Dict[str, Any]]) -> Dict[str, Any]:
    row = {
        "procedure_name": "",
        "date": "",
        "time": "",
        "duration": 0,
        "surgeon_name": "",
        "surgeon_image": "/default-surgeon.jpg",
        "instruments_names": "",
        "instruments_durations": "",
        "clutch_names": "Clutch Pedal",
        "clutch_counts": "0",
    }

    start_time = None
    current_instrument = None
    instruments = {}

    for ev in events:
        if not isinstance(ev, dict): continue
        event_type = ev.get("event", "")
        value = ev.get("value", "")

        try:
            if event_type == "Surgery type selected":
                row["procedure_name"] = str(value)
            elif event_type == "Surgeon Name":
                row["surgeon_name"] = str(value)
            elif event_type == "Surgery started" and value:
                try:
                    dt = datetime.strptime(value, "%Y-%m-%d %H:%M:%S")
                    row["date"] = dt.strftime("%Y-%m-%d")
                    row["time"] = dt.strftime("%H:%M")
                    start_time = dt
                except: pass
            elif event_type == "Surgery stopped" and value and start_time:
                try:
                    stop_dt = datetime.strptime(value, "%Y-%m-%d %H:%M:%S")
                    row["duration"] = int((stop_dt - start_time).total_seconds() / 60)
                except: pass
            elif "Instrument Name" in event_type and value:
                current_instrument = str(value)
                instruments[current_instrument] = instruments.get(current_instrument, 0)
            elif "Instrument Connected duration is" in event_type and value and current_instrument:
                try:
                    instruments[current_instrument] = round(float(value) / 60, 2)
                except: pass
            elif event_type == "Clutch Pedal Pressed":
                row["clutch_counts"] = str(int(row["clutch_counts"]) + 1)
        except Exception as e:
            logging.warning(f"Parse error: {e}")

    # Finalize instruments
    if instruments:
        names = list(instruments.keys())
        durations = [instruments[n] for n in names]
        row["instruments_names"] = ",".join(names)
        row["instruments_durations"] = ",".join(map(str, durations))

    return {k: v for k, v in row.items() if v != ""}

@app.post("/upload/json")
async def upload_json(file: UploadFile = File(...)):
    if not file.filename.lower().endswith(".json"):
        raise HTTPException(400, "Only .json allowed")

    content = await file.read()
    data = json.loads(content)

    if not isinstance(data, list):
        raise HTTPException(400, "JSON must be array of events")

    surgery = parse_json_events(data)

    if not surgery.get("procedure_name") or not surgery.get("surgeon_name"):
        raise HTTPException(400, "Missing procedure or surgeon")

    # INSERT INTO SUPABASE
    response = supabase.table("surgeries").insert(surgery).execute()

    if response.data:
        return {"message": "Success", "data": surgery}
    else:
        raise HTTPException(500, f"Supabase error: {response.error}")

# Optional: CSV upload too
@app.post("/upload/csv")
async def upload_csv(file: UploadFile = File(...)):
    # Just forward to Supabase (clean CSV)
    pass