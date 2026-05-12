package edu.ntu.pms.user.entity;

import static org.junit.jupiter.api.Assertions.*;

import org.junit.jupiter.api.Test;

public class DepartmentTests {

    @Test
    void builder_setsFieldsCorrectly() {
        Department dept = Department.builder().id(2L).name("Marketing").build();
        assertEquals(2L, dept.getId());
        assertEquals("Marketing", dept.getName());
    }
}
