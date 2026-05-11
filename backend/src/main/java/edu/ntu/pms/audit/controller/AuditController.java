package edu.ntu.pms.audit.controller;

import java.time.Instant;
import java.util.Set;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import edu.ntu.pms.audit.dto.AuditLogDTO;
import edu.ntu.pms.audit.dto.AuditLogFilter;
import edu.ntu.pms.audit.service.AuditService;
import io.swagger.v3.oas.annotations.tags.Tag;

@RestController
@RequestMapping("/audit-logs")
@Tag(name = "admin")
@PreAuthorize("hasRole('ROLE_ADMIN')")
public class AuditController {

    private final AuditService service;

    public AuditController(AuditService service) {
        this.service = service;
    }

    @GetMapping
    public Page<AuditLogDTO> getAuditLogs(
            @RequestParam(required = false) String actor,
            @RequestParam(required = false) String actionType,
            @RequestParam(required = false) String module,
            @RequestParam(required = false) String recordId,
            @RequestParam(required = false) Instant from,
            @RequestParam(required = false) Instant to,
            Pageable pageable) {
        AuditLogFilter filter = new AuditLogFilter(actor, actionType, module, recordId, from, to);
        return service.getAuditLogs(filter, pageable);
    }

    @GetMapping("/modules")
    public Set<String> getModules() {
        return service.getAvailableModules();
    }
}
