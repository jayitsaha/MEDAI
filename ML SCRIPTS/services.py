from flask import Flask, request, jsonify
from yoga_pose_detection import predict_yoga_pose
from diet_recommendation import get_diet_recommendation
from medical_diagnosis import get_medical_diagnosis
from medical_ocr import extract_text_from_image
from nearest_neighbor_search import search_chroma

app = Flask(__name__)

@app.route('/yoga_pose', methods=['POST'])
def yoga_pose_endpoint():
    image = request.files['image']
    image.save('temp_image.jpg')  # Save the image temporarily
    prediction = predict_yoga_pose('temp_image.jpg', 'yoga_model.pth') # Use temp file, trained model required
    return jsonify({'prediction': prediction})

@app.route('/diet_recommendation', methods=['POST'])
def diet_recommendation_endpoint():
    health_info = request.form['health_info']
    recommendation = get_diet_recommendation(health_info)
    return jsonify({'recommendation': recommendation})

@app.route('/medical_diagnosis', methods=['POST'])
def medical_diagnosis_endpoint():
    symptoms = request.form['symptoms']
    diagnosis = get_medical_diagnosis(symptoms)
    return jsonify({'diagnosis': diagnosis})

@app.route('/medical_ocr', methods=['POST'])
def medical_ocr_endpoint():
    image = request.files['image']
    image.save('temp_medical_report.jpg')
    text = extract_text_from_image('temp_medical_report.jpg')
    return jsonify({'text': text})

@app.route('/nearest_neighbor_search', methods=['POST'])
def nearest_neighbor_search_endpoint():
    query_text = request.form['query_text']
    results = search_chroma(query_text)
    return jsonify({'results': results})

if __name__ == '__main__':
    app.run(debug=True)