package edu.ntu.pms.evaluation.service;

import java.util.List;
import java.util.Map;
import java.util.Optional;
import org.springframework.stereotype.Service;

import edu.ntu.pms.common.ResourceNotFoundException;
import edu.ntu.pms.evaluation.dto.EvaluationItemDTO;
import edu.ntu.pms.evaluation.dto.GoalDTO;
import edu.ntu.pms.evaluation.entity.Evaluation;
import edu.ntu.pms.evaluation.enums.EvaluationType;
import edu.ntu.pms.evaluation.exception.OverseenDepartmentNotFoundException;
import edu.ntu.pms.evaluation.repository.EvaluationRepository;
import edu.ntu.pms.security.AuthenticatedUser;
import edu.ntu.pms.user.entity.Department;
import edu.ntu.pms.user.entity.User;

/**
 * Service class responsible for handling evaluation-related operations. This
 * class serves as the main entry point for evaluation management and
 * orchestrates the various services involved in the evaluation process,
 * including creation, authorization, and lifecycle management. It interacts
 * with the EvaluationRepository to persist evaluations, the
 * EvaluationCreationService to handle the creation of evaluations, and the
 * EvaluationAuthorizationService to enforce access control based on user roles
 * and relationships to the evaluation.
 */
@Service
public class EvaluationServiceImpl implements EvaluationService {

    private static final String RESOURCE_NAME = "Evaluation";

    private final AuthenticatedUser currentUser;
    private final EvaluationRepository evalRepo;
    private final EvaluationCreationService creationService;
    private final EvaluationUpdateService updateService;
    private final EvaluationAuthorizationService authorizationService;

    public EvaluationServiceImpl(
        AuthenticatedUser currentUser,
        EvaluationRepository evalRepo,
        EvaluationCreationService creationService,
        EvaluationUpdateService updateService,
        EvaluationAuthorizationService authorizationService
    ) {
        this.currentUser = currentUser;
        this.evalRepo = evalRepo;
        this.creationService = creationService;
        this.updateService = updateService;
        this.authorizationService = authorizationService;
    }

    @Override
    public List<Evaluation> getMyEvaluations() {
        return evalRepo.findByEmployeeId(currentUser.get().getId());
    }

    @Override
    public List<Evaluation> getEvaluationsForManager() {
        return evalRepo.findBySupervisorId(currentUser.get().getId());
    }

    @Override
    public List<Evaluation> getEvaluationsForHr() {
        Department dept = Optional.ofNullable(currentUser.get().getOverseenDepartment())
                .orElseThrow(() -> new OverseenDepartmentNotFoundException(currentUser.get().getId()));

        return evalRepo.findByDepartmentId(dept.getId());
    }

    private Evaluation getEvaluation(Long evaluationId) {
        return evalRepo.findById(evaluationId)
                .orElseThrow(() -> new ResourceNotFoundException(RESOURCE_NAME, evaluationId));
    }

    /* Creation Methods */

    @Override
    public void startEvaluationCycle(String cycleName, EvaluationType evaluationType, Map<Long, Long> jobToTemplateIdMap) {
        creationService.startEvaluationCycle(cycleName, evaluationType, jobToTemplateIdMap);
    }

    @Override
    public void createEvaluationForNewUser(User user, Long templateId) {
        creationService.createEvaluationForNewUser(user, templateId);
    }

    /* Drafting Methods */

    @Override
    public void draftGoals(Long evaluationId, List<GoalDTO> goalDTOs) {
        updateService.draftGoals(evaluationId, goalDTOs);
    }

    @Override
    public void draftReview(Long evaluationId, List<EvaluationItemDTO> itemDTOs) {
        updateService.draftReview(evaluationId, itemDTOs);
    }

    /* Status Transition Methods */

    @Override
    public void submitForGoalApproval(Long evaluationId) {
        Evaluation eval = getEvaluation(evaluationId);
        authorizationService.checkEmployeeAccess(eval);
        eval.submitForGoalApproval();
        evalRepo.save(eval);
    }

    @Override
    public void approveGoals(Long evaluationId) {
        Evaluation eval = getEvaluation(evaluationId);
        authorizationService.checkManagerAccess(eval);
        eval.approveGoals();
        evalRepo.save(eval);
    }

    @Override
    public void rejectGoals(Long evaluationId) {
        Evaluation eval = getEvaluation(evaluationId);
        authorizationService.checkManagerAccess(eval);
        eval.rejectGoals();
        evalRepo.save(eval);
    }

    @Override
    public void submitForProgressReview(Long evaluationId) {
        Evaluation eval = getEvaluation(evaluationId);
        authorizationService.checkEmployeeAccess(eval);
        eval.submitForProgressReview();
        evalRepo.save(eval);
    }

    @Override
    public void submitReview(Long evaluationId) {
        Evaluation eval = getEvaluation(evaluationId);
        authorizationService.checkManagerAccess(eval);
        eval.submitReview();
        evalRepo.save(eval);
    }

    @Override
    public void approveReview(Long evaluationId) {
        Evaluation eval = getEvaluation(evaluationId);
        authorizationService.checkEmployeeAccess(eval);
        eval.approveReview();
        evalRepo.save(eval);
    }

    @Override
    public void rejectReview(Long evaluationId) {
        Evaluation eval = getEvaluation(evaluationId);
        authorizationService.checkEmployeeAccess(eval);
        eval.rejectReview();
        evalRepo.save(eval);
    }

    @Override
    public void approveEvaluation(Long evaluationId) {
        Evaluation eval = getEvaluation(evaluationId);
        authorizationService.checkHrAccess(eval);
        eval.approveEvaluation();

        User hr = currentUser.get();
        eval.snapshot(hr);
        evalRepo.save(eval);
    }

    @Override
    public void rejectEvaluation(Long evaluationId) {
        Evaluation eval = getEvaluation(evaluationId);
        authorizationService.checkHrAccess(eval);
        eval.rejectEvaluation();
        evalRepo.save(eval);
    }
}
