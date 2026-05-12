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
import org.springframework.test.context.ActiveProfiles;
import org.springframework.test.context.TestPropertySource;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.transaction.annotation.Transactional;

import jakarta.servlet.http.Cookie;

import edu.ntu.pms.seeders.DataSeeder;
import edu.ntu.pms.auth.JwtService;
import edu.ntu.pms.user.entity.User;
import edu.ntu.pms.user.repository.UserRepository;

@Tag("integration")
@SpringBootTest
@AutoConfigureMockMvc
@ActiveProfiles("test")
@TestPropertySource(properties = {
    "spring.datasource.url=jdbc:h2:mem:eval_it_testdb;DB_CLOSE_DELAY=-1",
    "spring.datasource.driver-class-name=org.h2.Driver",
    "spring.datasource.username=sa",
    "spring.datasource.password=",
    "spring.jpa.database-platform=org.hibernate.dialect.H2Dialect",
    "spring.jpa.hibernate.ddl-auto=create-drop"
})
@Transactional
class EvaluationControllerIT {

    @Autowired
    private MockMvc mvc;

    @Autowired
    private UserRepository userRepository;

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

        String payload = """
            {
              "cycleName": "2026",
              "evaluationType": "ANNUAL",
              "jobToTemplateIdMap": 
                {
                    "1": 1,
                    "2": 2,
                    "3": 3,
                    "4": 4
                }
            }
            """;

        mvc.perform(post("/evaluations/start-cycle")
                .cookie(cookie)
                .contentType(MediaType.APPLICATION_JSON)
                .content(payload))
            .andExpect(status().isOk());
    }
}
