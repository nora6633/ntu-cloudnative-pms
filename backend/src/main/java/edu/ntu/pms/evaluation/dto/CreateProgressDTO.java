package edu.ntu.pms.evaluation.dto;

import io.swagger.v3.oas.annotations.media.Schema;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

public record CreateProgressDTO(
    @Schema(description = "The description of the progress update", example = "Completed the API design for the progress update feature.")
    @NotBlank
    // Prevent malicious oversized payloads (OOM prevention and DB protection)
    @Size(max = 1000, message = "Description cannot exceed 1000 characters")
    String description
) {}
