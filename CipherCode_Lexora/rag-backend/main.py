from pipelines.rag_pipeline import ask_question


def main():
    print("RAG pipeline started")

    while True:
        query = input("\nAsk a question (or type 'exit'): ").strip()

        if query.lower() == "exit":
            print("Exiting RAG system")
            break

        try:
            answer, sources = ask_question(query)

            print("\nAnswer:\n")
            print(answer)

            print("\n Sources:")
            for src in sources:
                print(src)

        except Exception as e:
            print("Error occurred:", str(e))


if __name__ == "__main__":
    main()
