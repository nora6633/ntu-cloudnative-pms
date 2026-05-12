package edu.ntu.pms.evaluation.service;

import edu.ntu.pms.evaluation.dto.CreateProgressDTO;
import edu.ntu.pms.evaluation.dto.GoalDTO;

public interface GoalService {
    GoalDTO addProgress(Long goalId, CreateProgressDTO progressDTO);
}
