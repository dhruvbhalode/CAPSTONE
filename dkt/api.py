from flask import Flask, request, jsonify
import torch
import json
import os
import threading
import logging
from model import DKTModel, DKTTrainer, DKTDataset, prepare_training_data
from torch.utils.data import DataLoader

logging.basicConfig(level=logging.INFO, format='%(asctime)s - %(levelname)s - %(message)s')

class DKTService:
    def __init__(self, model_path='models/', data_path='data/'):
        self.model_path = model_path
        self.data_path = data_path
        self.model = None
        self.skill_mapping = {}
        self.rev_skill_mapping = {}
        self.training_in_progress = False
        self.file_lock = threading.Lock()
        
        os.makedirs(model_path, exist_ok=True)
        os.makedirs(data_path, exist_ok=True)
        
        self.load_skill_mapping()
        self.load_model()

    def load_skill_mapping(self):
        mapping_file = os.path.join(self.data_path, 'skill_mapping.json')
        if os.path.exists(mapping_file):
            with open(mapping_file, 'r') as f:
                self.skill_mapping = json.load(f)
                self.rev_skill_mapping = {v: k for k, v in self.skill_mapping.items()}
                logging.info(f"Loaded {len(self.skill_mapping)} skills.")

    def load_model(self):
        model_file = os.path.join(self.model_path, 'dkt_model.pth')
        if os.path.exists(model_file) and self.skill_mapping:
            try:
                self.model = DKTModel(num_skills=len(self.skill_mapping))
                self.model.load_state_dict(torch.load(model_file, map_location='cpu'))
                self.model.eval()
                logging.info("DKT model loaded successfully.")
            except Exception as e:
                logging.error(f"Error loading DKT model: {e}")

    def add_interaction(self, data):
        with self.file_lock:
            for skill in data['skills']:
                if skill not in self.skill_mapping:
                    new_id = len(self.skill_mapping)
                    self.skill_mapping[skill] = new_id
            with open(os.path.join(self.data_path, 'skill_mapping.json'), 'w') as f:
                json.dump(self.skill_mapping, f, indent=2)

            interactions_file = os.path.join(self.data_path, 'interactions.json')
            interactions = []
            if os.path.exists(interactions_file):
                with open(interactions_file, 'r') as f:
                    try: interactions = json.load(f)
                    except json.JSONDecodeError: pass
            
            for skill in data['skills']:
                interaction = {
                    'user_id': data['user_id'],
                    'skill_id': self.skill_mapping.get(skill),
                    'correct': data['correct']
                }
                interactions.append(interaction)

            with open(interactions_file, 'w') as f:
                json.dump(interactions, f, indent=2)

    def _perform_training(self):
        try:
            logging.info("Starting background training process...")
            with open(os.path.join(self.data_path, 'interactions.json'), 'r') as f:
                interactions = json.load(f)
            
            self.load_skill_mapping()
            sequences = prepare_training_data(interactions)

            if len(sequences) < 2:
                logging.warning("Not enough user sequences to train. Need at least 2.")
                return

            self.model = DKTModel(num_skills=len(self.skill_mapping))
            trainer = DKTTrainer(self.model)
            dataset = DKTDataset(sequences, num_skills=len(self.skill_mapping))
            dataloader = DataLoader(dataset, batch_size=16, shuffle=True)
            
            for epoch in range(20):
                loss = trainer.train_epoch(dataloader)
                logging.info(f"Epoch {epoch+1}/20, Loss: {loss:.4f}")

            torch.save(self.model.state_dict(), os.path.join(self.model_path, 'dkt_model.pth'))
            self.model.eval()
            logging.info("Training complete. Model saved.")

        except Exception as e:
            logging.error(f"Exception during training: {e}", exc_info=True)
        finally:
            self.training_in_progress = False
    
    def train_model(self):
        if self.training_in_progress: return False
        self.training_in_progress = True
        thread = threading.Thread(target=self._perform_training)
        thread.start()
        return True

    def predict(self, user_id):
        if not self.model: return None
        with open(os.path.join(self.data_path, 'interactions.json'), 'r') as f:
            interactions = json.load(f)
        
        sequences = prepare_training_data(interactions)
        user_seq = next((s for s in sequences if interactions[0]['user_id'] == user_id), None) # simplified for example
        if not user_seq: return None

        dataset = DKTDataset([user_seq], num_skills=len(self.skill_mapping))
        inputs, _, _ = dataset[0]
        
        with torch.no_grad():
            outputs = self.model(inputs.unsqueeze(0))
        
        last_preds = outputs[0, len(user_seq)-1, :].tolist()
        return {self.rev_skill_mapping.get(i): prob for i, prob in enumerate(last_preds)}

app = Flask(__name__)
dkt_service = DKTService()

@app.route('/dkt/interaction', methods=['POST'])
def add_interaction_route():
    dkt_service.add_interaction(request.json)
    return jsonify({'success': True})

@app.route('/dkt/train', methods=['POST'])
def train_route():
    if dkt_service.train_model():
        return jsonify({'message': 'Training started.'})
    return jsonify({'message': 'Training already in progress.'}), 409

@app.route('/dkt/status', methods=['GET'])
def status_route():
    return jsonify({'model_loaded': dkt_service.model is not None, 'training_in_progress': dkt_service.training_in_progress})

# RESTORED ROUTES
@app.route('/dkt/mastery/<user_id>', methods=['GET'])
def get_mastery_route(user_id):
    mastery = dkt_service.predict(user_id)
    if mastery is None:
        # Fallback if no prediction can be made
        return jsonify({'mastery': {skill: 0.5 for skill in dkt_service.skill_mapping.keys()}})
    return jsonify({'mastery': mastery})

@app.route('/dkt/recommend', methods=['POST'])
def recommend_problems_route():
    data = request.json
    user_id = data.get('user_id')
    problems = data.get('problems', [])
    
    mastery = dkt_service.predict(user_id)
    if mastery is None:
        return jsonify({'recommendations': problems[:5]})

    scored_problems = []
    for prob in problems:
        skills = prob.get('skills', [])
        if not skills: continue
        
        prob_score = sum(1 - mastery.get(skill, 0.5) for skill in skills) / len(skills)
        scored_problems.append({**prob, 'score': prob_score})
    
    return jsonify({'recommendations': sorted(scored_problems, key=lambda x: x['score'], reverse=True)[:5]})

if __name__ == '__main__':
    app.run(port=5002)