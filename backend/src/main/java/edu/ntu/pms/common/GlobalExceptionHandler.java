package edu.ntu.pms.common;

import java.util.List;

import org.springframework.http.HttpStatus;
import org.springframework.http.HttpStatusCode;
import org.springframework.http.ProblemDetail;
import org.springframework.http.HttpHeaders;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.security.core.AuthenticationException;
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
    
    // Handle "Unauthorized" (401) - No or invalid token
    @ExceptionHandler(AuthenticationException.class)
    public ProblemDetail handleAuthenticationException(AuthenticationException ex) {
        ProblemDetail problem = ProblemDetail.forStatusAndDetail(
                HttpStatus.UNAUTHORIZED,
                "Authentication required");
        problem.setTitle("Unauthorized");
        return problem;
    }

    // Handle "Forbidden" (403) - Logged in, but wrong role/permissions
    @ExceptionHandler(AccessDeniedException.class)
    public ProblemDetail handleAccessDeniedException(AccessDeniedException ex) {
        ProblemDetail problem = ProblemDetail.forStatusAndDetail(
                HttpStatus.FORBIDDEN,
                "Access Denied");
        problem.setTitle("Access Denied");
        return problem;
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
        ProblemDetail problem = ProblemDetail.forStatusAndDetail(
            HttpStatus.INTERNAL_SERVER_ERROR, 
            "An unexpected error occurred on the server."
        );
        problem.setTitle("Server Error");
        return problem;
    }
}
