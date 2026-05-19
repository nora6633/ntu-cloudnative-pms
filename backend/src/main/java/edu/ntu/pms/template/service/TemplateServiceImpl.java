package edu.ntu.pms.template.service;

import java.util.List;
import java.util.stream.Collectors;

import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import edu.ntu.pms.common.ResourceConflictException;
import edu.ntu.pms.common.ResourceNotFoundException;
import edu.ntu.pms.evaluation.entity.EvaluationItem;
import edu.ntu.pms.evaluation.enums.EvaluationType;
import edu.ntu.pms.template.dto.CreateTemplateRequest;
import edu.ntu.pms.template.dto.UpdateTemplateRequest;
import edu.ntu.pms.template.entity.Criterion;
import edu.ntu.pms.template.entity.Template;
import edu.ntu.pms.template.mapper.TemplateMapper;
import edu.ntu.pms.template.repository.TemplateRepository;
import edu.ntu.pms.user.entity.Job;
import edu.ntu.pms.user.repository.JobRepository;

@Service
public class TemplateServiceImpl implements TemplateService {

    private final TemplateRepository templateRepository;
    private final JobRepository jobRepository;
    private final TemplateMapper templateMapper;

    public TemplateServiceImpl(
            TemplateRepository templateRepository,
            JobRepository jobRepository,
            TemplateMapper templateMapper) {
        this.templateRepository = templateRepository;
        this.jobRepository = jobRepository;
        this.templateMapper = templateMapper;
    }

    @Override
    @Transactional(readOnly = true)
    public List<Template> getAllTemplatesByJobId(Long jobId) {
        if (!jobRepository.existsById(jobId)) {
            throw new ResourceNotFoundException("Job", jobId);
        }

        return templateRepository.findAllByJobIdOrderByIdAsc(jobId);
    }

    @Override
    @Transactional
    public Template createTemplate(CreateTemplateRequest request) {
        Job job = jobRepository.findById(request.jobId())
                .orElseThrow(() -> new ResourceNotFoundException("Job", request.jobId()));

        if (templateRepository.existsByJobIdAndNameIgnoreCase(job.getId(), request.name().trim())) {
            throw new ResourceConflictException("Template with name '" + request.name().trim()
                    + "' already exists for job ID " + job.getId());
        }

        Template template = Template.builder()
                .job(job)
                .name(request.name().trim())
                .evaluationType(request.evaluationType())
                .criteria(toCriteria(request.criteria()))
                .build();

        return templateRepository.save(template);
    }

    @Override
    @Transactional
    public Template updateTemplate(Long templateId, UpdateTemplateRequest request) {
        Template template = templateRepository.findById(templateId)
                .orElseThrow(() -> new ResourceNotFoundException("Template", templateId));

        String trimmedName = request.name().trim();
        if (templateRepository.existsByJobIdAndNameIgnoreCaseAndIdNot(
                template.getJob().getId(),
                trimmedName,
                templateId)) {
            throw new ResourceConflictException("Template with name '" + trimmedName
                    + "' already exists for job ID " + template.getJob().getId());
        }

        template.setName(trimmedName);
        template.setEvaluationType(request.evaluationType());
        template.setCriteria(toCriteria(request.criteria()));
        return templateRepository.save(template);
    }

    /**
     * Create evaluation items for a given job based on a specified template and evaluation type.
     *
     * @param job The job for which to create evaluation items.
     * @param templateId The ID of the template to use for creating evaluation items.
     * @param type The type of evaluation (e.g., PROBATION, QUARTER, ANNUAL).
     * @return A list of created EvaluationItem objects based on the provided parameters.
     */
    @Override
    public List<EvaluationItem> createEvaluationItemsForJob(Job job, Long templateId, EvaluationType type){
        Template template = templateRepository.findByIdAndJobId(templateId, job.getId())
                .orElseThrow(() -> new IllegalArgumentException(
                        "Template " + templateId + " is not associated with Job " + job.getId()));

        if (template.getEvaluationType() != type) {
            throw new IllegalArgumentException("Template " + template.getId() + " is not of type " + type);
        }

        return createEvaluationItemsFromTemplate(template);
    }
    
    // Helper method to convert Template criteria to EvaluationItems
    private List<EvaluationItem> createEvaluationItemsFromTemplate(Template template) {
        return template.getCriteria().stream()
                .map(criterion -> EvaluationItem.builder()
                        .name(criterion.getTitle())
                        .description(criterion.getDescription())
                        .build())
                .collect(Collectors.toList());
    }

    private List<Criterion> toCriteria(List<edu.ntu.pms.template.dto.CriterionDTO> criteria) {
        return criteria.stream()
                .map(templateMapper::toCriterion)
                .toList();
    }
}
