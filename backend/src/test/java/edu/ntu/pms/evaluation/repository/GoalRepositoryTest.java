package edu.ntu.pms.evaluation.repository;

import static org.assertj.core.api.Assertions.assertThat;

import java.time.LocalDate;
import java.time.LocalDateTime;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.data.jpa.test.autoconfigure.DataJpaTest;
import org.springframework.boot.jpa.test.autoconfigure.TestEntityManager;

import edu.ntu.pms.evaluation.entity.Evaluation;
import edu.ntu.pms.evaluation.entity.Goal;
import edu.ntu.pms.evaluation.entity.Progress;
import edu.ntu.pms.evaluation.enums.EvaluationStatus;
import edu.ntu.pms.evaluation.enums.EvaluationType;
import edu.ntu.pms.user.entity.Department;
import edu.ntu.pms.user.entity.Job;
import edu.ntu.pms.user.entity.User;

@DataJpaTest
class GoalRepositoryTest {

    @Autowired
    private GoalRepository goalRepository;

    @Autowired
    private TestEntityManager entityManager;

    private Evaluation savedEvaluation;
    private Goal savedGoal;

    @BeforeEach
    void setUp() {
        Department dept = Department.builder().name("IT").build();
        entityManager.persist(dept);

        Job job = edu.ntu.pms.user.entity.Job.builder().title("Dev").build();
        entityManager.persist(job);

        User employee = User.builder()
                .username("emp")
                .passwordHash("x")
                .role(edu.ntu.pms.user.Role.EMPLOYEE)
                .department(dept)
                .job(job)
                .build();
        User supervisor = User.builder()
                .username("sup")
                .passwordHash("x")
                .role(edu.ntu.pms.user.Role.MANAGER)
                .department(dept)
                .job(job)
                .build();
        entityManager.persist(employee);
        entityManager.persist(supervisor);

        Evaluation eval = Evaluation.builder()
                .cycle("2024")
                .status(EvaluationStatus.WORKING)
                .type(EvaluationType.ANNUAL)
                .employee(employee)
                .supervisor(supervisor)
                .department(dept)
                .build();
        savedEvaluation = entityManager.persist(eval);

        Goal goal = new Goal();
        goal.setDefinition("Finish project");
        goal.setMetric("Done");
        goal.setResource("PC");
        goal.setRelevance("High");
        goal.setDeadline(LocalDate.now().plusDays(10));
        goal.setEvaluation(savedEvaluation);

        Progress progress = new Progress(LocalDateTime.now(), "Started working");
        goal.getProgresses().add(progress);

        savedGoal = entityManager.persist(goal);
        entityManager.flush();
        entityManager.clear();
    }

    @Test
    void findById_fetchesRelatedEntities() {
        Goal foundGoal = goalRepository.findById(savedGoal.getId()).orElse(null);

        assertThat(foundGoal).isNotNull();
        // Check if EntityGraph loaded evaluation and employee successfully
        assertThat(foundGoal.getEvaluation()).isNotNull();
        assertThat(foundGoal.getEvaluation().getEmployee().getUsername()).isEqualTo("emp");
        
        // Check if EntityGraph loaded progresses successfully
        assertThat(foundGoal.getProgresses()).hasSize(1);
        assertThat(foundGoal.getProgresses().get(0).getDescription()).isEqualTo("Started working");
    }
}
