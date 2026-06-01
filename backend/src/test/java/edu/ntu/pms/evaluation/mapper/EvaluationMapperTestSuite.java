package edu.ntu.pms.evaluation.mapper;

import static org.junit.jupiter.api.Assertions.*;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.List;

import org.junit.jupiter.api.Nested;
import org.junit.jupiter.api.Test;
import org.mapstruct.factory.Mappers;

import edu.ntu.pms.evaluation.dto.EvaluationDTO;
import edu.ntu.pms.evaluation.dto.GoalDTO;
import edu.ntu.pms.evaluation.dto.EvaluationItemDTO;
import edu.ntu.pms.evaluation.dto.ProgressDTO;
import edu.ntu.pms.evaluation.entity.Evaluation;
import edu.ntu.pms.evaluation.entity.EvaluationItem;
import edu.ntu.pms.evaluation.entity.Goal;
import edu.ntu.pms.evaluation.entity.Progress;
import edu.ntu.pms.evaluation.enums.EvaluationStatus;
import edu.ntu.pms.evaluation.enums.EvaluationType;
import edu.ntu.pms.user.entity.Department;
import edu.ntu.pms.user.entity.Job;
import edu.ntu.pms.user.entity.User;

public class EvaluationMapperTestSuite {

    private final EvaluationMapper mapper = Mappers.getMapper(EvaluationMapper.class);

    @Nested
    class EntityToDto {
        @Test
        void toDto_notClosed_mapsEmployeeSupervisorAndNestedLists() {
            // Arrange
            Job job = job(1L, "Dev");
            Department dept = dept(2L, "Eng");

            User emp = user(3L, "emp", job, dept);
            User sup = user(4L, "sup", job, dept);

            LocalDateTime ts = LocalDateTime.now().minusDays(1);
            Progress p = progress(ts, "progress-desc");

            Evaluation e = evaluation(10L, "2026", EvaluationStatus.INITIAL, EvaluationType.ANNUAL, emp, sup, dept,
                List.of(goal(100L, "def", LocalDate.now().plusDays(10), List.of("c1", "c2"), List.of(p))),
                List.of(item(200L, "itm", "desc", "fb", 4)));

            // Act
            EvaluationDTO dto = mapper.toDto(e);

            // Assert
            // Basic field mapping
            assertEquals(e.getCycle(), dto.cycle());
            assertEquals(EvaluationStatus.INITIAL, dto.status());
            assertEquals(EvaluationType.ANNUAL, dto.type());
            assertEquals("emp", dto.employeeName());
            assertEquals("sup", dto.supervisorName());

            // Goal Mapping
            assertNotNull(dto.goals());
            assertEquals(1, dto.goals().size());
            GoalDTO gdto = dto.goals().get(0);
            assertEquals("def", gdto.definition());
            assertNotNull(gdto.progresses());
            assertEquals(1, gdto.progresses().size());

            // Progress Mapping
            ProgressDTO pdto = gdto.progresses().get(0);
            assertEquals(ts, pdto.timestamp());

            // EvaluationItem Mapping
            assertNotNull(dto.evaluationItems());
            assertEquals(1, dto.evaluationItems().size());
            assertEquals("itm", dto.evaluationItems().get(0).name());
        }

        @Test
        void toDto_closed_usesSnapshotFields() {
            // Arrange
            Job job = job(1L, "Dev");
            Department dept = dept(2L, "Eng");

            User emp = user(3L, "emp", job, dept);
            User sup = user(4L, "sup", job, dept);

            Evaluation e = evaluation(11L, "2026", EvaluationStatus.CLOSED, EvaluationType.ANNUAL, emp, sup, dept,
                List.of(), List.of());

            // populate snapshot fields which should be used for CLOSED evaluations
            e.setEmployeeName("emp-snap");
            e.setEmployeeJobTitle("Dev-snap");
            e.setEmployeeDepartmentName("Eng-snap");
            e.setSupervisorName("sup-snap");
            e.setSupervisorJobTitle("Dev-snap");
            e.setSupervisorDepartmentName("Eng-snap");
            e.setHrName("hr-snap");
            e.setHrJobTitle("HR-snap");
            e.setHrDepartmentName("HR-snap");

            // Act
            EvaluationDTO dto = mapper.toDto(e);

            // Assert - snapshot fields should be mapped for CLOSED evaluation
            assertEquals("emp-snap", dto.employeeName());
            assertEquals("Dev-snap", dto.employeeJobTitle());
            assertEquals("Eng-snap", dto.employeeDepartmentName());

            assertEquals("sup-snap", dto.supervisorName());
            assertEquals("Dev-snap", dto.supervisorJobTitle());
            assertEquals("Eng-snap", dto.supervisorDepartmentName());

            assertEquals("hr-snap", dto.hrName());
            assertEquals("HR-snap", dto.hrJobTitle());
            assertEquals("HR-snap", dto.hrDepartmentName());
        }
    }

