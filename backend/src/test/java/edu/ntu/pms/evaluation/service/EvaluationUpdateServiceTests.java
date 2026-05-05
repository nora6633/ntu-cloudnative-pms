package edu.ntu.pms.evaluation.service;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.*;
import static org.mockito.Mockito.*;

import java.time.LocalDate;
import java.util.ArrayList;
import java.util.List;
import java.util.Optional;

import org.junit.jupiter.api.Nested;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.ArgumentCaptor;
import org.mockito.Captor;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.security.access.AccessDeniedException;

import edu.ntu.pms.evaluation.dto.EvaluationItemDTO;
import edu.ntu.pms.evaluation.dto.GoalDTO;
import edu.ntu.pms.evaluation.entity.Evaluation;
import edu.ntu.pms.evaluation.entity.EvaluationItem;
import edu.ntu.pms.evaluation.entity.Goal;
import edu.ntu.pms.evaluation.enums.EvaluationStatus;
import edu.ntu.pms.evaluation.mapper.EvaluationMapper;
import edu.ntu.pms.evaluation.repository.EvaluationRepository;

@ExtendWith(MockitoExtension.class)
class EvaluationUpdateServiceTests {

    @Mock
    EvaluationRepository evalRepo;

    @Mock
    EvaluationAuthorizationService authorizationService;

    @Mock
    EvaluationMapper mapper;

    @InjectMocks
    EvaluationUpdateService service;

    @Captor
    ArgumentCaptor<Evaluation> evaluationCaptor;


    @Nested
    class GoalDraftingTests {
        private Evaluation evalWithGoals(Long id, EvaluationStatus status, Goal... goals) {
            Evaluation eval = new Evaluation();
            eval.setId(id);
            eval.setStatus(status);
            eval.setGoals(new ArrayList<>(List.of(goals)));
            return eval;
        }

        private Goal goal(Long id, String definition) {
            Goal g = new Goal();
            if (id != null)
                g.setId(id);
            g.setDefinition(definition);
            return g;
        }

        private GoalDTO goalDto(Long id, String definition) {
            return new GoalDTO(id, definition, "metric", "resource", "relevance", LocalDate.now().plusDays(1),
                    List.of(), List.of());
        }

        private Goal stubMapperToGoal(String definition) {
            Goal returned = new Goal();
            returned.setDefinition(definition);
            when(mapper.toGoal(any(GoalDTO.class))).thenReturn(returned);
            return returned;
        }

        private Goal stubMapperUpdateGoalFromDto(String definition) {
            doAnswer(invocation -> {
                GoalDTO dto = invocation.getArgument(0);
                Goal entity = invocation.getArgument(1);
                entity.setDefinition(dto.definition());
                return null;
            }).when(mapper).updateGoalFromDto(any(GoalDTO.class), any(Goal.class));
            Goal updated = new Goal();
            updated.setDefinition(definition);
            return updated;
        }

        private void stubRepoFind(Evaluation eval) {
            when(evalRepo.findById(eval.getId())).thenReturn(Optional.of(eval));
        }

        @Test
        void draftGoals_failsWhenNotInitial() {
            // Arrange
            Long evalId = 100L;
            Evaluation eval = evalWithGoals(evalId, EvaluationStatus.REVIEW);
            when(evalRepo.findById(evalId)).thenReturn(Optional.of(eval));

            // Act & Assert
            assertThrows(IllegalStateException.class, () -> service.draftGoals(evalId, List.of()));
        }

        @Test
        void draftGoals_failsWhenNoAccess() {
            // Arrange
            Long evalId = 100L;
            Evaluation eval = evalWithGoals(evalId, EvaluationStatus.INITIAL);
            when(evalRepo.findById(evalId)).thenReturn(Optional.of(eval));
            doThrow(new AccessDeniedException("")).when(authorizationService).checkEmployeeAccess(eval);
        
            // Act & Assert
            assertThrows(AccessDeniedException.class, () -> service.draftGoals(evalId, List.of()));
        }

