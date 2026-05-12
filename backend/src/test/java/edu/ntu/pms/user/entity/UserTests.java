package edu.ntu.pms.user.entity;

import static org.junit.jupiter.api.Assertions.*;

import org.junit.jupiter.api.Test;

import edu.ntu.pms.user.enums.Role;

public class UserTests {

    @Test
    void builder_setsFieldsCorrectly() {
        Job job = Job.builder().id(1L).title("Dev").build();
        Department dept = Department.builder().id(2L).name("Eng").build();

        User user = User.builder()
                .id(10L)
                .username("testuser")
                .passwordHash("hash")
                .role(Role.EMPLOYEE)
                .job(job)
                .department(dept)
                .build();

        assertEquals(10L, user.getId());
        assertEquals("testuser", user.getUsername());
        assertEquals("hash", user.getPasswordHash());
        assertEquals(Role.EMPLOYEE, user.getRole());
        assertEquals(job, user.getJob());
        assertEquals(dept, user.getDepartment());
    }

    @Test
    void setters_updateFields() {
        User user = new User();
        user.setUsername("newname");
        assertEquals("newname", user.getUsername());
    }
}
