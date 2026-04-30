package edu.ntu.pms.evaluation.service;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.Mockito.*;

import java.time.LocalDate;
import java.util.List;
import java.util.Optional;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;

import edu.ntu.pms.evaluation.dto.EvaluationItemDTO;
import edu.ntu.pms.evaluation.dto.GoalDTO;
import edu.ntu.pms.evaluation.entity.Evaluation;
import edu.ntu.pms.evaluation.enums.EvaluationStatus;
import edu.ntu.pms.evaluation.repository.EvaluationRepository;
import edu.ntu.pms.security.AuthenticatedUser;
import edu.ntu.pms.user.entity.Department;
import edu.ntu.pms.user.entity.Job;
import edu.ntu.pms.user.entity.User;
import edu.ntu.pms.evaluation.exception.OverseenDepartmentNotFoundException;

public class EvaluationServiceImplTests {

    private AuthenticatedUser currentUser;
    private EvaluationRepository evalRepo;
    private EvaluationCreationService creationService;
    private EvaluationUpdateService updateService;
    private EvaluationAuthorizationService authorizationService;
    private EvaluationServiceImpl svc;

    @BeforeEach
    void setUp() {
        currentUser = mock(AuthenticatedUser.class);
        evalRepo = mock(EvaluationRepository.class);
        creationService = mock(EvaluationCreationService.class);
        updateService = mock(EvaluationUpdateService.class);
        authorizationService = mock(EvaluationAuthorizationService.class);

        svc = new EvaluationServiceImpl(currentUser, evalRepo, creationService, updateService, authorizationService);
    }

    @Test
    void getMyEvaluations_delegatesToRepository() {
        User u = User.builder().id(5L).username("me").build();
        when(currentUser.get()).thenReturn(u);

        List<Evaluation> list = List.of(Evaluation.builder().id(1L).build());
        when(evalRepo.findByEmployeeId(5L)).thenReturn(list);

        assertSame(list, svc.getMyEvaluations());
        verify(evalRepo).findByEmployeeId(5L);
    }

    @Test
    void getEvaluationsForManager_delegatesToRepository() {
        User u = User.builder().id(8L).username("mgr").build();
        when(currentUser.get()).thenReturn(u);

        List<Evaluation> list = List.of(Evaluation.builder().id(2L).build());
        when(evalRepo.findBySupervisorId(8L)).thenReturn(list);

        assertSame(list, svc.getEvaluationsForManager());
        verify(evalRepo).findBySupervisorId(8L);
    }

    @Test
    void getEvaluationsForHr_throwsWhenNoOverseenDept() {
        User u = User.builder().id(7L).username("hr").build();
        when(currentUser.get()).thenReturn(u);

        assertThrows(OverseenDepartmentNotFoundException.class, () -> svc.getEvaluationsForHr());
    }

    @Test
    void getEvaluationsForHr_delegatesWhenOverseenDeptPresent() {
        Department dept = Department.builder().id(33L).name("HRD").build();
        User u = User.builder().id(7L).username("hr").overseenDepartment(dept).build();
        when(currentUser.get()).thenReturn(u);

        List<Evaluation> list = List.of(Evaluation.builder().id(3L).department(dept).build());
        when(evalRepo.findByDepartmentId(33L)).thenReturn(list);

        assertSame(list, svc.getEvaluationsForHr());
        verify(evalRepo).findByDepartmentId(33L);
    }

    @Test
    void draftGoals_DelegatesToUpdateService() {
        GoalDTO dto = new GoalDTO(null, "Def", "Measure", 
        "Resource", "Relevance", 
        LocalDate.of(2023, 1, 1), List.of(), List.of());

        svc.draftGoals(123L, List.of(dto));
        verify(updateService).draftGoals(123L, List.of(dto));
    }

    @Test
    void draftReview_DelegatesToUpdateService() {
        EvaluationItemDTO dto = new EvaluationItemDTO(1L, "Name", "Description", "Feedback", 4);

        svc.draftReview(123L, List.of(dto));
        verify(updateService).draftReview(123L, List.of(dto));
    }

    @Test
    void submitForGoalApproval_changesStatusAndSaves() {
        User employee = User.builder().id(2L).username("emp").build();
        Evaluation eval = Evaluation.builder()
                .id(10L)
                .status(EvaluationStatus.INITIAL)
                .employee(employee)
                .build();

        when(evalRepo.findById(10L)).thenReturn(Optional.of(eval));
        when(currentUser.get()).thenReturn(employee);

        // authorization should not throw
        doNothing().when(authorizationService).checkEmployeeAccess(eval);

        svc.submitForGoalApproval(10L);

        assertEquals(EvaluationStatus.PENDING_GOAL_APPROVAL, eval.getStatus());
        verify(evalRepo).save(eval);
        verify(authorizationService).checkEmployeeAccess(eval);
    }

    @Test
    void approveEvaluation_savesClosedAndTakesSnapshot() {
        Job job = Job.builder().id(100L).title("Dev").build();
        Department dept = Department.builder().id(50L).name("D").build();

        User employee = User.builder().id(2L).username("emp").job(job).department(dept).build();
        User supervisor = User.builder().id(3L).username("sup").job(job).department(dept).build();
        User hr = User.builder().id(9L).username("hr").job(job).department(dept).build();

        Evaluation eval = Evaluation.builder()
                .id(20L)
                .status(EvaluationStatus.PENDING_CLOSURE)
                .employee(employee)
                .supervisor(supervisor)
                .department(dept)
                .build();

        when(evalRepo.findById(20L)).thenReturn(Optional.of(eval));
        when(currentUser.get()).thenReturn(hr);

        doNothing().when(authorizationService).checkHrAccess(eval);

        svc.approveEvaluation(20L);

        assertEquals(EvaluationStatus.CLOSED, eval.getStatus());
        assertEquals(hr.getUsername(), eval.getHrName());
        assertEquals(hr.getJob().getTitle(), eval.getHrJobTitle());
        assertEquals(hr.getDepartment().getName(), eval.getHrDepartmentName());
        verify(evalRepo).save(eval);
        verify(authorizationService).checkHrAccess(eval);
    }
}
