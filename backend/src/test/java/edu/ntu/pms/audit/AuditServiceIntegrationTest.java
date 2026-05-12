package edu.ntu.pms.audit;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertFalse;
import static org.junit.jupiter.api.Assertions.assertNotNull;
import static org.junit.jupiter.api.Assertions.assertTrue;

import java.time.Instant;
import java.util.UUID;

import org.junit.jupiter.api.AfterEach;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Tag;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.transaction.support.TransactionTemplate;

import edu.ntu.pms.audit.dto.AuditLogDTO;
import edu.ntu.pms.audit.dto.AuditLogFilter;
import edu.ntu.pms.audit.service.AuditService;
import edu.ntu.pms.user.enums.Role;
import edu.ntu.pms.user.entity.Department;
import edu.ntu.pms.user.entity.Job;
import edu.ntu.pms.user.entity.User;
import edu.ntu.pms.user.repository.DepartmentRepository;
import edu.ntu.pms.user.repository.JobRepository;
import edu.ntu.pms.user.repository.UserRepository;

@Tag("integration")
@SpringBootTest
@ActiveProfiles("test")
class AuditServiceIntegrationTest {

    @Autowired
    private AuditService auditService;
    @Autowired
    private UserRepository userRepository;
    @Autowired
    private JobRepository jobRepository;
    @Autowired
    private DepartmentRepository departmentRepository;
    @Autowired
    private TransactionTemplate tx;
    @Autowired
    private edu.ntu.pms.seeders.DataSeeder dataSeeder;

    @BeforeEach
    void setUp() throws Exception {
        dataSeeder.run();
    }

    @AfterEach
    void clearAuth() {
        SecurityContextHolder.clearContext();
    }

    @Test
    void returnsUserCreationAsCreateEntry() {
        String username = "audit_svc_" + UUID.randomUUID().toString().substring(0, 8);
        authenticateAs("audit-tester");
        Long userId = saveUser(username);

        Page<AuditLogDTO> page = auditService.getAuditLogs(
                new AuditLogFilter(null, null, "User", String.valueOf(userId), null, null),
                PageRequest.of(0, 10));

        assertFalse(page.isEmpty(), "expected at least one audit row for newly created user");
        AuditLogDTO entry = page.getContent().get(0);
        assertEquals("User", entry.module());
        assertEquals(String.valueOf(userId), entry.recordId());
        assertEquals("CREATE", entry.actionType());
        assertEquals("audit-tester", entry.username());
        assertNotNull(entry.timestamp());
    }

    @Test
    void filtersByActor() {
        authenticateAs("actor-one");
        saveUser("audit_actor_one_" + UUID.randomUUID().toString().substring(0, 8));
        SecurityContextHolder.clearContext();
        authenticateAs("actor-two");
        saveUser("audit_actor_two_" + UUID.randomUUID().toString().substring(0, 8));

        Page<AuditLogDTO> page = auditService.getAuditLogs(
                new AuditLogFilter("actor-one", null, "User", null, null, null),
                PageRequest.of(0, 50));

        assertFalse(page.isEmpty());
        assertTrue(page.getContent().stream().allMatch(e -> "actor-one".equals(e.username())));
    }

    @Test
    void unknownModuleReturnsEmpty() {
        Page<AuditLogDTO> page = auditService.getAuditLogs(
                new AuditLogFilter(null, null, "NotAModule", null, null, null),
                PageRequest.of(0, 10));
        assertTrue(page.isEmpty());
        assertEquals(0, page.getTotalElements());
    }

    @Test
    void unparseableRecordIdReturnsEmpty() {
        Page<AuditLogDTO> page = auditService.getAuditLogs(
                new AuditLogFilter(null, null, "User", "not-a-number", null, null),
                PageRequest.of(0, 10));
        assertTrue(page.isEmpty());
    }

    @Test
    void filtersByTimeWindow() {
        authenticateAs("time-window-tester");
        Instant before = Instant.now().minusSeconds(1);
        saveUser("audit_time_" + UUID.randomUUID().toString().substring(0, 8));
        Instant after = Instant.now().plusSeconds(1);

        Page<AuditLogDTO> inWindow = auditService.getAuditLogs(
                new AuditLogFilter("time-window-tester", null, "User", null, before, after),
                PageRequest.of(0, 10));
        assertFalse(inWindow.isEmpty());

        Page<AuditLogDTO> outOfWindow = auditService.getAuditLogs(
                new AuditLogFilter("time-window-tester", null, "User", null,
                        Instant.now().plusSeconds(60), Instant.now().plusSeconds(120)),
                PageRequest.of(0, 10));
        assertTrue(outOfWindow.isEmpty());
    }

    private void authenticateAs(String username) {
        SecurityContextHolder.getContext().setAuthentication(
                new UsernamePasswordAuthenticationToken(username, null, java.util.List.of()));
    }

    private Long saveUser(String username) {
        return tx.execute(s -> {
            Job job = jobRepository.findAll().get(0);
            Department dept = departmentRepository.findAll().get(0);
            return userRepository.save(User.builder()
                    .username(username)
                    .passwordHash("hash-" + username)
                    .role(Role.EMPLOYEE)
                    .job(job)
                    .department(dept)
                    .build()).getId();
        });
    }
}
