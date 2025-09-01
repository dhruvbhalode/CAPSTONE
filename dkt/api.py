from flask import Flask, request, jsonify
from flask_cors import CORS # Import CORS
import torch
import json
import os
from datetime import datetime
from typing import Dict, List, Optional
import logging
from model import DKTModel, DKTPredictor, DKTTrainer, DKTDataset, prepare_training_data
from torch.utils.data import DataLoader

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

class DKTService:
    def __init__(self, model_path: str = 'models/', data_path: str = 'data/'):
        self.model_path = model_path
        self.data_path = data_path
        self.model = None
        self.predictor = None
        self.skill_mapping = {}
        
        os.makedirs(model_path, exist_ok=True)
        os.makedirs(data_path, exist_ok=True)
        
        self.load_skill_mapping()
        self.load_model()
    
    def load_skill_mapping(self):
        mapping_file = os.path.join(self.data_path, 'skill_mapping.json')
        if os.path.exists(mapping_file):
            with open(mapping_file, 'r') as f:
                self.skill_mapping = json.load(f)
            logger.info(f"Loaded skill mapping with {len(self.skill_mapping)} skills")
        else:
            self.skill_mapping = { 'Array': 1, 'Hash Table': 2, 'String': 3, 'Dynamic Programming': 4, 'Tree': 5, 'Graph': 6, 'Linked List': 7, 'Stack': 8, 'Queue': 9, 'Heap': 10, 'Sorting': 11, 'Binary Search': 12, 'Two Pointers': 13, 'Sliding Window': 14, 'Backtracking': 15, 'Greedy': 16, 'Math': 17, 'Bit Manipulation': 18, 'Recursion': 19, 'Divide and Conquer': 20 }
            self.save_skill_mapping()
    
    def save_skill_mapping(self):
        mapping_file = os.path.join(self.data_path, 'skill_mapping.json')
        with open(mapping_file, 'w') as f:
            json.dump(self.skill_mapping, f, indent=2)
    
    def load_model(self):
        model_file = os.path.join(self.model_path, 'dkt_model.pth')
        if os.path.exists(model_file):
            try:
                checkpoint = torch.load(model_file, map_location='cpu')
                self.skill_mapping = checkpoint.get('skill_mapping', self.skill_mapping)
                self.model = DKTModel(num_skills=len(self.skill_mapping), hidden_size=checkpoint['hidden_size'], num_layers=checkpoint['num_layers'])
                self.model.load_state_dict(checkpoint['model_state_dict'])
                self.model.eval()
                self.predictor = DKTPredictor(self.model, self.skill_mapping)
                logger.info("Loaded trained DKT model")
            except Exception as e:
                logger.error(f"Error loading model: {e}")
                self.model = None
                self.predictor = None
        else:
            logger.info("No trained model found. A new one will be created upon training.")

    def save_model(self):
        if self.model is None: return
        model_file = os.path.join(self.model_path, 'dkt_model.pth')
        torch.save({ 'model_state_dict': self.model.state_dict(), 'num_skills': len(self.skill_mapping), 'hidden_size': self.model.hidden_size, 'num_layers': self.model.num_layers, 'skill_mapping': self.skill_mapping }, model_file)
        logger.info("Model saved successfully")
    
    def add_interaction(self, user_id: str, problem_id: str, skills: List[str], correct: bool, timestamp: Optional[str] = None):
        if timestamp is None:
            timestamp = datetime.now().isoformat()
        
        interactions_file = os.path.join(self.data_path, 'interactions.json')
        interactions = []
        if os.path.exists(interactions_file):
            with open(interactions_file, 'r') as f:
                interactions = json.load(f)
        
        for skill in skills:
            if skill not in self.skill_mapping:
                max_id = max(self.skill_mapping.values()) if self.skill_mapping else 0
                self.skill_mapping[skill] = max_id + 1
                self.save_skill_mapping()
            
            interaction = { 'user_id': user_id, 'problem_id': problem_id, 'skill': skill, 'skill_id': self.skill_mapping[skill], 'correct': correct, 'timestamp': timestamp }
            interactions.append(interaction)
        
        with open(interactions_file, 'w') as f:
            json.dump(interactions, f, indent=2)
        logger.info(f"Added interaction for user {user_id}, problem {problem_id}")
    
    def train_model(self, epochs: int = 50, batch_size: int = 32):
        interactions_file = os.path.join(self.data_path, 'interactions.json')
        if not os.path.exists(interactions_file):
            logger.error("No interaction data found for training.")
            return False
        
        with open(interactions_file, 'r') as f:
            interactions = json.load(f)
        
        if len(interactions) < 10:
            logger.warning(f"Not enough interaction data for training (found {len(interactions)}, need at least 10).")
            return False
        
        training_sequences = prepare_training_data(interactions)
        if len(training_sequences) < 2:
            logger.warning(f"Not enough unique user sequences for training (found {len(training_sequences)}, need at least 2).")
            return False
        
        dataset = DKTDataset(training_sequences, max_seq_length=100)
        dataloader = DataLoader(dataset, batch_size=batch_size, shuffle=True)
        
        # Initialize a new model for training
        self.model = DKTModel(num_skills=len(self.skill_mapping), hidden_size=128, num_layers=2)
        trainer = DKTTrainer(self.model)
        
        logger.info(f"Starting training with {len(training_sequences)} sequences...")
        for epoch in range(epochs):
            loss = trainer.train_epoch(dataloader)
            if (epoch + 1) % 10 == 0:
                logger.info(f"Epoch {epoch + 1}/{epochs}, Loss: {loss:.4f}")
        
        self.predictor = DKTPredictor(self.model, self.skill_mapping)
        self.save_model()
        logger.info("Training completed successfully")
        return True
    
    def get_user_history(self, user_id: str) -> List[tuple]:
        interactions_file = os.path.join(self.data_path, 'interactions.json')
        if not os.path.exists(interactions_file): return []
        with open(interactions_file, 'r') as f:
            interactions = json.load(f)
        user_interactions = sorted([i for i in interactions if i['user_id'] == user_id], key=lambda x: x['timestamp'])
        return [(i['skill'], i['correct']) for i in user_interactions]

    def get_skill_mastery(self, user_id: str) -> Dict[str, float]:
        if self.predictor is None: return {skill: 0.5 for skill in self.skill_mapping.keys()}
        user_history = self.get_user_history(user_id)
        return self.predictor.get_skill_mastery(user_history)
    
    def recommend_problems(self, user_id: str, available_problems: List[Dict], target_difficulty: float = 0.7) -> List[Dict]:
        if self.predictor is None: return available_problems[:5]
        user_history = self.get_user_history(user_id)
        return self.predictor.recommend_next_problems(user_history, available_problems, target_difficulty)

