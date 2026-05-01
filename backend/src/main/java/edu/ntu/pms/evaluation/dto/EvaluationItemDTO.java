package edu.ntu.pms.evaluation.dto;

import io.swagger.v3.oas.annotations.media.Schema;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;

public record EvaluationItemDTO(
    @NotNull Long id,

    @Schema(description = "Name of the evaluation item", example = "Code Quality")
    @NotBlank String name,
    
    @Schema(description = "Description of the evaluation item", example = "Assessment of the code quality standards")
    @NotBlank String description,

    @Schema(description = "Feedback for the evaluation item", example = "Code is well-structured and maintainable")
    String feedback,

    @Schema(description = "Rating for the evaluation item", example = "5")
    Integer rating
) {}