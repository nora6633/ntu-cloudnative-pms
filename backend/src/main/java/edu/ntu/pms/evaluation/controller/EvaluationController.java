package edu.ntu.pms.evaluation.controller;

import java.util.List;
import java.util.stream.Collectors;

import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import edu.ntu.pms.evaluation.dto.EvaluationDTO;
import edu.ntu.pms.evaluation.dto.EvaluationItemDTO;
import edu.ntu.pms.evaluation.dto.GoalDTO;
import edu.ntu.pms.evaluation.entity.EvaluationItem;
import edu.ntu.pms.evaluation.entity.Goal;
import edu.ntu.pms.evaluation.mapper.EvaluationMapper;
import edu.ntu.pms.evaluation.service.EvaluationService;

@RestController
@RequestMapping("/evaluations")
public class EvaluationController {
    
    private EvaluationService service;
    private EvaluationMapper mapper;

    public EvaluationController(EvaluationService service, EvaluationMapper mapper) {
        this.service = service;
        this.mapper = mapper;
    }

    @GetMapping("/my-evaluations")
    public List<EvaluationDTO> getMyEvaluations() {
        return service.getMyEvaluations().stream()
            .map(mapper::toDto)
            .collect(Collectors.toList());
    } 

    @PreAuthorize("hasRole('ROLE_MANAGER')")
    @GetMapping("/manager-evaluations")
    public List<EvaluationDTO> getEvaluationsForManager() {
        return service.getEvaluationsForManager().stream()
            .map(mapper::toDto)
            .collect(Collectors.toList());
    }

    @PreAuthorize("hasRole('ROLE_HR')")
    @GetMapping("/hr-evaluations")
    public List<EvaluationDTO> getEvaluationsForHr() {
        return service.getEvaluationsForHr().stream()
            .map(mapper::toDto)
            .collect(Collectors.toList());
    }

    @PreAuthorize("hasRole('ROLE_HR')")
    @PostMapping("/start-cycle")
    public String startEvaluationCycle(@RequestParam String cycleName) {
        service.startEvaluationCycle(cycleName);
        return "Evaluation cycle started: " + cycleName;
    }

    @PostMapping("/draft-goals")
    public String draftGoals(@RequestParam Long evaluationId, @RequestBody List<GoalDTO> goalDTOs) {
        List<Goal> goals = goalDTOs.stream()
            .map(dto -> mapper.toGoal(dto, evaluationId))
            .collect(Collectors.toList());
        service.draftGoals(evaluationId, goals);
        return "Goals drafted successfully for evaluation: " + evaluationId;
    }

    @PostMapping("/draft-review")
    public String draftReview(@RequestParam Long evaluationId, @RequestBody List<EvaluationItemDTO> items) {
        List<EvaluationItem> evaluationItems = items.stream()
            .map(dto -> mapper.toEvaluationItem(dto, evaluationId))
            .collect(Collectors.toList());
        service.draftReview(evaluationId, evaluationItems);
        return "Review drafted successfully for evaluation: " + evaluationId;
    }

    /* Status Transition Methods */

    // Employee actions

    @PostMapping("/submit-for-goal-approval")
    public String submitForGoalApproval(@RequestParam Long evaluationId) {
        service.submitForGoalApproval(evaluationId);
        return "Evaluation submitted for goal approval: " + evaluationId;
    }

    @PostMapping("/submit-for-progress-review")
    public String submitForProgressReview(@RequestParam Long evaluationId) {
        service.submitForProgressReview(evaluationId);
        return "Evaluation submitted for progress review: " + evaluationId;
    }

    @PostMapping("/approve-review")
    public String approveReview(@RequestParam Long evaluationId) {
        service.approveReview(evaluationId);
        return "Review approved successfully for evaluation: " + evaluationId;
    }

    @PostMapping("/reject-review")
    public String rejectReview(@RequestParam Long evaluationId) {
        service.rejectReview(evaluationId);
        return "Review rejected for evaluation: " + evaluationId;
    }

    // Manager actions

    @PreAuthorize("hasRole('ROLE_MANAGER')")
    @PostMapping("/approve-goals")
    public String approveGoals(@RequestParam Long evaluationId) {
        service.approveGoals(evaluationId);
        return "Goals approved for evaluation: " + evaluationId;
    }

    @PreAuthorize("hasRole('ROLE_MANAGER')")
    @PostMapping("/reject-goals")
    public String rejectGoals(@RequestParam Long evaluationId) {
        service.rejectGoals(evaluationId);
        return "Goals rejected for evaluation: " + evaluationId;
    }

    @PreAuthorize("hasRole('ROLE_MANAGER')")
    @PostMapping("/submit-review")
    public String submitReview(@RequestParam Long evaluationId) {
        service.submitReview(evaluationId);
        return "Review submitted for evaluation: " + evaluationId;
    }

    // HR actions

    @PreAuthorize("hasRole('ROLE_HR')")
    @PostMapping("/approve-evaluation")
    public String approveEvaluation(@RequestParam Long evaluationId) {
        service.approveEvaluation(evaluationId);
        return "Evaluation approved for evaluation: " + evaluationId;
    }

    @PreAuthorize("hasRole('ROLE_HR')")
    @PostMapping("/reject-evaluation")
    public String rejectEvaluation(@RequestParam Long evaluationId) {
        service.rejectEvaluation(evaluationId);
        return "Evaluation rejected for evaluation: " + evaluationId;
    }
}
