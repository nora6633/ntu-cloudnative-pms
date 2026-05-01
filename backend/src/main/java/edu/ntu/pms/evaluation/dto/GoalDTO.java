package edu.ntu.pms.evaluation.dto;

import java.time.LocalDate;
import java.util.List;

import io.swagger.v3.oas.annotations.media.Schema;
import jakarta.validation.constraints.Future;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotEmpty;

public record GoalDTO(
    Long id,

    @Schema(description = "A clear and concise statement of the goal", example = "Complete the performance management system implementation by the end of the year")
    @NotBlank String definition,

    @Schema(description = "The metric used to measure the goal's success", example = "Project completion")
    @NotBlank String metric,

    @Schema(description = "The required resource for the goal completion", example = "Development team")
    @NotBlank String resource,

    @Schema(description = "The relevance the goal to the evaluation criteria", example = "This goal is critical for the successful implementation of the performance management system, which is a key initiative for the organization this year.")
    @NotBlank String relevance,

    @Schema(description = "The date by which the goal should be completed", example = "2027-12-31")
    @Future LocalDate deadline,

    @Schema(description = "The criteria against which the goal will be evaluated", example = "[\"Team Collaboration\", \"Code Quality\"]")
    @NotEmpty List<String> criteria,

    @Schema(description = "The progress updates for the goal")
    List<ProgressDTO> progresses
) {}