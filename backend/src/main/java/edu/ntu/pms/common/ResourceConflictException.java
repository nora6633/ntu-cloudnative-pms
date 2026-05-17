package edu.ntu.pms.common;

import org.springframework.http.HttpStatus;
import org.springframework.http.ProblemDetail;
import org.springframework.web.ErrorResponseException;

public class ResourceConflictException extends ErrorResponseException {

    public ResourceConflictException(String detail) {
        super(HttpStatus.CONFLICT, createProblemDetail(detail), null);
    }

    private static ProblemDetail createProblemDetail(String detail) {
        ProblemDetail problem = ProblemDetail.forStatusAndDetail(HttpStatus.CONFLICT, detail);
        problem.setTitle("Conflict");
        return problem;
    }
}
