package edu.ntu.pms.template.service;

import static org.junit.jupiter.api.Assertions.*;

import java.util.List;

import org.junit.jupiter.api.Test;

import edu.ntu.pms.evaluation.entity.EvaluationItem;
import edu.ntu.pms.evaluation.enums.EvaluationType;
import edu.ntu.pms.template.entity.Criterion;
import edu.ntu.pms.template.entity.Template;
import edu.ntu.pms.user.entity.Job;

public class TemplateServiceImplTests {

    private final TemplateServiceImpl svc = new TemplateServiceImpl();

    @Test
    void createEvaluationItemsForJob_createsItemsFromTemplate() {
        Criterion c1 = new Criterion("T1", "D1");
        Criterion c2 = new Criterion("T2", "D2");

        Template template = Template.builder()
                .id(100L)
                .evaluationType(EvaluationType.PROBATION)
                .criteria(List.of(c1, c2))
                .build();

        Job job = Job.builder().id(1L).title("J").templates(List.of(template)).build();
        // ensure template references job (not required by method but keeps object model consistent)
        template.setJob(job);

        List<EvaluationItem> items = svc.createEvaluationItemsForJob(job, 100L, EvaluationType.PROBATION);

        assertEquals(2, items.size());
        assertEquals("T1", items.get(0).getName());
        assertEquals("D1", items.get(0).getDescription());
        assertEquals("T2", items.get(1).getName());
        assertEquals("D2", items.get(1).getDescription());
    }

    @Test
    void createEvaluationItemsForJob_throwsWhenTemplateNotAssociated() {
        Job job = Job.builder().id(2L).title("J2").templates(List.of()).build();

        IllegalArgumentException ex = assertThrows(IllegalArgumentException.class,
                () -> svc.createEvaluationItemsForJob(job, 999L, EvaluationType.ANNUAL));

        assertTrue(ex.getMessage().contains("Template 999 is not associated with Job 2"));
    }

    @Test
    void createEvaluationItemsForJob_throwsWhenTypeMismatch() {
        Template template = Template.builder()
                .id(42L)
                .evaluationType(EvaluationType.ANNUAL)
                .criteria(List.of(new Criterion("X","x")))
                .build();

        Job job = Job.builder().id(3L).title("J3").templates(List.of(template)).build();
        template.setJob(job);

        IllegalArgumentException ex = assertThrows(IllegalArgumentException.class,
                () -> svc.createEvaluationItemsForJob(job, 42L, EvaluationType.PROBATION));

        assertTrue(ex.getMessage().contains("Template 42 is not of type PROBATION"));
    }
}
