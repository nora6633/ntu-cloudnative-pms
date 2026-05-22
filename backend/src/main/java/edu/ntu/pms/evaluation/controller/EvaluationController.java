package edu.ntu.pms.evaluation.controller;

import java.util.List;
import java.util.stream.Collectors;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Slice;
import org.springframework.data.domain.SliceImpl;

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
import edu.ntu.pms.evaluation.entity.Evaluation;
import edu.ntu.pms.evaluation.mapper.EvaluationMapper;
import edu.ntu.pms.evaluation.service.EvaluationService;
import io.swagger.v3.oas.annotations.tags.Tag;
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

    @Tag(name = "employee")
    @GetMapping("/my-evaluations")
    public Slice<EvaluationDTO> getMyEvaluations(Pageable pageable) {
        Slice<Evaluation> page = service.getMyEvaluations(pageable);
        List<EvaluationDTO> dtos = page.getContent().stream()
            .map(mapper::toDto)
            .collect(Collectors.toList());
        return new SliceImpl<>(dtos, pageable, page.hasNext());
    }

    @Tag(name = "manager")
    @PreAuthorize("hasRole('ROLE_MANAGER')")
    @GetMapping("/manager-evaluations")
    public Slice<EvaluationDTO> getEvaluationsForManager(Pageable pageable) {
        Slice<Evaluation> page = service.getEvaluationsForManager(pageable);
        List<EvaluationDTO> dtos = page.getContent().stream()
            .map(mapper::toDto)
            .collect(Collectors.toList());
        return new SliceImpl<>(dtos, pageable, page.hasNext());
    }

    @Tag(name = "hr")
    @PreAuthorize("hasAnyRole('ROLE_HR', 'ROLE_ADMIN')")
    @GetMapping("/hr-evaluations")
    public Slice<EvaluationDTO> getEvaluationsForHr(Pageable pageable) {
        Slice<Evaluation> page = service.getEvaluationsForHr(pageable);
        List<EvaluationDTO> dtos = page.getContent().stream()
            .map(mapper::toDto)
            .collect(Collectors.toList());
        return new SliceImpl<>(dtos, pageable, page.hasNext());
    }

    @Tag(name = "admin")
    @PreAuthorize("hasRole('ROLE_ADMIN')")
    @PostMapping("/start-cycle")
    public String startEvaluationCycle(@Valid @RequestBody EvaluationCycleDTO cycleDTO) {
        service.startEvaluationCycle(cycleDTO.cycleName(), cycleDTO.evaluationType(), cycleDTO.jobToTemplateIdMap());
        return "Evaluation cycle started: " + cycleDTO.cycleName();
    }

    @Tag(name = "employee")
    @PostMapping("/{id}/draft-goals")
    public String draftGoals(@PathVariable Long id, @Valid @RequestBody List<GoalDTO> goalDTOs) {
        service.draftGoals(id, goalDTOs);
        return "Goals drafted successfully";
    }

    @Tag(name = "manager")
    @PostMapping("/{id}/draft-review")
    public String draftReview(@PathVariable Long id, @Valid @RequestBody List<EvaluationItemDTO> items) {
        service.draftReview(id, items);
        return "Review drafted successfully";
    }

    /* Status Transition Methods */

    // Employee actions

    @Tag(name = "employee")
    @PostMapping("/{id}/submit-for-goal-approval")
    public String submitForGoalApproval(@PathVariable Long id) {
        service.submitForGoalApproval(id);
        return "Evaluation submitted for goal approval";
    }

    @Tag(name = "employee")
    @PostMapping("/{id}/submit-for-progress-review")
    public String submitForProgressReview(@PathVariable Long id) {
        service.submitForProgressReview(id);
        return "Evaluation submitted for progress review";
    }

    @Tag(name = "employee")
    @PostMapping("/{id}/approve-review")
    public String approveReview(@PathVariable Long id) {
        service.approveReview(id);
        return "Review approved";
    }

    @Tag(name = "employee")
    @PostMapping("/{id}/reject-review")
    public String rejectReview(@PathVariable Long id) {
        service.rejectReview(id);
        return "Review rejected";
    }

    // Manager actions

    @Tag(name = "manager")
    @PreAuthorize("hasRole('ROLE_MANAGER')")
    @PostMapping("/{id}/approve-goals")
    public String approveGoals(@PathVariable Long id) {
        service.approveGoals(id);
        return "Goals approved";
    }

    @Tag(name = "manager")
    @PreAuthorize("hasRole('ROLE_MANAGER')")
    @PostMapping("/{id}/reject-goals")
    public String rejectGoals(@PathVariable Long id) {
        service.rejectGoals(id);
        return "Goals rejected";
    }

    @Tag(name = "manager")
    @PreAuthorize("hasRole('ROLE_MANAGER')")
    @PostMapping("/{id}/submit-review")
    public String submitReview(@PathVariable Long id) {
        service.submitReview(id);
        return "Review submitted for employee confirmation";
    }

    // HR actions

    @Tag(name = "hr")
    @PreAuthorize("hasRole('ROLE_HR')")
    @PostMapping("/{id}/approve-evaluation")
    public String approveEvaluation(@PathVariable Long id) {
        service.approveEvaluation(id);
        return "Evaluation approved for closure";
    }

    @Tag(name = "hr")
    @PreAuthorize("hasRole('ROLE_HR')")
    @PostMapping("/{id}/reject-evaluation")
    public String rejectEvaluation(@PathVariable Long id) {
        service.rejectEvaluation(id);
        return "Evaluation rejected for closure";
    }
}
