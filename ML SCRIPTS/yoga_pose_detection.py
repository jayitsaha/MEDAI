import torch
import torchvision.transforms as transforms
from PIL import Image
import cv2  # OpenCV for image processing
import timm

# Device configuration
device = torch.device('cuda' if torch.cuda.is_available() else 'cpu')

# Model initialization (Using a ResNet-based model for simplicity)
model_name = 'resnet50' # You can experiment with other models in timm
model = timm.create_model(model_name, pretrained=True, num_classes=10) # Adjust num_classes to the number of yoga poses
model = model.to(device)
model.eval()

# Image transformations
transform = transforms.Compose([
    transforms.Resize((224, 224)),
    transforms.ToTensor(),
    transforms.Normalize(mean=[0.485, 0.456, 0.406], std=[0.229, 0.224, 0.225])
])

# Class labels (replace with your actual yoga pose labels)
class_labels = ["Tadasana", "Vrikshasana", "Adho Mukha Svanasana", "Uttanasana", "Trikonasana", "Virabhadrasana II", "Bhujangasana", "Balasana", "Savasana", "Unknown"]

def load_model(model_path):
    """Loads a PyTorch model from a file."""
    model = timm.create_model(model_name, pretrained=False, num_classes=10) # Initialize model first
    model.load_state_dict(torch.load(model_path))
    model = model.to(device)
    model.eval()
    return model


def predict_yoga_pose(image_path, model_path):
    """Predicts the yoga pose in an image."""
    try:
        image = Image.open(image_path).convert('RGB')
    except FileNotFoundError:
        return "Error: Image file not found."

    # Load the model
    model = load_model(model_path)

    image = transform(image).unsqueeze(0).to(device)

    with torch.no_grad():
        outputs = model(image)
        _, predicted = torch.max(outputs.data, 1)
        predicted_class = class_labels[predicted[0]]

    return predicted_class
# Sample usage
if __name__ == '__main__':
    #  Requires you to have a trained model (yoga_model.pth) and an image (yoga_pose.jpg)
    #  You will need to train a model on a dataset of yoga poses first.
    image_path = 'yoga_pose.jpg'  # Replace with the path to your image
    model_path = 'yoga_model.pth'  # Replace with the path to your trained model

    prediction = predict_yoga_pose(image_path, model_path)
    print(f"Predicted yoga pose: {prediction}")