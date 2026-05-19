package edu.ntu.pms.template.controller;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.options;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.put;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.header;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

import java.util.List;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Tag;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.boot.webmvc.test.autoconfigure.AutoConfigureMockMvc;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.transaction.annotation.Transactional;

import edu.ntu.pms.H2IntegrationTest;
import edu.ntu.pms.auth.JwtService;
import edu.ntu.pms.seeders.DataSeeder;
import edu.ntu.pms.template.entity.Template;
import edu.ntu.pms.template.repository.TemplateRepository;
import edu.ntu.pms.user.entity.User;
import edu.ntu.pms.user.repository.UserRepository;
import jakarta.servlet.http.Cookie;

@Tag("integration")
@SpringBootTest
@AutoConfigureMockMvc
@H2IntegrationTest
@Transactional
class TemplateControllerSecurityIT {

    private static final String ALLOWED_ORIGIN = "http://localhost:5173";

    @Autowired
    private MockMvc mockMvc;

    @Autowired
    private DataSeeder dataSeeder;

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private TemplateRepository templateRepository;

    @Autowired
    private JwtService jwtService;

    @Value("${app.cookie.name}")
    private String cookieName;

    @BeforeEach
    void setUp() throws Exception {
        dataSeeder.run();
    }

    @Test
    void preflightOptions_allowsPutForConfiguredOrigin() throws Exception {
        Template template = templateRepository.findAll().stream().findFirst().orElseThrow();

        mockMvc.perform(options("/templates/{templateId}", template.getId())
                        .header(HttpHeaders.ORIGIN, ALLOWED_ORIGIN)
                        .header(HttpHeaders.ACCESS_CONTROL_REQUEST_METHOD, "PUT")
                        .header(HttpHeaders.ACCESS_CONTROL_REQUEST_HEADERS, "content-type"))
                .andExpect(status().isOk())
                .andExpect(header().string(HttpHeaders.ACCESS_CONTROL_ALLOW_ORIGIN, ALLOWED_ORIGIN))
                .andExpect(header().string(HttpHeaders.ACCESS_CONTROL_ALLOW_METHODS, org.hamcrest.Matchers.containsString("PUT")));
    }

    @Test
    void hrCanUpdateTemplateFromAllowedOrigin() throws Exception {
        User hr = userRepository.findByUsername("seniorhr").orElseThrow();
        Cookie cookie = new Cookie(cookieName, jwtService.issue(hr));
        Template template = templateRepository.findAll().stream().findFirst().orElseThrow();

        mockMvc.perform(put("/templates/{templateId}", template.getId())
                        .cookie(cookie)
                        .header(HttpHeaders.ORIGIN, ALLOWED_ORIGIN)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("""
                                {
                                  "name": "Updated Integration Template",
                                  "evaluationType": "ANNUAL",
                                  "criteria": [
                                    { "title": "Architecture", "description": "System design quality" },
                                    { "title": "Delivery", "description": "Execution reliability" }
                                  ]
                                }
                                """))
                .andExpect(status().isOk())
                .andExpect(header().string(HttpHeaders.ACCESS_CONTROL_ALLOW_ORIGIN, ALLOWED_ORIGIN))
                .andExpect(jsonPath("$.name").value("Updated Integration Template"))
                .andExpect(jsonPath("$.criteria[0].title").value("Architecture"))
                .andExpect(jsonPath("$.criteria[1].title").value("Delivery"));

        Template persisted = templateRepository.findById(template.getId()).orElseThrow();
        assertEquals("Updated Integration Template", persisted.getName());
        assertEquals(List.of("Architecture", "Delivery"),
                persisted.getCriteria().stream().map(criterion -> criterion.getTitle()).toList());
        assertEquals(List.of("System design quality", "Execution reliability"),
                persisted.getCriteria().stream().map(criterion -> criterion.getDescription()).toList());
    }

    @Test
    void hrUpdateTemplate_duplicateNameReturnsConflict() throws Exception {
        User hr = userRepository.findByUsername("seniorhr").orElseThrow();
        Cookie cookie = new Cookie(cookieName, jwtService.issue(hr));
        Template targetTemplate = templateRepository.findAll().stream()
                .findFirst()
                .orElseThrow();
        Template duplicateNameTemplate = templateRepository.findAllByJobIdOrderByIdAsc(targetTemplate.getJob().getId()).stream()
                .filter(template -> !template.getId().equals(targetTemplate.getId()))
                .findFirst()
                .orElseThrow();

        mockMvc.perform(put("/templates/{templateId}", targetTemplate.getId())
                        .cookie(cookie)
                        .header(HttpHeaders.ORIGIN, ALLOWED_ORIGIN)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("""
                                {
                                  "name": "%s",
                                  "evaluationType": "ANNUAL",
                                  "criteria": [
                                    { "title": "Architecture", "description": "System design quality" }
                                  ]
                                }
                                """.formatted(duplicateNameTemplate.getName())))
                .andExpect(status().isConflict())
                .andExpect(header().string(HttpHeaders.ACCESS_CONTROL_ALLOW_ORIGIN, ALLOWED_ORIGIN))
                .andExpect(jsonPath("$.title").value("Conflict"));
    }

    @Test
    void hrUpdateTemplate_missingTemplateReturnsNotFound() throws Exception {
        User hr = userRepository.findByUsername("seniorhr").orElseThrow();
        Cookie cookie = new Cookie(cookieName, jwtService.issue(hr));

        mockMvc.perform(put("/templates/{templateId}", 999999L)
                        .cookie(cookie)
                        .header(HttpHeaders.ORIGIN, ALLOWED_ORIGIN)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("""
                                {
                                  "name": "Missing Template",
                                  "evaluationType": "ANNUAL",
                                  "criteria": [
                                    { "title": "Architecture", "description": "System design quality" }
                                  ]
                                }
                                """))
                .andExpect(status().isNotFound())
                .andExpect(header().string(HttpHeaders.ACCESS_CONTROL_ALLOW_ORIGIN, ALLOWED_ORIGIN))
                .andExpect(jsonPath("$.title").value("Resource Not Found"));
    }
}
