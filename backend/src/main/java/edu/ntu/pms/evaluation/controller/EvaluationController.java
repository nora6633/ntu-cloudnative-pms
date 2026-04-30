package edu.ntu.pms.evaluation.controller;

import java.util.List;
import java.util.stream.Collectors;

import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import edu.ntu.pms.evaluation.dto.EvaluationCycleDTO;
import edu.ntu.pms.evaluation.dto.EvaluationDTO;
import edu.ntu.pms.evaluation.dto.EvaluationItemDTO;
import edu.ntu.pms.evaluation.dto.GoalDTO;
import edu.ntu.pms.evaluation.mapper.EvaluationMapper;
import edu.ntu.pms.evaluation.service.EvaluationService;
import jakarta.validation.Valid;

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
    public String startEvaluationCycle(@Valid @RequestBody EvaluationCycleDTO cycleDTO) {
        service.startEvaluationCycle(cycleDTO.cycleName(), cycleDTO.evaluationType(), cycleDTO.jobToTemplateIdMap());
        return "Evaluation cycle started: " + cycleDTO.cycleName();
    }

    @PostMapping("/{id}/draft-goals")
    public String draftGoals(@PathVariable Long id, @Valid @RequestBody List<GoalDTO> goalDTOs) {
        service.draftGoals(id, goalDTOs);
        return "Goals drafted successfully";
    }

    @PostMapping("/{id}/draft-review")
    public String draftReview(@PathVariable Long id, @Valid @RequestBody List<EvaluationItemDTO> items) {
        service.draftReview(id, items);
        return "Review drafted successfully";
    }

    /* Status Transition Methods */

    // Employee actions

    @PostMapping("/{id}/submit-for-goal-approval")
    public String submitForGoalApproval(@PathVariable Long id) {
        service.submitForGoalApproval(id);
        return "Evaluation submitted for goal approval";
    }

    @PostMapping("/{id}/submit-for-progress-review")
    public String submitForProgressReview(@PathVariable Long id) {
        service.submitForProgressReview(id);
        return "Evaluation submitted for progress review";
    }

    @PostMapping("/{id}/approve-review")
    public String approveReview(@PathVariable Long id) {
        service.approveReview(id);
        return "Review approved";
    }

    @PostMapping("/{id}/reject-review")
    public String rejectReview(@PathVariable Long id) {
        service.rejectReview(id);
        return "Review rejected";
    }

    // Manager actions

    @PreAuthorize("hasRole('ROLE_MANAGER')")
    @PostMapping("/{id}/approve-goals")
    public String approveGoals(@PathVariable Long id) {
        service.approveGoals(id);
        return "Goals approved";
    }

    @PreAuthorize("hasRole('ROLE_MANAGER')")
    @PostMapping("/{id}/reject-goals")
    public String rejectGoals(@PathVariable Long id) {
        service.rejectGoals(id);
        return "Goals rejected";
    }

    @PreAuthorize("hasRole('ROLE_MANAGER')")
    @PostMapping("/{id}/submit-review")
    public String submitReview(@PathVariable Long id) {
        service.submitReview(id);
        return "Review submitted for employee confirmation";
    }

    // HR actions

    @PreAuthorize("hasRole('ROLE_HR')")
    @PostMapping("/{id}/approve-evaluation")
    public String approveEvaluation(@PathVariable Long id) {
        service.approveEvaluation(id);
        return "Evaluation approved for closure";
    }

    @PreAuthorize("hasRole('ROLE_HR')")
    @PostMapping("/{id}/reject-evaluation")
    public String rejectEvaluation(@PathVariable Long id) {
        service.rejectEvaluation(id);
        return "Evaluation rejected for closure";
    }
}
