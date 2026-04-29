package edu.ntu.pms.security;

import java.io.IOException;
import java.util.Arrays;

import org.springframework.beans.factory.annotation.Qualifier;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.http.HttpMethod;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.security.config.annotation.method.configuration.EnableMethodSecurity;
import org.springframework.security.config.annotation.web.builders.HttpSecurity;
import org.springframework.security.config.annotation.web.configurers.AbstractHttpConfigurer;
import org.springframework.security.config.http.SessionCreationPolicy;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.security.web.AuthenticationEntryPoint;
import org.springframework.security.web.SecurityFilterChain;
import org.springframework.security.web.access.AccessDeniedHandler;
import org.springframework.security.web.authentication.UsernamePasswordAuthenticationFilter;
import org.springframework.web.cors.CorsConfiguration;
import org.springframework.web.cors.CorsConfigurationSource;
import org.springframework.web.cors.UrlBasedCorsConfigurationSource;
import org.springframework.web.servlet.HandlerExceptionResolver;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

import edu.ntu.pms.auth.JwtAuthenticationFilter;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;

@Configuration
@EnableMethodSecurity
public class WebSecurityConfig {

    private final JwtAuthenticationFilter jwtAuthenticationFilter;
    private final HandlerExceptionResolver resolver;
    private static final Logger logger = LoggerFactory.getLogger(WebSecurityConfig.class);

    public WebSecurityConfig(JwtAuthenticationFilter jwtAuthenticationFilter, 
        @Qualifier("handlerExceptionResolver") HandlerExceptionResolver resolver) {
        this.jwtAuthenticationFilter = jwtAuthenticationFilter;
        this.resolver = resolver;
    }

    @Bean
    public SecurityFilterChain filterChain(HttpSecurity http) throws Exception {
        return http
                .cors(cors -> cors.configurationSource(corsConfigurationSource()))
                .csrf(AbstractHttpConfigurer::disable)
                .sessionManagement(s -> s.sessionCreationPolicy(SessionCreationPolicy.STATELESS))
                .authorizeHttpRequests(auth -> auth
                        .requestMatchers(HttpMethod.POST, "/auth/login", "/auth/logout").permitAll()
                        .requestMatchers(HttpMethod.OPTIONS, "/**").permitAll()
                        .requestMatchers("/hello").permitAll()
                        .anyRequest().authenticated())
                .exceptionHandling(ex -> ex
                        .authenticationEntryPoint(unauthorizedEntryPoint())
                        .accessDeniedHandler(forbiddenAccessHandler()))
                .addFilterBefore(jwtAuthenticationFilter, UsernamePasswordAuthenticationFilter.class)
                .build();
    }

    @Bean
    AuthenticationEntryPoint unauthorizedEntryPoint() {
        return (request, response, ex) -> handleException(request, response, ex);
    }

    @Bean
    AccessDeniedHandler forbiddenAccessHandler() {
        return (request, response, ex) -> handleException(request, response, ex);
    }

    /*
     * Delegates exception handling to the GlobalExceptionHandler via the HandlerExceptionResolver.
     * We check if the response is already committed before trying to write to it,
     * because if the exception happens late in the filter chain, the response might have
     * already been sent to the client. In that case, we can't write a new error response, 
     * so we just log the error instead.
     */
    private void handleException(HttpServletRequest request, HttpServletResponse response, Exception ex) throws IOException {
        if (!response.isCommitted()) {
            resolver.resolveException(request, response, null, ex);
        } else {
            // If response is already committed, we can't write to it. Just log the error.
            logger.error("Response already committed. Cannot delegate exception to GlobalHandler.", ex);
        }
    }


    @Bean
    public PasswordEncoder passwordEncoder() {
        return new BCryptPasswordEncoder();
    }

    @Bean
    CorsConfigurationSource corsConfigurationSource() {
        CorsConfiguration config = new CorsConfiguration();
        config.setAllowedOrigins(Arrays.asList("http://localhost:5173"));
        config.setAllowedMethods(Arrays.asList("GET", "POST", "PATCH", "DELETE", "OPTIONS"));
        config.setAllowedHeaders(Arrays.asList("Authorization", "Content-Type"));
        config.setAllowCredentials(true);

        UrlBasedCorsConfigurationSource source = new UrlBasedCorsConfigurationSource();
        source.registerCorsConfiguration("/**", config);
        return source;
    }
}
