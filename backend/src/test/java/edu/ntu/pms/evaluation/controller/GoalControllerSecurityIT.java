package edu.ntu.pms.evaluation.controller;

import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

import org.junit.jupiter.api.Tag;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.webmvc.test.autoconfigure.WebMvcTest;
import org.springframework.context.annotation.Import;
import org.springframework.http.MediaType;
import org.springframework.test.context.bean.override.mockito.MockitoBean;
import org.springframework.test.web.servlet.MockMvc;

import edu.ntu.pms.auth.JwtService;
import edu.ntu.pms.evaluation.service.GoalService;
import edu.ntu.pms.security.WebSecurityConfig;
import edu.ntu.pms.auth.JwtAuthenticationFilter;

@Tag("integration")
@WebMvcTest(GoalController.class)
@Import({WebSecurityConfig.class, JwtAuthenticationFilter.class})
/*
 * Test Significance:
 * This is an integration test designed to verify that the GoalController endpoints are properly protected
 * by Spring Security and the JWT Authentication Filter.
 * While GoalControllerTests verifies business logic and input validation, it explicitly disables filters for speed.
 * This test completes the security net, ensuring that requests without a valid token are intercepted
 * by the JWT filter and return a 401 Unauthorized response.
 */
class GoalControllerSecurityIT {

    @Autowired
    private MockMvc mockMvc;

    @MockitoBean
    private GoalService goalService;

    @MockitoBean
    private JwtService jwtService;

    /**
     * Test Scenario: Sending a request without any Authorization token.
     * Expected Result: The JWT Filter intercepts the request, returning 401 Unauthorized without invoking GoalService.
     */
    @Test
    void addProgress_withoutToken_returnsUnauthorized() throws Exception {
        String payload = "{\"description\":\"Testing security\"}";

        // No Authorization header provided
        mockMvc.perform(post("/goals/1/progress")
                .contentType(MediaType.APPLICATION_JSON)
                .content(payload))
                .andExpect(status().isUnauthorized())
                .andExpect(jsonPath("$.title").value("Unauthorized"));
    }

    /**
     * Test Scenario: Sending a request with a malformed or forged token.
     * Expected Result: JWT parsing fails, and the filter intercepts the request, returning 401 Unauthorized.
     */
    @Test
    void addProgress_withMalformedToken_returnsUnauthorized() throws Exception {
        String payload = "{\"description\":\"Testing security\"}";

        mockMvc.perform(post("/goals/1/progress")
                .header("Authorization", "Bearer this-is-not-a-valid-jwt")
                .contentType(MediaType.APPLICATION_JSON)
                .content(payload))
                .andExpect(status().isUnauthorized())
                .andExpect(jsonPath("$.title").value("Unauthorized"));
    }
}
