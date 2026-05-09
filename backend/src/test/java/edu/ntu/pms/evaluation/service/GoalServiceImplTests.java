package edu.ntu.pms.evaluation.service;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

import java.util.ArrayList;
import java.util.Optional;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.security.access.AccessDeniedException;

import edu.ntu.pms.common.ResourceNotFoundException;
import edu.ntu.pms.evaluation.dto.CreateProgressDTO;
import edu.ntu.pms.evaluation.dto.GoalDTO;
import edu.ntu.pms.evaluation.entity.Evaluation;
import edu.ntu.pms.evaluation.entity.Goal;
import edu.ntu.pms.evaluation.enums.EvaluationStatus;
import edu.ntu.pms.evaluation.mapper.EvaluationMapper;
import edu.ntu.pms.evaluation.repository.GoalRepository;

class GoalServiceImplTests {

    private GoalRepository goalRepository;
    private EvaluationAuthorizationService authorizationService;
    private EvaluationMapper mapper;
    private GoalServiceImpl goalService;

    private Goal mockGoal;
    private Evaluation mockEvaluation;

    @BeforeEach
    void setUp() {
        goalRepository = mock(GoalRepository.class);
        authorizationService = mock(EvaluationAuthorizationService.class);
        mapper = mock(EvaluationMapper.class);
        goalService = new GoalServiceImpl(goalRepository, authorizationService, mapper);

        mockEvaluation = new Evaluation();
        mockEvaluation.setId(10L);
        mockEvaluation.setStatus(EvaluationStatus.WORKING);

        mockGoal = new Goal();
        mockGoal.setId(1L);
        mockGoal.setEvaluation(mockEvaluation);
        mockGoal.setProgresses(new ArrayList<>());
    }

    @Test
    void addProgress_success() {
        CreateProgressDTO dto = new CreateProgressDTO("Test Progress");
        GoalDTO mockGoalDto = new GoalDTO(1L, "Definition", "Metric", "Resource", "Relevance", null, null, null);

        when(goalRepository.findById(1L)).thenReturn(Optional.of(mockGoal));
        when(goalRepository.save(any(Goal.class))).thenReturn(mockGoal);
        when(mapper.toGoalDto(mockGoal)).thenReturn(mockGoalDto);
        doNothing().when(authorizationService).checkEmployeeAccess(mockGoal);

        GoalDTO result = goalService.addProgress(1L, dto);

        assertNotNull(result);
        assertEquals(1L, result.id());
        assertEquals(1, mockGoal.getProgresses().size());
        assertEquals("Test Progress", mockGoal.getProgresses().get(0).getDescription());
        assertNotNull(mockGoal.getProgresses().get(0).getTimestamp());

        verify(authorizationService, times(1)).checkEmployeeAccess(mockGoal);
        verify(goalRepository, times(1)).save(mockGoal);
    }

    @Test
    void addProgress_goalNotFound_throwsException() {
        when(goalRepository.findById(1L)).thenReturn(Optional.empty());

        assertThrows(ResourceNotFoundException.class, () -> goalService.addProgress(1L, new CreateProgressDTO("Test")));
        verify(goalRepository, never()).save(any());
    }

    @Test
    void addProgress_evaluationNotWorking_throwsException() {
        mockEvaluation.setStatus(EvaluationStatus.INITIAL);
        when(goalRepository.findById(1L)).thenReturn(Optional.of(mockGoal));

        assertThrows(IllegalStateException.class, () -> goalService.addProgress(1L, new CreateProgressDTO("Test")));
        verify(goalRepository, never()).save(any());
    }

    @Test
    void addProgress_authorizationFails_throwsException() {
        when(goalRepository.findById(1L)).thenReturn(Optional.of(mockGoal));
        doThrow(new AccessDeniedException("Access Denied")).when(authorizationService).checkEmployeeAccess(mockGoal);

        assertThrows(AccessDeniedException.class, () -> goalService.addProgress(1L, new CreateProgressDTO("Test")));
        verify(goalRepository, never()).save(any());
    }
}
