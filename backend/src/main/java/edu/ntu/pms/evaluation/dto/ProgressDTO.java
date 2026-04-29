package edu.ntu.pms.evaluation.dto;

import java.time.LocalDateTime;

public record ProgressDTO(
    LocalDateTime timestamp,
    String description
) {}
