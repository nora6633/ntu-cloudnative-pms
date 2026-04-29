package edu.ntu.pms.auth;

import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.doThrow;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.boot.webmvc.test.autoconfigure.AutoConfigureMockMvc;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.web.servlet.HandlerExceptionResolver;

import jakarta.servlet.FilterChain;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;

@SpringBootTest
@AutoConfigureMockMvc
class JwtFilterIntegrationTest {
    @Autowired
    private MockMvc mockMvc;

    @Test
    void filter_ShouldDelegateToGlobalHandler_WhenTokenIsMalformed() throws Exception {
        mockMvc.perform(get("/api/protected-resource")
                .header("Authorization", "Bearer invalid-token-here"))
                .andExpect(status().isUnauthorized())
                // Verify it's using our ProblemDetail format, not Spring's default
                .andExpect(jsonPath("$.title").value("Unauthorized"))
                .andExpect(jsonPath("$.instance").value("/api/protected-resource"));
    }

    @Test
    void filter_ShouldNotCallResolver_IfResponseIsAlreadyCommitted() throws Exception {
        // Arrange
        HttpServletRequest request = mock(HttpServletRequest.class);
        HttpServletResponse response = mock(HttpServletResponse.class);
        FilterChain filterChain = mock(FilterChain.class);
        HandlerExceptionResolver resolver = mock(HandlerExceptionResolver.class);
        JwtService jwtService = mock(JwtService.class);
        String cookieName = "test-cookie";
        
        JwtAuthenticationFilter filter = new JwtAuthenticationFilter(jwtService, cookieName, resolver);

        when(response.isCommitted()).thenReturn(true);
        // Simulate an exception happening during the chain
        doThrow(new RuntimeException("Late error")).when(filterChain).doFilter(request, response);

        // Act & Assert
        assertThrows(RuntimeException.class, () -> {
            filter.doFilter(request, response, filterChain);
        });

        // Assert
        // Verify that resolveException was NEVER called because response was committed
        verify(resolver, never()).resolveException(any(), any(), any(), any());
    }
}
