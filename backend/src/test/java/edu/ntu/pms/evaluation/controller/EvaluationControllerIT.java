package edu.ntu.pms.evaluation.controller;

import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

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

import jakarta.servlet.http.Cookie;

import edu.ntu.pms.H2IntegrationTest;
import edu.ntu.pms.seeders.DataSeeder;
import edu.ntu.pms.auth.JwtService;
import edu.ntu.pms.user.entity.User;
import edu.ntu.pms.user.repository.UserRepository;
import edu.ntu.pms.user.repository.JobRepository;
import edu.ntu.pms.template.repository.TemplateRepository;
import edu.ntu.pms.user.entity.Job;
import edu.ntu.pms.template.entity.Template;
import edu.ntu.pms.evaluation.enums.EvaluationType;
import java.util.List;
import java.util.stream.Collectors;

@Tag("integration")
@SpringBootTest
@AutoConfigureMockMvc
@H2IntegrationTest
@Transactional
class EvaluationControllerIT {

    @Autowired
    private MockMvc mvc;

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private JobRepository jobRepository;

    @Autowired
    private TemplateRepository templateRepository;

    @Autowired
    private JwtService jwtService;

    @Autowired
    private DataSeeder dataSeeder;

    @Value("${app.cookie.name}")
    private String cookieName;

    @BeforeEach
    void setUp() throws Exception {
        // Ensure test data is present
        dataSeeder.run();
    }

    @Test
    void hrCanFetchHrEvaluations() throws Exception {
        User hr = userRepository.findByUsername("seniorhr").orElseThrow();
        String token = jwtService.issue(hr);
        Cookie cookie = new Cookie(cookieName, token);

        mvc.perform(get("/evaluations/hr-evaluations")
                .cookie(cookie)
                .accept(MediaType.APPLICATION_JSON))
                .andExpect(status().isOk());
    }

    @Test
    void managerCanFetchManagerEvaluations() throws Exception {
        User manager = userRepository.findByUsername("manager").orElseThrow();
        String token = jwtService.issue(manager);
        Cookie cookie = new Cookie(cookieName, token);

        mvc.perform(get("/evaluations/manager-evaluations")
                .cookie(cookie)
                .accept(MediaType.APPLICATION_JSON))
                .andExpect(status().isOk());
    }

    @Test
    void hrCanStartEvaluationCycle() throws Exception {
        User hr = userRepository.findByUsername("admin").orElseThrow();
        String token = jwtService.issue(hr);
        Cookie cookie = new Cookie(cookieName, token);

        List<Job> jobs = jobRepository.findAll();
        List<Template> templates = templateRepository.findAll().stream()
                .filter(t -> t.getEvaluationType() == EvaluationType.ANNUAL)
                .collect(Collectors.toList());

        StringBuilder jobToTemplateMapJson = new StringBuilder("{");
        for (int i = 0; i < jobs.size(); i++) {
            Job job = jobs.get(i);
            Template template = templates.stream()
                    .filter(t -> t.getJob().getId().equals(job.getId()))
                    .findFirst()
                    .orElseThrow();
            jobToTemplateMapJson.append(String.format("\"%d\": %d", job.getId(), template.getId()));
            if (i < jobs.size() - 1) {
                jobToTemplateMapJson.append(",");
            }
        }
        jobToTemplateMapJson.append("}");

        String payload = String.format("""
                {
                  "cycleName": "2026",
                  "evaluationType": "ANNUAL",
                  "jobToTemplateIdMap": %s
                }
                """, jobToTemplateMapJson.toString());

        mvc.perform(post("/evaluations/start-cycle")
                .cookie(cookie)
                .contentType(MediaType.APPLICATION_JSON)
                .content(payload))
                .andExpect(status().isOk());
    }
}
