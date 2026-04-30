package edu.ntu.pms.template.service;

import java.util.List;
import java.util.Optional;
import java.util.stream.Collectors;

import org.springframework.stereotype.Service;

import edu.ntu.pms.evaluation.entity.EvaluationItem;
import edu.ntu.pms.evaluation.enums.EvaluationType;
import edu.ntu.pms.template.entity.Template;
import edu.ntu.pms.user.entity.Job;

@Service
public class TemplateServiceImpl implements TemplateService {
    
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
        // Validate that the job has the specified template associated with it
        Optional<Template> template = Optional.ofNullable(
            job.getTemplates().stream()
            .filter(t -> t.getId().equals(templateId))
            .findFirst()
        .orElseThrow(() -> new IllegalArgumentException("Template " + templateId + " is not associated with Job " + job.getId())));

        // Validate that the template's evaluation type matches the provided type
        if (template.get().getEvaluationType() != type) {
            throw new IllegalArgumentException("Template " + template.get().getId() + " is not of type " + type);
        }

        return createEvaluationItemsFromTemplate(template.get());
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
}
