package edu.ntu.pms.evaluation.dto;

import java.time.LocalDateTime;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Past;

public record ProgressDTO(
    @Past LocalDateTime timestamp,
    @NotBlank String description
) {}
