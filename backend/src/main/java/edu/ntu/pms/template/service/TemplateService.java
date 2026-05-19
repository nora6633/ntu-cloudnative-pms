package edu.ntu.pms.template.service;

import java.util.List;

import org.springframework.stereotype.Service;

import edu.ntu.pms.evaluation.entity.EvaluationItem;
import edu.ntu.pms.evaluation.enums.EvaluationType;
import edu.ntu.pms.template.dto.CreateTemplateRequest;
import edu.ntu.pms.template.dto.UpdateTemplateRequest;
import edu.ntu.pms.template.entity.Template;
import edu.ntu.pms.user.entity.Job;

@Service
public interface TemplateService {

    List<Template> getAllTemplatesByJobId(Long jobId);

    Template createTemplate(CreateTemplateRequest request);

    Template updateTemplate(Long templateId, UpdateTemplateRequest request);

    /**
     * Create evaluation items for a given job based on a specified template and evaluation type.
     *
     * @param job The job for which to create evaluation items.
     * @param templateId The ID of the template to use for creating evaluation items.
     * @param type The type of evaluation (e.g., PROBATION, QUARTER, ANNUAL) which may influence the content of the evaluation items.
     * @return A list of created EvaluationItem objects based on the provided parameters.
     */
    List<EvaluationItem> createEvaluationItemsForJob(Job job, Long templateId, EvaluationType type);
}
