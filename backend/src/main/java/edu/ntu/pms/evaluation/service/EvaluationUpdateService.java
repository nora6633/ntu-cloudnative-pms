package edu.ntu.pms.evaluation.service;

import java.util.List;
import java.util.Set;
import java.util.stream.Collectors;

import org.springframework.stereotype.Service;

import edu.ntu.pms.common.ResourceNotFoundException;
import edu.ntu.pms.evaluation.dto.EvaluationItemDTO;
import edu.ntu.pms.evaluation.dto.GoalDTO;
import edu.ntu.pms.evaluation.entity.Evaluation;
import edu.ntu.pms.evaluation.entity.EvaluationItem;
import edu.ntu.pms.evaluation.entity.Goal;
import edu.ntu.pms.evaluation.enums.EvaluationStatus;
import edu.ntu.pms.evaluation.mapper.EvaluationMapper;
import edu.ntu.pms.evaluation.repository.EvaluationRepository;
import jakarta.transaction.Transactional;

@Service
public class EvaluationUpdateService {

    private static final String RESOURCE_NAME = "Evaluation";

    private final EvaluationRepository evalRepo;
    private final EvaluationAuthorizationService authorizationService;
    private final EvaluationMapper mapper;

    public EvaluationUpdateService(EvaluationRepository evalRepo, EvaluationAuthorizationService authorizationService, EvaluationMapper mapper) {
        this.evalRepo = evalRepo;
        this.authorizationService = authorizationService;
        this.mapper = mapper;
    }

    // Helper methods for fetching evaluation and checking status/access
    private Evaluation getEvaluation(Long evaluationId) {
        return evalRepo.findById(evaluationId)
                .orElseThrow(() -> new ResourceNotFoundException(RESOURCE_NAME, evaluationId));
    }

    private void checkEvaluationStatus(Evaluation eval, EvaluationStatus requiredStatus) {
        if (eval.getStatus() != requiredStatus) {
            throw new IllegalStateException("Evaluation must be in " + requiredStatus + " status");
        }
    }

    /**
     * Allows the employee to draft or update their goals for an evaluation in INITIAL status.
     * The method performs the following steps:
     * 1. Retrieves the evaluation by ID and checks if it exists.
     * 2. Verifies that the evaluation is in INITIAL status; if not, it throws an IllegalStateException.
     * 3. Checks if the current user has access to the evaluation as the employee; if not, it throws an AccessDeniedException.
     * 4. Handles goal updates by first determining which existing goals are being updated, which are being removed, and which are new.
     *    - For existing goals, it updates their properties based on the incoming GoalDTOs.
     *    - For new goals, it creates new Goal entities and associates them with the evaluation.
     *    - For removed goals, it relies on the orphan removal feature to delete them from the database.
     * 5. Saves the updated evaluation back to the repository.
     * @param evaluationId
     * @param goalDTOs
     */
    @Transactional
    public void draftGoals(Long evaluationId, List<GoalDTO> goalDTOs) {
        Evaluation eval = getEvaluation(evaluationId);
        checkEvaluationStatus(eval, EvaluationStatus.INITIAL);
        authorizationService.checkEmployeeAccess(eval);

        // Orphan Removal
        removeOrphanedGoals(eval, goalDTOs);

        // Update existing goals and add new goals
        goalDTOs.stream()
            .forEach(dto -> {
                if (dto.id() != null) 
                    updateExistingGoal(dto, eval);
                else 
                    addNewGoal(dto, eval);
            });

        evalRepo.save(eval);
    }

    private void removeOrphanedGoals(Evaluation eval, List<GoalDTO> goalDTOs) {
        Set<Long> incomingGoalIds = goalDTOs.stream()
                .filter(dto -> dto.id() != null)
                .map(GoalDTO::id)
                .collect(Collectors.toSet());
        eval.getGoals().removeIf(goal -> goal.getId() != null && !incomingGoalIds.contains(goal.getId()));
    }

    private void updateExistingGoal(GoalDTO dto, Evaluation eval) {
        Goal existingGoal = eval.getGoals().stream()
                .filter(g -> g.getId().equals(dto.id()))
                .findFirst()
                .orElseThrow(() -> new ResourceNotFoundException("Goal", dto.id()));
        mapper.updateGoalFromDto(dto, existingGoal);
    }

    private void addNewGoal(GoalDTO dto, Evaluation eval) {
        Goal newGoal = mapper.toGoal(dto);
        newGoal.setEvaluation(eval); // Set the relationship
        eval.getGoals().add(newGoal);
    }

    /**
     * Allows the supervisor to draft or update their review for an evaluation in REVIEW status.
     * The method performs the following steps:
     * 1. Retrieves the evaluation by ID and checks if it exists.
     * 2. Verifies that the evaluation is in REVIEW status; if not, it throws an IllegalStateException.
     * 3. Checks if the current user has access to the evaluation as the supervisor; if not, it throws an AccessDeniedException.
     * 4. For each incoming EvaluationItemDTO, it finds the corresponding existing EvaluationItem by ID and updates its properties based on the DTO. 
     * If any DTO references an ID that does not exist in the evaluation, it throws a ResourceNotFoundException.
     * 5. Saves the updated evaluation back to the repository.
     * @param evaluationId
     * @param itemDTOs
     */
    @Transactional
    public void draftReview(Long evaluationId, List<EvaluationItemDTO> itemDTOs) {
        Evaluation eval = getEvaluation(evaluationId);
        checkEvaluationStatus(eval, EvaluationStatus.REVIEW);
        authorizationService.checkManagerAccess(eval);

        itemDTOs.stream()
            .forEach(dto -> {
                EvaluationItem existingItem = eval.getEvaluationItems().stream()
                    .filter(i -> i.getId().equals(dto.id()))
                    .findFirst()
                    .orElseThrow(() -> new ResourceNotFoundException("EvaluationItem", dto.id()));
                mapper.updateItemFromDto(dto, existingItem);
            });

        evalRepo.save(eval);
    }
}
