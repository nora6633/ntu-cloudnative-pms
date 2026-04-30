package edu.ntu.pms.evaluation.service;

import java.util.List;
import java.util.Optional;

import org.springframework.security.access.AccessDeniedException;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import edu.ntu.pms.common.ResourceNotFoundException;
import edu.ntu.pms.evaluation.entity.Evaluation;
import edu.ntu.pms.evaluation.entity.EvaluationItem;
import edu.ntu.pms.evaluation.entity.Goal;
import edu.ntu.pms.evaluation.enums.EvaluationStatus;
import edu.ntu.pms.evaluation.exception.OverseenDepartmentNotFoundException;
import edu.ntu.pms.evaluation.repository.EvaluationRepository;
import edu.ntu.pms.security.AuthenticatedUser;
import edu.ntu.pms.user.entity.Department;
import edu.ntu.pms.user.entity.User;

/*
 * Service implementation for handling evaluation-related operations.
 * This class contains the business logic for creating evaluations, drafting goals and reviews,
 * and managing the status transitions of evaluations based on user actions and roles.
 */
@Service
@Transactional
public class EvaluationServiceImpl implements EvaluationService {

    private static final String RESOURCE_NAME = "Evaluation";

    private AuthenticatedUser currentUser;
    private EvaluationRepository repo;

    public EvaluationServiceImpl(AuthenticatedUser authUser, EvaluationRepository repo) {
        this.currentUser = authUser;
        this.repo = repo;
    }

    /* Utility Methods */

    private Evaluation getEvaluation(Long evaluationId) {
        return repo.findById(evaluationId)
                .orElseThrow(() -> new ResourceNotFoundException(RESOURCE_NAME, evaluationId));
    }

    /*
     * Checks if the current user has access to the evaluation as the employee.
     * Throws AccessDeniedException if the user is not the owner of the evaluation.
     */
    private void checkEmployeeAccess(Evaluation eval) {
        if (eval.getEmployee().getId() != currentUser.get().getId()) {
            throw new AccessDeniedException("You are not the owner of this evaluation.");
        }
    }

    /*
     * Checks if the current user has access to the evaluation as the supervisor.
     * Throws AccessDeniedException if the user is not the supervisor of the evaluation.
     */
    private void checkManagerAccess(Evaluation eval) {
        if (eval.getSupervisor().getId() != currentUser.get().getId()) {
            throw new AccessDeniedException("You are not the supervisor of this evaluation.");
        }
    }

    /*
     * Checks if the current user has access to the evaluation as the HR representative.
     * If the evaluation's department is not overseen by the current user, an AccessDeniedException is thrown.
     */
    private void checkHrAccess(Evaluation eval) {
        Department dept = Optional.ofNullable(currentUser.get().getOverseenDepartment())
                .orElseThrow(() -> new OverseenDepartmentNotFoundException(currentUser.get().getId()));
        if (eval.getDepartment().getId() != dept.getId()) {
            throw new AccessDeniedException("You do not oversee the department of this evaluation.");
        }
    }

    /* Retrieval Methods */

    @Override
    public List<Evaluation> getMyEvaluations() {
        return repo.findByEmployeeId(currentUser.get().getId());
    }

    @Override
    public List<Evaluation> getEvaluationsForManager() {
        return repo.findBySupervisorId(currentUser.get().getId());
    }

    @Override
    public List<Evaluation> getEvaluationsForHr() {
        Department dept = Optional.ofNullable(currentUser.get().getOverseenDepartment())
                .orElseThrow(() -> new OverseenDepartmentNotFoundException(currentUser.get().getId()));

        return repo.findByDepartmentId(dept.getId());
    }

    /* Creation Methods */

    @Override
    public void startEvaluationCycle(String cycle) {
        // TODO
    }

    public void createEvaluation(String cycle, User employee, User supervisor, Department department) {
        Evaluation eval = Evaluation.builder()
                .employee(employee)
                .supervisor(supervisor)
                .cycle(cycle)
                .department(department)
                .status(EvaluationStatus.INITIAL)
                .build();
        repo.save(eval);
    }

    @Override
    public void draftGoals(Long evaluationId, List<Goal> goals) {
        Evaluation eval = getEvaluation(evaluationId);

        eval.getStatus().assertIsInitial(eval);

        eval.setGoals(goals);
        repo.save(eval);
    }

    @Override
    public void draftReview(Long evaluationId, List<EvaluationItem> items) {
        Evaluation eval = getEvaluation(evaluationId);

        checkManagerAccess(eval);
        eval.getStatus().assertIsReview(eval);

        eval.setEvaluationItems(items);
        repo.save(eval);
    }


    /* Status Transition Methods */

    @Override
    public void submitForGoalApproval(Long evaluationId) {
        Evaluation eval = getEvaluation(evaluationId);

        checkEmployeeAccess(eval);
        eval.getStatus().assertIsInitial(eval);

        eval.submit();
        repo.save(eval);
    }

    @Override
    public void approveGoals(Long evaluationId) {
        Evaluation eval = getEvaluation(evaluationId);

        checkManagerAccess(eval);
        eval.getStatus().assertIsPendingGoalApproval(eval);

        eval.approve();
        repo.save(eval);
    }

    @Override
    public void rejectGoals(Long evaluationId) {
        Evaluation eval = getEvaluation(evaluationId);

        checkManagerAccess(eval);
        eval.getStatus().assertIsPendingGoalApproval(eval);

        eval.reject();
        repo.save(eval);
    }

    @Override
    public void submitForProgressReview(Long evaluationId) {
        Evaluation eval = getEvaluation(evaluationId);

        checkEmployeeAccess(eval);
        eval.getStatus().assertIsWorking(eval);

        eval.submit();
        repo.save(eval);
    }

    @Override
    public void submitReview(Long evaluationId) {
        Evaluation eval = getEvaluation(evaluationId);

        checkManagerAccess(eval);
        eval.getStatus().assertIsReview(eval);
        eval.submit();
        repo.save(eval);
    }

    @Override
    public void approveReview(Long evaluationId) {
        Evaluation eval = getEvaluation(evaluationId);

        checkEmployeeAccess(eval);
        eval.getStatus().assertIsPendingReviewConfirmation(eval);

        eval.approve();
        repo.save(eval);
    }

    @Override
    public void rejectReview(Long evaluationId) {
        Evaluation eval = getEvaluation(evaluationId);

        checkEmployeeAccess(eval);
        eval.getStatus().assertIsPendingReviewConfirmation(eval);

        eval.reject();
        repo.save(eval);
    }

    @Override
    public void approveEvaluation(Long evaluationId) {
        Evaluation eval = getEvaluation(evaluationId);

        checkHrAccess(eval);
        eval.getStatus().assertIsPendingClosure(eval);

        User hr = currentUser.get();
        eval.snapshot(hr);
        eval.approve();
        repo.save(eval);
    }

    @Override
    public void rejectEvaluation(Long evaluationId) {
        Evaluation eval = getEvaluation(evaluationId);

        checkHrAccess(eval);
        eval.getStatus().assertIsPendingClosure(eval);

        eval.reject();
        repo.save(eval);
    }

    
}
