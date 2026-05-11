package edu.ntu.pms.audit.service;

import java.util.Set;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;

import edu.ntu.pms.audit.dto.AuditLogDTO;
import edu.ntu.pms.audit.dto.AuditLogFilter;

public interface AuditService {

    Page<AuditLogDTO> getAuditLogs(AuditLogFilter filter, Pageable pageable);

    Set<String> getAvailableModules();
}
