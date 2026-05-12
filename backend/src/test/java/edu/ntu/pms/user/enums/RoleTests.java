package edu.ntu.pms.user.enums;

import static org.junit.jupiter.api.Assertions.*;

import org.junit.jupiter.api.Test;

public class RoleTests {

    @Test
    void values_exist() {
        assertNotNull(Role.valueOf("ADMIN"));
        assertNotNull(Role.valueOf("EMPLOYEE"));
        assertNotNull(Role.valueOf("MANAGER"));
        assertNotNull(Role.valueOf("HR"));
    }
}
