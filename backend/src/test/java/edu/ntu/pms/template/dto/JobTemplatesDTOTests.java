package edu.ntu.pms.template.dto;

import static org.junit.jupiter.api.Assertions.*;
import org.junit.jupiter.api.Test;
import java.util.List;

class JobTemplatesDTOTests {

    @Test
    void testRecordAccessors() {
        TemplateDTO template = new TemplateDTO(10L, 1L, "Template Name", null, List.of());

        JobTemplatesDTO dto = new JobTemplatesDTO(1L, "Software Engineer (Junior)", List.of(template));

        assertEquals(1L, dto.id());
        assertEquals("Software Engineer (Junior)", dto.title());
        assertEquals(1, dto.templates().size());
        assertEquals(10L, dto.templates().get(0).id());
    }
}
