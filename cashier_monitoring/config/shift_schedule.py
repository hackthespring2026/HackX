from datetime import datetime

shift_schedule = {
    "09:00-13:00": "aditi",
    "14:00-18:00": "aadil"
}

def get_current_shift_person():
    now = datetime.now().strftime("%H:%M")

    for time_range, person in shift_schedule.items():
        start, end = time_range.split("-")
        if start <= now <= end:
            return person

    return None