package edu.ntu.pms.template.dto;

import java.util.List;

import edu.ntu.pms.evaluation.enums.EvaluationType;
import io.swagger.v3.oas.annotations.media.ArraySchema;
import io.swagger.v3.oas.annotations.media.Schema;
import jakarta.validation.Valid;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotEmpty;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;

@Schema(description = "Request payload for creating an evaluation template")
public record CreateTemplateRequest(
        @Schema(description = "Associated job ID", example = "1")
        @NotNull(message = "jobId is required")
        Long jobId,

        @Schema(description = "Template name", example = "Engineering Annual Review")
        @NotBlank(message = "name is required")
        @Size(max = 150, message = "name must be at most 150 characters")
        String name,

        @Schema(description = "Evaluation type of this template", example = "ANNUAL")
        @NotNull(message = "evaluationType is required")
        EvaluationType evaluationType,

        @ArraySchema(schema = @Schema(implementation = CriterionDTO.class),
                arraySchema = @Schema(description = "Ordered list of evaluation criteria"))
        @NotEmpty(message = "criteria must contain at least one item")
        @Valid
        List<CriterionDTO> criteria
) {
}
