package edu.ntu.pms.audit;

import static org.junit.jupiter.api.Assertions.assertEquals;

import java.util.List;

import org.junit.jupiter.api.AfterEach;
import org.junit.jupiter.api.Test;
import org.springframework.mock.web.MockHttpServletRequest;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.web.context.request.RequestContextHolder;
import org.springframework.web.context.request.ServletRequestAttributes;

class CustomRevisionListenerTest {

    private final CustomRevisionListener listener = new CustomRevisionListener();

    @AfterEach
    void clear() {
        SecurityContextHolder.clearContext();
        RequestContextHolder.resetRequestAttributes();
    }

    @Test
    void writesAuthenticatedUsername() {
        SecurityContextHolder.getContext().setAuthentication(
                new UsernamePasswordAuthenticationToken("alice", null, List.of()));
        bindRequest(new MockHttpServletRequest());

        CustomRevisionEntity rev = new CustomRevisionEntity();
        listener.newRevision(rev);

        assertEquals("alice", rev.getUsername());
    }

    @Test
    void writesSystemWhenNoAuthentication() {
        bindRequest(new MockHttpServletRequest());

        CustomRevisionEntity rev = new CustomRevisionEntity();
        listener.newRevision(rev);

        assertEquals("system", rev.getUsername());
    }

    @Test
    void writesSystemForAnonymousUser() {
        SecurityContextHolder.getContext().setAuthentication(
                new UsernamePasswordAuthenticationToken("anonymousUser", null, List.of()));
        bindRequest(new MockHttpServletRequest());

        CustomRevisionEntity rev = new CustomRevisionEntity();
        listener.newRevision(rev);

        assertEquals("system", rev.getUsername());
    }

    @Test
    void picksFirstIpFromForwardedHeader() {
        MockHttpServletRequest req = new MockHttpServletRequest();
        req.addHeader("X-Forwarded-For", "203.0.113.5, 10.0.0.1, 10.0.0.2");
        bindRequest(req);

        CustomRevisionEntity rev = new CustomRevisionEntity();
        listener.newRevision(rev);

        assertEquals("203.0.113.5", rev.getIpAddress());
    }

    @Test
    void fallsBackToRemoteAddrWithoutForwardedHeader() {
        MockHttpServletRequest req = new MockHttpServletRequest();
        req.setRemoteAddr("198.51.100.7");
        bindRequest(req);

        CustomRevisionEntity rev = new CustomRevisionEntity();
        listener.newRevision(rev);

        assertEquals("198.51.100.7", rev.getIpAddress());
    }

    @Test
    void writesUnknownWhenNoRequestContext() {
        // No RequestContextHolder binding — simulating a background thread.
        CustomRevisionEntity rev = new CustomRevisionEntity();
        listener.newRevision(rev);

        assertEquals("unknown", rev.getIpAddress());
    }

    private void bindRequest(MockHttpServletRequest request) {
        RequestContextHolder.setRequestAttributes(new ServletRequestAttributes(request));
    }
}
