package edu.ntu.pms.template.dto;

import io.swagger.v3.oas.annotations.media.Schema;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

@Schema(description = "A single evaluation criterion within a template")
public record CriterionDTO(
        @Schema(description = "Criterion title", example = "Code Quality")
        @NotBlank(message = "title is required")
        @Size(max = 255, message = "title must be at most 255 characters")
        String title,

        @Schema(description = "Criterion description", example = "Assess the quality, readability, and maintainability of delivered code.")
        @Size(max = 255, message = "description must be at most 255 characters")
        String description
) {
}
