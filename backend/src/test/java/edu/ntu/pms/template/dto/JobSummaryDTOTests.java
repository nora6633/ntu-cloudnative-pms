package edu.ntu.pms.template.dto;

import static org.junit.jupiter.api.Assertions.*;
import org.junit.jupiter.api.Test;

class JobSummaryDTOTests {

    @Test
    void testRecordAccessors() {
        JobSummaryDTO dto = new JobSummaryDTO(1L, "Software Engineer (Junior)");

        assertEquals(1L, dto.id());
        assertEquals("Software Engineer (Junior)", dto.title());
    }
}