    // Helper factories to simplify test setup and improve readability
    private Job job(Long id, String title) {
        return Job.builder().id(id).title(title).build();
    }

    private Department dept(Long id, String name) {
        return Department.builder().id(id).name(name).build();
    }

    private User user(Long id, String username, Job job, Department dept) {
        return User.builder().id(id).username(username).job(job).department(dept).build();
    }

    private Goal goal(Long id, String definition, LocalDate deadline, List<String> criteria, List<Progress> progresses) {
        Goal g = new Goal();
        g.setId(id);
        g.setDefinition(definition);
        g.setMetric("m");
        g.setResource("r");
        g.setRelevance("rel");
        g.setDeadline(deadline);
        g.setCriteria(criteria);
        g.setProgresses(progresses);
        return g;
    }

    private Progress progress(LocalDateTime ts, String desc) {
        return new Progress(ts, desc);
    }

    private EvaluationItem item(Long id, String name, String description, String feedback, Integer rating) {
        return EvaluationItem.builder()
                .id(id)
                .name(name)
                .description(description)
                .feedback(feedback)
                .rating(rating)
                .build();
    }

    private Evaluation evaluation(Long id, String cycle, EvaluationStatus status, EvaluationType type, User emp,
            User sup, Department dept, List<Goal> goals, List<EvaluationItem> items) {
        Evaluation e = Evaluation.builder()
                .id(id)
                .cycle(cycle)
                .status(status)
                .type(type)
                .employee(emp)
                .supervisor(sup)
                .department(dept)
                .build();

        // Wire bi-directional relationships
        if (goals != null && !goals.isEmpty()) {
            goals.forEach(g -> g.setEvaluation(e));
            e.setGoals(goals);
        }

        if (items != null && !items.isEmpty()) {
            items.forEach(it -> it.setEvaluation(e));
            e.setEvaluationItems(items);
        }

        return e;
    }

    @Nested
    class DtoToEntity {
        @Test
        void toGoal_mapsFieldsAndIgnoresEvaluation() {
            GoalDTO dto = new GoalDTO(
                    null,
                    "definition",
                    "metric",
                    "resource",
                    "relevance",
                    LocalDate.now().plusDays(7),
                    List.of("c1", "c2"),
                    List.of());

            Goal g = mapper.toGoal(dto);

            assertNull(g.getEvaluation());
            assertNull(g.getId());
            assertEquals("definition", g.getDefinition());
            assertEquals("metric", g.getMetric());
            assertEquals("resource", g.getResource());
            assertEquals("relevance", g.getRelevance());
            assertEquals(2, g.getCriteria().size());
        }

        @Test
        void updateGoalFromDto_updatesFieldsButNotIdOrEvaluation() {
            Goal existing = new Goal();
            existing.setId(50L);
            Evaluation parent = Evaluation.builder().id(5L).cycle("c").status(EvaluationStatus.INITIAL).type(EvaluationType.ANNUAL).build();
            existing.setEvaluation(parent);
            existing.setDefinition("old");
            existing.setMetric("oldm");

            GoalDTO dto = new GoalDTO(
                    999L,
                    "newdef",
                    "newmetric",
                    "newresource",
                    "newrelevance",
                    LocalDate.now().plusDays(10),
                    List.of("x"),
                    List.of());

            mapper.updateGoalFromDto(dto, existing);

            assertEquals(50L, existing.getId());
            assertSame(parent, existing.getEvaluation());
            assertEquals("newdef", existing.getDefinition());
            assertEquals("newmetric", existing.getMetric());
            assertEquals("newresource", existing.getResource());
        }

        @Test
        void updateItemFromDto_updatesOnlyFeedbackAndRating() {
            Evaluation eval = Evaluation.builder().id(7L).cycle("c").status(EvaluationStatus.INITIAL).type(EvaluationType.ANNUAL).build();
            EvaluationItem item = EvaluationItem.builder()
                    .id(77L)
                    .name("name")
                    .description("desc")
                    .feedback("oldfb")
                    .rating(1)
                    .evaluation(eval)
                    .build();

            EvaluationItemDTO dto = new EvaluationItemDTO(77L, "newName", "newDesc", "newFb", 5);

            mapper.updateItemFromDto(dto, item);

            // id, name and description should remain unchanged
            assertEquals(77L, item.getId());
            assertEquals("name", item.getName());
            assertEquals("desc", item.getDescription());

            // feedback and rating should be updated
            assertEquals("newFb", item.getFeedback());
            assertEquals(5, item.getRating());
            // evaluation should stay the same
            assertSame(eval, item.getEvaluation());
        }
    }
}
