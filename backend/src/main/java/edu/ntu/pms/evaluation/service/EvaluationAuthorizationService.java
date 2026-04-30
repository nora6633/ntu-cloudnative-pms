package edu.ntu.pms.evaluation.service;

import java.util.Optional;

import org.springframework.security.access.AccessDeniedException;
import org.springframework.stereotype.Service;

import edu.ntu.pms.evaluation.entity.Evaluation;
import edu.ntu.pms.evaluation.exception.OverseenDepartmentNotFoundException;
import edu.ntu.pms.security.AuthenticatedUser;
import edu.ntu.pms.user.entity.Department;
import edu.ntu.pms.user.entity.User;

/**
 * Service class responsible for enforcing access control and authorization
 * logic for evaluations.
 * This class contains methods to check if the current user has the necessary
 * permissions to access or modify evaluations based on their role (employee,
 * supervisor, HR) and their relationship to the evaluation (e.g. whether they
 * are the employee being evaluated, the supervisor, or the HR representative overseeing the department).
 * It interacts with the AuthenticatedUser to get information about the current user and their roles.
 */
@Service
public class EvaluationAuthorizationService {

    private final AuthenticatedUser currentUser;

    public EvaluationAuthorizationService(AuthenticatedUser currentUser) {
        this.currentUser = currentUser;
    }

    public User getCurrentUser() {
        return currentUser.get();
    }
    
    /**
     * Checks if the current user has access to the evaluation as the employee.
     * Throws AccessDeniedException if the user is not the owner of the evaluation.
     */
    public void checkEmployeeAccess(Evaluation eval) {
        if (eval.getEmployee().getId() != currentUser.get().getId()) {
            throw new AccessDeniedException("You are not the owner of this evaluation.");
        }
    }

    /**
     * Checks if the current user has access to the evaluation as the supervisor.
     * Throws AccessDeniedException if the user is not the supervisor of the
     * evaluation.
     */
    public void checkManagerAccess(Evaluation eval) {
        if (eval.getSupervisor().getId() != currentUser.get().getId()) {
            throw new AccessDeniedException("You are not the supervisor of this evaluation.");
        }
    }

    /**
     * Checks if the current user has access to the evaluation as the HR
     * representative.
     * If the evaluation's department is not overseen by the current user, an
     * AccessDeniedException is thrown.
     */
    public void checkHrAccess(Evaluation eval) {
        Department dept = Optional.ofNullable(currentUser.get().getOverseenDepartment())
                .orElseThrow(() -> new OverseenDepartmentNotFoundException(currentUser.get().getId()));
        if (eval.getDepartment().getId() != dept.getId()) {
            throw new AccessDeniedException("You do not oversee the department of this evaluation.");
        }
    }
}
