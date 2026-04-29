package edu.ntu.pms.evaluation.dto;

import java.util.List;

public record EvaluationDTO(
    Long id,
    String cycle,
    String status,
    String type,
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
