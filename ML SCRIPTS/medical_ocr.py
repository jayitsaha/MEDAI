from PIL import Image
import pytesseract  # Tesseract OCR
import io

def extract_text_from_image(image_path):
    """Extracts text from a medical report image using OCR."""
    try:
        image = Image.open(image_path)
    except FileNotFoundError:
        return "Error: Image file not found."

    try:
        text = pytesseract.image_to_string(image) # Requires Tesseract to be installed
    except Exception as e:
        return f"Error during OCR: {e}"

    return text
# Sample Usage
if __name__ == '__main__':
    image_path = 'medical_report.jpg' # Replace with the path to your medical report image
    extracted_text = extract_text_from_image(image_path)
    print(extracted_text)