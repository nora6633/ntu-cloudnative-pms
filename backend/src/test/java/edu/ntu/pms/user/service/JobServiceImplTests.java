package edu.ntu.pms.user.service;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.Mockito.*;

import java.util.List;
import java.util.Set;
import java.util.stream.Collectors;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;

import edu.ntu.pms.template.entity.Template;
import edu.ntu.pms.template.repository.TemplateRepository;
import edu.ntu.pms.user.entity.Job;
import edu.ntu.pms.user.repository.JobRepository;

public class JobServiceImplTests {

    private JobRepository jobRepo;
    private TemplateRepository templateRepository;
    private JobServiceImpl svc;

    @BeforeEach
    void setUp() {
        jobRepo = mock(JobRepository.class);
        templateRepository = mock(TemplateRepository.class);
        svc = new JobServiceImpl(jobRepo, templateRepository);
    }

    @Test
    void getAllJobs_returnsRepoList() {
        List<Job> jobs = List.of(
                Job.builder().id(1L).title("J1").build(),
                Job.builder().id(2L).title("J2").build()
        );
        when(jobRepo.findAllByOrderByTitleAsc()).thenReturn(jobs);

        List<Job> result = svc.getAllJobs();

        assertSame(jobs, result);
        verify(jobRepo).findAllByOrderByTitleAsc();
    }

    @Test
    void getAllJobsWithTemplates_returnsRepoList() {
        List<Job> jobs = List.of(
                Job.builder().id(1L).title("J1").build(),
                Job.builder().id(2L).title("J2").build()
        );
        List<Template> templatesForJob1 = List.of(Template.builder().id(10L).name("T1").build());
        List<Template> templatesForJob2 = List.of(Template.builder().id(20L).name("T2").build());
        when(jobRepo.findAllByOrderByTitleAsc()).thenReturn(jobs);
        when(templateRepository.findAllByJobIdOrderByIdAsc(1L)).thenReturn(templatesForJob1);
        when(templateRepository.findAllByJobIdOrderByIdAsc(2L)).thenReturn(templatesForJob2);

        List<Job> result = svc.getAllJobsWithTemplates();

        assertSame(jobs, result);
        assertEquals(List.of("J1", "J2"), result.stream().map(Job::getTitle).toList());
        assertEquals(templatesForJob1, result.get(0).getTemplates());
        assertEquals(templatesForJob2, result.get(1).getTemplates());
        var inOrder = inOrder(jobRepo, templateRepository);
        inOrder.verify(jobRepo).findAllByOrderByTitleAsc();
        inOrder.verify(templateRepository).findAllByJobIdOrderByIdAsc(1L);
        inOrder.verify(templateRepository).findAllByJobIdOrderByIdAsc(2L);
        verifyNoMoreInteractions(jobRepo, templateRepository);
    }

    @Test
    void getAllJobsForCycleStart_returnsWhenIdsMatch() {
        List<Job> jobs = List.of(
                Job.builder().id(1L).title("J1").build(),
                Job.builder().id(2L).title("J2").build()
        );
        when(jobRepo.findAllWithEmployeesAndSupervisors()).thenReturn(jobs);

        Set<Long> ids = jobs.stream().map(Job::getId).collect(Collectors.toSet());

        List<Job> result = svc.getAllJobsForCycleStart(ids);

        assertEquals(jobs, result);
    }

    @Test
    void getAllJobsForCycleStart_throwsWhenMismatch() {
        List<Job> jobs = List.of(Job.builder().id(1L).title("J1").build());
        when(jobRepo.findAllWithEmployeesAndSupervisors()).thenReturn(jobs);

        Set<Long> provided = Set.of(2L);

        assertThrows(IllegalArgumentException.class, () -> svc.getAllJobsForCycleStart(provided));
    }
}
