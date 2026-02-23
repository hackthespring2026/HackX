import os
from deepface import DeepFace


def build_face_database(dataset_path="dataset"):
    face_db = {}

    for person in os.listdir(dataset_path):
        person_path = os.path.join(dataset_path, person)

        if os.path.isdir(person_path):
            embeddings = []

            for img_name in os.listdir(person_path):
                img_path = os.path.join(person_path, img_name)

                embedding = DeepFace.represent(
                    img_path=img_path,
                    model_name="Facenet512",
                    enforce_detection=False
                )[0]["embedding"]

                embeddings.append(embedding)

            face_db[person] = embeddings

    print("✅ Face embeddings generated successfully.")
    return face_db