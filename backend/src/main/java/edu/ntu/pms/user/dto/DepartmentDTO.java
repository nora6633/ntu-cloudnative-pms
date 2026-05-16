package edu.ntu.pms.user.dto;

import io.swagger.v3.oas.annotations.media.Schema;

@Schema(description = "Minimal department information for selection")
public record DepartmentDTO(
        @Schema(description = "Department ID", example = "1")
        Long id,

        @Schema(description = "Department name", example = "Engineering")
        String name
) {
}
