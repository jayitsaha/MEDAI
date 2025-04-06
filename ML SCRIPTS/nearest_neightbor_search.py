import torch
from PIL import Image
import timm
from transformers import AutoTokenizer, AutoModel
import chromadb
from chromadb.utils import embedding_functions

# Initialize models and tokenizer
device = torch.device('cuda' if torch.cuda.is_available() else 'cpu')

# Text Embedding model
text_model_name = 'sentence-transformers/all-mpnet-base-v2'
text_tokenizer = AutoTokenizer.from_pretrained(text_model_name)
text_model = AutoModel.from_pretrained(text_model_name).to(device)
text_model.eval()

# Image Embedding model (DINOv2)
image_model_name = 'facebook/dinov2-base'
image_model = timm.create_model(image_model_name, pretrained=True).to(device)
image_model.eval()

# ChromaDB setup
chroma_client = chromadb.PersistentClient(path="chroma_db")  # Store the database to disk

# Create or load a collection (vectors and metadata)
try:
    collection = chroma_client.get_collection(name="medical_data")
except ValueError:
    # Define embedding functions for ChromaDB
    text_ef = embedding_functions.SentenceTransformerEmbeddingFunction(model_name=text_model_name, device=device)
    collection = chroma_client.create_collection(name="medical_data", embedding_function=text_ef)


def embed_text(text):
    """Embeds text using the SentenceTransformer model."""
    encoded_input = text_tokenizer(text, padding=True, truncation=True, return_tensors='pt').to(device)
    with torch.no_grad():
        model_output = text_model(**encoded_input)
        embeddings = model_output.last_hidden_state.mean(dim=1).cpu().numpy().tolist()
    return embeddings[0]  # Return single embedding vector

def embed_image(image_path):
    """Embeds an image using the DINOv2 model."""
    try:
        image = Image.open(image_path).convert('RGB')
    except FileNotFoundError:
        print("Error: Image file not found.")
        return None

    transform = transforms.Compose([
        transforms.Resize((224, 224)),
        transforms.ToTensor(),
        transforms.Normalize(mean=[0.485, 0.456, 0.406], std=[0.229, 0.224, 0.225])
    ])

    image = transform(image).unsqueeze(0).to(device)

    with torch.no_grad():
        features = image_model(image)
        image_embedding = features.cpu().numpy().tolist()
    return image_embedding[0] # Return single embedding vector

def add_data_to_chroma(text_data, image_path, metadata):
    """Adds text, image and metadata to ChromaDB."""
    image_embedding = embed_image(image_path)
    text_embedding = embed_text(text_data)

    if image_embedding is None:
        print("Image embedding failed.")
        return

    # Combine text and image embeddings. You can experiment with different weighting schemes
    combined_embedding = [x + y for x, y in zip(text_embedding, image_embedding)] # Simple sum

    collection.add(
        embeddings=[combined_embedding],
        metadatas=[metadata],
        documents=[text_data],  # Optional: store the original text
        ids=[metadata['id']]     # Unique ID for the document
    )
    print("Added data to ChromaDB successfully!")

def search_chroma(query_text, n_results=5):
    """Searches ChromaDB for similar documents based on a text query."""
    query_embedding = embed_text(query_text)
    results = collection.query(
        query_embeddings=[query_embedding],
        n_results=n_results
    )
    return results

# Sample Usage
if __name__ == '__main__':
    # Example: Adding data to ChromaDB
    text_data = "Chest X-ray showing signs of pneumonia."
    image_path = "chest_xray.jpg"  # Replace with your chest X-ray image
    metadata = {"id": "xray_1", "patient_id": "123", "diagnosis": "pneumonia"}
    add_data_to_chroma(text_data, image_path, metadata)

    # Example: Searching ChromaDB
    query_text = "Looking for chest X-rays related to respiratory infections"
    search_results = search_chroma(query_text)
    print(f"Search results: {search_results}")