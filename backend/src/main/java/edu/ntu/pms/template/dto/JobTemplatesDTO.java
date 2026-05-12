package edu.ntu.pms.template.dto;

import java.util.List;

import io.swagger.v3.oas.annotations.media.ArraySchema;
import io.swagger.v3.oas.annotations.media.Schema;

@Schema(description = "Job information together with its available evaluation templates")
public record JobTemplatesDTO(
        @Schema(description = "Job ID", example = "1")
        Long id,

        @Schema(description = "Job title", example = "Junior Software Engineer")
        String title,

        @ArraySchema(schema = @Schema(implementation = TemplateDTO.class),
                arraySchema = @Schema(description = "Templates available for this job"))
        List<TemplateDTO> templates
) {
}
