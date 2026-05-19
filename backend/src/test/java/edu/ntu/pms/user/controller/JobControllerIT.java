package edu.ntu.pms.user.controller;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertFalse;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

import java.util.List;
import java.util.Set;
import java.util.stream.Collectors;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Tag;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.boot.webmvc.test.autoconfigure.AutoConfigureMockMvc;
import org.springframework.http.MediaType;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.transaction.annotation.Transactional;

import com.fasterxml.jackson.core.type.TypeReference;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.fasterxml.jackson.databind.json.JsonMapper;

import edu.ntu.pms.H2IntegrationTest;
import edu.ntu.pms.auth.JwtService;
import edu.ntu.pms.seeders.DataSeeder;
import edu.ntu.pms.template.dto.JobTemplatesDTO;
import edu.ntu.pms.user.entity.User;
import edu.ntu.pms.user.repository.UserRepository;
import jakarta.servlet.http.Cookie;

@Tag("integration")
@SpringBootTest
@AutoConfigureMockMvc
@H2IntegrationTest
@Transactional
class JobControllerIT {

    @Autowired
    private MockMvc mockMvc;

    @Autowired
    private DataSeeder dataSeeder;

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private JwtService jwtService;

    @Value("${app.cookie.name}")
    private String cookieName;

    private final ObjectMapper objectMapper = JsonMapper.builder()
            .findAndAddModules()
            .build();

    @BeforeEach
    void setUp() throws Exception {
        dataSeeder.run();
    }

    @Test
    void getAllJobsWithTemplates_returnsUniqueTemplatesWithLoadedCriteria() throws Exception {
        User admin = userRepository.findByUsername("admin").orElseThrow();
        Cookie cookie = new Cookie(cookieName, jwtService.issue(admin));

        String json = mockMvc.perform(get("/jobs/with-templates")
                        .cookie(cookie)
                        .accept(MediaType.APPLICATION_JSON))
                .andExpect(status().isOk())
                .andReturn()
                .getResponse()
                .getContentAsString();

        List<JobTemplatesDTO> jobs = objectMapper.readValue(json, new TypeReference<>() {});

        assertFalse(jobs.isEmpty(), "Expected seeded jobs with templates");
        for (JobTemplatesDTO job : jobs) {
            assertEquals(3, job.templates().size(), "Each seeded job should expose three templates");
            Set<Long> uniqueTemplateIds = job.templates().stream()
                    .map(template -> template.id())
                    .collect(Collectors.toSet());
            assertEquals(job.templates().size(), uniqueTemplateIds.size(),
                    "Template IDs should be unique for job " + job.title());
            job.templates().forEach(template -> {
                assertFalse(template.criteria().isEmpty(),
                        "Criteria should be loaded for template " + template.id());
                assertEquals(template.criteria().size(),
                        template.criteria().stream().map(criterion -> criterion.title()).distinct().count(),
                        "Criteria titles should not be duplicated for template " + template.id());
            });
        }
    }
}