        @Test
        void draftGoals_addsGoalFirstTime() {
            // Arrange
            Long evalId = 101L;
            Evaluation eval = evalWithGoals(evalId, EvaluationStatus.INITIAL);
            stubRepoFind(eval);

            GoalDTO newDto = goalDto(null, "newdef");
            Goal returnedGoal = stubMapperToGoal("newdef");

            // Act
            service.draftGoals(evalId, List.of(newDto));

            // Assert
            verify(evalRepo).save(evaluationCaptor.capture());

            Evaluation saved = evaluationCaptor.getValue();
            assertNotNull(saved.getGoals());
            assertEquals(1, saved.getGoals().size());
            assertTrue(saved.getGoals().contains(returnedGoal));
            assertTrue(saved.getGoals().stream()
                    .anyMatch(g -> "newdef".equals(g.getDefinition()) && g.getEvaluation() == saved));
        }

        @Test
        void draftGoals_updatesExistingGoal() {
            // Arrange
            Long evalId = 102L;
            Evaluation eval = evalWithGoals(evalId, EvaluationStatus.INITIAL, goal(1L, "g1"));
            stubRepoFind(eval);

            GoalDTO updateDto = goalDto(1L, "updated");
            stubMapperUpdateGoalFromDto("updated");

            // Act
            service.draftGoals(evalId, List.of(updateDto));

            // Assert
            verify(evalRepo).save(evaluationCaptor.capture());

            Evaluation saved = evaluationCaptor.getValue();
            assertNotNull(saved.getGoals());
            assertEquals(1, saved.getGoals().size());
            assertEquals(1L, saved.getGoals().get(0).getId());
            assertEquals("updated", saved.getGoals().get(0).getDefinition());
        }

        @Test
        void draftGoals_addsGoalToExistingGoals() {
            // Arrange
            Long evalId = 103L;
            Evaluation eval = evalWithGoals(evalId, EvaluationStatus.INITIAL, goal(1L, "g1"));
            stubRepoFind(eval);

            GoalDTO updateDto = goalDto(1L, "def");
            GoalDTO newDto = goalDto(null, "newdef");

            Goal returnedGoal = stubMapperToGoal("newdef");

            // Act
            service.draftGoals(evalId, List.of(updateDto, newDto));

            // Assert
            verify(evalRepo).save(evaluationCaptor.capture());

            Evaluation saved = evaluationCaptor.getValue();
            assertNotNull(saved.getGoals());
            assertEquals(2, saved.getGoals().size());
            assertTrue(saved.getGoals().stream().anyMatch(g -> g.getId() != null && g.getId().equals(1L)));
            assertTrue(saved.getGoals().contains(returnedGoal));
        }

        @Test
        void draftGoals_removesExistingGoalWhenOmitted() {
            // Arrange
            Long evalId = 104L;
            Evaluation eval = evalWithGoals(evalId, EvaluationStatus.INITIAL, goal(1L, "g1"), goal(2L, "g2"));
            stubRepoFind(eval);

            GoalDTO updateDto = goalDto(1L, "def");

            // Act
            service.draftGoals(evalId, List.of(updateDto));

            // Assert
            verify(evalRepo).save(evaluationCaptor.capture());

            Evaluation saved = evaluationCaptor.getValue();
            assertNotNull(saved.getGoals());
            assertEquals(1, saved.getGoals().size());
            assertTrue(saved.getGoals().stream().anyMatch(g -> g.getId() != null && g.getId().equals(1L)));
            assertTrue(saved.getGoals().stream().noneMatch(g -> g.getId() != null && g.getId().equals(2L)));
        }

