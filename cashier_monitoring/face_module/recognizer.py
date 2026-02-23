import os
os.environ['TF_CPP_MIN_LOG_LEVEL'] = '3'

import cv2
import numpy as np
from deepface import DeepFace
from config.shift_schedule import get_current_shift_person
from datetime import datetime


class FaceRecognizer:
    def __init__(self, database):
        self.database = database
        self.model_name = "Facenet512"
        self.frame_count = 0
        self.skip_frames = 20  # Run detection every 20 frames
        self.last_detected_person = None
        self.last_status = None
        self.threshold = 0.4

    def cosine_distance(self, emb1, emb2):
        emb1 = np.array(emb1)
        emb2 = np.array(emb2)
        return 1 - np.dot(emb1, emb2) / (np.linalg.norm(emb1) * np.linalg.norm(emb2))

    def recognize_faces(self, frame):
        self.frame_count += 1

        if self.frame_count % self.skip_frames == 0:
            try:
                representation = DeepFace.represent(
                    img_path=frame,
                    model_name=self.model_name,
                    enforce_detection=False
                )

                if len(representation) == 0:
                    self.last_detected_person = "UNKNOWN PERSON"
                    self.last_status = "UNAUTHORIZED"
                else:
                    live_embedding = representation[0]["embedding"]

                    min_distance = float("inf")
                    matched_person = None

                    for person, embeddings in self.database.items():
                        for db_embedding in embeddings:
                            distance = self.cosine_distance(live_embedding, db_embedding)

                            if distance < min_distance:
                                min_distance = distance
                                matched_person = person

                    if min_distance < self.threshold:
                        authorized_person = get_current_shift_person()

                        self.last_detected_person = matched_person

                        if authorized_person and matched_person.lower() == authorized_person.lower():
                            self.last_status = "AUTHORIZED"
                        else:
                            self.last_status = "UNAUTHORIZED"
                    else:
                        self.last_detected_person = "UNKNOWN PERSON"
                        self.last_status = "UNAUTHORIZED"

            except Exception as e:
                print("Detection error:", e)

        if self.last_detected_person:
            color = (0, 255, 0) if self.last_status == "AUTHORIZED" else (0, 0, 255)

            cv2.putText(frame, self.last_status, (20, 40),
                        cv2.FONT_HERSHEY_SIMPLEX, 1, color, 2)

            cv2.putText(frame, self.last_detected_person, (20, 80),
                        cv2.FONT_HERSHEY_SIMPLEX, 1, (255, 255, 0), 2)

        return frame, self.last_status