package edu.ntu.pms.evaluation.controller;

import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import edu.ntu.pms.evaluation.dto.CreateProgressDTO;
import edu.ntu.pms.evaluation.dto.GoalDTO;
import edu.ntu.pms.evaluation.service.GoalService;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;

@RestController
@RequestMapping("/goals")
public class GoalController {

    private final GoalService goalService;

    public GoalController(GoalService goalService) {
        this.goalService = goalService;
    }

    @Tag(name = "employee")
    @PostMapping("/{id}/progress")
    public GoalDTO addProgress(@PathVariable Long id, @Valid @RequestBody CreateProgressDTO progressDTO) {
        return goalService.addProgress(id, progressDTO);
    }
}
