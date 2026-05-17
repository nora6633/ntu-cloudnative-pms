package edu.ntu.pms.template.controller;

import java.util.List;

import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.ResponseStatus;

import edu.ntu.pms.template.dto.CreateTemplateRequest;
import edu.ntu.pms.template.dto.TemplateDTO;
import edu.ntu.pms.template.dto.UpdateTemplateRequest;
import edu.ntu.pms.template.mapper.TemplateMapper;
import edu.ntu.pms.template.service.TemplateService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.Parameter;
import io.swagger.v3.oas.annotations.media.ArraySchema;
import io.swagger.v3.oas.annotations.media.Content;
import io.swagger.v3.oas.annotations.media.Schema;
import io.swagger.v3.oas.annotations.responses.ApiResponse;
import io.swagger.v3.oas.annotations.responses.ApiResponses;
import io.swagger.v3.oas.annotations.security.SecurityRequirement;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;

@RestController
@RequestMapping("/templates")
@Tag(name = "template", description = "Template retrieval endpoints for HR users")
public class TemplateController {

    private final TemplateService templateService;
    private final TemplateMapper templateMapper;

    public TemplateController(TemplateService templateService, TemplateMapper templateMapper) {
        this.templateService = templateService;
        this.templateMapper = templateMapper;
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
                .map(templateMapper::toTemplateDto)
                .toList();
    }

    @Operation(
            summary = "Create template",
            description = "Creates a new evaluation template for a job.",
            security = @SecurityRequirement(name = "cookieAuth"))
    @ApiResponses({
            @ApiResponse(
                    responseCode = "201",
                    description = "Template created successfully",
                    content = @Content(schema = @Schema(implementation = TemplateDTO.class))),
            @ApiResponse(
                    responseCode = "404",
                    description = "No job exists for the provided job ID",
                    content = @Content(schema = @Schema(implementation = org.springframework.http.ProblemDetail.class))),
            @ApiResponse(
                    responseCode = "409",
                    description = "A template with the same name already exists for the job",
                    content = @Content(schema = @Schema(implementation = org.springframework.http.ProblemDetail.class)))
    })
    @Tag(name = "hr")
    @PreAuthorize("hasRole('ROLE_HR')")
    @PostMapping
    @ResponseStatus(HttpStatus.CREATED)
    public TemplateDTO createTemplate(@Valid @RequestBody CreateTemplateRequest request) {
        return templateMapper.toTemplateDto(templateService.createTemplate(request));
    }

    @Operation(
            summary = "Update template",
            description = "Updates an existing evaluation template without changing its owning job.",
            security = @SecurityRequirement(name = "cookieAuth"))
    @ApiResponses({
            @ApiResponse(
                    responseCode = "200",
                    description = "Template updated successfully",
                    content = @Content(schema = @Schema(implementation = TemplateDTO.class))),
            @ApiResponse(
                    responseCode = "404",
                    description = "Template not found",
                    content = @Content(schema = @Schema(implementation = org.springframework.http.ProblemDetail.class))),
            @ApiResponse(
                    responseCode = "409",
                    description = "A template with the same name already exists for the job",
                    content = @Content(schema = @Schema(implementation = org.springframework.http.ProblemDetail.class)))
    })
    @Tag(name = "hr")
    @PreAuthorize("hasRole('ROLE_HR')")
    @PutMapping("/{templateId}")
    public TemplateDTO updateTemplate(
            @Parameter(description = "Target template ID", example = "10")
            @PathVariable Long templateId,
            @Valid @RequestBody UpdateTemplateRequest request) {
        return templateMapper.toTemplateDto(templateService.updateTemplate(templateId, request));
    }
}
