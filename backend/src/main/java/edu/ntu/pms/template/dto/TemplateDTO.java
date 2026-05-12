package edu.ntu.pms.template.dto;

import java.util.List;

import edu.ntu.pms.evaluation.enums.EvaluationType;
import io.swagger.v3.oas.annotations.media.ArraySchema;
import io.swagger.v3.oas.annotations.media.Schema;

@Schema(description = "Evaluation template details for a specific job")
public record TemplateDTO(
        @Schema(description = "Template ID", example = "10")
        Long id,

        @Schema(description = "Associated job ID", example = "1")
        Long jobId,

        @Schema(description = "Evaluation type of this template", example = "ANNUAL")
        EvaluationType evaluationType,

        @ArraySchema(schema = @Schema(implementation = CriterionDTO.class),
                arraySchema = @Schema(description = "Ordered list of evaluation criteria in this template"))
        List<CriterionDTO> criteria
) {
}
