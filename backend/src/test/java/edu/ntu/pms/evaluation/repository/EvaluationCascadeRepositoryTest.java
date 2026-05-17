package edu.ntu.pms.evaluation.repository;

import static org.assertj.core.api.Assertions.assertThat;

import java.time.LocalDate;
import java.util.List;

import org.junit.jupiter.api.AfterEach;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Tag;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.data.jpa.test.autoconfigure.DataJpaTest;
import org.springframework.boot.jpa.test.autoconfigure.TestEntityManager;
import org.springframework.test.context.ActiveProfiles;

import edu.ntu.pms.evaluation.entity.Evaluation;
import edu.ntu.pms.evaluation.entity.EvaluationItem;
import edu.ntu.pms.evaluation.entity.Goal;
import edu.ntu.pms.evaluation.enums.EvaluationStatus;
import edu.ntu.pms.evaluation.enums.EvaluationType;
import edu.ntu.pms.user.entity.Department;
import edu.ntu.pms.user.entity.Job;
import edu.ntu.pms.user.entity.User;
import edu.ntu.pms.user.enums.Role;

@Tag("integration")
@DataJpaTest
@ActiveProfiles("test")
public class EvaluationCascadeRepositoryTest {

    @Autowired
    private TestEntityManager entityManager;

    @Autowired
    private EvaluationRepository evaluationRepository;

    private Job job;
    private Department dept;
    private User supervisor;
    private User employee;
    private Evaluation eval;

    @BeforeEach
    void setUp() {
        job = Job.builder().title("Test Job").build();
        dept = Department.builder().name("Test Dept").build();

        // persist job and department first
        entityManager.persist(job);
        entityManager.persist(dept);

        // create supervisor and employee
        supervisor = User.builder()
                .username("sup")
                .passwordHash("x")
                .role(Role.MANAGER)
                .job(job)
                .department(dept)
                .build();

        employee = User.builder()
                .username("emp")
                .passwordHash("x")
                .role(Role.EMPLOYEE)
                .job(job)
                .department(dept)
                .supervisor(supervisor)
                .build();

        entityManager.persist(supervisor);
        entityManager.persist(employee);

        eval = Evaluation.builder()
                .cycle("2026 Test")
                .status(EvaluationStatus.INITIAL)
                .type(EvaluationType.QUARTER)
                .employee(employee)
                .supervisor(supervisor)
                .department(dept)
                .build();
    }

    @AfterEach
    void tearDown() {
        evaluationRepository.deleteAll();
    }

    @Test
    void savingEvaluationPersistsItemsWhenCascadeEnabled() {
        // Arrange: Create an evaluation with two items and save it
        EvaluationItem item1 = EvaluationItem.builder()
                .name("A")
                .description("desc")
                .feedback("")
                .build();

        EvaluationItem item2 = EvaluationItem.builder()
                .name("B")
                .description("desc")
                .feedback("")
                .build();

        // set owning side and associate
        item1.setEvaluation(eval);
        item2.setEvaluation(eval);
        eval.setEvaluationItems(List.of(item1, item2));

        // Act
        evaluationRepository.save(eval);
        entityManager.flush();

        // Assert: Verify that the items were persisted and are associated with the
        // evaluation
        List<EvaluationItem> items = evaluationRepository.findAll().getFirst().getEvaluationItems();
        assertThat(items).hasSize(2);
        assertThat(items).allSatisfy(i -> assertThat(i.getEvaluation()).isNotNull());
    }

    @Test
    void savingEvaluationPersistsGoalsWhenCascadeEnabled() {
        // Arrange: Create an evaluation with two goals and save it
        Goal goal1 = new Goal();
        Goal goal2 = new Goal();
        goal1.setDeadline(LocalDate.now().plusDays(1));
        goal2.setDeadline(LocalDate.now().plusDays(2));

        // set owning side and associate
        goal1.setEvaluation(eval);
        goal2.setEvaluation(eval);

        eval.setGoals(List.of(goal1, goal2));

        // Act
        evaluationRepository.save(eval);
        entityManager.flush();

        // Assert: Verify that the goals were persisted and are associated with the
        // evaluation
        List<Goal> goals = evaluationRepository.findAll().getFirst().getGoals();
        assertThat(goals).hasSize(2);
        assertThat(goals).allSatisfy(g -> assertThat(g.getEvaluation()).isNotNull());
    }
}
