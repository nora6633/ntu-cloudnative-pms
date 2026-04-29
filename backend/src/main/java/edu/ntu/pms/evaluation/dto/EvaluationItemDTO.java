package edu.ntu.pms.evaluation.dto;

public record EvaluationItemDTO(
    Long id,
    String name,
    String description,
    String feedback,
    String rating
) {}