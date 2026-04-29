package edu.ntu.pms.security;

import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Component;

import edu.ntu.pms.user.entity.User;
import edu.ntu.pms.user.repository.UserRepository;

/* 
 * A component that provides access to the currently authenticated user.
 */
@Component
public class AuthenticatedUser {

    private UserRepository userRepository;

    public AuthenticatedUser(UserRepository userRepository) {
        this.userRepository = userRepository;
    }

    public User get() {
        String username = SecurityContextHolder.getContext().getAuthentication().getName();
        return userRepository.findByUsername(username)
            .orElseThrow(() -> new RuntimeException("Authenticated user not found in database"));
    }
}
