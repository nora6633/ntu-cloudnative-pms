package edu.ntu.pms.template.dto;

import io.swagger.v3.oas.annotations.media.Schema;

@Schema(description = "A single evaluation criterion within a template")
public record CriterionDTO(
        @Schema(description = "Criterion title", example = "Code Quality")
        String title,

        @Schema(description = "Criterion description", example = "Assess the quality, readability, and maintainability of delivered code.")
        String description
) {
}
