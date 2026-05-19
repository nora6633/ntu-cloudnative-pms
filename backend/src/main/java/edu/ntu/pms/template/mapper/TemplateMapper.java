package edu.ntu.pms.template.mapper;

import org.mapstruct.Mapper;
import org.mapstruct.Mapping;

import edu.ntu.pms.template.dto.CriterionDTO;
import edu.ntu.pms.template.dto.JobSummaryDTO;
import edu.ntu.pms.template.dto.JobTemplatesDTO;
import edu.ntu.pms.template.dto.TemplateDTO;
import edu.ntu.pms.template.entity.Criterion;
import edu.ntu.pms.template.entity.Template;
import edu.ntu.pms.user.entity.Job;

@Mapper(componentModel = "spring")
public interface TemplateMapper {

    JobSummaryDTO toJobSummaryDto(Job job);

    JobTemplatesDTO toJobTemplatesDto(Job job);

    CriterionDTO toCriterionDto(Criterion criterion);

    Criterion toCriterion(CriterionDTO criterionDto);

    @Mapping(source = "job.id", target = "jobId")
    TemplateDTO toTemplateDto(Template template);
}
