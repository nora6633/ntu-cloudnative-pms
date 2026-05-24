package edu.ntu.pms.common;

import java.util.List;

import org.springframework.http.HttpStatus;
import org.springframework.http.HttpStatusCode;
import org.springframework.http.HttpHeaders;
import org.springframework.http.ProblemDetail;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.security.core.AuthenticationException;
import org.springframework.web.ErrorResponseException;
import org.springframework.web.bind.MethodArgumentNotValidException;
import org.springframework.web.bind.annotation.ExceptionHandler;
import org.springframework.web.bind.annotation.RestControllerAdvice;
import org.springframework.web.context.request.WebRequest;
import org.springframework.web.servlet.mvc.method.annotation.ResponseEntityExceptionHandler;

/*
 * Global exception handler for the application.
 * This class uses @RestControllerAdvice to intercept exceptions thrown by any controller and return a standardized error response.
 * We handle specific exceptions like AuthenticationException and AccessDeniedException to return 401 and 403 status codes respectively, along with a ProblemDetail JSON body.
 * We also override handleMethodArgumentNotValid to customize the response for validation errors, turning them into a more readable format.
 * Finally, we have a catch-all handler for any other exceptions that might occur, returning a generic 500 Internal Server Error response.
 */
@RestControllerAdvice
public class GlobalExceptionHandler extends ResponseEntityExceptionHandler {

    private static final String BAD_REQUEST_DETAIL =
            "The request could not be completed. Please review your input and try again.";
    private static final String NOT_FOUND_DETAIL = "The requested resource could not be found.";
    private static final String CONFLICT_DETAIL = "The request conflicts with existing data.";
    private static final String SERVER_ERROR_DETAIL =
            "An unexpected error occurred on the server.";

    // Handle "Unauthorized" (401) - No or invalid token
    @ExceptionHandler(AuthenticationException.class)
    public ProblemDetail handleAuthenticationException(AuthenticationException ex) {
        return buildProblem(HttpStatus.UNAUTHORIZED, "Unauthorized", "Authentication required");
    }

    // Handle "Forbidden" (403) - Logged in, but wrong role/permissions
    @ExceptionHandler(AccessDeniedException.class)
    public ProblemDetail handleAccessDeniedException(AccessDeniedException ex) {
        return buildProblem(HttpStatus.FORBIDDEN, "Access Denied", "Access denied.");
    }

    // Handle Validation Errors (@Valid) We override this to turn messy field errors into a readable 'detail'
    @Override
    protected ResponseEntity<Object> handleMethodArgumentNotValid(
            MethodArgumentNotValidException ex,
            HttpHeaders headers,
            HttpStatusCode status,
            WebRequest request) {

        List<String> errors = ex.getBindingResult()
                .getFieldErrors()
                .stream()
                .map(f -> f.getField() + ": " + f.getDefaultMessage())
                .toList();

        ProblemDetail problem = ProblemDetail.forStatusAndDetail(status, "Invalid request content");
        problem.setTitle("Validation Failed");
        problem.setProperty("errors", errors); // Adds a custom field to the JSON

        return ResponseEntity.status(status).body(problem);
    }

    // Catch-all for unexpected Server Errors (500)
    @ExceptionHandler(Exception.class)
    public ProblemDetail handleGeneralException(Exception ex) {
        return buildProblem(HttpStatus.INTERNAL_SERVER_ERROR, "Server Error", SERVER_ERROR_DETAIL);
    }

    // Catch IllegalArgumentException separately to return a 400 Bad Request instead of 500 Internal Server Error
    @ExceptionHandler(IllegalArgumentException.class)
    public ProblemDetail handleIllegalArgumentException(IllegalArgumentException ex) {
        return buildProblem(HttpStatus.BAD_REQUEST, "Bad Request", BAD_REQUEST_DETAIL);
    }

    @ExceptionHandler(IllegalStateException.class)
    public ProblemDetail handleIllegalStateException(IllegalStateException ex) {
        return buildProblem(HttpStatus.BAD_REQUEST, "Bad Request", BAD_REQUEST_DETAIL);
    }

    // Catch DataIntegrityViolationException to return a 400 Bad Request instead of
    // 500 Internal Server Error when data constraints fail
    @ExceptionHandler(org.springframework.dao.DataIntegrityViolationException.class)
    public ProblemDetail handleDataIntegrityViolationException(
            org.springframework.dao.DataIntegrityViolationException ex) {
        return buildProblem(HttpStatus.BAD_REQUEST, "Data Integrity Error", BAD_REQUEST_DETAIL);
    }

    @Override
    protected ResponseEntity<Object> handleErrorResponseException(
            ErrorResponseException ex,
            HttpHeaders headers,
            HttpStatusCode status,
            WebRequest request) {
        HttpStatus resolvedStatus = HttpStatus.resolve(status.value());
        if (resolvedStatus == null) {
            resolvedStatus = HttpStatus.INTERNAL_SERVER_ERROR;
        }

        return ResponseEntity.status(resolvedStatus).headers(headers).body(sanitizeErrorResponse(resolvedStatus));
    }

    private ProblemDetail sanitizeErrorResponse(HttpStatus status) {
        return switch (status) {
            case UNAUTHORIZED -> buildProblem(status, "Unauthorized", "Authentication required");
            case FORBIDDEN -> buildProblem(status, "Access Denied", "Access denied.");
            case NOT_FOUND -> buildProblem(status, "Resource Not Found", NOT_FOUND_DETAIL);
            case CONFLICT -> buildProblem(status, "Conflict", CONFLICT_DETAIL);
            case BAD_REQUEST, UNPROCESSABLE_ENTITY -> buildProblem(status, "Bad Request", BAD_REQUEST_DETAIL);
            default -> status.is5xxServerError()
                    ? buildProblem(status, "Server Error", SERVER_ERROR_DETAIL)
                    : buildProblem(status, status.getReasonPhrase(), "The request could not be completed.");
        };
    }

    private ProblemDetail buildProblem(HttpStatus status, String title, String detail) {
        ProblemDetail problem = ProblemDetail.forStatusAndDetail(status, detail);
        problem.setTitle(title);
        return problem;
    }
}
