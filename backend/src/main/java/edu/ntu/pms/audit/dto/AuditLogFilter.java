package edu.ntu.pms.audit.dto;

import java.time.Instant;

public record AuditLogFilter(
        String actor,
        String actionType,
        String module,
        String recordId,
        Instant from,
        Instant to
) {}
