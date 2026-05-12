package edu.ntu.pms.auth;

import edu.ntu.pms.user.enums.Role;

public record UserResponse(Long id, String username, Role role) {
}
