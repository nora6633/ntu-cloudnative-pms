package edu.ntu.pms.template.controller;

import java.util.List;

import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import edu.ntu.pms.template.dto.CriterionDTO;
import edu.ntu.pms.template.dto.JobSummaryDTO;
import edu.ntu.pms.template.dto.TemplateDTO;
import edu.ntu.pms.template.entity.Template;
import edu.ntu.pms.template.service.TemplateService;
import edu.ntu.pms.user.entity.Job;
import edu.ntu.pms.user.service.JobService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.Parameter;
import io.swagger.v3.oas.annotations.media.ArraySchema;
import io.swagger.v3.oas.annotations.media.Content;
import io.swagger.v3.oas.annotations.media.Schema;
import io.swagger.v3.oas.annotations.responses.ApiResponse;
import io.swagger.v3.oas.annotations.responses.ApiResponses;
import io.swagger.v3.oas.annotations.security.SecurityRequirement;
import io.swagger.v3.oas.annotations.tags.Tag;

@RestController
@RequestMapping("/templates")
@Tag(name = "template", description = "Template retrieval endpoints for HR users")
public class TemplateController {

    private final JobService jobService;
    private final TemplateService templateService;

    public TemplateController(JobService jobService, TemplateService templateService) {
        this.jobService = jobService;
        this.templateService = templateService;
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
    @GetMapping("/jobs")
    public List<JobSummaryDTO> getAllJobs() {
        return jobService.getAllJobs().stream()
                .map(this::toJobSummaryDto)
                .toList();
    }

    @Operation(
            summary = "List templates by job ID",
            description = "Returns all evaluation templates associated with the specified job so HR can choose the correct template for creation or management flows.",
            security = @SecurityRequirement(name = "cookieAuth"))
    @ApiResponses({
            @ApiResponse(
                    responseCode = "200",
                    description = "Templates retrieved successfully",
                    content = @Content(array = @ArraySchema(schema = @Schema(implementation = TemplateDTO.class)))),
            @ApiResponse(
                    responseCode = "404",
                    description = "No job exists for the provided job ID",
                    content = @Content(schema = @Schema(implementation = org.springframework.http.ProblemDetail.class))),
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
    @GetMapping("/jobs/{jobId}")
    public List<TemplateDTO> getAllTemplateByJobId(
            @Parameter(description = "Target job ID whose templates should be returned", example = "1")
            @PathVariable Long jobId) {
        return templateService.getAllTemplatesByJobId(jobId).stream()
                .map(this::toTemplateDto)
                .toList();
    }

    private JobSummaryDTO toJobSummaryDto(Job job) {
        return new JobSummaryDTO(job.getId(), job.getTitle());
    }

    private TemplateDTO toTemplateDto(Template template) {
        return new TemplateDTO(
                template.getId(),
                template.getJob().getId(),
                template.getEvaluationType(),
                template.getCriteria().stream()
                        .map(criterion -> new CriterionDTO(criterion.getTitle(), criterion.getDescription()))
                        .toList());
    }
}
