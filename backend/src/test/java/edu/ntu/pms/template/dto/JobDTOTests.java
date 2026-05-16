package edu.ntu.pms.template.dto;

import static org.junit.jupiter.api.Assertions.*;
import org.junit.jupiter.api.Test;
import java.util.List;
import edu.ntu.pms.evaluation.enums.EvaluationType;

class JobDTOTests {

    @Test
    void testJobSummaryDTO() {
        JobSummaryDTO dto = new JobSummaryDTO(1L, "Software Engineer (Junior)");
        assertEquals(1L, dto.id());
        assertEquals("Software Engineer (Junior)", dto.title());
    }

    @Test
    void testJobTemplatesDTO() {
        TemplateDTO t1 = new TemplateDTO(10L, 1L, EvaluationType.ANNUAL, List.of());
        JobTemplatesDTO dto = new JobTemplatesDTO(1L, "Software Engineer (Junior)", List.of(t1));
        
        assertEquals(1L, dto.id());
        assertEquals("Software Engineer (Junior)", dto.title());
        assertEquals(1, dto.templates().size());
        assertEquals(10L, dto.templates().get(0).id());
    }
}
