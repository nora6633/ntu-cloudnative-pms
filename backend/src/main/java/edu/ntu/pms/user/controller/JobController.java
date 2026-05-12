package edu.ntu.pms.user.controller;

import java.util.List;

import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import edu.ntu.pms.template.dto.JobSummaryDTO;
import edu.ntu.pms.template.dto.JobTemplatesDTO;
import edu.ntu.pms.template.mapper.TemplateMapper;
import edu.ntu.pms.user.service.JobService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.media.ArraySchema;
import io.swagger.v3.oas.annotations.media.Content;
import io.swagger.v3.oas.annotations.media.Schema;
import io.swagger.v3.oas.annotations.responses.ApiResponse;
import io.swagger.v3.oas.annotations.responses.ApiResponses;
import io.swagger.v3.oas.annotations.security.SecurityRequirement;
import io.swagger.v3.oas.annotations.tags.Tag;

@RestController
@RequestMapping("/jobs")
@Tag(name = "job", description = "Job retrieval endpoints for HR users")
public class JobController {

    private final JobService jobService;
    private final TemplateMapper templateMapper;

    public JobController(JobService jobService, TemplateMapper templateMapper) {
        this.jobService = jobService;
        this.templateMapper = templateMapper;
    }

    @Operation(
            summary = "List jobs for template selection",
            description = "Returns all jobs that HR can use when selecting a target job for template management.",
            security = @SecurityRequirement(name = "cookieAuth"))
    @ApiResponses({
            @ApiResponse(
                    responseCode = "200",
                    description = "Jobs retrieved successfully",
                    content = @Content(array = @ArraySchema(schema = @Schema(implementation = JobSummaryDTO.class)))),
            @ApiResponse(
                    responseCode = "403",
                    description = "The authenticated user does not have HR permission",
                    content = @Content(schema = @Schema(implementation = org.springframework.http.ProblemDetail.class))),
            @ApiResponse(
                    responseCode = "401",
                    description = "Authentication is required",
                    content = @Content(schema = @Schema(implementation = org.springframework.http.ProblemDetail.class)))
    })
    @Tag(name = "hr")
    @PreAuthorize("hasRole('ROLE_HR')")
    @GetMapping
    public List<JobSummaryDTO> getAllJobs() {
        return jobService.getAllJobs().stream()
                .map(templateMapper::toJobSummaryDto)
                .toList();
    }

    @Operation(
            summary = "List jobs together with their templates",
            description = "Returns all jobs and their associated templates in one response so HR can choose templates for evaluation-cycle setup without making per-job requests.",
            security = @SecurityRequirement(name = "cookieAuth"))
    @ApiResponses({
            @ApiResponse(
                    responseCode = "200",
                    description = "Jobs and templates retrieved successfully",
                    content = @Content(array = @ArraySchema(schema = @Schema(implementation = JobTemplatesDTO.class)))),
            @ApiResponse(
                    responseCode = "403",
                    description = "The authenticated user does not have HR permission",
                    content = @Content(schema = @Schema(implementation = org.springframework.http.ProblemDetail.class))),
            @ApiResponse(
                    responseCode = "401",
                    description = "Authentication is required",
                    content = @Content(schema = @Schema(implementation = org.springframework.http.ProblemDetail.class)))
    })
    @Tag(name = "hr")
    @PreAuthorize("hasRole('ROLE_HR')")
    @GetMapping("/with-templates")
    public List<JobTemplatesDTO> getAllJobsWithTemplates() {
        return jobService.getAllJobsWithTemplates().stream()
                .map(templateMapper::toJobTemplatesDto)
                .toList();
    }
}
