package edu.ntu.pms.audit.dto;

import java.time.Instant;

import io.swagger.v3.oas.annotations.media.Schema;

public record AuditLogDTO(
        @Schema(example = "42") Integer rev,
        @Schema(example = "2026-05-11T10:22:33Z") Instant timestamp,
        @Schema(example = "alice") String username,
        @Schema(example = "10.0.0.5") String ipAddress,
        @Schema(example = "Goal", description = "Audited entity type") String module,
        @Schema(example = "12") String recordId,
        @Schema(example = "CREATE", allowableValues = {"CREATE", "UPDATE", "DELETE"}) String actionType,
        @Schema(example = "Created Goal #12") String changeSummary
) {}
