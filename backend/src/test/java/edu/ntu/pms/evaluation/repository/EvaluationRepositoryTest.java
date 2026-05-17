package edu.ntu.pms.evaluation.repository;

import static org.assertj.core.api.Assertions.assertThat;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.List;
import org.junit.jupiter.api.AfterEach;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.data.jpa.test.autoconfigure.DataJpaTest;
import org.springframework.boot.jpa.test.autoconfigure.TestEntityManager;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Slice;

import edu.ntu.pms.evaluation.entity.Evaluation;
import edu.ntu.pms.evaluation.entity.EvaluationItem;
import edu.ntu.pms.evaluation.entity.Goal;
import edu.ntu.pms.evaluation.entity.Progress;
import edu.ntu.pms.evaluation.enums.EvaluationStatus;
import edu.ntu.pms.evaluation.enums.EvaluationType;
import edu.ntu.pms.user.entity.Department;
import edu.ntu.pms.user.entity.Job;
import edu.ntu.pms.user.entity.User;
import edu.ntu.pms.user.enums.Role;

@DataJpaTest
@ActiveProfiles("test")
class EvaluationRepositoryTest {

    @Autowired
    private TestEntityManager em;

    @Autowired
    private EvaluationRepository repo;

    private Job job;
    private Department dept;

    @BeforeEach
    void setUp() {
        job = Job.builder().title("Dev").build();
        em.persist(job);

        dept = Department.builder().name("Engineering").build();
        em.persist(dept);
    }

    @AfterEach
    void tearDown() {
        em.clear();
    }

    @Test
    void findSliceBySupervisorId() {
        User supervisor = persistUser("sup", Role.MANAGER, null);
        User employee = persistUser("emp", Role.EMPLOYEE, supervisor);

        Evaluation eval = createEvaluation(employee, supervisor);
        em.persist(eval);
        em.flush();

        Pageable pageable = PageRequest.of(0, 10);
        Slice<Evaluation> page = repo.findBySupervisorId(supervisor.getId(), pageable);
        assertThat(page.getContent()).hasSize(1);
    }

    @Test
    void findSliceByEmployeeId() {
        User supervisor = persistUser("sup_emp", Role.MANAGER, null);
        User employee = persistUser("emp_emp", Role.EMPLOYEE, supervisor);

        Evaluation eval = createEvaluation(employee, supervisor);
        em.persist(eval);
        em.flush();

        Pageable pageable = PageRequest.of(0, 10);
        Slice<Evaluation> page = repo.findByEmployeeId(employee.getId(), pageable);
        assertThat(page.getContent()).hasSize(1);
    }

    @Test
    void findSliceByDepartmentId() {
        User supervisor = persistUser("sup_dept", Role.MANAGER, null);
        User employee = persistUser("emp_dept", Role.EMPLOYEE, supervisor);

        Evaluation eval = createEvaluation(employee, supervisor);
        em.persist(eval);
        em.flush();

        Pageable pageable = PageRequest.of(0, 10);
        Slice<Evaluation> page = repo.findByDepartmentId(dept.getId(), pageable);
        assertThat(page.getContent()).hasSize(1);
    }

    @Test
    void findAllWithCollectionsByIdIn_loadsCollections() {
        User supervisor = persistUser("sup_col", Role.MANAGER, null);
        User employee = persistUser("emp_col", Role.EMPLOYEE, supervisor);

        Evaluation eval = createEvaluation(employee, supervisor);
        EvaluationItem item = createEvaluationItem(eval, "Quality", "Quality of work", "Good", 4);
        Goal goal = createGoal(eval, "Increase coverage", "Coverage %", "Time", "High", LocalDate.now().plusDays(30),
                List.of("Unit tests"), "Started");

        eval.setEvaluationItems(List.of(item));
        eval.setGoals(List.of(goal));

        em.persist(eval);
        em.flush();

        List<Evaluation> fetched = repo.findAllWithCollectionsByIdIn(List.of(eval.getId()));
        assertThat(fetched).hasSize(1);
        Evaluation fetchedEval = fetched.get(0);
        assertThat(fetchedEval.getEvaluationItems()).hasSize(1);
        assertThat(fetchedEval.getGoals()).hasSize(1);
        Goal fetchedGoal = fetchedEval.getGoals().get(0);
        assertThat(fetchedGoal.getCriteria()).containsExactly("Unit tests");
        assertThat(fetchedGoal.getProgresses()).hasSize(1);
    }

    @Test
    void findWithAllCollectionsById_loadsNestedCollections() {
        User supervisor = persistUser("sup2", Role.MANAGER, null);
        User employee = persistUser("emp2", Role.EMPLOYEE, supervisor);

        Evaluation eval = createEvaluation(employee, supervisor);
        EvaluationItem item = createEvaluationItem(eval, "Delivery", "Timeliness", null, null);
        Goal goal = createGoal(eval, "Ship features", "Stories done", "Team", "Medium", LocalDate.now().plusDays(10),
                List.of("Complete tasks"), "In progress");

        eval.setEvaluationItems(List.of(item));
        eval.setGoals(List.of(goal));

        em.persist(eval);
        em.flush();

        Evaluation fetched = repo.findWithAllCollectionsById(eval.getId()).orElseThrow();
        assertThat(fetched.getEvaluationItems()).hasSize(1);
        assertThat(fetched.getGoals()).hasSize(1);
        Goal fetchedGoal = fetched.getGoals().get(0);
        assertThat(fetchedGoal.getCriteria()).contains("Complete tasks");
        assertThat(fetchedGoal.getProgresses()).hasSize(1);
    }

    // --- helpers ---
    private User persistUser(String username, Role role, User supervisor) {
        User u = User.builder()
                .username(username)
                .passwordHash("x")
                .role(role)
                .job(job)
                .department(dept)
                .supervisor(supervisor)
                .build();
        em.persist(u);
        return u;
    }

    private Evaluation createEvaluation(User employee, User supervisor) {
        return Evaluation.builder()
                .cycle("2024")
                .status(EvaluationStatus.INITIAL)
                .type(EvaluationType.PROBATION)
                .employee(employee)
                .supervisor(supervisor)
                .department(dept)
                .build();
    }

    private EvaluationItem createEvaluationItem(Evaluation eval, String name, String desc, String feedback,
            Integer rating) {
        return EvaluationItem.builder()
                .name(name)
                .description(desc)
                .feedback(feedback)
                .rating(rating)
                .evaluation(eval)
                .build();
    }

    private Goal createGoal(Evaluation eval, String definition, String metric, String resource, String relevance,
            LocalDate deadline, List<String> criteria, String progressDescription) {
        Goal goal = new Goal();
        goal.setDefinition(definition);
        goal.setMetric(metric);
        goal.setResource(resource);
        goal.setRelevance(relevance);
        goal.setDeadline(deadline);
        goal.setEvaluation(eval);
        if (criteria != null)
            goal.getCriteria().addAll(criteria);
        if (progressDescription != null)
            goal.getProgresses().add(new Progress(LocalDateTime.now(), progressDescription));
        return goal;
    }
}
