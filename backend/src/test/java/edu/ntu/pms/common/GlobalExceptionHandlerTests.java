package edu.ntu.pms.common;

import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.content;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.http.MediaType;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.security.authentication.BadCredentialsException;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.setup.MockMvcBuilders;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.server.ResponseStatusException;

import jakarta.validation.Valid;
import jakarta.validation.constraints.NotBlank;

class GlobalExceptionHandlerTests {

    private MockMvc mockMvc;

    @BeforeEach
    void setup() {
        // We create a tiny "Dummy Controller" to throw the exception we want to test
        mockMvc = MockMvcBuilders.standaloneSetup(new TestController())
                .setControllerAdvice(new GlobalExceptionHandler())
                .build();
    }

    @RestController
    static class TestController {
        static class TestDto {
            @NotBlank
            public String name;
        }

        @GetMapping("/test-auth")
        public void throwAuthEx() { throw new BadCredentialsException("Invalid token"); }

        @GetMapping("/test-access")
        public void throwAccessEx() {
            throw new AccessDeniedException("denied");
        }

        @PostMapping("/test-validate")
        public void throwValidateEx(@Valid @RequestBody TestDto dto) {
            // no-op
        }

        @GetMapping("/test-runtime")
        public void throwRuntimeEx() {
            throw new RuntimeException("boom");
        }

        @GetMapping("/test-data-integrity")
        public void throwDataIntegrityEx() {
            throw new org.springframework.dao.DataIntegrityViolationException("some sql error");
        }

        @GetMapping("/test-illegal-argument")
        public void throwIllegalArgumentEx() {
            throw new IllegalArgumentException("Job ID not found: 99");
        }

        @GetMapping("/test-not-found")
        public void throwNotFoundEx() {
            throw new ResponseStatusException(org.springframework.http.HttpStatus.NOT_FOUND, "Template 7 missing");
        }

        @GetMapping("/test-unauthorized")
        public void throwUnauthorizedEx() {
            throw new ResponseStatusException(org.springframework.http.HttpStatus.UNAUTHORIZED, "Invalid credentials");
        }

        @GetMapping("/test-conflict")
        public void throwConflictEx() {
            throw new ResponseStatusException(org.springframework.http.HttpStatus.CONFLICT, "Duplicate template name");
        }
    }


    @Test
    void shouldReturnProblemDetail_WhenAuthExceptionThrown() throws Exception {
        mockMvc.perform(get("/test-auth"))
                .andExpect(status().isUnauthorized())
                .andExpect(content().contentTypeCompatibleWith("application/problem+json"))
                .andExpect(jsonPath("$.title").value("Unauthorized"))
                .andExpect(jsonPath("$.detail").value("Authentication required"));
    }

    @Test
    void shouldReturnProblemDetail_WhenAccessDeniedExceptionThrown() throws Exception {
        mockMvc.perform(get("/test-access"))
                .andExpect(status().isForbidden())
                .andExpect(content().contentTypeCompatibleWith("application/problem+json"))
                .andExpect(jsonPath("$.title").value("Access Denied"))
                .andExpect(jsonPath("$.detail").value("Access denied."));
    }

    @Test
    void shouldReturnProblemDetail_WhenValidationErrorsOccur() throws Exception {
        mockMvc.perform(post("/test-validate")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{}"))
                .andExpect(status().isBadRequest())
                .andExpect(content().contentTypeCompatibleWith("application/problem+json"))
                .andExpect(jsonPath("$.title").value("Validation Failed"))
                .andExpect(jsonPath("$.errors").isArray());
    }

    @Test
    void shouldReturnProblemDetail_WhenRuntimeExceptionThrown() throws Exception {
        mockMvc.perform(get("/test-runtime"))
                .andExpect(status().isInternalServerError())
                .andExpect(content().contentTypeCompatibleWith("application/problem+json"))
                .andExpect(jsonPath("$.title").value("Server Error"));
    }

    @Test
    void shouldReturnProblemDetail_WhenDataIntegrityViolationThrown() throws Exception {
        mockMvc.perform(get("/test-data-integrity"))
                .andExpect(status().isBadRequest())
                .andExpect(content().contentTypeCompatibleWith("application/problem+json"))
                .andExpect(jsonPath("$.title").value("Data Integrity Error"))
                .andExpect(jsonPath("$.detail").value("The request could not be completed. Please review your input and try again."));
    }

    @Test
    void shouldSanitizeIllegalArgumentExceptionMessages() throws Exception {
        mockMvc.perform(get("/test-illegal-argument"))
                .andExpect(status().isBadRequest())
                .andExpect(content().contentTypeCompatibleWith("application/problem+json"))
                .andExpect(jsonPath("$.title").value("Bad Request"))
                .andExpect(jsonPath("$.detail").value("The request could not be completed. Please review your input and try again."));
    }

    @Test
    void shouldSanitizeErrorResponseExceptionMessages() throws Exception {
        mockMvc.perform(get("/test-not-found"))
                .andExpect(status().isNotFound())
                .andExpect(content().contentTypeCompatibleWith("application/problem+json"))
                .andExpect(jsonPath("$.title").value("Resource Not Found"))
                .andExpect(jsonPath("$.detail").value("The requested resource could not be found."));
    }

    @Test
    void shouldSanitizeUnauthorizedResponseStatusExceptionMessages() throws Exception {
        mockMvc.perform(get("/test-unauthorized"))
                .andExpect(status().isUnauthorized())
                .andExpect(content().contentTypeCompatibleWith("application/problem+json"))
                .andExpect(jsonPath("$.title").value("Unauthorized"))
                .andExpect(jsonPath("$.detail").value("Authentication required"));
    }

    @Test
    void shouldSanitizeConflictResponseStatusExceptionMessages() throws Exception {
        mockMvc.perform(get("/test-conflict"))
                .andExpect(status().isConflict())
                .andExpect(content().contentTypeCompatibleWith("application/problem+json"))
                .andExpect(jsonPath("$.title").value("Conflict"))
                .andExpect(jsonPath("$.detail").value("The request conflicts with existing data."));
    }
}
