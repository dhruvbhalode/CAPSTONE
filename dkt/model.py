import torch
import torch.nn as nn
import torch.optim as optim
from torch.utils.data import Dataset, DataLoader
from typing import List, Dict, Tuple

class DKTModel(nn.Module):
    def __init__(self, num_skills, embed_dim=128, hidden_dim=128, num_layers=1, dropout=0.2):
        super(DKTModel, self).__init__()
        self.num_skills = num_skills
        self.embedding = nn.Embedding(num_skills * 2, embed_dim)
        self.lstm = nn.LSTM(embed_dim, hidden_dim, num_layers, batch_first=True, dropout=dropout)
        self.fc = nn.Linear(hidden_dim, num_skills)
        self.dropout = nn.Dropout(dropout)

    def forward(self, x):
        embedded = self.dropout(self.embedding(x))
        lstm_out, _ = self.lstm(embedded)
        output = self.fc(self.dropout(lstm_out))
        return torch.sigmoid(output)

class DKTTrainer:
    def __init__(self, model):
        self.model = model
        self.optimizer = optim.Adam(model.parameters())
        self.criterion = nn.BCELoss()

    def train_epoch(self, dataloader):
        self.model.train()
        total_loss = 0
        for inputs, targets, skills in dataloader:
            self.optimizer.zero_grad()
            outputs = self.model(inputs)
            
            # Create a mask to identify non-padded parts of the sequence
            mask = (skills != -1)
            
            # THE FIX: Clone skills tensor and replace -1 with a valid index (0)
            # This prevents the `gather` operation from crashing.
            # The mask ensures these values are ignored in the loss calculation anyway.
            skills_for_gather = skills.clone()
            skills_for_gather[skills_for_gather == -1] = 0
            
            preds = outputs.gather(2, skills_for_gather.unsqueeze(2)).squeeze(-1)
            
            if mask.sum() > 0:
                loss = self.criterion(preds[mask], targets[mask])
                loss.backward()
                self.optimizer.step()
                total_loss += loss.item()

        return total_loss / len(dataloader) if len(dataloader) > 0 else 0

class DKTDataset(Dataset):
    def __init__(self, sequences, num_skills, max_seq_len=100):
        self.sequences = sequences
        self.num_skills = num_skills
        self.max_seq_len = max_seq_len

    def __len__(self):
        return len(self.sequences)

    def __getitem__(self, index):
        seq = self.sequences[index]
        inputs = torch.zeros(self.max_seq_len, dtype=torch.long)
        targets = torch.zeros(self.max_seq_len, dtype=torch.float)
        skills = -1 * torch.ones(self.max_seq_len, dtype=torch.long)

        for i, (skill_id, correct) in enumerate(seq):
            if i >= self.max_seq_len: break
            if skill_id is None or skill_id >= self.num_skills: continue
            
            inputs[i] = skill_id + (self.num_skills if correct else 0)
            targets[i] = float(correct)
            skills[i] = skill_id
            
        return inputs, targets, skills

def prepare_training_data(user_interactions: List[Dict]):
    user_sequences = {}
    for i in user_interactions:
        user_id = i['user_id']
        skill_id = i.get('skill_id') # Use .get for safety
        correct = int(i['correct'])
        if user_id not in user_sequences: user_sequences[user_id] = []
        if skill_id is not None:
            user_sequences[user_id].append((skill_id, correct))
    return list(user_sequences.values())