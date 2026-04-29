package edu.ntu.pms.evaluation.mapper;

import org.mapstruct.Mapper;
import org.mapstruct.Mapping;

import edu.ntu.pms.evaluation.dto.EvaluationDTO;
import edu.ntu.pms.evaluation.dto.EvaluationItemDTO;
import edu.ntu.pms.evaluation.dto.GoalDTO;
import edu.ntu.pms.evaluation.dto.ProgressDTO;
import edu.ntu.pms.evaluation.entity.Evaluation;
import edu.ntu.pms.evaluation.entity.EvaluationItem;
import edu.ntu.pms.evaluation.entity.Goal;
import edu.ntu.pms.evaluation.entity.Progress;

@Mapper(componentModel = "spring")
public interface EvaluationMapper {

    // Entity to DTO mappings

    // Top Level
    EvaluationDTO toDto(Evaluation entity);

    // Mid Level: MapStruct uses this automatically for the List<GoalDTO>
    GoalDTO toGoalDto(Goal entity);

    // Mid Level: MapStruct uses this for the List<EvaluationItemDTO>
    EvaluationItemDTO toItemDto(EvaluationItem entity);

    // Bottom Level: MapStruct uses this for the List<ProgressDTO> inside GoalDTO
    ProgressDTO toProgressDto(Progress entity);

    // DTO to Entity mappings

    @Mapping(source = "evaluationId", target = "evaluation.id")
    Goal toGoal(GoalDTO dto, Long evaluationId);

    @Mapping(source = "evaluationId", target = "evaluation.id")
    EvaluationItem toEvaluationItem(EvaluationItemDTO dto, Long evaluationId);
}