        @Test
        void draftGoals_addUpdateRemoveSimultaneously() {
            // Arrange
            Long evalId = 105L;
            Evaluation eval = evalWithGoals(evalId, EvaluationStatus.INITIAL, goal(1L, "g1"), goal(2L, "g2"));
            stubRepoFind(eval);

            GoalDTO updateDto = goalDto(1L, "updated");
            GoalDTO newDto = goalDto(null, "newdef");

            Goal returnedGoal = stubMapperToGoal("newdef");

            // Act
            service.draftGoals(evalId, List.of(updateDto, newDto));

            // Assert
            verify(evalRepo).save(evaluationCaptor.capture());

            Evaluation saved = evaluationCaptor.getValue();
            assertNotNull(saved.getGoals());
            assertEquals(2, saved.getGoals().size());
            assertTrue(saved.getGoals().stream().anyMatch(g -> g.getId() != null && g.getId().equals(1L)));
            assertTrue(saved.getGoals().contains(returnedGoal));
            assertTrue(saved.getGoals().stream().noneMatch(g -> g.getId() != null && g.getId().equals(2L)));
        }
    }

    @Nested
    class ReviewDraftingTests {
        private EvaluationItem stubMapperUpdateItemFromDto(String feedback, Integer rating) {
            doAnswer(invocation -> {
                EvaluationItemDTO dto = invocation.getArgument(0);
                EvaluationItem entity = invocation.getArgument(1);
                entity.setFeedback(dto.feedback());
                entity.setRating(dto.rating());
                return null;
            }).when(mapper).updateItemFromDto(any(EvaluationItemDTO.class), any(EvaluationItem.class));
            EvaluationItem updated = new EvaluationItem();
            updated.setFeedback(feedback);
            updated.setRating(rating);
            return updated;
        }

        @Test
        void draftReview_failsWhenNotInReview() {
            // Arrange
            Long evalId = 200L;
            Evaluation eval = Evaluation.builder()
                    .id(evalId)
                    .status(EvaluationStatus.WORKING)
                    .build();

            when(evalRepo.findById(evalId)).thenReturn(Optional.of(eval));

            // Act & Assert
            assertThrows(IllegalStateException.class, () -> service.draftReview(evalId, List.of()));
        }

        @Test
        void draftReview_failsWhenNoAccess() {
            // Arrange
            Long evalId = 200L;
            Evaluation eval = Evaluation.builder()
                    .id(evalId)
                    .status(EvaluationStatus.REVIEW)
                    .build();

            when(evalRepo.findById(evalId)).thenReturn(Optional.of(eval));
            doThrow(new AccessDeniedException("")).when(authorizationService).checkManagerAccess(eval);

            // Act & Assert
            assertThrows(AccessDeniedException.class, () -> service.draftReview(evalId, List.of()));
        }

        @Test
        void draftReview_updatesItemsAndSaves() {
            // Arrange
            Long evalId = 200L;
            EvaluationItem item = EvaluationItem.builder()
                    .id(10L)
                    .name("name")
                    .description("desc")
                    .build();

            Evaluation eval = Evaluation.builder()
                    .id(evalId)
                    .status(EvaluationStatus.REVIEW)
                    .evaluationItems(List.of(item))
                    .build();

            EvaluationItemDTO dto = new EvaluationItemDTO(10L, "name", "desc", "fb", 5);

            when(evalRepo.findById(evalId)).thenReturn(Optional.of(eval));
            stubMapperUpdateItemFromDto("fb", 5);

            // Act
            service.draftReview(evalId, List.of(dto));

            // Assert
            verify(evalRepo).save(evaluationCaptor.capture());

            Evaluation saved = evaluationCaptor.getValue();
            assertNotNull(saved.getEvaluationItems());
            assertEquals(1, saved.getEvaluationItems().size());
            assertEquals(10L, saved.getEvaluationItems().get(0).getId());
            assertEquals("name", saved.getEvaluationItems().get(0).getName());
            assertEquals("desc", saved.getEvaluationItems().get(0).getDescription());
            assertEquals("fb", saved.getEvaluationItems().get(0).getFeedback());
            assertEquals(5, saved.getEvaluationItems().get(0).getRating());
        }
    }
}
