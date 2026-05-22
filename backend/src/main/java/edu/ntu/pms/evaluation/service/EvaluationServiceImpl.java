package edu.ntu.pms.evaluation.service;

import java.util.List;
import java.util.Map;
import java.util.Objects;
import java.util.Optional;
import java.util.stream.Collectors;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Slice;
import org.springframework.data.domain.SliceImpl;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

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
import lombok.RequiredArgsConstructor;

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
@RequiredArgsConstructor
public class EvaluationServiceImpl implements EvaluationService {

    private static final String RESOURCE_NAME = "Evaluation";

    private final AuthenticatedUser currentUser;
    private final EvaluationRepository evalRepo;
    private final EvaluationCreationService creationService;
    private final EvaluationUpdateService updateService;
    private final EvaluationAuthorizationService authorizationService;

    @Override
    @Transactional(readOnly = true)
    public Slice<Evaluation> getMyEvaluations(Pageable pageable) {
        Slice<Evaluation> page = evalRepo.findByEmployeeId(currentUser.get().getId(), pageable);
        return loadPageAndCollections(page, pageable);
    }

    @Override
    @Transactional(readOnly = true)
    public Slice<Evaluation> getEvaluationsForManager(Pageable pageable) {
        Slice<Evaluation> page = evalRepo.findBySupervisorId(currentUser.get().getId(), pageable);
        return loadPageAndCollections(page, pageable);
    }

    @Override
    @Transactional(readOnly = true)
    public Slice<Evaluation> getEvaluationsForHr(Pageable pageable) {
        User user = currentUser.get();
        Slice<Evaluation> page;
        if (user.getRole() == edu.ntu.pms.user.enums.Role.ADMIN) {
            page = evalRepo.findAll(pageable);
        } else {
            Department dept = Optional.ofNullable(user.getOverseenDepartment())
                    .orElseThrow(() -> new OverseenDepartmentNotFoundException(user.getId()));
            page = evalRepo.findByDepartmentId(dept.getId(), pageable);
        }
        return loadPageAndCollections(page, pageable);
    }

    /**
     * Helper: given a paged result of Evaluations, load their collection relationships
     * in a single IN-query and return a new Slice preserving order and pagination metadata.
     */
    private Slice<Evaluation> loadPageAndCollections(Slice<Evaluation> page, Pageable pageable) {
        List<Long> ids = page.getContent().stream().map(Evaluation::getId).collect(Collectors.toList());
        if (ids.isEmpty()) return page;

        List<Evaluation> fetched = evalRepo.findAllWithCollectionsByIdIn(ids);

        // Preserve the order of the original page by mapping back the fetched evaluations to their IDs
        final var byId = fetched.stream().collect(Collectors.toMap(Evaluation::getId, e -> e));
        List<Evaluation> ordered = ids.stream().map(byId::get).filter(Objects::nonNull).collect(Collectors.toList());
        return new SliceImpl<>(ordered, pageable, page.hasNext());
    }

    private Evaluation getEvaluation(Long evaluationId) {
        return evalRepo.findWithAllCollectionsById(evaluationId)
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
