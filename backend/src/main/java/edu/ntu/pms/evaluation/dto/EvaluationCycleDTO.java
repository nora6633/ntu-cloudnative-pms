package edu.ntu.pms.evaluation.dto;

import java.util.Map;

import edu.ntu.pms.evaluation.enums.EvaluationType;
import io.swagger.v3.oas.annotations.media.Schema;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotEmpty;
import jakarta.validation.constraints.NotNull;

public record EvaluationCycleDTO(
    @Schema(description = "Name of the evaluation cycle, e.g., '2026'", example = "2026")
    @NotBlank String cycleName,

    @Schema(description = "Type of the evaluation cycle", example = "ANNUAL")
    @NotNull EvaluationType evaluationType,

    @Schema(description = "Mapping of job IDs to evaluation template IDs for this cycle", example = "{ \"1\": 1, \"2\": 2, \"3\": 3, \"4\": 4 }")
    @NotEmpty Map<Long, Long> jobToTemplateIdMap
) {}
