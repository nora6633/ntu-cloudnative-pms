package edu.ntu.pms.evaluation.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;

public record EvaluationItemDTO(
    @NotNull Long id,
    @NotBlank String name,
    @NotBlank String description,
    String feedback,
    Integer rating
) {}