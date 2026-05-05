package edu.ntu.pms.evaluation.entity;

import java.time.LocalDateTime;

import org.hibernate.envers.Audited;

import jakarta.persistence.Embeddable;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Embeddable
@Audited
@NoArgsConstructor
@AllArgsConstructor
@Data
public class Progress {
    private LocalDateTime timestamp;
    private String description;
}