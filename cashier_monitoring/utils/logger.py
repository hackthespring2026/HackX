def log_alert(detected_person, expected_person, timestamp):
    with open("alerts/alerts_log.txt", "a") as f:
        f.write(
            f"[{timestamp}] Unauthorized detected: {detected_person} | Expected: {expected_person}\n"
        )