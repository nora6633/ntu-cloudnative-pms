package edu.ntu.pms.user.entity;

import static org.junit.jupiter.api.Assertions.*;

import org.junit.jupiter.api.Test;

public class JobTests {

    @Test
    void builder_setsFieldsCorrectly() {
        Job job = Job.builder().id(1L).title("Architect").build();
        assertEquals(1L, job.getId());
        assertEquals("Architect", job.getTitle());
    }
}
