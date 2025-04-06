from transformers import pipeline

def get_medical_diagnosis(symptoms):
    """Generates a medical diagnosis based on symptoms using LLaMA."""

    generator = pipeline('text-generation', model="meta-llama/Llama-2-7b-chat-hf", device=0 if torch.cuda.is_available() else -1)

    prompt = f"Based on the following symptoms: {symptoms}, provide a possible medical diagnosis and suggest some further tests."

    try:
        diagnosis = generator(prompt, max_length=500, num_return_sequences=1)[0]['generated_text']
    except Exception as e:
        return f"Error generating diagnosis: {e}"

    return diagnosis
# Sample Usage
if __name__ == '__main__':
    symptoms = "I have a persistent cough, fever, and shortness of breath."
    diagnosis = get_medical_diagnosis(symptoms)
    print(diagnosis)