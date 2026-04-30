package edu.ntu.pms.evaluation.dto;

import java.time.LocalDate;
import java.util.List;

import jakarta.validation.constraints.Future;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotEmpty;

public record GoalDTO(
    Long id,
    @NotBlank String definition,
    @NotBlank String metric,
    @NotBlank String resource,
    @NotBlank String relevance,
    @Future LocalDate deadline,
    @NotEmpty List<String> criteria,
    List<ProgressDTO> progresses
) {}