from transformers import pipeline

def get_diet_recommendation(health_info):
    """Generates a diet recommendation based on health information using LLaMA."""

    generator = pipeline('text-generation', model="meta-llama/Llama-2-7b-chat-hf", device=0 if torch.cuda.is_available() else -1)

    prompt = f"Based on the following health information: {health_info}, provide a detailed diet recommendation."

    try:
        recommendation = generator(prompt, max_length=500, num_return_sequences=1)[0]['generated_text']
    except Exception as e:
        return f"Error generating diet recommendation: {e}"

    return recommendation

# Sample Usage
if __name__ == '__main__':
    health_info = "I am a 35-year-old male, 5'10\", weigh 180 lbs, and have high cholesterol. I also want to build muscle."
    diet = get_diet_recommendation(health_info)
    print(diet)