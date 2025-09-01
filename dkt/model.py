import torch
import torch.nn as nn
import torch.optim as optim
from torch.utils.data import Dataset, DataLoader
from typing import List, Dict, Tuple
import logging

# Setup logging for model-related information
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

class DKTDataset(Dataset):
    """Creates a dataset for DKT model training."""
    
    def __init__(self, sequences: List[List[Tuple[int, int]]], max_seq_length: int = 100):
        self.sequences = sequences
        self.max_seq_length = max_seq_length
        
    def __len__(self):
        return len(self.sequences)
    
    def __getitem__(self, idx):
        sequence = self.sequences[idx][-self.max_seq_length:]
        
        inputs = [s[0] * 2 + s[1] for s in sequence]
        targets = [s[1] for s in sequence[1:]] + [-1]
        
        padding_len = self.max_seq_length - len(inputs)
        inputs.extend([0] * padding_len)
        targets.extend([-1] * padding_len)
            
        return torch.tensor(inputs, dtype=torch.long), torch.tensor(targets, dtype=torch.float)

class DKTModel(nn.Module):
    """Deep Knowledge Tracing model using LSTM."""
    
    def __init__(self, num_skills: int, hidden_size: int = 128, num_layers: int = 2, dropout: float = 0.2):
        super(DKTModel, self).__init__()
        self.num_skills = num_skills
        self.hidden_size = hidden_size
        self.num_layers = num_layers
        
        self.embedding = nn.Embedding(num_skills * 2 + 1, hidden_size, padding_idx=0)
        self.lstm = nn.LSTM(hidden_size, hidden_size, num_layers, dropout=dropout, batch_first=True)
        self.output_layer = nn.Linear(hidden_size, 1)
        self.dropout = nn.Dropout(dropout)
        
    def forward(self, x, hidden=None):
        embedded = self.dropout(self.embedding(x))
        lstm_out, hidden = self.lstm(embedded, hidden)
        output = self.output_layer(self.dropout(lstm_out))
        return torch.sigmoid(output).squeeze(-1), hidden

class DKTTrainer:
    """Handles the training process for the DKT model."""
    
    def __init__(self, model: DKTModel, device: str = 'cpu'):
        self.model = model.to(device)
        self.device = device
        self.optimizer = optim.Adam(model.parameters(), lr=0.001)
        self.criterion = nn.BCELoss(reduction='none')
        
    def train_epoch(self, dataloader: DataLoader) -> float:
        """Trains the model for one full epoch."""
        self.model.train()
        total_loss = 0.0
        
        for inputs, targets in dataloader:
            inputs, targets = inputs.to(self.device), targets.to(self.device)
            self.optimizer.zero_grad()
            predictions, _ = self.model(inputs)
            
            mask = (targets != -1).float()
            loss = (self.criterion(predictions, targets) * mask).sum() / mask.sum()
            
            loss.backward()
            self.optimizer.step()
            total_loss += loss.item()
            
        return total_loss / len(dataloader)

class DKTPredictor:
    """Makes predictions using a trained DKT model."""
    
    def __init__(self, model: DKTModel, skill_mapping: Dict[str, int], device: str = 'cpu'):
        self.model = model.to(device)
        self.device = device
        self.skill_mapping = skill_mapping
        
    def predict_next_problem_success(self, user_sequence: List[Tuple[str, bool]], target_skill: str) -> float:
        """Predicts success probability for the next problem."""
        self.model.eval()
        
        sequence_ids = [(self.skill_mapping[s], int(c)) for s, c in user_sequence if s in self.skill_mapping]
        if not sequence_ids: return 0.5
        
        inputs = [sid * 2 + c for sid, c in sequence_ids]
        target_skill_id = self.skill_mapping.get(target_skill, 0)
        
        test_inputs = torch.tensor([inputs + [target_skill_id * 2 + 0]], dtype=torch.long).to(self.device)
        with torch.no_grad():
            pred, _ = self.model(test_inputs)
            # Prediction for the next step is the last element of the sequence output
            prediction = pred[0, -1].item()
        
        return prediction
    
    def get_skill_mastery(self, user_sequence: List[Tuple[str, bool]]) -> Dict[str, float]:
        """Calculates current mastery for all skills."""
        return {skill: self.predict_next_problem_success(user_sequence, skill) for skill in self.skill_mapping}
    
    def recommend_next_problems(self, user_sequence: List[Tuple[str, bool]], 
                              available_problems: List[Dict], 
                              target_difficulty: float = 0.6) -> List[Dict]:
        """Recommends problems by matching predicted success to target difficulty."""
        recommendations = []
        for prob in available_problems:
            if 'tags' not in prob or not prob['tags']: continue
            
            skill_probs = [self.predict_next_problem_success(user_sequence, s) for s in prob['tags']]
            if not skill_probs: continue

            avg_prob = sum(skill_probs) / len(skill_probs)
            recommendations.append({**prob, 'predicted_success': avg_prob, 'difficulty_score': 1.0 - abs(avg_prob - target_difficulty)})
        
        return sorted(recommendations, key=lambda x: x['difficulty_score'], reverse=True)

def prepare_training_data(user_interactions: List[Dict]) -> List[List[Tuple[int, int]]]:
    """Prepares user interaction data for training."""
    user_sequences = {}
    for i in user_interactions:
        user_sequences.setdefault(i['user_id'], []).append((i['timestamp'], i['skill_id'], i['correct']))
    
    return [[(s, c) for _, s, c in sorted(seqs)] for seqs in user_sequences.values() if len(seqs) > 1]
