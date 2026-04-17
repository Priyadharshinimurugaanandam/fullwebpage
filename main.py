# main.py
import os
import json
import logging
from datetime import datetime
from typing import List, Dict, Any

from fastapi import FastAPI, UploadFile, File, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from supabase import create_client
from dotenv import load_dotenv

load_dotenv()

SUPABASE_URL = os.getenv("SUPABASE_URL")
SUPABASE_KEY = os.getenv("SUPABASE_KEY")

if not SUPABASE_URL or not SUPABASE_KEY:
    raise ValueError("Missing Supabase credentials")

supabase = create_client(SUPABASE_URL, SUPABASE_KEY)

app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
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

    if instruments:
        names = list(instruments.keys())
        durations = [instruments[n] for n in names]
        row["instruments_names"] = ",".join(names)
        row["instruments_durations"] = ",".join(map(str, durations))

    return {k: v for k, v in row.items() if v != ""}


def send_notification(surgeon_name: str, title: str, message: str, type: str):
    """Insert a notification into Supabase for the surgeon."""
    try:
        supabase.table("notifications").insert({
            "surgeon_name": surgeon_name,
            "title": title,
            "message": message,
            "type": type,
            "is_read": False
        }).execute()
    except Exception as e:
        logging.warning(f"Notification insert failed: {e}")


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

    # Insert surgery
    response = supabase.table("surgeries").insert(surgery).execute()

    if response.data:
        # ✅ Auto notification to surgeon on file upload
        send_notification(
            surgeon_name=surgery["surgeon_name"],
            title="New Procedure File Uploaded",
            message=f"A new file for your procedure '{surgery['procedure_name']}' has been uploaded and is now available in your dashboard.",
            type="file_upload"
        )
        return {"message": "Success", "data": surgery}
    else:
        raise HTTPException(500, f"Supabase error: {response.error}")


@app.post("/upload/csv")
async def upload_csv(file: UploadFile = File(...)):
    pass