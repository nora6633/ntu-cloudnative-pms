package edu.ntu.pms.auth;

import java.io.IOException;
import java.util.List;

import org.springframework.beans.factory.annotation.Qualifier;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.web.authentication.WebAuthenticationDetailsSource;
import org.springframework.stereotype.Component;
import org.springframework.web.filter.OncePerRequestFilter;
import org.springframework.web.servlet.HandlerExceptionResolver;

import io.jsonwebtoken.Claims;
import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.Cookie;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;

@Component
public class JwtAuthenticationFilter extends OncePerRequestFilter {

    private final JwtService jwtService;
    private final String cookieName;
    private final HandlerExceptionResolver resolver;

    public JwtAuthenticationFilter(
            JwtService jwtService,
            @Value("${app.cookie.name}") String cookieName,
            @Qualifier("handlerExceptionResolver") HandlerExceptionResolver resolver
        ) {
        this.jwtService = jwtService;
        this.cookieName = cookieName;
        this.resolver = resolver;
    }

    @Override
    protected void doFilterInternal(HttpServletRequest request,
                                    HttpServletResponse response,
                                    FilterChain chain)
            throws ServletException, IOException {
        String token = readTokenFromCookie(request);
        if (token != null && SecurityContextHolder.getContext().getAuthentication() == null) {
            try {
                Claims claims = jwtService.parse(token);
                String username = claims.get("username", String.class);
                String role = claims.get("role", String.class);
                var auth = new UsernamePasswordAuthenticationToken(
                        username,
                        null,
                        List.of(new SimpleGrantedAuthority("ROLE_" + role)));
                auth.setDetails(new WebAuthenticationDetailsSource().buildDetails(request));
                SecurityContextHolder.getContext().setAuthentication(auth);
            } catch (Exception e) {
                SecurityContextHolder.clearContext();
                handleException(request, response, e);
                return; // Important: Don't continue the filter chain if there's an auth error
            }
        }
        chain.doFilter(request, response);
    }

    private String readTokenFromCookie(HttpServletRequest request) {
        Cookie[] cookies = request.getCookies();
        if (cookies == null) {
            return null;
        }
        for (Cookie cookie : cookies) {
            if (cookieName.equals(cookie.getName())) {
                return cookie.getValue();
            }
        }
        return null;
    }
    
    /*
     * Delegates exception handling to the GlobalExceptionHandler via the HandlerExceptionResolver.
     * We check if the response is already committed before trying to write to it, because if
     * the exception happens late in the filter chain, the response might have already been sent to the client.
     * In that case, we can't write a new error response, so we just log the error instead.
     */
    private void handleException(HttpServletRequest request, HttpServletResponse response, Exception ex) throws IOException {
        if (!response.isCommitted()) {
            resolver.resolveException(request, response, null, ex);
        } else {
            // If response is already committed, we can't write to it. Just log the error.
            logger.error("Response already committed. Cannot delegate exception to GlobalHandler.", ex);
        }
    }
}
