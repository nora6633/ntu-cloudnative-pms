package edu.ntu.pms.auth;

import edu.ntu.pms.user.Role;

public record UserResponse(Long id, String username, Role role) {
}
