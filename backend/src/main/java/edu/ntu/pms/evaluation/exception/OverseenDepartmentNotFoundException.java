package edu.ntu.pms.evaluation.exception;

import org.springframework.http.HttpStatus;
import org.springframework.http.ProblemDetail;
import org.springframework.web.ErrorResponseException;

public class OverseenDepartmentNotFoundException extends ErrorResponseException {
    public OverseenDepartmentNotFoundException(Long userId) {
        super(HttpStatus.NOT_FOUND, createProblemDetail(userId), null);
    }

    private static ProblemDetail createProblemDetail(Long userId) {
        ProblemDetail detail = ProblemDetail.forStatus(HttpStatus.NOT_FOUND);
        detail.setTitle("No overseen department found for the current user");
        detail.setDetail("User with ID " + userId + " does not have an overseen department.");
        return detail;
    }
}