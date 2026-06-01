package edu.ntu.pms.user.controller;

import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Tag;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.boot.webmvc.test.autoconfigure.AutoConfigureMockMvc;
import org.springframework.security.test.context.support.WithMockUser;
import org.springframework.test.web.servlet.MockMvc;

import edu.ntu.pms.H2IntegrationTest;
import edu.ntu.pms.seeders.DataSeeder;
import edu.ntu.pms.user.repository.JobRepository;

@Tag("integration")
@SpringBootTest
@AutoConfigureMockMvc
@H2IntegrationTest
class LookupSecurityIntegrationTest {

    @Autowired
    private MockMvc mockMvc;

    @Autowired
    private DataSeeder dataSeeder;

    @Autowired
    private JobRepository jobRepository;

    private Long seededJobId;

    @BeforeEach
    void setUp() throws Exception {
        dataSeeder.run();
        seededJobId = jobRepository.findAll().stream()
                .findFirst()
                .orElseThrow(() -> new IllegalStateException("Expected seeded jobs to exist"))
                .getId();
    }

    @Test
    @WithMockUser(roles = "ADMIN")
    void admin_CanAccessDepartments() throws Exception {
        mockMvc.perform(get("/departments"))
                .andExpect(status().isOk());
    }

    @Test
    @WithMockUser(roles = "ADMIN")
    void admin_CanAccessSupervisors() throws Exception {
        mockMvc.perform(get("/users/supervisors"))
                .andExpect(status().isOk());
    }

    @Test
    @WithMockUser(roles = "ADMIN")
    void admin_CanAccessJobs() throws Exception {
        mockMvc.perform(get("/jobs"))
                .andExpect(status().isOk());
    }

    @Test
    @WithMockUser(roles = "ADMIN")
    void admin_CanAccessJobTemplates() throws Exception {
        mockMvc.perform(get("/templates/jobs/" + seededJobId))
                .andExpect(status().isOk());
    }

    @Test
    @WithMockUser(roles = "EMPLOYEE")
    void employee_CannotAccessDepartments() throws Exception {
        mockMvc.perform(get("/departments"))
                .andExpect(status().isForbidden());
    }

    @Test
    @WithMockUser(roles = "EMPLOYEE")
    void employee_CannotAccessSupervisors() throws Exception {
        mockMvc.perform(get("/users/supervisors"))
                .andExpect(status().isForbidden());
    }

    @Test
    void guest_CannotAccessDepartments() throws Exception {
        mockMvc.perform(get("/departments"))
                .andExpect(status().isUnauthorized());
    }

    @Test
    void guest_CannotAccessSupervisors() throws Exception {
        mockMvc.perform(get("/users/supervisors"))
                .andExpect(status().isUnauthorized());
    }

    @Test
    void guest_CannotAccessJobs() throws Exception {
        mockMvc.perform(get("/jobs"))
                .andExpect(status().isUnauthorized());
    }
}
