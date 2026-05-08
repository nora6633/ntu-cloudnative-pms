package edu.ntu.pms.template.service;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.Mockito.*;

import java.util.List;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;

import edu.ntu.pms.common.ResourceNotFoundException;
import edu.ntu.pms.evaluation.entity.EvaluationItem;
import edu.ntu.pms.evaluation.enums.EvaluationType;
import edu.ntu.pms.template.entity.Criterion;
import edu.ntu.pms.template.entity.Template;
import edu.ntu.pms.user.entity.Job;
import edu.ntu.pms.user.repository.JobRepository;
import edu.ntu.pms.template.repository.TemplateRepository;

public class TemplateServiceImplTests {

    private TemplateRepository templateRepository;
    private JobRepository jobRepository;
    private TemplateServiceImpl svc;

    @BeforeEach
    void setUp() {
        templateRepository = mock(TemplateRepository.class);
        jobRepository = mock(JobRepository.class);
        svc = new TemplateServiceImpl(templateRepository, jobRepository);
    }

    @Test
    void getAllTemplatesByJobId_returnsTemplatesForJob() {
        Template template = Template.builder()
                .id(100L)
                .evaluationType(EvaluationType.PROBATION)
                .criteria(List.of(new Criterion("T1", "D1")))
                .build();

        when(jobRepository.existsById(1L)).thenReturn(true);
        when(templateRepository.findAllByJobIdOrderByIdAsc(1L)).thenReturn(List.of(template));

        List<Template> result = svc.getAllTemplatesByJobId(1L);

        assertEquals(List.of(template), result);
        verify(jobRepository).existsById(1L);
        verify(templateRepository).findAllByJobIdOrderByIdAsc(1L);
    }

    @Test
    void getAllTemplatesByJobId_throwsWhenJobMissing() {
        when(jobRepository.existsById(999L)).thenReturn(false);

        assertThrows(ResourceNotFoundException.class, () -> svc.getAllTemplatesByJobId(999L));

        verify(jobRepository).existsById(999L);
        verifyNoInteractions(templateRepository);
    }

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
