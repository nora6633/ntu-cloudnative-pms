package edu.ntu.pms.evaluation.service;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.Mockito.*;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;

import edu.ntu.pms.evaluation.entity.Evaluation;
import edu.ntu.pms.evaluation.exception.OverseenDepartmentNotFoundException;
import edu.ntu.pms.security.AuthenticatedUser;
import edu.ntu.pms.user.entity.Department;
import edu.ntu.pms.user.entity.User;
import org.springframework.security.access.AccessDeniedException;

public class EvaluationAuthorizationServiceTests {
    private AuthenticatedUser auth;
    private EvaluationAuthorizationService svc;
    private Evaluation eval;
    private User currentUser;
    private User employee;
    private User supervisor;
    private Department overseen;
    private Department otherDept;

    @BeforeEach
    void setUp() {
        auth = mock(AuthenticatedUser.class);
        svc = new EvaluationAuthorizationService(auth);

        employee = User.builder().id(1L).username("employee").build();
        supervisor = User.builder().id(3L).username("sup").build();
        overseen = Department.builder().id(10L).name("Overseen").build();
        otherDept = Department.builder().id(11L).name("Other").build();

        eval = Evaluation.builder()
                .employee(employee)
                .supervisor(supervisor)
                .department(overseen)
                .build();

        currentUser = User.builder().id(99L).username("anon").build();
        when(auth.get()).thenReturn(currentUser);
    }

    @Test
    void getCurrentUser_returnsUserFromAuthenticatedUser() {
        User user = User.builder().id(10L).username("u").build();
        when(auth.get()).thenReturn(user);

        assertSame(user, svc.getCurrentUser());
    }

    @Test
    void checkEmployeeAccess_allowsWhenOwner() {
        when(auth.get()).thenReturn(employee);
        assertDoesNotThrow(() -> svc.checkEmployeeAccess(eval));
    }

    @Test
    void checkEmployeeAccess_deniesWhenNotOwner() {
        when(auth.get()).thenReturn(User.builder().id(2L).username("other").build());
        assertThrows(AccessDeniedException.class, () -> svc.checkEmployeeAccess(eval));
    }

    @Test
    void checkManagerAccess_allowsWhenSupervisor() {
        when(auth.get()).thenReturn(supervisor);
        assertDoesNotThrow(() -> svc.checkManagerAccess(eval));
    }

    @Test
    void checkManagerAccess_deniesWhenNotSupervisor() {
        when(auth.get()).thenReturn(User.builder().id(4L).username("other").build());
        assertThrows(AccessDeniedException.class, () -> svc.checkManagerAccess(eval));
    }

    @Test
    void checkHrAccess_throwsWhenNoOverseenDepartment() {
        when(auth.get()).thenReturn(User.builder().id(5L).username("hr").build());
        Evaluation e = Evaluation.builder().department(Department.builder().id(1L).name("D").build()).build();
        assertThrows(OverseenDepartmentNotFoundException.class, () -> svc.checkHrAccess(e));
    }

    @Test
    void checkHrAccess_allowsWhenOverseerAndDepartmentMatches() {
        when(auth.get()).thenReturn(User.builder().id(5L).username("hr").overseenDepartment(overseen).build());
        assertDoesNotThrow(() -> svc.checkHrAccess(eval));
    }

    @Test
    void checkHrAccess_deniesWhenOverseerAndDepartmentDiffers() {
        when(auth.get()).thenReturn(User.builder().id(5L).username("hr").overseenDepartment(overseen).build());
        Evaluation otherEval = Evaluation.builder().employee(employee).supervisor(supervisor).department(otherDept).build();
        assertThrows(AccessDeniedException.class, () -> svc.checkHrAccess(otherEval));
    }
}
