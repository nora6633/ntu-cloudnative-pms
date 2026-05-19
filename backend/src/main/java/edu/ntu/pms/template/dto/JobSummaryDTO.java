package edu.ntu.pms.template.dto;

import io.swagger.v3.oas.annotations.media.Schema;

@Schema(description = "Minimal job information for template selection")
public record JobSummaryDTO(
        @Schema(description = "Job ID", example = "1")
        Long id,

        @Schema(description = "Job title", example = "Software Engineer (Junior)")
        String title
) {
}
