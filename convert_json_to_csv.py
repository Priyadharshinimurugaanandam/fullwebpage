
# import pandas as pd
# import json
# from datetime import datetime
# import os
# import logging

# # Set up logging
# logging.basicConfig(level=logging.INFO)
# logger = logging.getLogger(__name__)

# def json_to_csv(json_file_path, csv_file_path):
#     # Ensure the CSV file exists; if not, create it with headers
#     csv_headers = [
#         "procedure_name", "date", "time", "duration", "surgeon_name", "surgeon_image",
#         "instruments_names", "instruments_images", "instruments_durations",
#         "clutch_names", "clutch_counts"
#     ]
#     if not os.path.exists(csv_file_path):
#         pd.DataFrame(columns=csv_headers).to_csv(csv_file_path, index=False)
#         logger.info(f"Created new CSV at {csv_file_path}")

#     # Read JSON file
#     try:
#         with open(json_file_path, 'r') as f:
#             json_data = json.load(f)
#         logger.info(f"Loaded JSON from {json_file_path}")
#     except json.JSONDecodeError as e:
#         logger.error(f"Invalid JSON format in {json_file_path}: {e}")
#         return
#     except FileNotFoundError:
#         logger.error(f"File {json_file_path} not found")
#         return

#     # Initialize data for CSV row
#     csv_data = {
#         "procedure_name": "",
#         "date": "",
#         "time": "",
#         "duration": 0,
#         "surgeon_name": "",
#         "surgeon_image": 'public/logo.png',  # Placeholder
#         "instruments_names": [],
#         "instruments_images": [],
#         "instruments_durations": [],
#         "clutch_names": ["Clutch Pedal"],
#         "clutch_counts": [0]
#     }

#     # Track unique instruments
#     instruments = {}

#     # Process JSON events
#     for event in json_data:
#         # Skip empty or invalid events
#         if not event or not isinstance(event, dict):
#             logger.warning(f"Skipping invalid event: {event}")
#             continue

#         event_type = event.get("event")
#         value = event.get("value")

#         # Skip if event_type is None
#         if event_type is None:
#             logger.warning(f"Skipping event with missing 'event' field: {event}")
#             continue

#         if event_type == "Surgery type selected":
#             csv_data["procedure_name"] = value
#         elif event_type == "Surgeon Name":
#             csv_data["surgeon_name"] = value
#         elif event_type == "Surgery started":
#             try:
#                 start_time = datetime.strptime(value, "%Y-%m-%d %H:%M:%S")
#                 csv_data["date"] = start_time.strftime("%Y-%m-%d")
#                 csv_data["time"] = start_time.strftime("%H:%M")
#             except ValueError as e:
#                 logger.error(f"Invalid datetime format in 'Surgery started': {value}")
#         elif event_type == "Surgery stopped":
#             try:
#                 stop_time = datetime.strptime(value, "%Y-%m-%d %H:%M:%S")
#                 start_time = datetime.strptime(
#                     next(e["value"] for e in json_data if e.get("event") == "Surgery started"),
#                     "%Y-%m-%d %H:%M:%S"
#                 )
#                 duration_seconds = (stop_time - start_time).total_seconds()
#                 csv_data["duration"] = round(duration_seconds / 60)  # Convert to minutes
#             except ValueError as e:
#                 logger.error(f"Invalid datetime format in 'Surgery stopped': {value}")
#             except StopIteration:
#                 logger.error("No 'Surgery started' event found for duration calculation")
#         elif event_type == "Clutch Pedal Pressed":
#             try:
#                 csv_data["clutch_counts"][0] = int(value)  # Last value is total count
#             except ValueError:
#                 logger.warning(f"Invalid clutch count value: {value}")
#         elif "Instrument Name" in event_type:
#             instrument_name = value
#             if instrument_name and instrument_name not in instruments:
#                 instruments[instrument_name] = {"count": 0, "duration": 0}
#         elif "Instrument Count is " in event_type:
#             try:
#                 # Find the last instrument name
#                 for prev_event in reversed(json_data[:json_data.index(event)]):
#                     if prev_event.get("event", "").endswith("Instrument Name"):
#                         instruments[prev_event["value"]]["count"] = int(value)
#                         break
#             except (ValueError, KeyError):
#                 logger.warning(f"Invalid instrument count or no matching instrument: {value}")
#         elif "Instrument Connected duration is " in event_type:
#             try:
#                 # Find the last instrument name
#                 for prev_event in reversed(json_data[:json_data.index(event)]):
#                     if prev_event.get("event", "").endswith("Instrument Name"):
#                         instruments[prev_event["value"]]["duration"] = round(float(value) / 60, 2)
#                         break
#             except (ValueError, KeyError):
#                 logger.warning(f"Invalid instrument duration or no matching instrument: {value}")

