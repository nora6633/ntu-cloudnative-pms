package edu.ntu.pms.user.service;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.Mockito.*;

import java.util.List;
import java.util.Set;
import java.util.stream.Collectors;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;

import edu.ntu.pms.user.entity.Job;
import edu.ntu.pms.user.repository.JobRepository;

public class JobServiceImplTests {

    private JobRepository jobRepo;
    private JobServiceImpl svc;

    @BeforeEach
    void setUp() {
        jobRepo = mock(JobRepository.class);
        svc = new JobServiceImpl(jobRepo);
    }

    @Test
    void getAllJobs_returnsRepoList() {
        List<Job> jobs = List.of(
                Job.builder().id(1L).title("J1").build(),
                Job.builder().id(2L).title("J2").build()
        );
        when(jobRepo.findAll()).thenReturn(jobs);

        List<Job> result = svc.getAllJobs();

        assertSame(jobs, result);
        verify(jobRepo).findAll();
    }

    @Test
    void getAllJobsForCycleStart_returnsWhenIdsMatch() {
        List<Job> jobs = List.of(
                Job.builder().id(1L).title("J1").build(),
                Job.builder().id(2L).title("J2").build()
        );
        when(jobRepo.findAll()).thenReturn(jobs);

        Set<Long> ids = jobs.stream().map(Job::getId).collect(Collectors.toSet());

        List<Job> result = svc.getAllJobsForCycleStart(ids);

        assertEquals(jobs, result);
    }

    @Test
    void getAllJobsForCycleStart_throwsWhenMismatch() {
        List<Job> jobs = List.of(Job.builder().id(1L).title("J1").build());
        when(jobRepo.findAll()).thenReturn(jobs);

        Set<Long> provided = Set.of(2L);

        assertThrows(IllegalArgumentException.class, () -> svc.getAllJobsForCycleStart(provided));
    }
}
