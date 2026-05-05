package edu.ntu.pms.evaluation.service;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.mockito.ArgumentMatchers.anySet;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

import java.util.Arrays;
import java.util.Collections;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.ArgumentCaptor;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import edu.ntu.pms.evaluation.entity.Evaluation;
import edu.ntu.pms.evaluation.entity.EvaluationItem;
import edu.ntu.pms.evaluation.enums.EvaluationType;
import edu.ntu.pms.evaluation.repository.EvaluationRepository;
import edu.ntu.pms.template.service.TemplateService;
import edu.ntu.pms.user.entity.Department;
import edu.ntu.pms.user.entity.Job;
import edu.ntu.pms.user.entity.User;
import edu.ntu.pms.user.service.JobService;

@ExtendWith(MockitoExtension.class)
class EvaluationCreationServiceTest {

    @Mock
    private EvaluationRepository evalRepo;

    @Mock
    private JobService jobService;

    @Mock
    private TemplateService templateService;

    @InjectMocks
    private EvaluationCreationService creationService;

    // Helpers
    private Department buildDepartment() {
        return Department.builder().id(10L).name("Engineering").build();
    }

    private Job buildJob(long id, String title, List<User> employees) {
        return Job.builder().id(id).title(title).employees(employees).build();
    }

    private User buildUser(long id, String username, Job job, Department dept, User supervisor) {
        return User.builder().id(id).username(username).passwordHash("x").role(null).job(job).department(dept)
                .supervisor(supervisor).build();
    }

    private EvaluationItem buildItem(long id, String name) {
        return EvaluationItem.builder().id(id).name(name).description("d").feedback("").rating(null).build();
    }

    // Shared fixtures
    private Department dept;
    private Job job1;
    private Job job2;
    private User supervisor;
    private User emp1;
    private User emp2;
    private List<Job> jobs;
    private Map<Long, Long> jobToTemplate;

    @BeforeEach
    void setUp() {
        dept = buildDepartment();

        job1 = Job.builder().id(1L).title("Developer").employees(Collections.emptyList()).build();
        job2 = Job.builder().id(2L).title("Tester").employees(Collections.emptyList()).build();

        supervisor = buildUser(100L, "sup", job1, dept, null);

        emp1 = buildUser(101L, "alice", job1, dept, supervisor);
        emp2 = buildUser(102L, "bob", job2, dept, supervisor);

        job1 = buildJob(1L, "Developer", Arrays.asList(emp1));
        job2 = buildJob(2L, "Tester", Arrays.asList(emp2));

        jobs = Arrays.asList(job1, job2);

        jobToTemplate = new HashMap<>();
        jobToTemplate.put(1L, 11L);
        jobToTemplate.put(2L, 22L);
    }

    @SuppressWarnings("unchecked")
    @Test
    void savesEvaluations_forEachEmployee() {
        // Arrange
        when(jobService.getAllJobsForCycleStart(anySet())).thenReturn(jobs);

        when(templateService.createEvaluationItemsForJob(job1, 11L, EvaluationType.ANNUAL))
            .thenReturn(Arrays.asList(buildItem(201L, "Quality")));
        when(templateService.createEvaluationItemsForJob(job2, 22L, EvaluationType.ANNUAL))
            .thenReturn(Arrays.asList(buildItem(202L, "Productivity")));

        // Act
        creationService.startEvaluationCycle("2026 Review", EvaluationType.ANNUAL, jobToTemplate);

        // Assert
        ArgumentCaptor<List<Evaluation>> captor = ArgumentCaptor.forClass(List.class);
        verify(evalRepo).saveAll(captor.capture());

        List<Evaluation> saved = captor.getValue();
        assertEquals(2, saved.size());
    }

    @SuppressWarnings("unchecked")
    @Test
    void createdEvaluation_hasExpectedFields() {
        when(jobService.getAllJobsForCycleStart(anySet())).thenReturn(Arrays.asList(job1));

        EvaluationItem item1 = buildItem(201L, "Quality");
        when(templateService.createEvaluationItemsForJob(job1, 11L, EvaluationType.ANNUAL))
            .thenReturn(Arrays.asList(item1));

        // Use only the mapping for job1
        Map<Long, Long> singleJobMap = new HashMap<>();
        singleJobMap.put(1L, 11L);

        creationService.startEvaluationCycle("2026 Review", EvaluationType.ANNUAL, singleJobMap);

        ArgumentCaptor<List<Evaluation>> captor = ArgumentCaptor.forClass(List.class);
        verify(evalRepo).saveAll(captor.capture());

        List<Evaluation> saved = captor.getValue();
        Evaluation e1 = saved.get(0);

        assertEquals("2026 Review", e1.getCycle());
        assertEquals(EvaluationType.ANNUAL, e1.getType());
        assertEquals(emp1, e1.getEmployee());
        assertEquals(supervisor, e1.getSupervisor());
        assertEquals(dept, e1.getDepartment());
        assertEquals(1, e1.getEvaluationItems().size());
        assertEquals("Quality", e1.getEvaluationItems().get(0).getName());
    }

    
}