#     # Validate required fields
#     if not csv_data["procedure_name"] or not csv_data["surgeon_name"]:
#         logger.error("Missing required fields (procedure_name or surgeon_name)")
#         return

#     # Populate instrument fields
#     csv_data["instruments_names"] = list(instruments.keys())
#     csv_data["instruments_images"] = [
#         f"https://example.com/images/{name.lower().replace(' ', '_')}.jpg"
#         for name in instruments
#     ]
#     csv_data["instruments_durations"] = [instruments[name]["duration"] for name in instruments]

#     # Convert lists to comma-separated strings
#     csv_row = {
#         "procedure_name": csv_data["procedure_name"],
#         "date": csv_data["date"],
#         "time": csv_data["time"],
#         "duration": csv_data["duration"],
#         "surgeon_name": csv_data["surgeon_name"],
#         "surgeon_image": csv_data["surgeon_image"],
#         "instruments_names": ",".join(csv_data["instruments_names"]),
#         "instruments_images": ",".join(csv_data["instruments_images"]),
#         "instruments_durations": ",".join(str(d) for d in csv_data["instruments_durations"]),
#         "clutch_names": ",".join(csv_data["clutch_names"]),
#         "clutch_counts": ",".join(str(c) for c in csv_data["clutch_counts"])
#     }

#     # Append to CSV
#     try:
#         df = pd.DataFrame([csv_row])
#         df.to_csv(csv_file_path, mode='a', header=False, index=False)
#         logger.info(f"Appended row to {csv_file_path}")
#     except Exception as e:
#         logger.error(f"Error writing to CSV: {e}")

# # Run if called directly (for testing)
# if __name__ == "__main__":
#     json_path = "json_data/input.json"
#     csv_path = "data/data.csv"
#     json_to_csv(json_path, csv_path)


# new file
import json
from datetime import datetime
import os
import logging
from supabase import create_client
from dotenv import load_dotenv

# Load environment variables
load_dotenv()
SUPABASE_URL = os.getenv("SUPABASE_URL")
SUPABASE_KEY = os.getenv("SUPABASE_SERVICE_ROLE_KEY")

if not SUPABASE_URL or not SUPABASE_KEY:
    raise ValueError("SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY must be set in .env")

supabase = create_client(SUPABASE_URL, SUPABASE_KEY)

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

