package edu.ntu.pms.template.service;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.Mockito.*;

import java.util.List;
import java.util.Optional;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;

import edu.ntu.pms.common.ResourceConflictException;
import edu.ntu.pms.common.ResourceNotFoundException;
import edu.ntu.pms.evaluation.entity.EvaluationItem;
import edu.ntu.pms.evaluation.enums.EvaluationType;
import edu.ntu.pms.template.dto.CreateTemplateRequest;
import edu.ntu.pms.template.dto.CriterionDTO;
import edu.ntu.pms.template.dto.UpdateTemplateRequest;
import edu.ntu.pms.template.entity.Criterion;
import edu.ntu.pms.template.entity.Template;
import edu.ntu.pms.template.mapper.TemplateMapper;
import edu.ntu.pms.user.entity.Job;
import edu.ntu.pms.user.repository.JobRepository;
import edu.ntu.pms.template.repository.TemplateRepository;

public class TemplateServiceImplTests {

    private TemplateRepository templateRepository;
    private JobRepository jobRepository;
    private TemplateMapper templateMapper;
    private TemplateServiceImpl svc;

    @BeforeEach
    void setUp() {
        templateRepository = mock(TemplateRepository.class);
        jobRepository = mock(JobRepository.class);
        templateMapper = mock(TemplateMapper.class);
        svc = new TemplateServiceImpl(templateRepository, jobRepository, templateMapper);
        when(templateMapper.toCriterion(any())).thenAnswer(invocation -> {
            CriterionDTO dto = invocation.getArgument(0);
            return new Criterion(dto.title(), dto.description());
        });
    }

    @Test
    void getAllTemplatesByJobId_returnsTemplatesForJob() {
        Template template = Template.builder()
                .id(100L)
                .name("Probation Template")
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
        Job job = Job.builder().id(1L).title("J").build();

        Template template = Template.builder()
                .id(100L)
                .job(job)
                .name("Probation Template")
                .evaluationType(EvaluationType.PROBATION)
                .criteria(List.of(c1, c2))
                .build();

        when(templateRepository.findByIdAndJobId(100L, 1L)).thenReturn(Optional.of(template));

        List<EvaluationItem> items = svc.createEvaluationItemsForJob(job, 100L, EvaluationType.PROBATION);

        assertEquals(2, items.size());
        assertEquals("T1", items.get(0).getName());
        assertEquals("D1", items.get(0).getDescription());
        assertEquals("T2", items.get(1).getName());
        assertEquals("D2", items.get(1).getDescription());
    }

    @Test
    void createEvaluationItemsForJob_throwsWhenTemplateNotAssociated() {
        Job job = Job.builder().id(2L).title("J2").build();
        when(templateRepository.findByIdAndJobId(999L, 2L)).thenReturn(Optional.empty());

        IllegalArgumentException ex = assertThrows(IllegalArgumentException.class,
                () -> svc.createEvaluationItemsForJob(job, 999L, EvaluationType.ANNUAL));

        assertTrue(ex.getMessage().contains("Template 999 is not associated with Job 2"));
    }

    @Test
    void createEvaluationItemsForJob_throwsWhenTypeMismatch() {
        Job job = Job.builder().id(3L).title("J3").build();
        Template template = Template.builder()
                .id(42L)
                .job(job)
                .name("Annual Template")
                .evaluationType(EvaluationType.ANNUAL)
                .criteria(List.of(new Criterion("X","x")))
                .build();

        when(templateRepository.findByIdAndJobId(42L, 3L)).thenReturn(Optional.of(template));

        IllegalArgumentException ex = assertThrows(IllegalArgumentException.class,
                () -> svc.createEvaluationItemsForJob(job, 42L, EvaluationType.PROBATION));

        assertTrue(ex.getMessage().contains("Template 42 is not of type PROBATION"));
    }

    @Test
    void createTemplate_savesTemplateWithOrderedCriteria() {
        Job job = Job.builder().id(1L).title("Software Engineer").build();
        CreateTemplateRequest request = new CreateTemplateRequest(
                1L,
                " Engineering Annual Review ",
                EvaluationType.ANNUAL,
                List.of(
                        new CriterionDTO("Code Quality", "Readable code"),
                        new CriterionDTO("Collaboration", "Works well with others")));

        when(jobRepository.findById(1L)).thenReturn(Optional.of(job));
        when(templateRepository.existsByJobIdAndNameIgnoreCase(1L, "Engineering Annual Review")).thenReturn(false);
        when(templateRepository.save(any(Template.class))).thenAnswer(invocation -> invocation.getArgument(0));

        Template result = svc.createTemplate(request);

        assertEquals("Engineering Annual Review", result.getName());
        assertEquals(EvaluationType.ANNUAL, result.getEvaluationType());
        assertEquals(2, result.getCriteria().size());
        assertEquals("Code Quality", result.getCriteria().get(0).getTitle());
        assertEquals("Collaboration", result.getCriteria().get(1).getTitle());
        verify(templateRepository).save(any(Template.class));
    }

    @Test
    void createTemplate_throwsConflictWhenDuplicateNameExists() {
        Job job = Job.builder().id(1L).title("Software Engineer").build();
        CreateTemplateRequest request = new CreateTemplateRequest(
                1L,
                "Engineering Annual Review",
                EvaluationType.ANNUAL,
                List.of(new CriterionDTO("Code Quality", "Readable code")));

        when(jobRepository.findById(1L)).thenReturn(Optional.of(job));
        when(templateRepository.existsByJobIdAndNameIgnoreCase(1L, "Engineering Annual Review")).thenReturn(true);

        assertThrows(ResourceConflictException.class, () -> svc.createTemplate(request));
        verify(templateRepository, never()).save(any());
    }

    @Test
    void updateTemplate_updatesFieldsAndOrder() {
        Job job = Job.builder().id(1L).title("Software Engineer").build();
        Template template = Template.builder()
                .id(10L)
                .job(job)
                .name("Old Name")
                .evaluationType(EvaluationType.QUARTER)
                .criteria(List.of(new Criterion("Old", "Old desc")))
                .build();
        UpdateTemplateRequest request = new UpdateTemplateRequest(
                "New Name",
                EvaluationType.ANNUAL,
                List.of(
                        new CriterionDTO("First", "A"),
                        new CriterionDTO("Second", "B")));

        when(templateRepository.findById(10L)).thenReturn(Optional.of(template));
        when(templateRepository.existsByJobIdAndNameIgnoreCaseAndIdNot(1L, "New Name", 10L)).thenReturn(false);
        when(templateRepository.save(template)).thenReturn(template);

        Template result = svc.updateTemplate(10L, request);

        assertEquals("New Name", result.getName());
        assertEquals(EvaluationType.ANNUAL, result.getEvaluationType());
        assertEquals(List.of("First", "Second"),
                result.getCriteria().stream().map(Criterion::getTitle).toList());
    }

    @Test
    void updateTemplate_throwsWhenMissing() {
        when(templateRepository.findById(999L)).thenReturn(Optional.empty());

        assertThrows(ResourceNotFoundException.class, () -> svc.updateTemplate(999L,
                new UpdateTemplateRequest(
                        "Missing",
                        EvaluationType.ANNUAL,
                        List.of(new CriterionDTO("Criterion", "Desc")))));
    }
}
