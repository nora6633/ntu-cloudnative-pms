package edu.ntu.pms.evaluation.dto;

import java.time.LocalDate;
import java.util.List;

public record GoalDTO(
    Long id,
    String definition,
    String metric,
    String resource,
    String relevance,
    LocalDate deadline,
    List<String> criteria,
    List<ProgressDTO> progresses
) {}