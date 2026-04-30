package edu.ntu.pms.evaluation.mapper;

import org.mapstruct.Condition;
import org.mapstruct.Mapper;
import org.mapstruct.Mapping;
import org.mapstruct.Named;

import edu.ntu.pms.evaluation.dto.EvaluationDTO;
import edu.ntu.pms.evaluation.dto.EvaluationItemDTO;
import edu.ntu.pms.evaluation.dto.GoalDTO;
import edu.ntu.pms.evaluation.dto.ProgressDTO;
import edu.ntu.pms.evaluation.entity.Evaluation;
import edu.ntu.pms.evaluation.entity.EvaluationItem;
import edu.ntu.pms.evaluation.entity.Goal;
import edu.ntu.pms.evaluation.entity.Progress;
import edu.ntu.pms.evaluation.enums.EvaluationStatus;

@Mapper(componentModel = "spring")
public interface EvaluationMapper {

    // Entity to DTO mappings

    // Top Level
    @Mapping(source = "employee.username", target = "employeeName", conditionQualifiedByName = "isNotClosed")
    @Mapping(source = "employee.job.title", target = "employeeJobTitle", conditionQualifiedByName = "isNotClosed")
    @Mapping(source = "employee.department.name", target = "employeeDepartmentName", conditionQualifiedByName = "isNotClosed")
    @Mapping(source = "supervisor.username", target = "supervisorName", conditionQualifiedByName = "isNotClosed")
    @Mapping(source = "supervisor.job.title", target = "supervisorJobTitle", conditionQualifiedByName = "isNotClosed")
    @Mapping(source = "supervisor.department.name", target = "supervisorDepartmentName", conditionQualifiedByName = "isNotClosed")
    EvaluationDTO toDto(Evaluation entity);

    @Condition
    @Named("isNotClosed")
    default boolean isNotClosed(Evaluation entity) {
        return entity.getStatus() != EvaluationStatus.CLOSED;
    }

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