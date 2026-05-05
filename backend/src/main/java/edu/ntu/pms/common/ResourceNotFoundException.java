package edu.ntu.pms.common;

import org.springframework.http.HttpStatus;
import org.springframework.http.ProblemDetail;
import org.springframework.web.ErrorResponseException;

public class ResourceNotFoundException extends ErrorResponseException {

    public ResourceNotFoundException(String resourceName, Long id) {
        super(HttpStatus.NOT_FOUND, createProblemDetail(resourceName, id), null);
    }

    private static ProblemDetail createProblemDetail(String resourceName, Long id) {
        ProblemDetail detail = ProblemDetail.forStatusAndDetail(
                HttpStatus.NOT_FOUND,
                resourceName + " with ID " + id + " not found");
        detail.setTitle("Resource Not Found");
        return detail;
    }
}