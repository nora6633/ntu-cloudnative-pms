package edu.ntu.pms.audit;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertNull;
import static org.junit.jupiter.api.Assertions.assertTrue;

import java.util.List;
import java.util.UUID;

import org.hibernate.envers.AuditReader;
import org.hibernate.envers.AuditReaderFactory;
import org.junit.jupiter.api.AfterEach;
import org.junit.jupiter.api.Tag;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.test.annotation.DirtiesContext;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.transaction.support.TransactionTemplate;

import edu.ntu.pms.user.entity.Department;
import edu.ntu.pms.user.entity.Job;
import edu.ntu.pms.user.entity.User;
import edu.ntu.pms.user.enums.Role;
import edu.ntu.pms.user.repository.DepartmentRepository;
import edu.ntu.pms.user.repository.JobRepository;
import edu.ntu.pms.user.repository.UserRepository;
import jakarta.persistence.EntityManager;
import jakarta.persistence.PersistenceContext;

@Tag("integration")
@SpringBootTest
@ActiveProfiles("test")
@DirtiesContext(classMode = DirtiesContext.ClassMode.BEFORE_CLASS)
class AuditLogIntegrationTest {

    @Autowired
    private UserRepository userRepository;
    @Autowired
    private JobRepository jobRepository;
    @Autowired
    private DepartmentRepository departmentRepository;
    @Autowired
    private TransactionTemplate tx;

    @PersistenceContext
    private EntityManager em;

    @AfterEach
    void clearAuth() {
        SecurityContextHolder.clearContext();
    }

    @Test
    void insertCreatesRevisionWithAuditedFields() {
        String username = unique("audit_test_alice");
        Long userId = saveUser(username, Role.EMPLOYEE);

        tx.executeWithoutResult(s -> {
            AuditReader reader = AuditReaderFactory.get(em);
            List<Number> revs = reader.getRevisions(User.class, userId);

            assertTrue(revs.size() >= 1, "should have at least one revision after insert");

            User audited = reader.find(User.class, userId, revs.get(revs.size() - 1));
            assertEquals(username, audited.getUsername());
            assertEquals(Role.EMPLOYEE, audited.getRole());
        });
    }

    @Test
    void passwordHashIsNotAudited() {
        String username = unique("audit_test_bob");
        Long userId = saveUser(username, Role.EMPLOYEE);

        tx.executeWithoutResult(s -> {
            AuditReader reader = AuditReaderFactory.get(em);
            List<Number> revs = reader.getRevisions(User.class, userId);
            User audited = reader.find(User.class, userId, revs.get(revs.size() - 1));

            assertNull(audited.getPasswordHash(),
                    "passwordHash is @NotAudited, must not be reconstructable from audit history");
        });
    }

    @Test
    void updateAddsSecondRevision() {
        String original = unique("audit_test_charlie");
        String renamed = original + "_renamed";
        Long userId = saveUser(original, Role.EMPLOYEE);

        tx.executeWithoutResult(s -> {
            User reloaded = userRepository.findById(userId).orElseThrow();
            reloaded.setUsername(renamed);
            userRepository.save(reloaded);
        });

        tx.executeWithoutResult(s -> {
            AuditReader reader = AuditReaderFactory.get(em);
            List<Number> revs = reader.getRevisions(User.class, userId);
            assertEquals(2, revs.size(), "insert + update should yield two revisions");

            User latest = reader.find(User.class, userId, revs.get(revs.size() - 1));
            assertEquals(renamed, latest.getUsername());
        });
    }

    @Test
    void revisionUsernameDefaultsToSystem() {
        Long userId = saveUser(unique("audit_test_dave"), Role.EMPLOYEE);

        tx.executeWithoutResult(s -> {
            AuditReader reader = AuditReaderFactory.get(em);
            CustomRevisionEntity rev = reader.findRevision(CustomRevisionEntity.class,
                    reader.getRevisions(User.class, userId).get(0));
            assertEquals("system", rev.getUsername());
        });
    }

    @Test
    void revisionUsernameUsesAuthenticatedPrincipal() {
        SecurityContextHolder.getContext().setAuthentication(
                new UsernamePasswordAuthenticationToken("auditor", null, List.of()));

        Long userId = saveUser(unique("audit_test_eve"), Role.EMPLOYEE);

        tx.executeWithoutResult(s -> {
            AuditReader reader = AuditReaderFactory.get(em);
            CustomRevisionEntity rev = reader.findRevision(CustomRevisionEntity.class,
                    reader.getRevisions(User.class, userId).get(0));
            assertEquals("auditor", rev.getUsername());
        });
    }

    /**
     * Each test uses a unique username so the same DB instance can be shared
     * across tests without false positives from leftover rows.
     */
    private static String unique(String base) {
        return base + "_" + UUID.randomUUID().toString().substring(0, 8);
    }

    private Long saveUser(String username, Role role) {
        return tx.execute(s -> {
            Job job = jobRepository.findAll().get(0);
            Department dept = departmentRepository.findAll().get(0);
            return userRepository.save(User.builder()
                    .username(username)
                    .passwordHash("hash-" + username)
                    .role(role)
                    .job(job)
                    .department(dept)
                    .build()).getId();
        });
    }
}
