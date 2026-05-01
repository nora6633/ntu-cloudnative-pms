package edu.ntu.pms.evaluation.mapper;

import org.mapstruct.Condition;
import org.mapstruct.Mapper;
import org.mapstruct.Mapping;
import org.mapstruct.MappingTarget;
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
    /* From Entity to DTO */

    // Top Level: use helper mapping methods that select live fields when not CLOSED
    @Mapping(source = ".", target = "employeeName", qualifiedByName = "mapEmployeeName")
    @Mapping(source = ".", target = "employeeJobTitle", qualifiedByName = "mapEmployeeJobTitle")
    @Mapping(source = ".", target = "employeeDepartmentName", qualifiedByName = "mapEmployeeDepartmentName")
    @Mapping(source = ".", target = "supervisorName", qualifiedByName = "mapSupervisorName")
    @Mapping(source = ".", target = "supervisorJobTitle", qualifiedByName = "mapSupervisorJobTitle")
    @Mapping(source = ".", target = "supervisorDepartmentName", qualifiedByName = "mapSupervisorDepartmentName")
    EvaluationDTO toDto(Evaluation entity);

    @Named("mapEmployeeName")
    default String mapEmployeeName(Evaluation e) {
        if (e == null) return null;
        if (e.getStatus() == EvaluationStatus.CLOSED) return e.getEmployeeName();
        return e.getEmployee() != null ? e.getEmployee().getUsername() : null;
    }

    @Named("mapEmployeeJobTitle")
    default String mapEmployeeJobTitle(Evaluation e) {
        if (e == null) return null;
        if (e.getStatus() == EvaluationStatus.CLOSED) return e.getEmployeeJobTitle();
        return (e.getEmployee() != null && e.getEmployee().getJob() != null) ? e.getEmployee().getJob().getTitle() : null;
    }

    @Named("mapEmployeeDepartmentName")
    default String mapEmployeeDepartmentName(Evaluation e) {
        if (e == null) return null;
        if (e.getStatus() == EvaluationStatus.CLOSED) return e.getEmployeeDepartmentName();
        return (e.getEmployee() != null && e.getEmployee().getDepartment() != null) ? e.getEmployee().getDepartment().getName() : null;
    }

    @Named("mapSupervisorName")
    default String mapSupervisorName(Evaluation e) {
        if (e == null) return null;
        if (e.getStatus() == EvaluationStatus.CLOSED) return e.getSupervisorName();
        return e.getSupervisor() != null ? e.getSupervisor().getUsername() : null;
    }

    @Named("mapSupervisorJobTitle")
    default String mapSupervisorJobTitle(Evaluation e) {
        if (e == null) return null;
        if (e.getStatus() == EvaluationStatus.CLOSED) return e.getSupervisorJobTitle();
        return (e.getSupervisor() != null && e.getSupervisor().getJob() != null) ? e.getSupervisor().getJob().getTitle() : null;
    }

    @Named("mapSupervisorDepartmentName")
    default String mapSupervisorDepartmentName(Evaluation e) {
        if (e == null) return null;
        if (e.getStatus() == EvaluationStatus.CLOSED) return e.getSupervisorDepartmentName();
        return (e.getSupervisor() != null && e.getSupervisor().getDepartment() != null) ? e.getSupervisor().getDepartment().getName() : null;
    }

    // Mid Level: MapStruct uses this automatically for the List<GoalDTO>
    GoalDTO toGoalDto(Goal entity);

    // Mid Level: MapStruct uses this for the List<EvaluationItemDTO>
    EvaluationItemDTO toItemDto(EvaluationItem entity);

    // Bottom Level: MapStruct uses this for the List<ProgressDTO> inside GoalDTO
    ProgressDTO toProgressDto(Progress entity);

    /* From DTO to Entity */

    // For new goal
    @Mapping(target = "evaluation", ignore = true) // evaluation will be set in the service layer
    Goal toGoal(GoalDTO dto);

    // For updating existing goal - only update fields that are present in the DTO
    @Mapping(target = "id", ignore = true) // ID should not be updated
    @Mapping(target = "evaluation", ignore = true) // evaluation should not be updated
    void updateGoalFromDto(GoalDTO dto, @MappingTarget Goal entity);


    // Update only feedback and rating of an existing EvaluationItem.
    @Mapping(target = "id", ignore = true) // ID should not be updated
    @Mapping(target = "evaluation", ignore = true) // evaluation should not be updated
    @Mapping(target = "name", ignore = true) // name should not be updated
    @Mapping(target = "description", ignore = true) // description should not be updated
    void updateItemFromDto(EvaluationItemDTO dto, @MappingTarget EvaluationItem entity);
}