package edu.ntu.pms.evaluation.service;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.*;
import static org.mockito.Mockito.*;

import java.time.LocalDate;
import java.util.ArrayList;
import java.util.List;
import java.util.Optional;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.ArgumentCaptor;
import org.mockito.Captor;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

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

    @BeforeEach
    void setUp() {
    }

    @Test
    void draftGoals_updatesAddsAndRemovesOrphans() {
        Long evalId = 100L;
        Evaluation eval = new Evaluation();
        eval.setId(evalId);
        eval.setStatus(EvaluationStatus.INITIAL);

        Goal g1 = new Goal(); g1.setId(1L); g1.setDefinition("g1");
        Goal g2 = new Goal(); g2.setId(2L); g2.setDefinition("g2");
        eval.setGoals(new ArrayList<>(List.of(g1, g2)));

        when(evalRepo.findById(evalId)).thenReturn(Optional.of(eval));

        GoalDTO updateDto = new GoalDTO(1L, "def", "metric", "resource", "relevance", LocalDate.now().plusDays(1), List.of(), List.of());
        GoalDTO newDto = new GoalDTO(null, "newdef", "metric", "resource", "relevance", LocalDate.now().plusDays(1), List.of(), List.of());

        Goal returnedGoal = new Goal();
        returnedGoal.setDefinition("newdef");
        when(mapper.toGoal(any(GoalDTO.class))).thenReturn(returnedGoal);

        service.draftGoals(evalId, List.of(updateDto, newDto));

        verify(authorizationService).checkEmployeeAccess(eval);
        verify(mapper).updateGoalFromDto(eq(updateDto), any(Goal.class));
        verify(mapper).toGoal(any(GoalDTO.class));
        verify(evalRepo).save(evaluationCaptor.capture());

        Evaluation saved = evaluationCaptor.getValue();
        assertNotNull(saved.getGoals());
        assertEquals(2, saved.getGoals().size());
        assertTrue(saved.getGoals().stream().anyMatch(g -> g.getId() != null && g.getId().equals(1L)));
        assertTrue(saved.getGoals().contains(returnedGoal));
        assertTrue(saved.getGoals().stream().anyMatch(g -> "newdef".equals(g.getDefinition()) && g.getEvaluation() == saved));
    }

    @Test
    void draftReview_updatesItemsAndSaves() {
        Long evalId = 200L;
        Evaluation eval = new Evaluation();
        eval.setId(evalId);
        eval.setStatus(EvaluationStatus.REVIEW);

        EvaluationItem item = new EvaluationItem(); item.setId(10L); item.setName("item");
        eval.setEvaluationItems(new ArrayList<>(List.of(item)));

        when(evalRepo.findById(evalId)).thenReturn(Optional.of(eval));

        EvaluationItemDTO dto = new EvaluationItemDTO(10L, "name", "desc", "fb", 5);

        service.draftReview(evalId, List.of(dto));

        verify(authorizationService).checkManagerAccess(eval);
        verify(mapper).updateItemFromDto(eq(dto), any(EvaluationItem.class));
        verify(evalRepo).save(evaluationCaptor.capture());

        Evaluation saved = evaluationCaptor.getValue();
        assertNotNull(saved.getEvaluationItems());
        assertEquals(1, saved.getEvaluationItems().size());
        assertEquals(10L, saved.getEvaluationItems().get(0).getId());
    }
}