# --- Flask App Setup ---
dkt_service = DKTService()
app = Flask(__name__)
CORS(app) # Enable CORS for all routes, allowing frontend access

@app.route('/dkt/interaction', methods=['POST'])
def add_interaction_route():
    data = request.json
    required = ['user_id', 'problem_id', 'skills', 'correct']
    if not all(field in data for field in required):
        return jsonify({'error': 'Missing required fields'}), 400
    try:
        dkt_service.add_interaction(user_id=data['user_id'], problem_id=data['problem_id'], skills=data['skills'], correct=data['correct'], timestamp=data.get('timestamp'))
        # Optional: Retrain model after a certain number of new interactions
        # dkt_service.train_model() 
        return jsonify({'success': True})
    except Exception as e:
        logger.error(f"Error in /dkt/interaction: {e}", exc_info=True)
        return jsonify({'error': str(e)}), 500

@app.route('/dkt/mastery/<user_id>', methods=['GET'])
def get_mastery_route(user_id):
    try:
        mastery = dkt_service.get_skill_mastery(user_id)
        return jsonify({'mastery': mastery})
    except Exception as e:
        logger.error(f"Error in /dkt/mastery: {e}", exc_info=True)
        return jsonify({'error': str(e)}), 500

@app.route('/dkt/recommend', methods=['POST'])
def recommend_problems_route():
    data = request.json
    if 'user_id' not in data or 'problems' not in data:
        return jsonify({'error': 'Missing user_id or problems list'}), 400
    try:
        recommendations = dkt_service.recommend_problems(user_id=data['user_id'], available_problems=data['problems'], target_difficulty=data.get('target_difficulty', 0.6))
        return jsonify({'recommendations': recommendations})
    except Exception as e:
        logger.error(f"Error in /dkt/recommend: {e}", exc_info=True)
        return jsonify({'error': str(e)}), 500

@app.route('/dkt/train', methods=['POST'])
def train_model_route():
    data = request.json or {}
    try:
        success = dkt_service.train_model(epochs=data.get('epochs', 50), batch_size=data.get('batch_size', 32))
        return jsonify({'success': success, 'message': 'Model training completed.' if success else 'Training failed. Check logs for details.'})
    except Exception as e:
        logger.error(f"Error in /dkt/train: {e}", exc_info=True)
        return jsonify({'error': str(e)}), 500

@app.route('/dkt/status', methods=['GET'])
def get_status_route():
    return jsonify({ 'model_loaded': dkt_service.model is not None, 'num_skills': len(dkt_service.skill_mapping), 'skills': list(dkt_service.skill_mapping.keys()) })

if __name__ == '__main__':
    app.run(debug=True, port=5002)
