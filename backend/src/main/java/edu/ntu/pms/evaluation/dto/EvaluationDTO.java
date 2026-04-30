package edu.ntu.pms.evaluation.dto;

import java.util.List;

import edu.ntu.pms.evaluation.enums.EvaluationStatus;
import edu.ntu.pms.evaluation.enums.EvaluationType;

public record EvaluationDTO(
    Long id,
    String cycle,
    EvaluationStatus status,
    EvaluationType type,
    String employeeName,
    String employeeJobTitle,
    String employeeDepartmentName,
    String supervisorName,
    String supervisorJobTitle,
    String supervisorDepartmentName,
    String hrName,
    String hrJobTitle,
    String hrDepartmentName,
    List<GoalDTO> goals,
    List<EvaluationItemDTO> evaluationItems
) {}
