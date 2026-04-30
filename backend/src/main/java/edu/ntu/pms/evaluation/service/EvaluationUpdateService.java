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

    @Transactional
    public void draftGoals(Long evaluationId, List<GoalDTO> goalDTOs) {
        Evaluation eval = getEvaluation(evaluationId);
        if (eval.getStatus() != EvaluationStatus.INITIAL) {
            throw new IllegalStateException("Can only update goals in INITIAL status");
        }
        authorizationService.checkEmployeeAccess(eval);

        // Orphan Removal
        Set<Long> incomingGoalIds = goalDTOs.stream()
                .filter(dto -> dto.id() != null)
                .map(GoalDTO::id)
                .collect(Collectors.toSet());

        eval.getGoals().removeIf(goal -> goal.getId() != null && !incomingGoalIds.contains(goal.getId()));

        // Update existing goals and add new goals
        for (GoalDTO dto : goalDTOs) {
            if (dto.id() != null) { // Existing goal - update
                Goal existingGoal = eval.getGoals().stream()
                        .filter(g -> g.getId().equals(dto.id()))
                        .findFirst()
                        .orElseThrow(() -> new ResourceNotFoundException("Goal", dto.id()));
                mapper.updateGoalFromDto(dto, existingGoal);
            }
            else { // New goal - create
                Goal newGoal = mapper.toGoal(dto);
                newGoal.setEvaluation(eval); // Set the relationship
                eval.getGoals().add(newGoal);
            }
        }
        evalRepo.save(eval);
    }

    @Transactional
    public void draftReview(Long evaluationId, List<EvaluationItemDTO> itemDTOs) {
        Evaluation eval = getEvaluation(evaluationId);
        if (eval.getStatus() != EvaluationStatus.REVIEW) {
            throw new IllegalStateException("Can only update review in REVIEW status");
        }
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

    private Evaluation getEvaluation(Long evaluationId) {
        return evalRepo.findById(evaluationId)
                .orElseThrow(() -> new ResourceNotFoundException(RESOURCE_NAME, evaluationId));
    }
}
