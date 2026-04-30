package edu.ntu.pms.evaluation.dto;

import java.util.Map;

import edu.ntu.pms.evaluation.enums.EvaluationType;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotEmpty;
import jakarta.validation.constraints.NotNull;

public record EvaluationCycleDTO(
    @NotBlank String cycleName,
    @NotNull EvaluationType evaluationType,
    @NotEmpty Map<Long, Long> jobToTemplateIdMap
) {}
