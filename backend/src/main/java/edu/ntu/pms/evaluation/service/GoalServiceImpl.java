package edu.ntu.pms.evaluation.service;

import java.time.LocalDateTime;

import org.springframework.stereotype.Service;

import edu.ntu.pms.common.ResourceNotFoundException;
import edu.ntu.pms.evaluation.dto.CreateProgressDTO;
import edu.ntu.pms.evaluation.dto.GoalDTO;
import edu.ntu.pms.evaluation.entity.Goal;
import edu.ntu.pms.evaluation.entity.Progress;
import edu.ntu.pms.evaluation.enums.EvaluationStatus;
import edu.ntu.pms.evaluation.mapper.EvaluationMapper;
import edu.ntu.pms.evaluation.repository.GoalRepository;
import jakarta.transaction.Transactional;

@Service
public class GoalServiceImpl implements GoalService {

    private final GoalRepository goalRepository;
    private final EvaluationAuthorizationService authorizationService;
    private final EvaluationMapper mapper;

    public GoalServiceImpl(GoalRepository goalRepository, EvaluationAuthorizationService authorizationService, EvaluationMapper mapper) {
        this.goalRepository = goalRepository;
        this.authorizationService = authorizationService;
        this.mapper = mapper;
    }

    @Override
    @Transactional
    public GoalDTO addProgress(Long goalId, CreateProgressDTO progressDTO) {
        // 1. Find the goal
        Goal goal = goalRepository.findById(goalId)
                .orElseThrow(() -> new ResourceNotFoundException("Goal", goalId));

        // 2. Check evaluation status
        if (goal.getEvaluation() == null) {
            throw new IllegalStateException("Goal is not associated with any evaluation.");
        }
        
        EvaluationStatus status = goal.getEvaluation().getStatus();
        if (status != EvaluationStatus.WORKING) {
            throw new IllegalStateException("Evaluation must be in WORKING status to update progress.");
        }

        // 3. Check authorization
        authorizationService.checkEmployeeAccess(goal);

        // 4. Check array size to prevent malicious infinite growth (OOM prevention)
        if (goal.getProgresses().size() >= 50) {
            throw new IllegalArgumentException("Maximum number of progress updates (50) reached for this goal.");
        }

        // 5. Create and add progress
        Progress progress = new Progress();
        progress.setDescription(progressDTO.description());
        progress.setTimestamp(LocalDateTime.now()); // Backend generated timestamp
        
        goal.getProgresses().add(progress);

        // 6. Save the goal and return the updated DTO
        goal = goalRepository.save(goal);
        return mapper.toGoalDto(goal);
    }
}
