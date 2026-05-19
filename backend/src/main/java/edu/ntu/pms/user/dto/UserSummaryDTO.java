package edu.ntu.pms.user.dto;

import edu.ntu.pms.user.enums.Role;
import io.swagger.v3.oas.annotations.media.Schema;

@Schema(description = "Minimal user information for supervisor selection")
public record UserSummaryDTO(
        @Schema(description = "User ID", example = "2")
        Long id,

        @Schema(description = "Username", example = "manager")
        String username,

        @Schema(description = "Role", example = "MANAGER")
        Role role
) {
}