def process_json_to_db(json_path: str):
    try:
        with open(json_path, 'r') as f:
            events = json.load(f)
        logger.info(f"Loaded {len(events)} events from {json_path}")

        if not events:
            logger.warning("Empty JSON file")
            return

        surgery_data = {
            "procedure_name": "",
            "date": "",
            "time": "",
            "duration": 0,
            "surgeon_name": "",
            "instruments_names": [],
            "instruments_durations": [],
            "clutch_names": ["Clutch Pedal"],
            "clutch_counts": [0]
        }
        instruments_dict = {}
        current_instrument = None

        for event in events:
            if not isinstance(event, dict):
                logger.warning(f"Skipping non-dict event: {event}")
                continue

            event_type = event.get("event")
            value = event.get("value")

            if event_type is None:
                logger.warning(f"Skipping event with missing 'event' key: {event}")
                continue

            try:
                if "Surgery type selected" in event_type:
                    surgery_data["procedure_name"] = str(value or "")
                elif "Surgeon Name" in event_type:
                    surgery_data["surgeon_name"] = str(value or "")
                elif "Surgery started" in event_type and value:
                    try:
                        start_dt = datetime.strptime(value, "%Y-%m-%d %H:%M:%S")
                        surgery_data["date"] = start_dt.strftime("%Y-%m-%d")
                        surgery_data["time"] = start_dt.strftime("%H:%M:%S")
                    except ValueError:
                        logger.warning(f"Invalid start time: {value}")
                elif "Surgery stopped" in event_type and value:
                    try:
                        stop_dt = datetime.strptime(value, "%Y-%m-%d %H:%M:%S")
                        start_value = next((e["value"] for e in events if isinstance(e, dict) and e.get("event") == "Surgery started"), None)
                        if start_value:
                            start_dt = datetime.strptime(start_value, "%Y-%m-%d %H:%M:%S")
                            surgery_data["duration"] = int((stop_dt - start_dt).total_seconds() / 60)
                    except Exception as e:
                        logger.warning(f"Duration error: {e}")
                elif "Instrument Name" in event_type and value:
                    current_instrument = str(value)
                    instruments_dict[current_instrument] = 0
                elif "Instrument Connected duration" in event_type and current_instrument and value:
                    try:
                        instruments_dict[current_instrument] = round(float(value) / 60, 2)
                    except ValueError:
                        logger.warning(f"Invalid duration: {value}")
                elif "Clutch Pedal Pressed" in event_type and value:
                    try:
                        surgery_data["clutch_counts"][0] = int(value)
                    except ValueError:
                        logger.warning(f"Invalid clutch count: {value}")
            except Exception as e:
                logger.warning(f"Error processing event {event}: {e}")

        surgery_data["instruments_names"] = list(instruments_dict.keys())
        surgery_data["instruments_durations"] = [instruments_dict[name] for name in surgery_data["instruments_names"]]

        surgery_row = {
            "procedure_name": surgery_data["procedure_name"],
            "date": surgery_data["date"],
            "time": surgery_data["time"],
            "duration": surgery_data["duration"],
            "surgeon_name": surgery_data["surgeon_name"],
            "instruments_names": ",".join(surgery_data["instruments_names"]),
            "instruments_durations": ",".join(str(d) for d in surgery_data["instruments_durations"]),
            "clutch_names": ",".join(surgery_data["clutch_names"]),
            "clutch_counts": ",".join(str(c) for c in surgery_data["clutch_counts"])
        }

        if not surgery_row["procedure_name"] or not surgery_row["surgeon_name"]:
            logger.error("Missing required fields: procedure_name or surgeon_name")
            return

        # Upsert references
        if surgery_row["surgeon_name"]:
            supabase.table("surgeons").upsert(
                {"surgeon_name": surgery_row["surgeon_name"]},
                on_conflict="surgeon_name"
            ).execute()
            logger.info(f"Upserted surgeon: {surgery_row['surgeon_name']}")
        if surgery_data["instruments_names"]:
            supabase.table("instruments").upsert(
                [{"instrument_name": name} for name in surgery_data["instruments_names"]],
                on_conflict="instrument_name"
            ).execute()
            logger.info(f"Upserted {len(surgery_data['instruments_names'])} instruments")

        # Insert surgery
        supabase.table("surgeries").insert(surgery_row).execute()
        logger.info("Inserted surgery into Supabase")

    except Exception as e:
        logger.error(f"JSON processing error: {str(e)}")
        raise

if __name__ == "__main__":
    json_file = "json_data/input.json"
    if os.path.exists(json_file):
        process_json_to_db(json_file)
    else:
        logger.error(f"JSON file not found: {json_file}")